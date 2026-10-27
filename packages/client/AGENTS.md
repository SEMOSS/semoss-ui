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
| `features/` | Application features, one folder per concern (for example `team-list/`, `team-type/`, `team-members/`, `team-resource-access/`, `group-managers/`, `bulk-access-management/`, `usage-limit-path/`, `platform-default-limit/`, `team-usage-limit/`, `model-usage-limits/`, `my-model-usage/`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `pages/` | Routing tree (see below) |
| `stores/` | State owners (`assistant/`, `config/`, `designer/`, `page/`, `session/`, `workbench/`, `workspace/`) |
| `types/` | TypeScript types (`<name>.types.ts`) |
| `utility/` | Client-specific adapters and compatibility exports; generic helpers live in `@semoss/utility` |
| `main.tsx`, `App.tsx`, `index.css` | App entry files |

Client `api/` modules contain application-specific requests. LinOTP login/OTP
confirmation, file upload/download, engine-member listing, logout, and bulk
permission changes use the owning `@semoss/sdk` APIs; logout is exposed through
the session store. Reuse those APIs instead of restoring duplicate client wrappers.
Database catalogs use paginated `MyEngines`/`AdminMyEngines` reactors. Audit reads
and exports use the audit API builders backed by `AdminUserAuditEvents`.

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
- **How Usage Limits Work.** Every place a usage limit is set or shown has the shared
  `UsageLimitGuideButton` beside it, opening the guide at the section that matters there: the
  Model Usage Limits card, the Teams table and Give a Team Access (Team Limits), the members
  dialogs (No Limit Defined, Unlimited and Rules), Effective Permissions, Bulk Access Management
  (Who Sets Each Limit), a person's path sheet, the admin limit cards and the User's Total Model
  Limit fields, and My Profile's Model Usage (the person's own view). Each host passes what the
  viewer can set when it knows it.
