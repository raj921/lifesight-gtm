"use client";
import { useEffect, useState } from "react";
import { ArchitectureDiagram } from "@/components/architecture-diagram";

const Kicker = ({ n, t }: { n: number; t: string }) => (
  <p className="font-mono text-xs uppercase tracking-[.2em] text-muted-foreground">{n} / 5 · {t}</p>
);
const Big = ({ children }: { children: React.ReactNode }) => <h2 className="font-display text-4xl md:text-5xl mt-3 leading-[1.05]">{children}</h2>;
const Card = ({ h, children, tone }: { h: string; children: React.ReactNode; tone?: string }) => (
  <div className="rounded-lg border bg-card p-4"><p className={`font-display text-xl ${tone ?? ""}`}>{h}</p><div className="mt-1 text-muted-foreground">{children}</div></div>
);

const SLIDES = [
  <div key="1" className="grid h-full content-center gap-10 md:grid-cols-[1.2fr_1fr]">
    <div>
      <Kicker n={1} t="The problem" />
      <Big>Out of 10,000 accounts, only a few hundred are buying right now.</Big>
      <p className="mt-5 text-xl text-muted-foreground">Find them first. Reach the right person with a real reason. Leave the rest to cheap nurture.</p>
    </div>
    <div className="grid content-center gap-3">
      <Card h="Fit × timing">Good fit gets you on the list. Fresh signals get you a call.</Card>
      <Card h="Rules decide, AI writes">Scores are code you can read. AI only writes words, and every claim needs a source.</Card>
      <Card h="People approve">Nothing goes out without a rep saying yes.</Card>
    </div>
  </div>,

  <div key="2" className="flex h-full flex-col">
    <Kicker n={2} t="Outbound · demo" />
    <Big>Five questions, answered for every account.</Big>
    <div className="mt-6 grid gap-3 md:grid-cols-5">
      <Card h="Which?">Ad spend, channels, team size</Card>
      <Card h="Why now?">New CMO, MMM job post, pricing visit, report read</Card>
      <Card h="When?">Pricing visit: 4 hours. New exec: 7 days.</Card>
      <Card h="Who?">The person who engaged, then the buyer</Card>
      <Card h="What to say?">AI email. Every claim points to a signal.</Card>
    </div>
    <div className="mt-auto rounded-lg border-2 border-heat/70 bg-card p-5 text-lg">
      <b>Demo:</b> a quiet account reads our report → <b>#16 to #4</b>, Later to <b className="text-heat">Hot</b>, and the rep gets an email draft.
    </div>
  </div>,

  <div key="3" className="flex h-full flex-col">
    <Kicker n={3} t="Inbound" />
    <Big>Get found. Spot the buyer. Route in minutes.</Big>
    <div className="mt-6 grid gap-3 md:grid-cols-5">
      <Card h="Found">Original research, comparison pages, answers that ChatGPT and Perplexity quote</Card>
      <Card h="Spotted">Site visits, forms, webinars, the readiness check</Card>
      <Card h="Filtered">Competitors, students and Gmail never reach a rep</Card>
      <Card h="Converted">The right next piece for their role, or a booking link if they&apos;re hot</Card>
      <Card h="Routed">Hot → the AE in Slack within 5 minutes, logged in Salesforce</Card>
    </div>
    <div className="mt-auto grid gap-3 md:grid-cols-2">
      <Card h="Automate first" tone="text-fit">Capture, matching, filtering, routing, CRM updates</Card>
      <Card h="Needs an owner" tone="text-warm">Research and content (Content), search and webinars (Marketing), approving emails (Sales)</Card>
    </div>
  </div>,

  <div key="4" className="flex h-full flex-col">
    <Kicker n={4} t="How it works" />
    <div className="mt-3 flex-1 overflow-x-auto"><div className="min-w-[860px]"><ArchitectureDiagram /></div></div>
    <div className="grid gap-3 md:grid-cols-3">
      <Card h="Build vs buy">Buy the data. Build the scoring and the email writer. Keep Salesforce.</Card>
      <Card h="10k accounts">Scoring is SQL. AI only runs when something changes. Under $100 a month in AI.</Card>
      <Card h="Safe">Sources on every claim, opt-outs honoured, a person approves every send.</Card>
    </div>
  </div>,

  <div key="5" className="flex h-full flex-col">
    <Kicker n={5} t="First 90 days" />
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <Card h="Days 1–30">Scores in Salesforce. 3 signals live. Hot list to AEs weekly. Inbound routed in 5 min.<p className="mt-2 text-xs text-warm">Needs: Salesforce admin, RevOps</p></Card>
      <Card h="Days 31–60">AI research and email drafts, approved by reps. Readiness check and benchmark report live.<p className="mt-2 text-xs text-warm">Needs: Content team, AE time</p></Card>
      <Card h="Days 61–90">Retune scoring on real results. Personalized site for hot accounts. Readout to the CRO.<p className="mt-2 text-xs text-warm">Needs: 60 days of results</p></Card>
    </div>
    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.4fr]">
      <Card h="Cost: $1.5–3.5k a month">Clay $495–1,330 · site visitor tool ~$500–1,500 · AI under $100 · hosting ~$200</Card>
      <div className="rounded-lg border bg-card p-4">
        <p className="font-display text-xl">Day-90 targets</p>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {[
            ["Hot inbound answered", "< 5 min"], ["Hot accounts worked on time", "80%"],
            ["Meetings vs holdout", "1.5×"], ["Inbound → meeting", "+25%"],
            ["Qualified meetings", "40"], ["Pipeline", "~$1M"],
          ].map(([k, v]) => <p key={k} className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><b className="font-mono">{v}</b></p>)}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Assumes $50k deals and half of meetings becoming opportunities.</p>
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
      <div className="no-print flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex gap-1.5">
          {SLIDES.map((_, j) => (
            <button key={j} onClick={() => setI(j)} aria-label={`Slide ${j + 1}`} aria-current={i === j} className="h-2 w-6 rounded-full bg-secondary aria-[current=true]:bg-heat" />
          ))}
        </div>
        <span>Use ← →</span>
        <button onClick={() => window.print()} className="ml-auto rounded border px-2 py-1 hover:bg-secondary">Save as PDF</button>
      </div>
      {SLIDES.map((s, j) => (
        <section key={j} aria-label={`Slide ${j + 1}`} className={`${j === i ? "block" : "hidden"} print:block print:break-after-page min-h-[calc(100vh-9rem)] rounded-lg border bg-background p-8 md:p-12 print:border-0`}>
          {s}
        </section>
      ))}
    </div>
  );
}
