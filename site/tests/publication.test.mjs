import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { problems } from "../scripts/publication-rules.mjs";

// The publication checks (krizaka-internal#3122): what is written in the pages, the messages and the built site is public.
// The rules themselves are proven on bad samples; then they run on the sources and, when `out/` exists, on every built file.
// The secret samples are assembled at run time so that no secret-shaped string sits in this file.
const root = new URL("..", import.meta.url).pathname;
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

const dashes = "-".repeat(5);
const tokenSample = `token: ${["gh", "p_"].join("")}${"a".repeat(30)}`;
const keyBlockSample = `${dashes}BEGIN RSA ${["PRIV", "ATE"].join("")} KEY${dashes}`;
const keyValueSample = `api_key = "${"A1b2".repeat(4)}"`;

test("the rules catch what they must", () => {
  const bad = {
    secret: [tokenSample, keyBlockSample, keyValueSample],
    "internal-path": ["see krizaka-hq/docs", "in workspace/tmp", "at /Users/someone/x"],
    "private-repository": [
      "https://github.com/krizaka/krizaka-agents/pull/1",
      "https://github.com/krizaka/krizaka-agents",
    ],
    offer: ["Buy it now", "installation request", "See our pricing", "only $49", "49 €", "Prix et tarifs", "to install it"],
  };
  for (const [id, samples] of Object.entries(bad))
    for (const s of samples) assert.ok(problems(s).includes(id), `${id}: ${s}`);
});

test("the rules leave the honest sentences alone", () => {
  for (const ok of [
    "This site shows the method; there is nothing to buy or to request here.",
    "Ce site montre la méthode ; il n'y a rien à acheter ni à demander ici.",
    "[The architecture of krizaka-agents](https://blog.krizaka.com/story/the-architecture-of-krizaka-agents/)",
    "https://github.com/krizaka/krizaka-agents-site",
    "332 launches, 0 drift",
  ])
    assert.deepEqual(problems(ok), [], ok);
});

test("the sources hold none of it", () => {
  const files = [
    ...walk(join(root, "content")),
    ...walk(join(root, "messages")),
    ...walk(join(root, "lib")),
    ...walk(join(root, "app")),
  ].filter((f) => /\.(md|json|ts|tsx|css)$/.test(f));
  assert.ok(files.length > 20);
  for (const f of files) assert.deepEqual(problems(readFileSync(f, "utf8")), [], f);
});

test("the six pages exist in both languages", () => {
  for (const file of ["what-it-is", "the-flow", "rules-that-say-no", "alerts-and-the-watchdog", "the-cockpit", "proofs"])
    for (const l of ["en", "fr"]) assert.ok(existsSync(join(root, "content/pages", `${file}.${l}.md`)), `${file}.${l}`);
});

test("every file of the built site holds none of it (when built)", { skip: !existsSync(join(root, "out")) }, () => {
  const built = walk(join(root, "out")).filter((f) => /\.(html|xml)$|robots\.txt$/.test(f));
  assert.ok(built.length > 10);
  for (const f of built) {
    // the words of the page, not the Next runtime's inline scripts
    const text = readFileSync(f, "utf8").replace(/<script[\s\S]*?<\/script>/g, "");
    assert.deepEqual(problems(text), [], f);
  }
  const slugs = ["", "flow/", "rules/", "alerts/", "cockpit/", "proofs/"];
  for (const p of [...slugs.flatMap((s) => [`${s}index.html`, `fr/${s}index.html`]), "404.html", "sitemap.xml"])
    assert.ok(existsSync(join(root, "out", p)), p);
});
