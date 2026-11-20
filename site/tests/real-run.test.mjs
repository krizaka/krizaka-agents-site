import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PROOFS_DIR, isSynced, proofProblems, readSources, sha256, sourceBytes } from "../scripts/proofs.mjs";
import { consoleSteps, kindCounts, parseRunCases, parseRunLog, publicText, RUN_KINDS, RunLogError } from "../lib/run-log.ts";
import { piecesOf } from "../lib/views.ts";
import { problems } from "../scripts/publication-rules.mjs";
import { built, root } from "./published-texts.mjs";

/* The live overlap proof (krizaka-internal#4410) replays in a console, stamped real run: its console and its figures are the
   proof's own files, copied by scripts/proofs.mjs from krizaka-agents, never typed. */
const sources = readSources(root);
const proof = (id) => sources.proofs.find((p) => p.id === id);
const copy = (id) => readFileSync(join(root, PROOFS_DIR, proof(id).file), "utf8");
const LOG = "overlap-live-2026-11-19-log";
const CASES = "overlap-live-2026-11-19-cases";
const page = (locale, slug) => join(root, "out", locale === "fr" ? "fr" : "", slug, "index.html");

test("every copy is its source, byte for byte, and a pending proof has no copy", () => {
  assert.deepEqual(proofProblems(root, sources), []);
  assert.ok(isSynced(proof(LOG)) && isSynced(proof(CASES)));
  assert.ok(isSynced(proof("overlap-live-s2-rerun-cases")) && isSynced(proof("overlap-live-s2-rerun-log")));
});

test("the copy equals the file of krizaka-agents at its commit (with APP_PROOFS_SOURCE, a checkout)", { skip: !process.env.APP_PROOFS_SOURCE }, () => {
  for (const p of sources.proofs.filter(isSynced))
    assert.equal(sha256(sourceBytes(process.env.APP_PROOFS_SOURCE, p.commit, p.path)), sha256(readFileSync(join(root, PROOFS_DIR, p.file))), p.id);
});

test("the copy check fails when the file differs from its source", () => {
  const dir = mkdtempSync(join(tmpdir(), "proofs-"));
  mkdirSync(join(dir, PROOFS_DIR), { recursive: true });
  const p = { id: "x", repo: "r", path: "a.json", commit: "a".repeat(40), file: "x.json", sha256: sha256("[1]\n") };
  writeFileSync(join(dir, PROOFS_DIR, "x.json"), "[2]\n");
  assert.match(proofProblems(dir, { proofs: [p] })[0], /never edit a copy by hand/);
  writeFileSync(join(dir, PROOFS_DIR, "x.json"), "[1]\n");
  assert.deepEqual(proofProblems(dir, { proofs: [p] }), []);
  assert.match(proofProblems(dir, { proofs: [{ ...p, commit: null, sha256: null }] })[0], /has no commit/);
});

test("the log: 36 events, every kind known, in time order; an unknown kind is an error", () => {
  const events = parseRunLog(copy(LOG));
  assert.equal(events.length, 36);
  const times = events.map((e) => e.at);
  assert.deepEqual(times, [...times].sort());
  assert.ok(events.every((e) => RUN_KINDS.includes(e.kind)));
  assert.throws(() => parseRunLog('{"at":"2026-11-19T16:18:00Z","kind":"other","actor":"a","text":"t","tone":"muted"}'), RunLogError);
});

test("the console renders every event once, in the log's order", () => {
  const events = parseRunLog(copy(LOG));
  const steps = consoleSteps(events, [{ from: "16:44", command: "b" }, { from: "16:18", command: "a" }]);
  assert.deepEqual(steps.map((s) => s.command), ["a", "b"]);
  const lines = steps.flatMap((s) => s.output.map((o) => o.text.slice(0, 5)));
  assert.deepEqual(lines, events.map((e) => e.at.slice(11, 16)));
  assert.throws(() => consoleSteps(events, [{ from: "17:00", command: "late" }]), RunLogError);
});

