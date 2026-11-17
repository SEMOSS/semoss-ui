# @semoss/chat

The SEMOSS chat as composable React pieces: rooms, messages, tools, the composer, the room's
Workspace, the room list and search, and the new-chat screen, with the stores behind them.

It is what the two chat apps are made of:
[`@semoss/playground`](../../packages/playground) (web) and
[`@semoss/playground-desktop`](../../packages/playground-desktop) (Electron). A host gives it
navigation and a theme, and lays the pieces out however it likes.

- **Private and source-exported.** Two entries, `@semoss/chat` (`src/index.ts`) and
  `@semoss/chat/globals.css`. There is no build: the host's Vite compiles the source.
- **Router-free.** The chat never routes itself. It asks the host to open a room or a new chat
  through `ChatConfig.navigation`, so it works under any router, or none.
- **Named exports only.** A host bundles only the pieces it imports.

Changing the library? Read its [AGENTS.md](./AGENTS.md) instead: it has the layout, the stores,
the glossary, and the contracts that are easy to break.

## Setting up a host

### 1. Dependencies

Add the chat and its peers as workspace dependencies (dev dependencies, in an app that bundles
everything, like the desktop app):

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
	"@semoss/workbench": "workspace:*",
	"react": "^19.0.0",
	"react-dom": "^19.0.0"
}
```

### 2. Styles

The chat's stylesheet only tells Tailwind to scan the chat's sources; without it none of the
chat's classes are generated. Import it with the other libraries' stylesheets, in the host's
Tailwind entry:

```css
@import "@semoss/ui/globals.css";
@import "@semoss/shared/globals.css";
@import "@semoss/connectors/globals.css";
@import "@semoss/chat/globals.css";
@import "@semoss/workbench/globals.css";
@import "@semoss/panels/globals.css";

@source "./**/*.{ts,tsx}";
```

### 3. Translations

Load `chatResources` from `@semoss/i18n`: every namespace the chat's pieces read. A host with
strings of its own builds a map on it, as `playgroundResources` and `desktopResources` do.

```tsx
import { chatResources, I18nBuilder, I18nextProvider } from "@semoss/i18n";

const i18nBuilder = new I18nBuilder(chatResources);

/** Resolves once the active language is loaded; await it before the first render. */
export const i18nReady = i18nBuilder.ready;

// <I18nextProvider i18n={i18nBuilder.i18n}>…</I18nextProvider>
```

### 4. Vite

The Workspace is a `@semoss/workbench` dock holding `@semoss/panels` file panels, so the host
needs their wiring: `aiSdkStubAlias` and `scopePptxViewerCssPlugin` from `@semoss/panels/vite`,
and a `monaco-editor` alias. With the shared config from `@semoss/config`:

```ts
import { resolve } from "node:path";
import type { ConfigEnv } from "vite";
import { createViteConfig, localeManualChunks } from "@semoss/config";
import { aiSdkStubAlias, scopePptxViewerCssPlugin } from "@semoss/panels/vite";

const baseConfig = createViteConfig({
	rootDir: import.meta.dirname,
	port: 5174,
	proxy: { ws: true }, // forwards MODULE to ENDPOINT, sockets included
	alias: [
		{
			find: /^monaco-editor$/,
			replacement: resolve(
				import.meta.dirname,
				"../../libs/shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
			),
		},
		aiSdkStubAlias,
	],
	manualChunks: localeManualChunks,
});

export default (env: ConfigEnv) => {
	const config = baseConfig(env);
	config.plugins = [scopePptxViewerCssPlugin, ...(config.plugins ?? [])];
	return config;
};
```

See [the panels guide](../panels/AGENTS.md#what-a-host-has-to-wire-up) for why.

### 5. The SDK session

The chat calls the server through `@semoss/sdk`, same-origin at `${MODULE}/...`. Set the module
and start the session before rendering, and render chat UI only once the user is signed in:
the chat store reads the user's models and rooms as soon as it is made.

```tsx
import { createRoot } from "react-dom/client";
import { Env, Session } from "@semoss/sdk/react";

Env.update({ MODULE: Env.MODULE || "/Monolith" });

