# AGENTS.md - @semoss/playground

This document provides context for AI coding assistants working with the SEMOSS Playground application.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md)
> and [SDK chat skill](../../skills/sdk-chat.skill.md) for room work.

## Overview

`@semoss/playground` is the SEMOSS chat application. It is private (not published), with
room, message, workspace, knowledge, and MCP surfaces.

## Structure & Conventions

The existing app uses `components/`, `contexts/`, `stores/`, `hooks/`, and `pages/`.
Follow the React skill's [architecture policy](../../skills/react-standard.skill.md#architecture-and-exports)
for new features and imports; existing feature folders are not an implicit migration task.
New features live in `src/features/<feature>/`; a feature imports another feature, or anything
outside its own folder, through `@/`. The playground has no `api` folder, and none should be
added: backend calls apps share live in `libs/sdk/src/api/` (for example `runMcpTool` and
`makeUserPixelMcp` in `mcp.ts`), and asset pixels come from the file explorer adapter in
`@semoss/shared` (`getFileExplorerAdapter`). A room's own tool file is read and written by
`stores/room/room-tool-file.ts`.

## Build System

- **Bundler**: Vite 8
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest with jsdom

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port 5174 |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:ui` | Run tests with Vitest UI |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm type-check` | TypeScript type checking |

Run these from `packages/playground`, or use `pnpm --filter @semoss/playground <command>`.

## Environment Variables

### `.env` (Development Defaults)

```bash
# Server proxy configuration
ENDPOINT=http://localhost:9090    # Backend server URL
MODULE=/Monolith                   # Deployed instance path

# Platform
VITE_PLATFORM_URL="../../client/dist"

# Theming
VITE_NAME="Playground"
VITE_THEME="{}"

# Model configuration
VITE_DEFAUlT_MODEL_ID=""
VITE_DEFAUlT_MODEL_NAME=""
```

### Environment File Precedence

Highest to lowest priority for development: existing process environment,
`.env.development.local`, `.env.development`, `.env.local`, then `.env`.
Mode-specific files are optional; never edit local override files as part of repository work.

## Vite Configuration

### Proxy Setup

The dev server proxies API requests to the backend:

