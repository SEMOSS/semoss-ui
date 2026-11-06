# AGENTS.md - @semoss/chat

This document provides context for AI coding assistants working with the SEMOSS chat UI library.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md); the [React standard](../../skills/react-standard.skill.md)
> owns general implementation, naming, imports, and validation rules. Standing up a new host is
> covered by the [chat host skill](../../skills/chat-host.skill.md).

## Overview

`@semoss/chat` is the chat UI every chat host shares: the room's conversation and composer, its
Workspace (a `@semoss/workbench` dock), room actions, the rooms list, agents, knowledge, prompts
and settings. It renders the SDK's room engine (`RoomEngine`, `RoomsClient` from `@semoss/sdk`) and
never talks to the backend on its own: rooms, messages, tools and agent runs are the engine's.
`@semoss/playground` and `@semoss/playground-desktop` are thin hosts over it.

It is source-only (no build step) and follows the `libs/connectors` package conventions. Entry
points:

| Import | What it is |
|--------|------------|
| `@semoss/chat` | The core: host contract, `ChatProvider`, the room UI store, room building blocks, views a host routes to |
| `@semoss/chat/connectors` | The Microsoft 365 and Google Workspace connectors glue, as a room integration |
| `@semoss/chat/panels` | `@semoss/panels`' file panels wired for a room's Workspace |
| `@semoss/chat/globals.css` | Makes Tailwind scan this package; every host imports it |

Inside the package, imports come from defining files (no internal barrels). Hosts use only the
entry points above.

## The boundary

What `@semoss/chat` owns, and what it refuses:

- **Owns** the React UI of a chat, and the room's *UI* state: `RoomUiStore` (`features/workbench/`),
  which extends the SDK's `RoomEngine` with the dock, the Workspace rail, and the host's
  integrations.
- **No transport.** Pixels and reactors live in the SDK (`chatPixels`, `RoomEngine`,
  `RoomsClient`) or, for page-level reads such as agents and knowledge, in the owning feature's
  `*.api.ts`, built on SDK primitives. Every room surface goes through the playground reactors
  (`CreatePlaygroundRoom`, `AskPlayground`, `GetPlaygroundMessages`, `AddPlaygroundToolExecution`,
  `GetPlaygroundRooms`).
- **No engine state.** Turns, streaming, tool calls, agent runs and context items are the
  engine's (`libs/sdk/src/stores/room/`, see [the SDK guide](../sdk/AGENTS.md) and the
  [sdk-chat skill](../../skills/sdk-chat.skill.md)).
- **No routing.** Nothing here imports `react-router`. Views take ids as props and send the user
  elsewhere through `ChatHostConfig.navigation`.
- **No branding.** Logos, CSS variables, banners, landing pages, titles and navigation items are
  the host's. Views take them as slots (`NewRoomView`'s `banner`, `background`, `welcome`;
  `AgentCatalogView`'s `illustration`; `RoomHeader`'s `leading`).
- **No file panels or connectors in the core.** The core never imports `@semoss/panels` or
  `@semoss/connectors` at runtime: file panels are host-injected (`panelComponents`,
  `filePanels`), and connectors sit behind `./connectors` (a host that skips it never compiles
  it). Check with `grep -rn "@semoss/panels\|@semoss/connectors\|connectors/" src --include=*.ts*`
  outside `src/connectors/`, tests and `src/testing/`.

Dependencies: `@semoss/{i18n,sdk,shared,ui,utility,workbench}`, `lexical`/`@lexical/react`,
`lucide-react`, `mermaid`; peers `react`, `react-dom`, `zustand`, and, optional,
`@semoss/connectors` (for `./connectors`) and `@semoss/panels` (for `./panels`); both are dev
dependencies for the tests.

## Structure

