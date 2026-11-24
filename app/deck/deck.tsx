"use client";
import { useEffect, useState } from "react";
import { ArchitectureDiagram } from "@/components/architecture-diagram";

const Kicker = ({ n, t }: { n: number; t: string }) => (
  <p className="label">{String(n).padStart(2, "0")} — {t}</p>
);
const Big = ({ children }: { children: React.ReactNode }) => <h2 className="font-serif text-4xl md:text-5xl mt-3 leading-[1.05]">{children}</h2>;
const Card = ({ h, children, tone }: { h: string; children: React.ReactNode; tone?: string }) => (
  <div className="rounded-xl border border-line bg-card p-4"><p className={`font-serif text-xl ${tone ?? ""}`}>{h}</p><div className="mt-1 text-fg2">{children}</div></div>
);

const SLIDES = [
  <div key="1" className="glow grid flex-1 content-center gap-10 md:grid-cols-[1.2fr_1fr] print:grid-cols-[1.2fr_1fr]">
    <div>
      <Kicker n={1} t="The problem" />
      <Big>10,000 target accounts. <em className="text-fg3">Most are not ready to buy today.</em></Big>
      <p className="mt-5 text-xl text-fg2">Find the ones that are. Contact the right person with a real reason. Keep the rest in nurture.</p>
      <p className="mt-6 text-sm text-fg2">The demo uses 40 fictional accounts. Nothing is sent and Salesforce is not connected.</p>
    </div>
    <div className="grid content-center gap-3">
      <Card h="Score = fit × timing ÷ 100">Both must be good. Old signals fade.</Card>
      <Card h="Rules decide, AI writes">A rep can read why. AI must cite a source for each statement.</Card>
      <Card h="People approve">A person checks the meaning before anything is sent.</Card>
    </div>
  </div>,

  <div key="2" className="flex flex-1 flex-col">
    <Kicker n={2} t="Outbound · working demo" />
    <Big>Five questions, <em className="text-fg3">answered for every account.</em></Big>
    <div className="mt-6 grid gap-3 md:grid-cols-5 print:grid-cols-5">
      <Card h="Which?">Ad spend, channels, analytics team, size</Card>
      <Card h="Why now?">Our site, partner and public signals, each with its own fade</Card>
      <Card h="When?">4 hours for a pricing visit, up to 7 days for a new executive</Card>
      <Card h="Who?">The engaged buyer or champion first, then the committee</Card>
      <Card h="What to say?">AI email from public facts. A source per statement. A person checks it.</Card>
    </div>
    <div className="mt-6 rounded-lg border-2 border-hot/60 bg-card p-5 text-lg">
      <b>Demo:</b> a quiet account reads our report. Score 14 → 44, rank <b>#16 → #4</b>, Later → <b className="text-hot-fg">Hot</b>. Next action: Nurture → email in 24 hours.
    </div>
    <p className="mt-4 text-sm text-fg2">Limit: the check proves a source exists. It cannot prove that the source supports the sentence. Signal weights are my starting judgment.</p>
  </div>,

  <div key="3" className="flex flex-1 flex-col">
    <Kicker n={3} t="Inbound engine" />
    <Big>Get found. Spot the buyer. <em className="text-fg3">Route in minutes.</em></Big>
    <div className="mt-6 grid gap-3 md:grid-cols-5 print:grid-cols-5">
      <Card h="Discover">Original research, comparison pages, expert answers in communities. Track AI-answer citations. <i>Proposed</i></Card>
      <Card h="Capture">Visits, forms, webinars, readiness check, product use. <i>Simulated</i></Card>
      <Card h="Qualify">Competitors, students and personal email never go straight to a rep. <i>Works</i></Card>
      <Card h="Convert">Next content or meeting by role and channels. <i>Works as a preview</i></Card>
      <Card h="Route">Alert the owner in 5 min. Rep deadline 4h to 7d. <i>Rules work, alerts proposed</i></Card>
    </div>
    <div className="mt-6 grid gap-3 md:grid-cols-2 print:grid-cols-2">
      <Card h="Automate first" tone="text-good-fg">Capture, account match, filter, routing, Salesforce updates</Card>
      <Card h="Needs an owner" tone="text-warm-fg">Content: research. Marketing: search, webinars, web pages. Sales: approve emails, tag outcomes. RevOps: routing rules.</Card>
    </div>
    <p className="mt-4 text-sm text-fg2">One loop: inbound visits raise outbound priority. Outbound replies and meetings tell Marketing what to write next.</p>
  </div>,

  <div key="4" className="flex flex-1 flex-col">
    <Kicker n={4} t="How it works" />
    <div className="mt-3 overflow-x-auto"><div className="deck-diagram min-w-[860px]"><ArchitectureDiagram /></div></div>
    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3 print:grid-cols-3">
      <Card h="Build or buy">Buy data and visitor ID. Build scoring and the email check. Keep Salesforce as the record.</Card>
      <Card h="Scale to 10,000 (proposed)">Postgres, queue with event IDs, AI only on changed Hot or Warm accounts. Load-test first.</Card>
      <Card h="Operate (proposed)">Logs, cost cap, replay, opt-outs, access control. Monthly retune on meetings and deals.</Card>
    </div>
  </div>,

  <div key="5" className="flex flex-1 flex-col">
    <Kicker n={5} t="First 90 days · proposed" />
    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3 print:grid-cols-3">
      <Card h="Days 1–30: base">Clean and match the TAM. Scores in Salesforce. 3 signals live. Weekly Hot list. Inbound alerts. Freeze a holdout.<p className="mt-2 text-xs text-warm-fg">Needs: Salesforce admin, RevOps, legal</p></Card>
      <Card h="Days 31–60: pilot">Email drafts for 2 reps, approved by hand. Readiness check live. Replies and rejections tagged.<p className="mt-2 text-xs text-warm-fg">Needs: 2 reps, Content, model provider</p></Card>
      <Card h="Days 61–90: learn">Retune on results. Add partner signals. Personal pages for Hot accounts. Decide: expand, change or stop.<p className="mt-2 text-xs text-warm-fg">Needs: outcome data, Sales lead</p></Card>
    </div>
    <div className="mt-4 grid gap-3 text-sm md:grid-cols-[1fr_1.5fr] print:grid-cols-[1fr_1.5fr]">
      <Card h="Tools: about $1.2–3.1k a month">
        <p>Clay $495–1,330. Visitor ID $500–1,500 (estimate). AI under $100 (cap). Hosting about $200.</p>
        <p className="mt-2">Excludes people, Salesforce, Slack and sequencer. Enrich Hot and Warm only.</p>
      </Card>
      <div className="rounded-xl border border-line bg-card p-4">
        <p className="font-serif text-xl">Day-90 targets (assumptions)</p>
        <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2 print:grid-cols-2">
          {[
            ["Qualified meetings", "40"], ["Meeting rate vs holdout", "1.5×"],
            ["Inbound → meeting", "+25%"], ["Hot inbound alert", "< 5 min"],
            ["Opportunities", "20"], ["Hot worked on time", "80%"],
            ["Pipeline", "$1M"], ["Research per account", "20 → 5 min"],
            ["Drafts approved", "85%"], ["Tool cost per meeting", "$90–235"],
          ].map(([k, v]) => <p key={k} className="flex justify-between gap-2"><span className="text-fg2">{k}</span><b className="font-mono">{v}</b></p>)}
        </div>
        <p className="mt-2 text-xs text-fg2">Assumes $50k deals and 50% of meetings become opportunities. Replace with Lifesight baselines in week 1. A small holdout is directional only.</p>
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
      <div className="no-print flex items-center gap-3 text-xs text-fg2">
        <div className="flex gap-1.5">
          {SLIDES.map((_, j) => (
            <button key={j} onClick={() => setI(j)} aria-label={`Slide ${j + 1}`} aria-current={i === j} className="h-2 w-6 rounded-full bg-component aria-[current=true]:bg-hot" />
          ))}
        </div>
        <span>Use ← →</span>
        <button onClick={() => window.print()} className="ml-auto rounded border px-2 py-1 hover:bg-component">Save as PDF</button>
      </div>
      {SLIDES.map((s, j) => (
        <section key={j} aria-label={`Slide ${j + 1}`} className={`deck-slide ${j === i ? "flex" : "hidden"} min-h-[calc(100vh-9rem)] flex-col rounded-lg border bg-container p-5 md:p-10`}>
          {s}
        </section>
      ))}
    </div>
  );
}
