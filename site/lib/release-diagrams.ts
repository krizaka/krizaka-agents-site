/* The architecture diagrams generated from the copied LikeC4 model (data/krizaka-agents.c4) into lib/release-diagrams.json. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ArchView } from "@krizaka/ui/architecture-diagram";
import type { Locale } from "./i18n";

export const RELEASE_VIEW_IDS = ["v1_c1", "v1_c2", "v1_tower", "v1_events"] as const;
export type ReleaseViewId = (typeof RELEASE_VIEW_IDS)[number];

export type ModelSourceMeta = {
  schema: string;
  source: { repository: string; path: string; copiedDate: string };
  file: string;
  sha256: string;
};

type ReleaseLayout = {
  schema: string;
  source: { file: string; sha256: string; repository: string; path: string; copiedDate: string };
  views: ArchView[];
  translations: Record<Exclude<Locale, "en">, { views: ArchView[] }>;
};

let cachedLayout: ReleaseLayout | null = null;
const readLayout = (): ReleaseLayout =>
  (cachedLayout ??= JSON.parse(readFileSync(join(process.cwd(), "lib", "release-diagrams.json"), "utf8")) as ReleaseLayout);

/** Returns one generated 1.0 diagram view for the requested locale. */
export function releaseViewOf(id: ReleaseViewId, locale: Locale): ArchView {
  const views = locale === "en" ? readLayout().views : readLayout().translations[locale].views;
  const view = views.find((v) => v.id === id);
  if (!view) throw new Error(`lib/release-diagrams.json has no view ${id} in ${locale}`);
  return view;
}

/** Returns the provenance record of the copied architecture model. */
export function releaseModelSource(): ModelSourceMeta {
  return JSON.parse(readFileSync(join(process.cwd(), "data", "model-source.json"), "utf8")) as ModelSourceMeta;
}
