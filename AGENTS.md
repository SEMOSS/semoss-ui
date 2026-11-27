# AGENTS.md - SEMOSS Monorepo

SEMOSS is a React analytics platform built as a pnpm monorepo with Turborepo: shared libraries
in `libs/`, applications in `packages/`. This file is the map. Rules live in
[docs/standards](./docs/README.md#standards), task procedures in [skills/](./skills/README.md),
and package specifics in each package's `AGENTS.md`.

- **Node** >=26.0.0 <27 (`.nvmrc`), **pnpm** ~12.18.0 (`packageManager` pins `pnpm@12.18.0`)
- Lint and formatting: [biome.json](./biome.json). Design: [DESIGN.md](./DESIGN.md).

- Scripts: the root [package.json](./package.json) and each package's. `pnpm check` / `pnpm fix`
  run Biome; `pnpm clean` runs Knip (unused files, dependencies, exports) and deletes nothing.

## Non-Negotiables

1. **Smallest change first.** State the goal and the smallest change that meets it. Preserve
   public contracts, do not widen scope, and report migrations instead of starting them.
   ([principles](./docs/standards/general.md#principles))
2. **Dependencies point inward.** Never import across a forbidden package edge
   ([general.md](./docs/standards/general.md#architecture)). Each `package.json` is the source of
   truth for what a package depends on ([packages.md](./docs/architecture/packages.md)).
3. **Layer each feature.** App features live in `src/features/<feature>/`: pure model, hooks,
   `api/` modules, humble components; pages are thin. ([architecture](./docs/standards/general.md#architecture))
4. **Name feature files `<feature>-<what>`** with the role suffix (`.store.ts`, `.context.tsx`,
   `use-<feature>-<what>.ts`, …). ([file naming](./docs/standards/general.md#naming))
5. **Backend calls go through `@semoss/sdk`** in `api/` modules, never raw `fetch`; validate and
   map responses there; surface every failure. ([call-backend](./skills/call-backend.skill.md))
6. **New shared state is a `StoreState` store** read with `useStoreSelector`. No new MobX,
   Zustand, or listener sets; legacy stores keep their contracts.
   ([state](./docs/standards/react.md#state))
7. **React:** one component per file; derive in render; effects only sync external systems,
   with cleanup. ([react](./docs/standards/react.md))
8. **Biome is the rulebook.** [biome.json](./biome.json) owns lint and format rules; touched files
   pass `pnpm exec biome check`. Beyond it: no `@ts-nocheck`.
   ([typescript](./docs/standards/typescript.md))
9. **Comments explain why, not what.** Every export gets a concise comment (TSDoc in TS/TSX)
   saying what it is for and any non-obvious why; no comments on barrels; internal functions only
   when not obvious. Knowledge lives on the symbol that owns it, not in AGENTS.md: when you touch a
   file, add or update the comments on the symbols you change. ([comments](./docs/standards/general.md#comments))
10. **UI** comes from `@semoss/ui/next` with semantic tokens; no raw palette, hex, or arbitrary
   values. ([styling](./docs/standards/ui.md#styling), [DESIGN.md](./DESIGN.md))
11. **Text:** every user-facing string goes through i18n; names in Title Case, sentences in
    sentence case. ([ui text](./docs/standards/ui.md#ui-text))
12. **Generic helpers** go in `libs/utility`, after searching for an existing one.
    ([utility guide](./libs/utility/AGENTS.md))
13. **Prove it works.** Name tests `*.test.ts(x)`; run focused checks and `pnpm check`; report
    exactly what ran. ([testing](./docs/standards/testing.md))
14. **Do not modify** `pnpm-lock.yaml`, `pom.xml`, `settings.xml`, or `*.local` files. **Be
    cautious with** `turbo.json`, `biome.json`, and the root `package.json`.

## Commits and Pull Requests

This repository enforces its commit convention with commitlint (`commitlint.config.ts`, run by
the lefthook `commit-msg` hook).

- Read the rules before committing: `pnpm exec commitlint --print-config json`
- Validate a message before using it: `printf '%s' "<message>" | pnpm exec commitlint`
  (exit 0 = valid)
- If the commit-msg hook rejects a commit, fix the rules named in brackets
  (e.g. `[subject-case]`) and retry. Never use `git commit --no-verify`.
- Every PR description follows the org-wide PR template, written as the final step of the
  change ([review-change: Pull Request](./skills/review-change.skill.md#pull-request)).

## Task Routing

| If you are about to… | Load |
|---|---|
| Add or extend an app feature, screen, or route | [build-feature](./skills/build-feature.skill.md) |
| Add or change a reusable component | [build-component](./skills/build-component.skill.md) |
| Create or change a form | [build-form](./skills/build-form.skill.md) |
| Add shared state or migrate a store | [add-store](./skills/add-store.skill.md) |
| Read or write backend data, or add an SDK API | [call-backend](./skills/call-backend.skill.md) |
| Work on rooms, chat, agent runs, or session | [libs/sdk/AGENTS.md](./libs/sdk/AGENTS.md) |
| Change the chat's UI: a room, messages, the composer, the Workspace | [libs/chat/AGENTS.md](./libs/chat/AGENTS.md) |
| Add, change, or remove UI text keys | [add-translations](./skills/add-translations.skill.md) |
| Add a dock panel, file view, or domain workbench | [add-workbench-panel](./skills/add-workbench-panel.skill.md) |
| Make UI work on small screens or touch | [make-responsive](./skills/make-responsive.skill.md) |
| Hand off or review a change | [review-change](./skills/review-change.skill.md) |
| Edit AGENTS.md, docs, or skills | [maintain-agent-docs](./skills/maintain-agent-docs.skill.md) |

## Reference

| To understand… | Read |
|---|---|
| Any rule (architecture, React, a11y, forms, …) | [docs/README.md](./docs/README.md#standards) |
| Packages, dependencies, public APIs | [docs/architecture/packages.md](./docs/architecture/packages.md) |
| Where each package stands on state | [docs/architecture/packages.md#state-migration](./docs/architecture/packages.md#state-migration) |
| i18n loading and namespaces | [docs/architecture/i18n.md](./docs/architecture/i18n.md) |
| UI composition and design | [DESIGN.md](./DESIGN.md) |
| A feature | Its folder, linked from the package guide's Reference, and its `AGENTS.md` if one exists |

## Package Guides

Libraries: [utility](./libs/utility/AGENTS.md) · [sdk](./libs/sdk/AGENTS.md) ·
[ui](./libs/ui/AGENTS.md) · [i18n](./libs/i18n/AGENTS.md) · [shared](./libs/shared/AGENTS.md) ·
[connectors](./libs/connectors/AGENTS.md) · [renderer](./libs/renderer/AGENTS.md) ·
[workbench](./libs/workbench/AGENTS.md) · [panels](./libs/panels/AGENTS.md) ·
[chat](./libs/chat/AGENTS.md)

Applications: [client](./packages/client/AGENTS.md) ·
[playground](./packages/playground/AGENTS.md) ·
[playground-desktop](./packages/playground-desktop/AGENTS.md) · [terminal](./packages/terminal/AGENTS.md) ·
[auditlog](./packages/auditlog/AGENTS.md) · [automation](./packages/automation/AGENTS.md) ·
[browser-automation](./packages/browser-automation/AGENTS.md) ·
collaboration ([technical guide](./packages/collaboration/docs/technical-guide.md))
