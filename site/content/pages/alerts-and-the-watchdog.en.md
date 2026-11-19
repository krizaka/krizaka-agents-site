---
title: "Alerts and the watchdog: every alert has an owner"
description: "A watchdog with no model reads the machine and GitHub; every alert stays in a table until a person takes it and a proof closes it."
---

### § 1 — An alert that goes away never existed

On 9 November a scheduled job stopped working for about six and a half hours. The watchdog saw it ten minutes later and
raised a critical alert, but as a pop-up nobody read. A notification shows up and goes away: what was missing was a place where the alert stays until
someone deals with it.

### § 2 — One table, an owner, a proof

Since 10 November every alert is a row in one table of our operations database, and no notification is sent any more.
*Fig. 1.* An alert is open; a person (or a session) takes it with a note, who looked and what was understood; it is
resolved with a proof. Taking an alert does not close it: the watchdog resolves it itself when its next complete read no
longer sees the problem, and keeps that read as the proof. The database refuses a resolution without a proof. An open
alert is never purged; the others are, seven days after they were acknowledged.

### § 3 — The watchdog reads, it does not repair

The watchdog is code with no model, so it costs no token. Every 15 minutes it runs its local checks (scheduled jobs that
fail or go silent, sessions that are stuck or loop). At most once an hour it reads GitHub: a red main, a red pull request
without an owner for an hour, a frozen repository. It never writes to GitHub. *Fig. 2.*

### § 4 — The database never decides

On the morning of 11 November, 43 of the 71 open alerts were stale (pull requests already merged, branches green again).
The database is there so that nothing is missed, never to decide: before merging or writing « done », we check on GitHub.

### § 5 — Events, not the clock

On 10 November we reread the last 20 runs of each scheduled job: most of them answered « nothing to do ». Jobs now start
on an event (a merge, the end of a session), not on the clock.

### Not proven yet
- The history of alerts cannot yet be replayed from journals; it exists only locally.

[The full story: how our agent teams talk →](https://blog.krizaka.com/story/how-our-agent-teams-talk/)
