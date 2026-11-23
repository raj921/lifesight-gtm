import { ArchitectureDiagram } from "@/components/architecture-diagram";

export const metadata = { title: "Architecture · Signal Desk" };

const DECISIONS: [string, string, string][] = [
  ["Fit, intent, priority, tier", "Rules", "Must be explainable to a rep and auditable by RevOps. Same input, same output."],
  ["Routing, SLA, owner", "Rules", "Tied to territories and comp in Salesforce. Never a model's guess."],
  ["Inbound junk filter (competitor, student, freemail)", "Rules", "Cheap, exact, and the cost of a wrong call is high."],
  ["Summarizing sources into facts", "AI", "Unstructured text (jobs, news, calls). Output is a cited fact, not a decision."],
  ["Mapping titles to buying roles", "Rules → AI", "Regex covers most titles; AI handles the odd ones, flagged for review."],
  ["Writing the message", "AI + guard", "Only cited claims, no unsupported numbers; retries once, else template."],
  ["Sending, discounting, deleting", "Human", "Approval on every send until approval rate and spam rate earn autonomy."],
];

const BUY: [string, string, string][] = [
  ["Firmographics, contacts, enrichment", "Buy", "Clay waterfall over several providers. Building a data vendor is not our edge."],
  ["Website visitor ID", "Buy", "Commodity identity graphs; pick on US person-level match rate in a 2-week bake-off."],
  ["Review-site + 3P intent", "Buy", "Only where already licensed; otherwise prove 1P + job signals first."],
  ["Scoring, routing, tiering logic", "Build", "This is Lifesight's GTM opinion. It must live in versioned code, not a vendor's black box."],
  ["Agents + fact-check guard", "Build", "~300 lines; model-agnostic so DeepSeek, Claude or GPT can swap per cost and quality."],
  ["CRM, sequencer, Slack", "Keep", "Salesforce stays the system of record; we write fields, Tasks and Leads through its API."],
];

export default function Architecture() {
  return (
    <div className="space-y-10">
      <header className="rise max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[.2em] text-muted-foreground">Technical overview</p>
        <h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">Rules decide. AI explains. Humans approve.</h1>
        <p className="mt-3 text-muted-foreground">Every number a rep acts on comes from deterministic, versioned rules. Language models only turn evidence into words, and every claim they make must point back to a stored signal.</p>
      </header>

      <section className="rise rounded-md border bg-card p-4 md:p-6"><div className="overflow-x-auto"><div className="min-w-[860px]"><ArchitectureDiagram /></div></div></section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Table title="Who decides what" head={["Decision", "Owner", "Why"]} rows={DECISIONS} />
        <Table title="Build vs buy" head={["Capability", "Call", "Why"]} rows={BUY} />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Scaling to 10,000 accounts">
          <li>Scoring is SQL over a signals table: 10k accounts re-score in seconds nightly, and per-account on each inbound event.</li>
          <li>LLM work runs only on change: a new live signal, a tier move, or a rep asking for a draft. Roughly 5–15% of accounts a week, not 10k.</li>
          <li>Enrichment is cached with a TTL (contacts 90 days, firmographics 180) so we never pay twice for the same row.</li>
          <li>Queue with idempotency keys: a webhook retried 3 times creates one signal, one Task.</li>
        </Card>
        <Card title="Reliability, security, cost">
          <li>Model call fails or the fact-check fails twice → deterministic template. The rep never waits on an LLM.</li>
          <li>Secrets in the platform vault; the model sees ids and evidence text, never full CRM records or personal emails.</li>
          <li>Suppression lists (customers, open opps, opt-outs, competitors) are checked before any outreach is drafted.</li>
          <li>Cost: DeepSeek Flash list price is $0.30 per 1M input and $1.20 per 1M output tokens at peak, about $0.001 per draft. Hard monthly cap with alerts.</li>
        </Card>
        <Card title="Observability + learning">
          <li>Every agent run is traced: input evidence ids, prompt version, model, tokens, guard result, latency.</li>
          <li>Rep rejections are tagged with the claim id that was wrong, so we fix the source, not the prompt.</li>
          <li>Monthly: refit signal weights and half-lives against meetings and opportunities (logistic regression, interpretable).</li>
          <li>A 10% holdout of Tier-1 accounts gets no engine actions, so we measure the engine&apos;s own incrementality.</li>
        </Card>
        <Card title="Privacy + compliance (US)">
          <li>CPRA&apos;s exemption for B2B contact data ended on 1 Jan 2023, so prospects have access, deletion and opt-out rights. Each person record carries a source and a retention date.</li>
          <li>Honour the Global Privacy Control browser signal and cookie opt-outs before any visitor identification. Default to company-level identification; reveal the person only for known TAM accounts and only where the vendor&apos;s consent basis allows it.</li>
          <li>Site chat, session replay and pixels are reviewed with legal first: California wiretap (CIPA) claims over tracking tools are an active risk.</li>
          <li>Outbound follows CAN-SPAM (accurate sender, physical address, a working unsubscribe, opt-outs honoured within 10 business days); Gmail and Yahoo also require one-click unsubscribe for bulk senders, and checks a global suppression list before drafting.</li>
          <li>The prototype uses DeepSeek, whose API processes data in China. Production should use a model provider with US data residency, no training on our data and a signed DPA, or self-hosted open weights. The guard is model-agnostic, so swapping is one line.</li>
        </Card>
      </section>

      <section className="rounded-md border bg-card p-5 text-sm">
        <h2 className="font-display text-xl">What in this prototype is real</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <ul className="list-disc space-y-1 pl-5"><li><b>Working:</b> fit/intent scoring with decay, tiering, SLA and next action, buying-committee roles, inbound qualification and TAM matching, live re-ranking on an inbound event, the visitor&apos;s next content or meeting offer, the exact Salesforce writes each event would make, DeepSeek drafting with citation fact-check, retry and template fallback, approve/reject step.</li></ul>
          <ul className="list-disc space-y-1 pl-5"><li><b>Simulated or proposed:</b> all 40 accounts and people are synthetic; signal feeds, the actual Salesforce API calls, sequencer, Slack, ad audiences and the learning refit are designed here but not connected. Nothing is ever sent.</li></ul>
        </div>
      </section>
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: [string, string, string][] }) {
  return (
    <section className="rounded-md border bg-card p-5">
      <h2 className="font-display text-xl">{title}</h2>
      <table className="mt-3 w-full text-sm">
        <thead><tr className="text-left font-mono text-[11px] uppercase text-muted-foreground">{head.map((h) => <th key={h} className="pb-2 pr-3 font-normal">{h}</th>)}</tr></thead>
        <tbody className="divide-y">
          {rows.map(([a, b, c]) => (
            <tr key={a}><td className="py-2 pr-3 font-medium">{a}</td><td className="py-2 pr-3 font-mono text-xs text-heat whitespace-nowrap">{b}</td><td className="py-2 text-muted-foreground">{c}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border bg-card p-5">
      <h2 className="font-display text-xl">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{children}</ul>
    </section>
  );
}
