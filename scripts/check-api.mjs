// Needs `pnpm dev` on :3000. Drafts for the post-inbound Halcyon case and checks the guard held.
const res = await fetch("http://localhost:3000/api/draft", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ accountId: "halcyon", contactId: "hb1", events: [{ type: "report_download", contactId: "hb1" }] }),
});
const d = await res.json();
const ids = new Set(d.evidence.map((e) => e.id));
const cited = [...d.body.matchAll(/\[([A-Z]+\d+)\]/g)].map((m) => m[1]);
console.log(d.source, d.latencyMs + "ms", JSON.stringify(d.subject));
console.log(d.body);
if (res.status !== 200 || d.source !== "deepseek") throw new Error(`expected deepseek draft, got ${d.source}: ${d.fallbackReason}`);
if (!d.guard.ok || !cited.length || !cited.every((c) => ids.has(c))) throw new Error("citation guard failed");
const bad = await fetch("http://localhost:3000/api/draft", { method: "POST", body: JSON.stringify({ accountId: "nope" }) });
if (bad.status !== 400) throw new Error("unknown account should 400");
// BUG 1: prototype-key event type must be rejected, not silently injected.
const proto = await fetch("http://localhost:3000/api/draft", { method: "POST", body: JSON.stringify({ accountId: "halcyon", events: [{ type: "toString" }] }) });
if (proto.status !== 400) throw new Error(`event type "toString" should 400, got ${proto.status}`);
// BUG 3: malformed JSON gets a clear error, not "Unknown account".
const junk = await fetch("http://localhost:3000/api/draft", { method: "POST", body: "not json" });
const junkBody = await junk.json();
if (junk.status !== 400 || !/json/i.test(junkBody.error)) throw new Error(`bad JSON should say so, got ${junk.status} ${junkBody.error}`);
console.log("api check passed");
