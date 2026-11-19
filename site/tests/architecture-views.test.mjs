import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "parse5";
import { built, root } from "./published-texts.mjs";

// The four architecture views (krizaka-internal#4184): where each page places one, the layout they are drawn from (made from
// krizaka/.github's model; `node scripts/architecture.mjs check <checkout>` proves it current in CI), the decided captions, and,
// once built, the drawing and its words on the page in both languages.
const PLACES = [
  { view: "agents_context", file: "what-it-is", section: 1, path: "" },
  { view: "agents_containers", file: "the-flow", section: 2, path: "flow/" },
  { view: "pr_life", file: "the-flow", section: 4, path: "flow/" },
  { view: "alert_life", file: "alerts-and-the-watchdog", section: 2, path: "alerts/" },
];
const LOCALES = ["en", "fr"];
const NUMBER_WORDS = { en: { 9: "nine", 12: "twelve" }, fr: { 9: "neuf", 12: "douze" } };
const layout = JSON.parse(readFileSync(join(root, "lib", "architecture.json"), "utf8"));
const viewsIn = (locale) => (locale === "en" ? layout.views : layout.translations[locale].views);
const viewOf = (id, locale) => viewsIn(locale).find((v) => v.id === id);
const messages = (locale) => JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));
const stepsOf = (view) => view.edges.filter((e) => e.step !== null).sort((a, b) => a.step - b.step);

/** The § section of a page source that holds a text, by number. */
function sectionOf(source, text) {
  const at = source.indexOf(text);
  if (at === -1) return null;
  const headings = [...source.slice(0, at).matchAll(/^### § (\d+) — /gm)];
  return headings.length ? Number(headings.at(-1)[1]) : null;
}

test("each view is placed once, in the section decided, in both languages; opsdb_sync is not on the site", () => {
  for (const locale of LOCALES) {
    const sources = Object.fromEntries(
      [...new Set(PLACES.map((p) => p.file))].map((f) => [f, readFileSync(join(root, "content", "pages", `${f}.${locale}.md`), "utf8")]),
    );
    for (const { view, file, section } of PLACES) {
      const mark = `<!--view:${view}-->`;
      assert.equal(sources[file].split(mark).length - 1, 1, `${file}.${locale}.md places ${view} once`);
      assert.equal(sectionOf(sources[file], mark), section, `${view} in § ${section} of ${file}.${locale}.md`);
    }
    for (const text of Object.values(sources)) assert.doesNotMatch(text, /<!--view:opsdb_sync-->/);
  }
});

test("the layout was made from the shared model, checked, with every view in both languages on the same geometry", () => {
  assert.equal(layout.schema, "krizaka.layout/1");
  assert.equal(layout.check.status, "ok");
  assert.equal(layout.check.system, "agents");
  assert.deepEqual(layout.sources.model.map((f) => f.path), ["krizaka-agents.c4"]);
  assert.deepEqual(layout.sources.base.map((f) => f.path), ["org.c4", "specification.c4"]);
  assert.equal(layout.translations.fr.path, "krizaka-agents.fr.json");
  const box = (v) => v.nodes.map(({ id, x, y, width, height }) => [id, x, y, width, height]);
  for (const { view } of PLACES) {
    const en = viewOf(view, "en");
    const fr = viewOf(view, "fr");
    assert.ok(en && fr, `${view} in en and fr`);
    assert.deepEqual(box(fr), box(en), `${view}: one geometry`);
    assert.notEqual(fr.title, en.title, `${view}: the French title is translated`);
  }
});

test("every view has its decided caption, and a flow's caption counts the model's steps", () => {
  for (const locale of LOCALES) {
    const captions = messages(locale).views.captions;
    assert.deepEqual(Object.keys(captions).sort(), PLACES.map((p) => p.view).sort(), locale);
    for (const caption of Object.values(captions)) assert.ok(caption.length > 20 && !caption.includes("Fig."), caption);
    const steps = stepsOf(viewOf("pr_life", locale));
    assert.deepEqual(steps.map((e) => e.step), Array.from({ length: 12 }, (_, i) => i + 1));
    assert.match(captions.pr_life, new RegExp(NUMBER_WORDS[locale][steps.length]), `${locale}: pr_life caption`);
    assert.equal(stepsOf(viewOf("alert_life", locale)).length, 9);
  }
});

/** The elements of a parsed page that match a test, depth first. */
function find(node, match, out = []) {
  if (match(node)) out.push(node);
  for (const child of (node.childNodes ?? []).concat(node.content?.childNodes ?? [])) find(child, match, out);
  return out;
}
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const text = (node) => (node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(text).join(""));

test("a built page draws its views, with the caption and, for a flow, the numbered steps as an open list", { skip: !built() }, () => {
  for (const locale of LOCALES) {
    const captions = messages(locale).views.captions;
    for (const { view, path } of PLACES) {
      const file = join(root, "out", locale === "en" ? "" : "fr", path, "index.html");
      const page = parse(readFileSync(file, "utf8"));
      const [figure] = find(page, (n) => attr(n, "data-view") === view);
      assert.ok(figure, `${file}: ${view} drawn`);
      assert.equal(find(figure, (n) => n.nodeName === "svg").length > 0, true, `${view}: an svg`);
      assert.ok(text(figure).includes(captions[view]), `${view}: its caption`);
      const model = viewOf(view, locale);
      if (!model.dynamic) continue;
      const open = find(figure, (n) => n.nodeName === "details" && attr(n, "open") !== undefined);
      assert.equal(open.length, 1, `${view}: the text version is open`);
      const items = find(open[0], (n) => n.nodeName === "ol").flatMap((ol) => find(ol, (n) => n.nodeName === "li"));
      assert.equal(items.length, stepsOf(model).length, `${view}: one list item per step`);
      assert.ok(text(items[0]).includes(stepsOf(model)[0].label), `${view}: the first step's words`);
    }
  }
});
