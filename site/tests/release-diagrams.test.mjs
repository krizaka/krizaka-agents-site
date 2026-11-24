/* The 1.0 draft's architecture views: laid out by @krizaka/architecture from the copied krizaka-agents model and the views this
   site picks (scripts/release-architecture.mjs). The CI job « Architecture views » proves the layout current against the org base;
   these tests prove what needs no checkout: the copy is the recorded one, the views add nothing to the model, the words pass the
   publication rules, and the built pages draw every view. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "parse5";
import { sha256 } from "../scripts/proofs.mjs";
import { aiLook, problems } from "../scripts/publication-rules.mjs";
import { built, root } from "./published-texts.mjs";

const VIEW_IDS = ["v1_c1", "v1_c2", "v1_adapters", "v1_tower", "v1_events"];
const data = (name) => join(root, "data", "release", name);
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const layout = () => readJson(join(root, "lib", "release-architecture.json"));

function viewStrings(view) {
  const out = [view.title];
  for (const n of view.nodes) out.push(...[n.title, n.technology, n.description].filter((s) => s !== null));
  for (const e of view.edges) if (e.label !== null) out.push(e.label);
  return out;
}

function find(node, match, out = []) {
  if (match(node)) out.push(node);
  for (const child of (node.childNodes ?? []).concat(node.content?.childNodes ?? [])) find(child, match, out);
  return out;
}
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const textOf = (node) => (node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(textOf).join(""));

test("the copied model is the recorded one: its source, its date and its sha256", () => {
  const meta = readJson(data("model-source.json"));
  assert.equal(meta.schema, "krizaka.model-source/1");
  assert.equal(meta.source.repository, "krizaka-agents");
  assert.equal(meta.source.path, "docs/architecture/krizaka-agents.c4");
  assert.match(meta.source.copiedDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(sha256(readFileSync(data(meta.file))), meta.sha256);
  const input = join(root, "..", ".inputs", "krizaka-agents.c4");
  if (existsSync(input)) assert.equal(sha256(readFileSync(input)), meta.sha256, "the copy is the model handed to the session");
});

test("the layout was made from the committed model, views and French words", () => {
  const out = layout();
  assert.equal(out.schema, "krizaka.layout/1");
  assert.equal(out.tool.name, "@krizaka/architecture");
  assert.equal(out.check.status, "ok");
  const recorded = Object.fromEntries(out.sources.model.map((m) => [m.path, m.sha256]));
  assert.deepEqual(recorded, {
    "krizaka-agents.c4": sha256(readFileSync(data("krizaka-agents.c4"))),
    "release-views.c4": sha256(readFileSync(data("release-views.c4"))),
  });
  assert.equal(out.translations.fr.sha256, sha256(readFileSync(data("krizaka-agents.fr.json"))));
  assert.deepEqual(out.views.map((v) => v.id), VIEW_IDS);
  assert.deepEqual(out.translations.fr.views.map((v) => v.id), VIEW_IDS);
});

test("the site's views only pick elements of the model: no element, no relationship of their own", () => {
  const views = readFileSync(data("release-views.c4"), "utf8").replace(/\/\/.*$/gm, "").replace(/^\s*exclude [\w.]+ -> [\w.]+$/gm, "");
  assert.doesNotMatch(views, /\bmodel\s*\{|->|\bextend\b/, "release-views.c4 holds views only (an arrow only in an exclude)");
  for (const id of VIEW_IDS) assert.match(views, new RegExp(`view ${id}\\b`), `release-views.c4 declares ${id}`);
});

/* The org base (specification.c4, org.c4) lives in krizaka/.github: the CI job « Architecture views » checks it out, a session can
   point ORG_ARCHITECTURE at its docs/architecture. Without it, an override of a base element is checked there only. */
const ORG = process.env.ORG_ARCHITECTURE;

test("a view says a model description in other words only to drop « harness »: « system » in its place, nothing else", () => {
  const views = readFileSync(data("release-views.c4"), "utf8");
  const overrides = [...views.matchAll(/include ([\w.]+) with \{\s*description '([^']*)'\s*\}/g)];
  assert.ok(overrides.length > 0);
  assert.equal((views.match(/ with \{/g) ?? []).length, overrides.length, "an override says a description and nothing else");
  const sources = [readFileSync(data("krizaka-agents.c4"), "utf8")];
  if (ORG) sources.push(readFileSync(join(ORG, "org.c4"), "utf8"));
  for (const [, element, words] of overrides) {
    assert.doesNotMatch(words, /harness/i, element);
    const original = `description '${words.replace(/\bsystem\b/, "harness")}'`;
    const found = sources.some((text) => text.includes(original));
    if (ORG || element.startsWith("agents.")) assert.ok(found, `${element}: the model says « ${original} »`);
  }
});

test("every word the views draw passes the publication rules, in both languages, with the same geometry", () => {
  const out = layout();
  const box = (v) => v.nodes.map(({ id, x, y, width, height }) => [id, x, y, width, height]);
  for (const en of out.views) {
    const fr = out.translations.fr.views.find((v) => v.id === en.id);
    assert.deepEqual(box(fr), box(en), `${en.id}: one geometry`);
    assert.notEqual(fr.title, en.title, `${en.id}: the French title is French`);
    for (const s of [...viewStrings(en), ...viewStrings(fr)]) {
      assert.deepEqual(problems(s), [], `${en.id}: « ${s} »`);
      assert.deepEqual(aiLook(s), [], `${en.id}: « ${s} »`);
    }
  }
});

/* The desktop column of a page is 900 px and the kit draws a view at no less than 0.6 of its size, with its 53 px of margin: a
   wider view would scroll on a desktop, which scripts/check-overflow.mjs refuses. */
test("every view fits the desktop column at the kit's smallest scale", () => {
  for (const v of layout().views) assert.ok((v.bounds.width + 53) * 0.6 <= 900, `${v.id}: ${v.bounds.width}px wide`);
});

test("the built 1.0 draft draws every view with its caption, in English and in French", { skip: !built() }, () => {
  for (const locale of ["en", "fr"]) {
    const file = join(root, "out", locale === "en" ? "" : "fr", "v1", "index.html");
    const page = parse(readFileSync(file, "utf8"));
    const captions = readJson(join(root, "messages", `${locale}.json`)).release.captions;
    for (const id of VIEW_IDS) {
      const [figure] = find(page, (n) => attr(n, "data-view") === id);
      assert.ok(figure, `${file}: draws ${id}`);
      assert.ok(find(figure, (n) => n.nodeName === "svg").length > 0, `${file}/${id}: an SVG`);
      assert.ok(textOf(figure).includes(captions[id]), `${file}/${id}: its caption`);
    }
  }
});
