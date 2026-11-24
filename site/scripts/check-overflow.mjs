#!/usr/bin/env node
/* No horizontal overflow, measured in a real browser (Playwright) on the built site, from a 360 px phone to a 1440 px
   desktop, in both languages and both themes: the document must not be wider than the window, and nothing visible may stick
   out of it unless it sits in a scroller made for that (the table).
   Usage: node scripts/check-overflow.mjs --base http://localhost:3100 [--shots <dir>] */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const WIDTHS = [360, 390, 768, 1024, 1440];
/** The pages captured with --shots: the ones that draw an architecture view, the proofs and the migration, in both languages. */
const SHOTS = new Set(["", "flow", "alerts", "proofs", "v1", "migration"].flatMap((s) => [`/${s ? s + "/" : ""}`, `/fr/${s ? s + "/" : ""}`]));
const PATHS = ["", "flow", "rules", "alerts", "cockpit", "proofs", "v1", "migration"].flatMap((s) => [`/${s ? s + "/" : ""}`, `/fr/${s ? s + "/" : ""}`]);

function measure() {
  const width = document.documentElement.clientWidth;
  const out = [];
  if (document.documentElement.scrollWidth > width + 1) out.push(`the document is ${document.documentElement.scrollWidth}px wide in a ${width}px window`);
  const scrolls = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return true;
    }
    return false;
  };
  for (const el of document.body.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || (r.right <= width + 1 && r.left >= -1)) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || style.position === "fixed" || scrolls(el)) continue;
    out.push(`<${el.tagName.toLowerCase()}> spans ${Math.round(r.left)}→${Math.round(r.right)} in a ${width}px window`);
    if (out.length > 6) break;
  }
  return out;
}

/** An architecture view is whole: its drawn content (the SVG's bounding box) lies inside its viewBox, and its frame shows all of
    it (the kit's minimum scale keeps it legible, so on a narrow screen it may scroll, but only with the cue, and never on a desktop). */
function figureBounds(desktop) {
  const out = [];
  for (const view of document.querySelectorAll(".kz-view")) {
    const svg = view.querySelector(".kz-arch-svg");
    const frame = view.querySelector(".kz-arch-frame");
    const vb = svg.viewBox.baseVal;
    const b = svg.getBBox();
    const name = svg.getAttribute("aria-label");
    const eps = 1;
    if (b.x < vb.x - eps || b.y < vb.y - eps || b.x + b.width > vb.x + vb.width + eps || b.y + b.height > vb.y + vb.height + eps)
      out.push(`figure « ${name} » draws ${Math.round(b.x)}→${Math.round(b.x + b.width)} outside its frame ${Math.round(vb.x)}→${Math.round(vb.x + vb.width)}`);
    if (frame.scrollWidth <= frame.clientWidth + 1) continue;
    const cue = view.querySelector(".kz-view-cue");
    if (desktop) out.push(`figure « ${name} » is cut off: ${frame.scrollWidth}px of drawing in a ${frame.clientWidth}px frame`);
    else if (!cue || getComputedStyle(cue).display === "none") out.push(`figure « ${name} » scrolls (${frame.scrollWidth}px in ${frame.clientWidth}px) without a visible cue`);
  }
  return out;
}

const args = process.argv.slice(2);
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const base = flag("--base", "http://localhost:3100").replace(/\/$/, "");
const shots = flag("--shots", null);
if (shots) mkdirSync(shots, { recursive: true });
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const problems = [];
for (const theme of ["dark", "light"]) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce", colorScheme: theme });
    await context.addInitScript((t) => localStorage.setItem("kz-theme", t), theme);
    const page = await context.newPage();
    for (const path of PATHS) {
      await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const nav = await page.evaluate(() => {
        const n = document.querySelector(".kz-margin-nav");
        const list = n?.querySelector(".kz-margin-list");
        return { present: !!n, listShown: !!list && getComputedStyle(list).display !== "none" };
      });
      if (!nav.present) problems.push(`${path} @${width} ${theme}: the margin nav is missing`);
      if (width >= 1024 && !nav.listShown) problems.push(`${path} @${width} ${theme}: the page list is not in the left margin`);
      if (width < 1024 && nav.listShown) problems.push(`${path} @${width} ${theme}: the list should sit behind « Contents »`);
      if (width < 1024) {
        await page.click(".kz-margin-toggle");
        for (const issue of await page.evaluate(measure)) problems.push(`${path} @${width} ${theme} (contents open): ${issue}`);
      }
      for (const issue of await page.evaluate(measure)) problems.push(`${path} @${width} ${theme}: ${issue}`);
      for (const issue of await page.evaluate(figureBounds, width >= 1440)) problems.push(`${path} @${width} ${theme}: ${issue}`);
      if (shots && SHOTS.has(path) && (width === 390 || width === 1440))
        await page.screenshot({ path: `${shots}/${path.replaceAll("/", "") || "home"}-${width}-${theme}.png`, fullPage: true });
    }
    await context.close();
  }
}
await browser.close();
if (problems.length) {
  console.error(problems.map((p) => `check-overflow: ${p}`).join("\n"));
  process.exit(1);
}
console.log(`check-overflow: ${PATHS.length} pages × ${WIDTHS.length} widths × 2 themes, no horizontal overflow`);
