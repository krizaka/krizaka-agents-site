#!/usr/bin/env node
/* Rule 3 of the publication check, the part that needs the network: every github.com/krizaka/<repo> link of the built site must
   answer 200 without a token. A private repository answers 404 to a visitor, so a link to it is refused.
   Usage: node scripts/check-links.mjs [<built dir>]   (default: out). Exit 1 names each refused link and its status. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ORG_LINK = /https:\/\/github\.com\/krizaka\/[\w.-]+/g;

/** The distinct repository pages the texts link to (a deeper link is checked at its repository). */
export const repositoryLinks = (texts) =>
  [...new Set(texts.flatMap((t) => t.match(ORG_LINK) ?? []).map((l) => l.replace(/\.git$/, "")))].sort((a, b) => a.localeCompare(b));

/** The links that do not answer 200 to an anonymous visitor, with their status (0: no answer). `fetchFn` is the port. */
export async function refusedLinks(links, fetchFn) {
  const answers = await Promise.all(
    links.map(async (link) => {
      try {
        const res = await fetchFn(link, { method: "HEAD", redirect: "follow" });
        return { link, status: res.status };
      } catch {
        return { link, status: 0 };
      }
    }),
  );
  return answers.filter((a) => a.status !== 200);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ?? "out";
  const texts = walk(dir)
    .filter((f) => /\.(html|xml|txt)$/.test(f))
    .map((f) => readFileSync(f, "utf8"));
  const links = repositoryLinks(texts);
  const refused = await refusedLinks(links, fetch);
  for (const { link, status } of refused) console.error(`private-link: ${link} answers ${status || "nothing"} without a token`);
  console.log(`links: ${links.length} repository links, ${refused.length} refused`);
  process.exit(refused.length ? 1 : 0);
}