- **Model usage limits.** Only a model's owners, and admins in admin mode, set or change any
  usage limit on it: a person's, a team's, the public use limit and the model total. The backend
  sends editors an empty `allowedPermissionChanges.limitLevels` and `canChangeModelLimits` false;
  `canSetUsageLimits` and `canSetPersonLimitAt` in `permission-batch.ts` read them. Editors still
  add people and change the levels of Read-Only and Editor people. On a model, each person's and
  team's staged Usage Limit cell is a `usage-limit-edit-button.tsx` (the summary with a pencil,
  named by its visible text after screen-reader-only context, so a "Was ..." line is read too)
  that opens `usage-limit-dialog.tsx` with the shared `ModelUsageLimitEditor`: a person's own
  rules, or a team's shared and for each member rules. `getLimitBlockReason` keeps a cell
  read-only for everyone else, with the shared `OWNERS_ONLY_LIMIT_REASON` ("Only owners can set
  usage limits"). A change sets the whole access, so a level change by an editor carries the
  limit forward as it is now. For owners, Add With has a usage limit button, so people added,
  and a team's members copied in, get that limit; an editor's Add With limit is disabled, people
  they add get none, and anyone who has access keeps their own. Only owners take away the access
  of someone with a usage limit (`getRemoveBlockReason`): for anyone else, that row's Remove
  Access button stays focusable but does nothing, and its tooltip gives
  `OWNERS_END_LIMITED_ACCESS_REASON`. Owners can pick rows and give
  them one limit with Set Usage Limit; the selection is cleared after the changes are applied.
  The Model Total and Public Use Limit rows are pinned at the top of the list and staged as
  `MODEL` and `PUBLIC` changes, by owners only; the Public Use Limit reads "Applies while this
  model is public" on a model that is not. Copying from another app or engine keeps limits
  between models; on a model without known prices, copied cost rules are left out and the
  people they belonged to are conflicts to settle. A copy by someone who cannot set limits
  (`CopyOptions.canSetLimits` false) copies levels and end dates only: each person keeps the
  limit they have now. The review lists both a level change and a limit change. Give a Team
  Access (`features/group-access/`) shows the team limit below the access level on a model for
  owners (`GroupAccessModel.canChangeLimit`), starting at No Limit Defined, and sends it for the
  team added; anyone else adds the team with no limit and sees why.
- **`features/team-usage-limit/`** is a team's usage limit in the Teams table
  (`components/settings/teams-table.tsx`) on a model's Access Control tab. On a model the table
  has a Usage Limit column (`team-usage-limit-cell.tsx`) with each team's summary, read with
  `getResourcePermissions` and matched to the teams by type and name (`use-team-usage-limits.ts`,
  in admin mode when the table's `admin` is set), which also gives `canChangeModelLimits` and
  `costLimitsAvailable`. For the model's owners the cell is the same `usage-limit-edit-button.tsx`
  and opens `usage-limit-dialog.tsx` with the
  team's shared and for each member rules, and Save Limit saves at once: one permission batch on
  the engine with one `CHANGE` for the team (`toTeamLimitBatch`), carrying its level and end date
  as they are, through `savePermissionBatches`. A refused save shows the backend's reason in the
  dialog, which stays open; a saved one reads the limits again. Everyone else sees the summary
  with "Only owners can set usage limits". The table's Give a Team Access gives a team limit only
  when `canChangeModelLimits` says the user can. A level change from the table sends
  no limit, since the backend keeps it, and reads the grants again so the next limit change
  carries the new level. `team-usage-limit.ts` also holds the team limit words Bulk Access
  Management and Give a Team Access use.
- **`features/model-usage-limits/`** is a model's total and its public use limit on the model's
  Access Control tab, for its editors and owners (`model-usage-limits-card.tsx`, side by side on
  wide screens and stacked on narrow ones), read with
  `getResourcePermissions` (`use-model-usage-limits.ts`). For the model's owners each summary is
  the same `usage-limit-edit-button.tsx` and opens `usage-limit-dialog.tsx`, and Save Limit saves
  at once: one permission batch on the engine with one `MODEL` or `PUBLIC` change
  (`toModelLimitBatch`). A refused save shows the backend's reason in the dialog; a saved one reads
  the limits again. Editors see both read-only, with "Only owners can set usage limits".
  `model-usage-limits.ts` also holds the names (`MODEL_LIMIT_NAMES`) and descriptions Bulk Access
  Management uses for the same two limits.
- **Nothing is lost by accident.** Load Latest Access reads the access again and keeps the
  staged changes. Both views ask before Discard Changes drops them, and
  `use-unsaved-changes-guard.ts` warns before leaving the page with changes that are not saved
  (the browser's warning on closing or reloading, and `discard-changes-dialog.tsx` for a move
  within the app). After a save, the lists are cleared until the access is read again, so the
  access from before the save is never shown.
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
  holds the copy flows and, in the project and engine view, Add Team and (in admin mode) Make a
  Team From These People. The list's column stretches to the card's height, so the two end
  together, and the card stays in view while a longer list scrolls. In the project and engine
  view's table (`permission-batch-list.tsx`), each row's change (Added, Changed, Removed) sits
  beside its remove or undo button in one narrow last column.
- **`features/team-access-management/`** is Bulk Access Management for a custom team's members
  and managers, at `settings/managed-teams/:id/bulk-access-management` and
  `settings/team-permissions/:type/:id/bulk-access-management`, for its managers and admins. A
  Members and a Managers tab each show their list (`team-role-list.tsx`, worded by
  `team-role-copy.ts`) beside the Add People card; Copy People From a Team (`copy-team-people-dialog.tsx`) lists every team the user can copy from, this one included, and then shows the chosen team's members and managers as cards (`copy-source-option.tsx`, read by `use-team-people-to-copy.ts`) with how many people each holds and how many are new; a card is disabled when its list is empty, everyone in it is already there, it cannot be read, or it is the list being changed. So managers added by mistake can be copied into the members in one step, then removed from the managers.
  `team-changes.ts` turns the edits into a batch for each list that changes (`TEAM` and
  `TEAM_MANAGERS` targets), saved together after one review, and keys people by login type and
  id (`getTeamPersonKey`), since a team keeps each person's login. Outside admin mode, a manager
  who stages removing themselves is warned that they lose the team once the changes are
  applied.
- **People.** Every list of people in the client shows each person with the shared
  `PersonIdentity` (see [libs/shared/AGENTS.md](../../libs/shared/AGENTS.md)): their avatar with
  their login's logo on a round badge, starred for the signed in login, their name, and their id
  and email. `access-identity.tsx` hands people to it and draws a team with its type's icon in a
  circle of the same size, so people and teams line up. The Members settings list, Effective
  Permissions, the directory search, Add User and the service accounts table use it too; tables
  that need it also keep a Login Type column.
- **`features/effective-permissions/`** is the Effective Permissions view of a project or an
  engine, at `<app or engine path>/:id/access-control/effective-permissions`, opened from the
  button beside Member Permissions: one row per person with the most access they have and every
  source of it, direct or through a custom team (`getEffectivePermissions`), filtered by where
  the access comes from (Everyone, Direct Only, Teams Only, Both). Its Refresh reads the access
  again. Members of teams that mirror a login provider's groups are not in the database, so each
  such team shows as one row of its own. On a model it adds Limit Applied By and Usage Limit
  columns (`effective-usage.ts`), filters for the limit applied and for people nothing caps, the
  Model Total and Public Use Limit rows at the top, and each provider team's limit, each limit one rule per
  line (the shared `ModelUsageLimitRules`); a person's row opens how every limit applies to them
  (`features/usage-limit-path/`). The sheet keeps the person last opened while it closes, so its
  title does not change during the animation.
- **`features/usage-limit-path/`** shows how usage limits apply to one person on a model in a side
  sheet, with the shared `UsageLimitPathView`: someone on the model, from Effective Permissions
  (`getUsageLimitPath`, in admin mode as an admin), or the signed in person's own, from Your Usage
  Limit in a model's page header (`getMyUsageLimitPath`). A read that fails shows its
  error. `usage-limit-path-panel.tsx` is the sheet's body (Refresh with How Usage Limits Work beside
  it, the read's state and the view). `features/my-model-usage/` is My Profile's Model Usage dashboard: every model the signed
  in person can use, read in one call (`getMyUsageLimitPaths`), the most urgent first, each with
  the limit applied, its most used rule (or a ceiling's) as a bar, and a standing (Used Up, Almost
  Reached, Within Limit, Use Not Known, Unlimited, No Limit); `my-model-usage.ts` works these out.
  The percent used comes from the shared `getUsedPercent`, which rounds a rule not used up down, so
  it never reads 100%. The line under the bar names a ceiling or the Team Total the rule belongs
  to (`describeTightestDetail`). Almost Reached starts at the shared `ALMOST_REACHED_SHARE`, and
  the Used Up and Almost Reached words are the shared `USAGE_SHARE_STATUS_LABELS`, so the
  dashboard and the rule meter in the path view say the same. Models with no limit are listed on
  request, and a model's name opens the same sheet as Your Usage Limit, which keeps the
  model last opened while it closes. A rule's bar says Almost Reached or Used Up near or at its
  amount, and nothing before. Someone else's User's Total Model Limit and General Platform Limit
  steps can come without their rules outside admin mode (`rulesHidden`); the path view says only
  admins can see them.
- **Limits that belong to no grant.** `components/settings/usage-limit-settings-card.tsx` and
  `use-stored-usage-limit.ts` edit one stored limit with Reset and Save: the General Platform Limit
  card (`features/platform-default-limit/`) on the admin Model Settings page, each person's own rules
  across all models, and the admin-only Team Total card (`features/team-details/team-total-card.tsx`)
  on a team's admin page, shared rules across all models. The SDK's set calls resolve with the
  limit the backend saved, which the card shows and its editor starts again from. Save stays
  enabled except while saving; Reset is enabled once something changed. A member's User's Total
  Model Limit is edited with the same editor in `member-profile-form.tsx` and Add User
  (`user-add-overlay.tsx`). These, `usage-limit-dialog.tsx`
  and Give a Team Access keep Save enabled for a limit that is not complete: pressing it saves
  nothing, shows the editor's problems from then on and moves focus to the first one (see
  [libs/shared/AGENTS.md](../../libs/shared/AGENTS.md)), so nothing is red before the first try.
  Each passes the editor `disabled` while it saves. A refused save still shows the backend's
  reason.
- **Model prices.** `components/engine/engine-model-prices.tsx`, on a model's Model Settings page,
  shows the prices cost limits count calls at. Only owners change them: they add prices for any provider, as many rows as they
  like before saving, and remove any row but the one cost limits use; a rate that has a value
  cannot be cleared. Editors see them read-only. Cost limits use the entry for the model's
  serving provider (`effectiveServingProvider` from `GetModelMetadata`: the Serving Provider in
  Model Settings, else the engine's smss PROVIDER or MODEL_TYPE), else the model maker's, else
  the first, which the card marks Used for Cost Limits (`costPriceEntry`). A note says which
  price applies, that it stands in for the serving provider's (`costPriceForServingProvider`
  false), or that there is none. Owners can add prices for any serving provider (Add Prices,
  the serving provider first), since a model can be moved to another provider later. Problems show once Save is
  pressed: the prices that stop it are marked invalid, described by the problem, and the first
  one gets focus; Save reads "Saving..." with a spinner while it runs. The card reads its own
  `GetModelMetadata`, so `engine-model-settings-page.tsx` gives it a new key after each Model
  Settings save, a catalog entry applied included: it reads the prices again, and edits made to
  the prices read before are dropped rather than saved over the new ones.
- **`features/team-people/`** is the read only side panel the Teams table opens on a custom team:
  its managers and members, read through the resource with `getTeamUsers` and
  `getGroupManagers` given the project or engine, for the resource's owners and editors.
  `TeamPeopleManagers` and `TeamPeopleMembers` are also shown in Give a Team Access
  (`features/group-access/`): before authorizing, See Managers and Members shows a custom team's
  managers and members in place of the team list, and the All Teams breadcrumb goes back to the
  list with its search and scroll kept. A resource's owners may read them even before the team
  has access to it (its editors only once it does). In admin mode they are read as an admin.

### Audit Trail

- **`features/audit-trail/`** is the audit trail: the admin Audit Trail at `settings/audit-trail`
  (`audit-trail.tsx`, read with `AdminAuditEvents`), and a project's or engine's Audit tab for its
  owners (`resource-audit-trail.tsx`), both through `api/audit-trail.ts` and
  `api/resource-audit-trail.ts`. Each row names the event (`AuditEventSummary`: its label, what a
  denied request tried, and the stored type the Event type filter matches), shows the actor and the
  affected user with `AuditIdentity` (the shared `PersonIdentity`, or a cog for SEMOSS itself and a
  robot for an agent in a circle of the same size), what it was on with `AuditTarget` (a user as a
  person, an engine's logo with `EngineSubtypeIcon`, an app's image with `AppCatalogAvatar`, each
  with its kind and id under its name, named as the catalog has
  it now: the backend adds `TARGET_DISPLAY_NAME`, `TARGET_ENGINE_TYPE` and `TARGET_ENGINE_SUBTYPE`
  to each event it returns, see `AUDIT_TARGET_CATALOG_COLUMNS`), and the
  outcome and severity as `AuditStatusBadge` and `AuditSeverityBadge` (an icon or a dot in the
  status color beside the word). `audit-labels.ts` holds the words for the backend's event types,
  statuses, severities, categories and target types (`AuditEventType` and its siblings in SEMOSS);
  a value it does not know is shown in words. The details sheet (`audit-event-details.tsx`) shows
  only the fields an event recorded, JSON as a tree. Enterprise Usage's Access, Settings & Limits
  tab uses the same pieces, and counts app and engine setting changes
  (`AuditEventType.SETTING_CHANGES`) beside access and usage limit changes.

### Database Workbench

- **`components/workbench/engine/database/`** is a database's query workbench: query panels,
  their paired results panels and the columns panel, over the store in
  `stores/workbench/database/`, which builds each query's pixel (`buildQueryPixel`). The mode comes from
  the engine's category: SPARQL for RDF, SQL otherwise; the admin query page pins ADMIN_SQL for
  system databases.
- A SQL script runs one statement at a time, each committing on its own, and a script of several
  statements comes back as one tab per statement. On a relational database (category `SQL`)
  everyone who can query it, read-only users included, gets a Commit control in the editor's
  toolbar (`database-transaction-options.tsx`, with the fields checked by
  `database-run-options.ts`): Each statement, or One transaction, where every statement runs in
  one transaction that commits once, with an optional timeout in seconds for the whole script
  (`SqlQuery(..., transaction=[true], timeout=[N])`). Each statement still needs the access it
  needs on its own, which the backend checks. SPARQL and admin SQL never offer it. The chosen
  segment says which way the script runs, and each one's tooltip says what it means. Ctrl+Enter
  submits the same run options form as Run.
- A script run in one transaction (`parseTransactionResult`) marks its results with an icon to
  the left of the results title (`database-transaction-outcome-icon.tsx`, drawn by
  `database-results-header.tsx`), colored by the outcome. Hovering it reads Single transaction
  and the backend's message, such as how many statements were committed together, or that it was
  rolled back with no changes kept, or that the commit did not report back. The header can sit
  in a dock tab or a border bar, so the icon is not a control of its own; its label gives screen
  readers the same words. Each statement's tab panel shows its status, rows changed and, when it
  failed, its SQLState. A statement that returns rows shows them as a table, up to the
  query's limit, with "First N rows shown" when more were left out; a table from a statement
  that was then rolled back says its rows were read inside the rolled back transaction. Its
  tables have no CSV export, since export runs a statement again on its own, outside the
  transaction.

### SQL Query Policy Guardrail

- **`components/import/guardrail/sql-query-guardrail-form.tsx`** creates an `EMBEDDED_SQL_QUERY`
  guardrail. Each policy is a list of rules, a key and the access it requires
  (`sql-query-policy.ts`), edited by `sql-policy-rules-field.tsx` one row at a time
  (`sql-policy-rule-row.tsx`, with `sql-operation-select.tsx` for operation rules), and saved as
  the JSON object the guardrail reads.
- The five identifier lists start with the chosen dialect's built-in rules, read through
  `use-sql-policy-built-ins.ts` (`GetSqlQueryPolicyDefaults`, from `api/guardrails.ts`, the same
  lists the guardrail applies). A built-in rule shows its name, fixed, and its access can be
  changed; a removed one shows as a chip to add back. Changing the dialect swaps the built-in
  rules (`mergeBuiltInRules`): one both dialects have keeps its access, and stays out when it was
  removed, and the user's own rules stay. A save while the rules load is refused inline.
- `PROTECT_UNMATCHED_IDENTIFIERS` is always written as `true`, so the guardrail applies its
  built-in rules itself, below the configured ones. `toPolicyJson` therefore writes only a
  built-in rule whose access changed, and writes a removed one as an exemption
  (`"NAME":"FOLLOW_ENGINE_PERMISSIONS"`); built-in rules added in later releases still apply.
- The identifier lists start folded away, with a count of their rules and Expand all. A submit
  with problems opens every list that has one, and a folded list with problems says so.

### Jev Policy Guardrail

- **`components/import/guardrail/jev-policy-guardrail-form.tsx`** creates an
  `EMBEDDED_JEV_POLICY` guardrail: a Jev (TypeSafe) model answers a typed question about the text,
  and the answer blocks or allows the call. The judge is picked with the shared `EngineSelect`
  from the user's models whose subtype is `TYPESAFE` (its `engines`), each with its logo, name and
  id.
- `jev-policy-guardrail.ts` holds the schema and `toJevPolicyGuardrailDetails`. A yes or no
  question (`NOUL`) writes `VIOLATION_DIRECTION`; a choice question writes its choices, edited by
  `jev-policy-choices-field.tsx` one row at a time (`jev-policy-choice-row.tsx`), as
  `QUESTION_CRITERIA` (each name to its meaning) and `VIOLATION_CHOICES` (the names marked
  Blocks). A choice question needs a choice that blocks and one that allows. An empty timeout or
  blocked message is left out, so the guardrail uses its own default.
- A yes or no question asks for one number, the chance of a violation that blocks the call;
  `toViolationChanceSettings` writes it as `CONFIDENCE_THRESHOLD` and `LOW_CONFIDENCE_VERDICT`
  (at 50% or more, the chance as the threshold with `PASS`; under 50%, the threshold mirrored
  with `BLOCK`). A choice question asks for the confidence needed and its strictness: Strict
  (`BLOCK`) or Lenient (`PASS`) for a choice the judge is less sure of.
- The guardrail's logo is `TYPESAFE.png`, on its import card and, through `ENGINE_IMAGES` in
  `@semoss/shared`, on its catalog card.

### Model Router

- **`components/import/model/router-config-field.tsx`** edits a Model Router's `router.json`, in
  the model import form and on the router's settings page (`engine-router-settings.tsx`).
- Each route is a `features/model-router/router-route-card.tsx`: a header with its place, its
  name, its share of traffic in weighted mode, and Move Up, Move Down and Remove, over its name,
  destination model and the fields its routing method uses. A move that disables the pressed
  button moves focus to the other move button; removing a route moves focus to the name of the
  route that takes its place.
- Every model picker in the router is `features/model-router/router-engine-select.tsx`: the
  shared `EngineSelect` over the models the editor reads once (its `engines`), each with its
  logo, name and id. The role decides the models offered: only `TYPESAFE` models decide, and they
  never answer, classify by chat or embed.

### Engine fields in the import forms

- A field that picks another engine, such as a vector database's embeddings model or a
  guardrail's judge model, has `type: "engine"` and an `engineRule` (`engineTypes`, optional
  `metaFilters`) in its form's constants. The guardrail and vector forms render it with
  `components/import/shared/import-engine-select.tsx`, the shared `EngineSelect` over the user's
  engines of those types, each with its logo, name and id. The form keeps only the engine id;
  the picker remembers the chosen engine to show its name and logo.

