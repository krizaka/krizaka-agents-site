import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "parse5";
import { sha256 } from "../scripts/proofs.mjs";
import { aiLook, problems } from "../scripts/publication-rules.mjs";
import { parseC4Model, generateReleaseDiagrams, RELEASE_VIEW_IDS } from "../scripts/generate-release-diagrams.mjs";
import { built, root } from "./published-texts.mjs";

const LOCALES = ["en", "fr"];

const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), "utf8"));

/** Collect all string leaves from an ArchView (titles, technologies, descriptions, edge labels). */
function viewStrings(view) {
  const out = [view.title];
  for (const n of view.nodes) {
    out.push(n.title);
    if (n.technology) out.push(n.technology);
    if (n.description) out.push(n.description);
  }
  for (const e of view.edges) {
    if (e.label) out.push(e.label);
  }
  return out;
}

/** Collect elements matching a predicate from a parse5 tree. */
function find(node, match, out = []) {
  if (match(node)) out.push(node);
  for (const child of (node.childNodes ?? []).concat(node.content?.childNodes ?? [])) find(child, match, out);
  return out;
}

const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const textOf = (node) => (node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(textOf).join(""));

test("the copied architecture model records its source and date and matches its sha256", () => {
  const meta = readJson("data/model-source.json");
  assert.equal(meta.schema, "krizaka.model-source/1");
  assert.equal(meta.file, "krizaka-agents.c4");
  assert.equal(meta.source.repository, "krizaka-agents");
  assert.equal(meta.source.path, "docs/architecture/krizaka-agents.c4");
  assert.match(meta.source.copiedDate, /^\d{4}-\d{2}-\d{2}$/);
  const c4Bytes = readFileSync(join(root, "data", meta.file));
  assert.equal(sha256(c4Bytes), meta.sha256);

  const inputsC4 = join(root, "..", ".inputs", "krizaka-agents.c4");
  if (existsSync(inputsC4)) {
    assert.equal(sha256(readFileSync(inputsC4)), meta.sha256, "site/data/krizaka-agents.c4 matches .inputs/krizaka-agents.c4");
  }
});

test("parseC4Model parses the copied .c4 model elements, relations, and public views", () => {
  const source = readFileSync(join(root, "data", "krizaka-agents.c4"), "utf8");
  const model = parseC4Model(source);
  assert.equal(model.elements.size, 46);
  assert.equal(model.relations.length, 87);
  assert.ok(model.views.has("agents_public_current"));
  assert.ok(model.views.has("agents_public_target"));
});

