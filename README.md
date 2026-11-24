# Signal Desk

A prototype GTM engine for the Lifesight GTM Engineer take-home. Due before the interview on 25 Nov 2026.

It ranks accounts, shows why now, names the person to contact and drafts an email. An inbound visit changes the rank and the next action.

| The brief asks for | Where |
|---|---|
| Working prototype | `/` |
| Inbound engine design | [docs/technical-overview.md](docs/technical-overview.md), slide 3 |
| Architecture and build vs buy | `/architecture`, slide 4, [docs/technical-overview.md](docs/technical-overview.md) |
| Production readiness | [docs/technical-overview.md](docs/technical-overview.md) |
| 30/60/90, costs, dependencies, KPIs | [docs/execution-plan.md](docs/execution-plan.md), slide 5 |
| Presentation, 5 slides | `/deck`, or `docs/Signal-Desk-slides.pdf` |

## Run it

Needs Node 22.18 or later and pnpm.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. For AI drafts, put `DEEPSEEK_API_KEY=your-key` in `.env.local`. Without a key, the app uses a template.

## Two-minute demo

1. Click **Tidewater Mobile**. Timing is 61, but fit is 12. It stays Later.
2. Click **Halcyon reads our report**. Score 14 to 44, rank 16 to 4, Later to Hot.
3. Read the visitor offer and the Salesforce preview.
4. Under People, click **Write email** for Priya. Hover over a source. Approve or skip.
5. Click **A competitor visits**. The system ignores it.

## What is real

**Works:** scoring, tiers, deadlines, roles from titles, lead filter, domain match, re-ranking, visitor offers (preview), AI draft with a source check, one retry, template fallback, approve or skip.

**Simulated:** all 40 accounts, people, signals and visits. Salesforce writes are a preview. Names are fictional and use `.example` domains.

**Proposed, not built:** live data, Salesforce API, Slack, sequencer, research and committee agents, database, queue, logs, holdout, retuning, sending.

## Known limits

- The email check requires a valid source per statement. It also checks digits and tracking words. It does not prove that the source supports the sentence. A person must check the meaning.
- Questions are exempt from the source check.
- Signal weights and tier limits are starting judgments, not learned values. The prototype defines ten signal types. The plan starts with three.
- The email in a visit is not verified. The API rate limit works per server instance only.
- Decisions stay in the browser and are lost on refresh.
- Tested with 40 accounts, not 10,000.

## Checks

```bash
node lib/engine.test.ts
node scripts/check-api.mjs
```

The second check needs the dev server and an API key.

## Sources

- Product facts: lifesight.io, checked Nov 2026.
- Clay prices: clay.com/pricing and Valley's worked examples. DeepSeek prices: api-docs.deepseek.com.
- Signal fade: Octave, *The GTM Engineer's Guide to Intent Data*. Source-per-sentence rule: Explorium, *How to Stop AI Agents Hallucinating Personalization*.
- Colour values and some interface patterns follow the Interfere design system. See [DESIGN.md](DESIGN.md).
