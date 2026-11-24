#!/usr/bin/env node
/* The architecture views of the 1.0 draft (krizaka-internal#4498), from the model of krizaka-agents itself: its
   docs/architecture/krizaka-agents.c4, copied into data/release/ with its source in data/release/model-source.json, and the views
   this site picks from it (data/release/release-views.c4, which adds no element and no relationship). The base (specification.c4,
   org.c4) is the org's, read from a krizaka/.github checkout as scripts/architecture.mjs does. The logic is @krizaka/architecture's
   (a tool, not a dependency of the site: `npm install --no-save @krizaka/architecture@0.4.0 bundle-require@5.1.0` first); this file
   only names the files.

     node scripts/release-architecture.mjs layout <krizaka/.github checkout>   check the model, lay it out, write lib/release-architecture.json
     node scripts/release-architecture.mjs check <krizaka/.github checkout>    lib/release-architecture.json was made from these files as they are */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { layoutViews, staleSources } from "@krizaka/architecture";

/** The views the draft shows, in their order: C1, C2 in two (the core, the adapters), the tower, the event flow. */
export const RELEASE_VIEWS = ["v1_c1", "v1_c2", "v1_adapters", "v1_tower", "v1_events"];

const site = fileURLToPath(new URL("..", import.meta.url));
const data = (name) => join(site, "data", "release", name);
const OUT = join(site, "lib", "release-architecture.json");
const fileOf = (path) => ({ path: basename(path), text: readFileSync(path, "utf8") });

const [command, checkout] = process.argv.slice(2);
if (!["layout", "check"].includes(command) || !checkout) {
  console.error("usage: release-architecture.mjs layout|check <krizaka/.github checkout>");
  process.exit(2);
}
const org = (name) => fileOf(join(checkout, "docs", "architecture", name));
const sources = {
  model: [fileOf(data("krizaka-agents.c4")), fileOf(data("release-views.c4"))],
  base: [org("specification.c4"), org("org.c4")],
  translations: { fr: fileOf(data("krizaka-agents.fr.json")) },
};

if (command === "layout") {
  const out = await layoutViews(sources.model, { base: sources.base, system: "agents", views: RELEASE_VIEWS, translations: sources.translations });
  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`${out.views.length} view(s), check ${out.check.status} -> lib/release-architecture.json`);
} else {
  const problems = staleSources(JSON.parse(readFileSync(OUT, "utf8")), sources);
  for (const p of problems) console.error(`lib/release-architecture.json: ${p.message}`);
  if (problems.length) process.exit(1);
  console.log("lib/release-architecture.json matches the copied model, the site's views, the org base and the French words");
}
