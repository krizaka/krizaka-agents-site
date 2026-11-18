import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { built, root } from "./published-texts.mjs";
import { walk } from "./published-texts.mjs";

// The custom domain (agents.krizaka.com) serves the site at the root: a built page that asks for an asset or a link under the
// old project path (/krizaka-agents-site/...) is a 404 for the visitor (krizaka-internal#3122). A GitHub URL naming the
// repository is fine: only a root-relative path (opened by a quote or a parenthesis) counts.
export const PROJECT_PATH = /["'(]\/krizaka-agents-site\//;

test("the guard catches a project-path reference and leaves a repository link alone", () => {
  assert.ok(PROJECT_PATH.test('<link href="/krizaka-agents-site/_next/static/a.css"/>'));
  assert.ok(PROJECT_PATH.test('"/krizaka-agents-site/_next/static/chunks/a.js"'));
  assert.ok(!PROJECT_PATH.test('<a href="https://github.com/krizaka/krizaka-agents-site/">repo</a>'));
});

test("no built file asks for the project base path", { skip: !built() || Boolean(process.env.SITE_BASE_PATH) }, () => {
  const out = join(root, "out");
  const offenders = walk(out)
    .filter((f) => /\.(html|css|js|txt|xml|json)$/.test(f))
    .filter((f) => PROJECT_PATH.test(readFileSync(f, "utf8")));
  assert.deepEqual(offenders, []);
});
