// Deterministic GTM engine: rules decide score, tier, timing and routing. AI only writes words (see app/api/draft).

export type Party = "1P" | "2P" | "3P";
export type SignalType =
  | "pricing_visit" | "report_download" | "webinar" | "assessment"
  | "partner_referral" | "competitor_eval"
  | "hiring_measurement" | "exec_change" | "channel_expansion" | "funding";

export type Signal = { id: string; type: SignalType; daysAgo: number; detail: string; source: string; contactId?: string; simulated?: boolean };
export type Contact = { id: string; name: string; title: string; email: string };
export type Account = {
  id: string; name: string; domain: string; industry: string; hq: string; employees: number;
  adSpendM: number; channels: string[]; hasAnalyticsTeam: boolean; currentTool?: string;
  owner: string; signals: Signal[]; contacts: Contact[];
};

// weight = max points, halfLife = days until it counts half, slaHours = how fast a human must act.
// Weights/half-lives follow common intent-decay practice (fresh 1P intent decays in days, 3P org changes in weeks).
export const SIGNALS: Record<SignalType, { label: string; party: Party; weight: number; halfLife: number; slaHours: number }> = {
  pricing_visit:      { label: "Pricing page visits",           party: "1P", weight: 35, halfLife: 5,  slaHours: 4 },
  report_download:    { label: "Research report download",      party: "1P", weight: 30, halfLife: 10, slaHours: 24 },
  assessment:         { label: "Completed MMM readiness check", party: "1P", weight: 35, halfLife: 10, slaHours: 4 },
  webinar:            { label: "Webinar attendance",            party: "1P", weight: 20, halfLife: 14, slaHours: 48 },
  partner_referral:   { label: "Agency/partner referral",       party: "2P", weight: 35, halfLife: 21, slaHours: 24 },
  competitor_eval:    { label: "Comparing vendors on review site", party: "2P", weight: 30, halfLife: 21, slaHours: 48 },
  hiring_measurement: { label: "Hiring for MMM / marketing science", party: "3P", weight: 30, halfLife: 30, slaHours: 72 },
  exec_change:        { label: "New marketing leader",          party: "3P", weight: 25, halfLife: 45, slaHours: 168 },
  channel_expansion:  { label: "Expanding into new paid channels", party: "3P", weight: 20, halfLife: 30, slaHours: 168 },
  funding:            { label: "Funding / budget event",        party: "3P", weight: 15, halfLife: 30, slaHours: 168 },
};

export const COMPETITOR_DOMAINS = ["measured.com", "haus.io", "getrecast.com", "liftlab.com", "northbeam.io", "triplewhale.com", "fospha.com", "sellforte.com"];
const FREEMAIL = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me", "aol.com"];

export type Role = "Economic buyer" | "Champion" | "Practitioner" | "Finance approver" | "Technical evaluator" | "Other";

export function roleOf(title: string): Role {
  const t = title.toLowerCase();
  if (/\b(cfo|finance|fp&a)\b/.test(t)) return "Finance approver";
  if (/\b(cmo|chief marketing|chief growth)\b/.test(t)) return "Economic buyer";
  if (/(marketing science|measurement|analytics|insights|growth|data scien)/.test(t)) return "Champion";
  if (/\b(evp|svp|vp)\b.*marketing|marketing.*\b(evp|svp|vp)\b/.test(t)) return "Economic buyer";
  if (/(data engineer|bi |data platform|it )/.test(t)) return "Technical evaluator";
  if (/(performance|paid|media|acquisition|retail media|ctv)/.test(t)) return "Practitioner";
  return "Other";
}

// Fit = can they buy and use it? 0-100, pure rules on firmographics.
export function fitScore(a: Account) {
  const parts: [string, number][] = [
    ["Ad spend", a.adSpendM >= 50 ? 35 : a.adSpendM >= 10 ? 28 : a.adSpendM >= 5 ? 18 : 5],
    ["Channel mix", Math.min(a.channels.length, 6) * 5],
    ["Analytics team", a.hasAnalyticsTeam ? 20 : 0],
    ["Size", a.employees > 10000 ? 10 : a.employees >= 500 ? 15 : a.employees >= 200 ? 8 : 2],
  ];
  return { score: parts.reduce((s, [, v]) => s + v, 0), parts };
}

export const decayed = (s: Signal) => SIGNALS[s.type].weight * 0.5 ** (s.daysAgo / SIGNALS[s.type].halfLife);

