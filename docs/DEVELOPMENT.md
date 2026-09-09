# Bookie — Development Rules

This is the coding-agent rulebook for working in the Bookie repository.

## Branch rule

Bookie uses **ONE** development branch: `main`.

- Work directly on `main`.
- Do **not** create feature branches.

## Before coding

Always:

1. Inspect the relevant existing code.
2. Read the relevant docs in `docs/`.
3. Understand the existing architecture (`docs/ARCHITECTURE.md`).
4. Reuse existing implementation where possible.
5. Make the smallest clean change necessary.

## Code quality

- Respect TypeScript strictness; avoid unnecessary `any`.
- Avoid duplicated logic and duplicated components.
- Avoid unnecessary dependencies — verify a library is already used before adding it.
- Keep components maintainable and single-purpose.
- Keep server/client boundaries intentional (`"use client"` only where interactivity requires it).
- Follow existing naming conventions and the `@/` path alias.
- Preserve existing functionality; do not replace a working implementation just because another approach is preferred.

## UI

- Responsive by default — desktop, tablet, mobile.
- Accessible interactive elements: correct semantic HTML, visible focus states, keyboard-friendly interactions.
- All clickable elements show `cursor-pointer` (centralized base rule; add explicitly to non-standard clickable surfaces). Do not make decorative elements appear clickable.
- No fake interactions. No dead buttons unless explicitly marked as future/planned functionality (per the roadmap).

## Database

- PostgreSQL only. Prisma 7 conventions: datasource URL in `prisma.config.ts` (never `url = env(...)` in the schema), driver adapters required, generated client in `generated/prisma`.
- Never run destructive database commands (`migrate reset`, `--force-reset`, drops) without explicit instruction.
- Do not redesign the schema for UI milestones; only change it when genuinely required.

## Verification

After meaningful changes, run the project's available checks using the actual scripts in `package.json`:

- lint: `npm run lint` (eslint; the project also uses `--max-warnings=0`)
- typecheck: `npx tsc --noEmit`
- tests: none configured yet — do not claim a test run that did not happen
- build: `npm run build`

Do **not** claim a check passed unless it actually passed.

## Documentation

- Keep `docs/` current: update `docs/CURRENT_TASK.md` only when the current task changes; reflect architecture/design/database facts in the respective docs.
- There is no `MILESTONES.md` — the roadmap lives in `docs/ROADMAP.md`.