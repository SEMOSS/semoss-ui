# AGENTS.md - @semoss/chat

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).
> Rooms, AskRoom jobs and agent runs: the [SDK guide](../sdk/AGENTS.md#skills).

## Purpose

The chat: rooms, messages, tools, the composer, the room's Workspace, the room list, the new-chat
screen and the user's settings dialog, with their stores. Two apps compose it:
[`@semoss/playground`](../../packages/playground/AGENTS.md) (web) and
[`@semoss/playground-desktop`](../../packages/playground-desktop/AGENTS.md) (Electron). It is
private and source-exported, with no build step. How a host wires, composes and customizes it is
in the [README](./README.md); how it works inside is in [docs/](./docs/).

## Boundaries

- **If both apps need it, it lives here. If only one does, it stays in that app.**
- **Must not import:** `react-router`, Electron, `window.semossDesktop`, `import.meta.env`, or
  anything from `packages/*`.
- **The chat knows no theme.** A host turns its theme (the playground's `THEME_MAP`) into
  `options` and into the pieces it places; no chat source names `ThemeMap` or the theme's
  helpers. A new deployment setting is a typed `ChatOptions` field with a default in
  `DEFAULT_CHAT_OPTIONS`, or a piece a host places, never a theme read. What only one app does,
  such as the desktop app's folders, reaches the chat through `tools` and `components`.
- **`src/index.ts` is the only code entry**, exporting each name a host needs from its defining
  file. `./globals.css` holds only the chat's own styles; a host imports it beside the other
  libraries'.

## Where a change goes

Under `src/features/`. Tests sit beside their source; test helpers are in `src/test/`.

| You are changing | Folder | Read first |
|---|---|---|
| What a host passes in; `ChatProvider` | `chat/config/`, `chat/provider/` | [README](./README.md) |
| The session (`ChatStore`); one room (`RoomStore`); how a turn runs | `chat/store/`, `room/store/`, `room/turns/` | [State](./docs/state.md) |
| Opening a room, its layout, header and name | `room/scope/`, `room/layout/`, `room/header/` | [Workspace](./docs/workbench.md) |
| Favorite, Rename, Publish as Agent, Download, Delete | `room/actions/` | |
| The room's Settings panel and its Tools section | `room-settings/` | [Tools](./docs/tools.md) |
| Messages, markdown, follow-up suggestions | `conversation/messages/`, `conversation/suggestions/` | |
| The composer, its editor, the plus menu, the "/" menu | `conversation/composer/` | [README](./README.md#customizing-the-chat) |
| Files queued for the next message, file drop | `conversation/attachments/` | [Tools](./docs/tools.md#files-queued-for-the-next-message) |
| Folder tools, Room Files, a host's client tools; tool views; the MCP picker | `tools/` | [Tools](./docs/tools.md) |
| The Workspace's panels and rail | `workbench/` | [Workspace](./docs/workbench.md) |
| Connectors: catalog, sign in, viewers, settings page | `connectors/` | [Connectors](./docs/connectors.md) |
| The room history; the new-chat screen; the user's settings dialog | `room-history/`, `new-chat/`, `user-settings/` | |
| Backend shapes | `src/types.ts` | |

## Invariants

`src/architecture.test.ts` fails when rule 1, the theme boundary, or a retired name breaks.

1. **`store/` and `turns/` hold no components and import no React**, except their `use-*.ts`
   hooks. A store that needs something from chat UI takes it as an argument, as `ChatStore` takes
   its `workbenchPanels`. So a store change can break any UI, and a UI change cannot break a store.
2. **One config.** A host passes one `ChatConfig` (`chat/config/chat-config.context.tsx`) to
   `ChatProvider`, the only provider it uses: `options`, `callbacks` (each named `on…`), `tools`,
   `components`, and `workbenchPanels`. The store lasts while `tools` and `workbenchPanels` keep
   their identity; new options reach it through `ChatStore.setOptions`. A new host input is a
   `ChatConfig` field, never a second argument.
3. **A host changes the chat in two ways only.** It composes: placing pieces, filling slots
   (`leading`, `trailing`, `header`, `workbench`, children, `RoomConversation`'s `suggestions`),
   and handing `UserSettingsDialog` its `sections`. And it fills the chat's places:
   `ChatConfig.components` (`PlusMenu`, `SlashCommands`, `WorkbenchRail`, `WorkbenchFileRoots`,
   prop-less components made of the chat's exported items; `null` places no menu) and
   `workbenchPanels` (a room panel left out leaves the rail and the "/" menu). An item reads its
   place's hook (`useComposer`, `useWorkbenchRail`), hides itself where it cannot run, and locks
   while a turn runs. Never add a boolean prop to hide a part, a list function beside a slot, or
   a second way to pass host data. The room menu and message actions are not slots yet:
   `options.roomActions` and `options.messageActions` filter the chat's list.
4. **Every store is on `StoreState`**, read through its selector hook ([State](./docs/state.md)).
   `room.workbench` is the dock's Zustand store until `@semoss/workbench` moves; the "/" menu's
   registry is a `StoreState` the composer holds.
5. **Never send `DeleteInsightAssets` an empty path**: it clears the room's whole file space
   ([Tools](./docs/tools.md#chat-tools)).

## Glossary

One word per concept, in code, comments, tests, and docs:

| Concept | In code | In UI copy |
|---|---|---|
| An open room; a new chat's room before its first message | room (`RoomScope`); draft (`isDraft`, `useDraftRoom`) | |
| The new-chat screen | new chat (`NewChat`) | New chat |
| The user's rooms listed outside a room | room history (`RoomHistory`) | |
| Messages and composer | conversation (`RoomConversation`) | "Chat" is the mode |
| The right-hand dock, its icon rail, what it can open | workbench (`RoomWorkbench`), workbench rail, workbench panels | Workspace |
| The room's Settings panel; its activity log | room settings (`RoomSettingsForm`); activity log | Settings; Activity |
| The user's settings dialog and one tab of it | user settings (`UserSettingsDialog`); section | Settings |
| A new chat's starting model, mode and agent | defaults (`UserNewChatDefaults`) | |
| The room's own folder | Room Files | Room Files |
| Tools a host runs in the browser | client tools (`ToolsHost`) | |

- `Workspace` in `src/types.ts` is the backend's agent type, and `"sidebar"` is the backend's
  `displayLocation` and an i18n namespace; neither is the dock. Ids and i18n keys tied to copy
  keep "workspace" (`close-workspace`); the dock's copy is under `room:workbench.*`.
- **`Room*`** on a component means it needs a room or lists rooms; a layout that needs neither is
  `SplitLayout`. **`Store`** means it holds state; a stateless helper is named for what it does
  (`ChatTools`, `RoomRequests`, `ChatTurnRunner`).

## Validation

```bash
pnpm --filter @semoss/chat test
pnpm --filter @semoss/chat check-types
pnpm --filter @semoss/playground type-check          # after changing an export
pnpm --filter @semoss/playground-desktop type-check  # likewise
```

There is no build: the hosts compile the source. Try a change in a host with the root
`pnpm dev:playground`.