test("generateReleaseDiagrams builds C1, C2, tower, and event flow deterministically in EN and FR", () => {
  const generated = generateReleaseDiagrams(root);
  const committedText = readFileSync(join(root, "lib", "release-diagrams.json"), "utf8");
  assert.equal(`${JSON.stringify(generated, null, 2)}\n`, committedText, "lib/release-diagrams.json matches generated output");

  assert.equal(generated.schema, "krizaka.layout/1");
  assert.equal(generated.source.file, "krizaka-agents.c4");
  assert.deepEqual(
    generated.views.map((v) => v.id),
    [...RELEASE_VIEW_IDS],
  );
  assert.deepEqual(
    generated.translations.fr.views.map((v) => v.id),
    [...RELEASE_VIEW_IDS],
  );

  const box = (v) => v.nodes.map(({ id, x, y, width, height }) => [id, x, y, width, height]);
  const model = parseC4Model(readFileSync(join(root, "data", "krizaka-agents.c4"), "utf8"));
  const targetIncludes = model.views.get("agents_public_target").include;

  for (const id of RELEASE_VIEW_IDS) {
    const en = generated.views.find((v) => v.id === id);
    const fr = generated.translations.fr.views.find((v) => v.id === id);
    assert.ok(en && fr, `${id} exists in en and fr`);
    assert.deepEqual(box(fr), box(en), `${id}: EN and FR share exact geometry`);
    assert.notEqual(fr.title, en.title, `${id}: French title is translated`);

    for (const s of [...viewStrings(en), ...viewStrings(fr)]) {
      assert.deepEqual(problems(s), [], `${id}: public rules clean for "${s}"`);
      assert.doesNotMatch(s, /harness/i, `${id}: no "harness" in "${s}"`);
      assert.deepEqual(aiLook(s), [], `${id}: no AI-look words in "${s}"`);
    }

    // Geometry bounds check: all nodes and Bezier points fit inside view bounds, and min desktop width <= 900px
    assert.ok((en.bounds.width + 53) * 0.6 <= 900, `${id}: desktop min width fits inside 900px frame`);
    for (const n of en.nodes) {
      assert.ok(n.x >= en.bounds.x && n.y >= en.bounds.y, `${id}/${n.id}: inside top-left bounds`);
      assert.ok(n.x + n.width <= en.bounds.x + en.bounds.width, `${id}/${n.id}: inside right bound`);
      assert.ok(n.y + n.height <= en.bounds.y + en.bounds.height, `${id}/${n.id}: inside bottom bound`);
    }
    for (const e of en.edges) {
      assert.equal((e.points.length - 1) % 3, 0, `${id}/${e.id}: cubic Bezier point count 3k+1`);
      for (const [px, py] of e.points) {
        assert.ok(px >= en.bounds.x && px <= en.bounds.x + en.bounds.width, `${id}/${e.id}: point x inside bounds`);
        assert.ok(py >= en.bounds.y && py <= en.bounds.y + en.bounds.height, `${id}/${e.id}: point y inside bounds`);
      }
      if (e.labelBBox) {
        assert.ok(e.labelBBox.x >= en.bounds.x, `${id}/${e.id}: label x inside bounds`);
        assert.ok(e.labelBBox.x + e.labelBBox.width <= en.bounds.x + en.bounds.width, `${id}/${e.id}: label right inside bounds`);
      }
    }
  }

  // C2 includes every element listed in view agents_public_target of the .c4 model
  const c2Ids = new Set(generated.views.find((v) => v.id === "v1_c2").nodes.map((n) => n.id));
  for (const inc of targetIncludes) {
    assert.ok(c2Ids.has(inc), `v1_c2 includes ${inc} from agents_public_target`);
  }

  // Event flow is dynamic with sequential steps 1..N
  const eventsView = generated.views.find((v) => v.id === "v1_events");
  assert.equal(eventsView.dynamic, true);
  assert.ok(eventsView.edges.length >= 8);
  assert.deepEqual(
    eventsView.edges.map((e) => e.step),
    Array.from({ length: eventsView.edges.length }, (_, i) => i + 1),
  );
});

test("the built 1.0 draft pages render all four model-generated diagrams in EN and FR", { skip: !built() }, () => {
  for (const locale of LOCALES) {
    const file = join(root, "out", locale === "en" ? "" : "fr", "v1", "index.html");
    const page = parse(readFileSync(file, "utf8"));
    const generated = readJson("lib/release-diagrams.json");
    const messages = readJson(`messages/${locale}.json`);
    const views = locale === "en" ? generated.views : generated.translations.fr.views;

    for (const id of RELEASE_VIEW_IDS) {
      const [figure] = find(page, (n) => attr(n, "data-view") === id);
      assert.ok(figure, `${file}: draws ${id}`);
      assert.ok(find(figure, (n) => n.nodeName === "svg").length > 0, `${file}/${id}: renders SVG`);
      assert.ok(textOf(figure).includes(messages.release.captions[id]), `${file}/${id}: includes caption`);

      const modelView = views.find((v) => v.id === id);
      if (modelView.dynamic) {
        const openDetails = find(figure, (n) => n.nodeName === "details" && attr(n, "open") !== undefined);
        assert.equal(openDetails.length, 1, `${file}/${id}: dynamic view text list is open`);
        const items = find(openDetails[0], (n) => n.nodeName === "ol").flatMap((ol) => find(ol, (n) => n.nodeName === "li"));
        assert.equal(items.length, modelView.edges.length, `${file}/${id}: one step item per edge`);
      }
    }
  }
});