### Engine Actions, Restart and Reload

The engine actions and the app reload call the SDK's `cloneEngine`, `restartEngine`
(`libs/sdk/src/api/engine.ts`) and `reloadApp` (`libs/sdk/src/api/app.ts`). The backend runs
restart and reload on every server in a cluster.

- **Actions menus.** `components/shared/actions-menu.tsx` is the header's Actions dropdown: it
  takes the actions the viewer has and is not shown when there are none. It opens when the mouse
  hovers over it, and on a click or from the keyboard; a click on a menu the hover opened keeps it
  open. A menu the hover opened leaves focus where it is, when it opens and when it closes; one a
  click or a key opened moves focus into it, and back to the button when it closes. Each menu
  lists its actions with the roles the backend lets run them:
  - `features/engine-actions/engine-actions-menu.tsx`, in the engine header
    (`engine-tabs-layout.tsx`): Clone, Export and Restart, all for owners.
  - `features/project-actions/project-actions-menu.tsx`, in the project header
    (`project-tabs-layout.tsx`): Clone for the project's owners and for anyone who can
    see a template (`project_is_template`), the backend's `userCanCloneProject`, and Export
    for the owners of an app type (`APP_SETTINGS_TYPES`), an agent or a skill, through
    `features/app-export/use-app-export.ts`, which the Import and Export section uses too.
