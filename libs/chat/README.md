# @semoss/chat

The SEMOSS chat as composable React pieces: rooms, messages, tools, the composer, the room's
Workspace, the room list and search, the new-chat screen, and the user's settings dialog, with
the stores behind them.

It is what the two chat apps are made of:
[`@semoss/playground`](../../packages/playground) (web) and
[`@semoss/playground-desktop`](../../packages/playground-desktop) (Electron). A host gives it
navigation and a theme, and lays the pieces out however it likes.

- **Private and source-exported.** One code entry, `@semoss/chat` (`src/index.ts`), and one
  stylesheet, `@semoss/chat/globals.css`. There is no build: the host's Vite compiles the source.
- **Router-free.** The chat never routes itself. It asks the host to open a room or a new chat
  through `ChatConfig.navigation`, so it works under any router, or none.
- **Named exports only.** A host bundles only the pieces it imports.

Changing the library? Read its [AGENTS.md](./AGENTS.md) instead: it maps where each change
goes, and names the rules that say what a change can break.

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

The chat's stylesheet holds only the chat's own: it tells Tailwind to scan the chat's sources,
and without it none of the chat's classes are generated. The host imports it with the stylesheet
of each library it mounts, in this order, then adds its own sources:

```css
@import "@semoss/ui/globals.css";
@import "@semoss/shared/globals.css";
@import "@semoss/connectors/globals.css";
@import "@semoss/chat/globals.css";
@import "@semoss/workbench/globals.css";
@import "@semoss/panels/globals.css";

@source "./**/*.{ts,tsx}";
```

The chat mounts pieces from all five of those libraries, so a chat host needs every line.

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

`ChatConfig` is the host's whole contract with the chat. Build one object and give it to the
chat store and to chat UI (`ChatProvider` does both):

| Field | What it is |
|---|---|
| `theme` | A `ChatTheme`: the deployment's theme with every default filled in. `useServerChatTheme()` reads the server's over `DEFAULT_CHAT_THEME`, or over a base theme you pass. |
| `newChatDefaults` | The build's `NewChatBuildDefaults` (`modelId`, `modelName`, `mode`, `agentId`), used below the theme's `defaultRoomSettings`. An empty object for none; keep it the same object. |
| `platformUrl` | Where the SEMOSS platform app is served, for catalog links and tool views that load a platform app. `""` for none. |
| `toolFrameOrigin?` | The origin tool views frame an app's pages from, put before a relative module path, so a tool's page is on another origin than chat UI and cannot script it (the desktop app's second local origin). Without it, pages are framed from the module as it is. |
| `navigation` | A `ChatNavigation`, below. |
| `localFolders?` | A `LocalFoldersHost`, for a host that can reach the user's own files (the desktop app). |
| `onWorkbenchOpenChange?(isOpen)` | A room's Workspace opened or closed, so the host can make room for it (the playground folds its navigation). |
| `workbenchPanelComponents?` | Every panel a Workspace can open, by panel type. See [Customizing the chat](#customizing-the-chat). |
| `customize?` | The host's changes to the lists chat UI builds. See [Customizing the chat](#customizing-the-chat). |

| `navigation` | When the chat calls it |
|---|---|
| `openRoom(roomId)` | A room should open, as when a new chat's first message creates one. |
| `roomHref(roomId)` | A room's link, so a middle click opens it in a new tab. |
| `openNewChat()` | A new chat should open, as when a room cannot load. |
| `onRoomDeleted(roomId)` | A room was deleted from chat UI. |
| `agentHref?(workspaceId)` | An agent's link. Without it, chat UI shows no agent links. |
| `openSettings?(section?)` | Open the settings dialog, on a page when one is named. Without it, chat UI shows no Manage Connectors. |

Build it in a hook, memoized so chat UI only rerenders when the theme or the routes change.
With `react-router` and a hash router:

```tsx
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { type ChatConfig, useServerChatTheme } from "@semoss/chat";

/** No build defaults; one object, so the chat store is not remade. */
const NO_NEW_CHAT_DEFAULTS = {};

/**
 * The chat's config: the server's theme over the chat's defaults, and this
 * app's routes.
 *
 * @param openSettings - Opens the settings dialog. Keep its identity stable.
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const useMyChatConfig = (
	openSettings: (section?: string) => void,
): ChatConfig => {
	const theme = useServerChatTheme();
	const navigate = useNavigate();

	return useMemo<ChatConfig>(
		() => ({
			theme,
			newChatDefaults: NO_NEW_CHAT_DEFAULTS,
			platformUrl: "",
			navigation: {
				openRoom: (roomId) => navigate(`/room/${roomId}`),
				roomHref: (roomId) => `#/room/${roomId}`,
				openNewChat: () => navigate("/new"),
				onRoomDeleted: () => navigate("/new"),
				openSettings,
			},
		}),
		[theme, navigate, openSettings],
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

A host that reads the store in the same component that provides it makes the store itself and
uses the two providers `ChatProvider` is made of. Both get the same config:

```tsx
const store = useCreateChatStore(config);

<ChatSessionProvider store={store}>
	<ChatConfigProvider config={config}>{children}</ChatConfigProvider>
</ChatSessionProvider>;
```

`useCreateChatStore` returns the same store while the config's `theme`, `newChatDefaults`,
`localFolders` and `workbenchPanelComponents` are the same objects; a new one of any makes a new
store, so keep them stable. The rest of the config can change freely.

