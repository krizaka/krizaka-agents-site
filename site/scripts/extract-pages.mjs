#!/usr/bin/env node
/* Writes content/pages/<slug>.<locale>.md from the six page drafts of krizaka-internal (docs/agents-site/pages/*.md), the
   only source of the words. Each draft holds its title and description, then `## FR` and `## EN` sections ended by a rule;
   what follows (« Claims and their chapter », review notes) is never published. A page body has its § 1.. headings and its
   links; the lead, the status line and the closing links stay in the body.
   Usage: node scripts/extract-pages.mjs <path to krizaka-internal/docs/agents-site/pages> */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: extract-pages.mjs <pages dir>");
  process.exit(1);
}
const out = new URL("../content/pages/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const SLUGS = { "01": "what-it-is", "02": "the-flow", "03": "rules-that-say-no", "04": "alerts-and-the-watchdog", "05": "the-cockpit", "06": "proofs" };
const pair = (line) => {
  const [, rest = ""] = line.split("— FR ");
  const [fr, en] = rest.split(" · EN ");
  if (!fr || !en) throw new Error(`no FR/EN pair in: ${line}`);
  return { fr: fr.trim().replace(/^«\s*|\s*»$/g, ""), en: en.trim().replace(/^"|"?\.?$/g, "") };
};
const section = (text, name) => {
  const m = new RegExp(`^## ${name}\\n([\\s\\S]*?)\\n---\\n`, "m").exec(text);
  if (!m) throw new Error(`no ## ${name} section`);
  return m[1].trim();
};
const quote = (s) => JSON.stringify(s);

for (const file of readdirSync(src).filter((f) => /^0\d-.*\.md$/.test(f)).sort()) {
  const slug = SLUGS[file.slice(0, 2)];
  const text = readFileSync(join(src, file), "utf8");
  const title = pair(text.split("\n").find((l) => l.startsWith("**Title")));
  const meta = pair(text.split("\n").find((l) => l.startsWith("**Meta description")));
  for (const locale of ["fr", "en"]) {
    const body = section(text, locale.toUpperCase());
    writeFileSync(
      join(out, `${slug}.${locale}.md`),
      `---\ntitle: ${quote(title[locale])}\ndescription: ${quote(meta[locale])}\n---\n\n${body}\n`,
    );
  }
  console.log(`extract-pages: ${slug}`);
}
