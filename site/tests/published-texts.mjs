/* What the site publishes, as texts to check: the sources of the pages (content, messages, lib, app) and, once built, every
   file of out/ (the words of the page, not the Next runtime's inline scripts). Shared by the publication checks. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const root = new URL("..", import.meta.url).pathname;
export const SOURCE_DIRS = ["content", "messages", "lib", "app"];
const TEXT_SOURCE = /\.(md|mdx|json|ts|tsx|css|txt|svg)$/;

export const walk = (dir) =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

/** Every file under the source folders, relative to site/. */
export const sourcePaths = () => SOURCE_DIRS.flatMap((d) => walk(join(root, d))).map((f) => relative(root, f));

/** [path, text] of each text source. */
export const sourceTexts = () =>
  sourcePaths()
    .filter((f) => TEXT_SOURCE.test(f))
    .map((f) => [f, readFileSync(join(root, f), "utf8")]);

export const built = () => existsSync(join(root, "out"));

/** The page without its script elements (any case, any closing form, an unclosed one up to the end): only its words remain. */
export function withoutScripts(html) {
  const lower = html.toLowerCase();
  let kept = "";
  let at = 0;
  for (;;) {
    const open = lower.indexOf("<script", at);
    if (open === -1) return kept + html.slice(at);
    kept += `${html.slice(at, open)} `;
    const close = lower.indexOf("</script", open);
    const end = close === -1 ? -1 : lower.indexOf(">", close);
    if (end === -1) return kept;
    at = end + 1;
  }
}

/** [path, text] of each built page, sitemap and robots file, without its inline scripts. */
export const builtTexts = () =>
  walk(join(root, "out"))
    .filter((f) => /\.(html|xml)$|robots\.txt$/.test(f))
    .map((f) => [relative(root, f), withoutScripts(readFileSync(f, "utf8"))]);
