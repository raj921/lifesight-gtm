// SYNTHETIC data. Every company, person and domain is fictional (.example TLD). `source` names the real-world feed it stands in for.
import type { Account, Contact, Signal, SignalType } from "./engine";

const c = (id: string, name: string, title: string, domain: string): Contact => ({
  id, name, title, email: `${name.toLowerCase().replace(/[^a-z ]/g, "").replace(" ", ".")}@${domain}`,
});

const HERO: Account[] = [
  {
    id: "northwind", name: "Northwind Outfitters", domain: "northwind-outfitters.example", industry: "Apparel · DTC + wholesale", hq: "Denver, CO",
    employees: 3200, adSpendM: 85, channels: ["Meta", "Google Search", "YouTube", "CTV", "Amazon Ads", "TikTok"], hasAnalyticsTeam: true, owner: "Jordan Ellis",
    signals: [
      { id: "S1", type: "hiring_measurement", daysAgo: 6, detail: "Posted 'Senior Manager, Marketing Science' asking for MMM and geo-holdout testing experience", source: "LinkedIn Jobs (3P)" },
      { id: "S2", type: "exec_change", daysAgo: 21, detail: "Appointed Maya Lindqvist as Chief Marketing Officer", source: "Press release (3P)", contactId: "nw1" },
      { id: "S3", type: "channel_expansion", daysAgo: 12, detail: "Launched first CTV campaign on two streaming platforms", source: "Ad library / creative tracking (3P)" },
    ],
    contacts: [c("nw1", "Maya Lindqvist", "Chief Marketing Officer", "northwind-outfitters.example"), c("nw2", "Theo Brandt", "Director, Growth Analytics", "northwind-outfitters.example"), c("nw3", "Sana Okafor", "Head of Performance Marketing", "northwind-outfitters.example"), c("nw4", "Luis Ferreira", "VP Finance, FP&A", "northwind-outfitters.example")],
  },
  {
    id: "brightleaf", name: "Brightleaf Home", domain: "brightleaf-home.example", industry: "Home goods · DTC", hq: "Austin, TX",
    employees: 1400, adSpendM: 32, channels: ["Meta", "Google Search", "Pinterest", "Amazon Ads", "Podcast"], hasAnalyticsTeam: true, owner: "Priya Shah",
    signals: [
      { id: "S1", type: "pricing_visit", daysAgo: 1, detail: "4 visits to /pricing and /compare/lifesight-vs-measured from the Head of Growth", source: "Website visitor ID (1P)", contactId: "bl1" },
      { id: "S2", type: "competitor_eval", daysAgo: 5, detail: "Comparing MMM vendors in the marketing-measurement category on a review site", source: "Review-site buyer intent (2P)" },
      { id: "S3", type: "webinar", daysAgo: 9, detail: "Attended 'Incrementality testing for retail media' webinar", source: "Webinar platform (1P)", contactId: "bl2" },
    ],
    contacts: [c("bl1", "Ethan Cole", "Head of Growth", "brightleaf-home.example"), c("bl2", "Rina Patel", "Marketing Analytics Manager", "brightleaf-home.example"), c("bl3", "Grace Kim", "VP Marketing", "brightleaf-home.example")],
  },
  {
    id: "halcyon", name: "Halcyon Beauty", domain: "halcyon-beauty.example", industry: "Beauty · omnichannel", hq: "New York, NY",
    employees: 2400, adSpendM: 60, channels: ["Meta", "TikTok", "Google Search", "CTV", "Retail media", "Influencer"], hasAnalyticsTeam: true, owner: "Jordan Ellis",
    signals: [
      { id: "S1", type: "exec_change", daysAgo: 40, detail: "Named a new SVP Marketing after a reorganization", source: "Press release (3P)", contactId: "hb2" },
      { id: "S2", type: "webinar", daysAgo: 210, detail: "Registered for a measurement webinar (did not attend)", source: "Webinar platform (1P)" },
    ],
    contacts: [c("hb1", "Priya Raman", "VP, Marketing Analytics & Insights", "halcyon-beauty.example"), c("hb2", "Dana Whitfield", "SVP Marketing", "halcyon-beauty.example"), c("hb3", "Marco Bianchi", "Director, Paid Social", "halcyon-beauty.example"), c("hb4", "Ava Lin", "Data Engineering Lead", "halcyon-beauty.example")],
  },
  {
    id: "kindred", name: "Kindred Pet Co.", domain: "kindred-pet.example", industry: "Pet · subscription", hq: "Seattle, WA",
    employees: 900, adSpendM: 18, channels: ["Meta", "Google Search", "YouTube", "Direct mail"], hasAnalyticsTeam: true, owner: "Priya Shah",
    signals: [
      { id: "S1", type: "partner_referral", daysAgo: 3, detail: "Their media agency flagged budget-justification pressure ahead of 2027 planning", source: "Agency partner (2P)" },
      { id: "S2", type: "hiring_measurement", daysAgo: 25, detail: "Hiring a 'Marketing Data Scientist' with Bayesian modeling skills", source: "LinkedIn Jobs (3P)" },
    ],
    contacts: [c("kp1", "Noah Grant", "VP Growth Marketing", "kindred-pet.example"), c("kp2", "Ivy Chen", "Lead Data Scientist, Marketing", "kindred-pet.example")],
  },
  {
    id: "crestline", name: "Crestline Foods", domain: "crestline-foods.example", industry: "CPG · grocery", hq: "Chicago, IL",
    employees: 5200, adSpendM: 22, channels: ["Retail media", "CTV", "Meta"], hasAnalyticsTeam: false, owner: "Sam Ortiz",
    signals: [
      { id: "S1", type: "funding", daysAgo: 7, detail: "Announced a growth investment earmarked for brand building", source: "News / funding database (3P)" },
      { id: "S2", type: "channel_expansion", daysAgo: 10, detail: "Expanded retail media spend to a second retailer network", source: "Ad library / creative tracking (3P)" },
    ],
    contacts: [c("cf1", "Helen Brooks", "VP Brand Marketing", "crestline-foods.example"), c("cf2", "Omar Haddad", "Senior Manager, Retail Media", "crestline-foods.example")],
  },
  {
    id: "tidewater", name: "Tidewater Mobile", domain: "tidewater-mobile.example", industry: "Mobile app · seed stage", hq: "Miami, FL",
    employees: 60, adSpendM: 1.5, channels: ["Meta"], hasAnalyticsTeam: false, owner: "Sam Ortiz",
    signals: [
      { id: "S1", type: "pricing_visit", daysAgo: 0, detail: "12 pricing page visits today", source: "Website visitor ID (1P)" },
      { id: "S2", type: "report_download", daysAgo: 2, detail: "Downloaded the MMM buyer's guide", source: "Marketing automation (1P)" },
    ],
    contacts: [c("tw1", "Jake Morrow", "Founder & CEO", "tidewater-mobile.example")],
  },
];

