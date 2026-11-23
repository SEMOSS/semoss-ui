# AGENTS.md - @semoss/playground

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Read the
> [React standard](../../skills/react-standard.skill.md) before changing React code, and the
> [chat guide](../../libs/chat/AGENTS.md) before changing how the app composes the chat.

`@semoss/playground` is the SEMOSS chat's web app, private and not published. It is the shell
around [`@semoss/chat`](../../libs/chat/AGENTS.md): routing, the global navigation, the theme,
agents, knowledge, embedded pages and the tour. The desktop app
([`@semoss/playground-desktop`](../playground-desktop/AGENTS.md)) composes the same library.

**If the desktop app needs it too, it belongs in `@semoss/chat`.** The chat, the room history, the
Workspace and the settings dialog are the library's; this app only places them.

## Where a change goes

| You are changing | Where |
|---|---|
| A route, or which layout wraps it | `src/pages/router.tsx` |
| The signed in shell: providers, navigation beside the route | `src/pages/app-layout.tsx` (`AppLayout`) |
| What the chat is given: routes, env defaults, platform URL | `src/features/chat-config/` (`useHostChatConfig`) |
| The global navigation, the user menu, the open-navigation button | `src/features/navigation/` |
| The build's and server's theme, the tab title | `src/features/theme/` |
| Agent catalog, create, detail, edit; creating and deleting agents | `src/features/agents/` |
| The knowledge library and a knowledge base's detail | `src/features/knowledge/` |
| Pages the theme embeds in iframes | `src/features/embed/`, `src/pages/embed.page.tsx` |
| The landing tour | `src/features/tour/` |
| The welcome dialog, footer, language direction | `src/features/app-shell/` |
| Anything inside a room, a new chat, the room history, or the settings dialog | [`@semoss/chat`](../../libs/chat/AGENTS.md#where-a-change-goes) |

`src/pages/` holds the router, the layouts, and thin `<name>.page.tsx` route pages; everything
else is in `src/features/<feature>/`. A feature imports another through `@/`, and the chat through
`@semoss/chat`. There is no `api` folder and none should be added: backend calls live in
`libs/sdk/src/api/`.

## Routes

`pages/router.tsx` builds one hash router at module load:

| Path | Page | Notes |
|---|---|---|
| `/new` | `NewChatPage` | `NewChat` with the theme's banner, landing image and landing; `?prompt=`, `?workspaceId=`, `?knowledgeId=`, and the theme's `altLandingKey` |
| `/room/:roomId` | `RoomPage` | `RoomScope` around `RoomFrame`, `RoomHeader`, `RoomWorkbench`, `RoomConversation` |
| `/agent`, `/agent/new`, `/agent/:workspaceId`, `/agent/:workspaceId/edit` | `features/agents/` | The catalog, create, detail, and edit pages |
| `/knowledge`, `/knowledge/:knowledgeId` | `features/knowledge/` | The library and a knowledge base's detail |
| `/embed/*` | `EmbedPage` | A page the theme embeds (`useEmbeddedPageMap`), kept mounted by `EmbeddedPages` |
| `/login` | `LoginPage` | Outside `AuthenticatedLayout` |
| anything else | | `/new` when signed in, else `/login` |

The layouts nest `InitializedLayout` (waits for the session, provides the theme through
`RootLayout`) → `AuthenticatedLayout` → `AppLayout`. `ErrorPage` catches errors in the layouts,
and again inside `AppLayout` (`isInnerComponent`) so the navigation stays beside a failed page.

## How the app composes the chat

- **`AppLayout`** builds the chat's config (`useHostChatConfig`) and hands it to `ChatProvider`.
  It holds the settings dialog's state (`useUserSettingsDialog`) and renders `UserSettingsDialog`
  with the chat's sections (`useDefaultUserSettingsSections`, light only where the theme turns
  `enableDarkMode` off); the config carries `openSettings` as `callbacks.onOpenSettings` for chat
  UI, and `AppNavigation` gets it as a prop for `NavigationUserMenu`. It folds the navigation
  while a room's Workspace is open with the chat's `useWorkbenchNavigation`, provides the tour
  (`useLandingTour`), and renders `EmbeddedPages`.
