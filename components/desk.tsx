"use client";
import { useMemo, useRef, useState } from "react";
import { motion, MotionConfig } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Tooltip } from "@base-ui/react/tooltip";
import { ArrowCounterClockwise, ArrowRight, Check, Diamond, EnvelopeSimple, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ACCOUNTS, INBOUND_EVENTS, type InboundType } from "@/lib/data";
import { addInbound, qualifyLead, rank, recommendExperience, salesforcePlan, SIGNALS, slaText, type LeadVerdict, type Scored, type SfOp, type Tier } from "@/lib/engine";

type Ev = { type: InboundType; contactId?: string };
type Draft = { source: "deepseek" | "template"; subject: string; body: string; guard: { ok: boolean; cited: string[] }; evidence: { id: string; text: string }[] };
type Snap = { rank: number; tier: Tier };
type Verdict = LeadVerdict & { change?: { from: Snap; to: Snap }; experience: ReturnType<typeof recommendExperience>; sf: SfOp[] };

const TIER = {
  1: { name: "Hot", gem: "text-hot", ring: "var(--hot)" },
  2: { name: "Warm", gem: "text-warm", ring: "var(--warm)" },
  3: { name: "Later", gem: "text-fg3", ring: "var(--fg3)" },
} as const;
const PARTY = { "1P": "Our site", "2P": "Partner", "3P": "Public" } as const;
const spring = { type: "spring", stiffness: 420, damping: 38 } as const;

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
  const [active, setActive] = useState<string | null>(null);
  const [bar, setBar] = useState({ email: "", title: "", type: "report_download" as InboundType });
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const toastSeq = useRef(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft | "loading" | { error: string }>>({});
  const [decisions, setDecisions] = useState<Record<string, "approved" | "skipped">>({});

  const ranked = useMemo(() => rank(applyEvents(events)), [events]);
  const cur = ranked.find((s) => s.account.id === selected) ?? ranked[0];
  const counts = ([1, 2, 3] as Tier[]).map((t) => ranked.filter((s) => s.tier === t).length);

  function run(f: (typeof PRESETS)[number]) {
    setActive(f.label);
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
    const from = snap(ranked, id);
    const n = ++toastSeq.current; // unique per toast so an old timer never hides a newer toast
    setToast({ text: `${v.account.name} moved #${from.rank} → #${to.rank}`, n });
    setTimeout(() => setToast((t) => (t?.n === n ? null : t)), 3500);
    setVerdict({
      ...v, change: { from, to }, experience: recommendExperience(v, f.type, to.tier),
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
    <MotionConfig reducedMotion="user">
      <Tooltip.Provider delay={150}>
        <div className="space-y-5">
          <header className="glow flex flex-wrap items-end justify-between gap-3 pt-1">
            <div>
              <span className="inline-flex h-6 items-center gap-2 rounded-full bg-component px-2.5 text-xs text-fg2"><span className="live-dot" />Live · 40 accounts</span>
              <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">Who to call <em className="text-fg3">today.</em></h1>
            </div>
            <div className="flex gap-1.5">
              {counts.map((n, i) => <TierBadge key={i} tier={(i + 1) as Tier} count={n} />)}
            </div>
          </header>

          <section aria-label="Try a website visit">
            <p className="label">01 — Try a website visit</p>
            <form onSubmit={(e) => { e.preventDefault(); run({ label: "Custom", ...bar }); }}
              className="glass mt-2 flex flex-wrap items-center gap-1 rounded-2xl border border-line p-1.5 shadow-sm focus-within:border-line-strong">
              <input required type="email" value={bar.email} onChange={(e) => setBar({ ...bar, email: e.target.value })} aria-label="Work email"
                placeholder="Type a work email to simulate a visit…" className="h-9 min-w-0 flex-[2_1_14rem] bg-transparent px-3 text-sm outline-none placeholder:text-fg3" />
              <input value={bar.title} onChange={(e) => setBar({ ...bar, title: e.target.value })} aria-label="Job title"
                placeholder="Job title" className="h-9 min-w-0 flex-[1_1_8rem] rounded-lg bg-component px-3 text-sm outline-none placeholder:text-fg3" />
              <select value={bar.type} onChange={(e) => setBar({ ...bar, type: e.target.value as InboundType })} aria-label="What they did"
                className="h-9 flex-[1_1_9rem] rounded-lg bg-component px-2 text-sm outline-none">
                {Object.keys(INBOUND_EVENTS).map((k) => <option key={k} value={k}>{SIGNALS[k as InboundType].label}</option>)}
              </select>
              <Button type="submit" variant="default" className="h-9 rounded-xl">Run<ArrowRight size={14} /></Button>
            </form>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => { setBar({ email: p.email, title: p.title, type: p.type }); run(p); }} aria-pressed={active === p.label}
                  className="text-sm text-fg2 hover:text-fg aria-pressed:text-hot-fg"><span aria-hidden className="mr-1.5 text-fg3">↳</span>{p.label}</button>
              ))}
              {Object.keys(events).length > 0 && (
                <button onClick={() => { setEvents({}); setVerdict(null); setDrafts({}); setActive(null); }} className="ml-auto inline-flex items-center gap-1 text-sm text-fg3 hover:text-fg">
                  <ArrowCounterClockwise size={13} />Reset
                </button>
              )}
            </div>
            {verdict && <VisitResult key={`${active}|${verdict.reason}|${verdict.change?.to.rank ?? ""}`} v={verdict} />}
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
            <section aria-label="Accounts" className="lg:sticky lg:top-4 lg:self-start">
              <p className="label mb-2">02 — Ranked accounts</p>
              <div className="overflow-hidden rounded-xl border border-line bg-card">
              <ol className="max-h-[calc(100vh-8.5rem)] overflow-y-auto p-1">
                {ranked.map((s, i) => (
                  <motion.li key={s.account.id} layout transition={spring} className="relative">
                    {flash?.id === s.account.id && (
                      <motion.span key={flash.n} aria-hidden className="pointer-events-none absolute inset-0 rounded-lg bg-hot-subtle" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 2.4, ease: "easeOut" }} />
                    )}
                    <button onClick={() => select(s.account.id)} aria-current={s.account.id === cur.account.id}
                      className="relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-component-hover aria-[current=true]:bg-component">
                      <NumberFlow value={i + 1} className="w-5 text-right font-mono text-xs text-fg3" />
                      <Ring value={s.priority} color={TIER[s.tier].ring} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{s.account.name}</span>
                        <span className="block truncate text-xs text-fg3">{s.top ? SIGNALS[s.top.type].label : "Quiet"}</span>
                      </span>
                      {events[s.account.id] && <span className="size-1.5 rounded-full bg-hot" title="New visit" />}
                    </button>
                  </motion.li>
                ))}
              </ol>
              </div>
            </section>

            <div id="details" className="scroll-mt-4">
              <p className="label mb-2">03 — Account</p>
              {/* enter-only animation: content never waits on an exit animation */}
              <motion.div key={cur.account.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                <Account s={cur} drafts={drafts} onDraft={draft} decisions={decisions} decide={(k, v) => setDecisions((x) => ({ ...x, [k]: v }))} />
              </motion.div>
            </div>
          </div>
        </div>
        {toast && (
          <motion.div key={toast.n} role="status" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="glass fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line px-4 py-2 text-sm shadow-lg">
            <Diamond size={13} weight="fill" className="text-hot" />{toast.text}
          </motion.div>
        )}
      </Tooltip.Provider>
    </MotionConfig>
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

function TierBadge({ tier, count }: { tier: Tier; count?: number }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-component px-2 text-sm">
      <Diamond size={13} weight="fill" className={TIER[tier].gem} />
      {TIER[tier].name}
      {count != null && <span className="rounded bg-component px-1.5 font-mono text-xs text-fg2"><NumberFlow value={count} /></span>}
    </span>
  );
}

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger className="cursor-help">{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6}>
          <Tooltip.Popup className="max-w-xs rounded-lg border border-line bg-modal px-2.5 py-1.5 text-xs text-fg shadow-lg">{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function Ring({ value, color, size = 64, label }: { value: number; color: string; size?: number; label?: string }) {
  const r = 15.5, c = 2 * Math.PI * r;
  return (
    <span className="inline-grid shrink-0 justify-items-center gap-1">
      <span className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r={r} fill="none" stroke="var(--component)" strokeWidth="3" />
          <motion.circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            initial={false} animate={{ strokeDasharray: `${(value / 100) * c} ${c}` }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }} />
        </svg>
        <NumberFlow value={value} className={size > 44 ? "font-serif text-2xl" : "font-mono text-[10px] text-fg2"} />
      </span>
      {label && <span className="text-xs text-fg3">{label}</span>}
    </span>
  );
}

