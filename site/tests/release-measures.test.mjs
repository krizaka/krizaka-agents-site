import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readReleaseMeasures, measureSourceOf } from "../lib/release-measures.ts";
import { built, root } from "./published-texts.mjs";

const MEASURED_NUMBERS = [
  "950", "168", "180", "336", "62", "102", "117", "32", "50",
  "1104", "358", "195", "107", "309", "434", "257", "260",
  "177", "178", "88", "85", "3052", "59", "2537", "42", "1392",
  "96", "25", "4041", "16", "28", "114", "100", "14",
];

/** Strip frontmatter and numbered `### § N` headings so prose check inspects authored narrative only. */
function proseBodyOnly(markdown) {
  const noFrontmatter = markdown.replace(/^---\n[\s\S]*?\n---\n+/, "");
  return noFrontmatter.replace(/^### § \d+ — .*$/gm, "");
}

test("measures.json records every number's source (command + date), lanes-off context, and CI minutes status", () => {
  const m = readReleaseMeasures();
  assert.equal(m.schema, "krizaka.measures/1");
  assert.equal(m.lanesOffSince, "2026-11-22");

  for (const key of ["windowHours", "daily", "totals", "towerBeforeAfter", "topAlertKinds"]) {
    const src = measureSourceOf(m, key);
    assert.ok(src.command.length > 0, `${key}: has source command`);
    assert.match(src.date, /^\d{4}-\d{2}-\d{2}$/, `${key}: has ISO source date`);
  }

  assert.equal(m.ciMinutes.available, false);
  assert.equal(m.ciMinutes.value, null);
  assert.equal(m.ciMinutes.source, null);
});

test("measures.json matches .inputs/watchdog-stats-7d.txt exactly", {
  skip: !existsSync(join(root, "..", ".inputs", "watchdog-stats-7d.txt")),
}, () => {
  const stats = JSON.parse(readFileSync(join(root, "..", ".inputs", "watchdog-stats-7d.txt"), "utf8"));
  const m = readReleaseMeasures();

  assert.equal(m.windowHours.value, stats.since_hours);
  assert.equal(m.totals.merges, stats.merges);
  assert.equal(m.totals.redsFixed, stats.reds_fixed);
  assert.equal(m.totals.timeToGreenMedianMinutes, stats.time_to_green_min_median);
  assert.equal(m.totals.alertsRaised, stats.alerts_raised);
  assert.equal(m.totals.towerWakes, stats.tower_wakes);
  assert.equal(m.totals.loopsCaught, stats.loops_caught);
  assert.equal(m.daily.targetPerDay, stats.alerts_sent_target_per_day);

  const daysByDate = Object.fromEntries(m.daily.days.map((d) => [d.date, d]));
  assert.deepEqual(Object.keys(daysByDate).sort(), Object.keys(stats.alerts_sent_per_day).sort());
  for (const [day, sent] of Object.entries(stats.alerts_sent_per_day)) {
    const row = daysByDate[day];
    assert.equal(row.alertsSent, sent, `${day}: alertsSent`);
    assert.equal(row.ctoWakeups, stats.tower_counters_per_day[day].cto_wakeups, `${day}: ctoWakeups`);
    assert.equal(row.towerRuns, stats.tower_counters_per_day[day].tower_runs, `${day}: towerRuns`);
  }

  assert.equal(m.towerBeforeAfter.before.window, stats.tower_before_after.before.window);
  assert.equal(m.towerBeforeAfter.before.alerts, stats.tower_before_after.before.alerts);
  assert.equal(m.towerBeforeAfter.before.teamEnded, stats.tower_before_after.before["team-ended"]);
  assert.equal(m.towerBeforeAfter.before.crack, stats.tower_before_after.before.crack);
  assert.equal(m.towerBeforeAfter.before.needsOwner, stats.tower_before_after.before["needs-owner"]);
  assert.equal(m.towerBeforeAfter.before.teamEndedAckedByHand, stats.tower_before_after.before["team-ended-acked-by-hand"]);
  assert.equal(m.towerBeforeAfter.after, stats.tower_before_after.after);
});

test("no measured number or alias count is typed in draft markdown prose", () => {
  for (const name of ["v1.en.md", "v1.fr.md", "migration.en.md", "migration.fr.md"]) {
    const md = readFileSync(join(root, "content", "release", name), "utf8");
    const prose = proseBodyOnly(md);
    for (const num of MEASURED_NUMBERS) {
      assert.doesNotMatch(prose, new RegExp(`(?<!\\d)${num}(?!\\d)`), `${name} must not hardcode ${num} in prose`);
    }
  }
});

test("built 1.0 draft pages carry noindex, draft badge, sources, lanes-off date, and measured figures", { skip: !built() }, () => {
  const m = readReleaseMeasures();
  for (const locale of ["en", "fr"]) {
    const html = readFileSync(join(root, "out", locale === "en" ? "" : "fr", "v1", "index.html"), "utf8");
    assert.match(html, /<meta name="robots" content="noindex,\s*nofollow"/i, `${locale}/v1: noindex`);
    assert.ok(html.includes(m.sources.watchdogStats.command), `${locale}/v1: source command`);
    assert.ok(html.includes(m.sources.watchdogStats.date), `${locale}/v1: source date`);
    assert.ok(html.includes(m.lanesOffSince), `${locale}/v1: lanes-off context date`);
    for (const d of m.daily.days) {
      assert.ok(html.includes(d.date) && html.includes(String(d.alertsSent)), `${locale}/v1: ${d.date} -> ${d.alertsSent}`);
    }
    assert.ok(html.includes(String(m.totals.merges)), `${locale}/v1: merges count`);
  }
});
