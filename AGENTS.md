# krizaka-agents-site — agent contract

<!-- krizaka-agents-template v2: rendered from krizaka/.github docs/standards/agents-template.md (scripts/agents-md.mjs). The one AGENTS.md standard: six sections in this order, at most 150 lines, bullets and imperatives. The conformance check « agents-template » reads the headings, the length and CLAUDE.md. Detail goes to docs/ via References, not here. -->

## Project context

- The information site of Krizaka Agents (agents.krizaka.com): six pages in French and English, a static export on GitHub Pages.
- Kind: `node` · team: `krizaka` · registry entry: [repos.json](https://github.com/krizaka/.github/blob/main/repos.json).
- Read this file first: this repository has no `docs/` detail file, everything specific to it is below.
- `CLAUDE.md` is the one line `@AGENTS.md` (or a symlink to this file): never a second copy of it.
- The Next.js app lives in `site/` (Node ≥ 22); every npm command runs there.

## Essential commands

```bash
(cd site && npm run lint)   # tsc --noEmit && node scripts/proofs.mjs check
(cd site && npm run test)   # node --test tests/*.test.mjs
(cd site && npm run build)  # next build
```

- `npm run dev` (`next dev`) serves the site locally.
- Run them on what you changed before every push; CI runs the rest.

## Architecture & conventions

- Follow the [krizaka-engineering skill](https://github.com/krizaka/krizaka-skills/blob/main/skills/krizaka-engineering/SKILL.md); search its [packages reference](https://github.com/krizaka/krizaka-skills/blob/main/skills/krizaka-engineering/references/packages.md) before writing anything generic.
- Take libraries first: a size check, a date sum, a money format, a fetch, a retry, a rate limit, a validation regex come from `@krizaka/*`; a missing function goes into the package first, never a local copy.
- Keep ports and adapters: domain code reads no env, no ambient clock, no database client; services talk to ports; route handlers are thin (authenticate, parse, one service call, map the result).
- Write one job per function: cognitive complexity ≤ 15, nesting ≤ 2, a body under 60 lines; a form saves once; the same block twice is a function, in two repositories a package function.
- Put limits, prices, durations and flags in settings an administrator changes, not in constants.
- A closed set is a type (`as const` object, Java enum or sealed interface), never strings compared by hand.
- Name things by what they do (`media-store.ts`, never `postgres.ts`); no `utils`, `helpers`, `manager`.
- Type errors with a stable code, mapped to HTTP once; user messages come from the catalogues.
- Architecture views are drawn from the org model `krizaka-agents.c4` of krizaka/.github into `site/lib/architecture.json` by `site/scripts/architecture.mjs`; a page places one with `<!--view:<id>-->` and a replayed real run with `<!--run:<id>-->` (ids listed in `site/lib/views.ts`; an unknown id stops the build).
- Run proofs live in `site/content/proofs/`, described by `sources.json` (repository, path, commit, sha256).
- Hierarchy: this root file holds the rules of the whole repository; a sub-folder with its own rules adds a local `AGENTS.md` that says only what differs there. The nearest file wins.

## Guard-rails & known pitfalls (read before coding)

- The checks are the judge ([ADR-015](https://github.com/krizaka/krizaka-internal/blob/main/docs/adr/.github/ADR-015-ai-code-audit-measured-and-enforced.md), [guards](https://github.com/krizaka/.github/blob/main/docs/standards/guards.md)): never `--no-verify`, never a new `eslint-disable`, never a raised ratchet or baseline; a rule is never silenced to get green.
- Never edit a file of `site/content/proofs/` by hand: it is a byte-for-byte copy of a run proof of krizaka-agents; resync with `node scripts/proofs.mjs sync <id> --from <krizaka-agents checkout>` (the lint fails on a copy that differs from its recorded sha256, and on a pending proof that already has a copy).
- Never edit `site/lib/architecture.json` by hand: regenerate it with `node scripts/architecture.mjs layout <krizaka/.github checkout>` (the CI job « Architecture views » checks it against the model; it needs `@krizaka/architecture` installed with `--no-save`).
- Keep workflow tokens read-only by default; every `uses:` stays pinned by full commit SHA and the org workflow pins move only with krizaka/.github.
- Start a fix with a failing test; every bug gets its guard; the journey (end to end) proves the feature.
- Never invent a URL, a law article, a price or a figure you did not read; write `TO VALIDATE` and say who decides.
- Never commit a secret, a capture or a log; no production data in a session, only the dev data.
- Anti-slop: use `?.` and `??` in TypeScript, not a chain of `&&` or a ternary on null.

## Expected validation workflow

- [ ] Compile, format, lint and test what changed (the commands above); fix the cause of a red, never the guard.
- [ ] The « before you push » checklist of the skill holds for what changed.
- [ ] A feature or fix PR names its journey (`Journey: <name>` or `Journey: n/a — <reason>`).
- [ ] README and generated docs still say what the code does; the docs map category of the change is updated.
- [ ] One issue, one small PR (`Closes #<n>`); merge only with green CI.

## References

- [Org standards](https://github.com/krizaka/.github/tree/main/docs/standards) of krizaka/.github; the [engineering charter](https://github.com/krizaka/.github/blob/main/AGENTS.template.md) (naming, tests, mobile, coding agents).
- [krizaka-engineering skill](https://github.com/krizaka/krizaka-skills/blob/main/skills/krizaka-engineering/SKILL.md).