test("the console says our internals in public words and carries no amount", () => {
  const text = parseRunLog(copy(LOG)).map((e) => publicText(e.text)).join("\n");
  for (const internal of [/krizaka-internal/, /codegraph/, /pr-open/, /wip\//, /USD|\$/, /opus|sonnet/i]) assert.doesNotMatch(text, internal);
});

test("what the console shows of the log passes the publication rules", () => {
  const shown = parseRunLog(copy(LOG)).map((e) => publicText(e.text)).join("\n");
  assert.deepEqual(problems(shown), []);
});

test("the cases: S1 passed with no conflict, S2 failed once; counts of the legend come from the log", () => {
  const byPr = Object.fromEntries(parseRunCases(copy(CASES)).map((c) => [c.pr, c]));
  assert.deepEqual([byPr[889].verdict, byPr[890].verdict, byPr[891].verdict], ["pass", "pass", "fail"]);
  assert.equal(byPr[889].conflicts + byPr[890].conflicts + byPr[889].rework_pushes + byPr[890].rework_pushes, 0);
  assert.equal(kindCounts(parseRunLog(copy(LOG))).merged, 3);
});

test("the S2 rerun: #893 passed, #894 was replayed by the train alone, no manual push", () => {
  const byPr = Object.fromEntries(parseRunCases(copy("overlap-live-s2-rerun-cases")).map((c) => [c.pr, c]));
  assert.deepEqual([byPr[893].verdict, byPr[894].verdict], ["pass", "replayed"]);
  assert.equal(byPr[894].replayed, true);
});

test("a page places a run with <!--run:id-->; an unknown run stops the build", () => {
  assert.deepEqual(piecesOf("a<!--run:overlap_log-->b"), [{ html: "a" }, { run: "overlap_log" }, { html: "b" }]);
  assert.deepEqual(piecesOf("<!--view:pr_life--><!--run:overlap_cases-->"), [{ view: "pr_life" }, { run: "overlap_cases" }]);
  assert.throws(() => piecesOf("<!--run:nope-->"), /no run nope/);
});

test("the Proofs page places the console, the first cases and the S2 rerun, in both languages, and never says « simulation »", () => {
  for (const locale of ["en", "fr"]) {
    const src = readFileSync(join(root, "content", "pages", `proofs.${locale}.md`), "utf8");
    const marks = [...src.matchAll(/<!--run:([a-z0-9_]+)-->/g)].map((m) => m[1]);
    assert.deepEqual(marks, ["overlap_log", "overlap_cases", "overlap_s2_cases"], locale);
    assert.doesNotMatch(src, /simulat/i, locale);
    for (const n of [889, 890, 891, 893, 894]) assert.ok(src.includes(`https://github.com/krizaka/verikora/pull/${n}`), `${locale} links #${n}`);
  }
  for (const f of ["what-it-is", "proofs"]) for (const l of ["en", "fr"]) assert.doesNotMatch(readFileSync(join(root, "content", "pages", `${f}.${l}.md`), "utf8"), /simulat/i);
});

test("built: the stamp says real run with the log's date, S2 reads passed, every PR line links to its public PR", { skip: !built() }, () => {
  const expected = { en: ["real run, 2026-11-19", "passed, replayed by the train"], fr: ["exécution réelle, 2026-11-19", "réussi, rejoué par le train"] };
  for (const locale of ["en", "fr"]) {
    const html = readFileSync(page(locale, "proofs"), "utf8");
    for (const word of expected[locale]) assert.ok(html.includes(word), `${locale}: ${word}`);
    assert.doesNotMatch(html, /simulat/i);
    for (const n of [889, 890, 891])
      assert.match(html, new RegExp(`<a href="https://github.com/krizaka/verikora/pull/${n}">#${n}</a>`), `${locale} table row #${n}`);
    assert.equal((html.match(/<a href="https:\/\/github\.com\/krizaka\/verikora\/pull\/\d+"/g) ?? []).length >= 3, true);
  }
});
