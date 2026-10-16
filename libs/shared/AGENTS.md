# AGENTS.md - @semoss/shared

This document provides context for AI coding assistants working with the SEMOSS shared
utilities and components library.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md); the [React standard](../../skills/react-standard.skill.md)
> owns general implementation, naming, imports, and validation rules.

## Overview

`@semoss/shared` holds the cross-application components, utilities, and types that more than
one app needs. **Check here first** for domain components, adapters, and types.
Generic functions belong in [@semoss/utility](../utility/AGENTS.md); consume their
category subpaths instead of duplicating them inside components.

It is the home of large shared building blocks such as the file explorer, the Monaco
editor wrappers, the FlexLayout wrapper, the shared login page, engine/MCP/prompt/skill UI,
forms, and the workbench primitives.

### The file explorer (`components/file/`)

State lives in `useFileExplorer(options)`, which returns one `FileExplorerApi`; `FileExplorer`,
`FileExplorerHeader`, `FileExplorerItem`, and the context menu are presentational consumers of
it. A host calls the hook, passes the result down as `explorer`, and drives the tree through
`explorer.commands` — a facade whose identity never changes, so it survives being handed to a
surface outside the explorer's React subtree. The whole api object is identity-stable for the
same reason; such a holder sees live behaviour but **not** live state, because it does not
re-render when the explorer does.

Three props are required with no fallback, so every consumer states its intent: `explorer`,
`header` (`null` for none), and `newFileOverlay` (`null` for a browse-only tree). Everything
mode-specific — capabilities and one Pixel per operation — lives in
`file-explorer.adapters.ts`; nothing else branches on `mode.type`.

**A host can bring its own source.** Pass `adapter` to `useFileExplorer` to browse something
other than an asset tree, such as a connector's drive: the adapter builds each listing's Pixel,
maps the output to `FileItem`s (`mapEntries(raw, path)` is handed the folder it listed, for a
source whose entries carry no path), and says what the source can do. A source keeps anything
its rows need in `FileItem.data`; `itemActions` adds the host's row button and context-menu
entries, `renderError` draws a failed listing the host's way, and `searchScope: false` hides the
scope choice for a search that always covers everything. `@semoss/connectors`' drive views are
built this way.

**Every row's menu has three ways in.** Right-click, the row's More actions button, and
Shift+F10 or the menu key on a focused row open the same menu, so the context-menu entries a
host adds through `itemActions` are reachable without a right-click: from the keyboard, and on
touch screens, where the button always shows. `tree.openContextMenu` takes the mouse or key
event and places the menu at the pointer, or under the focused element when there is none. The
keys act on the focused row, as in VS Code: `TreeViewItem` leaves focus on a row when it is
clicked and on a folder's chevron while its children load, so they act on the row last clicked.
The header's shortcuts tooltip points mouse users at right-click and the button, not the keys. A
row's state (selected, its menu open, a drop target) highlights the whole row, its icon or
chevron included, through `TreeViewItem`'s `rowClassName`.

`FileExplorer` is **not** deprecated — it is the shell `@semoss/panels`'
`FileExplorerPane` renders, and `libs/panels` is its main consumer.

### Tool views (`components/tool-view/`)

A tool names the view a call is drawn with in `_meta.SMSS_MCP_UI.resourceURI`. A
`component://<library>/<view>?<params>` URI names a React component the host draws in the page,
never in a frame; `system://` and portal paths stay pages. This folder is the contract between
the libraries that provide views and the hosts that draw them, and knows nothing about any one
library:

- `ToolViewProps` is what every view receives: the `call` (its reactor, arguments, result, and
  status), the URI's `params` (such as `intent` and `provider`, which configure the view and never
  carry data), the `mode` (`approval` while the call waits for the user, `result` otherwise), the
  decisions (`onApprove` with edited arguments, `onDecline`, and `onRespond`, which resolves the
  call with what the user did instead, without running it), and the `host`'s offers (sign in,
  save, add to context).
- A library exports a `ToolViewLibrary`, a plain map of views by name, usually lazy. A host passes
  the libraries it draws to `ToolViewProvider`, at module scope, and finds a call's view with
  `useToolView(uri)`, which returns null for a URI it does not draw.
