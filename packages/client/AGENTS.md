# AGENTS.md - @semoss/client

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

The main SEMOSS web application: catalogs, settings, access control, workbenches and admin tools.

## Boundaries

- **Must not:** be imported by any other package. It is an application, not a library.
- Reuse dependencies through their public entry points before adding local code.
- **SDK first.** Sign in, sign out, registration, LinOTP, file upload and download, engine
  members, logout and permission batches are `@semoss/sdk` APIs. Do not restore client wrappers.
- New feature code goes in `src/features/<feature>/`. Older route files use legacy names; do not
  turn an unrelated edit into a route-file rename.

## Invariants / Easy to Break

- **Admin mode means admin endpoints.** Outside admin mode an admin acts with their own
  permissions. Anything done to someone else's engine or project in admin mode must call the
  `Admin*` pixel or `/auth/admin/...` endpoint (SMSS read and save, access requests, deletes,
  permission batches). SDK calls take an `admin` flag.
- **Session and config belong to the SDK.** `main.tsx` calls `Session.initialize()` once;
  `Router` waits on its status. Read with `useSession`, `useConfig` and `useSessionInsight` from
  `@semoss/sdk/react`; the client keeps no copy. Workbenches seed permissions with
  `Session.permissions.sync`/`refresh`.
- **State.** There is no `stores/root` or `useRootStore`. New shared state uses `StoreState` +
  `useStoreSelector`. Legacy stores migrate one per change:
  - MobX: `stores/designer/`, `stores/workspace/`, and the `observer` reads over renderer block
    state in `components/blocks-workspace/` (these move with `@semoss/renderer`, not before).
  - Zustand: `stores/assistant/`, `stores/page/`, `stores/workbench/` (`model`, `database`,
    `automation`). The workbench domain stores take the dock's `StoreApi<WorkbenchState>` and
    move with or after `@semoss/workbench`.
- **Workbench layout cache.** A cached layout replaces the default. When you change a default
  layout, bump the version at the end of its cache key (`workbench-layout--<id>--<version>`),
  or people who opened it before never see the change.
- **Settings sections are ordered by hand.** Engine and project settings section lists are
  alphabetical with Dangerous last; nothing sorts them at runtime.
- **Catalog name key is reserved.** Engine import forms keep the catalog name under
  `CATALOG_NAME_KEY`; the backend drops it before writing the smss.

## Styling

Follow [DESIGN.md](../../DESIGN.md) and [styling standard](../../docs/standards/ui.md#styling).
Client-specific targets:

- Highest violation density (fold to tokens when touched):
  `src/components/blocks-workspace/blocks/settings/**`, especially `custom/e-charts/**` and
  `shared/ColorPalatteSettings.tsx`.
- Ad-hoc status color maps to replace with `Badge` variants and status tokens:
  `components/engine/engine-metadata-display.tsx` (`BADGE_TONES`),
  `pages/app/app-detail-tabs/commits-tab.tsx`, `features/agent-activity/agent-run-graph.tsx`.

## Validation

```bash
pnpm --filter @semoss/client test
pnpm --filter @semoss/client type-check
```

Record the real type-check result and separate new failures from baseline ones; filtering to
touched paths can miss broken consumers. Check UI manually with `pnpm dev`.

## Reference

[architecture](../../docs/standards/general.md#architecture),
[file naming](../../docs/standards/general.md#naming), [state](../../docs/standards/react.md#state),
[state migration](../../docs/architecture/packages.md#state-migration),
[workbench](../../libs/workbench/AGENTS.md), [testing](../../docs/standards/testing.md).
