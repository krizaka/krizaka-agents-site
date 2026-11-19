import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "parse5";
import { built, root, walk } from "./published-texts.mjs";

// A « Fig. N » marker points at a figure: no page carries one without a figure element in the same section.
const MARKER = /Fig\.\s*\d/;
const SKIPPED_ELEMENTS = new Set(["figure", "script", "style"]);

/** The text nodes of a parsed page that sit outside a figure (and outside scripts and styles). */
function textOutsideFigures(node) {
  if (node.nodeName === "#text") return [node.value];
  if (SKIPPED_ELEMENTS.has(node.nodeName)) return [];
  return (node.childNodes ?? []).concat(node.content?.childNodes ?? []).flatMap(textOutsideFigures);
}
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
    const text = textOutsideFigures(parse(readFileSync(file, "utf8"))).join(" ");
    assert.doesNotMatch(text, MARKER, file);
  }
});

test("the reader finds a marker in a text node and ignores one inside a figure or a script", () => {
  const read = (html) => textOutsideFigures(parse(html)).join(" ");
  assert.match(read("<p>See Fig. 2</p>"), MARKER);
  assert.doesNotMatch(read("<figure><figcaption>Fig. 1</figcaption></figure><script>var a='Fig. 3'</script>"), MARKER);
});