| Folder | Purpose |
|--------|---------|
| `host/` | The host contract: `chat-host-config.ts`, `chat.context.tsx` (`ChatProvider`, `useChat`), `chat-rooms-client.ts`, `room-integration.ts`, `preferences-adapter.ts` |
| `features/composer/` | `RoomComposer` (lexical editor, attachments, model and agent pickers, voice), its menus and indicators |
| `features/conversation/` | `RoomView`, `RoomContent`, `RoomLayout`, the slash commands, the next-message room, context items |
| `features/draft-room/` | `NewRoomView`: a new chat's draft room until its first message |
| `features/workbench/` | `RoomUiStore`, the Workspace (`RoomWorkbench`, `FittedRoomLayout`, the rail and panel menus), the room's own panels (`panels/`, `ROOM_PANEL_COMPONENTS`) |
| `features/room-header/`, `features/room-actions/` | The room header and the room actions (favorite, rename, publish, download, delete) |
| `features/chat-tools-ui/` | The Tools section of Settings and the chat tool card |
| `features/tool-views/`, `features/tool-inspector/` | `component://` tool views and the tool inspector |
| `features/suggestions/` | Follow-up suggestions |
| `features/rooms-list/`, `features/agents/`, `features/knowledge/`, `features/prompts/`, `features/settings/` | Page-level views and their parts |
| `components/` | `message/` renderers, `mcp/` (tools view, MCP overlay, agent selector), `lexical/` plugins, `file-preview/`, `RoomLink` |
| `contexts/`, `hooks/`, `utility/`, `types.ts` | `RoomProvider`, `FileDragProvider`, shared hooks and types |
| `connectors/` | The `./connectors` subpath |
| `panels/` | The `./panels` subpath |
| `testing/` | Test fakes and fixtures (`createTestHostConfig`, `TEST_PANEL_COMPONENTS`, `asObservableFake`) |

## The seams

### `ChatHostConfig` and `<ChatProvider>`

Everything a host tells the chat, supplied once. It wraps the SDK's `RoomEngineConfig` (how rooms
run) with what only a React host needs; every field is documented in `host/chat-host-config.ts`.

```tsx
const config: ChatHostConfig = {
	appName: "Playground",
	engine: { clientTools: [createChatFilesToolProvider({ labels: FOLDER_TOOL_LABELS })] },
	featureFlags: {},            // left-out flags keep DEFAULT_CHAT_FEATURE_FLAGS
	allowedFileTypes: [],
	allowedUrlPrefixes: [],
	gracefulErrors: [],
	panelComponents: { ...CHAT_FILE_PANEL_COMPONENTS, ...ROOM_PANEL_COMPONENTS }, // optional: no dock without it
	filePanels: CHAT_FILE_PANELS,          // from @semoss/chat/panels
	integrations: [createConnectorsIntegration()],
	preferences: createSessionStoragePreferences(),
	navigation: { onOpenRoom, getRoomHref, onNewRoom, onLeaveRoom, /* … */ },
	portalContainer: shadowRoot.host as HTMLElement, // overlays portal here
};

<ChatProvider config={config}>{/* routes */}</ChatProvider>;
```

`ChatProvider` makes the rooms client (`createChatRoomsClient`) when it mounts and initializes it;
keep the config's identity stable. It also wraps its children in `@semoss/ui`'s
`PortalContainerProvider`, so every menu, popover, dialog and tooltip portals into
`portalContainer`. `useChat()` returns `{ config, chat }`; the config's feature flags are already
merged with their defaults (`resolveChatHostConfig`).

- `panelComponents` absent: rooms keep a dock store (cheap), but no view renders the Workspace,
  its toggle or its panel menu, and the host never loads `@semoss/workbench`'s shell or any
  panel.
- `filePanels` absent: no Files on the rail, and `openFileSidebarPanel` / `openSidebarFileExplorer`
  return null.
- `slashCommands(room)`: the host's own `/` commands, after the chat's.
- `onOpenSettings(page)`: how "Manage connectors" and other settings links open the host's
  settings. Without it, `useOpenSettings` falls back to the chat's own `SettingsDialogProvider`
  when the host mounts one (with its `pages`, such as `CONNECTORS_SETTINGS_PAGE`); with neither,
  no settings link shows.

### `RoomIntegration`

A per-room UI integration (`host/room-integration.ts`). The host lists factories in
`config.integrations`; every `RoomUiStore` (the new-chat draft included) makes one of each, and the
core calls only what an integration has:

| Member | Where the core uses it |
|--------|------------------------|
| `prepareDraft()` | `NewRoomView` on mount (`room.prepareDraftIntegrations()`) |
| `adopt(draft)` | before a draft's first message (`room.adoptIntegrations(draft)`) |
| `restore({ isNew })` | each time the room is bound to its insight |
| `subscribe` + `getRailPanels()` + `ownsPanelType()` | the Workspace rail and Open a Panel menu; changes bump `room.integrationsVersion` |
| `isBusy()`, `getSuggestionContext()` | follow-up suggestions wait, and send the context |
| `getContextItemIcon(service)` | context chips in the composer |
| `ownsToolCall(call)`, `describeToolCall(call, state)` | the chat tool card's icon, source, approval note and `Notice` |
| `getToolViewSignIn(params)` | a `component://` view's sign in |
| `settingsPage` | the room header's Settings section |
| `ComposerNotice`, `SettingsSection` | above the composer; in the room's Settings panel |

```ts
const myIntegration: RoomIntegrationFactory = (room) => ({
	id: "notes",
	getRailPanels: () => [{ type: "room-notes", name: "Notes" }],
	ownsPanelType: (type) => type === "room-notes",
});
```

Find a room's integration with `toRoomUiStore(room).getIntegration<T>(id)`.

### Client tools and pending actions

Client-run tools are the SDK's `ClientToolProvider`s in `config.engine.clientTools`; agent-run
auto-decisions are `config.engine.onPendingAction`. See the
[sdk-chat skill](../../skills/sdk-chat.skill.md).

## Glossary

One name per part of a chat, in code, comments, tests, and these notes:

| Part | Name in code | Notes |
|---|---|---|
| A room's whole view | **room view** (`RoomView`, `NewRoomView`) | A host's route renders one |
| Messages and composer, the left column | **conversation** (`RoomContent`) | "Chat" is the chat *mode* and the narrow-screen tab label |
| The right-hand dock | **Workbench** (`RoomWorkbench`, `WorkbenchToggleButton`) | A `@semoss/workbench` dock, called **Workspace** in user-facing copy. `RoomUiStore` still calls it the sidebar (`room.sidebar`, `openSidebar*`, `room-sidebar.ts`): a legacy name kept on purpose |
| The layout holding both | **room layout** (`RoomLayout`, `FittedRoomLayout`, `RoomLayoutActionsContext`) | |
| The Workbench's left rail | **Workbench rail** | `@semoss/workbench`'s left border |
| An entry of Open a Panel | **Workbench panel** (`WorkbenchPanelOption`, `useWorkbenchPanels`, `WorkbenchPanelIcon`) | A room's own (`kind: "room"`) or an integration's (`kind: "integration"`) |
| The top row | **room header** (`RoomHeader`) | The host's `leading` slot, the room's name (`RoomTitle`), the More actions menu, and the Workbench toggle |
| Favorite, Rename, Publish, Download, Delete | **room actions** (`RoomActionsProvider`, `useRoomActionItems`) | `features/room-actions/` |
| A new chat before its first message | **new room** / **draft** (`newRoom`, `NewRoomWorkbenchPanels`, `NewRoomPanelRequest`); once created lazily, **prepared room** | |
| Settings → Tools groups | **room tools** (`RoomToolsSection`, `RoomToolsDefaultSection`, `RoomToolsToolboxesSection`, and integrations' `SettingsSection`s) | |
| The room's own folder | **Room Files** | The Files panel shows it |

Ids and i18n keys tied to user-facing copy keep "workspace": the slash group `workspace`, the
`close-workspace` command, and `room:studio.workspace` / `workspacePlaces.*`.

## The room Workspace

The right-hand panel is called **Workspace** in user-facing copy and is a `@semoss/workbench`
dock. These details are not obvious from the code and are easy to undo by accident:

- **The dock store belongs to `RoomUiStore`, not to `<Workbench>`.** Tools open panels from
  outside React and while the Workspace is closed, and the arrangement has to survive closing it —
  which unmounts the shell. The store builds the dock and restores its arrangement in its
  constructor; `<WorkbenchProvider store={room.workbench}>` only hands it down.
- **Blueprints are handed over, not registered later.** The host's `panelComponents` (the room's
  own `ROOM_PANEL_COMPONENTS`, plus file panels and integration viewers) reach the store through
  `ChatHostConfig`; the blueprints import the store, so the store cannot import them. They have to
  be in place before the first `openSidebarPanel`, which for a streaming tool is long before
  anything mounts — without them the dock falls back to a shallow compare of config, and since a
  file panel's `mode` is a fresh object per call, every open would spawn another tab. A host's
  explorer blueprint is closable (`canClose: true`): closing the last tab is how the Workspace
  closes.
