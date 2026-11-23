"use client";
import { useEffect, useState } from "react";
import { ArchitectureDiagram } from "@/components/architecture-diagram";

const Kicker = ({ n, t }: { n: number; t: string }) => (
  <p className="font-mono text-[11px] uppercase tracking-[.2em] text-muted-foreground">{String(n).padStart(2, "0")} / 05 · {t}</p>
);

const SLIDES = [
  <div key="1" className="grid h-full gap-8 md:grid-cols-[1.1fr_1fr]">
    <div className="flex flex-col">
      <Kicker n={1} t="The problem" />
      <h2 className="font-display text-4xl md:text-5xl mt-3 leading-[1.05]">Find the few in-market accounts <em className="text-heat">before</em> a competitor does.</h2>
      <p className="mt-5 text-lg text-muted-foreground">The 95:5 rule from the LinkedIn B2B Institute: about 95% of B2B buyers are not in market at any given moment. Of 10,000 target accounts, maybe a few hundred are in a buying window this quarter.</p>
      <p className="mt-4 text-lg">The engine&apos;s job is to find those accounts first, reach the right people with proof, and keep everyone else in cheap, automated nurture.</p>
    </div>
    <div className="flex flex-col justify-center gap-3">
      {[
        ["Fit × timing × proof", "Fit gates everything. Intent decays. Every message cites a stored signal."],
        ["Rules decide, AI explains", "Scores and routing are versioned code. Models only turn evidence into words."],
        ["Humans approve", "Every send is approved by a rep until approval and spam rates earn autonomy."],
        ["One brain for inbound + outbound", "One signal store, one score, one Salesforce record. A report download re-ranks an account in seconds."],
      ].map(([h, p]) => (
        <div key={h} className="rounded border bg-card p-4"><p className="font-display text-xl">{h}</p><p className="text-sm text-muted-foreground mt-1">{p}</p></div>
      ))}
    </div>
  </div>,

  <div key="2" className="flex h-full flex-col">
    <Kicker n={2} t="Signal-led outbound · live demo" />
    <h2 className="font-display text-4xl mt-3">Five questions, five answers a rep can check.</h2>
    <div className="mt-5 grid gap-2 text-sm">
      {[
        ["Which accounts?", "Fit score 0–100: ad spend, channel mix, analytics team, size. Hot intent at a poor-fit company stays Tier 3."],
        ["Why now?", "10 signal types across 1P (site, report, webinar, assessment), 2P (partners, review sites) and 3P (MMM hiring, new CMO, new channels, funding), each with a half-life."],
        ["When?", "SLA comes from the freshest strong signal: pricing visit 4 hours, report 24 hours, hiring 3 days, new exec 7 days."],
        ["Whom?", "Titles map to roles: economic buyer, champion, practitioner, finance. The engaged person goes first, then multi-thread to the buyer."],
        ["What to say?", "DeepSeek writes from stored signals plus 3 approved product facts. The guard rejects uncited claims or unsupported numbers, retries once, then falls back to a template."],
      ].map(([q, a]) => (
        <div key={q} className="grid grid-cols-[10rem_1fr] gap-4 border-b py-2.5"><b className="font-display text-lg font-normal">{q}</b><span className="text-muted-foreground">{a}</span></div>
      ))}
    </div>
    <div className="mt-auto rounded border-2 border-heat/70 bg-card p-4 font-mono text-sm">
      Demo: dormant Halcyon Beauty. Their VP Analytics downloads the benchmark report → rank <b>#16 → #4</b>, <b>Tier 3 → Tier 1</b>, “nurture” → <b>“AE: email within 24 hours”</b>, plus a cited draft to her.
    </div>
  </div>,

  <div key="3" className="flex h-full flex-col">
    <Kicker n={3} t="AI-powered inbound engine" />
    <h2 className="font-display text-4xl mt-3">Get cited, catch intent, qualify by rules, route in minutes.</h2>
    <div className="mt-5 grid gap-3 md:grid-cols-5 text-sm">
      {[
        ["Discover", "Answer engines + search: an annual benchmark with original data, vs-competitor and “how to measure CTV / retail media” pages with schema. Track monthly citation share in ChatGPT, Perplexity and AI Overviews.", "Content + Marketing"],
        ["Capture", "Visitor ID, forms, webinars, assessment completions and product sign-ups all land as typed signals in the same store as outbound.", "Automate"],
        ["Qualify", "Rules first: competitor, student, personal email, not in TAM → enrich. Then fit × intent. Junk never reaches a rep.", "Automate"],
        ["Convert", "Self-serve MMM readiness assessment (Gartner: 67% of B2B buyers prefer a rep-free experience), industry proof for Tier-1 visitors, meeting booking only for qualified visitors.", "Marketing owns content"],
        ["Route", "Tier 1 → owning AE in Slack within 5 minutes + Salesforce Task. Tier 2 → SDR. Else nurture. Every route is logged in the CRM.", "RevOps owns rules"],
      ].map(([h, p, o]) => (
        <div key={h} className="flex flex-col rounded border bg-card p-4">
          <p className="font-display text-xl">{h}</p>
          <p className="mt-2 text-muted-foreground flex-1">{p}</p>
          <p className={`mt-3 font-mono text-[11px] ${o === "Automate" ? "text-fit" : "text-warm"}`}>{o === "Automate" ? "● automate first" : `○ ${o}`}</p>
        </div>
      ))}
    </div>
    <p className="mt-auto text-sm text-muted-foreground"><b className="text-foreground">Automate first:</b> capture, matching, qualification, routing, CRM hygiene. <b className="text-foreground">Needs human owners:</b> research content and point of view (Content), AEO and webinars (Marketing), message approval and outcome tags (Sales).</p>
  </div>,

  <div key="4" className="flex h-full flex-col">
    <Kicker n={4} t="Architecture · build vs buy · 10k scale" />
    <div className="mt-2 flex-1"><div className="overflow-x-auto"><div className="min-w-[860px]"><ArchitectureDiagram /></div></div></div>
    <div className="grid gap-4 md:grid-cols-3 text-sm">
      <p><b>Buy</b> data: Clay enrichment waterfall, visitor ID, existing review-site intent. <b>Build</b> the opinion: scoring, routing and agents in versioned code. <b>Keep</b> Salesforce as the record.</p>
      <p><b>Scale:</b> scoring is SQL, so 10k accounts re-score in seconds. LLMs run only on change (~5–15% of accounts a week). Queue with idempotency + replay. Template fallback means no rep ever waits on a model.</p>
      <p><b>Trust + privacy:</b> cited claims only, suppression lists before drafting, honour Global Privacy Control and opt-outs (CPRA has covered B2B contacts since 2023), company-level visitor ID by default, CAN-SPAM compliant sends, an LLM with no-training terms and US data residency in production, and a 10% holdout to measure the engine&apos;s own lift.</p>
    </div>
  </div>,

  <div key="5" className="flex h-full flex-col">
    <Kicker n={5} t="30 / 60 / 90 · cost · KPIs" />
    <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
      {[
        ["Days 1–30 · foundation", "Salesforce fields (Fit, Intent, Tier, Why-now, Next action). TAM dedupe + domain matching. 3 signals live: visitor ID, MMM hiring, exec change. Nightly scoring, weekly Tier-1 list, Slack alerts, inbound routing with a 5-minute SLA. Holdout set frozen.", "Needs: SFDC admin, RevOps, vendor contracts"],
        ["Days 31–60 · AI in the loop", "Research + committee agents. Cited drafts in the sequencer with rep approval. Readiness assessment + benchmark report gate. Reply classification. Rejections tagged by claim id.", "Needs: Content for the report, AE time to review"],
        ["Days 61–90 · learn + scale", "Refit weights and half-lives on meetings and opportunities. Tier-1 web personalization. AEO tracking. Partner (2P) signals. Cost and quality dashboards. Readout to the CRO.", "Needs: 60 days of outcome data"],
      ].map(([h, p, d]) => (
        <div key={h} className="rounded border bg-card p-4"><p className="font-display text-lg">{h}</p><p className="mt-2 text-muted-foreground">{p}</p><p className="mt-2 font-mono text-[11px] text-warm">{d}</p></div>
      ))}
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
      <div className="rounded border bg-card p-4">
        <p className="font-display text-lg">Run cost ≈ $1.5–3.5k / month</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          <li>Clay Growth, $495–1,330 (list price, Nov 2026)</li>
          <li>Visitor ID tool, ~$500–1,500 (estimate, bake-off first)</li>
          <li>LLM: under $100 at DeepSeek Flash list prices (~$0.001 per draft)</li>
          <li>Hosting, database, queue: ~$100–300</li>
        </ul>
        <p className="mt-2 font-mono text-[11px]">Well under the loaded cost of one SDR, and it covers all 10k accounts daily.</p>
      </div>
      <div className="rounded border bg-card p-4">
        <p className="font-display text-lg">Day-90 targets, measured against the holdout</p>
        <table className="mt-2 w-full text-[13px]">
          <tbody className="divide-y">
            {[
              ["Speed-to-lead, Tier-1 inbound", "median under 5 min"],
              ["Tier-1 accounts worked within SLA", "≥ 80%"],
              ["Draft approval rate (no edits)", "≥ 70% day 60, ≥ 85% day 90"],
              ["Qualified meetings, Tier-1 vs holdout", "≥ 1.5× meeting rate"],
              ["Inbound form → meeting conversion", "+25% vs day-30 baseline"],
              ["Engine-sourced qualified meetings", "40 by day 90"],
              ["Pipeline created from those meetings", "~$1M (20 opps × $50k)"],
              ["Rep research time per account", "~20 min → under 2 min"],
            ].map(([k, v]) => <tr key={k}><td className="py-1 pr-2 text-muted-foreground">{k}</td><td className="py-1 text-right font-mono text-xs">{v}</td></tr>)}
          </tbody>
        </table>
        <p className="mt-2 font-mono text-[11px]">Assumptions: ~$50k ACV, 50% meeting → opportunity. Swap in Lifesight&apos;s real numbers in week 1; baselines are set in days 1–30.</p>
      </div>
    </div>
  </div>,
];

