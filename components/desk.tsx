"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ACCOUNTS, INBOUND_EVENTS, type InboundType } from "@/lib/data";
import { addInbound, qualifyLead, rank, recommendExperience, salesforcePlan, SIGNALS, slaText, type LeadVerdict, type Scored, type SfOp, type Tier } from "@/lib/engine";

type Ev = { type: InboundType; contactId?: string };
type Draft = {
  source: "deepseek" | "template"; model?: string; latencyMs: number; subject: string; body: string; angle: string; fallbackReason?: string;
  guard: { ok: boolean; errors: string[]; cited: string[] }; evidence: { id: string; text: string }[]; contact: { name: string; title: string; role: string };
};

const TIER_STYLE: Record<Tier, string> = {
  1: "bg-heat text-white",
  2: "bg-warm text-black",
  3: "bg-secondary text-muted-foreground",
};
const PARTY_STYLE = { "1P": "text-heat border-heat/50", "2P": "text-warm border-warm/50", "3P": "text-fit border-fit/50" } as const;

const PRESETS: { label: string; email: string; title: string; type: InboundType }[] = [
  { label: "Dormant TAM account reads report", email: "priya.raman@halcyon-beauty.example", title: "VP, Marketing Analytics & Insights", type: "report_download" },
  { label: "Competitor snooping", email: "analyst@haus.io", title: "Growth Analyst", type: "assessment" },
  { label: "Student", email: "j.doe@stateu.edu", title: "MBA Student", type: "report_download" },
  { label: "Gmail CMO", email: "cmo.mike@gmail.com", title: "CMO", type: "pricing_visit" },
];

