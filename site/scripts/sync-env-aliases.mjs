#!/usr/bin/env node
/* Copies the alias table (old name → new name, steps 20a and 20b) of krizaka-agents' environment contract (env.json) into
   content/release/migration-aliases.json, with the sha256 of the table so a test proves the page holds exactly that table, in CI
   too, where env.json is not. The contract itself is never committed here: it names private things.
   Usage: node scripts/sync-env-aliases.mjs <path to env.json> */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { problems } from "./publication-rules.mjs";

const ROLE_PREFIXES = ["AGENTS_", "OPS_", "GPU_", "CODE_ANALYSIS_"];
const byName = ([a], [b]) => (a < b ? -1 : Number(a > b));

/** The sha256 of an alias table, its keys in code-point order: the same table gives the same digest, whatever its order. */
export const aliasTableDigest = (aliases) =>
  createHash("sha256").update(JSON.stringify(Object.fromEntries(Object.entries(aliases).sort(byName)))).digest("hex");

function roleOf(newName) {
  const prefix = ROLE_PREFIXES.find((p) => newName.startsWith(p));
  if (!prefix) throw new Error(`Unknown role prefix for alias target ${newName}`);
  return prefix;
}

/** The page's entries from env.json: sorted by old name, each with its kind and the role prefix of its new name. */
export function aliasesOf(env, date) {
  const providerWords = new Set(env.providerNames?.words ?? []);
  const kindOf = (oldName) =>
    oldName.split("_").some((t) => providerWords.has(t)) ? "provider-to-role" : "prefix-rename";
  const aliases = Object.entries(env.aliases)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([oldName, newName]) => {
      const entry = { oldName, newName, kind: kindOf(oldName), rolePrefix: roleOf(newName) };
      const issues = problems(JSON.stringify(entry));
      if (issues.length) throw new Error(`Alias ${oldName} breaks publication rules: ${issues.join(", ")}`);
      return entry;
    });
  return {
    schema: "krizaka.migration-aliases/1",
    source: { repository: "krizaka-agents", file: "env.json", date, aliasesSha256: aliasTableDigest(env.aliases) },
    aliases,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [input, date = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
  if (!input) {
    console.error("usage: sync-env-aliases.mjs <env.json> [<copy date>]");
    process.exit(2);
  }
  const out = join(fileURLToPath(new URL("..", import.meta.url)), "content", "release", "migration-aliases.json");
  const payload = aliasesOf(JSON.parse(readFileSync(input, "utf8")), date);
  writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`sync-env-aliases: wrote ${payload.aliases.length} aliases to content/release/migration-aliases.json`);
}
