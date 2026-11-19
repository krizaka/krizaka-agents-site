#!/usr/bin/env node
/* The architecture views of the site, from the one model the blog draws too: krizaka/.github docs/architecture/krizaka-agents.c4
   and its French words, written against the org's base (specification.c4, org.c4) next to it (krizaka-internal#4184). The logic
   is @krizaka/architecture's CLI; this file only names the files.

     node scripts/architecture.mjs layout <krizaka/.github checkout>   check the model, lay it out, write lib/architecture.json
     node scripts/architecture.mjs check <krizaka/.github checkout>    lib/architecture.json was made from these files as they are */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = fileURLToPath(new URL("..", import.meta.url));
const [command, checkout] = process.argv.slice(2);
if (!["layout", "check"].includes(command) || !checkout) {
  console.error("usage: architecture.mjs layout|check <krizaka/.github checkout>");
  process.exit(2);
}
const dir = join(checkout, "docs", "architecture");
const at = (name) => join(dir, name);
const OUT = join(site, "lib", "architecture.json");
const sources = ["--base", at("specification.c4"), "--base", at("org.c4"), "--translations", `fr=${at("krizaka-agents.fr.json")}`];
const args =
  command === "layout"
    ? ["layout", at("krizaka-agents.c4"), "--out", OUT, "--system", "agents", ...sources]
    : ["check", OUT, "--model", at("krizaka-agents.c4"), ...sources];
const require = createRequire(import.meta.url);
const manifest = require.resolve("@krizaka/architecture/package.json");
const cli = join(dirname(manifest), require(manifest).bin["krizaka-architecture"]);
const run = spawnSync(process.execPath, [cli, ...args], { stdio: "inherit" });
if (run.error) throw run.error;
process.exit(run.status ?? 1);
