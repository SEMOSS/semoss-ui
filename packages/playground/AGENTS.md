# AGENTS.md - @semoss/playground

This document provides context for AI coding assistants working with the SEMOSS Playground application.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md),
> the [chat host skill](../../skills/chat-host.skill.md), and the
> [SDK chat skill](../../skills/sdk-chat.skill.md) for room work.

## Overview

`@semoss/playground` is the SEMOSS chat application, private (not published). It is a **thin
shell** over [`@semoss/chat`](../../libs/chat/AGENTS.md), which owns every chat surface (rooms,
composer, Workspace, rooms list, agents, knowledge, settings), and the SDK's room engine, which
owns rooms, messages, tools and agent runs. The playground owns only:

- **Routes** (`src/pages/`): thin route files that read the address and render a chat view
  (`RoomView`, `NewRoomView`, `RoomsListView`, `AgentCatalogView`, `AgentDetailView`,
  `AgentEditView`, `AgentNewView`, `KnowledgeView`, `KnowledgeDetailView`), plus the layouts
  (`InitializedLayout`, `AuthenticatedLayout`, `MainLayout`), login, error and embed pages.
- **The host config** (`src/host/`): `build-playground-host-config.ts` turns the theme into a
  `ChatHostConfig` (engine config, feature flags, file panels, connectors integration, tool view
  libraries, navigation over the router); `playground-panel-components.ts` composes the
  Workspace's blueprints; `root.store.ts` (the theme).
- **Brand chrome** (`src/components/common/`, `src/features/navigation/`): logo, global nav and
  footer, user menu, tour, banner (`ThemeBanner`), dialog, landscape restriction, the mobile
  navigation (`PageHeaderNavigation`, passed to room headers as their `leading` slot), and the
  embedded pages and their iframe sync.

Anything a second chat host (desktop, an embed) would also need belongs in `@semoss/chat`, not
here.

## How the shell is wired

`MainLayout` builds the host config once per theme and mounts the chat:

```tsx
const chatConfig = useMemo(
	() => buildPlaygroundHostConfig(root.theme, navigate),
	[root.theme, navigate],
);
<ChatProvider config={chatConfig}>
	<SettingsDialogProvider pages={[CONNECTORS_SETTINGS_PAGE]}>…</SettingsDialogProvider>
</ChatProvider>;
```

- **Theme → config.** `RootStore` merges `VITE_THEME` with the server's theme
  (`useConfig`) and applies its CSS variables; `buildPlaygroundHostConfig` is a pure function from
  that theme to a `ChatHostConfig`, starting from `chatSettingsFromTheme(theme)`. Branding fields (images, banner, landing, sidebar items, tour)
  never enter the config: pages pass them to the views' slots.
- **Workspace panels.** `PLAYGROUND_PANEL_COMPONENTS` is `CHAT_FILE_PANEL_COMPONENTS` (from
  `@semoss/chat/panels`), `ROOM_PANEL_COMPONENTS`, and `CONNECTOR_PANEL_COMPONENTS`; module scope
  matters, since blueprint identity churn remounts panels. `filePanels` is `CHAT_FILE_PANELS`.
- **Connectors.** Wired only through `@semoss/chat/connectors`: `createConnectorToolProvider()` in
  the engine's client tools, `createConnectorsIntegration()` in `integrations`,
  `CONNECTOR_PANEL_COMPONENTS` in the panels, `CONNECTOR_TOOL_VIEW_LIBRARIES` for tool views,
  `CONNECTORS_SETTINGS_PAGE` in the settings dialog.
- **Navigation.** `navigation` maps the chat's requests onto hash routes (`/room/:id`,
  `/new?workspaceId=&knowledgeId=&prompt=`, `/agent/...`, `/knowledge/...`).
- **Styles.** `src/index.css` imports `@semoss/chat/globals.css` beside the other libraries', or
  Tailwind would not generate the chat's classes.
- **Translations.** `playgroundResources` is `chatResources` plus the playground's `appNav`,
  `tour` and `mobile` namespaces (`locales/<lng>/playground/`).