// Seeded long tail so the ranking has a realistic spread. shortcut: 40 accounts stand in for the 10k TAM.
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}
const r = rng(2027);
const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
const A = ["Summit", "Harbor", "Juniper", "Redwood", "Lumen", "Granite", "Meridian", "Willow", "Cobalt", "Aurora", "Sable", "Fern", "Atlas", "Copper", "Vale", "Orchid", "Ridge", "Ember"];
const N = ["Apparel", "Labs", "Goods", "Supply", "Brands", "Wellness", "Kitchen", "Travel", "Outdoors", "Beauty", "Market", "Living"];
const IND = ["Apparel · DTC", "Beauty · DTC", "CPG · grocery", "Home · DTC", "Travel · online", "Fintech · consumer", "Health · DTC", "Retail · omnichannel", "QSR · restaurants"];
const CITIES = ["Boston, MA", "San Francisco, CA", "Los Angeles, CA", "Atlanta, GA", "Portland, OR", "Minneapolis, MN", "Dallas, TX", "Columbus, OH", "Nashville, TN"];
const CH = ["Meta", "Google Search", "YouTube", "TikTok", "CTV", "Amazon Ads", "Retail media", "Pinterest", "Podcast", "Affiliate"];
const FIRST = ["Alex", "Morgan", "Riley", "Casey", "Jamie", "Taylor", "Quinn", "Avery", "Rowan", "Elliot", "Harper", "Reese"];
const LAST = ["Nguyen", "Garcia", "Hughes", "Sato", "Novak", "Reyes", "Foster", "Iyer", "Walsh", "Moreau", "Adeyemi", "Larsen"];
const TITLES = ["VP Marketing", "Director, Marketing Analytics", "Head of Paid Media", "Chief Marketing Officer", "Manager, Marketing Science", "Director, Performance Marketing"];
const TYPES: SignalType[] = ["pricing_visit", "report_download", "webinar", "competitor_eval", "hiring_measurement", "exec_change", "channel_expansion", "funding"];
const DETAIL: Record<string, string> = {
  pricing_visit: "Repeat visits to the pricing page", report_download: "Downloaded a measurement research report", webinar: "Attended a measurement webinar",
  competitor_eval: "Comparing measurement vendors on a review site", hiring_measurement: "Open role mentions MMM / incrementality", exec_change: "New marketing leader announced",
  channel_expansion: "Started spending on a new paid channel", funding: "Announced new funding",
};
const SOURCE: Record<string, string> = {
  pricing_visit: "Website visitor ID (1P)", report_download: "Marketing automation (1P)", webinar: "Webinar platform (1P)", competitor_eval: "Review-site buyer intent (2P)",
  hiring_measurement: "LinkedIn Jobs (3P)", exec_change: "Press release (3P)", channel_expansion: "Ad library / creative tracking (3P)", funding: "News / funding database (3P)",
};

