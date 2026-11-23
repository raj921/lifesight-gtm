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

1. The list is ranked by score (fit × timing). Hot, Warm and Later replace Tier 1, 2 and 3.
2. Click **Tidewater Mobile**. It's busy on our site but too small to buy, so it stays Later.
3. Click **Halcyon reads our report**. Halcyon jumps from #16 to #4 and from Later to Hot. You also see what the visitor gets next and what would be written to Salesforce.
4. Under **People**, click **Write email** for Priya. Hover a citation to see its source. Approve or skip; nothing is sent.
5. Try the other chips: a competitor is ignored, a student goes to nurture, a Gmail sign-up gets looked up first. **Custom…** lets you type any email.

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
