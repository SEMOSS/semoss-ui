# State in @semoss/chat

> Part of the [chat guide](../AGENTS.md). How the stores hold the conversation, and the rules that keep a streamed token cheap. Read it before changing a store, a turn runner, or how a component reads either.

Every store is on `StoreState` (see the
[state management skill](../../skills/state-management.skill.md)), and the library has no MobX.
Each keeps its getters, which read its snapshot; React reads them through a selector hook:

| Store | Hook | Hears about |
|---|---|---|
| `ChatStore` (`useChatSession()`) | `useChatSelector(chat, (chat) => …)` | its models, cached and optimistic rooms, and the room list counter |
| `RoomStore` | `useRoomSelector(room, (room) => …)` | the room, which holds its whole conversation and every tool call |
| `ResponseMessageStore`, `InputMessageStore` (views over the room) | `useMessage(message, (message) => …)` | the room; the component renders only when what it selects from its message changes |
| `ToolStore` (a view over the room) | `useTool(tool, (tool) => …)` | the room, likewise for that call |
| `ConnectorsStore` | `useConnectors(room.connectors)` | the room's connectors |
| `ContextItemsStore` | `useContextItems(room.contextItems, (snapshot) => …)` | the next message's queue |

- **Select through the store**, the least a component needs. A selector runs again on every change
  its store hears about and the component renders only when what it returns changes (one level
  deep), so derived reads (`room.history`, `room.canCancel`, `message.hasUnfinishedTools`) belong
  in a `useRoomSelector`, and one message's own content in `useMessage`.
- **Parts and maps are replaced, never changed in place.** `savePart`, `addPart` and
  `updateParts` build a message's next parts; tool calls change through their actions
  (`setStatus`, `settle`, `setParameters`, `setPendingAction`); the room's tools map and Workbench pane
  are new objects on each change.
- **The room holds the conversation as plain data.** Its snapshot has `messages`, every message on
  every branch by client key (`MessageKey`, the message's `key`, not the backend id, which
  placeholders share), `rootKey`, and `tools`, every call by id. A message's `MessageData`
  (`room/store/message-map.ts`) links the tree by keys (`parentKey`, `childKeys`,
  `activeChildIndex`); a call's `ToolData` names its message by `messageKey` and holds its `json`,
  worked out when its part syncs and again for every call when the room's options change.
- **A change replaces only its own entry.** The pure helpers in `message-map.ts` (`insertChild`,
  `removeChild`, `setActiveChild`, `updateMessage`, `updateParts`, `spliceHiddenMessages`,
  `buildMessageTree`) copy the entries they change and the map, and keep every other reference,
  so a streamed token leaves every other message's selection as it was and renders only its own.
  Removing a child deletes it, everything below it and the tool calls they made (`removeSubtree`),
  and a load replaces the map; a view whose entry is gone reads an empty message or call
  (`emptyMessageData`, `initialToolData`) and never throws.
- **Messages and calls are views.** `ResponseMessageStore`, `InputMessageStore` and `ToolStore` hold
  their key (or id) and their room, read their entry, and write through room actions
  (`updateMessageData`, `insertChildMessage`, `updateToolData`, ...). The room keeps one view per
  key, so `room.getMessage`, `history`, `children` and `getTool` return the same object every time.
  Make a message with `room.createMessage(pixelMessage)` and a call with `room.getOrCreateTool(id)`;
  never construct a view. The empty reply a model streams into comes from
  `createResponsePlaceholder(room)` (`room/store/response-placeholder.ts`), which also has
  `readInputPayload`, the text and media a user's message sends. A reply streaming after tool
  results is the save controller's own field (`toolResponseMessage`), not state.
- **A turn runs through the room's `TurnRunner`** (`room/turns/turn-runner.ts`).
  `ResponseMessageStore.runMessage` calls `runTurn`, which owns what every turn shares: the
  placeholder and its place in the tree, `isThinking`, the room's loading and error, and taking
  the user's message back out when the turn fails. `room.turnRunner` picks the runner by mode:
  `room.chatTurns` (`ChatTurnRunner`: the `AskPlayground` stream, the stopped turn's replay, and
  the auto tool loop) or `room.agentTurns` (`AgentTurnRunner`, `agent-turn-runner.ts`: RunAgent, its
  watch, and the reconnect after a reload). The agent runner keeps the room's live `AgentStore`s
  by run id, so a decision reaches the store that polls the run and a reconnect joins the live
  watch; `RoomStore.dispose` forgets them. The pixels come from the SDK's
  `askPlaygroundPixel` and `addPlaygroundToolExecutionPixel`.
- `ChatTools` holds no state; `StreamJobController` is a plain class that tells the room
  when its cancel state changes. `ChatStore` owns every `RoomStore` (a reply keeps streaming while
  another room is open) and calls `RoomStore.dispose()` when it drops one. `room.workbench` is the
  dock's zustand store until `@semoss/workbench` moves.
- Tests give a fake store what the hooks read with `fakeStore` (`src/test/fake-store.ts`), and
  call its `notify()` after changing a field. `useMessage` and `useTool` listen to the message's or
  call's `room`, so a fake message or call carries a fake room, and the test notifies the room.

## A new chat's defaults

A new chat's model, mode and agent follow one order. Each takes the first that is set:

1. what this login session last used, kept in memory and never in `sessionStorage` (the model is
   `ChatStore`'s selected model; the mode and agent are held by `new-chat-preferences.ts`, by
   `lastLogin`), so a reload starts again at 2;
2. the user's default, their metadata `playground--default-input-text-model`,
   `playground--default-chat-mode` and `playground--default-chat-agent`, saved with
   `Session.setMetadata` from Settings > General's Chat section
   (`features/user-settings/new-chat-settings.tsx`), where the model and agent rows' **Default** choice clears it;
3. the deployment's default: the theme's `defaultRoomSettings` (`model`, `mode`, `agentId`),
   then `VITE_DEFAUlT_MODEL_ID`, `VITE_DEFAULT_CHAT_MODE` and `VITE_DEFAULT_CHAT_AGENT_ID`
   (read by the web app in its `features/chat-config/new-chat-build-defaults.ts` and given to
   the chat as `ChatConfig.options.new`);
4. the first available: the first model, chat mode, and Default Agent.

A mode is always chat where agent mode is not offered and always agent where the theme's
`agentModeOnly` flag is on (`resolveNewChatMode` takes the modes `newChatModes` offers, and
Settings shows no mode row then), an agent link (`?workspaceId=`) wins over steps 1 to 3, and an agent from them that the user can no longer open gives way to Default Agent.
The rules live in `features/chat/config/new-chat-preferences.ts`. The chat does not read the
platform's `text-generation-model`.
