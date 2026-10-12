# AGENTS.md - @semoss/client

This document provides context for AI coding assistants working with the SEMOSS client — the
main web application.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md).

## Overview

`@semoss/client` is the primary SEMOSS web application. Its workspace runtime dependencies
are `@semoss/automation`, `@semoss/i18n`, `@semoss/panels`, `@semoss/renderer`, `@semoss/sdk`,
`@semoss/shared`, `@semoss/terminal`, `@semoss/utility`, `@semoss/ui`, and `@semoss/workbench`.
Reuse their supported public APIs before adding local code.

## Build System

- **Bundler**: Vite 8
- **Framework**: React 19 + TypeScript
- **State**: MobX and Zustand; preserve the owning store's contract
- **Routing**: `react-router` 8
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (development mode) |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm type-check` | `tsc --noEmit` type check |
| `pnpm test` | Run tests once |
| `pnpm test:ui` | Vitest UI |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm test:coverage` | Coverage report |

Run these from `packages/client`, or use `pnpm --filter @semoss/client <command>`.

### Path Alias

- `@/` → `./src/` (e.g. `import { useSession } from "@/hooks/use-session"`)

## Structure

The existing layout is below. Follow the React skill's
[architecture policy](../../skills/react-standard.skill.md#architecture-and-exports) for new
application features; this inventory does not require moving existing features.

| Folder / file | Purpose |
|---------------|---------|
| `api/` | API / pixel calls grouped by domain (`auth.ts`, `engines.ts`, `projects.ts`, …) |
| `assets/` | Images and static files |
| `components/` | Components grouped by feature area (`project/`, `engine/`, `settings/`, …) |
| `contexts/` | React contexts (`<name>.context.tsx`) |
| `features/` | Application features, one folder per concern (for example `team-list/`, `team-type/`, `team-members/`, `team-resource-access/`, `group-managers/`, `bulk-access-management/`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `pages/` | Routing tree (see below) |
| `stores/` | State owners (`assistant/`, `config/`, `designer/`, `page/`, `session/`, `workbench/`, `workspace/`) |
| `types/` | TypeScript types (`<name>.types.ts`) |
| `utility/` | Client-specific adapters and compatibility exports; generic helpers live in `@semoss/utility` |
| `main.tsx`, `App.tsx`, `index.css` | App entry files |

### Routing (`pages/`)

- `router.tsx` — entry point. Defines the `Router` (`observer`) plus `RouteConfig` and the
  `renderRoute` helper; lazy-loads feature routers with `React.lazy`.
- `<name>.routes.tsx` — exports a route-config array (e.g. `PROJECT_ROUTES` in
  `pages/project/project.routes.tsx`).
- `<name>.layout.tsx` — layout for a route subtree.
- `<name>.page.tsx` — a page component.
- Feature areas live in subfolders (`pages/project/`, `pages/engine/`, `pages/settings/`, …).

> Older route files may use legacy naming. Follow the React skill's
> [naming policy](../../skills/react-standard.skill.md#types-and-naming); do not turn an
> unrelated edit into a route-file migration.

### Bulk Access Management

Bulk Access Management makes many access changes in the client, then has the server validate
and save them together, through the SDK's [`api/access.ts`](../../libs/sdk/src/api/access.ts)
(`/api/auth/permissionBatch`).

- **Permission batches.** A `PermissionBatch` is one target (a project, engine, insight or
  custom team) and its `ADD`, `CHANGE` and `REMOVE` changes. A target can be in only one batch,
  so the changes to a resource go together. A change sets the whole access: leaving out the end
  date or a model limit clears it, so a level change carries the current grant forward.
  `validatePermissionBatches` checks batches against the user's permissions and the current
  access; `savePermissionBatches` saves all of them in one transaction or none.
  `getResourcePermissions` reads who has access and what the user may change
  (`allowedPermissionChanges`).
- **`features/bulk-access-management/`** is Bulk Access Management for a project or an engine,
  at `<app or engine path>/:id/access-control/bulk-access-management`, opened from the card on
  the Access Control tab. The tab's page (`ProjectAccessControl`, `EngineSettingsPage`) takes a
  `view`: Bulk Access Management and Effective Permissions replace the members under Member
  Permissions while the access settings above stay put. Their links come from
  `getAccessControlPath`, so a copy of the page shown elsewhere, such as a workbench panel,
  offers neither. `permission-batch.ts` holds the pure model (entries, edits, changes, copying
  and conflicts) and `use-permission-batch.ts` the state; the people search runs the existing
  users and the directory at the same time. Copying from an app or engine copies the people
  given access directly, with end dates and model limits; copying from a team gives each member
  their own access at one level. A copied person whose access differs is a conflict the user
  settles before the review: keep the change already staged for them, or use the copied access.
  Admins can make a custom team from the people in the batch: the team is made right away, and
  its members and its access join the changes (the members as a second batch on the team), so
  they are saved, or left out, with the rest. `permission-batch-review-dialog.tsx` is shared
  with the team view.
- **Nothing is lost by accident.** Both views ask before Discard Changes drops the staged
  changes, and `use-unsaved-changes-guard.ts` warns before leaving the page with changes that
  are not saved (the browser's warning on closing or reloading, and `discard-changes-dialog.tsx`
  for a move within the app). After a save, the lists are cleared until the access is read
  again, so the access from before the save is never shown.
- **Admin mode.** Outside admin mode an admin has only their own permissions, since an admin can
  also act as an ordinary user. The Access Control tab, My Teams and their Bulk Access
  Management views call `/auth/permissionBatch` with the user's permissions. Admin mode calls
  `/auth/admin/permissionBatch` (each SDK call takes `admin`): Team Permissions' Bulk Access
  Management, and the Bulk Access Management and Effective Permissions opened from an app's or
  engine's settings page in admin mode, at
  `settings/<app or engine type>/:id/bulk-access-management` and `.../effective-permissions`
  (`ADMIN_ACCESS_SETTINGS_PAGES` in `settings.constants.ts`). Making a team from the people in
  the batch is admin mode only.
- **Layout.** Both views and Effective Permissions open with `access-view-header.tsx` (a back
  button beside the title). Both views list the people on the left and put
  `add-people-card.tsx` on the right: the app's people, listed from the start and paged as they
  scroll, the directory search, and the Bring In Access menu (`bring-in-access-menu.tsx`), which
  holds the copy flows, Add Team and Make a Team. The list's column stretches to the card's
  height, so the two end together, and the card stays in view while a longer list scrolls. In
  the project and engine view's table (`permission-batch-list.tsx`), each row's change (Added,
  Changed, Removed) sits beside its remove or undo button in one narrow last column.
- **`features/team-access-management/`** is Bulk Access Management for a custom team's members
  and managers, at `settings/managed-teams/:id/bulk-access-management` and
  `settings/team-permissions/:type/:id/bulk-access-management`, for its managers and admins. A
  Members and a Managers tab each show their list (`team-role-list.tsx`, worded by
  `team-role-copy.ts`) beside the Add People card; managers are copied only from another team.
  `team-changes.ts` turns the edits into a batch for each list that changes (`TEAM` and
  `TEAM_MANAGERS` targets), saved together after one review, and keys people by login type and
  id (`getTeamPersonKey`), since a team keeps each person's login. Outside admin mode, a manager
  who stages removing themselves is warned that they lose the team once the changes are
  applied.
- **Login type.** People lists show the logo of each person's login beside their name
  (`access-identity.tsx`, with the login's name in its title), since two people can share an id
  on different logins.
- **`features/effective-permissions/`** is the Effective Permissions view of a project or an
  engine, at `<app or engine path>/:id/access-control/effective-permissions`, opened from the
  button beside Member Permissions: one row per person with the most access they have and every
  source of it, direct or through a custom team (`getEffectivePermissions`). Members of teams that
  mirror a login provider's groups are not in the database, so those teams are named apart.
- **`features/team-people/`** is the read only side panel the Teams table opens on a custom team:
  its managers and members, read through the resource with `getTeamUsers` and
  `getGroupManagers` given the project or engine, for the resource's owners and editors.

## State Management

- **Application state** is split among the existing stores, including session and config.
  Use their owning hooks, such as `hooks/use-session.ts` and `hooks/use-config.ts`; there is
  no `stores/root`, `stores/monolith`, or `useRootStore` entry to extend.
- **Domain state** uses its existing context/store contract. See the
  [client workbench components](./src/components/workbench/) and
  [domain stores](./src/stores/workbench/) for their owning implementations. General local-state and orchestration rules
  belong to the [React skill](../../skills/react-standard.skill.md#logic-state-and-effects).

## Styling

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md). Client-specific notes:

- **Priority boy-scout targets** (highest violation density — migrate to tokens/components as
  you touch them): `src/components/blocks-workspace/blocks/settings/**` (especially
  `custom/e-charts/**` and `shared/ColorPalatteSettings.tsx` — hex classes, inline colors,
  arbitrary sizes).
- **Ad-hoc status color maps to fold into tokens when touched**:
  `components/engine/engine-metadata-display.tsx` (`BADGE_TONES`),
  `pages/app/app-detail-tabs/commits-tab.tsx`, `pages/project/agent/agent-run-graph.tsx`.
  Use `Badge` variants + `destructive`/`success`/`warning`/`chart-*` tokens instead.
- Overlay migration and the ECharts exception follow [DESIGN.md](../../DESIGN.md).
- **Scoped reference**: `src/components/ui/section/section.tsx` demonstrates a small local
  composite using `cn()` and token classes. Do not treat an entire application file as a
  blanket design exemplar; audit the specific pattern before reusing it.

## Agent Guardrails

### Be Cautious With

- **`vite.config.ts`** — dev server, build, and test configuration.
- **`stores/session/`** — shared session state and permission ownership affect multiple surfaces.

### Known Gotchas

- TypeScript and lint rules follow the [React standard](../../skills/react-standard.skill.md).
- `usePixel` results expose `error` and `refresh`, but **not** `isError` / `isLoading` or
  iterator methods like `reset`.
- Record the actual type-check result and distinguish introduced failures from unrelated
  baseline errors; filtering to touched paths alone can miss broken consumers:
  ```bash
  pnpm --filter @semoss/client type-check
  ```

### Testing Changes

```bash
pnpm --filter @semoss/client test
pnpm --filter @semoss/client type-check
pnpm --filter @semoss/client dev      # Manual verification
```