The chat's invariants (the dock store belongs to the room's UI store, the stable
`sidebarSnapshot`, file panels re-pointed at the live insight, client tools sent twice, never an
empty `DeleteInsightAssets` path, 1 room = 1 insight, connectors copied into each room, the SDK
owns logins, agent-run lifecycle) are documented in [libs/chat/AGENTS.md](../../libs/chat/AGENTS.md)
and the [SDK guide](../../libs/sdk/AGENTS.md); they hold here because the playground only composes.

## Structure & Conventions

| Folder | Purpose |
|--------|---------|
| `pages/` | Route files, layouts, `router.tsx` (hash router) |
| `host/` | The host config, panel composition, tool view libraries, theme store |
| `components/common/` | Brand chrome only |
| `features/navigation/` | The navigation sidebar's mobile and rail behavior, embedded pages |
| `contexts/`, `hooks/` | `RootContext` / `useRoot` (theme), tour, `useThemeTitle` |

Follow the React skill's [architecture policy](../../skills/react-standard.skill.md#architecture-and-exports).
Chat UI work goes to `libs/chat`; backend calls go to the SDK (`libs/sdk/src/api/`). The
playground has no `api` folder, and none should be added.

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

Run these from `packages/playground`, or use `pnpm --filter @semoss/playground <command>`. Chat UI
tests run in `libs/chat` (`pnpm --filter @semoss/chat test`).

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

`VITE_PLATFORM_URL` and the model variables reach the chat through the host config
(`platformUrl`, `defaultModel`); the chat library reads no environment variables.

### Environment File Precedence

Highest to lowest priority for development: existing process environment,
`.env.development.local`, `.env.development`, `.env.local`, then `.env`.
Mode-specific files are optional; never edit local override files as part of repository work.

## Vite Configuration

The dev server proxies `MODULE` to `ENDPOINT`. Every host that mounts a dock or a file panel takes
`aiSdkStubAlias` and `scopePptxViewerCssPlugin` from `@semoss/panels/vite`, and aliases
`monaco-editor` to `@semoss/shared`'s copy; see
[libs/panels/AGENTS.md](../../libs/panels/AGENTS.md#what-a-host-has-to-wire-up).

- `@/` → `./src/` (e.g., `import { useRoot } from "@/hooks/use-root"`)

## Testing Configuration

- **Environment**: jsdom, setup file `vitest.setup.ts` (jest-dom matchers, canvas mock)
- **Coverage**: `./coverage/packages/playground/`

## Workspace Dependencies

`@semoss/chat`, `@semoss/connectors` (tool view libraries), `@semoss/i18n`, `@semoss/panels`,
`@semoss/sdk`, `@semoss/shared`, `@semoss/ui`, `@semoss/utility`, `@semoss/workbench`. Lexical
and mermaid are the chat's dependencies, not the playground's.

Source-only libraries are compiled by the app. Built libraries need their build/watch process
running; use the root `pnpm dev:playground` command for dependency orchestration.

## Design-System Notes

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md).

## Agent Guardrails

### Do Not Modify

- **`.env.local`** / **`.env.*.local`** - Local developer overrides (gitignored)
- **Proxy target URLs** in committed `.env` - May contain sensitive endpoints
- **`ACCESS_KEY`** / **`SECRET_KEY`** - Credentials (only in local env files)

### Be Cautious With

- **`vite.config.ts`** - Affects dev server, build, and test configuration
- **`vitest.setup.ts`** - Changes affect all tests
- **`host/build-playground-host-config.ts`** - Every room's engine config and the chat's flags

### Testing Changes

```bash
pnpm test           # Run tests
pnpm type-check     # Verify TypeScript (also compiles @semoss/chat's sources)
pnpm build          # Production build
```

### Running with Backend

1. Start the backend on port 9090 (or update `ENDPOINT` in `.env.local`)
2. Run `pnpm dev`
3. Access at http://localhost:5174

## Generic utilities

Import reusable helpers from `@semoss/utility/<category>`. Follow the
[utility guide](../../libs/utility/AGENTS.md).
