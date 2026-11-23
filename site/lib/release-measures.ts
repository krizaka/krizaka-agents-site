/* Typed loader for the 1.0 release measures data (content/release/measures.json). */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const LANE_STATES = ["on", "turned-off", "off"] as const;
export type LaneState = (typeof LANE_STATES)[number];

export const ALERT_KIND_STATUSES = ["tuned", "observed"] as const;
export type AlertKindStatus = (typeof ALERT_KIND_STATUSES)[number];

export type MeasureSource = {
  command: string;
  date: string;
};

export type MeasureSourceKey = "watchdogStats" | "alertsList";

export type DailyAlertRow = {
  date: string;
  alertsSent: number;
  ctoWakeups: number;
  towerRuns: number;
  lanes: LaneState;
  partial: boolean;
};

export type TopAlertKindRow = {
  kind: string;
  rows: number;
  occurrences: number;
  status: AlertKindStatus;
};

export type ReleaseMeasuresData = {
  schema: string;
  lanesOffSince: string;
  sources: Record<MeasureSourceKey, MeasureSource>;
  windowHours: { value: number; source: MeasureSourceKey };
  daily: { source: MeasureSourceKey; targetPerDay: number; days: DailyAlertRow[] };
  totals: {
    source: MeasureSourceKey;
    merges: number;
    redsFixed: number;
    timeToGreenMedianMinutes: number;
    alertsRaised: number;
    towerWakes: number;
    loopsCaught: number;
  };
  towerBeforeAfter: {
    source: MeasureSourceKey;
    before: {
      window: string;
      alerts: number;
      teamEnded: number;
      crack: number;
      needsOwner: number;
      teamEndedAckedByHand: number;
    };
    after: null;
  };
  topAlertKinds: {
    source: MeasureSourceKey;
    rows: TopAlertKindRow[];
  };
  ciMinutes: {
    available: false;
    value: null;
    source: null;
  };
};

export type MeasureSectionKey = "windowHours" | "daily" | "totals" | "towerBeforeAfter" | "topAlertKinds";

/** Reads the release measures JSON from content/release/measures.json. */
export function readReleaseMeasures(): ReleaseMeasuresData {
  return JSON.parse(readFileSync(join(process.cwd(), "content", "release", "measures.json"), "utf8")) as ReleaseMeasuresData;
}

/** Resolves the command and date source for a named measure block. */
export function measureSourceOf(data: ReleaseMeasuresData, section: MeasureSectionKey): MeasureSource {
  const key = data[section].source;
  const source = data.sources[key];
  if (!source) throw new Error(`measures.json: missing source ${key} for ${section}`);
  return source;
}