const mount = async (): Promise<void> => {
	await i18nReady;
	void Session.initialize();
	createRoot(document.getElementById("root") as HTMLElement).render(<App />);
};

void mount();
```

Gate the chat's routes on `useSession((state) => state.status)` from `@semoss/sdk/react`: wait
while it is `INITIALIZING`, send `UNAUTHENTICATED` to a page with `LoginForm` from
`@semoss/shared`, and offer `useSessionRetry()` on `ERROR`. Both apps' layouts do this
(`authenticated-layout.tsx` in the playground, `session-layout.tsx` on the desktop). See
[the SDK session skill](../sdk/skills/session.skill.md).

## Composing the chat

### The config

`ChatConfig` is everything chat UI needs from the host:

| Field | What it is |
|---|---|
| `theme` | A `ChatTheme`: the deployment's theme with every default filled in. Merge a server theme over `DEFAULT_CHAT_THEME` with `mergeChatTheme`. |
| `newChatDefaults` | The build's `NewChatBuildDefaults` (`modelId`, `modelName`, `mode`, `agentId`), used below the theme's `defaultRoomSettings`. `{}` for none. |
| `platformUrl` | Where the SEMOSS platform app is served, for catalog links and tool views that load a platform app. `""` for none. |
| `navigation` | A `ChatNavigation`, below. |

| `navigation` | When the chat calls it |
|---|---|
| `openRoom(roomId)` | A room should open, as when a new chat's first message creates one. |
| `roomHref(roomId)` | A room's link, so a middle click opens it in a new tab. |
| `openNewChat()` | A new chat should open, as when a room cannot load. |
| `onRoomDeleted(roomId)` | A room was deleted from chat UI. |
| `agentHref?(workspaceId)` | An agent's link. Without it, chat UI shows no agent links. |
| `openSettings?("connectors")` | The host's settings, on its Connectors page. Without it, chat UI shows no Manage Connectors. |

Build it in a hook, memoized so chat UI only rerenders when the theme or the routes change.
With `react-router` and a hash router:

```tsx
import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
	type ChatConfig,
	type ChatTheme,
	DEFAULT_CHAT_THEME,
	mergeChatTheme,
} from "@semoss/chat";
import { useConfig } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";

/**
 * The chat's config: the server's playground theme over the chat's defaults,
 * and this app's routes.
 *
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const useMyChatConfig = (): ChatConfig => {
	const serverTheme = useConfig((state) => state.theme);
	const navigate = useNavigate();

	const theme = useMemo<ChatTheme>(() => {
		// the server's THEME_MAP keeps the chat's theme under `playground`
		const playground = isRecord(serverTheme?.playground)
			? (serverTheme.playground as Partial<ChatTheme>)
			: undefined;
		return mergeChatTheme(DEFAULT_CHAT_THEME, playground);
	}, [serverTheme]);

	return useMemo<ChatConfig>(
		() => ({
			theme,
			newChatDefaults: {},
			platformUrl: "",
			navigation: {
				openRoom: (roomId) => navigate(`/room/${roomId}`),
				roomHref: (roomId) => `#/room/${roomId}`,
				openNewChat: () => navigate("/new"),
				onRoomDeleted: () => navigate("/new"),
			},
		}),
		[theme, navigate],
	);
};
```

### The providers

`ChatProvider` makes the session's chat store and provides it with the config. Put it inside the
router (the config navigates) and the session gate:

```tsx
import { Outlet } from "react-router";
import { ChatProvider } from "@semoss/chat";

/** The signed in shell: the chat's providers around the room list and the route. */
export const ChatLayout = () => {
	const config = useMyChatConfig();

	return (
		<ChatProvider config={config}>
			<MySidebar />
			<main className="relative h-dvh min-w-0 flex-1 overflow-hidden">
				<Outlet />
			</main>
		</ChatProvider>
	);
};
```

When something has to sit between the store and the config (the playground's settings dialog
reads the store and gives the config its `openSettings`), make the store yourself and use the two
providers `ChatProvider` is made of:

```tsx
const store = useCreateChatStore(config.theme, config.newChatDefaults);

<ChatSessionProvider store={store}>
	<SomethingThatReadsTheStore>
		<ChatConfigProvider config={config}>{children}</ChatConfigProvider>
	</SomethingThatReadsTheStore>
