---
title: "Krizaka Agents: how we ship with coding agents"
description: "We build our products with AI agents. Here is how: one session per ticket, checks that refuse, a person who decides. Not for sale."
---

**In short** — How we build our products: AI agents write the changes, automatic checks verify them, a person accepts or refuses them.

**For engineers** — What surrounds Claude Code to ship work: one session per ticket, checks that refuse, a pull request, a person who decides.

> **We build our products with it, every day. It is not for sale for now.**

*Status: in development · used internally every day.*

Measured over 48 hours in November: 92 pull requests merged, 37 skipped, each with its reason. Two merged examples you can open: [blog PR 379](https://github.com/krizaka/krizaka-blog/pull/379), [PR 378](https://github.com/krizaka/krizaka-blog/pull/378).

<!--write-->

### § 1 — What it is

Krizaka Agents is what we put around AI models so their work can be trusted. Every change starts from a ticket, goes
through checks that can refuse it, arrives as a pull request (a proposed change to the code, read before it is merged)
and is accepted or refused by a person. The sessions run in Claude Code; Claude Code provides the
agent loop, not us. What we build is what surrounds it: what delivers each change as a pull request and has it refused if
it does not pass.

<!--view:agents_context-->

All of it serves one job: delivery. It starts at the ticket and ends at the merge and its verification.

### § 2 — Three rules, and the rest follows

1. **GitHub is the source.** What we keep locally is a copy, to show and to warn.
2. **No model where the answer must be certain.** The part that starts a session, the checks that refuse, the queue that merges and the monitor that raises alerts are plain code, with no model.
3. **Agents do not talk to each other.** A session writes what it has to say somewhere that stays: a commit, a pull request, a row in a database.

### § 3 — Who decides

A person always has the last word on money, accounts, legal matters and anything that cannot be undone. Within those
limits, an AI agent acting as technical lead decides what can be reversed, with a written spending cap. Agents propose
every change as a pull request; they do not merge.

### § 4 — Where we are

It is our own technology, the one we build our products with, starting with Sovkora, the AI service our products run on. It changes every week. It is not on sale
and not self-service, and its code stays private. This site shows the method; there is nothing to buy or to request here.

### Not proven yet
- The link between overlapping work and rework, in time or money.
- Any of this with an agent other than Claude Code.

[The full story: the architecture of Krizaka Agents →](https://blog.krizaka.com/story/the-architecture-of-krizaka-agents/)