```typescript
server: {
  port: 5174,
  proxy: {
    [MODULE]: {
      target: ENDPOINT,
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### Path Aliases

- `@/` → `./src/` (e.g., `import { foo } from "@/components/foo"`)

## Testing Configuration

### Vitest Setup

- **Environment**: jsdom
- **Pool**: vmForks (for isolation)
- **Timeout**: 10 seconds
- **Setup file**: `vitest.setup.ts`

The setup file includes:
- `@testing-library/jest-dom` matchers
- Canvas mock for components using `<canvas>`

### Coverage

Coverage reports output to `./coverage/packages/playground/` and include only `src/components/`.

## Workspace Dependencies

```json
{
  "@semoss/connectors": "workspace:*",
  "@semoss/i18n": "workspace:*",
  "@semoss/panels": "workspace:*",
  "@semoss/sdk": "workspace:*",
  "@semoss/shared": "workspace:*",
  "@semoss/ui": "workspace:*",
  "@semoss/utility": "workspace:*",
  "@semoss/workbench": "workspace:*"
}
```

Source-only libraries are compiled by the app. Built libraries need their build/watch
process running; use the root `pnpm dev:playground` command for dependency orchestration.

## Glossary

One name per part of the playground, in code, comments, tests, and these notes:

| Part | Name in code | Notes |
|---|---|---|
| A room's whole route | **room page** (`RoomPage`, `NewRoomPage`) | |
| Messages and composer, the left column | **conversation** (`RoomContent`) | "Chat" is the chat *mode* and the narrow-screen tab label |
| The right-hand dock | **Workbench** (`RoomWorkbench`, `WorkbenchToggleButton`) | A `@semoss/workbench` dock, called **Workspace** in user-facing copy. `RoomStore` still calls it the sidebar (`room.sidebar`, `openSidebar*`, `stores/room/room-sidebar.ts`): a legacy name kept on purpose |
| The layout holding both | **room layout** (`RoomLayout`, `FittedRoomLayout`, `RoomLayoutActionsContext`) | |
| The Workbench's left rail | **Workbench rail** | `@semoss/workbench`'s left border; the More actions menu leads it |
| An entry of Open a Panel | **Workbench panel** (`WorkbenchPanelOption`, `useWorkbenchPanels`, `WorkbenchPanelIcon`) | |
| The top row | **room header** (`RoomHeader`) | The room's name (`RoomTitle`) and the Workbench toggle |
| The rail's ⋯ menu | **More actions menu** (`RoomActionsMenu`) | First on the Workbench rail; above the mobile tabs on a narrow screen |
| A room's name, double-click to rename | **room name** (`RoomName`, `RoomNameField`) | `features/room-name/`; the same in the sidebar (global-nav) and the header |
| Favorite, Rename, Publish, Download, Delete | **room actions** (`RoomActionsProvider`, `useRoomActionItems`) | `features/room-actions/` |
| A new chat before its first message | **new room** (`newRoom`, `NewRoomWorkbenchPanels`, `NewRoomPanelRequest`); once created lazily, **prepared room** | |
| Settings → Tools groups | **room tools** (`RoomToolsSection`, `RoomToolsDefaultSection`, `RoomToolsConnectorsSection`, `RoomToolsToolboxesSection`) | Default, Connectors, Agent and Toolboxes |
| The room's own folder | **Room Files** | The Files panel shows it |

Ids and i18n keys tied to user-facing copy keep "workspace": the slash group `workspace`, the
`close-workspace` command, and `room:studio.workspace` / `workspacePlaces.*`.

## Navigation

The global navigation (`GlobalNav`) is an offcanvas `Sidebar`: collapsed, it is hidden
completely. It starts open (the theme's `sidebar.expandedByDefault` defaults to true), and
Cmd/Ctrl+B toggles it; it has no edge rail. While it is open, its own header holds
the toggle (`NavigationToggle`) on every route. While it is hidden, a `NavigationButton` opens
it: on a route with its own header (the room and new-chat pages register one with
`PageHeaderContext`), inline before the room's name; elsewhere floating, with `MainLayout`
padding the page for it. On mobile, the button opens the sheet. Opening the Workspace folds
the navigation without changing the saved preference (`useWorkspaceNavigation`).

## The room Workspace

The right-hand panel is called **Workspace** in user-facing copy and is a `@semoss/workbench` dock. These details are not obvious from the
code and are easy to undo by accident:

- **The dock store belongs to `RoomStore`, not to `<Workbench>`.** Tools open panels from outside
  React and while the sidebar is closed, and the arrangement has to survive closing it — which
  unmounts the shell. `RoomStore` builds the store and restores its arrangement in its
  constructor; `<WorkbenchProvider store={room.workbench}>` only hands it down.
- **Blueprints are handed to `RoomStore`, not registered later.** They reach into `@/components`,
  which imports `@/stores`, so the store cannot import them without closing a module cycle. The
  composition root passes them instead: `MainLayout` → `ChatStore` → `RoomStore`, plus the two
  places that build a room directly (`new-room-page`). They have
  to be in place before the first `openSidebarPanel`, which for a streaming tool is long before
  anything mounts — without them the dock falls back to a shallow compare of config, and since a
  file panel's `mode` is a fresh object per call, every open would spawn another tab.
- **`RoomWorkbench` uses the room's stable `sidebarSnapshot`.** Each new room builds its own from
  `createRoomSidebarLayout`; a prepared room adopts the draft's arrangement through
  `restoreSidebarLayout` before its first sidebar mount. The shell must use the same snapshot
  reference so mounting it does not reset tabs opened since initialization. The arrangement is
  owned by the room instance and is not persisted between room sessions.
- **A restored file panel is re-pointed at the room's live insight.** A room binds to a fresh
  insight on every load, and a file panel's `mode.insightId` is what its reads and saves run
  against. `_syncSidebarFileMode` rewrites them once, before anything mounts.
- **The Workspace has a left rail, collapsed.** `createRoomSidebarLayout` docks Files and
  Settings on the left border with nothing open, and `RoomStore._syncSidebarRail` (a reaction on
  `ConnectorsStore.availableSources`) adds a rail entry for each connector viewer the chat can
  show and removes one it can no longer show, without opening the rail or taking the selection.
  Rail panels cannot be closed. A new chat's draft is built with `includeFiles: false`, since it
  has no insight for Files to read; the room it prepares adds Files in `restoreSidebarLayout`.
  Opening a panel (`openSidebarFileExplorer`, `openRoomSettings`, `openSourcePanel`) goes
  through `selectPanel`, which expands its rail entry rather than adding a tab. The Workspace
  closes itself only when a close leaves no tab in the main area and no rail panel open.
- **The Workspace opens as wide as its content.** While nothing is open in its main area,
  `useWorkbenchFitWidth` gives `RoomLayout` the rail's width, plus the open rail
  panel's when there is one (`getWorkbenchFitWidth`, from the dock's state), and the pane resizes
  to it as the content changes. A tab in the main area makes it fill its default share. Once the
  user drags the divider, the pane keeps their size for as long as the page is mounted. The room
  page and the new-chat page read it through `FittedRoomLayout`, which fills (`shouldFill`) while the new chat shows a
  preparation error.
- **Dragging the divider to the right edge closes the Workspace.** `RoomLayout`'s
  `onWorkbenchCollapse`, which `FittedRoomLayout` points at `room.closeSidebar()`, closes it, and
  it reopens fitted to its content again. The conversation does not collapse.
- **The Workspace has no top strip.** `RoomWorkbench` passes the workbench one border slot, the
  More actions menu (`features/workbench/room-actions-menu.tsx`) at the start of its left rail
  (`borderSlots.left.before`), so its tab row is its top edge. The mobile layout has no rails, so
  there the menu is `top.before` with `mobileTopBorder="toolbar"`, above the tabs. The menu shows
  only while the Workspace is open. A new chat hands `RoomWorkbench` its `NewRoomWorkbenchPanels`,
  so a panel opened from the rail prepares the room (and its insight) as the toggle does. The header's last icon toggles it (`WorkbenchToggleButton`, which
  opens it as it was left and brings it forward behind the narrow Chat tab), and Close Workspace
  is also in the slash menu (not the More actions menu); Publish
  as Agent is in the Room section of the More actions menu and the slash menu (`RoomActionsProvider`
  renders a controlled `SaveWorkspaceDialog`), so a new chat publishes only once it is a room.
  The per-panel control — "open inline" — is registered by the tool panel with
  `useWorkbenchControl`.
- **The room header holds the room's name.** `features/room-header/room-header.tsx` is
  one narrow row in `RoomLayout`'s `header` slot. It floats over the top of the
  conversation with no border, blurring what scrolls beneath it once the conversation reports
  it has scrolled (`ConversationScrollContext`), so an open Workspace takes the full height beside it;
  on narrow screens with the Workspace open it sits above both panes. At its start a room's name (`RoomTitle`, which renders `RoomName`); its actions (Favorite, Rename, Publish,
  Download, Delete, listed once by `useRoomActionItems` in `features/room-actions/`) end the More actions menu
  (`RoomActionMenuItems`, which leaves out Rename); global-nav shares their favorite and rename helpers (`toggleRoomFavorite`,
  `renameRoom`). Rename is no menu item: a double-click on the name edits it in place, in the
  header and in the sidebar (where F2 on a row does too), and `/rename` in the slash menu starts it
  through `RoomActionsProvider.startRenaming`. A new chat has no title and no Room section. While the navigation is hidden it
  also holds the button that opens it (`NavigationButton`, before the name): it registers with
  `PageHeaderContext`, so `MainLayout` drops its floating button and its top padding.
- **The header has no quick icons.** `features/room-header/room-header.tsx` ends the
  header with the Workspace toggle alone. More actions runs in sections: Workspace (Open a Panel,
  a submenu of every panel: Files, Settings, Activity, and the connector viewers the chat can
  show, `ConnectorsStore.availableSources`), Room, and
  Settings (Connectors, the settings dialog's Connectors page). A panel opens the Workspace on
  it. `useWorkbenchPanels` builds the list for a
  room, or through `NewRoomWorkbenchPanels.onOpenPanel` for a new chat, and every panel's `onOpen` also calls
  `RoomLayoutActionsContext.revealWorkbench`. Each panel has a short label, the same in
  the More actions menu, its tab, and the slash menu. There is no
  default panel in the main area: the toggle opens the Workspace on its rail.
- **The layout is not cached.** Each new `RoomStore` starts from `createRoomSidebarLayout`,
  so switching rooms cannot bleed panel state between room instances.

New chats keep draft settings in their temporary room store. Opening Settings shows them
without creating a server room. Settings
uses the same workbench shell as Files. Files, the activity log, and connector viewers share `useNewRoom` to prepare one room lazily
and transfer the draft's arrangement before opening their panels; a failed preparation opens the Workspace on its error, whose Retry opens the same panel again. Connector viewers queue
attachments on the draft through `NextMessageRoomProvider` until the first message. `DraftSettingsContext` keeps Settings and publishing
bound to the current draft until submission, including after preparation. A draft's Settings
leave out the room's own toolbox until its first message. Selecting Chat clears agent
inheritance but preserves locally added Knowledge and Tools.

A draft's mode is the user's choice from the composer menu (the `enableAgentHarness` theme flag),
unless the theme's `modeFollowsAgent` flag is on. Then the agent picker decides it: a saved agent
or Default Agent runs in agent mode, and No Agent runs in chat mode, so picking No Agent is how
Default Agent is removed. The menu shows no Chat and Agent choice and the `/agent-harness`
command is left out (`canChooseAgentMode`, `features/conversation/agent-mode-choice.ts`). The
new chat page turns the flag on by passing `onDefaultAgentChange` to `RoomInput` and the draft
Settings form; with it, `MCPOverlay` and `AgentSelector` offer No Agent and Default Agent as
separate choices. A room keeps the mode it was created with.

Whatever the theme, a chat in agent mode with no saved agent runs Default Agent, and the input
shows a Default Agent chip beside the add button: editable in a new chat, where it opens the
agent picker and the menu's agent item reads "Agent: Default Agent", and read-only in an
existing room.

Panel ids and the sidebar's default layout live in `stores/room/room-sidebar.ts`; the room's own
blueprints live in `components/room/panels/`, and a feature's (the connector viewers) live in its
folder. `room-panel.components.ts` registers them all. Changing a panel type string
affects only the current room instance.

## Chat tools

`src/features/chat-tools/` gives a chat its default file tools and the Tools section of Settings.
`RoomStore.chatTools` (`ChatToolsStore`) owns them per room. These details are easy to break:

- **Room Files is the only file space.** It is the room's own folder: uploads, connector
  downloads, and everything the room's apps (MCP tools) and the default tools read and write. Files in
  the room header opens the file explorer on it. Its Add to Context action uses
  `FileExplorerHostProvider` and queues on `useNextMessageRoom() ?? room`, so files selected from
  a prepared new room appear in the new chat's composer and transfer before its first message.
- **A chat gets default tools; an agent brings its own.** In chat mode every message carries the
  default tools, the `folder_*` tools the browser runs in Room Files (`tools/default-tools.ts`).
  Room Settings sets each to Auto, Ask, or Disabled (room option `defaultTools`; reads are Auto
  and changes Ask unless set); a disabled tool is not sent. The option is saved with the room's
  other options as the next message starts (`RoomStore.updateRoomOptions` skips a save the
  backend already holds); the backend only stores it. Agent runs bring the harness's
  own file, shell, and code tools and work in Room Files, so no folder tools go with them.
- **Default tools run in the browser.** `ChatToolsStore.runChatTool` runs each call against Chat
  Files through the insight asset pixels (`folders/room-folder.ts`), so the mode the user
  picked holds however the model asks.
- **Chat turns send the tools in `paramValues.tools`, twice.** `AskPlayground` carries them, and so
  does every `AddPlaygroundToolExecution` (`tool-save-controller.ts`): the model's follow up call
  only re-adds the room's own tools, so leaving them off drops them mid-task. The model's calls
  come back with no `_meta`; `ToolStore.json` gets it from `ChatToolsStore.decorateToolCall`, and
  `runToolExecution` hands folder calls to `ChatToolsStore.runChatTool` instead of `RunMCPTool`.
- **Settings shows what the assistant has.** Its Tools section (`RoomOptionsForm`) has Add
  Tools beside its heading, then up to four groups that all work the same way
  (`RoomToolsSection`: a collapsible header with an info tooltip in place of a description, the
  number of rows, and any actions, over one bordered list). Every tool is the same row
  (`ChatToolRow`: title, opening to its definition and parameters, with a fixed-width mode column
  at the end); group rows (`ToolGroupRow`) keep an action slot so counts line up, and loading,
  error, and empty states are list rows in a `ToolList` (`ToolListStatus`). **Default** sets each default
  tool's mode in its rows' mode column, or notes that an agent room's runs bring their own. **Connectors** is the room's own
  toolbox (`RoomToolsConnectorsSection`, read from `mcp/pixel_mcp.json`, by connector service, with sign
  in notices and Manage Connectors, which opens the settings dialog). **Agent** and **Toolboxes**
  (`RoomToolsToolboxesSection`) list the agent's toolboxes and the ones the user added, each read with
  `GetMCPTools` the first time it opens (`useToolboxTools`); either is left out when empty, and the
  room's own toolbox entry is never listed there. Settings opens through
  `ChatToolsStore.openRoomSettings`; there is no separate Chat Tools panel.
- **Never send `DeleteInsightAssets` an empty path.** With no path it clears the whole space.
  `AssetFolderProvider` refuses to address its root for writes, moves, and deletes. The room
  folder also hides and refuses its `mcp` folder, where the room's tools are kept: rewriting it
  would switch the chat's tools and connectors off.
- **Room tools that ask need the chat tool card.** `GetMCPTools` cannot resolve the room toolbox,
  so the default tool form has no schema for them. `ToolsView` and the inline tool area render
  `ChatToolCard` for folder and connector calls instead (`isChatToolCall`). In a chat room its
  Allow and Deny go to `ChatToolsStore`, and an allowed connector call runs through
  `ResponseMessageStore.runMcpToolCall`, the same run and save the tool loop uses for every MCP
  tool. In an agent room a connector call's Allow and every Deny go to `decideAgentToolAction`
  instead, since the paused run resumes on the decision.

## Slash menu

`/` in the composer lists every action (`features/conversation/use-room-slash-commands.tsx`), by
group: Chat (attach, knowledge, tools, agent, mode, compact), Workspace (each of
`useWorkbenchPanels`' panels that can open now, its connector viewers, and Close Workspace), Room
(`useRoomActionItems`, inside `RoomActionsProvider`, which wraps the room page), and Prompts (the room's predefined prompts). It
matches the query against each command's id, label, and keywords, which keep the old command
names. `excludeCommandIds` still removes commands by id, as the room page does for mode changes.

## Tool views

`src/features/tool-views/` draws tool calls whose `SMSS_MCP_UI.resourceURI` is
`component://<library>/<view>`, with the views `@semoss/connectors` provides
(`TOOL_VIEW_LIBRARIES`: `mail` and `calendar`), in the page and never in a frame. The room page
mounts `ToolViewProvider` around the conversation workspace, so the conversation and the sidebar
both find them.