</ChatSessionProvider>;
```

`useCreateChatStore` returns the same store while the theme and defaults are the same object;
a new theme makes a new store, so keep both stable.

### The room list and search

```tsx
import { useState } from "react";
import { useMatch } from "react-router";
import {
	RoomList,
	RoomSearchDialog,
	useRoomSearchShortcut,
} from "@semoss/chat";

/** The user's chats, with search on Cmd+K (Ctrl+K elsewhere). */
export const MySidebar = () => {
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const roomMatch = useMatch("/room/:roomId");

	useRoomSearchShortcut(setIsSearchOpen);

	return (
		<aside className="flex w-64 flex-col">
			<RoomList
				isVisible
				activeRoomId={roomMatch?.params.roomId}
				onSearch={() => setIsSearchOpen(true)}
			/>
			<RoomSearchDialog
				open={isSearchOpen}
				onOpenChange={setIsSearchOpen}
			/>
		</aside>
	);
};
```

`RoomList` loads and pages only while `isVisible` is true, so pass whether your sidebar is
showing. The apps render it inside `@semoss/ui/next`'s `Sidebar`.

### A room

`RoomScope` opens a room by id and gives the pieces inside it the room, its insight, its tool
views, and its actions. Inside it, compose the rest:

```tsx
import { useParams } from "react-router";
import {
	FileDropProvider,
	RoomConversation,
	RoomFrame,
	RoomHeader,
	RoomScope,
	RoomWorkbench,
} from "@semoss/chat";

/** The room the route names. */
export const RoomPage = () => {
	const { roomId = "" } = useParams();

	return (
		<RoomScope roomId={roomId}>
			<RoomFrame
				header={<RoomHeader leading={<MySidebarToggle />} />}
				workbench={<RoomWorkbench />}
			>
				<FileDropProvider>
					<RoomConversation />
				</FileDropProvider>
			</RoomFrame>
		</RoomScope>
	);
};
```

| Piece | What it is |
|---|---|
| `RoomScope` | Opens the room (at once from the store's cache, else by loading it) and provides it. A room that cannot load shows a toast and calls `navigation.openNewChat`. |
| `RoomFrame` | The conversation beside the Workspace, which opens, closes, and collapses with the room. Leave out `workbench` for no Workspace. |
| `RoomLayout` | The same layout for a room you pass in, with `isWorkbenchOpen` and `onWorkbenchCollapse` in your hands. |
| `RoomHeader` | The room's name (double-click to rename) and the Workspace toggle; `leading` holds your controls before the name. |
| `RoomTitle` | The room's name alone. |
| `RoomWorkbench` | The Workspace: a dock with Files, Settings, tool and connector panels, and its panel rail. |
| `RoomWorkbenchToggle` | The Workspace's open and close button, for a header of your own. |
| `RoomConversation` | The messages and the composer together. |
| `RoomMessages`, `RoomComposer` | The two halves, to lay out apart. |
| `FileDropProvider` | Makes its children take dropped files for the next message. |

Every piece inside `RoomScope` reads the room from context; `RoomHeader`, `RoomWorkbench` and
`RoomConversation` also take a `room` prop.

### A new chat

`NewChat` is the whole new-chat screen: the landing, the composer, and a draft Workspace. Its
first message creates the room and calls `navigation.openRoom`.

```tsx
import { useSearchParams } from "react-router";
import { NewChat } from "@semoss/chat";

/** A new chat; a link may name its prompt, agent, or knowledge base. */
export const NewRoomPage = () => {
	const [searchParams] = useSearchParams();

	return (
		<NewChat
			initialPrompt={searchParams.get("prompt") ?? ""}
			workspaceId={searchParams.get("workspaceId")}
			knowledgeId={searchParams.get("knowledgeId")}
			headerLeading={<MySidebarToggle />}
		/>
	);
};
```

| Prop | What it does |
|---|---|
| `initialPrompt` | Text the composer starts with. |
| `workspaceId` | An agent the chat starts with. |
| `knowledgeId` | A knowledge base the chat starts with. |
| `showAltLanding` | Show the theme's alternate landing. |
| `headerLeading` | Your controls at the start of the header. |

The model, mode and agent a new chat starts with come, in order, from what this login session
last used, the user's default (their metadata, set in the playground's Settings > General), the
deployment's (`theme.defaultRoomSettings`, then `newChatDefaults`), and the first available.

### The Workspace and the navigation

Opening a room's Workspace asks the host to make room for it through
`WorkspaceNavigationContext`. Provide a function there to fold your navigation while the
Workspace is open (the playground passes `setWorkAreaOpen` from its `useWorkspaceNavigation`);
without a provider nothing happens.

```tsx
<WorkspaceNavigationContext.Provider value={(isOpen) => setIsNavFolded(isOpen)}>
	{children}
