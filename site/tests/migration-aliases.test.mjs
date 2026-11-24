import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ALIAS_KINDS, ROLE_PREFIXES, aliasSummary, readMigrationAliases, toAliasMap } from "../lib/migration-aliases.ts";
import { problems } from "../scripts/publication-rules.mjs";
import { aliasTableDigest } from "../scripts/sync-env-aliases.mjs";
import { built, root } from "./published-texts.mjs";

const ENV_JSON = process.env.AGENTS_ENV_JSON || join(root, "..", ".inputs", "env.json");

test("migration-aliases.json holds sorted, unique, publication-clean old->new entries", () => {
  const data = readMigrationAliases();
  assert.equal(data.schema, "krizaka.migration-aliases/1");
  assert.equal(data.source.file, "env.json");
  assert.match(data.source.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(data.aliases.length > 0);

  const oldNames = data.aliases.map((a) => a.oldName);
  assert.deepEqual(oldNames, [...oldNames].sort((a, b) => a.localeCompare(b)), "aliases are sorted by oldName");
  assert.equal(new Set(oldNames).size, oldNames.length, "oldNames are unique");

  for (const entry of data.aliases) {
    assert.notEqual(entry.oldName, entry.newName, `${entry.oldName}: oldName differs from newName`);
    assert.ok(ALIAS_KINDS.includes(entry.kind), `${entry.oldName}: valid kind ${entry.kind}`);
    assert.ok(ROLE_PREFIXES.includes(entry.rolePrefix), `${entry.newName}: valid rolePrefix ${entry.rolePrefix}`);
    assert.ok(entry.newName.startsWith(entry.rolePrefix), `${entry.newName} starts with ${entry.rolePrefix}`);
    assert.deepEqual(problems(JSON.stringify(entry)), [], `${entry.oldName}: passes publication rules`);
  }

  const summary = aliasSummary(data.aliases);
  assert.equal(summary.total, data.aliases.length);
  assert.equal(
    Object.values(summary.byKind).reduce((a, b) => a + b, 0),
    summary.total,
  );
  assert.equal(
    Object.values(summary.byRolePrefix).reduce((a, b) => a + b, 0),
    summary.total,
  );
});

test("the page's aliases are the alias table it was copied from: same digest, so none is added or left out by hand", () => {
  const data = readMigrationAliases();
  assert.match(data.source.aliasesSha256, /^[0-9a-f]{64}$/);
  assert.equal(aliasTableDigest(toAliasMap(data.aliases)), data.source.aliasesSha256);
});

test("migration page alias data matches env.json alias table 1-to-1", { skip: !existsSync(ENV_JSON) }, () => {
  const env = JSON.parse(readFileSync(ENV_JSON, "utf8"));
  const data = readMigrationAliases();
  assert.deepEqual(toAliasMap(data.aliases), env.aliases);
  assert.equal(aliasTableDigest(env.aliases), data.source.aliasesSha256, "the recorded digest is the table's");
});

test("built migration draft pages carry noindex and list every oldName and newName alias", { skip: !built() }, () => {
  const data = readMigrationAliases();
  for (const locale of ["en", "fr"]) {
    const html = readFileSync(join(root, "out", locale === "en" ? "" : "fr", "migration", "index.html"), "utf8");
    assert.match(html, /<meta name="robots" content="noindex,\s*nofollow"/i, `${locale}/migration: noindex`);
    for (const { oldName, newName } of data.aliases) {
      assert.ok(html.includes(oldName), `${locale}/migration renders ${oldName}`);
      assert.ok(html.includes(newName), `${locale}/migration renders ${newName}`);
    }
  }
});