- `ToolViewRenderer` draws a found view with a placeholder while its code loads and the host's
  fallback if it fails (`ToolViewBoundary`). A host shows its generic view for a `component://`
  URI it cannot draw (`isToolViewUri`).

`@semoss/connectors` provides the `mail` and `calendar` libraries; the playground draws them.

### Members (`components/members/`)

`MembersTable` lists a project's or engine's members and opens `AddMembersOverlay` to add more.
When the server can search the organization's Microsoft directory (`msGraphLookup` in
`/api/config`), the host passes `isDirectoryAvailable` and the dialog shows `UserSourceToggle`,
a choice between existing users and the whole organization. The dialog starts on existing
users and sends the choice as `msGraphLookup`. Without the prop it sends nothing and the
backend decides, which means the directory whenever the directory is available. A person picked
from the directory gets an account when their permission is saved. The table reads no config
itself: the client keeps `/api/config` in its own store, and the other apps read it through
`useInsight`.

`AddMembersOverlay` is the one dialog for adding people anywhere in the apps. For a project or
engine, pass `id` and `type`. To add people to something else, such as a team's members or
managers, pass a `people` source instead: it loads the candidates, adds the people picked, and
can retitle the dialog and mark people who cannot be picked, by click or by Enter. With
`people`, the dialog picks people without access levels. When its `add` rejects, the dialog keeps
the people picked and stays open, and the host's list reloads when it closes, since some may have
been added. Add and Delete are disabled while their request runs. Reuse it rather than building
another people picker.

The add dialog and the members table's edit dialog are `sm:max-w-2xl` wide, as are the client's
team access dialogs (Give a Team Access, and giving a team access to a resource) and its usage
limit dialog, so the dialogs that give access, and the usage limit editor most of them hold, read
the same. The dialog primitive's own `sm:max-w-lg` wins over a plain `max-w-*`, so a dialog sets
its width with `sm:max-w-*`.

`MembersTable` is likewise the one members table. Teams use it for their members and managers by
passing a `source` that loads, removes and adds people (its `people` goes to the add dialog) and
can rename a member, for example to "Manager". With a `source` the table has no permission column
or edit dialog, and `readOnly` alone decides whether the viewer can change the list. A new
`source` reloads the list from the start with nothing selected, and a failed load shows its error
with Try Again. It marks the signed in user with a star either way. The table, its edit dialog
and the add dialog call the access levels Author (`OWNER`), Editor (`EDIT`) and Read-Only
(`READ_ONLY`).

**Showing a person: `PersonIdentity` is the default.** Every list, table, dropdown and picker
of people shows each person with `PersonIdentity` (`members/person-identity.tsx`), so people
look the same everywhere: `MemberAvatar` (their initial, or a star for the login the session is
signed in with, with their login's logo on a round badge at its corner, since two people can
share an id on different logins), their name, and under it `id: ...` and `email: ...`. It takes
one detail line for narrow lists (`isCompact`), something beside the name such as an admin badge
(`nameAddon`), and more lines under the details (`children`). It works out the star from the
login type and id with `useIsCurrentLogin()`, unless the host passes `isCurrentLogin`. It is
made of spans, so it can sit inside a button. Do not build another row, avatar or star for a
person; extend `PersonIdentity` instead. A summary that only stacks a few avatars, with no
names, is the one exception.

