# @semoss/chat

The SEMOSS chat as composable React pieces: rooms, messages, tools, the composer, the room's
Workspace, the room history and search, the new-chat screen, and the user's settings dialog, with
the stores behind them.

It is what the two chat apps are made of:
[`@semoss/playground`](../../packages/playground) (web) and
[`@semoss/playground-desktop`](../../packages/playground-desktop) (Electron). A host gives it
one config (its options, callbacks, and its own tools and components) and lays the
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
| `options` | What the chat is configured with, below. The chat knows no theme: a host that has one (the playground's `THEME_MAP`) turns it into these options and into the pieces it places. |
| `callbacks` | What the chat tells the host, below. Every name starts with `on`. |
| `tools?` | A `ToolsHost`: tools the host runs in the browser, such as the desktop app's folders. See [Host tools](#host-tools). |
| `components?` | The host's own components in the chat's places. See [Customizing the chat](#customizing-the-chat). |
| `workbenchPanels?` | Every panel a room's Workspace can open, by panel type. Default: `DEFAULT_WORKBENCH_PANELS`. See [Customizing the chat](#customizing-the-chat). |

Every option but `roomHref` is optional; the chat fills each one left out (or `undefined`) from
`DEFAULT_CHAT_OPTIONS`. New options reach the same chat store and its rooms, so a deployment's
settings can arrive after the chat started.

| `options` | What it is (default) |
|---|---|
| `roomHref(roomId)` | A room's link, so a middle click opens it in a new tab. |
| `agentHref?(workspaceId)` | An agent's link. Without it, chat UI shows no agent links. |
| `catalogItemHref?(item)` | A knowledge or toolbox item's page on the platform, which the catalog pickers link to. Without it, they show no platform links. |
| `platformUrl?` | Where the SEMOSS platform app is served, for catalog links and tool views that load a platform app. |
| `toolFrameOrigin?` | The origin tool views frame an app's pages from, put before a relative module path, so a tool's page is on another origin than chat UI and cannot script it (the desktop app's second local origin). Without it, pages are framed from the module as it is. |
| `appName?` | Titles a downloaded room ("Chat"). |
| `newChat?` | The `modelId` (and `modelName`, shown while models cannot be picked), `mode`, `agentId`, `temperature` and `tools` a new chat starts with when neither this login session nor the user names one. |
| `agentMode?` | How a new chat's mode is chosen: `chat-only` (default), `choice` (the Chat and Agent choice), `follows-agent` (the agent picker decides), or `agent-only`. |
| `isModelSelectable?`, `isTemperatureEditable?` | Whether users pick a chat's model (true) and set its temperature (false). |
| `hasPromptOptimizer?`, `isTableExportable?` | The composer's optimizer (true), and export on a response's tables (false). |
| `hasFeedbackComment?` | Whether rating a response asks for a comment (true). |
| `hasSystemCatalogItems?` | Whether the catalog pickers list items tagged SYSTEM (true). |
| `shouldMakeKnowledgeMcp?`, `isEmbedderSelectable?`, `defaultEmbedderId?` | A new knowledge source is made an MCP (true); its embedder can be picked (true), starting from this one. |
| `allowedFileTypes?`, `fileDragDisclaimer?` | The extensions sent to the model with a message (all), and a note while files are dragged in. |
| `allowedUrlPrefixes?` | Link prefixes a response may use beside the chat's own. |
| `toolAutoExecutionLimit?`, `compactionStrategy?` | How many auto tool calls run at once (5), and how context is compacted until the user picks (`AUTO`). |
| `gracefulErrors?` | `{ pattern, errorKey }` or `{ pattern, text }` rules that turn an error into the message shown. |
| `roomActions?(actions)`, `messageActions?(actions)` | Handed the chat's room actions (`favorite`, `publish`, `rename`, `download`, `delete`) or a response's (`rewrite`, `feedback`, `copy`, `download`), they return the ones the host keeps. Room actions apply to the room's menu, the room history's, and the "/" menu's Room group. Default: all. |

| `callbacks` | When the chat calls it |
|---|---|
| `onOpenRoom(roomId)` | A room should open, as when a new chat's first message creates one. |
| `onOpenNewChat()` | A new chat should open: when a room cannot load, and after the open room is deleted. |
| `onOpenSettings?(section?)` | Open the settings dialog, on a section when one is named. Without it, chat UI shows no Manage Connectors. |
| `onWorkbenchOpenChange?(isOpen)` | A room's Workspace opened or closed, so the host can make room for it (the playground folds its navigation). |

Build it in a hook, memoized so chat UI only rerenders when something in it changes. With
`react-router` and a hash router:

```tsx
import { useMemo } from "react";
import { useNavigate } from "react-router";
import type { ChatConfig, ChatOptions } from "@semoss/chat";

/**
 * The chat's config: this app's options and routes.
 *
 * @param onOpenSettings - Opens the settings dialog. Keep its identity stable.
 * @returns The config, the same object while the router is unchanged.
 */
export const useMyChatConfig = (
	onOpenSettings: (section?: string) => void,
): ChatConfig => {
	const navigate = useNavigate();
	const options = useMemo<ChatOptions>(
		() => ({
			roomHref: (roomId) => `#/room/${roomId}`,
			isTemperatureEditable: true,
		}),
		[],
	);

	return useMemo<ChatConfig>(
		() => ({
			options,
			callbacks: {
				onOpenRoom: (roomId) => navigate(`/room/${roomId}`),
				onOpenNewChat: () => navigate("/new"),
				onOpenSettings,
			},
		}),
		[options, navigate, onOpenSettings],
	);
};
```

The playground and the desktop app read the deployment's `THEME_MAP` (`usePlaygroundServerTheme`
from `@semoss/shared`) and turn it into options with `playgroundThemeChatOptions` (also in
`@semoss/shared`, typed without the chat's types), and into the pieces they place: no plus or "/" menu where
the theme hides tools in a frame, `workbenchPanels` without the activity log, follow-up
suggestions, room dates, the color modes Settings offers, and the banner and landing of a new
chat.

### The providers

`ChatProvider` makes the session's chat store and provides it with the config; it is the only
way in. Put it inside the router (the config navigates) and the session gate:

```tsx
import { Outlet } from "react-router";
import { ChatProvider } from "@semoss/chat";

