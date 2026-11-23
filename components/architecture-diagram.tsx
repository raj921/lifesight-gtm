// Inline SVG so it themes with CSS variables (light + dark) and prints crisply in the deck.
type Box = [string, string];
const COLS: { title: string; kind: "data" | "rule" | "ai" | "act"; boxes: Box[] }[] = [
  { title: "1 · Signals", kind: "data", boxes: [
    ["1P website visitor ID", "page, company, person"], ["1P forms, webinars, assessment", "marketing automation"],
    ["2P partners, review sites", "agency referrals, G2-style"], ["3P jobs, exec moves, funding", "ad libraries, news"],
    ["CRM + call history", "Salesforce, Gong"],
  ] },
  { title: "2 · Ingest + resolve", kind: "data", boxes: [
    ["Webhooks + nightly batch", "live for our site, daily for the rest"], ["Queue", "retries, no duplicates"],
    ["Identity resolution", "domain→Account, person→Contact"], ["Signal store (Postgres)", "every signal with its source"],
  ] },
  { title: "3 · Decide (rules)", kind: "rule", boxes: [
    ["Fit score", "spend, channels, team, size"], ["Intent score", "fades as signals get older"],
    ["Tier, SLA, owner", "who acts, how fast"], ["Inbound qualification", "competitor, student, TAM"],
  ] },
  { title: "4 · Write (AI)", kind: "ai", boxes: [
    ["Research agent", "sources → cited facts"], ["Committee agent", "titles → roles, gaps"],
    ["Writer agent", "persona angle, cited draft"], ["Fact-check guard", "citations, numbers, length"],
  ] },
  { title: "5 · Act", kind: "act", boxes: [
    ["Salesforce (record)", "fields, Leads, Tasks, Opps"], ["Slack alert to owner", "with why-now + SLA"],
    ["Sequencer", "only after human approval"], ["Web + ad personalization", "Tier-1 visitors, committee"],
  ] },
];
const SAFE = ["Human approves every send", "Only cited claims ship", "Least personal data + do-not-contact list", "Cost caps + backup model", "Every AI run logged", "Failed jobs can be replayed"];

const W = 1200, colW = 200, gap = (W - 40 - colW * 5) / 4, bh = 50, top = 66;
const stroke = { data: "var(--muted-foreground)", rule: "var(--fit)", ai: "var(--heat)", act: "var(--foreground)" };

export function ArchitectureDiagram() {
  const x = (i: number) => 20 + i * (colW + gap);
  return (
    <svg viewBox={`0 0 ${W} 560`} role="img" aria-label="Architecture: signals flow through ingest and identity resolution into deterministic scoring, then bounded AI agents, then Salesforce and actions, with outcomes looping back to scoring weights." className="w-full h-auto font-sans">
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--muted-foreground)" />
        </marker>
      </defs>
      {COLS.map((c, i) => (
        <g key={c.title}>
          <text x={x(i)} y={28} fill="var(--foreground)" fontSize="15" fontFamily="var(--font-fraunces)">{c.title}</text>
          {c.boxes.map(([t, s], j) => (
            <g key={t} transform={`translate(${x(i)} ${top + j * (bh + 10)})`}>
              <rect width={colW} height={bh} rx="5" fill="var(--card)" stroke={stroke[c.kind]} strokeWidth={c.kind === "data" ? 1 : 1.6} />
              <text x="10" y="21" fontSize="12.5" fontWeight="600" fill="var(--foreground)">{t}</text>
              <text x="10" y="38" fontSize="11" fill="var(--muted-foreground)">{s}</text>
            </g>
          ))}
          {i < 4 && <line x1={x(i) + colW + 4} x2={x(i + 1) - 6} y1={top + 115} y2={top + 115} stroke="var(--muted-foreground)" strokeWidth="1.6" markerEnd="url(#ah)" />}
        </g>
      ))}
      {/* learning loop: outcomes back into rule weights */}
      <path d={`M ${x(4) + colW / 2} ${top + 4 * 60 - 8} V 372 H ${x(2) + colW / 2} V ${top + 4 * 60 - 8}`} fill="none" stroke="var(--warm)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#ah)" />
      <rect x={x(2) + 30} y={352} width={x(4) - x(2) + colW - 60} height={40} rx="5" fill="var(--background)" stroke="var(--warm)" />
      <text x={x(2) + 46} y={377} fontSize="12" fill="var(--foreground)">
        <tspan fontWeight="600">Learning loop · </tspan>meetings, deals won and lost, rejected emails → retune scores every month
      </text>
      {/* inbound re-score path */}
      <path d={`M ${x(0) + colW / 2} ${top} V 41 H ${x(2) + colW / 2} V ${top}`} fill="none" stroke="var(--heat)" strokeWidth="1.2" strokeDasharray="2 3" markerEnd="url(#ah)" opacity=".8" />
      <text x={x(1) + 6} y={55} fontSize="10.5" fill="var(--heat)">site visit → rescored in seconds</text>
      {/* safeguards */}
      <text x="20" y="438" fontSize="15" fill="var(--foreground)" fontFamily="var(--font-fraunces)">Safeguards on every path</text>
      {SAFE.map((s, i) => (
        <g key={s} transform={`translate(${20 + (i % 3) * 393} ${452 + Math.floor(i / 3) * 44})`}>
          <rect width="380" height="34" rx="17" fill="var(--secondary)" />
          <text x="18" y="22" fontSize="12.5" fill="var(--foreground)">✓ {s}</text>
        </g>
      ))}
      <g fontSize="11" fill="var(--muted-foreground)">
        <rect x={W - 330} y={424} width="10" height="10" rx="2" fill="none" stroke="var(--fit)" strokeWidth="1.6" /><text x={W - 314} y={433}>rules decide</text>
        <rect x={W - 230} y={424} width="10" height="10" rx="2" fill="none" stroke="var(--heat)" strokeWidth="1.6" /><text x={W - 214} y={433}>AI writes</text>
        <rect x={W - 140} y={424} width="10" height="10" rx="2" fill="none" stroke="var(--warm)" strokeWidth="1.6" /><text x={W - 124} y={433}>learning</text>
      </g>
    </svg>
  );
}