### The settings dialog

`UserSettingsDialog` is the user's settings: General (theme, language, new chat defaults) and
Connectors. The host holds its state with `useUserSettingsDialog`, renders the dialog inside the
chat's providers, and hands `openSettings` to its config, which is how chat UI (Manage
Connectors) and the host's own menus open it:

```tsx
const settings = useUserSettingsDialog();
const config = useMyChatConfig(settings.openSettings);

<ChatProvider config={config}>
	<UserSettingsDialog
		open={settings.isOpen}
		onOpenChange={settings.setIsOpen}
		section={settings.section}
		onSectionChange={settings.setSection}
	/>
	{children}
</ChatProvider>;
```

Anything inside the providers opens it with `useChatConfig().navigation.openSettings?.()`, or
`openSettings?.("connectors")` for one page.

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

Opening a room's Workspace tells the host through `ChatConfig.onWorkbenchOpenChange`, so it can
fold its navigation while the Workspace is open (the playground passes `setWorkbenchOpen` from
its `useWorkbenchNavigation`). Without it nothing happens.

## Customizing the chat

A host changes the chat in two ways, and only these two.

**Layout and controls are composition.** Place the pieces where you want them and fill their
slots with your own components:

| Slot | Where |
|---|---|
| `RoomHeader`'s `leading`, `trailing` | Before the room's name; after it, before the Workspace toggle. |
| `NewChat`'s `headerLeading` | At the start of a new chat's header. |
| `RoomFrame`'s `header`, `workbench`, children | The room's three regions. Leave one out, or pass your own. |
| `RoomConversation`, or `RoomMessages` and `RoomComposer` apart | Put your own content between the messages and the composer. |

**Lists are customization.** For each list chat UI builds, `ChatConfig.customize` has a function
that is handed the chat's own list and returns the one to show: the same list, one with entries
added, or one with entries removed. With none, the chat shows its own.

| `customize` | The list | An entry |
|---|---|---|
| `workbenchPanels(defaults, room)` | The Workspace's panels: the rail's icons and the slash menu's Workspace group. | `WorkbenchPanelOption` |
| `roomActions(defaults, room)` | A room's actions: the rail's cog menu and the slash menu's Room group. | `RoomActionItem` |
| `slashCommands(defaults, room)` | Every command of the composer's "/" menu, after the two lists above are in it. | `SlashCommand` |
| `composerMenu(defaults, props)` | The composer's plus menu. `defaults` is the chat's items, already rendered. | `DropdownMenuItem`s |
| `settingsSections(defaults)` | The pages of the settings dialog. | `UserSettingsSection` |

```tsx
import {
	type ChatConfig,
	DEFAULT_WORKBENCH_PANEL_COMPONENTS,
} from "@semoss/chat";

/** Module scope: a new object makes a new chat store and remounts panels. */
const PANEL_COMPONENTS = {
	...DEFAULT_WORKBENCH_PANEL_COMPONENTS,
	"my-notes": MY_NOTES_PANEL,
};

const config: ChatConfig = {
	// ...theme, navigation
	workbenchPanelComponents: PANEL_COMPONENTS,
	customize: {
		// remove the activity log, add a panel of our own
		workbenchPanels: (defaults, room) => [
			...defaults.filter((panel) => panel.id !== "activity"),
			{
				kind: "room",
				id: "my-notes",
				label: "Notes",
				icon: NotebookIcon,
				panelType: "my-notes",
				panelConfig: {},
				isDisabled: false,
				isLoading: false,
				onOpen: () => room.openWorkbenchPanel("my-notes", {}, "Notes"),
			},
		],
		// remove a command from the slash menu
		slashCommands: (defaults) =>
			defaults.filter((command) => command.id !== "compact"),
		// add a page to the settings dialog
		settingsSections: (defaults) => [...defaults, myAccountSection],
	},
};
```

- Each function runs during render: keep it pure and cheap, and build the `customize` object
  inside the config's `useMemo`.
- A panel a host adds needs its blueprint in `workbenchPanelComponents` under the same panel
  type. In a new chat it opens on the draft, before the room exists.
- The desktop app's `use-desktop-chat-config.ts` adds its Server page to the settings dialog
  this way.

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

Change state through the stores' actions (`room.closeWorkbench()`, `chat.setSelectedModel(model)`,
...), never by writing to a snapshot.

## Other exports

| Export | What it is |
|---|---|
| `SaveAgentDialog` | Publish a room as an agent. |
| `NewKnowledgeForm` | Create a knowledge base. |
| `RoomComposerMenu`, `RoomComposerMenuProps` | The composer's plus menu, for a host's `customize.composerMenu`. |
| `resolveServerChatTheme`, `mergeChatTheme`, `DEFAULT_CHAT_THEME` | The theme, for a host that lays its own base under the server's. |
| `App`, `MCPConfig`, `Workspace` | Backend types. |

Creating, editing and deleting agents is the web app's (`packages/playground/src/features/agents/`),
which is the only host with agent pages.

## Rules for hosts

- Import only from `@semoss/chat` and its stylesheets, never from `src/`.
- Keep chat behavior in the library. If both apps need it, add it here; if only one does, keep it
  in that app and pass it in through a slot or `ChatConfig`
  ([Customizing the chat](#customizing-the-chat)).
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