/** The signed in shell: the chat's providers around the room history and the route. */
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

The store lasts while the config's `tools` and `workbenchPanels` are the same objects; a new one
of either makes a new store and drops the old one's rooms. New options and callbacks reach the
same store.

### The settings dialog

`UserSettingsDialog` is the user's settings. The host hands it its sections: the chat's own, from
`useDefaultUserSettingsSections({ colorModes? })` (General, with color mode, language and new
chat defaults, then Connectors; General offers no color choice with fewer than two modes), and
any of its own. Each section is a `UserSettingsSection`: `{ id, label, icon, content, footer? }`. The host holds the dialog's state with `useUserSettingsDialog`, renders it
inside the chat's providers, and hands `openSettings` to its config as `callbacks.onOpenSettings`,
which is how chat UI (Manage Connectors) and the host's own menus open it:

```tsx
const settings = useUserSettingsDialog();
const config = useMyChatConfig(settings.openSettings);
const chatSections = useDefaultUserSettingsSections();
// the chat's sections, then the host's own
const sections = useMemo(
	() => [...chatSections, myAccountSection],
	[chatSections],
);

<ChatProvider config={config}>
	<UserSettingsDialog
		open={settings.isOpen}
		onOpenChange={settings.setIsOpen}
		section={settings.section}
		onSectionChange={settings.setSection}
		sections={sections}
	/>
	{children}
</ChatProvider>;
```

The host's own menus call `settings.openSettings()`, or `openSettings("connectors")` for one
section; pass it down as a prop. An unknown section shows the first.

### The room history

`RoomHistory` is the user's rooms with search across them, opened from the list or with Cmd+K
(Ctrl+K elsewhere). Place it in `@semoss/ui/next`'s `Sidebar`: the list loads and pages only while
the sidebar shows.

```tsx
import { useMatch } from "react-router";
import { RoomHistory } from "@semoss/chat";
import { Sidebar } from "@semoss/ui/next";

/** The user's rooms, with the open one marked. */
export const MySidebar = () => {
	const roomMatch = useMatch("/room/:roomId");
	return (
		<Sidebar>
			<RoomHistory activeRoomId={roomMatch?.params.roomId} hasRoomDates />
		</Sidebar>
	);
};
```

A host that hides the history leaves `RoomHistory` out.

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
| `SplitLayout` | The same layout for a room you pass in, with `isWorkbenchOpen` and `onWorkbenchClose` in your hands. |
| `RoomHeader` | The room's name (double-click to rename) and the Workspace toggle; `leading` holds your controls before the name. |
| `RoomTitle` | The room's name alone. |
| `RoomWorkbench` | The Workspace: a dock with Files, Settings, tool and connector panels, and its panel rail. |
| `RoomWorkbenchToggle` | The Workspace's open and close button, for a header of your own. |
| `RoomConversation` | The messages and the composer together. Its `suggestions` follow the last response: default `RoomSuggestions`, null for none. |
| `RoomMessages`, `RoomComposer` | The two halves, to lay out apart. `RoomMessages` takes the same `suggestions`. |
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
export const NewChatPage = () => {
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
| `headerLeading` | Your controls at the start of the header. |
| `banner` | What runs across the top, such as `<NewChatBanner html backgroundColor textColor />`. Default: nothing. |
| `backdrop` | What fills the space behind the landing, such as `<NewChatBackdrop src darkSrc />`. Default: nothing. |
| `welcome` | The welcome above the composer. Default: `<NewChatWelcome />`, the chat's welcome to the user; give it a `description` for a line under it, or `html` for your own. |

The model, mode and agent a new chat starts with come, in order, from what this login session
last used, the user's default (their metadata, set in the playground's Settings > General), the
host's (`options.newChat`), and the first available.

### The Workspace and the navigation