export function Deck() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, button")) return;
      if (["ArrowRight", "PageDown", "ArrowLeft", "PageUp", " "].includes(e.key)) e.preventDefault(); // stop Space/arrows also scrolling the page
      if (["ArrowRight", "PageDown", " "].includes(e.key)) setI((x) => Math.min(x + 1, SLIDES.length - 1));
      if (["ArrowLeft", "PageUp"].includes(e.key)) setI((x) => Math.max(x - 1, 0));
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  return (
    <div className="space-y-4">
      <div className="no-print flex items-center gap-3 font-mono text-xs text-muted-foreground">
        <span>← → to move · 5 slides</span>
        <div className="flex gap-1.5">
          {SLIDES.map((_, j) => (
            <button key={j} onClick={() => setI(j)} aria-label={`Slide ${j + 1}`} aria-current={i === j} className="h-2 w-6 rounded-full bg-secondary aria-[current=true]:bg-heat" />
          ))}
        </div>
        <button onClick={() => window.print()} className="ml-auto rounded border px-2 py-1 hover:bg-secondary">Save as PDF</button>
      </div>
      {SLIDES.map((s, j) => (
        <section key={j} aria-label={`Slide ${j + 1}`} className={`${j === i ? "block" : "hidden"} print:block print:break-after-page min-h-[calc(100vh-9rem)] rounded-md border bg-background p-8 md:p-12 print:border-0`}>
          {s}
        </section>
      ))}
    </div>
  );
}
