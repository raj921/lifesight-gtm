// Run: node lib/engine.test.ts  (Node strips the types)
import assert from "node:assert/strict";
import { rank, scoreAccount, qualifyLead, guardDraft, addInbound, roleOf, normalizeCitations, isInboundType, recommendExperience, salesforcePlan, ASSETS, isQuotable } from "./engine.ts";
import { ACCOUNTS, INBOUND_EVENTS } from "./data.ts";

const byId = (id: string) => ACCOUNTS.find((a) => a.id === id)!;

// Ranking: strong fit + fresh signals on top; hot intent at a poor-fit company is gated out of Tier 1.
const ranked = rank(ACCOUNTS);
assert.equal(ranked.length, 40);
assert.ok(["northwind", "brightleaf"].includes(ranked[0].account.id), `top was ${ranked[0].account.id}`);
const tide = scoreAccount(byId("tidewater"));
assert.ok(tide.intent.score >= 50 && tide.tier === 3, "high intent, poor fit must stay Tier 3");
assert.equal(scoreAccount(byId("brightleaf")).slaHours, 4, "fresh pricing visits demand a same-day SLA");

// The demo moment: dormant Halcyon + VP Analytics downloads the report -> Tier 3 to Tier 1, action changes, target is the engaged person.
const before = scoreAccount(byId("halcyon"));
const after = scoreAccount(addInbound(byId("halcyon"), "report_download", INBOUND_EVENTS.report_download, "hb1"));
assert.equal(before.tier, 3);
assert.equal(after.tier, 1);
assert.notEqual(before.action.play, after.action.play);
assert.equal(after.target?.id, "hb1");
assert.ok(after.action.steps[0].includes("within 24 hours"));

// Roles
assert.equal(roleOf("Chief Marketing Officer"), "Economic buyer");
assert.equal(roleOf("VP, Marketing Analytics & Insights"), "Champion");
assert.equal(roleOf("VP Finance, FP&A"), "Finance approver");
assert.equal(roleOf("Head of Performance Marketing"), "Practitioner");

// Inbound qualification
assert.equal(qualifyLead("priya.raman@halcyon-beauty.example", "VP, Marketing Analytics & Insights", ACCOUNTS).verdict, "route");
assert.equal(qualifyLead("someone@haus.io", "Growth", ACCOUNTS).verdict, "exclude");
assert.equal(qualifyLead("kid@state.edu", "Student", ACCOUNTS).verdict, "nurture");
assert.equal(qualifyLead("me@gmail.com", "CMO", ACCOUNTS).verdict, "enrich");
assert.equal(qualifyLead("x@unknown-co.example", "CMO", ACCOUNTS).verdict, "enrich");
assert.equal(qualifyLead("not-an-email", "CMO", ACCOUNTS).verdict, "exclude");

// Hallucination guard: positive control passes, each failure mode is caught.
const ev = [{ id: "S1", text: "Posted a role asking for MMM, 4 visits" }, { id: "P1", text: "Lifesight unifies MMM" }];
assert.ok(guardDraft("Saw the MMM role [S1]. We unify it [P1].", ev).ok);
assert.ok(guardDraft("You had 4 visits [S1].", ev).ok);
assert.ok(!guardDraft("No citations here.", ev).ok);
assert.ok(!guardDraft("Fake fact [S9].", ev).ok);
assert.ok(!guardDraft("You grew 37% last year [S1].", ev).ok);

// BUG 2: firing the same inbound event twice must not stack duplicate signals and inflate intent.
const once = addInbound(byId("halcyon"), "report_download", INBOUND_EVENTS.report_download, "hb1");
const twice = addInbound(once, "report_download", INBOUND_EVENTS.report_download, "hb1");
assert.equal(twice.signals.length, once.signals.length, "duplicate same-day event was stacked");
assert.equal(scoreAccount(twice).priority, scoreAccount(once).priority);
// ...but a different person or a different event still counts.
assert.equal(addInbound(once, "report_download", INBOUND_EVENTS.report_download, "hb2").signals.length, once.signals.length + 1);
assert.equal(addInbound(once, "pricing_visit", INBOUND_EVENTS.pricing_visit, "hb1").signals.length, once.signals.length + 1);

// BUG 1: prototype keys must not pass as event types.
for (const k of Object.keys(INBOUND_EVENTS)) assert.ok(isInboundType(k), `${k} missing from INBOUND_TYPES`);
for (const bad of ["toString", "__proto__", "constructor", "hasOwnProperty", "", undefined, null, 42]) assert.ok(!isInboundType(bad), `accepted ${String(bad)}`);

