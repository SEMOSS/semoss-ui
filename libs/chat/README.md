# @semoss/chat

The SEMOSS chat as composable React pieces: rooms, messages, tools, the composer, the room's
Workspace, the room list and search, the new-chat screen, and the user's settings dialog, with
the stores behind them.

It is what the two chat apps are made of:
[`@semoss/playground`](../../packages/playground) (web) and
[`@semoss/playground-desktop`](../../packages/playground-desktop) (Electron). A host gives it
one config (its theme, options, callbacks, and its own tools and components) and lays the
pieces out however it likes.

- **Private and source-exported.** One code entry, `@semoss/chat` (`src/index.ts`), and one
  stylesheet, `@semoss/chat/globals.css`. There is no build: the host's Vite compiles the source.
- **Router-free.** The chat never routes itself. It asks the host to open a room or a new chat
  through `ChatConfig.callbacks`, so it works under any router, or none.
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
| `options` | What the chat is configured with, below. |
| `callbacks` | What the chat tells the host, below. Every name starts with `on`. |
| `tools?` | A `ToolsHost`: tools the host runs in the browser, such as the desktop app's folders. See [Host tools](#host-tools). |
| `components?` | The host's own components in the chat's places. See [Customizing the chat](#customizing-the-chat). |

| `options` | What it is |
|---|---|
| `roomHref(roomId)` | A room's link, so a middle click opens it in a new tab. |
| `agentHref?(workspaceId)` | An agent's link. Without it, chat UI shows no agent links. |
| `new?` | The build's `NewChatBuildDefaults` (`modelId`, `modelName`, `mode`, `agentId`), used below the theme's `defaultRoomSettings`. Keep it the same object. |
| `platformUrl?` | Where the SEMOSS platform app is served, for catalog links and tool views that load a platform app. |
| `toolFrameOrigin?` | The origin tool views frame an app's pages from, put before a relative module path, so a tool's page is on another origin than chat UI and cannot script it (the desktop app's second local origin). Without it, pages are framed from the module as it is. |

| `callbacks` | When the chat calls it |
|---|---|
| `onOpenRoom(roomId)` | A room should open, as when a new chat's first message creates one. |
| `onOpenNewChat()` | A new chat should open: when a room cannot load, and after the open room is deleted. |
| `onOpenSettings?(page?)` | Open the settings dialog, on a page when one is named. Without it, chat UI shows no Manage Connectors. |
| `onWorkbenchOpenChange?(isOpen)` | A room's Workspace opened or closed, so the host can make room for it (the playground folds its navigation). |

Build it in a hook, memoized so chat UI only rerenders when the theme or the routes change.
With `react-router` and a hash router:

```tsx
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { type ChatConfig, useServerChatTheme } from "@semoss/chat";

/**
 * The chat's config: the server's theme over the chat's defaults, and this
 * app's routes.
 *
 * @param onOpenSettings - Opens the settings dialog. Keep its identity stable.
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const useMyChatConfig = (
	onOpenSettings: (page?: string) => void,
): ChatConfig => {
	const theme = useServerChatTheme();
	const navigate = useNavigate();

	return useMemo<ChatConfig>(
		() => ({
			theme,
			options: { roomHref: (roomId) => `#/room/${roomId}` },
			callbacks: {
				onOpenRoom: (roomId) => navigate(`/room/${roomId}`),
				onOpenNewChat: () => navigate("/new"),
				onOpenSettings,
			},
		}),
		[theme, navigate, onOpenSettings],
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

`useCreateChatStore` returns the same store while the config's `theme`, `options.new`, `tools`
and `components.WorkbenchPanels` are the same objects; a new one of any makes a new store, so
keep them stable. The rest of the config can change freely.

### The settings dialog

