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
  places that build a room directly (`new-room-page`, the new-file-explorer menu item). They have
  to be in place before the first `openSidebarPanel`, which for a streaming tool is long before
  anything mounts — without them the dock falls back to a shallow compare of config, and since a
  file panel's `mode` is a fresh object per call, every open would spawn another tab.
- **`RoomSidebar` uses the room's stable `sidebarSnapshot`.** New rooms start from
  `ROOM_SIDEBAR_LAYOUT`; a prepared room adopts the draft's arrangement through
  `restoreSidebarLayout` before its first sidebar mount. The shell must use the same snapshot
  reference so mounting it does not reset tabs opened since initialization. The arrangement is
  owned by the room instance and is not persisted between room sessions.
- **A restored file panel is re-pointed at the room's live insight.** A room binds to a fresh
  insight on every load, and a file panel's `mode.insightId` is what its reads and saves run
  against. `_syncSidebarFileMode` rewrites them once, before anything mounts.
- **Publish and close live in the workbench's top border end slot**, because they act on the work
  area. On mobile, the workbench places these controls in its actions drawer. The per-panel
  control — "open inline" — is registered by the tool panel with `useWorkbenchControl`.
- **File lives in the top border start slot.** `features/workbench/room-workbench-menus.tsx`
  translates the generic `WorkbenchMenus` labels from `sidebar.workbench` and uses `textSize="xs"`. Arrange Panels remains a submenu; a flat Workspace section offers Open File Explorer, Show Chat Tools
  (rooms only, since a draft's tools are not settled until its first message), View Activity Log,
  and Edit Settings. Playground disables the generic Navigate submenu. Forward the slot's `onNavigate` callback for mobile drawer dismissal.
- **The layout is not cached.** Each new `RoomStore` starts with the empty default arrangement,
  so switching rooms cannot bleed panel state between room instances.

New chats keep draft settings in their temporary room store. Opening Workspace restores its
last active tab, or opens a Settings tab when empty, without creating a server room. Settings
uses the same workbench shell as Files. File Explorer and connector viewers share `usePreparedRoom` to prepare one room lazily
and transfer the draft's arrangement before opening their panels. Connector viewers queue
attachments on the draft through `NextMessageRoomProvider` until the first message. `DraftSettingsContext` keeps Settings and publishing
bound to the current draft until submission, including after preparation. Draft menu overrides
keep room-only actions unavailable until preparation succeeds. Selecting Chat clears agent
inheritance but preserves locally added Knowledge and Tools.

Panel ids and the sidebar's default layout live in `stores/room/room-sidebar.ts`; the blueprints
live in `components/room/panels/`. Changing a panel type string affects only the current room
instance.

## Teamwork: default tools and connectors

`src/features/teamwork/` gives a chat its default file tools and connects Microsoft 365 and
Google Workspace.
`RoomStore.teamwork` (`TeamworkStore`) owns it per room. The Connectors page of the settings dialog
(`features/settings/`, opened from the user menu, or anywhere with
`useSettingsDialog().openSettings("connectors")`) connects accounts and switches the user's apps on
or off for all their chats; it is the only place connectors are switched. An app switched on whose
account is not connected shows its switch in gray with a warning mark. These details are easy to break:

- **Chat Files is the only file space.** It is the room's own folder: uploads, connector
  downloads, and everything the room's apps (MCP tools) and the default tools read and write. Show
  Chat Files in the plus menu opens the file explorer on it. Its Add to Context action uses
  `FileExplorerHostProvider` and queues on `useNextMessageRoom() ?? room`, so files selected from
  a prepared draft room appear in the draft composer and transfer before its first message.
- **A chat gets default tools; an agent brings its own.** In chat mode every message carries the
  default tools, the `folder_*` tools the browser runs in Chat Files (`tools/default-tools.ts`).
  Room Settings sets each to Auto, Ask, or Disabled (room option `defaultTools`; reads are Auto
  and changes Ask unless set); a disabled tool is not sent. The option is saved with the room's
  other options as the next message starts (`RoomStore.updateRoomOptions` skips a save the
  backend already holds); the backend only stores it. Agent runs bring the harness's
  own file, shell, and code tools and work in Chat Files, so no folder tools go with them.
- **Default tools run in the browser.** `TeamworkStore.runChatTool` runs each call against Chat
  Files through the insight asset pixels (`folders/room-folder.provider.ts`), so the mode the user
  picked holds however the model asks.
- **Chat turns send the tools in `paramValues.tools`, twice.** `AskPlayground` carries them, and so
  does every `AddPlaygroundToolExecution` (`tool-save-controller.ts`): the model's follow up call
  only re-adds the room's own tools, so leaving them off drops them mid-task. The model's calls
  come back with no `_meta`; `ToolStore.json` gets it from `TeamworkStore.decorateToolCall`, and
  `runToolExecution` hands folder calls to `TeamworkStore.runChatTool` instead of `RunMCPTool`.
- **Chat Tools shows what the assistant has.** The default tools are not in any toolbox, so
  `TeamworkToolsPanel` (Show Chat Tools in the workspace File menu) lists them from
  `TeamworkStore.chatToolDefinitions`, the exact definitions sent, or notes that an agent room's
  runs bring their own, beside the room toolbox's tools read from `mcp/pixel_mcp.json` and the
  toolboxes the user added. Each tool says whether it runs on its own or asks first, and opens to show its
  description and arguments.
- **Never send `DeleteInsightAssets` an empty path.** With no path it clears the whole space.
  `AssetFolderProvider` refuses to address its root for writes, moves, and deletes. The room
  folder also hides and refuses its `mcp` folder, where the room's tools are kept: rewriting it
  would switch the chat's tools and connectors off.
- **Connectors are the user's, copied into each room.** The user's connector tools live in their
  own asset folder, `mcp/playground_connector_mcp.json`, written with `MakeUserPixelMCP` and
  stamped `SMSS_MCP_GENERATOR: PlaygroundConnectors`. The settings Connectors page edits that one
  file, so a change reaches all the user's chats, new and existing, and the UI says so. Each room holds a copy in its own `mcp/pixel_mcp.json`
  (`syncRoomConnectorTools`): `TeamworkStore.adopt` makes it before a new room's first message,
  `restore` brings it up to date whenever a room loads, and the open chat takes a save straight
  away: `writeUserConnectorTools` tells `subscribeUserConnectorTools` listeners, and
  `useUserConnectorsSync` in the room input hands the tools to
  `TeamworkStore.applyUserConnectorTools`. The copy replaces only the room's connector tools (the stamped ones, and legacy
  ones found by reactor) and keeps every other tool. A user with no file yet has chosen nothing, so
  their rooms keep the connectors they have; only a file that is missing counts as empty, never a
  read that failed. The first sign in to a provider on the settings page switches on every app its
  sign in covers (`enableServices`, only once the file has been read, so it never overwrites
  choices it has not seen); reconnecting leaves the user's choices alone. The catalog and each tool's approval policy live in
  `connectors/connector.catalog.ts`; sending, deleting, sharing, and invites always ask.
