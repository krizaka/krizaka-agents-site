---
title: "Proofs: what you can check yourself"
description: "The public chapters and merged pull requests that show Krizaka Agents at work, with their figures and their limits."
---

### § 1 — What we can show

The code of Krizaka Agents is private. So this page lists only what anyone can open: blog chapters, with their dated
measures and their limits, and merged pull requests of public repositories. A proof we cannot show is not cited here.

### § 2 — The chapters

The measures already quoted on this site: 190,000 → 40,000 tokens on a session's first turn · 92 PRs merged and 37 skipped
in 48 h · 18 of 18 sessions finished.


| Subject | Chapter | What you find |
| :--- | :--- | :--- |
| Architecture | [The architecture of our AI agents tooling](https://blog.krizaka.com/story/the-architecture-of-krizaka-agents/) | five checked views, the caps per session, two read-only audits (332 launches, 0 environment drift) |
| Rules that say no | [Working with agents](https://blog.krizaka.com/story/working-with-agents-rules-that-refuse/) | real refusals, with their exit code |
| Coordinator | [Agents under a coordinator](https://blog.krizaka.com/story/agents-under-a-coordinator/) | three failed tests, then a wave that lands; what is not proven |
| Start | [Every agent starts in the same world](https://blog.krizaka.com/story/every-agent-starts-in-the-same-world/) | 190,000 → 40,000 tokens on the first turn; 18 of 18 sessions finished |
| Teams | [How our agent teams talk](https://blog.krizaka.com/story/how-our-agent-teams-talk/) | four audits in one day: 14, 8, 10 then 7 bugs |
| Founder and CTO | [How the CTO agent and I work](https://blog.krizaka.com/story/how-the-founder-and-the-cto-agent-work/) | who decides what |
| Trains | [All aboard: our pull requests catch the train](https://blog.krizaka.com/story/tchou-tchou-how-our-pull-requests-catch-the-train/) | the pull request queue |
| Cockpit | [One local cockpit](https://blog.krizaka.com/story/one-local-cockpit-to-run-the-whole-company/) | the screen, figures of 15 November |

### § 3 — A real run: two teams on the same files

On 19 November 2026, two agent teams worked on the same five files of Verikora at the same time. The console below replays
the log of that real run, line by line, as the tool wrote it. Every pull request it names is public.

<!--run:overlap_log-->

**S1, passed.** At 16:44 the gate saw the five shared files, before the second pull request existed. The train landed
[#890](https://github.com/krizaka/verikora/pull/890) at 17:31 and [#889](https://github.com/krizaka/verikora/pull/889) at 17:52: no conflict, no rework push on either.

**S2, failed, and kept as history.** [#891](https://github.com/krizaka/verikora/pull/891) was stacked on [#889](https://github.com/krizaka/verikora/pull/889); its base moved after the stack, the train refused
to replay it at 17:54, and a person had to merge by hand at 18:04. We stopped there and fixed the cause. The figures:

<!--run:overlap_cases-->

**S2, rerun: passed.** The rerun repeated the same case on two new tickets ([#893](https://github.com/krizaka/verikora/pull/893), then [#894](https://github.com/krizaka/verikora/pull/894) stacked on it). The train replayed the stacked PR by itself and merged it, with no manual push. Our proof tool first said “fail” until its rule learned to tell the train’s replay from a manual push; the raw counts are kept as they are.

<!--run:overlap_s2_cases-->

One run proves a mechanism on one case, not a rate.

### § 4 — Merged pull requests, in public

Krizaka's agents open pull requests on the organisation's public repositories, and the trains merge them. Two examples
from 16 November, opened by the agents' app: [blog PR 379](https://github.com/krizaka/krizaka-blog/pull/379) (a
chapter) and [PR 378](https://github.com/krizaka/krizaka-blog/pull/378) (the workflow pins update). Each public
repository shows the history of its merged pull requests; that is the proof you can browse yourself.

### § 5 — What this page does not prove

The two 48-hour audits and the organisation-wide pull request counts rest on private logs and tickets: we quote them in
the chapters, but you cannot replay them. We will make them checkable or withdraw them.
