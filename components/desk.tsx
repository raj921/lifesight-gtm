"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ACCOUNTS, INBOUND_EVENTS, type InboundType } from "@/lib/data";
import { addInbound, qualifyLead, rank, recommendExperience, salesforcePlan, SIGNALS, slaText, type LeadVerdict, type Scored, type SfOp, type Tier } from "@/lib/engine";

type Ev = { type: InboundType; contactId?: string };
type Draft = { source: "deepseek" | "template"; subject: string; body: string; guard: { ok: boolean; cited: string[] }; evidence: { id: string; text: string }[] };
type Snap = { rank: number; tier: Tier };
type Verdict = LeadVerdict & { change?: { from: Snap; to: Snap }; experience: ReturnType<typeof recommendExperience>; sf: SfOp[] };

const TIER = { 1: { name: "Hot", cls: "bg-heat text-white", ring: "var(--heat)" }, 2: { name: "Warm", cls: "bg-warm text-black", ring: "var(--warm)" }, 3: { name: "Later", cls: "bg-secondary text-muted-foreground", ring: "var(--muted-foreground)" } } as const;
const PARTY = { "1P": "Our site", "2P": "Partner", "3P": "Public" } as const;

const PRESETS: { label: string; email: string; title: string; type: InboundType }[] = [
  { label: "Halcyon reads our report", email: "priya.raman@halcyon-beauty.example", title: "VP, Marketing Analytics & Insights", type: "report_download" },
  { label: "A competitor visits", email: "analyst@haus.io", title: "Growth Analyst", type: "assessment" },
  { label: "A student signs up", email: "j.doe@stateu.edu", title: "MBA Student", type: "report_download" },
  { label: "Gmail sign-up", email: "cmo.mike@gmail.com", title: "CMO", type: "pricing_visit" },
];

