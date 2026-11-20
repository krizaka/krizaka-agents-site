import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComponentType } from "react";
import {
  AgentIcon,
  AutomationIcon,
  CheckIcon,
  EditIcon,
  EyeIcon,
  FlagIcon,
  PlusIcon,
  ShieldIcon,
  UploadIcon,
  WarningIcon,
  type IconProps,
} from "@krizaka/icons";
import { Badge } from "@krizaka/ui/badge";
import { TerminalReplay } from "@krizaka/ui/terminal-replay";
import type { RunId } from "@/lib/views";
import {
  consoleSteps,
  heroProof,
  kindCounts,
  parseRunCases,
  parseRunLog,
  RUN_KINDS,
  type RunCase,
  type RunKind,
} from "@/lib/run-log";

/* A real run, shown from its proof. `<RunConsole proof="…-log"/>` replays the run's log in the family's
   TerminalReplay, stamped « real run » with the log's date, with a legend of what the log holds (icons of @krizaka/icons, the figures counted from the
   log). `<RunCases proof="…-cases"/>` gives each PR's figures, or « in progress » while the run's proof is not synced. The files
   are content/proofs/*, copied byte for byte by scripts/proofs.mjs (sources.json); nothing here is typed. Server-rendered; the
   console plays when it comes into view and rests whole under reduced motion. */

type SegmentKey = "start" | "overlap" | "stack" | "land" | "conflict";
export type RunProofLabels = {
  stamp: string;
  title: string;
  label: string;
  play: string;
  pause: string;
  replay: string;
  note: string;
  legend: string;
  hero: {
    aria: string;
    stamp: string;
    case: string;
    pullRequests: string;
    teams: string;
    conflicts: string;
    replayed: string;
    command: string;
    console: string;
    title: string;
    play: string;
    pause: string;
    replay: string;
    see: string;
    proofHref: string;
    story: string;
    storyHref: string;
  };
  segments: Record<SegmentKey, string>;
  kinds: Record<RunKind, string>;
  cases: {
    caption: string;
    pendingBadge: string;
    pending: string;
    columns: Record<"pr" | "team" | "conflicts" | "rework" | "minutes" | "verdict", string>;
    teams: Record<string, string>;
    verdicts: Record<RunCase["verdict"], string>;
    stackedOn: string;
  };
};

/** The parts of a run, by the time they begin (UTC): each log's own, the words are the messages'. */
const PARTS: Record<string, readonly { from: string; key: SegmentKey }[]> = {
  "overlap-live-2026-11-19-log": [
    { from: "16:18", key: "start" },
    { from: "16:44", key: "overlap" },
    { from: "16:54", key: "stack" },
    { from: "17:31", key: "land" },
    { from: "17:54", key: "conflict" },
  ],
};

const ICON: Record<RunKind, ComponentType<IconProps>> = {
  session: AgentIcon,
  tool: EditIcon,
  push: UploadIcon,
  pr: PlusIcon,
  guard: ShieldIcon,
  overlap: EyeIcon,
  train: AutomationIcon,
  merged: CheckIcon,
  conflict: WarningIcon,
  alert: FlagIcon,
};

/** The public repository the run changed: every PR line links to its pull request there. */
export const VERIKORA_PRS = "https://github.com/krizaka/verikora/pull";

/** The proofs the pages place, by the id of their `<!--run:…-->` mark. */
export const PROOF_OF: Record<RunId, string> = {
  overlap_log: "overlap-live-2026-11-19-log",
  overlap_cases: "overlap-live-2026-11-19-cases",
  overlap_s2_cases: "overlap-live-s2-rerun-cases",
  hero_proof: "overlap-live-2026-11-19-log",
};

type Source = { id: string; file: string; repo: string; commit: string | null };
const PROOFS = join(process.cwd(), "content", "proofs");
const sources = (): Source[] =>
  (JSON.parse(readFileSync(join(PROOFS, "sources.json"), "utf8")) as { proofs: Source[] }).proofs;