- **`RoomWorkbench` uses the room's stable `sidebarSnapshot`.** Each room builds its own from
  `createRoomSidebarLayout`; a prepared room adopts the draft's arrangement through
  `restoreSidebarLayout` before its first mount. The shell must use the same snapshot reference so
  mounting it does not reset tabs opened since initialization. The arrangement belongs to the room
  instance and is never persisted between sessions, so switching rooms cannot bleed panel state.
- **A restored file panel is re-pointed at the room's live insight.** A room binds to a fresh
  insight on every load, and a file panel's `mode.insightId` is what its reads and saves run
  against. `syncSidebarFileMode` rewrites them once, before anything mounts.
- **The Workspace has a left rail, collapsed.** `createRoomSidebarLayout` docks Files (when the
  host has file panels) and Settings on the left border with nothing open, and `syncSidebarRail`
  adds an entry for each panel the room's integrations offer (`getRailPanels`, re-read whenever an
  integration notifies) and removes one an integration no longer offers (`ownsPanelType`), without
  opening the rail or taking the selection. Rail panels cannot be closed. A new chat's draft is
  built with `includeFiles: false`, since it has no insight for Files to read; the room it
  prepares adds Files in `restoreSidebarLayout`. Opening a panel goes through `selectPanel`, which
  expands its rail entry rather than adding a tab. The Workspace closes itself only when a close
  leaves no tab in the main area and no rail panel open.
- **The Workspace opens as wide as its content.** While nothing is open in its main area,
  `useWorkbenchFitWidth` gives `RoomLayout` the rail's width, plus the open rail panel's, and the
  pane resizes to it; a tab in the main area makes it fill its default share. `FittedRoomLayout`
  fills (`shouldFill`) while a new chat shows a preparation error.
- **The room header holds the Workspace's panels.** More actions runs in sections: Workspace
  (Open a Panel — Files, Settings, Activity, then the integrations' panels — and Close Workspace
  while it is open), Room (the room actions), and Settings (each integration's `settingsPage`,
  opened through `useOpenSettings`). Every panel's `onOpen` also calls
  `RoomLayoutActionsContext.revealWorkbench`. Each panel has one short label, the same in the menu,
  its tab, and the slash menu. A host without `panelComponents` gets no Workspace section and no
  toggle.

New chats keep draft settings in their temporary room. Opening Settings shows them without
creating a server room. Files, the activity log, and integration panels share `useNewRoom` to
prepare one room lazily and transfer the draft's arrangement before opening their panels; a failed
preparation opens the Workspace on its error, whose Retry opens the same panel again. Viewers queue
attachments on the draft through `NextMessageRoomProvider` until the first message.
`DraftSettingsContext` keeps Settings and publishing bound to the draft until submission.

A draft's mode is the user's choice from the composer menu (`featureFlags.enableAgentHarness`),
unless `featureFlags.modeFollowsAgent` is on: then the agent picker decides it (a saved agent or
Default Agent runs in agent mode, No Agent in chat mode), and the menu offers no Chat/Agent choice
(`canChooseAgentMode`). A room keeps the mode it was created with.

## Chat tools

The engine owns a room's default file tools (`RoomEngine.chatTools`, the SDK's
`stores/room/chat-tools/`); this package owns their UI (`features/chat-tools-ui/`):

- **Room Files is the only file space.** Uploads, connector downloads, and everything the room's
  apps and the default tools read and write. Its Add to Context action (the host's
  `filePanels.ExplorerHostProvider`) queues on `useNextMessageRoom() ?? room`, so files picked from
  a prepared new room appear in the new chat's composer.
