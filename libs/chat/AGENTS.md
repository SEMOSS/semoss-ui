# AGENTS.md - @semoss/chat

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Read the
> [React standard](../../skills/react-standard.skill.md), the
> [state management skill](../../skills/state-management.skill.md) and the
> [SDK chat skill](../../skills/sdk-chat.skill.md) before changing this package.

`@semoss/chat` is the chat: rooms, messages, tools, the composer, the room's Workspace, the room
list, the new-chat screen and the user's settings dialog, with their stores. Two apps compose it:
[`@semoss/playground`](../../packages/playground/AGENTS.md) (web) and
[`@semoss/playground-desktop`](../../packages/playground-desktop/AGENTS.md) (Electron). It is
source-exported, private, and has no build step.

This guide is the map for changing the library. How a host uses it (wiring, composing, customizing)
is in the [README](./README.md).

## The boundary

- **If both apps need it, it lives here. If only one does, it stays in that app.**
- Library code never imports `react-router`, Electron, `window.semossDesktop`, `import.meta.env`,
  or anything from `packages/*`.
- What only the host knows (routes, env defaults, the platform's URL, what its deployment turns
  on, the tools it runs in the browser, its own panels and menu entries) arrives through one
  object, `ChatConfig` (`features/chat/config/chat-config.context.tsx`): `options` (typed in the
  chat's words, `features/chat/config/chat-options.ts`), `callbacks` (every name starts with
  `on`), `tools`, `components` and `workbenchPanels`. A host passes it to `ChatProvider`, the
  only provider it uses.
- **The chat knows no theme.** A host that has one (the playground's `THEME_MAP`, read with
  `usePlaygroundServerTheme` from `@semoss/shared`) turns it into `options` and into the pieces it
  places. No chat source names `ThemeMap` or the theme's helpers; `src/architecture.test.ts`
  fails when one does. A new deployment setting is a typed `ChatOptions` field with a default in
  `DEFAULT_CHAT_OPTIONS`, or a piece a host places, never a theme read. What only one app does, such as the desktop app's
  folders, lives in that app and reaches the chat through `tools` and `components`.
- `src/index.ts` is the only code entry; `./globals.css` holds only the chat's own styles, and a host imports it beside the other libraries'. A name a host needs is
  exported there, from its defining file.

## Where a change goes

