---
title: "Krizaka Agents: how we ship with coding agents"
description: "We build our products with AI agents. Here is how: one session per ticket, checks that refuse, a person who decides. Not for sale."
---

**For peers** — What surrounds Claude Code to ship work: one session per ticket, checks that refuse, a pull request, a person who decides.

**For everyone** — How we build our products: AI agents write the changes, automatic checks verify them, a person accepts or refuses them.

> **We build our products with it, every day. It is not for sale for now.**

*Status: in development · internal use. Works with Claude Code.*

### § 1 — What it is

Krizaka Agents is the tooling around the models: a launcher that starts every session the same way, guards that refuse,
trains that merge, a watchdog that reads, a cockpit that shows. The sessions run in Claude Code; Claude Code provides the
agent loop, not us. What we build is what surrounds it: what delivers each change as a pull request and has it refused if
it does not pass.

All of it serves one job: delivery. It starts at the ticket and ends at the merge and its verification.

### § 2 — Three rules, and the rest follows

1. **GitHub is the source.** What we keep locally is a copy, to show and to warn.
2. **No model where the answer must be certain.** The launcher, the guards, the trains and the watchdog are plain code.
3. **Agents do not talk to each other.** A session writes what it has to say somewhere that stays: a commit, a pull request, a row in a database.

### § 3 — Who decides

A person sets the direction and decides what is theirs: money, accounts, legal matters, what cannot be undone. A CTO
agent decides the rest as long as it can be reversed, with a written cap whenever a spend is possible. Agents propose every
change as a pull request; they do not merge.

### § 4 — Where we are

It is our own technology, the one we build our products with, Sovkora first. It changes every week. It is not on sale
and not self-service, and its code stays private. This site shows the method; there is nothing to buy or to request here.

### Not proven yet
- The link between overlapping work and rework, in time or money.
- Any of this with an agent other than Claude Code.

[The full story: the architecture of Krizaka Agents →](https://blog.krizaka.com/story/the-architecture-of-krizaka-agents/)
