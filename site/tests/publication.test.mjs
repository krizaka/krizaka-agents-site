import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { aiLook, allowedSourceFile, longCodeBlocks, problems } from "../scripts/publication-rules.mjs";
import { repositoryLinks, refusedLinks } from "../scripts/check-links.mjs";
import { built, builtTexts, root, sourcePaths, sourceTexts, withoutScripts } from "./published-texts.mjs";

// The margin nav checks on the built pages ride with the post-build run of this file (CI runs it after `next build`).
import "./margin-nav.test.mjs";

// The publication checks (§ 6 of the site's plan): what is written in the pages, the messages and the built site is public.
// The rules themselves are proven on bad samples; then they run on the sources and, when `out/` exists, on every built file.
// The secret and personal samples are assembled at run time so that no secret- or card-shaped string sits in this file.
// The founder's name has its own check, against a keyed secret: tests/public-no-founder-name.test.mjs.

const dashes = "-".repeat(5);
const tokenSample = `token: ${["gh", "p_"].join("")}${"a".repeat(30)}`;
const keyBlockSample = `${dashes}BEGIN RSA ${["PRIV", "ATE"].join("")} KEY${dashes}`;
const keyValueSample = `api_key = "${"A1b2".repeat(4)}"`;
const cardSample = Array.from({ length: 4 }, () => "4111").join(" ");

test("the rules catch what they must", () => {
  const bad = {
    secret: [tokenSample, keyBlockSample, keyValueSample],
    "founder-attribution": ["— founder, 2026-11-05", "Décision du fondateur, 2026-11-05", "(founder, 2026-10)"],
    "internal-path": [
      "see krizaka-hq/docs",
      "in workspace/tmp",
      "at /Users/someone/x",
      "at /home/someone/x",
      "in ~/.config",
      "run $(kz-config tools)",
      "in ~/.local/bin",
      "tools/train-queue.py add",
      "http://localhost:3000/fr",
      "on 127.0.0.1",
      "bound to 0.0.0.0",
      "http://[::1]:8080",
      "the team inbox/ file",
    ],
    "private-repository": [
      "https://github.com/krizaka/krizaka-agents/pull/1",
      "https://github.com/krizaka/krizaka-agents",
      "see krizaka-internal#3122",
      "krizaka/krizaka-restricted#375",
    ],
    "personal-data": [
      "write to jane.doe@example.com",
      "call 514 555-0199",
      "call +1 (514) 555-0199",
      "H2X 1Y4",
      "SIN 046 454 286",
      `card ${cardSample}`,
      `card ${cardSample.replaceAll(" ", "")}`,
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
    "190,000 → 40,000 tokens on the first turn; 18 of 18 sessions finished",
    "Le 9 novembre à 18 h 20, puis à 18 h 30.",
    "Write to contact@krizaka.com or support@krizaka.com.",
    "The founder decides; the agents propose.",
  ])
    assert.deepEqual(problems(ok), [], ok);
});

test("the template words are found, as a warning", () => {
  assert.deepEqual(aiLook("A seamless, révolutionnaire and Autonomous agent"), ["seamless", "révolutionnaire", "autonomous"]);
  assert.deepEqual(aiLook("An agent that waits for a person"), []);
});

test("a page's code block over 8 lines is refused unless marked illustrative", () => {
  const block = (info, n) => `text\n\n\`\`\`${info}\n${Array.from({ length: n }, (_, i) => `line ${i}`).join("\n")}\n\`\`\`\n`;
  assert.equal(longCodeBlocks(block("ts", 8)), 0);
  assert.equal(longCodeBlocks(block("ts", 9)), 1);
  assert.equal(longCodeBlocks(block("ts illustrative", 30)), 0);
  assert.equal(longCodeBlocks(block("", 9) + block("sh", 12)), 2);
});

test("only the allowed file types make the pages", () => {
  assert.ok(allowedSourceFile("content/pages/proofs.en.md"));
  assert.ok(allowedSourceFile("public/CNAME"));
  assert.ok(!allowedSourceFile("content/pages/run.py"));
  assert.ok(!allowedSourceFile("app/data.mjs"));
  const strays = sourcePaths().filter((f) => !allowedSourceFile(f));
  assert.deepEqual(strays, []);
});

test("the sources hold none of it", () => {
  const files = sourceTexts();
  assert.ok(files.length > 20);
  for (const [f, text] of files) {
    assert.deepEqual(problems(text), [], f);
    if (f.endsWith(".md")) assert.equal(longCodeBlocks(text), 0, `${f}: a code block over 8 lines`);
    const look = aiLook(text);
    if (look.length) console.warn(`::warning file=site/${f}::template words (rule 7): ${look.join(", ")}`);
  }
});

test("the built pages are read without their scripts, whatever their case or closing form", () => {
  assert.equal(withoutScripts("a<script>x</script>b"), "a b");
  assert.equal(withoutScripts('a<SCRIPT type="m">x</SCRIPT >b<script>y</script\n>c'), "a b c");
  assert.equal(withoutScripts("a<script>never closed"), "a ");
  assert.equal(withoutScripts("no script here"), "no script here");
});

test("the six pages exist in both languages", () => {
  for (const file of ["what-it-is", "the-flow", "rules-that-say-no", "alerts-and-the-watchdog", "the-cockpit", "proofs"])
    for (const l of ["en", "fr"]) assert.ok(existsSync(join(root, "content/pages", `${file}.${l}.md`)), `${file}.${l}`);
});

test("the org links are gathered by repository and refused unless they answer 200 anonymously", async () => {
  const links = repositoryLinks([
    '<a href="https://github.com/krizaka/krizaka-blog/pull/379">',
    "https://github.com/krizaka/krizaka-blog https://github.com/krizaka/hidden.git",
  ]);
  assert.deepEqual(links, ["https://github.com/krizaka/hidden", "https://github.com/krizaka/krizaka-blog"]);
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push(init.headers);
    if (url.endsWith("/broken")) throw new Error("no answer");
    return { status: url.endsWith("/hidden") ? 404 : 200 };
  };
  const refused = await refusedLinks([...links, "https://github.com/krizaka/broken"], fakeFetch);
  assert.deepEqual(refused, [
    { link: "https://github.com/krizaka/hidden", status: 404 },
    { link: "https://github.com/krizaka/broken", status: 0 },
  ]);
  assert.ok(calls.every((h) => h === undefined), "no header, so no token, is sent");
});

test("every file of the built site holds none of it (when built)", { skip: !built() }, () => {
  const files = builtTexts();
  assert.ok(files.length > 10);
  for (const [f, text] of files) assert.deepEqual(problems(text), [], f);
  const slugs = ["", "flow/", "rules/", "alerts/", "cockpit/", "proofs/"];
  for (const p of [...slugs.flatMap((s) => [`${s}index.html`, `fr/${s}index.html`]), "404.html", "sitemap.xml"])
    assert.ok(existsSync(join(root, "out", p)), p);
});