// Intent = why now? Sum of decayed signal points, +10 when 2+ people engage (buying-committee activity), capped at 100.
export function intentScore(a: Account) {
  const contributions = a.signals
    .map((s) => ({ signal: s, points: Math.round(decayed(s) * 10) / 10 }))
    .filter((c) => c.points >= 1)
    .sort((x, y) => y.points - x.points);
  const engaged = new Set(a.signals.filter((s) => s.contactId && SIGNALS[s.type].party !== "3P" && s.daysAgo <= 30).map((s) => s.contactId));
  const multiThread = engaged.size >= 2 ? 10 : 0;
  const raw = contributions.reduce((s, c) => s + c.points, 0) + multiThread;
  return { score: Math.min(100, Math.round(raw)), contributions, multiThread, engaged: [...engaged] as string[] };
}

export type Tier = 1 | 2 | 3;

export function scoreAccount(a: Account) {
  const fit = fitScore(a);
  const intent = intentScore(a);
  // Fit gates intent: hot intent at a poor-fit company is a distraction.
  const priority = Math.round((fit.score * intent.score) / 100);
  const tier: Tier = priority >= 40 && fit.score >= 60 ? 1 : priority >= 15 && fit.score >= 45 ? 2 : 3;
  const committee = a.contacts.map((c) => ({ ...c, role: roleOf(c.title), engaged: intent.engaged.includes(c.id) }));
  const order: Role[] = ["Champion", "Economic buyer", "Practitioner", "Technical evaluator", "Finance approver", "Other"];
  const target =
    committee.find((c) => c.engaged && (c.role === "Champion" || c.role === "Economic buyer")) ??
    committee.find((c) => c.engaged) ??
    [...committee].sort((x, y) => order.indexOf(x.role) - order.indexOf(y.role))[0];
  const top = intent.contributions[0]?.signal;
  // When? The fastest SLA among signals still carrying >= 40% of their weight.
  const live = intent.contributions.filter((c) => c.points >= 0.4 * SIGNALS[c.signal.type].weight);
  const slaHours = live.length ? Math.min(...live.map((c) => SIGNALS[c.signal.type].slaHours)) : top ? 168 : null;
  return { account: a, fit, intent, priority, tier, committee, target, top, slaHours, action: nextAction(tier, top, slaHours, target, a) };
}

export type Scored = ReturnType<typeof scoreAccount>;

export const slaText = (h: number | null) => (h == null ? "no deadline" : h <= 24 ? `within ${h} hours` : `within ${Math.round(h / 24)} days`);

function nextAction(tier: Tier, top: Signal | undefined, slaHours: number | null, target: Contact & { role: Role } | undefined, a: Account) {
  const who = target ? target.name.split(" ")[0] : "the buying team";
  const when = slaText(slaHours);
  const hot = top && SIGNALS[top.type].party !== "3P";
  if (tier === 1)
    return { owner: a.owner, play: hot ? "Hot lead: email and call" : "Personal outreach", steps: [`Email ${who} ${when}`, "Loop in the economic buyer", "Run ads to the buying team for 2 weeks"] };
  if (tier === 2)
    return { owner: "SDR team", play: "Email sequence", steps: [`Start a 3-email sequence to ${who} ${when}`, "Email 2: a case study", "Email 3: offer the readiness check"] };
  return { owner: "Marketing", play: "Nurture", steps: ["Add to ads and the newsletter", "Rescore on the next signal"] };
}

export const rank = (accounts: Account[]) => accounts.map(scoreAccount).sort((x, y) => y.priority - x.priority || y.fit.score - x.fit.score);

// ---------- Inbound qualification: deterministic, runs before any AI ----------
export type LeadVerdict = { verdict: "route" | "enrich" | "nurture" | "exclude"; reason: string; account?: Account; contact?: Contact; role?: Role };