- **Room tools that ask need the teamwork card.** `GetMCPTools` cannot resolve the room toolbox, so
  the default tool form has no schema for them. `ToolsView` and the inline tool area render
  `TeamworkToolCard` for folder and connector calls instead.
- **The connector viewers come from `@semoss/connectors`.** OneDrive, Outlook Mail and Calendar,
  Teams channels, files, and chats, and Google Drive, Gmail, Calendar, and Docs are its viewers
  (`libs/connectors/`). The room mounts each as a sidebar panel
  (`components/connector-viewer-panels.tsx`) with `showHeader={false}`, since its tab already names
  it. The tab, the plus menu, and context chips show the app's logo from the source's `brand`
  (`sources/connector-sources.ts`); a panel opened with `{ brand }` in its config shows that logo
  instead and gets a tab of its own, so one viewer can stand for more than one app. The room wires
  each viewer with `sources/use-room-connector-host.ts`:
  saves land at the top of chat files, and Add to context also queues the file in
  `TeamworkStore.contextItems`. `RoomStore.askMessage` sends queued files as `media` with the next
  message the user sends, and puts them back on the queue when the send fails.
- **A viewer shows once its connector is on.** The plus menu's Microsoft 365 and Google
  Workspace submenus list `TeamworkStore.availableSources`: a viewer needs its connector switched
  on for the chat (`requires` in `sources/connector-sources.ts`) and its account signed in.
- **A chat says when its connectors cannot run.** Inside the input box, `TeamworkSignInNotice`
  lists every account the chat's switched on connectors need but the session is not signed in to
  (`TeamworkStore.missingSignIns`, read again whenever the window regains focus), with a Sign In
  button. It also names accounts this server does not offer (`unofferedProviders`) and
  connectors this server's sign in cannot cover (`uncoveredConnectors`). Coverage comes from
  `connectorAccess` in `/api/config`: the server judges it from the scopes each sign in asks for
  (`ConnectorScopeAccess` in Semoss) and sends only whether each app can work, and only to a user
  signed in to the platform, so the scopes never reach the page. `connectors/connector-access.ts`
  reads it by each service's `accessKey`, and a service the sign in cannot cover cannot be
  switched on. The session can also list an account whose token has lapsed, so a connector call
  that fails with the login required error offers a sign in in its own card (`isSignInFailure`).
- **The session's logins are one shared read.** Many views show sign in state, so
  `getSessionLogins` joins a read in flight and reuses one younger than 30 seconds; a sign in or a
  retry reads again. The login settings in `/api/config` are read once per page. Views may ask
  whenever they mount or the window regains focus without calling the backend each time.
- **Signing in always starts fresh.** The session keeps listing a provider whose token expired,
  so `connectProvider` signs a listed provider out first and waits for it to be listed again,
  checking the popup every second and the logins every five. It never signs out the session's own
  login (`primaryLogin` in `/api/config`), which would end the session or change whose it is; for
  that one it waits for the popup instead.

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
