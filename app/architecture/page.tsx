import { ArchitectureDiagram } from "@/components/architecture-diagram";

export const metadata = { title: "How it works · Signal Desk" };

const WHO: [string, string][] = [
  ["Score, tier, owner, deadline", "Rules"],
  ["Block competitors, students, spam", "Rules"],
  ["Turn news and job posts into facts", "AI"],
  ["Write the email", "AI, checked"],
  ["Send anything", "A person"],
];

const BUY: [string, string][] = [
  ["Company and contact data", "Buy (Clay)"],
  ["Who's on our website", "Buy"],
  ["Scoring and routing", "Build"],
  ["Email writer and fact check", "Build"],
  ["CRM", "Keep Salesforce"],
];

const NOTES: [string, string[]][] = [
  ["10,000 accounts", ["Scoring is plain SQL. All 10k rescore in seconds.", "AI runs only when something changes, about 1 in 10 accounts a week.", "Data lookups are cached, so we never pay twice."]],
  ["When things break", ["AI down or wrong twice → a safe template.", "Every event has an id, so retries never double-write.", "Failed jobs wait in a queue and can be replayed."]],
  ["Privacy", ["B2B contacts have CCPA rights. Honour opt-outs and the browser's privacy signal.", "Identify the company by default, not the person.", "Production uses an AI provider with US data storage. DeepSeek stores data in China."]],
  ["Getting smarter", ["Every agent run is logged: input, output, cost.", "Rejected emails are tagged with the bad fact, so we fix the source.", "10% of hot accounts are held back to prove the system works."]],
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

      <div className="grid gap-6 md:grid-cols-2">
        <Pairs title="Who decides" rows={WHO} />
        <Pairs title="Build or buy" rows={BUY} />
      </div>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {NOTES.map(([title, items]) => (
          <div key={title} className="rounded-xl border border-line bg-card p-5">
            <h2 className="font-serif text-xl">{title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-fg2">{items.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        ))}
      </section>

      <p className="text-center text-sm text-fg2">Working in the demo: scoring, routing, email writing and the fact check. Not connected: real data feeds, Salesforce, sending.</p>
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
