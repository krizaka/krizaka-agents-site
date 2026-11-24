/* Typed loader and pure summaries for env-var migration aliases (content/release/migration-aliases.json). */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const ALIAS_KINDS = ["prefix-rename", "provider-to-role"] as const;
export type AliasKind = (typeof ALIAS_KINDS)[number];

export const ROLE_PREFIXES = ["AGENTS_", "OPS_", "GPU_", "CODE_ANALYSIS_"] as const;
export type RolePrefix = (typeof ROLE_PREFIXES)[number];

export type MigrationAlias = {
  oldName: string;
  newName: string;
  kind: AliasKind;
  rolePrefix: RolePrefix;
};

export type MigrationAliasesData = {
  schema: string;
  source: {
    repository: string;
    file: string;
    date: string;
  };
  aliases: MigrationAlias[];
};

export type AliasSummary = {
  total: number;
  byKind: Record<AliasKind, number>;
  byRolePrefix: Record<RolePrefix, number>;
};

/** Reads the migration aliases JSON file. */
export function readMigrationAliases(): MigrationAliasesData {
  return JSON.parse(
    readFileSync(join(process.cwd(), "content", "release", "migration-aliases.json"), "utf8"),
  ) as MigrationAliasesData;
}

/** Converts the structured alias list back into the plain oldName -> newName map matching env.json. */
export function toAliasMap(aliases: readonly MigrationAlias[]): Record<string, string> {
  return Object.fromEntries(aliases.map((a) => [a.oldName, a.newName]));
}

/** Counts aliases by migration kind and target role prefix. */
export function aliasSummary(aliases: readonly MigrationAlias[]): AliasSummary {
  const byKind: Record<AliasKind, number> = { "prefix-rename": 0, "provider-to-role": 0 };
  const byRolePrefix: Record<RolePrefix, number> = { AGENTS_: 0, OPS_: 0, GPU_: 0, CODE_ANALYSIS_: 0 };
  for (const a of aliases) {
    byKind[a.kind] += 1;
    byRolePrefix[a.rolePrefix] += 1;
  }
  return { total: aliases.length, byKind, byRolePrefix };
}
