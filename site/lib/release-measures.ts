/* The measures of the 1.0 draft (content/release/measures.json). They wait for ticket #4665 (the alert series): until it is
   recorded the section names what it waits for and shows no number, since a figure here is read from a recorded measurement,
   never typed (tickets #4572 and #4499). */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** The measures the page will show: alerts sent per day, CTO wake-ups per day, CI minutes. */
export const MEASURE_IDS = ["alertsPerDay", "ctoWakeups", "ciMinutes"] as const;
export type MeasureId = (typeof MEASURE_IDS)[number];

export type PendingMeasures = {
  schema: "krizaka.measures/1";
  status: "pending";
  waitsFor: { issue: string; measures: MeasureId[]; command: string };
};

/** Reads content/release/measures.json. */
export function readReleaseMeasures(): PendingMeasures {
  return JSON.parse(readFileSync(join(process.cwd(), "content", "release", "measures.json"), "utf8")) as PendingMeasures;
}