</WorkspaceNavigationContext.Provider>
```

## Reading chat state

The stores are framework-free (`StoreState` from `@semoss/utility/store`). Read them with the
chat's selector hooks; a component rerenders only when what its selector returns changes
(compared one level deep), so select the least you need.

```tsx
import { useChatSelector, useChatSession, useRoom, useRoomSelector } from "@semoss/chat";

/** The open room's model, and whether a reply can be stopped. */
export const RoomStatus = () => {
	const { chat } = useChatSession();
	const room = useRoom(); // inside RoomScope
	const models = useChatSelector(chat, (current) => current.models.available);
	const { model, canCancel } = useRoomSelector(room, (current) => ({
		model: current.model,
		canCancel: current.canCancel,
	}));

	return (
		<p>
			{model?.engine_name ?? "No model"} of {models.length}
			{canCancel ? " (replying)" : ""}
		</p>
	);
};
```

| Hook | Reads |
|---|---|
| `useChatSession()` | `{ chat }`, the session's `ChatStore`. Throws outside a provider. |
| `useChatSelector(chat, select)` | The chat store: its models, cached rooms, and the room list. |
| `useRoom()` | The `RoomStore` in the nearest `RoomScope`. |
| `useRoomSelector(room, select)` | One room and its whole conversation. Takes `null` or `undefined` and returns `undefined`. |
| `useMessage(message, select)` | One message's content, so a streamed token renders only its row. |
| `useTool(tool, select)` | One tool call. |
| `useChatConfig()` | The host's `ChatConfig`. |
| `useAgentWorkspace(workspaceId)` | An agent's definition: `{ workspace, status, error, refresh }`. |

Change state through the stores' actions (`room.closeSidebar()`, `chat.setSelectedModel(model)`,
...), never by writing to a snapshot.

## Other exports

| Export | What it is |
|---|---|
| `createAgent`, `editAgent`, `deleteAgent` | Create, save, and delete an agent in the session's insight. |
| `SaveAgentDialog` | Publish a room as an agent. |
| `NewKnowledgeForm` | Create a knowledge base. |
| `useConnections`, `useConnectProvider`, `ConnectorServiceIcon` | The Microsoft 365 and Google Workspace accounts, for a Connectors settings page. |
| `readUserConnectorTools`, `writeUserConnectorTools`, `getConnectorServices` | The user's connector choices, shared by all their chats. |
| `getConnectorProvider`, `getConnectorService`, `sanitizeConnectorServices` | The connector catalog. |
| `readNewChatPreferences`, `readDeploymentNewChatDefaults`, `NEW_CHAT_PREFERENCE_KEYS`, `isNewChatMode` | New chat preferences, for a settings page that sets the user's defaults. |
| `offersAgentMode` | Whether the theme offers agent mode. |
| `App`, `MCPConfig`, `Workspace` | Backend types. |

The playground's `features/settings/` and `features/connectors/` show these in use.

## Rules for hosts

- Import only from `@semoss/chat` and `@semoss/chat/globals.css`, never from `src/`.
- Keep chat behavior in the library. If both apps need it, add it here; if only one does, keep it
  in that app and pass it in through a slot (`leading`, `headerLeading`) or `ChatConfig`.
- The library never imports a router, Electron, `import.meta.env`, or anything from `packages/*`;
  don't make it.

## Development

```bash
pnpm --filter @semoss/chat test
```

```bash
pnpm --filter @semoss/chat check-types
```

```bash
pnpm dev:playground
```

The last runs the web app with its dependencies, the quickest way to see a change.