export function Desk() {
  const [events, setEvents] = useState<Record<string, Ev[]>>({});
  const [selected, setSelected] = useState("brightleaf");
  const [flash, setFlash] = useState<{ id: string; n: number } | null>(null);
  const [form, setForm] = useState(PRESETS[0]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft | "loading" | { error: string }>>({});
  const [decisions, setDecisions] = useState<Record<string, "approved" | "skipped">>({});

  const ranked = useMemo(() => rank(applyEvents(events)), [events]);
  const cur = ranked.find((s) => s.account.id === selected) ?? ranked[0];
  const counts = ([1, 2, 3] as Tier[]).map((t) => ranked.filter((s) => s.tier === t).length);

  function run(f: (typeof PRESETS)[number]) {
    setForm(f);
    const v = qualifyLead(f.email, f.title, applyEvents(events));
    if (v.verdict !== "route" || !v.account) return setVerdict({ ...v, experience: recommendExperience(v, f.type), sf: salesforcePlan(v, f.email, f.type) });
    const id = v.account.id;
    if ((events[id] ?? []).some((x) => x.type === f.type && x.contactId === v.contact?.id))
      return setVerdict({ ...v, reason: `${v.reason} · already counted today`, experience: recommendExperience(v, f.type, snap(ranked, id).tier), sf: [] });
    const next = { ...events, [id]: [...(events[id] ?? []), { type: f.type, contactId: v.contact?.id }] };
    const nextRanked = rank(applyEvents(next));
    const to = snap(nextRanked, id);
    setEvents(next);
    setSelected(id);
    setFlash((p) => ({ id, n: (p?.n ?? 0) + 1 }));
    setDrafts({});
    setVerdict({
      ...v, change: { from: snap(ranked, id), to }, experience: recommendExperience(v, f.type, to.tier),
      sf: salesforcePlan(v, f.email, f.type, nextRanked.find((x) => x.account.id === id), ranked.find((x) => x.account.id === id)),
    });
    revealDetails();
  }

  function select(id: string) {
    setSelected(id);
    revealDetails();
  }

  async function draft(contactId: string) {
    const key = cur.account.id + contactId;
    setDrafts((d) => ({ ...d, [key]: "loading" }));
    setDecisions((d) => { const n = { ...d }; delete n[key]; return n; }); // a new draft needs a new review
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: cur.account.id, contactId, events: events[cur.account.id] ?? [] }),
      });
      const data = await res.json();
      setDrafts((d) => ({ ...d, [key]: res.ok ? data : { error: data.error ?? "Something went wrong" } }));
    } catch {
      setDrafts((d) => ({ ...d, [key]: { error: "Couldn't reach the server" } }));
    }
  }

  return (
    <div className="space-y-6">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl md:text-5xl">Who to call <em className="text-heat">today</em></h1>
        <div className="flex gap-2">
          {counts.map((n, i) => (
            <span key={i} className={`rounded-full px-3 py-1 text-sm ${TIER[(i + 1) as Tier].cls}`}>{n} {TIER[(i + 1) as Tier].name.toLowerCase()}</span>
          ))}
        </div>
      </header>

      <section aria-label="Try a website visit" className="rise rounded-lg border bg-card p-4 [animation-delay:60ms]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium">Try a website visit</span>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => run(p)} aria-pressed={form.label === p.label && !!verdict}
              className="rounded-full border px-3 py-1.5 text-sm hover:bg-secondary aria-pressed:border-heat aria-pressed:text-heat">{p.label}</button>
          ))}
          <details className="open:basis-full">
            <summary className="cursor-pointer list-none rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Custom…</summary>
            <CustomVisit onRun={run} />
          </details>
          {Object.keys(events).length > 0 && (
            <button onClick={() => { setEvents({}); setVerdict(null); setDrafts({}); }} className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline">Reset</button>
          )}
        </div>
        {verdict && <VisitResult v={verdict} />}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section aria-label="Accounts" className="rounded-lg border bg-card lg:sticky lg:top-20 lg:self-start">
          <ol className="max-h-[calc(100vh-8rem)] overflow-y-auto divide-y">
            {ranked.map((s, i) => (
              <li key={flash?.id === s.account.id ? `${s.account.id}-${flash.n}` : s.account.id} className={flash?.id === s.account.id ? "flash" : ""}>
                <button onClick={() => select(s.account.id)} aria-current={s.account.id === cur.account.id}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/60 aria-[current=true]:bg-secondary">
                  <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <Ring value={s.priority} color={TIER[s.tier].ring} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.account.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{s.top ? SIGNALS[s.top.type].label : "Quiet"}</span>
                  </span>
                  {events[s.account.id] && <span className="size-2 rounded-full bg-heat" title="New visit" />}
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div id="details" className="scroll-mt-20">
          <Account key={cur.account.id} s={cur} drafts={drafts} onDraft={draft} decisions={decisions} decide={(k, v) => setDecisions((x) => ({ ...x, [k]: v }))} />
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">Demo data. Fake companies and people. Nothing is ever sent.</p>
    </div>
  );
}

function snap(r: Scored[], id: string): Snap {
  const i = r.findIndex((s) => s.account.id === id);
  return { rank: i + 1, tier: r[i].tier };
}
function applyEvents(events: Record<string, Ev[]>) {
  return ACCOUNTS.map((a) => (events[a.id] ?? []).reduce((acc, e) => addInbound(acc, e.type, INBOUND_EVENTS[e.type], e.contactId), a));
}
// When the list and details are stacked (phones, tablets), jump to the details.
function revealDetails() {
  if (window.matchMedia("(max-width: 1023px)").matches) setTimeout(() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" }), 0);
}

function Ring({ value, color, size = 72, label }: { value: number; color: string; size?: number; label?: string }) {
  const r = 15.5, c = 2 * Math.PI * r;
  return (
    <span className="inline-grid shrink-0 justify-items-center gap-1">
      <span className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r={r} fill="none" stroke="var(--secondary)" strokeWidth="3" />
          <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} className="transition-[stroke-dasharray] duration-700" />
        </svg>
        <span className={size > 50 ? "font-display text-2xl" : "font-mono text-[11px]"}>{value}</span>
      </span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  );
}

function CustomVisit({ onRun }: { onRun: (f: (typeof PRESETS)[number]) => void }) {
  const [f, setF] = useState({ label: "Custom", email: "", title: "", type: "report_download" as InboundType });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onRun(f); }} className="mt-2 grid w-full max-w-md gap-2 rounded-lg border bg-background p-3 sm:grid-cols-2">
      <input required type="email" placeholder="Work email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="h-9 rounded border bg-background px-2 text-sm" aria-label="Work email" />
      <input placeholder="Job title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="h-9 rounded border bg-background px-2 text-sm" aria-label="Job title" />
      <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as InboundType })} className="h-9 rounded border bg-background px-2 text-sm" aria-label="What they did">
        {Object.keys(INBOUND_EVENTS).map((k) => <option key={k} value={k}>{SIGNALS[k as InboundType].label}</option>)}
      </select>
      <Button type="submit" className="bg-heat text-white hover:bg-heat/85">Run</Button>
    </form>
  );
}

