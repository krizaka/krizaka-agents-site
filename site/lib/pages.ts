/* The six pages: content/pages/<file>.<locale>.md (extracted from the private drafts by scripts/extract-pages.mjs), rendered at
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

/** A § section of a page: its anchor, its number in the margin (null for an unnumbered heading) and its text. */
export type Section = { id: string; n: number | null; title: string };
export type Page = { slug: PageSlug; title: string; description: string; html: string; figure: string | null; sections: Section[] };

const FIGURE = /<p><em>(Fig\. 1[\s\S]*?)<\/em><\/p>/;

function parse(source: string) {
  const m = /^---\ntitle: (".*")\ndescription: (".*")\n---\n\n([\s\S]*)$/.exec(source);
  if (!m) throw new Error("page without its title and description");
  return { title: JSON.parse(m[1]) as string, description: JSON.parse(m[2]) as string, body: m[3] };
}

/* marked escapes exactly these five characters, so these five are all a heading can hold; `&amp;` is decoded last. */
const ENTITIES: ReadonlyArray<readonly [string, string]> = [["&lt;", "<"], ["&gt;", ">"], ["&quot;", '"'], ["&#39;", "'"], ["&amp;", "&"]];

/** The text outside the tags: marked writes a literal `<` as `&lt;`, so every raw `<` opens a tag that the next `>` closes. */
function outsideTags(html: string): string {
  let text = "";
  let inTag = false;
  for (const ch of html) {
    if (ch === "<") inTag = true;
    else if (ch === ">" && inTag) inTag = false;
    else if (!inTag) text += ch;
  }
  return text;
}

/** The plain text of a rendered heading: inline tags dropped, entities decoded. */
const plainText = (html: string) => ENTITIES.reduce((t, [from, to]) => t.replaceAll(from, to), outsideTags(html));

const HEADING = /<h3>(?:§ (\d+) — )?([\s\S]*?)<\/h3>/g;

/** The « § N — » of a heading moves into the margin: the heading keeps its text, gets an anchor and a `data-n` the styles draw. */
export function numberHeadings(html: string): { html: string; sections: Section[] } {
  const sections: Section[] = [];
  const out = html.replace(HEADING, (_all, n: string | undefined, title: string) => {
    const text = plainText(title);
    const id = n ? `s${n}` : `s-${slugOf(text)}`;
    sections.push({ id, n: n ? Number(n) : null, title: text });
    const marker = n ? ` data-n="§ ${n}"` : "";
    return `<h3 id="${id}"${marker}>${title}</h3>`;
  });
  return { html: out, sections };
}

const slugOf = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function readPage(locale: Locale, slug: PageSlug): Page {
  const entry = PAGES.find((p) => p.slug === slug);
  if (!entry) throw new Error(`no page ${slug}`);
  const { title, description, body } = parse(
    readFileSync(join(process.cwd(), "content", "pages", `${entry.file}.${locale}.md`), "utf8"),
  );
  const withTables = (marked.parse(body, { async: false }) as string)
    .replaceAll("<table>", '<div class="kz-table-scroll"><table class="kz-table">')
    .replaceAll("</table>", "</table></div>");
  const numbered = numberHeadings(withTables);
  const html = numbered.html;
  const caption = FIGURE.exec(html);
  return { slug, title, description, html: caption ? html.replace(FIGURE, "<!--figure-->") : html, figure: caption ? caption[1] : null, sections: numbered.sections };
}

/** The title of a page in the bar: its first words, short. */
export const NAV_LABELS: Record<Locale, Record<PageSlug, string>> = {
  en: { "": "What it is", flow: "The flow", rules: "Rules that say no", alerts: "Alerts", cockpit: "The cockpit", proofs: "Proofs" },
  fr: { "": "Ce que c'est", flow: "Le flux", rules: "Règles qui disent non", alerts: "Alertes", cockpit: "Le cockpit", proofs: "Preuves" },
};

/** The page before and the page after one, in the order of PAGES (the order of the left nav); null at either end. */
export function neighbours(slug: PageSlug): { previous: PageSlug | null; next: PageSlug | null } {
  const i = PAGES.findIndex((p) => p.slug === slug);
  return { previous: PAGES[i - 1]?.slug ?? null, next: PAGES[i + 1]?.slug ?? null };
}
