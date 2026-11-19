import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { built, root } from "./published-texts.mjs";

// The share card (Open Graph) of every page, and the « Write to us » button on the first screen of the home.
const SLUGS = ["", "flow", "rules", "alerts", "cockpit", "proofs"];
const SITE = "https://agents.krizaka.com";
const pageFile = (locale, slug) => join(root, "out", locale === "fr" ? "fr" : "", slug, "index.html");
const meta = (html, key) => new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`).exec(html)?.[1];

test("every page has an absolute og:image that answers in the build, with its alt and the large Twitter card", { skip: !built() }, () => {
  for (const locale of ["en", "fr"]) {
    for (const slug of SLUGS) {
      const html = readFileSync(pageFile(locale, slug), "utf8");
      const where = `${locale}/${slug}`;
      const image = meta(html, "og:image");
      assert.ok(image?.startsWith(`${SITE}/`), `${where}: absolute og:image (${image})`);
      const file = join(root, "out", image.slice(SITE.length));
      assert.ok(existsSync(file), `${where}: ${image} answers in out/`);
      const png = readFileSync(file);
      assert.equal(png.subarray(1, 4).toString(), "PNG", `${where}: a PNG`);
      assert.equal(png.readUInt32BE(16), 1200, `${where}: 1200 px wide`);
      assert.equal(png.readUInt32BE(20), 630, `${where}: 630 px high`);
      assert.ok(statSync(file).size < 300 * 1024, `${where}: under 300 KB`);
      assert.ok((meta(html, "og:image:alt") ?? "").length > 20, `${where}: og:image:alt`);
      assert.equal(meta(html, "twitter:card"), "summary_large_image", `${where}: twitter:card`);
      assert.equal(meta(html, "twitter:image"), image, `${where}: twitter:image`);
    }
  }
});

test("the card of each language is its own image", { skip: !built() }, () => {
  const en = readFileSync(join(root, "out", "og.png"));
  const fr = readFileSync(join(root, "out", "fr", "og.png"));
  assert.notDeepEqual(en, fr);
});

test("the home has the « Write to us » button above the § 1 heading, and every page ends with the invitation", { skip: !built() }, () => {
  for (const [locale, label] of [["en", "Write to us"], ["fr", "Nous écrire"]]) {
    const home = readFileSync(pageFile(locale, ""), "utf8");
    const button = home.indexOf('data-write-to-us="top"');
    const heading = home.indexOf("§ 1");
    assert.ok(button > 0 && heading > 0 && button < heading, `${locale}: the button comes before § 1`);
    assert.ok(home.slice(button, heading).includes(label), `${locale}: the button says ${label}`);
    for (const slug of SLUGS) {
      assert.ok(readFileSync(pageFile(locale, slug), "utf8").includes('data-write-to-us="end"'), `${locale}/${slug}: the invitation at the end`);
    }
  }
});

test("the Proofs table's first column never breaks inside a word", () => {
  const css = readFileSync(join(root, "app", "globals.css"), "utf8");
  assert.match(css, /\.kz-table td:first-child\s*\{[^}]*overflow-wrap:\s*normal;[^}]*word-break:\s*normal/);
});
