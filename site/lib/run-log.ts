/* A run's log and cases, as the proof of krizaka-agents writes them, turned into what a chapter shows: the
   console's steps (TerminalReplay of @krizaka/ui) and the cases' figures. Pure: the files are read by the page
   (app/components/pages/RunProof.tsx), copied byte for byte by scripts/proofs.mjs, never typed.
   The log stays the tool's own English lines; only the words that name our internals are said in public words (PUBLIC_WORDS),
   and an amount is taken out (a chapter on how the company runs carries none). */

export const RUN_KINDS = [
  "session",
  "guard",
  "tool",
  "pr",
  "train",
  "overlap",
  "alert",
  "push",
  "merged",
  "conflict",
  "stack-replayed",
] as const;
export type RunKind = (typeof RUN_KINDS)[number];
export const RUN_TONES = ["muted", "accent", "success", "warning", "danger"] as const;
export type RunTone = (typeof RUN_TONES)[number];

export type RunEvent = { at: string; kind: RunKind; actor: string; text: string; href: string | null; tone: RunTone };

/** The verdicts the proof tool writes: « pass (replayed by the train) » is a pass where the train replayed the stacked PR alone. */
export const RUN_VERDICTS = { pass: "pass", fail: "fail", "pass (replayed by the train)": "replayed" } as const;
export type RunVerdict = (typeof RUN_VERDICTS)[keyof typeof RUN_VERDICTS];

export type RunCase = {
  pr: number;
  team: string;
  minutes: number;
  conflicts: number;
  rework_pushes: number;
  pushes_after_open: number;
  stacked_on: number | null;
  replayed: boolean;
  shared: number;
  manual_pushes: number;
  verdict: RunVerdict;
};

export class RunLogError extends Error {
  override name = "RunLogError";
}

const isOneOf = <T extends string>(set: readonly T[], v: unknown): v is T => set.includes(v as T);

/** One event per line (`{at, kind, actor, text, href, tone}`); a line of another shape is an error, never skipped. */
export function parseRunLog(ndjson: string): RunEvent[] {
  return ndjson
    .split("\n")
    .filter((l) => l.trim())
    .map((line, i) => {
      const e = JSON.parse(line) as Record<string, unknown>;
      if (typeof e.at !== "string" || Number.isNaN(Date.parse(e.at))) throw new RunLogError(`line ${i + 1}: no time`);
      if (!isOneOf(RUN_KINDS, e.kind)) throw new RunLogError(`line ${i + 1}: unknown kind ${String(e.kind)}`);
      if (!isOneOf(RUN_TONES, e.tone)) throw new RunLogError(`line ${i + 1}: unknown tone ${String(e.tone)}`);
      if (typeof e.actor !== "string" || typeof e.text !== "string")
        throw new RunLogError(`line ${i + 1}: no actor or text`);
      return {
        at: e.at,
        kind: e.kind,
        actor: e.actor,
        text: e.text,
        href: typeof e.href === "string" ? e.href : null,
        tone: e.tone,
      };
    });
}

/** The cases of a run (`overlap-proof.py live`): the figures each PR's line gives. */
export function parseRunCases(json: string): RunCase[] {
  const rows = JSON.parse(json) as Record<string, unknown>[];
  return rows.map((r) => {
    const verdict = typeof r.verdict === "string" ? (RUN_VERDICTS as Record<string, RunVerdict>)[r.verdict] : undefined;
    if (typeof r.pr !== "number" || verdict === undefined)
      throw new RunLogError(`case without a PR or a verdict`);
    return {
      pr: r.pr,
      team: String(r.team),
      minutes: Number(r.minutes),
      conflicts: Number(r.conflicts),
      rework_pushes: Number(r.rework_pushes),
      pushes_after_open: Number(r.pushes_after_open),
      stacked_on: typeof r.stacked_on === "number" ? r.stacked_on : null,
      replayed: r.replayed === true,
      shared: Array.isArray(r.shared) ? r.shared.length : 0,
      manual_pushes: Number(r.manual_force_pushes ?? 0),
      verdict,
    };
  });
}

