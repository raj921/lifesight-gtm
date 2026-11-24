# Technical overview

Diagram: open `/architecture`, or see slide 4 of the PDF. Solid boxes work. Dashed boxes are simulated or proposed.

## How a decision is made (works)

1. **Fit, 0 to 100:** ad spend 35, channel mix 30, analytics team 20, company size 15.
2. **Timing, 0 to 100:** each signal has points that fade by half-life. Two or more engaged people add 10.
3. **Score:** fit × timing ÷ 100. Hot needs score 40 and fit 60. Warm needs score 15 and fit 45.
4. **Deadline:** the fastest deadline among signals that still hold 40% of their points.
5. **Person:** an engaged champion or buyer first. Roles come from job titles.
6. **Email:** the model gets public facts with IDs and three product facts. Each statement needs an ID. One retry, then a template.

| Signal | Party | Points | Half-life | Deadline |
|---|---|---|---|---|
| Pricing visit | First | 35 | 5 d | 4 h |
| Readiness check | First | 35 | 10 d | 4 h |
| Report download | First | 30 | 10 d | 24 h |
| Webinar | First | 20 | 14 d | 48 h |
| Partner referral | Second | 35 | 21 d | 24 h |
| Vendor comparison | Second | 30 | 21 d | 48 h |
| Measurement hiring | Third | 30 | 30 d | 72 h |
| New marketing leader | Third | 25 | 45 d | 7 d |
| New paid channel | Third | 20 | 30 d | 7 d |
| Funding | Third | 15 | 30 d | 7 d |

## Inbound engine

| Stage | Design | Status | Owner |
|---|---|---|---|
| Discover | Original benchmark, comparison pages, question pages with schema. Named experts answer in communities. Track how often AI answers cite Lifesight each month. | Proposed | Content, Marketing |
| Capture | Visits, research, webinars, forms, product use become one typed event. | Simulated | RevOps |
| Qualify | Block competitor domains. Nurture students and researchers. Look up personal emails and unknown companies. Low-fit accounts stay Later. | Works | RevOps |
| Identify | Match email domain to account, email to person, title to role. Anonymous visits match to company only. | Domain match works | RevOps |
| Convert | Choose the next content or meeting by role, channels and tier. | Works as a preview | Marketing |
| Activate | Update Salesforce, alert the owner, create a task with a deadline. | Plan works, calls proposed | RevOps, Sales |

Automate capture, match, filter, routing and CRM updates first. People own research, positioning, email approval and outcome tags.

**Inbound and outbound share one score.** A visit can raise outbound priority. Replies, objections and meetings tell Marketing which content to make, and tune the score.

## Rules, AI, people

- **Rules:** score, tier, owner, deadline, filter. They must be explainable and repeatable.
- **AI today:** email wording only. **AI proposed:** read job posts and news into facts with a URL and date, and map unusual job titles.
- **People:** approve emails, change rules, tag outcomes.

## Salesforce

Salesforce stays the record. Proposed writes: Account score fields, Contact or Lead, Campaign member, Task, then Opportunity outcomes read back. Use an external event ID so a retry cannot create a second record. Match on domain and existing owner. Send unclear matches to a review queue.

## Build or buy

| Part | Choice | Why |
|---|---|---|
| Enrichment | Buy | Contact data is a commodity and ages quickly. |
| Visitor ID | Buy | Test two vendors on match rate with known traffic. |
| Scoring, routing | Build | This is Lifesight's GTM logic. It must stay visible. |
| Email writer, check | Build | Small, and the model can change. |
| CRM, sequencer, Slack | Keep | Reps already work there. |

## Production plan for 10,000 accounts (proposed)

- **Flow:** webhook or daily import, queue, identity match, Postgres, score, Salesforce.
- **Reliability:** event IDs, retries with backoff, dead-letter queue, replay. If AI fails, use the template. If Salesforce fails, hold the write and alert.
- **Cost:** AI runs for changed Hot and Warm accounts only. One draft uses about 1,000 to 2,500 tokens including a retry, less than one cent at the listed price. Hard monthly cap of $100.
- **Security:** secret manager, least-privilege Salesforce user, role-based access, audit log, encryption, no personal email sent to the model.
- **Privacy:** company-level visitor ID by default, opt-out and do-not-contact checks, data retention limits, legal review. Private activity chooses the topic but is never quoted.
- **Model provider:** DeepSeek sees synthetic data only. Production needs agreed data location, retention and no-training terms.
- **Data quality:** source, date and confidence on each fact. Expire stale facts. Deduplicate on domain.
- **Observability:** alert on queue age, match rate, error rate, cost, approval rate, speed to lead.
- **Maintainability:** rules in versioned code with tests. A change runs on past data before release.
- **Load test:** 10,000 accounts and a burst of 1,000 events before launch. Not done in this prototype.

## Learning (proposed)

Record meeting, opportunity and won or lost against the signals that were present. Keep 10% of Hot accounts as a holdout. Review weights monthly. Change them only when the sample is large enough, and let RevOps approve each change.
