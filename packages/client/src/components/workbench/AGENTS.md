# AGENTS.md - Workbench (client)

The SEMOSS-specific half of the workbench: the panels, the `<Domain>Workbench` components, and
the stores they hang off. The dock shell itself is **`@semoss/workbench`** (`libs/workbench`) —
read [its AGENTS.md](../../../../../libs/workbench/AGENTS.md) first. Everything about
blueprints, panel props, mount policy, chrome controls, commands, the drag protocol, layout
caching, and `readOnly` lives there and is not repeated here.

Covers `components/workbench/` (this folder), `components/assistant/`, and their paired state
in `stores/workbench/` and `stores/assistant/`.

> **Inherits from:** [../../../AGENTS.md](../../../AGENTS.md) (client) and
> [../../../../../AGENTS.md](../../../../../AGENTS.md) (root).

## What is here

One `<Domain>Workbench` component per engine type (database, function, model, storage, vector,
guardrail) and per project type (notebook, code, skill, agent), each mounting `<Workbench>`
from the package with its own blueprint map, default layout, and isolated store instance.

**BLOCKS is the last project type still on the legacy `components/workspace/` shell**
(`WorkspaceManager` + MobX `WorkspaceStore`). Until it migrates, don't delete
`components/workspace/`, `stores/workspace/`, or `components/app-workspace/` — the latter also
backs the standalone `/app/:appId/files` route. The settings admin query page mounts
`AdminQueryWorkbench` (`engine/database/admin-query-workbench.tsx`) — the database workbench
panels over a synthetic `EngineContext`, initialized in `ADMIN_SQL` mode so structure and
queries run the admin-permission pixels.

## Three stores, not one

`useWorkbench` reaches the dock (`layout` / `loading` / `command` / `control`). Two things that
used to be namespaces on it are now their own stores, each taking the workbench as an injected
dependency so the arrow points client -> dock and never back:

- **assistant** — `stores/assistant/`, read with `useAssistant(selector)`. A domain workbench
  calls `useAssistantStore()`, configures it in its own effect, and wraps its `<Workbench>` in
  `AssistantStoreProvider`. It is the agent harness (`@/api/rooms`, `runAgent`), which is
  exactly why it cannot live in the package.
- **access** — the session store's permission cache, read with `useAccess(type, id)`.

`stores/workbench/` keeps only what is genuinely SEMOSS: `WORKBENCH_COMPONENTS`, the database
domain store, and the model chat store. Its `index.ts` re-exports `@semoss/workbench` so the
existing `@/stores/workbench` imports keep resolving.

## Adding a panel

Follow the package's three steps. The client-specific parts:

1. Panel ids live in `WORKBENCH_COMPONENTS` (`stores/workbench/workbench.constants.ts`). Never
   use a raw string literal — and **never change an existing id's string value**, or
   `applySnapshot` will silently prune that panel out of every cached layout.
2. Shared instance records live in `WORKBENCH_PANEL_RECORDS`
   (`components/workbench/workbench.constants.ts`).

**Authorization is runtime state, never layout config.** Resource panels call
`useAccess(type, id)` directly in their body — it returns a discriminated union
(`"loading"` / `"error"` / `"ready"`), narrowing to `permission`/`readOnly` only once resolved.
Do not serialize `permission` or `readOnly` into a panel record, DB layout, or localStorage
snapshot. Backend authorization remains authoritative.

**The permission cache lives on the session store.** A permission is a fact about
(user, resource), so two workbenches open on the same project can never disagree about whether
it is editable. Two consequences: a domain workbench calls `refreshPermission` (not
`loadPermission`) on mount, because the shared entry would otherwise be as old as whenever some
other workbench last fetched it — the `refreshing` / `refreshError` fields keep the stale
permission readable meanwhile, so nothing flashes to read-only; and the session clears the
cache on logout, because it outlives every workbench and would otherwise hand one user's access
to the next.

## Domain state (database is the template)

Domain state gets a **dedicated store**, not a slice: `stores/workbench/database/
database-workbench.store.ts` exports `createDatabaseWorkbenchStore(deps)`. The domain
workbench creates it once and provides it through `DatabaseWorkbenchStoreProvider`; the flat
hook (`hooks/use-database-workbench.ts`) reads the nearest provider. Layout coupling is
explicit: paired panels carry
`config.sourcePanel`, titles derive reactively (custom `header` reading the workbench store),
and cleanup runs through the shell's `onPanelClose(pid, record)` prop.

`stores/workbench/model/model-chat.store.ts` is the second consumer and the simpler read:
one store, one panel tree, no layout coupling at all.

## The model workbench has no assistant

`engine/model/` is the one engine workbench that does **not** register
`ASSISTANT_PANEL`. Its main tab is `MODEL_CHAT_PANEL` — a plain streaming chat with
the engine itself, not an agent harness — with `MODEL_CHAT_SETTINGS_PANEL` and
`MODEL_CHAT_HISTORY_PANEL` on the right border, both collapsed by default. They are border
panels rather than views inside the chat precisely so the rail draws their toggles: a panel
gets at most one chrome control, and this needed two.

- **`AskRoom`**, not `RunAgent`. Turns go through `askRoom` in `api/rooms.ts`:
  `runPixelAsync` → poll `getPixelJobStreaming` → `getPixelAsyncResult`. Stopping is
  `StopPixelExecution` followed by `commitCancelledTurn`, or the user's message is orphaned
  in the room.
- **`CreateRoom`, not `CreatePlaygroundRoom`.** The playground variant forces the room into
  the playground system project, while `GetUserConversationRooms` scopes to the insight's
  context project — so rooms created that way never appear in the list. `createRoom` passes
  no project, which resolves the same way the list does.