const used = new Set(HERO.map((h) => h.name));
const TAIL: Account[] = Array.from({ length: 34 }, (_, i) => {
  let name = `${pick(A)} ${pick(N)}`;
  while (used.has(name)) name = `${pick(A)} ${pick(N)}`;
  used.add(name);
  const domain = name.toLowerCase().replace(/[^a-z]+/g, "-") + ".example";
  const contacts = Array.from({ length: 3 }, (_, j) => c(`t${i}c${j}`, `${pick(FIRST)} ${pick(LAST)}`, TITLES[(i + j * 2) % TITLES.length], domain));
  const signals: Signal[] = Array.from({ length: Math.floor(r() * 5) }, (_, k) => {
    const type = pick(TYPES);
    return { id: `S${k + 1}`, type, daysAgo: Math.floor(r() * 90), detail: DETAIL[type], source: SOURCE[type], contactId: type === "pricing_visit" || type === "webinar" ? contacts[k % 3].id : undefined };
  });
  return {
    id: `t${i}`, name, domain, industry: pick(IND), hq: pick(CITIES), employees: Math.round(150 + r() * 8000),
    adSpendM: Math.round((1 + r() * r() * 90) * 10) / 10, channels: CH.filter(() => r() > 0.55), hasAnalyticsTeam: r() > 0.45,
    owner: pick(["Jordan Ellis", "Priya Shah", "Sam Ortiz"]), signals, contacts,
  };
});

export const ACCOUNTS: Account[] = [...HERO, ...TAIL];

// The inbound events a visitor can trigger in the demo. Server rebuilds detail text from type, so no free text reaches the LLM.
export const INBOUND_EVENTS = {
  report_download: "Downloaded the '2027 State of Marketing Measurement' benchmark report",
  pricing_visit: "Visited /pricing and /compare pages",
  assessment: "Completed the MMM readiness assessment (score: needs incrementality testing)",
  webinar: "Registered for the 'MMM for retail media' webinar",
} as const;
export type InboundType = keyof typeof INBOUND_EVENTS;

// Public positioning statements (lifesight.io), the only product claims an AI draft may make.
export const PRODUCT_FACTS = [
  { id: "P1", text: "Lifesight unifies marketing mix modeling, geo-based incrementality testing and attribution in one platform, so finance and marketing work from the same numbers." },
  { id: "P2", text: "Each incrementality test result recalibrates the MMM, which refreshes weekly." },
  { id: "P3", text: "Measurement works without cookies, device IDs or personal data." },
];