export function qualifyLead(email: string, title: string, accounts: Account[]): LeadVerdict {
  const m = email.trim().toLowerCase().match(/^[^@\s]+@([a-z0-9.-]+\.[a-z]{2,})$/);
  if (!m) return { verdict: "exclude", reason: "Not a valid email" };
  const domain = m[1];
  const t = title.toLowerCase();
  if (COMPETITOR_DOMAINS.some((d) => domain === d || domain.endsWith("." + d))) return { verdict: "exclude", reason: "Competitor. Blocked." };
  if (domain.endsWith(".edu") || /\b(student|intern|phd|professor|researcher)\b/.test(t)) return { verdict: "nurture", reason: "Student. Content only." };
  if (FREEMAIL.includes(domain)) return { verdict: "enrich", reason: "Personal email. Find their company first." };
  const account = accounts.find((a) => domain === a.domain || domain.endsWith("." + a.domain));
  const role = roleOf(title);
  if (!account) return { verdict: "enrich", reason: "Not a target account. Check fit first.", role };
  const contact = account.contacts.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
  if (role === "Other") return { verdict: "nurture", reason: `${account.name}, but not a buyer role`, account, contact, role };
  return { verdict: "route", reason: `${account.name} · ${role}`, account, contact, role };
}

// Only public (3P) signals may be quoted to a prospect. Site activity and partner tips stay internal.
export const isQuotable = (s: Signal) => SIGNALS[s.type].party === "3P";