- **`useHostChatConfig`** owns the theme's meaning for the chat. `options`: the theme as
  the chat's options (`playgroundThemeChatOptions` from `@semoss/shared`, shared with the
  desktop app, with the env's new-chat defaults under the theme's `defaultRoomSettings` and
  `catalogItemHref` where `showPlatformLinks` is on), the links (`roomHref`, `agentHref`) and the platform URL
  (`platformUrl`, from `platform-url.ts` and `VITE_PLATFORM_URL`), memoized on the theme;
  `callbacks`: `onOpenRoom`, `onOpenNewChat`, `onOpenSettings`, and `onWorkbenchOpenChange`;
  `components`: no plus or "/" menu where the theme hides tools in a frame (`hideToolsInIframe`,
  `features/navigation/is-iframed.ts`); and `workbenchPanels` without the activity log where it
  turns `showActivityLog` off. It passes no `tools`. A new
  theme flag the chat needs is a mapping in `playgroundThemeChatOptions`
  (`libs/shared/src/theme/playground-chat-options.ts`) to a `ChatOptions` field, or a piece placed
  here. A compile-time check in `use-host-chat-config.ts` fails when that mapping names an
  option the chat no longer has.
- **`pages/room.page.tsx`** lays out `RoomScope`, with `RoomSuggestions` in `RoomConversation`'s
  `suggestions` where the theme's `enableSuggestions` is on, and **`pages/new-chat.page.tsx`**
  (`NewChatPage`) renders `NewChat`; both put `PageHeaderNavigation` at the start of the header.
- **`AppNavigation`** (`features/navigation/app-navigation.tsx`, with `NavigationItem` and
  `NavigationUserMenu`) holds `RoomHistory`, with dates where the theme's `chatHistoryDate` is on,
  unless the theme hides the chat history.

To add a panel, a slash command, a room action, a composer menu item or a settings page, see
[Customizing the chat](../../libs/chat/README.md#customizing-the-chat).

## Session, config and insights

- **Sign in, the user and the config come from the SDK.** `app.tsx` sets `Env.MODULE` (the
  server's `semoss-env` tag wins, then `.env`'s `MODULE`, then `/Monolith`), and `main.tsx` calls
  `Session.initialize()` once, after embed authentication (`waitForEmbedAuth`) and the active
  language, and before the first render. `InitializedLayout` waits while `useSession` is
  `INITIALIZING`. `AuthenticatedLayout` sends `UNAUTHENTICATED` to `/login`, and shows `ErrorPage`
  with Retry (`useSessionRetry`) on `ERROR`, so `/login` still renders. See
  [the SDK session guide](../../libs/sdk/skills/session.skill.md).
- **The theme is `usePlaygroundTheme()`**: the server's `THEME_MAP` `playground` entry
  (`usePlaygroundServerTheme` from `@semoss/shared`) over the build's theme (`VITE_THEME`,
  `VITE_NAME`, read once in `features/theme/playground-theme.ts`) and the theme's defaults
  (`DEFAULT_PLAYGROUND_THEME`). The chat never reads it: `useHostChatConfig` and the pages
  hand the chat what it means.
- **Only rooms are insights.** The app has no `InsightProvider` of its own. Pixels that belong
  to no room run in the session's insight: `useSessionPixel` for reads,
  `useSessionIteratorPixel` for lists that page, `useSessionInsight().run` / `upload` /
  `download`, or `Session.insight.run` outside React. `run` returns `errors` rather than
  throwing, so wrap it in `throwOnPixelErrors` where a caller expects a throw.
- **The app has no stores of its own.** New shared state goes in a `StoreState`-backed store per
  the [state management skill](../../skills/state-management.skill.md).
