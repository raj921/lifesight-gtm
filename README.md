# Signal Desk: a GTM engine prototype for Lifesight

This is a take-home for the Lifesight GTM Engineer role. **It is due before the follow-up interview on 25 Nov 2026** and was built in about 4 hours.

The prototype answers three questions for a 10,000-account TAM: which accounts to work today, why now, and what to say. It also shows inbound engagement re-ranking an account live.

## Deliverables

| Brief asks for | Where it is |
|---|---|
| Working prototype | `/`: the Signal desk dashboard |
| Inbound engine design | `/deck` slide 3, plus the inbound simulator on `/` |
| Architecture diagram + build vs buy | `/architecture` and `/deck` slide 4 |
| Production readiness at 10k accounts | `/architecture` cards, `/deck` slide 4 |
| 30/60/90, costs, dependencies, KPIs | `/deck` slide 5 |
| At most 5 slides | `/deck` (use ← →, and "Save as PDF" prints one slide per page) |

## Run it

```bash
pnpm install
echo "DEEPSEEK_API_KEY=your-key" > .env.local   # optional: without it, drafts use the guarded template
pnpm dev
```

Then open http://localhost:3000.

Checks:

```bash
node lib/engine.test.ts        # scoring, tiers, inbound flip, qualification, hallucination guard
node scripts/check-api.mjs     # live DeepSeek draft passes the citation guard (needs pnpm dev)
```

## Demo script (2 minutes)

1. The ranked list shows **priority = fit × intent**. Click Brightleaf Home: it has fresh pricing visits, so it gets a 4-hour SLA.
2. Click Tidewater Mobile. Its intent is high but its fit is poor, so it stays in Tier 3. Fit gates intent.
3. In the inbound panel, keep the preset "Dormant TAM account reads report" and press **Fire event**. The email is matched to Halcyon Beauty. The account moves from #16 to #4 and from Tier 3 to Tier 1, and the next action changes from "Nurture and watch" to "Hot inbound: email within 24 hours".
4. Under buying committee, press **Draft email** for Priya Raman. DeepSeek writes a draft that cites only stored signals and approved product facts. Hover over a citation to see its evidence. The fact-check result is shown above the draft. Approve or reject it; nothing is sent.
5. Under the inbound panel, two cards show what the visitor sees next (content, assessment or a meeting offer, chosen by role, channels and tier) and the exact Salesforce writes: Account fields, Contact or Lead, and an owner Task with the SLA.
6. Try the other presets. A competitor domain is excluded, a student goes to nurture, and a Gmail address goes to enrichment.

## What is real and what is simulated

- **Working:**
  - Fit and intent scoring, with a decay half-life for each signal type.
  - Tier, SLA, owner and next best action.
  - Buying-committee roles worked out from job titles.
  - Inbound qualification and TAM domain matching.
  - Live re-ranking when an inbound event fires.
  - The visitor's next-best content or meeting offer, and the Salesforce write plan for each inbound event (the plan is real logic; the API call is simulated).
  - DeepSeek (`deepseek-flash`) drafting with a citation and number guard. If a draft fails the guard it retries once with the errors, then falls back to a deterministic template.
  - A per-IP rate limit and input validation on the API.
- **Simulated:**
  - All 40 accounts and their people are fictional, on `.example` domains, standing in for the 10k TAM.
  - Signal feeds, Salesforce writes, the sequencer, Slack, ad audiences and the monthly weight refit are designed but not connected.
  - Nothing is ever sent.

## Key engineering decisions

- **Rules decide, AI explains, humans approve.** Score, tier, SLA and routing are deterministic code (`lib/engine.ts`) so a rep or RevOps can audit them. The LLM only turns evidence into words.
- **Each claim must cite a source.** The model sees evidence with ids like `[S1]` and `[P2]`. `guardDraft` rejects:
  - an uncited draft,
  - an unknown id,
  - a number that does not appear in the evidence,
  - a draft that is too long.
- **Trust boundary.** The client sends only ids and enum values. The server rebuilds every piece of text, so no free text from the browser reaches the prompt.
- **Decay over volume.** A signal's points halve every N days: 5 days for pricing visits, 45 days for a new executive. Old signals fall to zero and show as crossed out.
- **Fit gates intent.** Hot intent at a poor-fit company never earns rep time.
- **Measure the engine's own lift.** A 10% holdout of Tier-1 accounts is the control group, which suits a company that sells incrementality measurement.

## Sources used for the design

- Intent decay and limiting a model to 5–7 signal types: Octave, *The GTM Engineer's Guide to Intent Data*.
- Citation-required personalization, and human approval for the first few hundred sends: Explorium, *How to Stop AI Agents Hallucinating Personalization* (Sep 2026).
- 67% of B2B buyers prefer a rep-free experience: Gartner press release, 9 Mar 2026 (via Common Room).
- Lifesight's positioning (unified MMM, incrementality and attribution; weekly recalibration; no cookies or PII): lifesight.io.
- Clay Growth pricing ($495–1,330 a month): clay.com/pricing and Valley's worked examples. DeepSeek Flash pricing ($0.30 per 1M input, $1.20 per 1M output at peak): api-docs.deepseek.com.
- The 95:5 rule: LinkedIn B2B Institute.
- Privacy: CPRA B2B exemption sunset (1 Jan 2023), Global Privacy Control under CCPA regulations, CAN-SPAM. This is not legal advice; review with counsel.
- Day-90 targets on slide 5 are assumptions (about $50k ACV, 50% meeting to opportunity) to be replaced with Lifesight's real numbers.
