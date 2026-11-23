#!/usr/bin/env node
/* Extracts the alias table from an env.json contract file into site/content/release/migration-aliases.json.
   Usage: node scripts/sync-env-aliases.mjs [<path to env.json>] */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { problems } from "./publication-rules.mjs";

const SITE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const inputPath = process.argv[2] ?? join(SITE_ROOT, "..", ".inputs", "env.json");
const outPath = join(SITE_ROOT, "content", "release", "migration-aliases.json");

const env = JSON.parse(readFileSync(inputPath, "utf8"));
const providerWords = new Set(env.providerNames?.words ?? []);
const rolePrefixes = ["AGENTS_", "OPS_", "GPU_", "CODE_ANALYSIS_"];

function classifyKind(oldName) {
  const tokens = oldName.split("_").filter(Boolean);
  return tokens.some((t) => providerWords.has(t)) ? "provider-to-role" : "prefix-rename";
}

function detectRolePrefix(newName) {
  const prefix = rolePrefixes.find((p) => newName.startsWith(p));
  if (!prefix) throw new Error(`Unknown role prefix for alias target ${newName}`);
  return prefix;
}

const aliases = Object.entries(env.aliases)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([oldName, newName]) => {
    const entry = {
      oldName,
      newName,
      kind: classifyKind(oldName),
      rolePrefix: detectRolePrefix(newName),
    };
    const issues = problems(JSON.stringify(entry));
    if (issues.length) throw new Error(`Alias ${oldName} breaks publication rules: ${issues.join(", ")}`);
    return entry;
  });

const payload = {
  schema: "krizaka.migration-aliases/1",
  source: {
    repository: "krizaka-agents",
    file: "env.json",
    date: "2026-11-23",
  },
  aliases,
};

writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`sync-env-aliases: wrote ${aliases.length} aliases to content/release/migration-aliases.json`);