export function Desk() {
  const [events, setEvents] = useState<Record<string, Ev[]>>({});
  const [selected, setSelected] = useState("brightleaf");
  const [flash, setFlash] = useState<{ id: string; n: number } | null>(null);
  const [form, setForm] = useState(PRESETS[0]);
  const [verdict, setVerdict] = useState<(Verdict) | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft | "loading" | { error: string }>>({});
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>({});

  const ranked = useMemo(() => rank(applyEvents(events)), [events]);
  const cur = ranked.find((s) => s.account.id === selected) ?? ranked[0];
  const counts = [1, 2, 3].map((t) => ranked.filter((s) => s.tier === t).length);

  function submitInbound(e?: React.FormEvent) {
    e?.preventDefault();
    const v = qualifyLead(form.email, form.title, applyEvents(events));
    if (v.verdict !== "route" || !v.account) return setVerdict({ ...v, experience: recommendExperience(v, form.type), sf: salesforcePlan(v, form.email, form.type) });
    const id = v.account.id;
    if ((events[id] ?? []).some((x) => x.type === form.type && x.contactId === v.contact?.id))
      return setVerdict({ ...v, reason: `${v.reason} · already recorded today, score unchanged`, experience: recommendExperience(v, form.type, snap(ranked, id).tier), sf: [] });
    const next = { ...events, [id]: [...(events[id] ?? []), { type: form.type, contactId: v.contact?.id }] };
    const from = snap(ranked, id);
    const nextRanked = rank(applyEvents(next));
    const to = snap(nextRanked, id);
    const afterScored = nextRanked.find((x) => x.account.id === id)!;
    const beforeScored = ranked.find((x) => x.account.id === id)!;
    setEvents(next);
    setSelected(id);
    setFlash({ id, n: Date.now() });
    setDrafts({});
    setVerdict({ ...v, change: { from, to }, experience: recommendExperience(v, form.type, to.tier), sf: salesforcePlan(v, form.email, form.type, afterScored, beforeScored) });
    revealDetails();
  }

  function select(id: string) {
    setSelected(id);
    revealDetails();
  }

  async function draft(contactId: string) {
    const key = cur.account.id + contactId;
    setDrafts((d) => ({ ...d, [key]: "loading" }));
    setDecisions((d) => { const n = { ...d }; delete n[key]; return n; }); // a new draft needs a new human review
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: cur.account.id, contactId, events: events[cur.account.id] ?? [] }),
      });
      const data = await res.json();
      setDrafts((d) => ({ ...d, [key]: res.ok ? data : { error: data.error ?? "Failed" } }));
    } catch {
      setDrafts((d) => ({ ...d, [key]: { error: "Network error" } }));
    }
  }

  return (
    <div className="space-y-6">
      <header className="rise grid gap-4 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.2em] text-muted-foreground">Account intelligence · signal-led outbound · inbound</p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] mt-2">
            Who to work <em className="text-heat">today</em>, why now,<br className="hidden md:block" /> and what to say.
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          {counts.map((n, i) => (
            <div key={i} className="rounded border bg-card p-3">
              <div className="text-muted-foreground">{["Tier 1 · AE now", "Tier 2 · SDR", "Tier 3 · nurture"][i]}</div>
              <div className="font-display text-3xl mt-1">{n}</div>
            </div>
          ))}
          <p className="col-span-3 text-[11px] text-muted-foreground">
            <span className="text-foreground">●</span> Working: scoring, qualification, DeepSeek drafts + fact-check. <span>○</span> Simulated: data feeds (40 synthetic accounts stand in for 10k), Salesforce writes, sending.
          </p>
        </div>
      </header>

      <Inbound form={form} setForm={setForm} onSubmit={submitInbound} verdict={verdict} onReset={() => { setEvents({}); setVerdict(null); setDrafts({}); }} dirty={Object.keys(events).length > 0} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <section aria-label="Ranked accounts" className="rounded-md border bg-card lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center justify-between border-b px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Ranked TAM sample</span><span>priority = fit × intent</span>
          </div>
          <ol className="max-h-[calc(100vh-8rem)] overflow-y-auto divide-y">
            {ranked.map((s, i) => (
              <li key={flash?.id === s.account.id ? `${s.account.id}-${flash.n}` : s.account.id} className={flash?.id === s.account.id ? "flash" : ""}>
                <button
                  onClick={() => select(s.account.id)}
                  aria-current={s.account.id === cur.account.id}
                  className="grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/60 aria-[current=true]:bg-secondary"
                >
                  <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{s.account.name}</span>
                      {events[s.account.id] && <span className="font-mono text-[10px] text-heat">● inbound</span>}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{s.top ? SIGNALS[s.top.type].label : "No live signals"}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Bars fit={s.fit.score} intent={s.intent.score} />
                    <span className="w-8 text-right font-mono text-sm">{s.priority}</span>
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${TIER_STYLE[s.tier]}`}>T{s.tier}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div id="details" className="scroll-mt-20"><AccountPanel key={cur.account.id} s={cur} drafts={drafts} onDraft={draft} decisions={decisions} setDecisions={setDecisions} /></div>
      </div>
    </div>
  );
}

type Verdict = LeadVerdict & { change?: { from: Snap; to: Snap }; experience: ReturnType<typeof recommendExperience>; sf: SfOp[] };
type Snap = { rank: number; tier: Tier; play: string; priority: number };
function snap(r: Scored[], id: string): Snap {
  const i = r.findIndex((s) => s.account.id === id);
  return { rank: i + 1, tier: r[i].tier, play: r[i].action.play, priority: r[i].priority };
}
function applyEvents(events: Record<string, Ev[]>) {
  return ACCOUNTS.map((a) => (events[a.id] ?? []).reduce((acc, e) => addInbound(acc, e.type, INBOUND_EVENTS[e.type], e.contactId), a));
}

function Bars({ fit, intent }: { fit: number; intent: number }) {
  return (
    <span className="hidden sm:grid w-16 gap-1" title={`Fit ${fit} · Intent ${intent}`}>
      <span className="h-1 rounded bg-secondary"><span className="block h-1 rounded bg-fit" style={{ width: `${fit}%` }} /></span>
      <span className="h-1 rounded bg-secondary"><span className="block h-1 rounded bg-heat" style={{ width: `${intent}%` }} /></span>
    </span>
  );
}

function Inbound({ form, setForm, onSubmit, verdict, onReset, dirty }: {
  form: (typeof PRESETS)[number]; setForm: (f: (typeof PRESETS)[number]) => void; onSubmit: (e?: React.FormEvent) => void;
  verdict: (Verdict) | null; onReset: () => void; dirty: boolean;
}) {
  const tone = { route: "border-heat text-heat", enrich: "border-warm text-warm", nurture: "border-fit text-fit", exclude: "border-muted-foreground text-muted-foreground" };
  return (
    <section aria-label="Inbound simulator" className="rise rounded-md border bg-card p-4 [animation-delay:80ms]">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-xl">Inbound event</h2>
        <p className="text-sm text-muted-foreground">A form fill or identified visit is qualified by rules, matched to the TAM, and re-scores the account live.</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => setForm(p)} aria-pressed={form.label === p.label}
            className="rounded-full border px-3 py-1 text-xs hover:bg-secondary aria-pressed:border-foreground aria-pressed:bg-secondary">{p.label}</button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-3 grid gap-2 md:grid-cols-[1.3fr_1.2fr_1fr_auto_auto]">
        <label className="grid gap-1 text-xs text-muted-foreground">Work email
          <input value={form.email} onChange={(e) => setForm({ ...form, label: "", email: e.target.value })} className="h-9 rounded border bg-background px-2 font-mono text-sm text-foreground" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Job title
          <input value={form.title} onChange={(e) => setForm({ ...form, label: "", title: e.target.value })} className="h-9 rounded border bg-background px-2 text-sm text-foreground" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Engagement
          <select value={form.type} onChange={(e) => setForm({ ...form, label: "", type: e.target.value as InboundType })} className="h-9 rounded border bg-background px-2 text-sm text-foreground">
            {Object.keys(INBOUND_EVENTS).map((k) => <option key={k} value={k}>{SIGNALS[k as InboundType].label}</option>)}
          </select>
        </label>
        <Button type="submit" className="self-end h-9 bg-heat text-white hover:bg-heat/85">Fire event</Button>
        <Button type="button" variant="ghost" className="self-end h-9" onClick={onReset} disabled={!dirty}>Reset</Button>
      </form>
      {verdict && (
        <div className="rise mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className={`rounded border px-2 py-0.5 font-mono text-xs uppercase ${tone[verdict.verdict]}`}>{verdict.verdict}</span>
          <span>{verdict.reason}</span>
          {verdict.change && (
            <span className="font-mono text-xs">
              #{verdict.change.from.rank} → <b className="text-heat">#{verdict.change.to.rank}</b> · T{verdict.change.from.tier} → <b className="text-heat">T{verdict.change.to.tier}</b> · “{verdict.change.from.play}” → <b>“{verdict.change.to.play}”</b>
              {!verdict.contact && " · new person: create Lead linked to Account"}
            </span>
          )}
        </div>
      )}
      {verdict && (
        <div className="rise mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded border bg-background p-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Visitor sees next · rules pick, Marketing owns assets</p>
            <p className="mt-1 font-medium">{verdict.experience.headline}</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {verdict.experience.assets.map((x) => <li key={x.id}><span className="font-mono text-[10px] uppercase text-heat">{x.kind}</span> {x.title}</li>)}
            </ul>
            <p className="mt-1.5 text-sm text-muted-foreground">→ {verdict.experience.cta}</p>
          </div>
          <div className="rounded border bg-background p-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Salesforce writes · simulated, no API call</p>
            {verdict.sf.length ? (
              <ul className="mt-1 space-y-1.5 font-mono text-[11px]">
                {verdict.sf.map((o, i) => (
                  <li key={i}>
                    <span className={o.op === "skip" ? "text-muted-foreground" : "text-fit"}>{o.op.toUpperCase()}</span> <b>{o.object}</b>
                    <span className="block text-muted-foreground break-words">{Object.entries(o.fields).map(([k, val]) => `${k}=${val}`).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-1 text-sm text-muted-foreground">No write: duplicate event (idempotent).</p>}
          </div>
        </div>
      )}
    </section>
  );
}

function AccountPanel({ s, drafts, onDraft, decisions, setDecisions }: {
  s: Scored; drafts: Record<string, Draft | "loading" | { error: string }>; onDraft: (id: string) => void;
  decisions: Record<string, "approved" | "rejected">; setDecisions: React.Dispatch<React.SetStateAction<Record<string, "approved" | "rejected">>>;
}) {
  const a = s.account;
  const live = new Set(s.intent.contributions.map((c) => c.signal.id));
  const expired = a.signals.filter((x) => !live.has(x.id));
  return (
    <section aria-label={`${a.name} details`} className="rise space-y-4">
      <div className="rounded-md border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">{a.name}</h2>
            <p className="text-sm text-muted-foreground">{a.industry} · {a.hq} · {a.employees.toLocaleString()} employees · owner {a.owner}</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">est. ad spend ${a.adSpendM}M/yr · {a.channels.join(" · ") || "single channel"}</p>
          </div>
          <span className={`rounded px-2 py-1 font-mono text-xs ${TIER_STYLE[s.tier]}`}>Tier {s.tier}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2 font-display">
          <Num label="Fit" v={s.fit.score} cls="text-fit" /><span className="text-2xl text-muted-foreground">×</span>
          <Num label="Intent (why now)" v={s.intent.score} cls="text-heat" /><span className="text-2xl text-muted-foreground">=</span>
          <Num label="Priority" v={s.priority} cls="" />
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">fit: {s.fit.parts.map(([k, v]) => `${k} ${v}`).join(" · ")}</span>
        </div>
      </div>

      <div className="rounded-md border-2 border-foreground/80 bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Next best action · rules, not AI</p>
          <p className="font-mono text-xs">{s.action.owner} · SLA {slaText(s.slaHours)}</p>
        </div>
        <h3 className="font-display text-2xl mt-1">{s.action.play}</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{s.action.steps.map((x) => <li key={x}>{x}</li>)}</ol>
      </div>

      <div className="rounded-md border bg-card p-5">
        <h3 className="font-display text-xl">Why now</h3>
        <ul className="mt-3 space-y-3">
          {s.intent.contributions.map(({ signal: x, points }) => (
            <li key={x.id} className="grid grid-cols-[auto_1fr_auto] gap-3">
              <span className={`h-fit rounded border px-1.5 font-mono text-[10px] ${PARTY_STYLE[SIGNALS[x.type].party]}`}>{SIGNALS[x.type].party}</span>
              <div className="min-w-0">
                <p className="text-sm"><span className="font-mono text-xs text-muted-foreground">[{x.id}]</span> {x.detail}{x.simulated && <span className="ml-2 font-mono text-[10px] text-heat">simulated inbound</span>}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{x.daysAgo === 0 ? "today" : `${x.daysAgo}d ago`} · {x.source} · half-life {SIGNALS[x.type].halfLife}d</p>
                <div className="mt-1 h-1 rounded bg-secondary"><div className="h-1 rounded bg-heat" style={{ width: `${(points / SIGNALS[x.type].weight) * 100}%` }} /></div>
              </div>
              <span className="font-mono text-sm">+{points}</span>
            </li>
          ))}
          {s.intent.multiThread > 0 && <li className="font-mono text-xs">+10 multi-threading bonus: {s.intent.engaged.length} people engaged</li>}
          {!s.intent.contributions.length && <li className="text-sm text-muted-foreground">No live signals. Fit alone never earns rep time.</li>}
          {expired.map((x) => (
            <li key={x.id} className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">[{x.id}] {x.detail} · {x.daysAgo}d ago · decayed to 0</li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-xl">Buying committee</h3>
          <p className="font-mono text-[11px] text-muted-foreground">roles by title rules · contacts would come from enrichment</p>
        </div>
        <ul className="mt-3 divide-y">
          {s.committee.map((c) => {
            const key = a.id + c.id;
            const d = drafts[key];
            return (
              <li key={c.id} className="py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`size-2 rounded-full ${c.engaged ? "bg-heat" : "bg-secondary"}`} title={c.engaged ? "Engaged" : "Not engaged"} />
                  <span className="font-medium">{c.name}</span>
                  <span className="text-sm text-muted-foreground">{c.title}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px]">{c.role}</span>
                  {s.target?.id === c.id && <span className="font-mono text-[10px] text-heat">← recommended first touch</span>}
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => onDraft(c.id)} disabled={d === "loading"}>
                    {d === "loading" ? "Drafting…" : d ? "Redraft" : "Draft email"}
                  </Button>
                </div>
                {d && d !== "loading" && ("error" in d ? <p className="mt-2 text-sm text-destructive">{d.error}</p> : <DraftView d={d} decision={decisions[key]} decide={(v) => setDecisions((x) => ({ ...x, [key]: v }))} />)}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Num({ label, v, cls }: { label: string; v: number; cls: string }) {
  return (
    <span className="grid">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-5xl leading-none ${cls}`}>{v}</span>
    </span>
  );
}

