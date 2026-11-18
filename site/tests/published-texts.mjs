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

/** [path, text] of each built page, sitemap and robots file, without its inline scripts. */
export const builtTexts = () =>
  walk(join(root, "out"))
    .filter((f) => /\.(html|xml)$|robots\.txt$/.test(f))
    .map((f) => [relative(root, f), readFileSync(f, "utf8").replace(/<script[\s\S]*?<\/script>/g, "")]);
