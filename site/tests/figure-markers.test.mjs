import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { built, root, walk } from "./published-texts.mjs";

// A « Fig. N » marker points at a figure: no page carries one without a figure element in the same section.
const MARKER = /Fig\.\s*\d/;
const FIGURE = /<figure[\s\S]*?<\/figure>/g;
// Only the flow page draws a figure today; the diagrams PR adds its own captions (and extends this list).
const PAGES_WITH_A_FIGURE = new Set(["the-flow.en.md", "the-flow.fr.md"]);

test("a source page has a « Fig. N » marker only if it draws a figure", () => {
  const pages = join(root, "content", "pages");
  for (const file of walk(pages).filter((f) => f.endsWith(".md"))) {
    const name = file.split("/").pop();
    if (!PAGES_WITH_A_FIGURE.has(name)) assert.doesNotMatch(readFileSync(file, "utf8"), MARKER, name);
  }
});

test("a built page has no « Fig. N » marker outside a figure element", { skip: !built() }, () => {
  for (const file of walk(join(root, "out")).filter((f) => f.endsWith("index.html"))) {
    const html = readFileSync(file, "utf8").replace(FIGURE, "").replace(/<script[\s\S]*?<\/script>/gi, "");
    assert.doesNotMatch(html, MARKER, file);
  }
});