On a model, the members table's edit dialog and the add dialog set each person's usage limit
with `ModelUsageLimitEditor`, and the list shows it in one Usage Limit column, one rule per line
(`ModelUsageLimitRules`), wrapping rather than running into the next column. Only the model's
owners, and admins in admin mode, set usage limits: anyone else sees the limit read-only with
`OWNERS_ONLY_LIMIT_REASON` ("Only owners can set usage limits"). An editor can still change a
Read-Only or Editor member's level in the edit dialog, which sends the limit back as it is, and
the people an editor adds get no limit. Both dialogs disable the editor while they save, and read
whether the model has known prices with `useCostLimitsAvailable`. Only owners, and admins in admin
mode, take away the access of a member with a usage limit, since the limit goes with it: for
anyone else the list's Delete button and selection box are disabled on those rows, with
`OWNERS_END_LIMITED_ACCESS_REASON` ("Only owners can end or shorten the access of someone with a
usage limit") under the list.

`useIsCurrentLogin()` (`hooks/use-is-current-login.ts`) checks a person's login type and id
against the account ids the SDK's `Logins` holds, reading them as they are so every row can call
it. A lone login logo, outside an avatar, gets `CurrentLoginStar` (`components/current-login-star.tsx`)
at its corner. The members table also stars its host's `currentUserId` when the login type is not
known, and keeps a Login Type column with `LoginTypeLabel` (`components/login-type-label.tsx`):
the login's logo or icon (`LoginTypeIcon`; a person for native logins, a key for API logins) and
its name from `getLoginTypeName`. Show a login's name that way rather than the stored label, such
as `API_USER`.

### Model usage limits (`components/model-usage-limit/`)

Every place a model usage limit is set or shown uses these, so limits read the same everywhere:

- `ModelUsageLimitEditor` edits one limit: No Limit Defined (with what applies instead, or the
  host's `notDefinedHint`), Unlimited, or Rules. Each rule (`ModelUsageRuleRow`) has an amount, a
  measure (Tokens, Cost in US dollars, Compute Time), a window from minute to year and, for a team
  or public use, Shared or For Each Member / For Each Person. Each select gives its `SelectValue`
  the chosen option's label. Whole amounts are written with ASCII digits and comma separators
  (`toLocaleString("en-US")`) whatever the browser's locale, so they read back as typed. A minute or hour window has a length
  input beside it, so the rule reads "Every [10] Minutes": 1 to 59 minutes or 1 to 24 hours,
  starting at 1, put back in range when the input is left, and sent as `windowLength` only when
  it is more than 1. Every rule has its own amount: a team's shared rule caps the team together,
  and a for each member rule caps each member with a fixed amount.
  Cost is disabled with "This model has no known prices" unless `isCostAvailable`; a limit across
  all models always offers it, with a note on models without prices. Cost is typed in dollars and
  sent in millionths. The editor is uncontrolled: it starts from `defaultValue`, calls `onChange`
  after each edit, and starts again when its key changes. `readOnlyReason` shows the limit
  without letting it change; hosts on a model pass `OWNERS_ONLY_LIMIT_REASON` to anyone but its
  owners. `disabled` disables every control (the fieldset) and keeps what is typed; every host
  that saves passes it while saving. A rule's problem, such as no amount yet or a length out of range,
  shows with its field marked invalid only once the host sets `shouldShowProblems`, so a limit
  just opened or a rule just added is not red; from then on the problems follow the edits, and
  with no rules the hint to add one turns red. Warnings and notes show from the start.
- `source` (`ModelUsageLimitSource`: `DIRECT`, `TEAM`, `PUBLIC`, `MODEL_TOTAL`, `ALL_MODELS`,
  `PLATFORM`, `TEAM_TOTAL`) decides the counts offered and whether Unlimited is: a total and the
  platform default have none.
- `findModelUsageLimitProblem` says why a limit cannot be saved. Hosts keep Save enabled (except
  while saving) and check it when Save is pressed: on a problem they do not save, set the
  editor's `shouldShowProblems`, and call `focusFirstProblem()` through its `ref`
  (`ModelUsageLimitEditorHandle`), which moves focus to the first field marked invalid, or to
  Add Rule when there are no rules. They clear `shouldShowProblems` whenever the dialog or form
  opens again, is reset or is saved. `checkModelUsageLimitRules` gives each rule's problem and
  its window warning (a rule a tighter one leaves nothing to stop). Both are in
  `model-usage-limit-checks.ts`, with `findWindowLengthProblem`. Windows of different lengths are
  different windows: a limit has at most one rule per measure, window, length and counts
  (`getRuleSlotKey`), and the warning compares how long each window really spans
  (`getWindowMinutes`), so every 30 minutes is shorter than an hour and every 24 hours is as long
  as a day.
- Every rule of a limit applies, so the UI says so: `ModelUsageLimitRules` shows a limit's rules
  one per line, each after the first starting with "and" (spans, so it fits inside a button),
  the one-line summary joins rules with "and", and the editor says every rule applies and puts
  an "and" between its rows. The limits UI never says "room", since calls run in chat rooms.
- `model-usage-limit-format.ts` holds the one-line summary, `describeModelUsageLimit`, and the
  amounts, comparisons (`isSameModelUsageLimit`) and `toExplicitUsageLimit`, which turns no limit
  defined into an empty limit for endpoints that keep the current limit when none is sent. A
  window of length 1 reads "100,000 tokens a minute"; a longer one reads "100,000 tokens every 10
  minutes" or "every 6 hours" (`describeWindow`).
- `UsageLimitPathView` shows how limits apply to one person on a model, from the SDK's
  `UsageLimitPath`: the ceilings, then each source in order, each rule with a usage bar and when it
  resets in the browser's time zone. The step a call stops at is highlighted; the steps that do
  not apply are faded with the reason. `usage-limit-labels.ts` names the sources and states, and
  `describeBilledTo` says which limit applies to a person's calls. The UI calls the source a call
  stops at "Limit Applied By", and names the sources Direct Limit, Team Limit (with the team's
  name, such as "Ops Team Limit"), Public Use Limit, User's Total Model Limit and General Platform
  Limit; the ceilings are the Model Total and the Team Total. A step with more than one rule says
  "Every rule applies." and puts "and" between its rule meters (`usage-limit-step-row.tsx`). A
  step whose rules the backend hides (`rulesHidden`, someone else's User's Total Model Limit or
  General Platform Limit outside admin mode) says "Only admins can see this limit's rules"; a
  team step may come without its team total. `usage-limit-labels.ts` also holds
  `OWNERS_ONLY_LIMIT_REASON`.
- `usage-limit-rule-meter.tsx` and the client's My Model Usage dashboard share one definition of
  how full a rule is, in `model-usage-limit-format.ts`: `ALMOST_REACHED_SHARE` (0.9),
  `getUsageShareStatus` and its words `USAGE_SHARE_STATUS_LABELS` (Used Up, Almost Reached), and
  `getUsedPercent`, which rounds a rule not used up down so it never reads 100%.
- `UsageLimitGuide` is How Usage Limits Work: the rules every limit follows, with no values from
  the deployment. Its sections are How a Limit Is Picked (the ceilings, then the five sources in
  the order they are tried, each with what it covers, who sets it and where, and when it is
  skipped), No Limit Defined, Unlimited and Rules, What Rules Count, Team Limits, Who Sets Each
  Limit, Common Setups and See It for One Person. How a Limit Is Picked always starts open, with
  the host's `section`. Given a `viewer` (`canSetModelLimits`, `isAdminMode`), it marks the limits
  the viewer can set with "You can set this" and says what they can set; left out, nothing is
  marked. `isOwnView` is for someone reading their own limits: it leaves out Common Setups and
  points to Your Usage Limit and My Profile. `UsageLimitGuideSheet` shows it in a side
  sheet, and `UsageLimitGuideButton` ("How Usage Limits Work", with a help icon) opens that sheet;
  every place a limit is set or shown puts the button beside it, with the section that matters
  there. Every word of the guide is in `usage-limit-guide-content.ts`, in English. The order of
  `USAGE_LIMIT_CEILINGS` and `USAGE_LIMIT_ORDER` is the order the backend checks limits in
  (`ModelUsageLimitResolver.resolve` in Semoss), and `CEILINGS_INTRO` and
  `LIMIT_APPLIED_BY_INTRO` are also the path view's section intros, so the guide and a person's
  path explain limits the same way.
- The editor's own words are in the `members` namespace, under `usageLimit`; the summaries,
  checks, path view and guide are in English.

### The file editors are gone (`components/file/file-*.tsx`)

`FileEditor` and the six viewers it dispatched to — `file-code-editor`,
`file-download-view`, `file-html-editor`, `file-image-viewer`,
`file-markdown-editor`, `file-notebook`, `file-pdf-viewer` — have been deleted.
They were superseded by the panels in [`@semoss/panels`](../panels/AGENTS.md),
which do the same reading, saving and downloading through one shared pair of
hooks (`useFilePanel`, `useFileBuffer`). Open a file panel, or build on those
hooks the way `packages/terminal` does. Do not reintroduce a bespoke editor
here.

`components/notebook/` was never part of that island and stays:
`FileNotebookView` renders `Notebook` directly.

## Build System

`@semoss/shared` is **source-only** — it has no bundler and no `dist/`. Its `package.json`
`exports` point directly at `src/`, so consuming apps compile the TypeScript themselves. There
is intentionally **no `build` script**; keep the source type-clean and Biome-clean.

Key `exports`:

| Import | Resolves to |
|--------|-------------|
| `@semoss/shared` | `src/index.ts` (main barrel) |
| `@semoss/shared/globals.css` | `src/styles/globals.css` |
| `@semoss/shared/flexlayout.css` | `src/components/flex-layout/flexlayout.css` |
| `@semoss/shared/assets/img/*` | `src/assets/img/*` |

`sideEffects` is limited to `**/*.css`; consuming bundlers can tree-shake unused code.

## Structure

This library retains its package layout (no `pages/` or router):

| Folder / file | Purpose |
|---------------|---------|
| `assets/` | Images and static files. `assets/img/connectors/` holds each Microsoft 365 and Google Workspace app's logo as an SVG named by app (`outlook.svg`, `gmail.svg`, ...), except Teams, which is `assets/img/MS_TEAMS.svg`; `ConnectorBrandIcon` shows them, and any package can import them as `@semoss/shared/assets/img/connectors/*` |
| `components/` | Shared components, one folder per feature (file, monaco, flex-layout, mcp, prompts, skills, settings, engine, form, members, …) |
| `constants/` | Shared constant values |
| `contexts/` | React contexts (`<name>.context.tsx`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `styles/` | `globals.css` (Tailwind source discovery) and other global CSS |
| `types.ts` | Shared TypeScript types |
| `workbench/` | Workbench primitives shared across apps |
| `index.ts` | Public package entry point |

## Key Dependencies

- `@semoss/sdk`, `@semoss/ui`, `@semoss/i18n`, `@semoss/utility` — workspace libs
- `monaco-editor` / `@monaco-editor/react` — code editor
- `flexlayout-react` — dockable layout
- `echarts` — charts
- `@iconify/react`, `lucide-react` — icons

## Design-System Notes

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md).

- Shared domain components still compose `@semoss/ui/next`; this package is not a second
   component library or token source.
- Promote a composite here only when more than one application needs the same domain contract.
   Application-specific composition stays in its owning package.
- `src/styles/globals.css` supplies Tailwind source discovery only. Do not add design tokens
   there; token ownership remains in `@semoss/ui`.
- `flex-layout/flexlayout.css` is a third-party style bridge. Map its variables to semantic UI
   tokens and use the reason-bearing external-constraint carve-out for unavoidable literals.

## Agent Guardrails

### Do Not Modify

- **`exports` paths in `package.json`** — the `globals.css` / `flexlayout.css` subpaths
  are imported by name across the monorepo; renaming a file requires updating the export.

### Be Cautious With

- **Public entry points and legacy barrels** — preserve the manifest's supported exports
   and compatibility with untouched consumers; follow the React skill's
   [export policy](../../skills/react-standard.skill.md#architecture-and-exports).
- **`src/styles/globals.css`** — source discovery affects styles generated by consuming apps;
   design tokens belong to `@semoss/ui`.

### When Adding Shared Code

1. Put shared code in the matching library folder using the
   [React standard](../../skills/react-standard.skill.md).
2. Expose intentionally public symbols through `src/index.ts`. There is no supported
   `@semoss/shared/api` subpath; use the SDK's public API for backend transport.
3. Because this package is source-only, verify it compiles from a consumer:
   ```bash
   pnpm --filter @semoss/client type-check
   ```

### Testing Changes

```bash
pnpm check                          # Biome lint/format
pnpm --filter @semoss/client type-check   # Compiles shared from a consumer
```