- **Routing.** `ToolsView` and `ResponseMessageTool` give a call, in order: work folder calls
  their `ChatToolCard`; a `component://` view the playground draws, `ComponentToolView`; then
  `system://` apps, portal pages, and the default form. A `component://` URI is never turned into
  a portal URL, and its project or engine is not looked up. A call whose view the playground does
  not draw, or whose view fails, shows the card it would have without one.
- **Where.** In the conversation an approval sizes to its form and a result is kept to a bounded
  height; in the sidebar the view fills its tab. Once a decision is made the view shows the result,
  even before an agent run's next update, so a call is not decided twice. The room page provides
  the room (`RoomProvider`) to the conversation as well as the sidebar, since a view saves into
  the room's files. Connector calls that ask open inline, as their cards do.
- **Decisions** (`tool-view-decisions.ts`). In an agent run they decide the run's pending
  action: approve (`submit`, an edit when the arguments changed), reject, or `respond` with what
  the user did instead. In chat, approving sets the call's parameters to the edited arguments and
  runs it through the room's toolbox, declining goes through `ChatToolsStore.declineChatTool`, and
  responding saves the outcome as the call's result, which hands it to the model.
- **The call** (`tool-view-call.ts`). The view gets the reactor (`SMSS_FUNCTION_NAME`), the
  arguments, the result (a failed call's details, without the model's guidance,
  `readToolResponseDetail`), and whether the call waits for the user.