- **A chat gets default tools; an agent brings its own.** In chat mode every message carries the
  `folder_*` tools the browser runs in Room Files. Settings sets each to Auto, Ask, or Disabled
  (room option `defaultTools`). Agent runs bring the harness's own tools.
- **Chat turns send client tools in `paramValues.tools`, twice** — on `AskPlayground` and on every
  `AddPlaygroundToolExecution`; leaving them off a save drops them mid-task (engine invariant).
- **Room tools that ask need the chat tool card.** `isChatToolCall(room, call)` is true for folder
  calls and for calls an integration owns (`ownsToolCall`); `ToolsView` and the inline tool area
  render `ChatToolCard` for them. In a chat room Allow and Deny go to `room.chatTools`; an allowed
  integration call runs through `ResponseMessageStore.runMcpToolCall`. In an agent room they go to
  `decideAgentToolAction`, since the paused run resumes on the decision.
- **Never send `DeleteInsightAssets` an empty path** (it clears the whole space). The room folder
  refuses its root and hides and refuses its `mcp` folder.

## Slash menu

`/` in the composer lists every action (`features/conversation/use-room-slash-commands.tsx`), by
group: Chat (attach, knowledge, tools, agent, mode, compact), Workspace (the panels that can open
now, and Close Workspace), Room (`useRoomActionItems`, inside `RoomActionsProvider`), Prompts, then
the host's `slashCommands(room)`. It matches the query against each command's id, label and
keywords. `excludeCommandIds` removes commands by id.

## Tool views

`features/tool-views/` draws tool calls whose `SMSS_MCP_UI.resourceURI` is
`component://<library>/<view>` with the host's `toolViewLibraries` (the playground passes
`@semoss/connectors`' mail and calendar views), in the page and never in a frame. `RoomView` mounts
`ToolViewProvider` around the conversation and the Workspace.

- **Routing.** A work folder or integration call gets its `ChatToolCard`; a `component://` view the
  host's libraries draw, `ComponentToolView`; then `system://` apps, portal pages, and the default
  form. A call whose view fails shows the card it would have without one.
- **Decisions** (`tool-view-decisions.ts`). In an agent run they decide the run's pending action;
  in chat, approving runs the edited call through the room's toolbox.
- **The host** (`use-room-tool-view-host.ts`). Saves land in Room Files and add to the next message
  (`useRoomFileHost`); signing in goes through the integration whose view it is
  (`getToolViewSignIn`).

## Files queued for the next message