- **`features/engine-export/`** exports an engine (`ExportEngine`) and downloads the zip
  (`use-engine-export.ts`), from the menu and from the Export section of Settings. An H2
  database asks whether to include its data: `export-engine-dialog.tsx` from the menu, a switch
  in the Settings section.
- **`features/engine-clone/`** is `clone-engine-dialog.tsx`: it asks for the clone's name,
  starting from the engine's name followed by "Copy", and clones it (`CloneEngine`) into a private
  engine the user owns, with a copy of its files, settings, metadata and image. Its access is not
  copied. A failed clone stays in the dialog; a clone opens the clone's page. The menu gives the
  dialog a new key each time it opens, so the name starts over.
- **`features/engine-restart/`** is `restart-engine-dialog.tsx`: it confirms, then closes the
  engine (`CloseEngine`), which stops the python process it owns, so its next use starts it with
  its current files.
- **`features/app-python-reload/`** is the Python card in the Python and Reactors section of an
  app's Settings (`pages/app/app-python-reactors-settings-page.tsx`). Reload Python Files
  (`ReloadProject`) clears the app modules python has cached, so the next run imports the current
  .py files without restarting python.

### Settings Tabs

Every engine and project Settings tab has the same view: a left menu of sections with the open
section beside it, in `components/catalog/catalog-settings-frame.tsx`. The frame sizes to its own
width (a container query), so on a narrow page or panel the menu becomes a scrolling row above the
section. Each kind lists its sections once, and the routes, the menu and the workbench panel all
read that list:

