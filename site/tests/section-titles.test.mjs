import { test } from "node:test";
import assert from "node:assert/strict";
import { numberHeadings, readPage } from "../lib/pages.ts";

// The margin nav gets plain text: React escapes it once, so an entity already in the title would show as « c&#39;est ».
test("a section title is plain text: entities decoded, inline tags dropped, the heading HTML untouched", () => {
  const html = "<h3>§ 1 — Ce que c&#39;est &amp; &quot;ça&quot; &lt;b&gt;</h3><h3>Le <code>flux</code> <em>vu</em></h3>";
  const { html: out, sections } = numberHeadings(html);
  assert.deepEqual(
    sections.map((s) => s.title),
    ['Ce que c\'est & "ça" <b>', "Le flux vu"],
  );
  assert.ok(out.includes("Ce que c&#39;est &amp; &quot;ça&quot; &lt;b&gt;</h3>"));
  assert.ok(out.includes("<h3 id=\"s-le-flux-vu\">Le <code>flux</code> <em>vu</em></h3>"));
});

test("no section title of a real page holds an entity", () => {
  for (const locale of ["fr", "en"])
    for (const s of readPage(locale, "").sections) assert.doesNotMatch(s.title, /&(#\d+|[a-z]+);/i, s.title);
});