// BUG 4: models sometimes write grouped citations like [S1, P2]; they must count, not fail the guard.
assert.equal(normalizeCitations("New CMO [S1, P1]."), "New CMO [S1][P1].");
assert.ok(guardDraft(normalizeCitations("Saw the MMM role [S1, P1]."), ev).ok);
assert.ok(!guardDraft(normalizeCitations("Fake [S1, S9]."), ev).ok, "unknown id inside a group must still fail");

// Inbound conversion: the experience depends on verdict, role, channels and heat.
const priya = qualifyLead("priya.raman@halcyon-beauty.example", "VP, Marketing Analytics & Insights", ACCOUNTS);
assert.equal(recommendExperience(priya, "report_download", 1).assets[0], ASSETS.readiness, "champion who read a report gets the assessment next");
assert.match(recommendExperience(priya, "pricing_visit", 1).cta, /Book time with Jordan Ellis/);
const cmo = qualifyLead("maya.lindqvist@northwind-outfitters.example", "Chief Marketing Officer", ACCOUNTS);
assert.equal(recommendExperience(cmo, "report_download", 1).assets[0], ASSETS.cfoGuide);
const marco = qualifyLead("marco.bianchi@halcyon-beauty.example", "Director, Paid Social", ACCOUNTS);
assert.equal(recommendExperience(marco, "webinar", 2).assets[0], ASSETS.geoPlanner, "CTV/retail-media practitioner gets the geo planner");
assert.match(recommendExperience(qualifyLead("a@haus.io", "Analyst", ACCOUNTS), "assessment").cta, /no follow-up/);

// Salesforce plan: routed inbound updates the Account, upserts the Contact and creates an owner Task with the SLA.
const halAfter = scoreAccount(addInbound(byId("halcyon"), "report_download", INBOUND_EVENTS.report_download, "hb1"));
const plan = salesforcePlan(priya, "priya.raman@halcyon-beauty.example", "report_download", halAfter, before);
assert.deepEqual(plan.map((o) => o.op), ["update", "upsert", "create"]);
assert.equal(plan[0].fields.Tier__c, "3 → 1");
assert.equal(plan[2].fields.OwnerId, "Jordan Ellis");
assert.equal(plan[2].fields.Due, "now + 24h");
assert.equal(salesforcePlan(qualifyLead("a@haus.io", "x", ACCOUNTS), "a@haus.io", "assessment")[0].op, "skip", "competitors are never written as Leads");
assert.equal(salesforcePlan(qualifyLead("me@gmail.com", "CMO", ACCOUNTS), "me@gmail.com", "pricing_visit")[0].fields.Status, "Needs enrichment");
const newPerson = qualifyLead("new.person@halcyon-beauty.example", "Head of Growth", ACCOUNTS);
assert.equal(salesforcePlan(newPerson, "new.person@halcyon-beauty.example", "webinar", halAfter)[1].object, "Lead (matched to Account)");

// Creepy-tracking guard: drafts must not reveal that we watched them.
assert.ok(!guardDraft("Saw the report you pulled today [S1].", ev).ok, "'you pulled' leaks tracking");
assert.ok(!guardDraft("Thanks for your visit to our pricing page [S1].", ev).ok);
assert.ok(!guardDraft("Noticed you downloaded our guide [S1].", ev).ok);
assert.ok(guardDraft("Teams hiring for MMM often ask this [S1].", ev).ok, "topic-level phrasing is fine");

// Every statement needs its own citation; greetings and questions do not.
assert.ok(!guardDraft("New SVP [S1]. Your attribution is broken. Your CFO is unhappy.", ev).ok, "uncited sentences must fail");
assert.ok(guardDraft("Hi Priya,\n\nThe MMM role is open [S1]. Who owns it?", ev).ok);
assert.ok(guardDraft("The MMM role is open. [S1] We unify it. [P1]", ev).ok, "citation after the full stop belongs to that sentence");
assert.ok(!guardDraft("The MMM role is open [S1].", ev, "You saved 40%").ok, "the subject is checked too");

// Private first- and second-party signals set the topic but are never quoted to a prospect.
assert.ok(byId("northwind").signals.every(isQuotable));
assert.ok(!byId("brightleaf").signals.some(isQuotable));

// A Hot or Warm action never reads "no deadline".
for (const s of rank(ACCOUNTS)) if (s.tier < 3) assert.ok(s.slaHours != null, `${s.account.name} has no deadline`);

assert.ok(guardDraft("The MMM role is open [S1]. How does Kindred Pet Co. measure this?", ev).ok, "a company suffix does not end a sentence");

console.log("engine checks passed");