| You are changing | Folder under `src/features/` | Read first |
|---|---|---|
| What a host passes in: options, callbacks, tools, components | `chat/config/` | [README](./README.md) |
| `ChatProvider` and the session's context | `chat/provider/` | |
| The session: models, the room cache, creating and deleting rooms | `chat/store/` (`ChatStore`) | [State](./docs/state.md) |
| One room's state: options, messages, tool calls, the Workbench controller | `room/store/` (`RoomStore`) | [State](./docs/state.md) |
| How a turn runs: chat stream, agent run, saving tool results, cancel | `room/turns/` | [State](./docs/state.md) |
| Opening a room, its layout (`RoomFrame`, `SplitLayout`, `useWorkbenchNavigation`), header, name | `room/scope/`, `room/layout/`, `room/header/` | [Workspace](./docs/workbench.md) |
| Favorite, Rename, Publish as Agent, Download, Delete | `room/actions/` | |
| The room's Settings panel, its Tools section | `room-settings/`, `room-settings/tools/` | [Tools](./docs/tools.md) |
| Messages and markdown; follow-up suggestions | `conversation/messages/`, `conversation/suggestions/` | |
| The composer and the editor plugins; `useComposer` | `conversation/composer/` (`editor/`) | |
| The plus menu's items and `DefaultPlusMenu` | `conversation/composer/plus-menu/` | [README](./README.md#customizing-the-chat) |
| The "/" menu: `SlashCommand`, its registry, `DefaultSlashCommands` | `conversation/composer/slash-command/` | [Workspace](./docs/workbench.md#slash-menu) |
| Files queued for the next message, file drop | `conversation/attachments/` | [Tools](./docs/tools.md#files-queued-for-the-next-message) |
| Default folder tools, Room Files, a host's client tools (`ToolsHost`) | `tools/chat-tools/` | [Tools](./docs/tools.md) |
| How a tool call is drawn; its inspector | `tools/views/`, `tools/inspector/` | [Tools](./docs/tools.md#tool-views) |
| The agent, knowledge and toolbox picker | `tools/mcp/` | |
| The Workspace's panels and rail (`DEFAULT_WORKBENCH_PANELS`, `WorkbenchRailItem`, `DefaultWorkbenchRail`, `useWorkbenchRail`) | `workbench/panels/`, `workbench/rail/` | [Workspace](./docs/workbench.md) |
| Connector catalog, the user's tools file, sign in, viewers, the Connectors settings page | `connectors/store/`, `accounts/`, `viewers/`, `settings/` | [Connectors](./docs/connectors.md) |
| The room history: the list and search (`RoomHistory`) | `room-history/` | |
| The new-chat screen and its draft (`useDraftRoom`, `useDraftPanels`, `usePreparedRoom`) | `new-chat/` | [Workspace](./docs/workbench.md) |
| The user's settings dialog, and the chat's sections (`useDefaultUserSettingsSections`) | `user-settings/` | |
| Backend shapes | `src/types.ts` | |

Tests sit beside their source. Test helpers are in `src/test/`.

## Rules that tell you what a change can break

1. **`store/` and `turns/` folders hold no components and import no React.** Only their
   `use-*.ts` hooks do; they are how React reads a store. A store that needs something from chat UI
   takes it as an argument, as `ChatStore` takes its `workbenchPanels`. `src/architecture.test.ts`
   fails when this is broken. So a change in a `store/` or `turns/` file can break any UI, and a
   change in UI cannot break a store.
2. **A host changes the chat in two ways only.** Layout and controls are composition: the host
   places pieces and fills slots (`leading`, `trailing`, `header`, `workbench`, children,
   `RoomConversation`'s `suggestions`), and hands `UserSettingsDialog` its `sections`. The chat's
   places are components: `ChatConfig.components` holds the host's `PlusMenu`, `SlashCommands`
   and `WorkbenchRail` (plain components with no props, made of the chat's exported items), and
   the chat renders each inside its own frame, or its default; `null` for `PlusMenu` or
   `SlashCommands` places no menu. The panels are data, `ChatConfig.workbenchPanels`; a room
   panel left out leaves the rail and the "/" menu. `NewChat` takes the host's `banner`,
   `backdrop` and `welcome`. An item reads its place's hook (`useComposer`, `useWorkbenchRail`), hides itself where
   it cannot run and locks itself while a turn runs. Do not add a boolean prop to hide a part, a
   list function beside a slot, or a second way to pass host data. The room menu and the message
   actions are not slots yet: a host keeps or leaves out their entries with
   `options.roomActions` and `options.messageActions`, which are handed the chat's list (room
   actions apply to the room's menu, the room history's, and the "/" Room group).
3. **One config.** The host's `ChatConfig` goes to `ChatProvider`, which feeds the store
   (`useCreateChatStore`) and chat UI (`ChatConfigProvider`). The store lasts while `tools` and
   `workbenchPanels` keep their identity; new options reach it through `ChatStore.setOptions`. A
   new host input is a `ChatConfig` field, never a second argument.
4. **Every store is on `StoreState`** and is read through its selector hook:

   | Store | Hook |
   |---|---|
   | `ChatStore` (`useChatSession()`) | `useChatSelector` |
   | `RoomStore` | `useRoomSelector` |
   | `ResponseMessageStore`, `InputMessageStore`, `ToolStore` (views over the room) | `useMessage`, `useTool` |
   | `ConnectorsStore` | `useConnectors` |
   | `ContextItemsStore` | `useContextItems` |

   `room.workbench` is the dock's Zustand store until `@semoss/workbench` moves. The "/" menu's
   registry is a `StoreState` the composer holds (`slash-command-registry.context.tsx`). Of these
   hooks only `useChatSession` is exported; the rest are the chat's own.
5. **Never send `DeleteInsightAssets` an empty path**: it clears the room's whole file space. See
   [Tools](./docs/tools.md#chat-tools).

## Naming

- **One word per concept**, in code, comments, tests and these notes:

  | Concept | In code | In user-facing copy |
  |---|---|---|
  | An open room; a new chat's room before its first message | room (`RoomScope`); draft (`isDraft`, `draftPanels`, `useDraftRoom`) | |
  | The new-chat screen | new chat (`NewChat`) | New chat |
  | The user's rooms listed outside a room | room history (`RoomHistory`) | |
  | Messages and composer | conversation (`RoomConversation`) | "Chat" is the chat mode |
  | The right-hand dock | workbench (`RoomWorkbench`, `room.openWorkbenchPanel`, `room.workbenchPane`) | Workspace |
  | The dock's icon rail and its entries | workbench rail (`useWorkbenchRail`, `WorkbenchRailItem`) | |
  | What a Workspace can open, by panel type | workbench panels (`workbenchPanels`, `DEFAULT_WORKBENCH_PANELS`) | |
  | The room's Settings panel | room settings (`RoomSettingsForm`, `ROOM_SETTINGS_PANEL`) | Settings |
  | The room's activity log | activity log (`ROOM_ACTIVITY_LOG_PANEL`, `ROOM_PANEL_TYPES.ACTIVITY_LOG`) | Activity |
  | The user's settings dialog, and one tab of it | user settings (`UserSettingsDialog`); section (`UserSettingsSection`) | Settings |
  | A new chat's starting model, mode and agent | defaults (`new-chat-defaults.ts`, `UserNewChatDefaults`) | |
  | The room's own folder | Room Files | Room Files |
  | Tools a host runs in the browser | client tools (`room.toolsHost`, `ToolsHost`) | |
  | A tool the host runs in the browser | client tool | |

  `Workspace` in `src/types.ts` is the backend's agent type, and `"sidebar"` is the backend's
  `displayLocation` value and an i18n namespace; neither is the dock. Ids and i18n keys tied to
  copy keep "workspace" (`close-workspace`, `room:workbench.closeWorkspace`). The dock's copy
  keys are under `room:workbench.*`, and its "/" group is `workbench`; `room:studio.*` holds
  other copy. `src/architecture.test.ts` fails when a retired name comes back.
- **A file is named for its main export**, in kebab-case: `room-header.tsx` exports `RoomHeader`,
  `use-room-actions.ts` exports `useRoomActions`. Role suffixes are `.store.ts` (holds state on
  `StoreState`), `.context.tsx`, `.test.ts(x)`, and `use-*.ts` for hooks; nothing else.
- **`Room*` on a component means it needs a room or lists rooms** (inside `RoomScope`, a `room`
  prop, or the room history), whichever folder it is in. A layout that needs neither is
  `SplitLayout`.
- **`Store` means it holds state.** A stateless helper of the room is named for what it does
  (`ChatTools`, `RoomRequests`, `RoomWorkbenchController`, `ChatTurnRunner`).

## Commands

Run from `libs/chat`, or with `pnpm --filter @semoss/chat <command>`:

| Command | Description |
|---|---|
| `pnpm test` | Run the tests once (Vitest, jsdom) |
| `pnpm test:watch` | Run the tests in watch mode |
| `pnpm check-types` | TypeScript type checking |

There is no build: the hosts compile the source. Try a change in a host with the root
`pnpm dev:playground`, and run both hosts' type checks after changing an export.