- Each list is written in the order the menu shows it: alphabetical by name, with Dangerous
  always last. Nothing sorts it at runtime, so a new section goes in its place by name, before
  Dangerous. The section tests check the order.
- **Engines** (`pages/engine/engine-settings-sections.tsx`): Description, Image and Tags for every
  type, Guardrails and Model Settings for a model, and Export and Dangerous for owners. Each
  section's `isAvailable` decides who has it. `buildEngineSettingsRoute` in `engine.routes.tsx`
  declares every section; `EngineSettingsLayout` shows the ones the viewer has on the engine.
- **Projects** (`pages/project/project-settings-sections.tsx`): Description, Image and Tags for
  every project type, agents, skills and notebooks included, Import and Export, Portal, and
  Python and Reactors for the owners of an app (`CODE`, `BLOCKS`, `AUTOMATION`, `INSIGHT`), and
  Dangerous for the owners of any project. `buildProjectSettingsRoute` declares every section;
  `ProjectSettingsLayout` shows the ones the viewer has and supplies the `SettingsContext` the
  app sections read.
- **Dangerous** holds the delete, `features/resource-delete/delete-resource-card.tsx`, which
  confirms with `DeleteEntityDialog` and goes back to the catalog after; the Access Control tab
  has no delete. `use-delete-resource.ts` picks the pixel from the type
  (`delete-request.ts`) and is shared with `SettingsTiles`, whose delete tile stays on the admin
  settings pages.