- **The host** (`use-room-tool-view-host.ts`). Saves land in Room Files and add to the next
  message through `useRoomConnectorHost`, signing in to the account the URI's `provider` names.

## Files queued for the next message

`RoomStore.contextItems` (`ContextItemsStore`, `features/conversation/context-items.store.ts`)
holds the files queued for the room's next message, each already in Room Files: a connector viewer
saved it there, or the user picked it in Room Files. `ContextItems` shows them as chips in the
input. `RoomStore.askMessage` sends them as `media` with the next message the user sends, and puts
them back on the queue when the send fails. The new-chat page queues on its draft through
`NextMessageRoomProvider` (`next-message-room.context.tsx`), and the room it creates takes the
queue with `ContextItemsStore.adopt` before its first message.

## Connectors

`src/features/connectors/` connects Microsoft 365 and Google Workspace.
`RoomStore.connectors` (`ConnectorsStore`) owns the services switched on and the accounts they
sign in with, per room. The Connectors page of the settings dialog
(`features/settings/`, opened from the user menu, from Connectors in the Workbench rail's More actions menu, or
anywhere with `useSettingsDialog().openSettings("connectors")`) connects accounts and switches the
user's apps on or off for all their chats; it is the only place connectors are switched. An app switched on whose
account is not connected shows its switch in gray with a warning mark. These details are easy to break:

- **Connectors are the user's, copied into each room.** The user's connector tools live in their
  own asset folder, `mcp/playground_connector_mcp.json`, written with `MakeUserPixelMCP` and
  stamped `SMSS_MCP_GENERATOR: PlaygroundConnectors`. The settings Connectors page edits that one
  file, so a change reaches all the user's chats, new and existing, and the UI says so. Each room
  holds a copy in its own `mcp/pixel_mcp.json` (`syncRoomConnectorTools`):
  `ConnectorsStore.adopt` makes it before a new room's first message, `restore` brings it up to
  date whenever a room loads, and the open chat takes a save straight away:
  `writeUserConnectorTools` tells `subscribeUserConnectorTools` listeners, and
  `useUserConnectorsSync` in the room input hands the tools to
  `ConnectorsStore.applyUserConnectorTools`. The copy replaces only the room's connector tools
  (the stamped ones, and legacy ones found by reactor) and keeps every other tool. A user with no
  file yet has chosen nothing, so their rooms keep the connectors they have; only a file that is
  missing counts as empty, never a read that failed. The first sign in to a provider on the
  settings page switches on every app its sign in covers (`enableServices`, only once the file
  has been read, so it never overwrites choices it has not seen); reconnecting leaves the user's
  choices alone. An app's switch works before its account is connected: switching it on signs
  in from the click and then switches on that app alone, and the switch goes back off when the
  sign in does not finish. A provider the server does not offer stays grayed out, its Sign In
  and its switches disabled. The catalog and each tool's approval policy live in
  `connector.catalog.ts`; sending, deleting, sharing, and invites always ask. Outlook and Gmail
  offer the same mail operations, and the two calendars the same calendar operations
  (`MAIL_OPERATIONS`, `CALENDAR_OPERATIONS`, each named by its reactor prefix). Those reactors
  declare their own view (`declaresView`), so their tools are written with only
  `SMSS_MCP_EXECUTION` and keep the `SMSS_MCP_UI` the backend gives them; every other tool is
  written with an inline view when it asks and a sidebar view when it does not.
