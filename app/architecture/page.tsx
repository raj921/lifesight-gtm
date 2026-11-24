import { ArchitectureDiagram } from "@/components/architecture-diagram";

export const metadata = { title: "How it works · Signal Desk" };

const WORKS = ["Fit, timing and score", "Hot / Warm / Later, owner and deadline", "Lead filter and account match by email domain", "Roles from job titles", "A visit changes rank and next action", "AI email, source check, retry, template fallback", "Approve or skip"];
const SIMULATED = ["40 fictional accounts and their people", "All signals and website visits", "Salesforce writes (preview only)", "Visitor content offers (preview only)"];
const PROPOSED = ["Live data feeds and enrichment", "Salesforce API, Slack and sequencer", "Research and committee agents", "Postgres, queue, cache and logs", "Holdout test and score retuning", "Any real sending"];

const WHO: [string, string][] = [
  ["Score, tier, owner, deadline", "Rules"],
  ["Block competitors and students", "Rules"],
  ["Read news and job posts", "AI (proposed)"],
  ["Write the email", "AI, checked"],
  ["Decide to send", "A person"],
];

const BUY: [string, string][] = [
  ["Company and contact data", "Buy: commodity"],
  ["Website visitor ID", "Buy: test 2 vendors"],
  ["Scoring and routing", "Build: our GTM logic"],
  ["Email writer and check", "Build: swap models easily"],
  ["CRM", "Keep Salesforce"],
];

const NOTES: [string, string[]][] = [
  ["Scale to 10,000", ["Score in Postgres nightly, and on each new event.", "Call AI only for Hot or Warm accounts that changed.", "Load-test before launch. The prototype has 40."]],
  ["Reliability", ["Queue with retries and a unique ID per event.", "Template when AI fails. This part works today.", "Dead-letter queue and replay for failed jobs."]],
  ["Security and privacy", ["Company-level visitor ID by default.", "Honour opt-outs. Legal review before launch.", "Choose a model provider with agreed data terms. DeepSeek here sees synthetic data only."]],
  ["Observe and learn", ["Log input, output, cost and check result per run.", "Tag rejected emails with the bad fact.", "Hold out 10% of Hot accounts, retune monthly on meetings and deals."]],
];

export default function Architecture() {
  return (
    <div className="space-y-8">
      <header className="glow">
        <p className="label">How it works</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">Rules decide. AI writes. <em className="text-fg3">People approve.</em></h1>
      </header>

      <section className="gridlines rounded-xl border border-line bg-card p-4 md:p-6">
        <div className="overflow-x-auto"><div className="min-w-[860px]"><ArchitectureDiagram /></div></div>
      </section>

      <section className="grid gap-6 md:grid-cols-3" aria-label="What works, what is simulated, what is proposed">
        <List title="Works now" tone="text-good-fg" items={WORKS} />
        <List title="Simulated" tone="text-warm-fg" items={SIMULATED} />
        <List title="Proposed, not built" tone="text-fg2" items={PROPOSED} />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Pairs title="Who decides" rows={WHO} />
        <Pairs title="Build or buy" rows={BUY} />
      </div>

      <p className="label">Production plan (proposed)</p>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {NOTES.map(([title, items]) => (
          <div key={title} className="rounded-xl border border-line bg-card p-5">
            <h2 className="font-serif text-xl">{title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-fg2">{items.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        ))}
      </section>

    </div>
  );
}

function List({ title, tone, items }: { title: string; tone: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <h2 className={`font-serif text-xl ${tone}`}>{title}</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-fg2">{items.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}

function Pairs({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <h2 className="font-serif text-xl">{title}</h2>
      <ul className="mt-3 divide-y text-sm">
        {rows.map(([a, b]) => (
          <li key={a} className="flex justify-between gap-4 py-2"><span>{a}</span><span className="font-medium text-hot-fg">{b}</span></li>
        ))}
      </ul>
    </section>
  );
}
