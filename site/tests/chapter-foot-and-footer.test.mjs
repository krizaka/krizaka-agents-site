import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

// Every page ends with a link to the next one in the nav order; the footer groups are columns from 1024 px.
const built = existsSync(new URL("../out/flow/index.html", import.meta.url));
const out = (f) => new URL(`../out/${f}`, import.meta.url);
const html = (f) => readFileSync(out(f), "utf8");
const pagesSource = readFileSync(new URL("../lib/pages.ts", import.meta.url), "utf8");
const slugs = [...pagesSource.slice(pagesSource.indexOf("PAGES = ["), pagesSource.indexOf("] as const")).matchAll(/slug: "([a-z]*)"/g)].map((m) => m[1]);
const path = (locale, slug) => `${locale === "fr" ? "fr/" : ""}${slug ? `${slug}/` : ""}index.html`;
const url = (locale, slug) => `${locale === "fr" ? "/fr" : ""}/${slug ? `${slug}/` : ""}`;
const foot = (page) => /<nav[^>]*kz-chapter-foot[\s\S]*?<\/nav>/.exec(page)?.[0] ?? "";

test("the nav order has six pages", () => assert.equal(slugs.length, 6));

for (const locale of ["en", "fr"]) {
  slugs.forEach((slug, i) => {
    test(`${locale}/${slug || "home"}: ends with the link to the next page, and the previous one`, { skip: !built }, () => {
      const nav = foot(html(path(locale, slug)));
      assert.notEqual(nav, "", "a chapter foot");
      const next = slugs[i + 1];
      const prev = slugs[i - 1];
      if (next === undefined) assert.doesNotMatch(nav, /rel="next"/, "the last page has no next");
      else assert.match(nav, new RegExp(`href="${url(locale, next)}"[^>]*rel="next"|rel="next"[^>]*href="${url(locale, next)}"`));
      if (prev === undefined) assert.doesNotMatch(nav, /rel="prev"/, "the first page has no previous");
      else assert.match(nav, new RegExp(`href="${url(locale, prev)}"[^>]*rel="prev"|rel="prev"[^>]*href="${url(locale, prev)}"`));
    });
  });
}

for (const locale of ["en", "fr"]) {
  test(`${locale}: the footer groups are columns from 1024 px, and the stylesheet carries those rules`, { skip: !built }, () => {
    const page = html(path(locale, ""));
    const footer = page.slice(page.indexOf("kz-footer"));
    assert.match(footer, /<nav[^>]*class="[^"]*lg:grid[^"]*lg:grid-cols-\[/);
    assert.match(footer, /<ul[^>]*class="[^"]*lg:flex-col/);
    const dir = out("_next/static/chunks/").pathname;
    const css = readdirSync(dir).filter((f) => f.endsWith(".css")).map((f) => readFileSync(dir + f, "utf8")).join("");
    assert.match(css, /\.lg\\:grid-cols-\\\[repeat/);
    assert.match(css, /\.lg\\:flex-col/);
  });
}

test("the page links the footer and the chapter foot come from the site's messages", () => {
  for (const l of ["en", "fr"]) {
    const m = JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), "utf8"));
    assert.ok(m.chapterFoot.previous && m.chapterFoot.next && m.chapterFoot.label);
  }
});