- **The connector viewers come from `@semoss/connectors`.** OneDrive, Teams channels, files, and
  chats, Google Drive and Docs, and one mailbox and one calendar view for both accounts are its
  viewers (`libs/connectors/`). The room mounts each as a sidebar panel
  (`components/connector-viewer-panels.tsx`) with `showHeader={false}`, since its tab already names
  it; the Outlook and Gmail panels both render `MailboxView`, and the two calendar panels
  `CalendarAgendaView`, each with its `provider`. The tab, the More actions menu, and context chips show the app's logo from the source's `brand`
  (`sources/connector-sources.ts`); a panel opened with `{ brand }` in its config shows that logo
  instead and gets a tab of its own (`components/connector-panel-icon.tsx`), so one viewer can
  stand for more than one app. The room wires each viewer with
  `sources/use-room-connector-host.ts`: saves land at the top of chat files, and Add to context
  also queues the file in `RoomStore.contextItems`.
- **A viewer shows once its connector is on.** The More actions menu and the slash menu
  list `ConnectorsStore.availableSources` with the Workspace's panels (the plus menu does not): a viewer needs its connector switched
  on for the chat (`requires` in `sources/connector-sources.ts`) and its account signed in.
- **A chat says when its connectors cannot run.** Inside the input box, `ConnectorSignInNotice`
  lists every account the chat's switched on connectors need but the session is not signed in to
  (`ConnectorsStore.missingSignIns`, read again whenever the window regains focus), with a Sign In
  button. It also names accounts this server does not offer (`unofferedProviders`) and
  connectors this server's sign in cannot cover (`uncoveredConnectors`). Coverage comes from
  `connectorAccess` in `/api/config`: the server judges it from the scopes each sign in asks for
  (`ConnectorScopeAccess` in Semoss) and sends only whether each app can work, and only to a user
  signed in to the platform, so the scopes never reach the page. `connector-access.ts`
  reads it by each service's `accessKey`, and a service the sign in cannot cover cannot be
  switched on. The session can also list an account whose token has lapsed, so a connector call
  that fails with the login required error offers a sign in in its own card (`isSignInFailure`).