- **A new chat's model, mode and agent** follow the order in the chat's
  [state notes](../../libs/chat/docs/state.md#a-new-chats-defaults). This app supplies step 3's
  env values.

## Navigation

The global navigation (`AppNavigation`) is an offcanvas `Sidebar`: collapsed, it is hidden
completely. It starts open (the theme's `sidebar.expandedByDefault` defaults to true), and
Cmd/Ctrl+B toggles it; it has no edge rail. While it is open, its own header holds the toggle
(`NavigationToggle`) on every route. While it is hidden, a `NavigationButton` opens it: on a
route with its own header (the room and new-chat pages register one with `PageHeaderContext`),
inline before the room's name; elsewhere floating, with `AppLayout` padding the page for it. On
mobile, the button opens the sheet. Opening the Workspace folds the navigation without changing
the saved preference.

## Agent pages

The agent pages render the same shared components as the client: the create and edit pages put
`AgentForm` under a sticky Cancel/Create or Save header, and the detail page renders
`AgentDefinition`. Change the shared component, not a copy here.

- The edit page seeds `AgentForm` once per agent, because the form reads its values only on
  mount: a refetch must not overwrite unsaved edits, and a different agent remounts it through
  `key`.
- The edit and detail pages turn the escaped line breaks `GetWorkspace` returns in the
  instructions back into newlines.
- `createAgent`, `editAgent` and `deleteAgent` (`features/agents/agent-actions.ts`) are plain
  functions over the session's insight. A failed follow-up settings save still opens the created
  agent and shows its warning, avoiding duplicate creation.
- Card permissions use the backend's effective `permission`, including group grants.

## Commands and environment

Run from `packages/playground`, or with `pnpm --filter @semoss/playground <command>`:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port 5174 |
| `pnpm build` / `pnpm build:dev` | Production / development build |
| `pnpm test` / `pnpm test:watch` | Run tests once / in watch mode |
| `pnpm type-check` | TypeScript type checking |

The root `pnpm dev:playground` runs `dev` with its dependencies. To use a local backend, start it
on port 9090 (or set `ENDPOINT` in `.env.local`) and open http://localhost:5174.

| Variable | What it sets |
|---|---|
| `ENDPOINT`, `MODULE` | The backend the dev server proxies to, and its module path |
| `VITE_PLATFORM_URL` | Where the platform app is served (`ChatConfig.options.platformUrl`) |
| `VITE_NAME`, `VITE_THEME` | The build's app name and theme JSON |
| `VITE_DEFAUlT_MODEL_ID`, `VITE_DEFAUlT_MODEL_NAME` | The build's default model (the lowercase `l` is in deployed env files; do not fix it) |
| `VITE_DEFAULT_CHAT_MODE`, `VITE_DEFAULT_CHAT_AGENT_ID` | The build's default mode and agent |

The desktop app builds with this same `.env` (its renderer's `envDir`): `VITE_NAME`, `VITE_THEME`
and the new-chat defaults apply to both. Both read them through `readPlaygroundBuildTheme` and
`readPlaygroundBuildNewChat` from `@semoss/shared`.

`vite.config.ts` builds on `createViteConfig` from `@semoss/config`, which proxies `MODULE` to
`ENDPOINT` (WebSockets included), and adds the dock's wiring from `@semoss/panels/vite`. `@/` is
`./src/`.

## Guardrails

- **Do not modify** `.env.local` / `.env.*.local`, proxy target URLs in the committed `.env`, or
  `ACCESS_KEY` / `SECRET_KEY`.
- **Be cautious with** `vite.config.ts` and `vitest.setup.ts`: they affect the dev server, the
  build, and every test.
- Follow [DESIGN.md](../../DESIGN.md). The playground is an operational chat application, not a
  visual sandbox.
- Import generic helpers from `@semoss/utility/<category>`; see the
  [utility guide](../../libs/utility/AGENTS.md).