/** The copy of a proof, or undefined while its run is not over (no commit, no file). */
function proofText(id: string): string | undefined {
  const s = sources().find((p) => p.id === id);
  if (!s) throw new Error(`RunProof: no proof ${id} in content/proofs/sources.json`);
  const file = join(PROOFS, s.file);
  return s.commit && existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

export function RunConsole({ proof, labels }: Readonly<{ proof: string; labels: RunProofLabels }>) {
  const text = proofText(proof);
  const parts = PARTS[proof];
  if (!text || !parts) throw new Error(`RunConsole: ${proof} is not a synced log with its parts`);
  const events = parseRunLog(text);
  const steps = consoleSteps(
    events,
    parts.map((p) => ({ from: p.from, command: labels.segments[p.key] })),
  );
  const counts = kindCounts(events);
  const date = events[0]!.at.slice(0, 10);
  return (
    <div className="kz-run">
      <p className="kz-run-stamp">
        <Badge tone="success" size="md">
          {labels.stamp.replace("{date}", date)}
        </Badge>
      </p>
      <TerminalReplay
        steps={steps}
        label={labels.label.replace("{date}", date)}
        title={labels.title}
        prompt="§"
        playLabel={labels.play}
        pauseLabel={labels.pause}
        replayLabel={labels.replay}
        typingSpeed={22}
        lineDelay={260}
        stepDelay={1100}
        rows={16}
      />
      <div className="kz-run-legend">
        <ul aria-label={labels.legend}>
          {RUN_KINDS.filter((k) => counts[k] > 0).map((k) => {
            const Icon = ICON[k];
            return (
              <li key={k}>
                <Icon size={16} />
                <span>{labels.kinds[k]}</span>
                <span className="kz-run-count">{counts[k]}</span>
              </li>
            );
          })}
        </ul>
        <p className="kz-run-note">{labels.note}</p>
      </div>
    </div>
  );
}

export function RunCases({ proof, labels }: Readonly<{ proof: string; labels: RunProofLabels }>) {
  const text = proofText(proof);
  const c = labels.cases;
  if (!text)
    return (
      <p className="kz-run-pending">
        <Badge tone="warning" size="md">
          {c.pendingBadge}
        </Badge>{" "}
        {c.pending}
      </p>
    );
  const cases = parseRunCases(text);
  const pr = (n: number) => `${VERIKORA_PRS}/${n}`;
  return (
    <div className="kz-run-cases">
      <table>
        <caption>{c.caption}</caption>
        <thead>
          <tr>
            {(["pr", "team", "conflicts", "rework", "minutes", "verdict"] as const).map((k) => (
              <th key={k} scope="col">
                {c.columns[k]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map((r) => (
            <tr key={r.pr}>
              <th scope="row">
                <a href={pr(r.pr)}>#{r.pr}</a>
                {r.stacked_on ? (
                  <span className="kz-run-stack">{c.stackedOn.replace("{pr}", `#${r.stacked_on}`)}</span>
                ) : null}
              </th>
              <td>{c.teams[r.team] ?? r.team}</td>
              <td>{r.conflicts}</td>
              <td>{r.rework_pushes}</td>
              <td>{r.minutes}</td>
              <td>
                <Badge tone={r.verdict === "fail" ? "danger" : "success"} size="sm">
                  {c.verdicts[r.verdict]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** What a `<!--run:<id>-->` mark draws: the console of a log, or the figures of a run's cases. */
/** The home's short proof: the run's figures, three of its real log lines and the way to the full proof. */
export function RunHero({ labels, href }: Readonly<{ labels: RunProofLabels["hero"]; href: string }>) {
  const log = proofText("overlap-live-2026-11-19-log");
  const first = proofText("overlap-live-2026-11-19-cases");
  const rerun = proofText("overlap-live-s2-rerun-cases");
  if (!log || !first || !rerun) throw new Error("RunHero: the run's proofs are not synced");
  const h = heroProof(parseRunLog(log), [...parseRunCases(first), ...parseRunCases(rerun)]);
  const facts = [
    [h.pullRequests, labels.pullRequests],
    [h.teams, labels.teams],
    [h.conflicts, labels.conflicts],
    [h.replayed, labels.replayed],
  ] as const;
  return (
    <aside className="kz-hero-proof" aria-label={labels.aria}>
      <p className="kz-run-stamp">
        <Badge tone="success" size="md">
          {labels.stamp.replace("{date}", h.date)}
        </Badge>{" "}
        <span className="kz-hero-case">{labels.case}</span>
      </p>
      <dl className="kz-hero-facts">
        {facts.map(([n, label]) => (
          <div key={label}>
            <dt>{n}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
      <TerminalReplay
        steps={[{ command: labels.command, output: h.lines }]}
        label={labels.console}
        title={labels.title}
        prompt="§"
        playLabel={labels.play}
        pauseLabel={labels.pause}
        replayLabel={labels.replay}
        typingSpeed={22}
        lineDelay={260}
        stepDelay={1100}
        rows={13}
      />
      <p className="kz-hero-links">
        <a href={href}>{labels.see}</a>
        {" · "}
        <a href={labels.storyHref}>{labels.story}</a>
      </p>
    </aside>
  );
}

export default function RunProof({ run, labels }: Readonly<{ run: RunId; labels: RunProofLabels }>) {
  const proof = PROOF_OF[run];
  if (run === "hero_proof") return <RunHero labels={labels.hero} href={labels.hero.proofHref} />;
  return run === "overlap_log" ? (
    <RunConsole proof={proof} labels={labels} />
  ) : (
    <RunCases proof={proof} labels={labels} />
  );
}
