/* The architecture views a page draws: laid out from krizaka/.github docs/architecture/krizaka-agents.c4 (the model the blog
   draws too) into lib/architecture.json by scripts/architecture.mjs, with their French words; the check of that file proves it
   was made from the model as it is. A page places one with `<!--view:<id>-->` in its source. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ArchView } from "@krizaka/ui/architecture-diagram";
import type { Locale } from "./i18n";

/** The views the site shows; `opsdb_sync` stays in the blog's chapter. */
export const VIEW_IDS = ["agents_context", "agents_containers", "pr_life", "alert_life"] as const;
export type ViewId = (typeof VIEW_IDS)[number];

type Layout = { views: ArchView[]; translations: Record<Exclude<Locale, "en">, { views: ArchView[] }> };

let layout: Layout | null = null;
const read = (): Layout =>
  (layout ??= JSON.parse(readFileSync(join(process.cwd(), "lib", "architecture.json"), "utf8")) as Layout);

export function viewOf(id: ViewId, locale: Locale): ArchView {
  const views = locale === "en" ? read().views : read().translations[locale].views;
  const view = views.find((v) => v.id === id);
  if (!view) throw new Error(`lib/architecture.json has no view ${id} in ${locale}`);
  return view;
}

const isViewId = (id: string): id is ViewId => (VIEW_IDS as readonly string[]).includes(id);
const MARK = /<!--view:([a-z_]+)-->/g;

/** A stretch of a page's HTML, or a view drawn there. */
export type Piece = { html: string } | { view: ViewId };

/** The page's HTML cut at each `<!--view:<id>-->`; an id the site does not show stops the build. */
export function piecesOf(html: string): Piece[] {
  const parts = html.split(MARK);
  return parts.flatMap((part, i): Piece[] => {
    if (i % 2 === 0) return part.trim() ? [{ html: part }] : [];
    if (!isViewId(part)) throw new Error(`no view ${part} on this site (${VIEW_IDS.join(", ")})`);
    return [{ view: part }];
  });
}
