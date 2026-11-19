---
title: "The flow: from a ticket to a merged pull request"
description: "How a ticket becomes a merged pull request with Krizaka Agents: a checked session, refusals before the push, a train, a merge queue."
---

### § 1 — From ticket to alert, in seven stations

Everything starts from a ticket on a board, with a lane (one session at a time per lane) and a « done when ». The
ticket follows the need; the **task** is what runs, bounded before it starts: S, 60 turns at most; M, 120; an L task is
refused with one instruction, split it.

*Fig. 1 — The flow: ticket → session built and checked → refusals before the push → pull request → train and merge → acceptance check → alerts.*

### § 2 — A session built and checked

<!--view:agents_containers-->

A session has no screen and nobody to answer its questions: it has a ticket, a brief and its caps. The launcher starts it
the same way every time: isolated (it only sees the code index and the declared tools), pinned (the Claude Code version
moves only by pull request), checked twice (the machine before the start, then what the session really loaded at its
first message). One difference, and it stops with the reason.

### § 3 — The coordinator

A coordinator with no model assigns tasks, with a lease that expires, a heartbeat renewed by the launcher (not by the
agent) and a token that goes up with every new lease: a session that froze can no longer deliver. A task's scope is held
at four places, none inside the agent. Honestly: today one local repository is under the coordinator; for GitHub
repositories, two sessions are kept apart by one worktree per ticket and by refusing a pull request that touches a file
another open pull request already touches.

### § 4 — The train and the merge queue

A session never merges. It opens its pull request with one command, then puts it in the repository's train: a queue and a
script that empties it, with no token. The train takes the head, rebases it on main, waits for the required checks and
sends it into GitHub's merge queue, which runs the checks again on the real mix with main. A red head is skipped with its
reason. A red main freezes the repository's merges until a `fix` lands.

<!--view:pr_life-->

### § 5 — After the merge

An acceptance session checks the ticket after the merge; the launcher is the same, there is no second path. Alerts go
into one table, with an owner and a proof (page « Alerts and the watchdog »).

### What is measured

- A file overlap touched nearly half of the open pull requests (826 of 1,782).
- The trains merged 92 pull requests in 48 hours and skipped 37, each with its reason.
- A session starts with about 40,000 tokens of context on its first turn, down from about 190,000.

[The full story: agents under a coordinator →](https://blog.krizaka.com/story/agents-under-a-coordinator/)
