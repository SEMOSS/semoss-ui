# AGENTS.md - @semoss/playground

This document provides context for AI coding assistants working with the SEMOSS Playground application.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md)
> and [SDK chat skill](../../skills/sdk-chat.skill.md) for room work.

## Overview

`@semoss/playground` is the SEMOSS chat's web app. It is private (not published): the shell
(routing, navigation, settings, agents, knowledge, the tour) around the chat in
[`@semoss/chat`](../../libs/chat/AGENTS.md), which the desktop app shares.

## Structure & Conventions

Code lives in `src/features/<feature>/` (agents, app-shell, chat-config, connectors, knowledge,
navigation, room-page, settings, theme, tour); `src/pages/` holds the router, the layouts, and thin
`<name>.page.tsx` route pages. Follow the React skill's
[architecture policy](../../skills/react-standard.skill.md#architecture-and-exports); a feature
imports another feature, or anything outside its own folder, through `@/`, and the chat through
`@semoss/chat`. The playground has no `api` folder, and none should be
added: backend calls apps share live in `libs/sdk/src/api/` (for example `runMcpTool` and
`makeUserPixelMcp` in `mcp.ts`), and asset pixels come from the file explorer adapter in
`@semoss/shared` (`getFileExplorerAdapter`). A room's own tool file is read and written by
`@semoss/chat`'s `features/room/room-tool-file.ts`.

## Session, config and insights

- **Sign in, the user and the config come from the SDK.** `main.tsx` calls `Session.initialize()`
  once, after embed authentication and before the first render. `InitializedLayout` waits while
  `useSession` is `INITIALIZING`. `AuthenticatedLayout` sends `UNAUTHENTICATED` to `/login`, and
  shows `ErrorPage` with Retry (`useSessionRetry` from `@semoss/sdk/react`) on `ERROR`, so `/login` still renders.
  The shared `LoginForm` signs in through `useSession`, and `NavUser` signs out the same way.
  Read the user with `useSession((state) => state.user)` and config values with
  `useConfig((state) => state.config?.x)`. See [the SDK session guide](../../libs/sdk/skills/session.skill.md).
- **The theme is `usePlaygroundTheme()`** (`features/theme/use-playground-theme.ts`): the server's
  `THEME_MAP` `playground` entry over `VITE_THEME`, `VITE_NAME` and the defaults. These are laid
  together by `withPlaygroundDefaults` in `features/theme/playground-theme.ts`, over the chat's
  `DEFAULT_CHAT_THEME`,, which returns the
  same object for the same server theme.
- **Only rooms are insights.** The app has no `InsightProvider` of its own. `Chat.Room`, and a
  new chat's prepared room, mount one with `options={{ insightId: room.insightId }}` and
  `destroyOnUnmount={false}`, since `RoomStore` owns that insight. Pixels that belong to no
  room run in the session's insight: `useSessionPixel` for reads, `useSessionIteratorPixel` for
  lists that page, `useSessionInsight().run` / `upload` / `download`, or
  `Session.insight.run` outside React. `run` returns `errors` rather than throwing, so wrap it in
  `throwOnPixelErrors` (exported by `@semoss/sdk`) where a caller expects a throw.
- **Moving off MobX and zustand.** Put new state in hooks over the SDK's stores, or in an
  `StoreState`-backed store per the
  [state management skill](../../skills/state-management.skill.md), never in a new
  MobX or zustand store. The chat's stores live in
  `@semoss/chat`, whose [guide](../../libs/chat/AGENTS.md#state) says where each stands.
  `ChatStore.user` is a thin, deprecated adapter over the SDK (use `useSession`); do not add
  consumers.
- **A new chat's model, mode and agent follow one order.** Each takes the first that is set:
  1. what this login session last used, kept in memory and never in `sessionStorage` (the model is
     `ChatStore`'s selected model; the mode and agent are held by `new-chat-preferences.ts`, by
     `lastLogin`), so a reload starts again at 2;
  2. the user's default, their metadata `playground--default-input-text-model`,
     `playground--default-chat-mode` and `playground--default-chat-agent`, saved with
     `Session.setMetadata` from Settings > General's Chat section
     (`features/settings/new-chat-settings.tsx`), where the model and agent rows' **Default** choice clears it;
  3. the deployment's default: the theme's `defaultRoomSettings` (`model`, `mode`, `agentId`),
     then `VITE_DEFAUlT_MODEL_ID`, `VITE_DEFAULT_CHAT_MODE` and `VITE_DEFAULT_CHAT_AGENT_ID`
     (read in `features/chat-config/new-chat-build-defaults.ts` and given to the chat as
     `ChatConfig.newChatDefaults`);
  4. the first available: the first model, chat mode, and Default Agent.

  A mode is always chat where agent mode is not offered, an agent link (`?workspaceId=`) wins over
  steps 1 to 3, and an agent from them that the user can no longer open gives way to Default Agent.
  The rules live in `@semoss/chat`'s `features/new-chat-preferences/new-chat-preferences.ts`. Playground does not
  read the platform's `text-generation-model`.

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

# New chat defaults (chat or agent, and a saved agent id)
VITE_DEFAULT_CHAT_MODE=""
VITE_DEFAULT_CHAT_AGENT_ID=""
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

- `@/` → `./src/` (e.g., `import { GlobalNav } from "@/features/navigation/global-nav"`)

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

Coverage reports output to `./coverage/packages/playground/` and include only `src/features/`.

## Workspace Dependencies

```json
{
  "@semoss/chat": "workspace:*",
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

## The chat

The chat itself (rooms, messages, tools, the Workspace, the room list, and the new-chat screen)
is [`@semoss/chat`](../../libs/chat/AGENTS.md); read its guide for the glossary, the room
Workspace, chat tools, the slash menu, tool views, the next message's files, and connectors. The
playground composes its pieces: `MainLayout` makes the chat store (`useCreateChatStore`) and
provides it with `Chat.SessionProvider`, `PlaygroundChatConfigProvider`
(`features/chat-config/`) gives the theme, the env's defaults and the routes through
`Chat.ConfigProvider`, `pages/room.page.tsx` lays out `Chat.Room`, and
`pages/new-room.page.tsx` renders `Chat.NewChat`.

## Navigation

The global navigation (`GlobalNav`) is an offcanvas `Sidebar`: collapsed, it is hidden
completely. It starts open (the theme's `sidebar.expandedByDefault` defaults to true), and
Cmd/Ctrl+B toggles it; it has no edge rail. While it is open, its own header holds
the toggle (`NavigationToggle`) on every route. While it is hidden, a `NavigationButton` opens
it: on a route with its own header (the room and new-chat pages register one with
`PageHeaderContext`), inline before the room's name; elsewhere floating, with `MainLayout`
padding the page for it. On mobile, the button opens the sheet. Opening the Workspace folds
the navigation without changing the saved preference (`useWorkspaceNavigation`).

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