function DraftView({ d, decision, decide }: { d: Draft; decision?: "approved" | "rejected"; decide: (v: "approved" | "rejected") => void }) {
  const ev = Object.fromEntries(d.evidence.map((e) => [e.id, e.text]));
  return (
    <div className="rise mt-3 rounded border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span className={d.source === "deepseek" ? "text-heat" : "text-warm"}>{d.source === "deepseek" ? `AI · ${d.model}` : "Template fallback"}</span>
        <span>{d.latencyMs}ms</span>
        <span className={d.guard.ok ? "text-fit" : "text-destructive"}>{d.guard.ok ? `fact-check passed · ${d.guard.cited.length} claims cited` : `fact-check failed: ${d.guard.errors.join("; ")}`}</span>
        <span>angle: {d.angle}</span>
        {d.fallbackReason && <span>({d.fallbackReason})</span>}
      </div>
      <p className="mt-2 font-medium">Subject: {d.subject}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
        {d.body.split(/(\[[A-Z]+\d+\])/).map((part, i) => {
          const id = part.match(/^\[([A-Z]+\d+)\]$/)?.[1];
          return id ? (
            <sup key={i} tabIndex={0} title={ev[id]} className="mx-0.5 cursor-help rounded bg-secondary px-1 font-mono text-[10px] text-heat focus:outline-2">{id}</sup>
          ) : part;
        })}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {decision ? (
          <p className="font-mono text-xs">
            {decision === "approved" ? "Approved → would log a Salesforce Task and queue in the sequencer (simulated, nothing sent)" : "Rejected → reason + cited claim ids feed the eval set"}
          </p>
        ) : (
          <>
            <Button size="sm" onClick={() => decide("approved")} disabled={!d.guard.ok} title={d.guard.ok ? undefined : "Fails fact-check: redraft or edit first"}>Approve</Button>
            <Button size="sm" variant="ghost" onClick={() => decide("rejected")}>Reject</Button>
            <span className="font-mono text-[11px] text-muted-foreground">human approves every send · hover a citation to see its evidence</span>
          </>
        )}
      </div>
    </div>
  );
}

// On stacked (mobile/tablet) layouts the details sit below the list, so bring them into view.
function revealDetails() {
  if (window.matchMedia("(max-width: 1023px)").matches) setTimeout(() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" }), 0);
}
