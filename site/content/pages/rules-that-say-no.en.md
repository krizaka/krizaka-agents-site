---
title: "Guardrails for coding agents: rules that say no"
description: "A written rule gets forgotten, a command that refuses does not: how Krizaka Agents stops a mistake before the push."
---

### § 1 — A written rule gets forgotten, a command that refuses does not

Our rules first lived in a long text every session read at the start. A little further in, it forgot it. So we moved them
where the work has to go through: into the commands. A command refuses a badly formed title, a pull request without a
ticket, or a repository that already has five open pull requests. Its message says what to do next: the agent does not
have to remember the rule, the command does.

### § 2 — Four places that refuse

- **At every tool call**: a hook refuses (a secrets file printed, a GitHub write without an app's identity, code read before the index); the edited file is formatted and checked on its own, in a few seconds.
- **At commit and push**: secrets and the author's identity; at push, the format and the workflow checkers.
- **The pre-check, before the push**: the repository's fast loop on what changed (lint, types, tests of the touched packages).
- **In CI**: the repository's required checks, plus two about the method: a `fix` must change a guard, and the ratchets.

A guard refuses and says why; it does not fix things silently, because a silent fix hides the cause.

### § 3 — Shift left, and the ratchets

What can be seen on the machine does not wait for CI: of 4 pull requests red in CI, 3 failed on a check that existed
locally and had not run. A **ratchet** counts a debt (lint warnings, duplicated code, exceptions to the architecture
rules) in a file that CI lets go down, never up.

### § 4 — Every drift leaves a guard

A bug means a guard was missing. One day sessions started the same train up to four times: a second train for a pull
request that already has one now refuses to start. Every refusal of a gate is written to one log; a rule stays when its
count shows an effect.

### § 5 — A guard can exist and see nothing

The « code index first » guard had been in place for days; out of 101 sessions, 86 never asked the index: it looked only at
the beginning of the command. The chapter says it, and so do we.

### § 6 — What stays with a person

The direction, money, accounts, legal matters and everything that cannot be undone. Facing one of them, a session does not
guess: it moves the card to « Blocked » with one sentence.

[The full story: working with agents, rules that say no →](https://blog.krizaka.com/story/working-with-agents-rules-that-refuse/)