- **Every section card looks the same.** A `Card` whose `CardHeader` holds a plain `CardTitle`
  (no heading element inside it), a `CardDescription` and the card's actions in a `CardAction`
  with `self-center`. The header has `border-b` when the card has a `CardContent` below it, and
  none when the header is the whole card. Actions are `size="sm"` buttons with Title Case
  labels:
  - **Edits** (Description, Tags, Image, Model Settings, Prices, Guardrails, Routing): Discard
    (`outline`) and Save (`default`), shown only once there is something to save. While saving,
    both are disabled and Save shows a `Spinner` and "Saving...". An edit that spans the card,
    such as the image or guardrail form, makes the `Form` wrap the whole card, so the header's
    Save submits it.
  - **One-off actions** (Publish, Reload Python Files, Compile and Deploy, Update, Export, the
    automation import and exports): a leading icon that the `Spinner` replaces while it runs,
    with the label in its "...ing" form. A section has at most one `default` button; the rest
    are `outline`. Delete is the one `destructive` button, in Dangerous.
  - A failed read or save shows a destructive `Alert`, a read in progress a centered `Spinner`.
    Cards stacked in one section are `gap-4` apart.
- **App sections:** Portal shows
  the app's share link in this platform (`getAppShareUrl`, the link the Share dialog gives) and,
  once published, the portal Monolith serves, each a `components/settings/settings-link-field.tsx`
  with Copy and Open buttons. Python and Reactors has the Python card, then the app's reactors
  with Compile and Deploy, which compiles them on every server and reads the list again.
- On a page, `CatalogSettingsLayout` puts each section at its own path and opens the first one the
  viewer has; a path to any other section, or none, goes there, and a path below a section goes
  to the section. In a workbench panel, which has no routes, `CatalogSettingsPanel` keeps the open
  section in state (`ProjectSettingsPanel`, the Settings tab of `ProjectDetailTabs`).
- A new section goes in its kind's list, with the page that renders it.

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