- **The history list lives in the panel, not the store.** Paging, search, and sort are that
  one panel's view state; the store only owns the *active* conversation. The panel publishes
  a `refresh` function on its scratch `value` so its chrome control can pull the list —
  which is why that control has no spinner (see the control rules above).
- **`GetUserConversationRooms` orders by `DATE_CREATED` only.** It takes a direction, not a
  column, so the history offers newest/oldest and nothing else. **Sorting has to stay
  server-side** — the list is paged, so a client-side sort would only order the rows already
  fetched and rows would shuffle as pages arrive. A name sort needs a `sortBy` key on the
  reactor first; until then the option stays off the menu rather than shipping a sort that
  lies. It also returns no total, so "there may be more" is inferred from a page coming back
  full, which `useIteratorPixel` cannot express (it derives `hasMore` from a `getTotalCount`).
- **AskRoom takes no system prompt.** It reads the room's `instructions`, so
  `updateRoomOptions` has to land *before* the turn. Same for the room's `mcp` list — which
  this panel deliberately keeps empty, because MCP tools would make AskRoom return turns
  needing a client-side execution loop the panel does not run.
- **Attachments go to the insight space, gated permissively.** Files queue on the composer
  (drop, paperclip, or paste) and are uploaded with `uploadInsight(insightId, "", files)`
  only when the turn is sent, so a file the user queues and then removes never costs a
  request. The returned `fileLocation`s ride out as AskRoom's `image` param — the same one
  `AskPlayground` takes; `RunAgent` calls it `media`. The backend persists them as `MEDIA`
  parts, which is what makes them survive a reload. The composer offers attachments unless
  `GetModelMetadata` reports `attachment: false`: a **missing** flag means the provider never
  reported one, not "no", so gating on `attachment === true` would silently disable uploads
  on every engine whose metadata was never filled in. Gating on `inputModalities` is worse
  still — `FILE` never comes from the static catalog, so almost nothing would qualify. The
  drop target also has to ignore spawn drags (`isSpawnDrag`): the dock moves panels with
  native HTML5 drags too, and a tab crossing the composer must not look droppable.
- **Tools here means `built_in_tools`** — the provider-hosted ones from
  `GetModelBuiltinTools`, rendered by the shared `EngineBuiltinToolsField`. They ride on
  `paramValues`, which overrides the engine's saved selection only because the engine checks
  `!parameters.containsKey(...)`; sending `{}` is how the user turns them all off. Nothing
  here writes back to engine metadata. Temperature and max output tokens are deliberately
  **not** offered: they are engine-level metadata, and a per-conversation override here only
  duplicated what the engine already governs.
- **Rooms are scoped by `workbench: "model-chat:<engineId>"`** in the room options, because
  `GetUserConversationRooms` matches by LIKE over the serialized options. The prefix is what
  keeps these rooms out of assistant history.

## File map

| File/folder | Role |
|---|---|
| `workbench.constants.ts` | Re-exports `WORKBENCH_COMPONENTS`; defines `WORKBENCH_PANEL_RECORDS` (shared instance records) |
| `engine/`, `engine/<domain>/` | Engine-scoped panels + one `<Domain>Workbench` per engine type |
| `project/`, `project/<domain>/` | Project-scoped (`APP` mode) equivalents; sibling of `engine/`, **not** inside it |
| `files/`, `git/` | The file and git panels, shared by every domain workbench |
| `files/file-explorer-control.tsx` | The refresh + new-file chrome control shared by every file-explorer panel (project, engine, storage, insight) |
| `../assistant/` | The assistant panel and its subviews; `ASSISTANT_PANEL` is its blueprint |
| `stores/assistant/` | The assistant store (agent runs, rooms, notifications) |
| `stores/workbench/database/` | The database domain store (the dedicated-store template) |
| `stores/workbench/model/` | The model chat store — one store, one panel tree, no layout coupling |

## Rules

- **Engine vs project panels are not interchangeable**: `engine/` panels call `useEngine()` and
  run `*EngineAsset*` pixels; `project/` panels call `useProject()` and run `*AppAsset*`
  pixels. Reuse before building.
- **Relative imports inside this folder** — never import `@/components/workbench` (the barrel)
  from within it; that creates cycles. The dock comes from `@semoss/workbench`.
- **Panels that belong to every project type go in `project/`**, not in a `project/<domain>/`
  folder. A component that owns a command should register it itself via
  `useWorkbenchCommands` (see `project-publish-button.tsx`).

## Be cautious with

- `workbench.constants.ts` (both copies) — shared by every domain workbench, and its id
  strings are a storage contract.
- **The assistant blueprint is `mount: "eager"`** — it must initialize (and surface
  notifications) while its border is collapsed. Don't "optimize" it to lazy.
- **`dispose()` and `destroy()` on the assistant store are not the same teardown.** The panel
  calls `dispose()` on every insight change to drop that insight's run watchers; `destroy()`
  additionally detaches the browser-notification subscription and belongs to the store's
  lifetime, which `useAssistantStore` owns. Folding the two together silences notifications
  after the first insight switch.
- **The database close cascade** (`onPanelClose` → `handlePanelClosed`): closing a query panel
  closes its paired results panel and prunes store state. Re-read before changing panel
  close/select behavior.
- **`DatabaseWorkbenchMode` is three-valued** (`SQL | SPARQL | ADMIN_SQL`): `ADMIN_SQL` is
  always SQL-language but runs the admin-permission pixels and has no category fetch or CSV
  export. Gate query-language behavior on `mode !== "SPARQL"`, never `mode === "SQL"`, or the
  admin query page silently loses it.