`RoomEngine.contextItems` (the SDK's `ContextItemsStore`) holds the files queued for the room's
next message, each already in Room Files. `ContextItems` shows them as chips in the composer, each
marked by the integration that produced it (`getContextItemIcon`). `askMessage` sends them as
`media` and puts them back when the send fails. A new chat queues on its draft through
`NextMessageRoomProvider`, and the room it creates adopts the queue before its first message.

## The `./connectors` subpath

`src/connectors/` connects Microsoft 365 and Google Workspace. A host wires it in five places:

```ts
import {
	CONNECTOR_PANEL_COMPONENTS,
	CONNECTORS_SETTINGS_PAGE,
	createConnectorToolProvider,
	createConnectorsIntegration,
} from "@semoss/chat/connectors";
// config.engine.clientTools: [..., createConnectorToolProvider()]
// config.panelComponents:    { ..., ...CONNECTOR_PANEL_COMPONENTS }
// config.toolViewLibraries:  CONNECTOR_TOOL_VIEW_LIBRARIES
// config.integrations:       [createConnectorsIntegration()]
// <SettingsDialogProvider pages={[CONNECTORS_SETTINGS_PAGE]}>
```

A room's connector state is `getRoomConnectors(room)` (`ConnectorsStore`). These details are easy
to break:

- **Connectors are the user's, copied into each room.** The user's connector tools live in their
  own `mcp/playground_connector_mcp.json` (stamped `SMSS_MCP_GENERATOR: PlaygroundConnectors`);
  each room holds a copy in its `mcp/pixel_mcp.json` (`syncRoomConnectorTools`). The integration's
  `adopt` makes it before a new room's first message, `restore` brings it up to date whenever a
  room loads, and the composer notice's `useUserConnectorsSync` applies a save from the settings
  page straight away. The copy replaces only the room's connector tools. Only a *missing* file
  counts as empty, never a failed read.
- **The connector viewers come from `@semoss/connectors`.** `CONNECTOR_PANEL_COMPONENTS` mounts each
  as a Workspace panel (`CONNECTOR_PANEL_TYPES`) with `showHeader={false}`; the viewers save into
  Room Files and add to context through `useRoomConnectorHost` (the core's `useRoomFileHost` plus a
  sign in).
- **A viewer shows once its connector is on** for the chat and its account is signed in
  (`ConnectorsStore.availableSources`, offered as the integration's rail panels).
- **A chat says when its connectors cannot run** (`ConnectorSignInNotice`, the integration's
  `ComposerNotice`): missing sign ins, providers the server does not offer, and connectors the
  server's sign in cannot cover (`connectorAccess` in `/api/config`). A connector call that fails
  for want of a sign in offers one in its card (`describeToolCall` → `ConnectorToolSignIn`).
- **The SDK owns the session's logins.** No login state or cache here: `useLogins()` reads
  `Session.logins`; signing in goes through `Session.logins.connect`. See
  [the SDK guide](../sdk/AGENTS.md#session-logins).

## Agent forms and catalog

The agent views render the same shared components as the client: `AgentNewView` and
`AgentEditView` put `AgentForm` under a sticky Cancel/Create or Save header, and `AgentDetailView`
renders `AgentDefinition`. The chat keeps no agent field or resource list of its own; change the
shared component instead. The edit view seeds `AgentForm` once per agent, because the form reads its
values only on mount: a refetch must not overwrite unsaved edits, and a different agent remounts it
through `key`. The edit and detail views turn the escaped line breaks `GetWorkspace` returns in the
instructions back into newlines. A failed save shows inline and the form keeps its values for a
retry. Creation reads `GetAgentFormOptions` for deployment catalogs and submits the full
configuration through `createAgent` (`features/agents/agents.api.ts`); a failed follow-up settings
save still opens the created agent and shows its warning, avoiding duplicate creation. The catalog
filters by access and sorts; card permissions use the backend's effective `permission`, including
group grants. Agent links come from `getAgentLinks` (`utility/mcp-utils.ts`): platform links only
when `featureFlags.showPlatformLinks` is on and the host gives `platformUrl`, and subagents link to
the host's `navigation.getAgentHref`.

## Public surface (intentional exports)

Hosts import only these; anything else is internal and may move. Inside the package, import
from defining files. `src/package-boundaries.test.ts` fails if the core imports connectors, file
panels, a router, or its own entry points.

- **`@semoss/chat`** (`src/index.ts`): the host contract (`ChatHostConfig` and its parts,
  `ChatProvider`, `useChat`, `createChatRoomsClient`, `resolveChatHostConfig`,
  `DEFAULT_CHAT_FEATURE_FLAGS`, `chatSettingsFromTheme`, `createSessionStoragePreferences`,
  `RoomIntegration*` types); the room UI store and contexts (`RoomUiStore`, `toRoomUiStore`,
  `ROOM_PANEL_TYPES`, `RoomProvider`/`useRoom`, `FileDragProvider`/`useFileDrag`,
  `NextMessageRoomProvider`, `RoomActionsProvider`, `useGracefulErrors`); building blocks
  (`RoomComposer`, `RoomContent`, `RoomLayout`, `FittedRoomLayout`, `RoomWorkbench`,
  `ROOM_PANEL_COMPONENTS`, `RoomHeader`, `InputMessage`, `ResponseMessage`, `ToolsView`,
  `MCPOverlay`, `AgentSelector`, `RoomLink`, `LanguageDirection`, `SlashCommand` types,
  `FOLDER_TOOL_LABELS`); rooms lists and actions (`useRoomsQuery`, `DownloadConversationDialog`,
  `renameRoom`, `toggleRoomFavorite`, `useWorkspaceNavigation`, `WorkspaceNavigationContext`);
  settings (`SettingsDialog`, `SettingsDialogProvider`, `useSettingsDialog`, `useOpenSettings`,
  `ChatSettingsPage`); the views (`RoomView`, `NewRoomView`, `RoomsListView`,
  `AgentCatalogView`, `AgentDetailView`, `AgentEditView`, `AgentNewView`, `KnowledgeView`,
  `KnowledgeDetailView`); shared types (`App`, `Engine`, `Instructions`, `MCPTool`,
  `ToolStructure`, `Workspace`).
- **`@semoss/chat/connectors`**: `createConnectorsIntegration`, `CONNECTOR_PANEL_COMPONENTS`,
  `CONNECTOR_PANEL_TYPES`, `CONNECTOR_SOURCES`, `CONNECTOR_TOOL_VIEW_LIBRARIES`,
  `CONNECTORS_SETTINGS_PAGE`, `ConnectorsSettingsView`, `createConnectorToolProvider`,
  `getRoomConnectors`, `CONNECTORS_INTEGRATION_ID`, `CONNECTORS_SETTINGS_PAGE_ID`.
- **`@semoss/chat/panels`**: `CHAT_FILE_PANELS` (for `filePanels`) and
  `CHAT_FILE_PANEL_COMPONENTS` (the file panels, explorer closable). Needs `@semoss/panels`.

## Translations

The chat's strings are `chatResources` from `@semoss/i18n` (`locales/<lng>/chat/`, plus the core
and shared namespaces it reads); every host loads them. Add a string to all seven locales.

## Collaboration cross-check (2.7)

`packages/collaboration/src/features/rooms/` implements rooms and agent runs on the same playground
reactors without the engine. Gaps to close before it can adopt `@semoss/sdk`'s engine and this
package (recorded only; no collaboration changes were made):

- **Room mode.** It creates and lists rooms with `mode: "collaboration"`
  (`CreatePlaygroundRoom`, `GetPlaygroundRooms`). `chatPixels` already take `mode`, but
  `RoomEngineConfig` / `RoomsClient` have no `roomMode`, so the engine always creates and lists
  normal rooms.
- **Transport.** Its own `pixel()` / `callPixel` with zod schemas (`room-schemas.ts`) in place of
  `chatPixels` and the engine's parsing.
- **Room session.** Its own `room-session.ts` (an `Insight` per session, `SetRoomForInsight`,
  `insight.destroy()`) in place of the engine's `room-session.ts` (1 room = 1 insight, close =
  `RemoveUserRoom` + `DropInsight`).
- **Agent runs.** Its own `AgentTurnController` and registry over the SDK's `pollAgentRun`, in place
  of the engine's agent harness (one watcher per run, reconnection, pending actions).
- **Options, names, models, uploads.** Its own `GetRoomOptions` + `UpdateRoomOptions` merge, room
  name polling (`wait-for-generated-room-name.ts`), model memory (`last-model.ts`) and
  `uploadInsight` calls, where the engine has its options module, `autoNameRooms`,
  `RoomsClient.models` + `ChatPreferencesAdapter`, and room attachments.
- **Brain topics and threads** (`BrainLinkRoomThread`, `BrainListRoomTopics`, …) have no engine
  equivalent; they would become a `RoomIntegration`.
- **Composer.** Its own lexical composer and slash menu in place of `RoomComposer` (whose host
  `slashCommands` would carry its extra commands).

## Testing

```bash
pnpm --filter @semoss/chat test
pnpm --filter @semoss/chat check-types
pnpm exec biome check libs/chat
```

Tests run in jsdom with `vitest.setup.ts` (ResizeObserver and canvas stubs). Build a room with
`new RoomUiStore({ roomId, host: createTestHostConfig({ … }) })`; add `CHAT_FILE_PANELS` /
`TEST_PANEL_COMPONENTS` for the dock and `createConnectorsIntegration()` for connectors. A fake room
from `asObservableFake` needs `integrations: []`. Mock `../../host/chat.context` (`useChat`) to give
a component its `config`.
