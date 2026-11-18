import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  filesNamingFounder,
  FounderNameGuardError,
  GuardErrorCode,
  guardFrom,
  makeSecret,
  namesFounder,
  parseGuard,
} from "../scripts/founder-name-guard.mjs";
import { built, builtTexts, sourceTexts } from "./published-texts.mjs";

// Rule public-no-founder-name (krizaka-restricted#375): no page, message or built file names the founder. The words are compared
// by their HMAC under the key of the Actions secret FOUNDER_NAME_GUARD; nothing derived from them is in this repository.
// The matcher is proven on a fictional word under a throwaway key; the scan runs with the real secret in the « Founder name
// guard » job, and fails closed there when the secret is missing (FOUNDER_NAME_GUARD_REQUIRED=true).

const sample = parseGuard(makeSecret(["Zorblax", "quinn vantablack"], randomBytes(32)));

test("the matcher finds a refused word, alone, in a pair or glued as a handle, and nothing else", () => {
  assert.equal(namesFounder("Written by ZORBLAX.", sample), true);
  assert.equal(namesFounder("by Quinn\nVantablack", sample), true);
  assert.equal(namesFounder("@quinnvantablack on GitHub", sample), true);
  assert.equal(namesFounder("Quinn alone, Vantablack alone", sample), false);
  assert.equal(namesFounder("Technologies Krizaka Inc., fondée à Montréal", sample), false);
});

test("another key gives other digests: the secret's list proves nothing without its key", () => {
  const other = parseGuard(makeSecret(["zorblax"], randomBytes(32)));
  assert.notDeepEqual([...other.hmacs], [...sample.hmacs].slice(0, 1));
  assert.equal(namesFounder("zorblax", { key: randomBytes(32), hmacs: sample.hmacs }), false);
});

test("without the secret the guard fails closed where it is required, and skips elsewhere", () => {
  assert.throws(() => guardFrom({ FOUNDER_NAME_GUARD_REQUIRED: "true" }), (e) => e instanceof FounderNameGuardError && e.code === GuardErrorCode.missing);
  assert.match(guardFrom({ FOUNDER_NAME_GUARD_REQUIRED: "false" }).skipped, /skipped/);
  assert.match(guardFrom({}).skipped, /skipped/);
});

test("a malformed secret always fails, and never echoes its value", () => {
  const bad = ["not json {zorblax}", JSON.stringify({ key: "ab", hmacs: ["00"] }), JSON.stringify({ key: "a".repeat(64), hmacs: [] })];
  for (const raw of bad)
    assert.throws(
      () => guardFrom({ FOUNDER_NAME_GUARD: raw }),
      (e) => e.code === GuardErrorCode.malformed && !e.message.includes(raw) && !e.message.includes("zorblax"),
    );
});

test("the scan names the files, never the word", () => {
  const entries = [["content/pages/a.en.md", "Made in Montréal"], ["messages/fr.json", '{"by": "Zorblax"}']];
  assert.deepEqual(filesNamingFounder(entries, sample), ["messages/fr.json"]);
});

/** The guard of this run, or the error that makes the secret's test fail (never an exception thrown while the file loads). */
const load = () => {
  try {
    return guardFrom(process.env);
  } catch (error) {
    return { error };
  }
};
const outcome = load();
const skip = outcome.skipped ?? false;
if (skip) console.warn(`::warning::${skip}`);

test("the secret is there wherever it is required", () => {
  if (outcome.error) assert.fail(`::error::${outcome.error.message}`);
});

test("no source of the pages names the founder", { skip: skip || Boolean(outcome.error) }, () => {
  const files = sourceTexts();
  assert.ok(files.length > 20);
  assert.deepEqual(filesNamingFounder(files, outcome.guard), []);
});

test("no built file names the founder (when built)", { skip: skip || Boolean(outcome.error) || !built() }, () => {
  const files = builtTexts();
  assert.ok(files.length > 10);
  assert.deepEqual(filesNamingFounder(files, outcome.guard), []);
});
