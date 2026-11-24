/* The architecture views of the 1.0 draft: laid out by scripts/release-architecture.mjs (@krizaka/architecture) from the model of
   krizaka-agents copied into data/release/ and the views the site picks from it, into lib/release-architecture.json. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ArchView } from "@krizaka/ui/architecture-diagram";
import type { Locale } from "./i18n";

export const RELEASE_VIEW_IDS = ["v1_c1", "v1_c2", "v1_adapters", "v1_tower", "v1_events"] as const;
export type ReleaseViewId = (typeof RELEASE_VIEW_IDS)[number];

export type ModelSource = {
  schema: string;
  source: { repository: string; path: string; copiedDate: string };
  file: string;
  sha256: string;
};

type Layout = { views: ArchView[]; translations: Record<Exclude<Locale, "en">, { views: ArchView[] }> };

let layout: Layout | null = null;
const read = (): Layout =>
  (layout ??= JSON.parse(readFileSync(join(process.cwd(), "lib", "release-architecture.json"), "utf8")) as Layout);

/** One laid-out 1.0 view in a locale. */
export function releaseViewOf(id: ReleaseViewId, locale: Locale): ArchView {
  const views = locale === "en" ? read().views : read().translations[locale].views;
  const view = views.find((v) => v.id === id);
  if (!view) throw new Error(`lib/release-architecture.json has no view ${id} in ${locale}`);
  return view;
}

/** Where the copied model comes from (data/release/model-source.json). */
export function releaseModelSource(): ModelSource {
  return JSON.parse(readFileSync(join(process.cwd(), "data", "release", "model-source.json"), "utf8")) as ModelSource;
}