const VERB = { route: ["Send to sales", "bg-hot-subtle text-hot-fg"], enrich: ["Look up first", "bg-warm-subtle text-warm-fg"], nurture: ["Nurture", "bg-brand-subtle text-brand-fg"], exclude: ["Ignore", "bg-component text-fg2"] } as const;
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
  const [verb, tone] = VERB[v.verdict];
  return (
    <motion.div data-visit-result initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="mt-3 grid gap-1.5 rounded-2xl border border-line bg-card p-1.5 md:grid-cols-[minmax(0,0.9fr)_1fr_1fr]">
        <div className="flex flex-col justify-center gap-1.5 rounded-[10px] p-3">
          <span className={`w-fit rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>{verb}</span>
          <p className="text-sm font-medium">{v.reason}</p>
          {v.change && (
            <p className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="font-mono text-fg3">#{v.change.from.rank}</span><TierBadge tier={v.change.from.tier} />
              <ArrowRight size={14} className="text-fg3" />
              <span className="font-mono">#{v.change.to.rank}</span><TierBadge tier={v.change.to.tier} />
            </p>
          )}
        </div>
        <div className="rounded-[10px] bg-sunken p-3">
          <p className="text-xs text-fg3">They see next</p>
          <ul className="mt-1 space-y-0.5 text-sm">{v.experience.assets.map((x) => <li key={x.id}>{x.title}</li>)}</ul>
          <p className="mt-1 text-sm text-hot-fg">{v.experience.cta}</p>
        </div>
        <div className="rounded-[10px] bg-sunken p-3">
          <p className="text-xs text-fg3">Salesforce · demo, not written</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {v.sf.length ? v.sf.map((o, i) => <li key={i}>{sfLine(o)}</li>) : <li className="text-fg3">Nothing new to write</li>}
          </ul>
        </div>
      </div>
    </motion.div>
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
    <section aria-label={`${a.name} details`} className="space-y-3">
      <div className="gridlines flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-card p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-3xl">{a.name}</h2>
            <TierBadge tier={s.tier} />
          </div>
          <p className="mt-1 text-sm text-fg2">{a.industry.split(" · ")[0]} · {a.hq} · ${a.adSpendM}M ad spend · {a.channels.length} channels</p>
        </div>
        <div className="flex gap-4">
          <Ring value={s.fit.score} color="var(--brand)" label="Fit" />
          <Ring value={s.intent.score} color="var(--warm)" label="Timing" />
          <Ring value={s.priority} color={TIER[s.tier].ring} label="Score" />
        </div>
      </div>

      <div className="rounded-xl border border-line-strong bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-serif text-2xl">{s.action.play}</h3>
          <span className="text-sm text-fg2">{s.action.owner}{s.slaHours != null && ` · ${slaText(s.slaHours)}`}</span>
        </div>
        <ol className="mt-3 space-y-1.5 text-sm">
          {s.action.steps.map((x, i) => (
            <li key={x} className="flex items-center gap-2.5">
              <span className="grid size-5 place-items-center rounded-md bg-component font-mono text-[11px] text-fg2">{i + 1}</span>{x}
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <h3 className="text-sm font-medium text-fg2">Why now</h3>
        {s.intent.contributions.length ? (
          <ul className="mt-3 space-y-3">
            {s.intent.contributions.map(({ signal: x, points }) => (
              <li key={x.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{x.detail}{x.simulated && <span className="ml-2 rounded-md bg-hot-subtle px-1.5 py-0.5 text-xs text-hot-fg">new</span>}</span>
                  <Tip label={`Source: ${x.source}`}><span className="shrink-0 text-xs text-fg3">{PARTY[SIGNALS[x.type].party]} · {x.daysAgo === 0 ? "today" : `${x.daysAgo}d ago`}</span></Tip>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-component">
                  <motion.div className="h-1 rounded-full bg-warm" initial={{ width: 0 }} animate={{ width: `${(points / SIGNALS[x.type].weight) * 100}%` }} transition={{ duration: 0.6 }} />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-fg3">Nothing recent. Good fit alone doesn&apos;t earn a call.</p>}
        {older > 0 && <p className="mt-3 text-xs text-fg3">{older} older {older === 1 ? "signal" : "signals"} faded out</p>}
      </div>

      <div className="rounded-xl border border-line bg-card p-2">
        <h3 className="px-3 pt-3 text-sm font-medium text-fg2">People</h3>
        <ul className="mt-1">
          {s.committee.map((c) => {
            const key = a.id + c.id;
            const d = drafts[key];
            return (
              <li key={c.id} className="rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-medium ${c.engaged ? "bg-hot text-white" : "bg-component text-fg2"}`}>
                    {c.name.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="rounded-md bg-component px-1.5 py-0.5 text-xs text-fg2">{c.role}</span>
                      {s.target?.id === c.id && <span className="text-xs text-hot-fg">Start here</span>}
                    </p>
                    <p className="truncate text-xs text-fg3">{c.title}</p>
                  </div>
                  <Button onClick={() => onDraft(c.id)} disabled={d === "loading"}>
                    <EnvelopeSimple size={14} />{d === "loading" ? "Writing…" : d ? "Rewrite" : "Write email"}
                  </Button>
                </div>
                {d && d !== "loading" && ("error" in d
                  ? <p className="mt-2 text-sm text-hot-fg">{d.error}</p>
                  : <DraftView d={d} decision={decisions[key]} decide={(v) => decide(key, v)} />)}
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
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-3 rounded-lg border border-line bg-sunken p-4">
      <p className="text-sm font-medium">{d.subject}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg2">
        {d.body.split(/(\[[A-Z]+\d+\])/).map((part, i) => {
          const id = part.match(/^\[([A-Z]+\d+)\]$/)?.[1];
          return id ? <Tip key={i} label={ev[id] ?? "Unknown source"}><sup className="mx-0.5 rounded bg-brand-subtle px-1 font-mono text-[10px] text-brand-fg">{id}</sup></Tip> : part;
        })}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`mr-auto inline-flex items-center gap-1 text-xs ${d.guard.ok ? "text-good-fg" : "text-hot-fg"}`}>
          {d.guard.ok ? <Check size={13} weight="bold" /> : <X size={13} weight="bold" />}
          {d.guard.ok ? `Every claim has a source (${d.guard.cited.length})` : "Has a claim without a source"}
          {d.source === "template" && " · template"}
        </span>
        {decision ? (
          <span className="text-sm text-fg2">{decision === "approved" ? "Approved. Not sent (demo)." : "Skipped."}</span>
        ) : (
          <>
            <Button variant="ghost" onClick={() => decide("skipped")}>Skip</Button>
            <Button variant="default" onClick={() => decide("approved")} disabled={!d.guard.ok}><Check size={14} />Approve</Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
