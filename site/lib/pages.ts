/* The six pages: content/pages/<file>.<locale>.md (extracted from krizaka-internal by scripts/extract-pages.mjs), rendered at
   build. The words are ours and committed, never fetched; the output is checked by tests/publication.test.mjs. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import type { Locale } from "./i18n";

export const PAGES = [
  { slug: "", file: "what-it-is" },
  { slug: "flow", file: "the-flow" },
  { slug: "rules", file: "rules-that-say-no" },
  { slug: "alerts", file: "alerts-and-the-watchdog" },
  { slug: "cockpit", file: "the-cockpit" },
  { slug: "proofs", file: "proofs" },
] as const;
export type PageSlug = (typeof PAGES)[number]["slug"];

export type Page = { slug: PageSlug; title: string; description: string; html: string; figure: string | null };

const FIGURE = /<p><em>(Fig\. 1[\s\S]*?)<\/em><\/p>/;

function parse(source: string) {
  const m = /^---\ntitle: (".*")\ndescription: (".*")\n---\n\n([\s\S]*)$/.exec(source);
  if (!m) throw new Error("page without its title and description");
  return { title: JSON.parse(m[1]) as string, description: JSON.parse(m[2]) as string, body: m[3] };
}

export function readPage(locale: Locale, slug: PageSlug): Page {
  const entry = PAGES.find((p) => p.slug === slug);
  if (!entry) throw new Error(`no page ${slug}`);
  const { title, description, body } = parse(
    readFileSync(join(process.cwd(), "content", "pages", `${entry.file}.${locale}.md`), "utf8"),
  );
  const html = (marked.parse(body, { async: false }) as string).replaceAll(
    "<table>",
    '<div class="kz-table-scroll"><table class="kz-table">',
  ).replaceAll("</table>", "</table></div>");
  const caption = FIGURE.exec(html);
  return { slug, title, description, html: caption ? html.replace(FIGURE, "<!--figure-->") : html, figure: caption ? caption[1] : null };
}

/** The title of a page in the bar: its first words, short. */
export const NAV_LABELS: Record<Locale, Record<PageSlug, string>> = {
  en: { "": "What it is", flow: "The flow", rules: "Rules that say no", alerts: "Alerts", cockpit: "The cockpit", proofs: "Proofs" },
  fr: { "": "Ce que c'est", flow: "Le flux", rules: "Règles qui disent non", alerts: "Alertes", cockpit: "Le cockpit", proofs: "Preuves" },
};
