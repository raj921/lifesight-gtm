import { ACCOUNTS, INBOUND_EVENTS, PRODUCT_FACTS, type InboundType } from "@/lib/data";
import { addInbound, guardDraft, isInboundType, normalizeCitations, roleOf, scoreAccount, SIGNALS, type Account } from "@/lib/engine";

const MODEL = "deepseek-flash";
const hits = new Map<string, number[]>(); // shortcut: per-instance rate limit, use Upstash/Vercel KV when this is public for real

const ANGLE: Record<string, string> = {
  "Economic buyer": "budget defensibility: one set of numbers marketing and finance both trust",
  Champion: "rigor: MMM calibrated by real experiments instead of reconciling three dashboards",
  Practitioner: "channel truth: which spend in their newer channels is actually incremental",
  "Technical evaluator": "low lift: no cookies or personal data needed",
  "Finance approver": "budget defensibility in front of finance",
  Other: "measuring what marketing really drives",
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (hits.size > 5000) hits.clear(); // bound memory on a long-lived instance
  if (recent.length >= 15) return Response.json({ error: "Rate limited, try again in a minute" }, { status: 429 });
  hits.set(ip, [...recent, now]);

  // Trust boundary: only ids and enum values come from the client; all text is rebuilt server-side.
  const body = await req.json().catch(() => undefined);
  if (body === undefined) return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  const base = ACCOUNTS.find((a) => a.id === body?.accountId);
  if (!base) return Response.json({ error: "Unknown account" }, { status: 400 });
  const events: { type: InboundType; contactId?: string }[] = Array.isArray(body.events) ? body.events.slice(0, 8) : [];
  let account: Account = base;
  for (const e of events) {
    if (!isInboundType(e?.type)) return Response.json({ error: "Bad event" }, { status: 400 });
    const cid = base.contacts.some((c) => c.id === e.contactId) ? e.contactId : undefined;
    account = addInbound(account, e.type, INBOUND_EVENTS[e.type], cid);
  }
  const scored = scoreAccount(account);
  const contact = account.contacts.find((c) => c.id === body.contactId) ?? scored.target;
  if (!contact) return Response.json({ error: "No contact" }, { status: 400 });
  const role = roleOf(contact.title);

  // Only signals that still carry weight are evidence. Old signals are not "why now".
  const live = new Set(scored.intent.contributions.map((c) => c.signal.id));
  const evidence = [
    ...account.signals.filter((s) => live.has(s.id)).map((s) => ({ id: s.id, text: `${s.detail} (${SIGNALS[s.type].label}, ${s.daysAgo === 0 ? "today" : s.daysAgo + " days ago"}${s.contactId === contact.id ? ", by this recipient" : ""})` })),
    ...PRODUCT_FACTS,
  ];

  const system = `You write first-touch B2B emails for Lifesight, a marketing measurement platform. Rules:
- Use ONLY facts in EVIDENCE. Put the evidence id in brackets right after each factual claim, like [S1] or [P2].
- Never invent numbers, customers, results, prices or events. Do not use any number that is not in EVIDENCE.
- Do not say how you know about website visits or downloads; refer to the topic, not the tracking ("teams researching X often...").
- Open with the reader's situation (the strongest S fact), not with Lifesight. Use at most ONE product fact (P). No feature lists.
- Under 90 words. Plain, specific, no hype, no "I hope this finds you well". One soft call to action.
- Angle for this reader: ${ANGLE[role]}.
Return JSON: {"subject": string (max 8 words), "body": string, "angle": string (one short phrase)}`;
  const user = `RECIPIENT: ${contact.name}, ${contact.title} (${role}) at ${account.name} (${account.industry}).
EVIDENCE:
${evidence.map((e) => `[${e.id}] ${e.text}`).join("\n")}`;

  const key = process.env.DEEPSEEK_API_KEY;
  const started = Date.now();
  let lastErrors: string[] = [];
  if (key) {
    const messages = [{ role: "system", content: system }, { role: "user", content: user }];
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: MODEL, thinking: { type: "disabled" }, response_format: { type: "json_object" }, temperature: 0.4, max_tokens: 600, messages }),
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
        const data = await res.json();
        const out = JSON.parse(data.choices[0].message.content);
        out.body = normalizeCitations(String(out.body ?? ""));
        const guard = guardDraft(out.body, evidence);
        if (guard.ok && out.subject)
          return Response.json({ source: "deepseek", model: MODEL, attempt, latencyMs: Date.now() - started, subject: out.subject, body: out.body, angle: out.angle, guard, evidence, contact: { ...contact, role }, status: "awaiting_human_approval", usage: data.usage });
        lastErrors = guard.errors;
        // Self-correction: show the model exactly which rule it broke, once.
        messages.push({ role: "assistant", content: data.choices[0].message.content }, { role: "user", content: `Rejected by fact-checker: ${guard.errors.join("; ")}. Rewrite following every rule.` });
      } catch (e) {
        lastErrors = [String((e as Error).message)];
        break;
      }
    }
  }

  // Fallback: deterministic template, still guarded. The demo never shows an unchecked claim.
  const top = account.signals.find((s) => s.id === scored.top?.id);
  const first = contact.name.split(" ")[0];
  const tmpl = top
    ? `Hi ${first},\n\nNoticed ${account.name}: ${top.detail.charAt(0).toLowerCase() + top.detail.slice(1)} [${top.id}]. That is usually when the question "which spend is actually incremental?" gets louder.\n\nLifesight brings MMM, geo-incrementality tests and attribution into one platform [P1], and every test recalibrates the model [P2].\n\nOpen to comparing notes on how ${account.name} measures this today?`
    : `Hi ${first},\n\nLifesight brings MMM, geo-incrementality tests and attribution into one platform [P1]. Open to comparing notes on how ${account.name} measures marketing impact today?`;
  return Response.json({
    source: "template", fallbackReason: key ? lastErrors.join("; ") || "LLM failed" : "No DEEPSEEK_API_KEY set",
    latencyMs: Date.now() - started, subject: `${account.name} + measuring what is incremental`, body: tmpl, angle: ANGLE[role], guard: guardDraft(tmpl, evidence), evidence, contact: { ...contact, role }, status: "awaiting_human_approval",
  });
}