- **The SDK owns the session's logins.** Playground keeps no login state or cache of its own:
  `useLogins()` from `@semoss/sdk/react` reads the SDK's `Session.logins`, shared by the whole page, and
  reads again when a view mounts or the window regains focus. `useConnectorLogins` hands it to
  `ConnectorsStore.setSessionLogins`, and `useConnections` reads it for the Connectors page. Signing
  in goes through `signInToProvider` (`connector-sign-in.ts`), which calls
  `Session.logins.connect`: a fresh sign in that never signs out the session's own login. See
  [the SDK guide](../../libs/sdk/AGENTS.md#session-logins).
- **Connector files are pixel calls, not session state.** `connector-tools.ts` reads the user's
  connector file with the file explorer adapter's asset pixels, writes it with the SDK's
  `makeUserPixelMcp`, and keeps each room's copy through `stores/room/room-tool-file.ts`. It holds
  no login code.

## Design-System Notes

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md). The playground is an operational chat application, not a
visual sandbox; use the [root skills](../../skills/README.md) for UI behavior and validation.

## Agent Guardrails

### Do Not Modify

- **`.env.local`** / **`.env.*.local`** - Local developer overrides (gitignored)
- **Proxy target URLs** in committed `.env` - May contain sensitive endpoints
- **`ACCESS_KEY`** / **`SECRET_KEY`** - Credentials (only in local env files)

### Be Cautious With

- **`vite.config.ts`** - Affects dev server, build, and test configuration
- **Proxy configuration** - Changes affect how API requests are routed
- **`vitest.setup.ts`** - Changes affect all tests

### When Adding Features

Follow the [React standard](../../skills/react-standard.skill.md) for new-feature layout,
direct internal imports, state ownership, and tests. Preserve the room sidebar contracts above.

### Testing Changes

```bash
pnpm test           # Run tests
pnpm type-check     # Verify TypeScript
pnpm dev            # Manual testing
```

### Running with Backend

To connect to a local SEMOSS backend:

1. Start the backend on port 9090 (or update `ENDPOINT` in `.env.local`)
2. Run `pnpm dev`
3. Access at http://localhost:5174


### Agent forms and catalog

The agent pages render the same shared components as the client: the create and edit pages
put `AgentForm` under a sticky Cancel/Create or Save header, and the detail page renders
`AgentDefinition`. Playground keeps no agent field or resource list of its own; change the
shared component instead. The edit page seeds `AgentForm` once per agent, because the form
reads its values only on mount: a refetch must not overwrite unsaved edits, and a different
agent remounts it through `key`. The edit and detail pages turn the escaped line breaks
`GetWorkspace` returns in the instructions back into newlines. A failed save shows inline and the form keeps
its values for a retry. Creation reads
`GetAgentFormOptions` for deployment catalogs and submits the full configuration to
`ChatStore.createAgent`; a failed follow-up settings save still opens the created agent and
shows its warning, avoiding duplicate creation. The agent catalog keeps the existing card
actions and responsive grid while adding access filters and sorting. Card permissions use the
backend's effective `permission`, including group grants.

## Generic utilities

Import reusable helpers from `@semoss/utility/<category>`, a direct workspace dependency.
Follow the [utility guide](../../libs/utility/AGENTS.md). Keep domain policy and
UI behavior here, and preserve public compatibility adapters when moving helpers.
Date buckets, their order, and timestamp normalization come directly from
`@semoss/utility/date`. Keep sidebar translations and the favorites group here.
