/* The measures section of the 1.0 draft waits for its measure (krizaka-internal#4665: the 7-day alert series is not ready). Until
   then it names what it waits for and shows no number: a figure on this site is read from a recorded measurement, never typed
   (the rule of krizaka-internal#4572, carried by #4499). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MEASURE_IDS, readReleaseMeasures } from "../lib/release-measures.ts";
import { built, root, withoutScripts } from "./published-texts.mjs";

/* What a draft page may write with digits: the release « 1.0 », the C4 levels « C1 » « C2 », the § numbers of headings, and the
   markers and link targets that are not prose (`<!--release-view:v1_c1-->`, `](/v1/)`). */
const ALLOWED = /\b1\.0\b|\bC[12]\b|^### § \d+ — |<!--[^>]*-->|\]\([^)]*\)/gm;
const digitsLeft = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, "").replace(ALLOWED, "").match(/\d+/g) ?? [];

test("the measures wait for krizaka-internal#4665 and hold no number", () => {
  const m = readReleaseMeasures();
  assert.equal(m.status, "pending");
  assert.equal(m.waitsFor.issue, "#4665");
  assert.deepEqual([...m.waitsFor.measures].sort(), [...MEASURE_IDS].sort());
  assert.ok(m.waitsFor.command.length > 0, "the command that will record them");
  assert.deepEqual(JSON.stringify(m.waitsFor).replace(/#\d+/g, "").match(/\b\d+\b/g) ?? [], [], "no figure in the measures data");
});

test("no number is typed in the prose of the draft pages", () => {
  for (const name of ["v1.en.md", "v1.fr.md", "migration.en.md", "migration.fr.md"]) {
    const md = readFileSync(join(root, "content", "release", name), "utf8");
    assert.deepEqual(digitsLeft(md), [], `${name}: a number is typed in the prose`);
  }
});

test("the built 1.0 draft names the measure it waits for and is not indexed", { skip: !built() }, () => {
  for (const locale of ["en", "fr"]) {
    const html = withoutScripts(readFileSync(join(root, "out", locale === "en" ? "" : "fr", "v1", "index.html"), "utf8"));
    assert.match(html, /<meta name="robots" content="noindex,\s*nofollow"/i, `${locale}/v1: noindex`);
    const section = /<section class="kz-measures"[\s\S]*?<\/section>/.exec(html)?.[0];
    assert.ok(section, `${locale}/v1: the measures section`);
    assert.ok(section.includes("#4665"), `${locale}/v1: names #4665`);
    assert.deepEqual(section.replace(/<code>[\s\S]*?<\/code>/g, " ").replace(/<[^>]*>/g, " ").replace(/#\d+/g, "").match(/\d+/g) ?? [], [], `${locale}/v1: no figure`);
  }
});
