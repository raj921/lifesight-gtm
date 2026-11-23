import { execSync } from "node:child_process";
const tracked = execSync("git ls-files").toString().split("\n").filter((f) => /(^|\/)\.env/.test(f));
const ignored = execSync("git check-ignore .env.local || true").toString().trim();
if (tracked.length || ignored !== ".env.local") throw new Error(`env files tracked: ${tracked.join(", ") || "(.env.local not ignored)"}`);
console.log("secret not tracked");