/** « (<private tracker>#123) »: the tracker is private, so its name is assembled here, never written out in a source of the site. */
const ISSUE_REFERENCE = new RegExp(String.raw` \(${["krizaka", "internal"].join("-")}#\d+\)`, "g");

/** Our internal words said in public ones; the order matters (the longer phrase first). */
export const PUBLIC_WORDS: readonly (readonly [RegExp, string])[] = [
  [ISSUE_REFERENCE, ""],
  [/codegraph must be called before reading code paths directly/g, "the code index is asked before any file is read"],
  [/ \(headless (?:opus|sonnet) session\)/gi, " (an agent session)"],
  [/\bpr-open\b/g, "the gate"],
  [/\bwip\/[\w.-]+/g, "the branch"],
  [/, \d+(?:[.,]\d+)? (?:USD|\$)/g, ""],
];

/** A log line's text in public words. */
export const publicText = (text: string): string => PUBLIC_WORDS.reduce((t, [re, word]) => t.replace(re, word), text);

/** `16:44` from `2026-11-19T16:44:38Z` (the log is UTC). */
export const hhmm = (at: string): string => at.slice(11, 16);

export type ConsoleLine = { text: string; tone: RunTone };
export type ConsoleStep = { command: string; output: ConsoleLine[] };
/** A part of the run: from its time on (`HH:MM`, UTC), its lines go under its command. */
export type Segment = { from: string; command: string };

/** The console: each event, in order, under the last segment that began at or before it; every event appears once. */
export function consoleSteps(events: readonly RunEvent[], segments: readonly Segment[]): ConsoleStep[] {
  const ordered = [...segments].sort((a, b) => a.from.localeCompare(b.from));
  const steps = ordered.map((s) => ({ command: s.command, output: [] as ConsoleLine[] }));
  for (const e of events) {
    const t = hhmm(e.at);
    const i = ordered.findLastIndex((s) => s.from <= t);
    if (i < 0) throw new RunLogError(`event at ${t} comes before the first segment`);
    steps[i]!.output.push({ text: `${t}  ${e.actor.padEnd(6)}  ${publicText(e.text)}`, tone: e.tone });
  }
  return steps.filter((s) => s.output.length > 0);
}

/** How many events of each kind (the legend's figures). */
export const kindCounts = (events: readonly RunEvent[]): Record<RunKind, number> =>
  Object.fromEntries(RUN_KINDS.map((k) => [k, events.filter((e) => e.kind === k).length])) as Record<RunKind, number>;

export type HeroProof = {
  dates: string;
  sharedFiles: number;
  replayed: number;
  manualPushes: number;
  lines: ConsoleLine[];
};

/** The extract the home shows, by kind and by log: the overlap the guard saw before the second PR, the stack the train replayed, its merge. */
const HERO_LINES: readonly { log: "first" | "rerun"; kind: RunKind; last: boolean }[] = [
  { log: "first", kind: "overlap", last: false },
  { log: "rerun", kind: "stack-replayed", last: false },
  { log: "rerun", kind: "merged", last: true },
];

/** The short proof of the home: figures counted from the runs' cases and three of the logs' own lines (the run that passed); nothing typed. */
export function heroProof(logs: { first: readonly RunEvent[]; rerun: readonly RunEvent[] }, cases: readonly RunCase[]): HeroProof {
  const lines = HERO_LINES.map(({ log, kind, last }) => {
    const of = logs[log].filter((e) => e.kind === kind);
    const e = last ? of.at(-1) : of[0];
    if (!e) throw new RunLogError(`the ${log} log has no ${kind} line for the home`);
    return { text: `${hhmm(e.at)}  ${e.actor.padEnd(6)}  ${publicText(e.text)}`, tone: e.tone };
  });
  const days = [...new Set([...logs.first, ...logs.rerun].map((e) => e.at.slice(0, 10)))].sort();
  return {
    dates: days.join(", "),
    sharedFiles: Math.max(0, ...cases.map((c) => c.shared)),
    replayed: cases.filter((c) => c.replayed).length,
    manualPushes: cases.reduce((n, c) => n + c.manual_pushes, 0),
    lines,
  };
}