const TONE = { route: "bg-heat text-white", enrich: "bg-warm text-black", nurture: "bg-fit text-white", exclude: "bg-secondary text-muted-foreground" };
const VERB = { route: "Send to sales", enrich: "Look up first", nurture: "Nurture", exclude: "Ignore" };
const tierName = (t: string | number) => String(t).replace(/[123]/g, (d) => TIER[+d as Tier].name);

function sfLine(o: SfOp) {
  const f = o.fields;
  if (o.op === "skip") return "No record. Domain blocked.";
  if (o.object.startsWith("Account")) return `${o.object.slice(8)}: ${tierName(f.Tier__c)}`;
  if (o.object.startsWith("Contact")) return `${o.object.slice(8)} tagged ${f.Buying_Role__c}`;
  if (o.object === "Task") return `Task for ${f.OwnerId}, due in ${String(f.Due).replace("now + ", "")}`;
  return `New lead · ${f.Status ?? f.Buying_Role__c}`;
}

function VisitResult({ v }: { v: Verdict }) {
  return (
    <div className="rise mt-4 grid gap-3 md:grid-cols-[auto_1fr_1fr]">
      <div className="flex flex-col justify-center gap-2 md:pr-4">
        <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[v.verdict]}`}>{VERB[v.verdict]}</span>
        <p className="font-medium">{v.reason}</p>
        {v.change && (
          <p className="flex items-center gap-2 text-sm">
            <span className="font-mono text-muted-foreground">#{v.change.from.rank}</span>
            <span className={`rounded px-1.5 text-xs ${TIER[v.change.from.tier].cls}`}>{TIER[v.change.from.tier].name}</span>
            <span aria-hidden>→</span>
            <span className="font-mono font-semibold">#{v.change.to.rank}</span>
            <span className={`rounded px-1.5 text-xs ${TIER[v.change.to.tier].cls}`}>{TIER[v.change.to.tier].name}</span>
          </p>
        )}
      </div>
      <div className="rounded-md bg-background p-3">
        <p className="text-xs text-muted-foreground">They see next</p>
        <ul className="mt-1 space-y-0.5 text-sm">{v.experience.assets.map((x) => <li key={x.id}>{x.title}</li>)}</ul>
        <p className="mt-1 text-sm text-heat">{v.experience.cta}</p>
      </div>
      <div className="rounded-md bg-background p-3">
        <p className="text-xs text-muted-foreground">Salesforce (demo, not written)</p>
        <ul className="mt-1 space-y-0.5 text-sm">
          {v.sf.length ? v.sf.map((o, i) => <li key={i} title={Object.entries(o.fields).map(([k, x]) => `${k}: ${x}`).join("\n")}>{sfLine(o)}</li>) : <li className="text-muted-foreground">Nothing new to write</li>}
        </ul>
      </div>
    </div>
  );
}

function Account({ s, drafts, onDraft, decisions, decide }: {
  s: Scored; drafts: Record<string, Draft | "loading" | { error: string }>; onDraft: (id: string) => void;
  decisions: Record<string, "approved" | "skipped">; decide: (key: string, v: "approved" | "skipped") => void;
}) {
  const a = s.account;
  const live = new Set(s.intent.contributions.map((c) => c.signal.id));
  const older = a.signals.filter((x) => !live.has(x.id)).length;
  return (
    <section aria-label={`${a.name} details`} className="rise space-y-4">
      <div className="rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-3xl">{a.name}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs ${TIER[s.tier].cls}`}>{TIER[s.tier].name}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{a.industry.split(" · ")[0]} · {a.hq} · ${a.adSpendM}M ad spend · {a.channels.length} channels</p>
          </div>
          <div className="flex gap-4" title={`Fit: ${s.fit.parts.map(([k, v]) => `${k} ${v}`).join(", ")}`}>
            <Ring value={s.fit.score} color="var(--fit)" label="Fit" />
            <Ring value={s.intent.score} color="var(--heat)" label="Timing" />
            <Ring value={s.priority} color={TIER[s.tier].ring} label="Score" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-foreground/70 bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl">{s.action.play}</h3>
          <span className="text-sm text-muted-foreground">{s.action.owner}{s.slaHours != null && ` · ${slaText(s.slaHours)}`}</span>
        </div>
        <ol className="mt-2 space-y-1 text-sm">
          {s.action.steps.map((x, i) => <li key={x} className="flex gap-2"><span className="font-mono text-muted-foreground">{i + 1}</span>{x}</li>)}
        </ol>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h3 className="font-display text-xl">Why now</h3>
        {s.intent.contributions.length ? (
          <ul className="mt-3 space-y-3">
            {s.intent.contributions.map(({ signal: x, points }) => (
              <li key={x.id} title={`Source: ${x.source}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{x.detail}{x.simulated && <span className="ml-2 rounded bg-heat/15 px-1.5 text-xs text-heat">new</span>}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{PARTY[SIGNALS[x.type].party]} · {x.daysAgo === 0 ? "today" : `${x.daysAgo}d ago`}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-heat transition-[width] duration-700" style={{ width: `${(points / SIGNALS[x.type].weight) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted-foreground">Nothing recent. Good fit alone doesn&apos;t earn a call.</p>}
        {older > 0 && <p className="mt-3 text-xs text-muted-foreground">{older} older {older === 1 ? "signal" : "signals"} faded out</p>}
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h3 className="font-display text-xl">People</h3>
        <ul className="mt-2 divide-y">
          {s.committee.map((c) => {
            const key = a.id + c.id;
            const d = drafts[key];
            return (
              <li key={c.id} className="py-3">
                <div className="flex items-center gap-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-medium ${c.engaged ? "bg-heat text-white" : "bg-secondary"}`} title={c.engaged ? "Active recently" : undefined}>
                    {c.name.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <span className="rounded-full bg-secondary px-2 text-xs">{c.role}</span>
                      {s.target?.id === c.id && <span className="text-xs text-heat">Start here</span>}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{c.title}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onDraft(c.id)} disabled={d === "loading"}>
                    {d === "loading" ? "Writing…" : d ? "Rewrite" : "Write email"}
                  </Button>
                </div>
                {d && d !== "loading" && ("error" in d ? <p className="mt-2 text-sm text-destructive">{d.error}</p> : <DraftView d={d} decision={decisions[key]} decide={(v) => decide(key, v)} />)}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function DraftView({ d, decision, decide }: { d: Draft; decision?: "approved" | "skipped"; decide: (v: "approved" | "skipped") => void }) {
  const ev = Object.fromEntries(d.evidence.map((e) => [e.id, e.text]));
  return (
    <div className="rise mt-3 rounded-md border bg-background p-4">
      <p className="font-medium">{d.subject}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
        {d.body.split(/(\[[A-Z]+\d+\])/).map((part, i) => {
          const id = part.match(/^\[([A-Z]+\d+)\]$/)?.[1];
          return id ? <sup key={i} tabIndex={0} title={ev[id]} className="mx-0.5 cursor-help rounded bg-secondary px-1 font-mono text-[10px] text-heat">{id}</sup> : part;
        })}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`mr-auto text-xs ${d.guard.ok ? "text-fit" : "text-destructive"}`}>
          {d.guard.ok ? `✓ Every claim has a source (${d.guard.cited.length})` : "✗ Has a claim without a source"}
          {d.source === "template" && " · template"}
        </span>
        {decision ? (
          <span className="text-sm">{decision === "approved" ? "Approved. Not sent (demo)." : "Skipped."}</span>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => decide("skipped")}>Skip</Button>
            <Button size="sm" onClick={() => decide("approved")} disabled={!d.guard.ok}>Approve</Button>
          </>
        )}
      </div>
    </div>
  );
}