// ---------- Hallucination guard for AI drafts ----------
// Checks form, not meaning: each statement cites an id that exists, and digits appear in the evidence. A person checks the meaning.
// shortcut: no entailment check and questions are exempt, add a claim-vs-source judge before any automatic sending.
export function guardDraft(body: string, evidence: { id: string; text: string }[], subject = "") {
  const errors: string[] = [];
  const ids = new Set(evidence.map((e) => e.id));
  const cited = [...body.matchAll(/\[([A-Z]+\d+)\]/g)].map((m) => m[1]);
  if (!cited.length) errors.push("No citations");
  for (const c of cited) if (!ids.has(c)) errors.push(`Unknown citation [${c}]`);
  const sentences = body.replace(/([.!?])((?:\s*\[[A-Z]+\d+\])+)/g, "$2$1").split(/\n+|(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  for (const x of sentences)
    if (!/\[[A-Z]+\d+\]/.test(x) && !x.endsWith("?") && !/^(hi|hello|hey|dear)\b[^.!]{0,40}[,!]?$/i.test(x) && x.split(/\s+/).length > 3) errors.push(`No source for: "${x}"`);
  const corpus = evidence.map((e) => e.text).join(" ");
  const numbers = `${subject} ${body}`.replace(/\[[A-Z]+\d+\]/g, "").match(/\d[\d,.]*%?/g) ?? [];
  for (const n of numbers) if (!corpus.includes(n.replace(/[.,]$/, ""))) errors.push(`Unsupported number "${n}"`);
  // Never reveal that we watched them: talk about the topic, not their clicks.
  const creepy = `${subject} ${body}`.match(/\byou(?:'ve| have)? (?:just )?(?:pulled|downloaded|visited|viewed|read|registered|checked out|looked at)\b|\byour (?:recent )?(?:visit|download|registration)\b/i);
  if (creepy) errors.push(`Reveals tracking: "${creepy[0]}"`);
  const words = body.replace(/\[[A-Z]+\d+\]/g, "").split(/\s+/).filter(Boolean).length;
  if (words > 140) errors.push(`Too long (${words} words)`);
  return { ok: errors.length === 0, errors, cited: [...new Set(cited)] };
}

// An inbound event becomes a fresh 1P signal; the account is simply re-scored. Same code path as every other signal.
// Same person + same event on the same day is one signal, not many (refreshes and double form-submits are common).
export function addInbound(a: Account, type: SignalType, detail: string, contactId?: string): Account {
  if (a.signals.some((s) => s.type === type && s.daysAgo === 0 && s.contactId === contactId)) return a;
  const signal: Signal = { id: `S${a.signals.length + 1}`, type, daysAgo: 0, detail, source: "Inbound event (1P, simulated in demo)", contactId, simulated: true };
  return { ...a, signals: [...a.signals, signal] };
}

// Own-key check only: `"toString" in obj` is true for every object literal.
const INBOUND_TYPES = new Set<string>(["report_download", "pricing_visit", "assessment", "webinar"]);
export const isInboundType = (t: unknown): t is "report_download" | "pricing_visit" | "assessment" | "webinar" => typeof t === "string" && INBOUND_TYPES.has(t);

// "[S1, P2]" -> "[S1][P2]" so grouped citations are checked one by one.
export const normalizeCitations = (body: string) =>
  body.replace(/\[\s*([A-Z]+\d+(?:\s*[,;]\s*[A-Z]+\d+)+)\s*\]/g, (_, g: string) => g.split(/\s*[,;]\s*/).map((id) => `[${id}]`).join(""));

// ---------- Inbound conversion: what the visitor sees next (rules pick, Marketing writes the assets) ----------
export type Asset = { id: string; title: string; kind: "report" | "assessment" | "tool" | "guide" | "comparison" };
export const ASSETS: Record<string, Asset> = {
  benchmark: { id: "benchmark", title: "2027 measurement benchmark report", kind: "report" },
  readiness: { id: "readiness", title: "MMM readiness check", kind: "assessment" },
  geoPlanner: { id: "geoPlanner", title: "CTV and retail media test planner", kind: "tool" },
  cfoGuide: { id: "cfoGuide", title: "CFO guide to proving marketing ROI", kind: "guide" },
  compare: { id: "compare", title: "Lifesight vs single-method tools", kind: "comparison" },
};

export function recommendExperience(v: LeadVerdict, type: SignalType, tier?: Tier): { headline: string; assets: Asset[]; cta: string } {
  if (v.verdict === "exclude") return { headline: "Nothing personal", assets: [ASSETS.benchmark], cta: "Public content only, no follow-up" };
  if (v.verdict === "enrich") return { headline: "Learn more first", assets: [ASSETS.benchmark], cta: "Ask for their company name next" };
  if (v.verdict === "nurture") return { headline: "Teach, don't sell", assets: [ASSETS.benchmark, ASSETS.compare], cta: "Monthly newsletter" };
  const owner = v.account?.owner ?? "the account team";
  const hot = type === "pricing_visit" || type === "assessment";
  const role = v.role ?? "Other";
  const channelHeavy = !!v.account?.channels.some((c) => /CTV|Retail media/i.test(c));
  const assets =
    role === "Economic buyer" || role === "Finance approver" ? [ASSETS.cfoGuide, ASSETS.compare]
    : role === "Practitioner" ? [channelHeavy ? ASSETS.geoPlanner : ASSETS.readiness, ASSETS.benchmark]
    : type === "assessment" ? [channelHeavy ? ASSETS.geoPlanner : ASSETS.compare, ASSETS.cfoGuide]
    : [ASSETS.readiness, channelHeavy ? ASSETS.geoPlanner : ASSETS.compare];
  const cta = tier === 1 && hot ? `Book time with ${owner}` : tier === 1 ? `Offer a call with ${owner}` : "Show the next piece, offer a call later";
  return { headline: `${v.account?.name ?? "TAM account"} · ${role}`, assets, cta };
}

// ---------- Salesforce writes (system of record). Simulated: the prototype shows the plan, never calls the API ----------
export type SfOp = { op: "update" | "upsert" | "create" | "skip"; object: string; fields: Record<string, string | number> };

export function salesforcePlan(v: LeadVerdict, email: string, type: SignalType, after?: Scored, before?: Scored): SfOp[] {
  const source = `Inbound · ${SIGNALS[type].label}`;
  if (v.verdict === "exclude") return [{ op: "skip", object: "Lead", fields: { Reason: v.reason, Suppression_List__c: email.split("@")[1] ?? "" } }];
  if (v.verdict !== "route" || !after) return [{ op: "create", object: "Lead", fields: { Email: email, LeadSource: source, Status: v.verdict === "enrich" ? "Needs enrichment" : "Nurture", OwnerId: "Marketing queue" } }];
  const a = after.account;
  const ops: SfOp[] = [
    { op: "update", object: `Account ${a.name}`, fields: {
      Fit_Score__c: after.fit.score, Intent_Score__c: after.intent.score, Priority__c: after.priority,
      Tier__c: before && before.tier !== after.tier ? `${before.tier} → ${after.tier}` : after.tier,
      Why_Now__c: after.top ? `${SIGNALS[after.top.type].label}: ${after.top.detail}` : "", Next_Action__c: after.action.play,
    } },
    v.contact
      ? { op: "upsert", object: `Contact ${v.contact.name}`, fields: { Buying_Role__c: v.role ?? "Other", Last_Engagement__c: source } }
      : { op: "create", object: "Lead (matched to Account)", fields: { Email: email, Company: a.name, Buying_Role__c: v.role ?? "Other", LeadSource: source } },
  ];
  if (after.tier <= 2)
    ops.push({ op: "create", object: "Task", fields: { OwnerId: after.tier === 1 ? a.owner : "SDR queue", Subject: after.action.play, Due: `now + ${after.slaHours ?? 168}h`, Priority: after.tier === 1 ? "High" : "Normal" } });
  return ops;
}