`UserSettingsDialog` is the user's settings. The host hands it its pages: the chat's own, from
`useDefaultSettingsPages()` (General, with theme, language and new chat defaults, then
Connectors), and any of its own. Each page is a `UserSettingsSection`: `{ id, label, icon,
content, footer? }`. The host holds the dialog's state with `useUserSettingsDialog`, renders it
inside the chat's providers, and hands `openSettings` to its config as `callbacks.onOpenSettings`,
which is how chat UI (Manage Connectors) and the host's own menus open it:

```tsx
const settings = useUserSettingsDialog();
const config = useMyChatConfig(settings.openSettings);
const chatPages = useDefaultSettingsPages();
// the chat's pages, then the host's own
const pages = useMemo(() => [...chatPages, myAccountPage], [chatPages]);

<ChatProvider config={config}>
	<UserSettingsDialog
		open={settings.isOpen}
		onOpenChange={settings.setIsOpen}
		section={settings.section}
		onSectionChange={settings.setSection}
		pages={pages}
	/>
	{children}
</ChatProvider>;
```

Anything inside the providers opens it with `useChatConfig().callbacks.onOpenSettings?.()`, or
`onOpenSettings?.("connectors")` for one page. An unknown page shows the first.

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
| `RoomScope` | Opens the room (at once from the store's cache, else by loading it) and provides it. A room that cannot load shows a toast and calls `callbacks.onOpenNewChat`. |
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
first message creates the room and calls `callbacks.onOpenRoom`.

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
deployment's (`theme.defaultRoomSettings`, then `options.new`), and the first available.

### The Workspace and the navigation

Opening a room's Workspace tells the host through `callbacks.onWorkbenchOpenChange`, so it can
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

**Places are components.** `ChatConfig.components` holds the host's own component for each
place it changes. Each is a plain component with no props; the chat draws the frame (the menu,
the rail) and renders the host's component inside it, or its own default. A default is only a
list of exported items, so a host starts from it, adds its own, or lists the items it keeps.
The room menu (the cog and the room list's menu) and the message actions are the chat's own.

| `components` | The place | The default | Built from |
|---|---|---|---|
| `PlusMenu` | The composer's plus menu | `DefaultPlusMenu` | `AttachFilesItem`, `KnowledgeItem`, `ToolsItem`, `ModeChoiceItem`, `ChooseAgentItem`, and the host's `DropdownMenuItem`s; `useComposer()` for the room and its actions |
| `SlashCommands` | The composer's "/" menu | `DefaultSlashCommands` | `SlashCommand`s; `useComposer()` |
| `WorkbenchRail` | The Workspace rail's icons, after its cog | `DefaultWorkbenchRail` | `RailItem`s; `useWorkbench()` for the room and the chat's panels |
| `WorkbenchPanels` | Every panel a Workspace can open, by panel type | `DEFAULT_WORKBENCH_PANEL_COMPONENTS` | The panels' blueprints. Keep the object the same: a new one makes a new chat store and remounts panels. |

Declare the components at module scope, so the config keeps them across renders:

```tsx
import {
	type ChatComponents,
	DEFAULT_WORKBENCH_PANEL_COMPONENTS,
	DefaultPlusMenu,
	DefaultSlashCommands,
	DefaultWorkbenchRail,
	RailItem,
	SlashCommand,
	useComposer,
	useWorkbench,
} from "@semoss/chat";
import { DropdownMenuItem } from "@semoss/ui/next";

/** The chat's plus menu, then Templates. */
const MyPlusMenu = () => {
	const { closeMenu, room } = useComposer();
	return (
		<>
			<DefaultPlusMenu />
			<DropdownMenuItem
				onSelect={() => {
					openTemplates(room.roomId);
					closeMenu();
				}}
			>
				<LayoutTemplateIcon aria-hidden="true" />
				Templates
			</DropdownMenuItem>
		</>
	);
};

/** The chat's "/" commands, then Templates in the Chat group. */
const MySlashCommands = () => {
	const { room } = useComposer();
	return (
		<>
			<DefaultSlashCommands />
			<SlashCommand
				name="templates"
				group="chat"
				label="Templates"
				description="Start from a template"
				icon={<LayoutTemplateIcon />}
				onSelect={() => openTemplates(room.roomId)}
			/>
		</>
	);
};

/** The chat's rail icons, then Notes, which opens the host's own panel. */
const MyWorkbenchRail = () => {
	const { room } = useWorkbench();
	return (
		<>
			<DefaultWorkbenchRail />
			<RailItem
				label="Notes"
				icon={<NotebookIcon className="size-4" />}
				onOpen={() => room.openWorkbenchPanel("my-notes", {}, "Notes")}
				panel={{ type: "my-notes", config: {} }}
			/>
		</>
	);
};

const MY_COMPONENTS: ChatComponents = {
	PlusMenu: MyPlusMenu,
	SlashCommands: MySlashCommands,
	WorkbenchRail: MyWorkbenchRail,
	WorkbenchPanels: {
		...DEFAULT_WORKBENCH_PANEL_COMPONENTS,
		"my-notes": MY_NOTES_PANEL,
	},
};

// in the config: components: MY_COMPONENTS
```

- An item hides itself where it cannot run (the agent picker in an open room, Compact in a new
  chat) and locks itself while a turn runs (`useComposer().isBusy`).
- A `SlashCommand` draws nothing: it adds itself to the "/" menu while it is mounted, in the
  order it is placed, and the menu searches and groups them. Return null for a command that
  cannot run.
- A panel a host adds needs its blueprint in `WorkbenchPanels` under the same panel type.
- The settings dialog's pages are composed, not configured: see
  [The settings dialog](#the-settings-dialog).
- The desktop app adds Attach Folder to the plus menu and "/" this way
  (`desktop-plus-menu.tsx`, `desktop-slash-commands.tsx`).

### Host tools

`ChatConfig.tools` is a `ToolsHost`: tools the host runs in the browser for a room, such as the
desktop app's tools over the folders the user attaches from the machine. It is framework-free,
since the room store uses it. The chat:

- offers a room's tools (`list(roomId)`) to the model with every chat turn, and keeps them in an
  agent room's toolbox, again whenever the host calls `subscribe`'s listener with no argument;
- runs a call with the tool's `run(args)`, at once or once the user allows it, as the room's
  `defaultTools` setting under the tool's `modeKey` (its name by default) says, else its
  `usualMode`;
- answers an agent run's paused call the same way, and with `unavailableMessage` when the room
  does not have the tool here;
- marks the calls the host `owns` as its own by name, so past calls render before it loads;
- lists `files(roomId)` in the Files panel beside Room Files, with the host's actions on its
  files and the chat's Add to Context, and refreshes a mount's explorer when the listener is
  called with `{ mountId }`;
- calls `load(roomId)` once a room is open, and `discard(roomId)` when a new chat is left
  before its first message.

```ts
import type { ClientTool, ToolsHost } from "@semoss/chat";

/** One tool that has nothing to do with files. */
const CLOCK: ClientTool = {
	name: "host_now",
	title: "Current Time",
	description: "The time on the user's machine.",
	inputSchema: { type: "object", properties: {}, required: [] },
	usualMode: "auto",
	run: async () => ({ isError: false, payload: { now: new Date().toISOString() } }),
};

/** Module scope, or made once per window: a new host makes a new chat store. */
export const MY_TOOLS: ToolsHost = {
	owns: (name) => name.startsWith("host_"),
	list: () => [CLOCK],
	subscribe: () => () => undefined,
	unavailableMessage: "This tool runs only in the desktop app.",
};
```

A host that offers a folder of its own as tools reuses the chat's folder tools:
`describeFolderTool(space, operation)` for each of `FOLDER_TOOL_OPERATIONS`, and
`executeFolderTool(folder, name, args)` to run one against a `ToolFolder`. The desktop app's
`features/local-folders/desktop-tools-host.ts` is the reference.

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
