import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

// The docs layout: the six pages and the current page's § sections in the left margin, the § numbers in the margin.
const built = existsSync(new URL("../out/flow/index.html", import.meta.url));
const html = (f) => readFileSync(new URL(`../out/${f}`, import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const root = readFileSync(new URL("../app/components/SiteRoot.tsx", import.meta.url), "utf8");

test("the top bar has no second row of page links", () => {
  assert.doesNotMatch(root, /kz-pages|NAV_LABELS/);
});

test("the margin shows from 1024 px and the numbers sit left of the red line", () => {
  assert.match(css, /@media \(min-width: 1024px\)[\s\S]*\.kz-margin-nav[\s\S]*position: sticky/);
  assert.match(css, /\.kz-prose h3\[data-n\]::before[\s\S]*position: absolute/);
});

for (const [locale, prefix, current, sections] of [
  ["en", "flow/index.html", "The flow", 5],
  ["fr", "fr/proofs/index.html", "Preuves", 5],
]) {
  test(`${locale}: the nav lists the six pages, marks the current one and lists its sections, headings keep their text`, { skip: !built }, () => {
    const page = html(prefix);
    const nav = /<nav[^>]*kz-margin-nav[\s\S]*?<\/nav>/.exec(page)?.[0] ?? "";
    assert.equal((nav.match(/<a [^>]*href="[^"#]*"/g) ?? []).length, 6, "six pages");
    assert.match(nav, new RegExp(`aria-current="page"[^>]*>${current}<`));
    assert.equal((nav.match(/href="#s\d+"/g) ?? []).length, sections, "its § sections");
    assert.match(nav, /<button[^>]*aria-expanded/);
    assert.doesNotMatch(page, /<h3[^>]*>§ \d/, "no § in the heading text");
    assert.match(page, /<h3 id="s1" data-n="§ 1">/);
  });
}
