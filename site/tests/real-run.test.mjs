import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PROOFS_DIR, isSynced, proofProblems, readSources, sha256, sourceBytes } from "../scripts/proofs.mjs";
import { consoleSteps, heroProof, kindCounts, parseRunCases, parseRunLog, publicText, RUN_KINDS, RunLogError } from "../lib/run-log.ts";
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

/* The home's short proof (krizaka-internal#4501): its figures and its three lines come from the proof files, never typed. */
const RERUN = "overlap-live-s2-rerun-cases";
const RERUN_LOG = "overlap-live-s2-rerun-log";
const hero = () =>
  heroProof(
    { first: parseRunLog(copy(LOG)), rerun: parseRunLog(copy(RERUN_LOG)) },
    [...parseRunCases(copy(CASES)), ...parseRunCases(copy(RERUN))],
  );

test("the hero's figures are counted from the files: 5 shared files, 1 stacked PR replayed by the train, 0 manual pushes", () => {
  const h = hero();
  assert.deepEqual([h.dates, h.sharedFiles, h.replayed, h.manualPushes], ["2026-11-19, 2026-11-20", 5, 1, 0]);
});

test("the hero's three lines are the run that passed: the overlap seen at 16:44, the stack replayed at 04:20, the merge at 04:54", () => {
  const h = hero();
  assert.equal(h.lines.length, 3);
  const all = [...parseRunLog(copy(LOG)), ...parseRunLog(copy(RERUN_LOG))].map((e) => `${e.at.slice(11, 16)}  ${e.actor.padEnd(6)}  ${publicText(e.text)}`);
  for (const l of h.lines) assert.ok(all.includes(l.text), l.text);
  assert.deepEqual(h.lines.map((l) => l.text.slice(0, 5)), ["16:44", "04:20", "04:54"]);
  assert.match(h.lines[0].text, /guard {2}.*share/);
  assert.match(h.lines[1].text, /replays #894 onto main/);
  assert.match(h.lines[2].text, /verikora#894 merged into main/);
  assert.doesNotMatch(h.lines.map((l) => l.text).join("\n"), /conflict/i);
  assert.deepEqual(problems(h.lines.map((l) => l.text).join("\n")), []);
  const logs = { first: parseRunLog(copy(LOG)).filter((e) => e.kind !== "overlap"), rerun: parseRunLog(copy(RERUN_LOG)) };
  assert.throws(() => heroProof(logs, []), RunLogError);
});

test("the home places the hero in both languages", () => {
  for (const l of ["en", "fr"]) assert.ok(readFileSync(join(root, "content", "pages", `what-it-is.${l}.md`), "utf8").includes("<!--run:hero_proof-->"), l);
});

test("built: the home shows the stamp, the log's figures and its lines, and links to the full proof", { skip: !built() }, () => {
  const h = hero();
  const want = { en: ["real run, 2026-11-19, 2026-11-20", "one case, not a rate", 'href="/proofs/#s3"'], fr: ["exécution réelle, 2026-11-19, 2026-11-20", "un cas, pas un taux", 'href="/fr/proofs/#s3"'] };
  for (const locale of ["en", "fr"]) {
    const html = readFileSync(join(root, "out", ...(locale === "fr" ? ["fr"] : []), "index.html"), "utf8");
    for (const w of want[locale]) assert.ok(html.includes(w), `${locale}: ${w}`);
    for (const n of [h.sharedFiles, h.replayed, h.manualPushes]) assert.match(html, new RegExp(`<dt>${n}</dt>`), `${locale}: ${n}`);
    for (const l of h.lines) assert.ok(html.includes(l.text.replace(/&/g, "&amp;").slice(0, 40)) || html.includes(l.text.slice(0, 40)), `${locale}: ${l.text.slice(0, 40)}`);
  }
});
