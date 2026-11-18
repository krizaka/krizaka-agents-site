import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { built, root, sourceTexts, builtTexts } from "./published-texts.mjs";

// The decided words (no « harness » anywhere), the family footer and the way to write to us, on every page, in both languages.
const SLUGS = ["", "flow", "rules", "alerts", "cockpit", "proofs"];
const CONTACT = {
  en: "https://www.krizaka.com/en/contact?topic=other&amp;product=agents&amp;source=agents",
  fr: "https://www.krizaka.com/fr/contact?topic=other&amp;product=agents&amp;source=agents",
};
const pageFile = (locale, slug) => join(root, "out", locale === "fr" ? "fr" : "", slug, "index.html");
const readBuilt = (locale, slug) => readFileSync(pageFile(locale, slug), "utf8");

test("no « harness » in the sources of the site", () => {
  for (const [path, text] of sourceTexts()) assert.doesNotMatch(text, /harness/i, path);
  assert.doesNotMatch(readFileSync(join(root, "..", "README.md"), "utf8"), /harness/i, "README.md");
});

test("the title and the meta description of the home page are the decided ones", () => {
  const en = readBuilt("en", "");
  const fr = readBuilt("fr", "");
  assert.match(en, /<title>Krizaka Agents: how we ship with coding agents<\/title>/);
  assert.match(fr, /<title>Krizaka Agents : comment nous livrons avec des agents<\/title>/);
  assert.ok(en.includes("We build our products with AI agents. Here is how: one session per ticket, checks that refuse, a person who decides. Not for sale."));
  assert.ok(fr.includes("Nous construisons nos produits avec des agents IA. Voici comment : une session par ticket, des contrôles qui refusent, une personne qui décide. Pas à vendre."));
});

test("every built page: no « harness », the family footer, « Write to us » to the contact form, no e-mail address", { skip: !built() }, () => {
  for (const [path, text] of builtTexts()) assert.doesNotMatch(text, /harness/i, path);
  for (const locale of ["en", "fr"]) {
    for (const slug of SLUGS) {
      const html = readBuilt(locale, slug);
      const where = `${locale}/${slug}`;
      assert.ok(html.includes(`href="${CONTACT[locale]}"`), `${where}: the contact link`);
      assert.ok((html.match(new RegExp(`href="${CONTACT[locale].replaceAll("?", "\\?")}"`, "g")) ?? []).length >= 3, `${where}: header, page end and footer`);
      assert.ok(html.includes(`https://www.krizaka.com/${locale}/privacy`), `${where}: the legal line of the family footer`);
      assert.ok(html.includes("https://www.verikora.com"), `${where}: the products of the family footer`);
      assert.ok(html.includes(locale === "fr" ? "Nous écrire" : "Write to us"), `${where}: the words`);
      assert.ok(html.includes(locale === "fr" ? "Rien n&#x27;est à vendre aujourd&#x27;hui ; nous répondons." : "Nothing is for sale today; we answer."), `${where}: the promise`);
      assert.doesNotMatch(html, /mailto:|[\w.+-]+@[\w-]+\.[a-z]{2,}/i, `${where}: no e-mail address`);
    }
  }
});