Opening a room's Workspace tells the host through `callbacks.onWorkbenchOpenChange`, so it can
fold its navigation while the Workspace is open. `useWorkbenchNavigation(isPreferredOpen,
onPreferenceChange)` does that without touching the user's saved preference: hand its
`setIsWorkbenchOpen` to the callback, and drive the sidebar with `isNavigationOpen` and
`setIsNavigationOpen`, as both apps do. Without the callback nothing happens.

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
| `RoomConversation`'s or `RoomMessages`' `suggestions` | After the last response. Default `RoomSuggestions`; null for none. |
| `RoomHistory`'s `hasRoomDates` | Whether each room shows its date. |

**Places are components.** `ChatConfig.components` holds the host's own component for each
place it changes. Each is a plain component with no props; the chat draws the frame (the menu,
the rail) and renders the host's component inside it, or its own default. A default is only a
list of exported items, so a host starts from it, adds its own, or lists the items it keeps.
The room menu (the cog and the room history's menu) and the message actions are the chat's own;
a host keeps or leaves out their entries with `options.roomActions` and `options.messageActions`.

| `components` | The place | The default | Built from |
|---|---|---|---|
| `PlusMenu` | The composer's plus menu | `DefaultPlusMenu` | `AttachFilesItem`, `KnowledgeItem`, `ToolsItem`, `ModeItem`, `AgentItem`, and the host's `DropdownMenuItem`s; `useComposer()` for the room and its actions |
| `SlashCommands` | The composer's "/" menu | `DefaultSlashCommands` | `SlashCommand`s; `useComposer()` |
| `WorkbenchRail` | The Workspace rail's icons, after its cog | `DefaultWorkbenchRail` | `WorkbenchRailItem`s; `useWorkbenchRail()` for the room and the chat's panels |
| `WorkbenchFileRoots` | The host's trees in a room's Files, after Room Files; draws nothing | none | One component per tree calling a per-mode explorer hook (`useSourceFileExplorer`, …) with `useDockFileOptions` and `useFileExplorerRoot`; `useRoom()` for the room |

`PlusMenu: null` or `SlashCommands: null` places no menu. The panels themselves are data, not a
component: `ChatConfig.workbenchPanels`, every panel a Workspace can open by panel type, default
`DEFAULT_WORKBENCH_PANELS`. Keep that object the same: a new one makes a new chat store and
remounts panels. A room panel left out, such as `ROOM_PANEL_TYPES.ACTIVITY_LOG`, leaves the rail
and the "/" menu too.

Declare the components at module scope, so the config keeps them across renders:

```tsx
import {
	type ChatComponents,
	DEFAULT_WORKBENCH_PANELS,
	DefaultPlusMenu,
	DefaultSlashCommands,
	DefaultWorkbenchRail,
	WorkbenchRailItem,
	SlashCommand,
	useComposer,
	useWorkbenchRail,
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
	const { room } = useWorkbenchRail();
	return (
		<>
			<DefaultWorkbenchRail />
			<WorkbenchRailItem
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
};

const MY_PANELS = {
	...DEFAULT_WORKBENCH_PANELS,
	"my-notes": MY_NOTES_PANEL,
};

// in the config: components: MY_COMPONENTS, workbenchPanels: MY_PANELS
```

- An item hides itself where it cannot run (the agent picker in an open room, Compact in a new
  chat) and locks itself while a turn runs (`useComposer().isBusy`).
- A `SlashCommand` draws nothing: it adds itself to the "/" menu while it is mounted, in the
  order it is placed, and the menu searches and groups them. Return null for a command that
  cannot run.
- A panel a host adds needs its blueprint in `workbenchPanels` under the same panel type.
- The settings dialog's sections are composed, not configured: see
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
- puts `files(roomId)` in the Files panel: the host's actions on the files of the trees its
  `WorkbenchFileRoots` adds, and the chat's Add to Context;
  and refreshes a mount's explorer when the listener is called with `{ mountId }`;
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

The stores are framework-free (`StoreState` from `@semoss/utility/store`). A host reads them
through the hooks of the places it fills: `useComposer()` in the plus and "/" menus,
`useWorkbenchRail()` in the rail, `useRoom()` inside `RoomScope`, and `useChatSession()` for the
session's `ChatStore` (`{ chat }`, throws outside `ChatProvider`). Change state through the
stores' actions (`room.closeWorkbench()`, `chat.pinRoom(roomId, true)`, ...), never by writing to
a snapshot.

## Other exports

| Export | What it is |
|---|---|
| `SaveAgentDialog` | Publish a room as an agent. |
| `NewKnowledgeForm` | Create a knowledge base. |
| `NewChatBanner`, `NewChatBackdrop`, `NewChatWelcome` | The pieces a host places in `NewChat`'s `banner`, `backdrop` and `welcome`. |
| `RoomSuggestions` | Follow-up prompts after the last response, for `suggestions`. |
| `ROOM_PANEL_TYPES` | The room's own panel types, as in leaving `ROOM_PANEL_TYPES.ACTIVITY_LOG` out of `workbenchPanels` to drop the activity log. |

Backend types (`App`, `MCPConfig`, `Workspace`) and `useAgentWorkspace` are `@semoss/shared`'s.

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

Tests use Vitest with jsdom, declared directly and kept aligned with both playground hosts.

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
