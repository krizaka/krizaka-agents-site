import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The family look: the Cahier faces, and no template tell in the site's own styles (no tracked caps, blur, glow or round card).
const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");

test("the Cahier faces, loaded by next/font/local", () => {
  const fonts = read("app/fonts.ts");
  for (const f of ["young-serif-latin-400.woff2", "atkinson-hyperlegible-next-latin-wght.woff2", "courier-prime-latin-400.woff2"])
    assert.ok(fonts.includes(f), f);
});

test("no template tell in the styles", () => {
  const css = read("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(css, /text-transform:\s*uppercase/);
  assert.doesNotMatch(css, /backdrop-filter|blur\(|radial-gradient/);
  assert.doesNotMatch(css, /border-radius:\s*(1\d|[2-9]\d)px/);
});

test("both themes and the phone are served", () => {
  const root = read("app/components/SiteRoot.tsx");
  assert.match(root, /ThemeScript/);
  assert.match(root, /ThemeToggle/);
  assert.match(read("app/globals.css"), /min-width: 900px/);
});
