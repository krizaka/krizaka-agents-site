/* Draft release pages (v1 and migration): unpublished routes under /v1/, /fr/v1/, /migration/, /fr/migration/. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale } from "./i18n";
import { parseFrontmatter, renderMarkdownBody, type Section } from "./pages";
import { RELEASE_VIEW_IDS, type ReleaseViewId } from "./release-diagrams";

export const DRAFT_PAGES = [
  { slug: "v1", file: "v1" },
  { slug: "migration", file: "migration" },
] as const;
export type DraftPageSlug = (typeof DRAFT_PAGES)[number]["slug"];

export type DraftPage = {
  slug: DraftPageSlug;
  title: string;
  description: string;
  html: string;
  sections: Section[];
};

export type DraftPiece =
  | { html: string }
  | { releaseView: ReleaseViewId }
  | { kind: "release-measures" }
  | { kind: "migration-aliases" };

const isReleaseViewId = (id: string): id is ReleaseViewId => (RELEASE_VIEW_IDS as readonly string[]).includes(id);
const DRAFT_MARK = /<!--(release-view:[a-z0-9_]+|release-measures|migration-aliases)-->/g;

/** Reads and renders a draft page markdown file from content/release/<file>.<locale>.md. */
export function readDraftPage(locale: Locale, slug: DraftPageSlug): DraftPage {
  const entry = DRAFT_PAGES.find((p) => p.slug === slug);
  if (!entry) throw new Error(`no draft page ${slug}`);
  const raw = readFileSync(join(process.cwd(), "content", "release", `${entry.file}.${locale}.md`), "utf8");
  const { title, description, body } = parseFrontmatter(raw);
  const { html, sections } = renderMarkdownBody(body);
  return { slug, title, description, html, sections };
}

/** Splits draft page HTML on embedded diagram, measures, and migration-alias markers. */
export function draftPiecesOf(html: string): DraftPiece[] {
  const parts = html.split(DRAFT_MARK);
  const pieces: DraftPiece[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i].trim()) pieces.push({ html: parts[i] });
    const marker = parts[i + 1];
    if (!marker) continue;
    if (marker === "release-measures") {
      pieces.push({ kind: "release-measures" });
    } else if (marker === "migration-aliases") {
      pieces.push({ kind: "migration-aliases" });
    } else if (marker.startsWith("release-view:")) {
      const id = marker.slice("release-view:".length);
      if (!isReleaseViewId(id)) throw new Error(`unknown release view marker: ${id}`);
      pieces.push({ releaseView: id });
    } else {
      throw new Error(`unknown draft marker: ${marker}`);
    }
  }
  return pieces;
}
