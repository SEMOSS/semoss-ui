# Migrating to @semoss/sdk 2.0

2.0 moves the work of running a room — its conversation, streaming, tool loop,
agent runs and client-run tools — into the SDK as framework-free stores, and
standardizes every surface on the **playground reactors** (`CreatePlaygroundRoom`,
`AskPlayground`, `GetPlaygroundMessages`, `AddPlaygroundToolExecution`,
`GetPlaygroundRooms`). The old room wrappers and `RoomStore` are removed, not
deprecated.

## Removed and replaced

| 1.x | 2.0 |
|---|---|
| `createRoomRecord(insightId, workspaceId?)` | `createPlaygroundRoom({ workspaceId, mode? }, insightId?)` → `{ roomId, insightId }` |
| `createRoom(insightId, workspaceId?)` → `RoomStore` | `RoomsClient.createRoom(...)` / `createEmptyRoom(...)`, or `new RoomEngine({ roomId, insightId })` + `initialize()` |
| `RoomStore` (`updateOptions`, `getMessages`, `ask`, `askAgent`, `createAgent`) | `RoomEngine` (`updateRoomOptions`, `history`, `askMessage` / `send`, agent turns by `mode === "agent"`) |
| `askRoom(insightId, AskRoomParams)` | `askPlayground(insightId, PlaygroundTurnParams, commit?)`, or `chatPixels.ask(...)` to batch/stream yourself |
| `addRoomToolExecution(insightId, params)` | `addPlaygroundToolExecution(insightId, PlaygroundToolExecutionParams, commit?)` |
| `getRoomMessages(insightId, roomId)` | `getPlaygroundMessages(insightId, roomId)` → `PixelMessage[]` |
| `getUserRooms(insightId, { pinned, sort })` (sent a reactor no backend answers) | `getPlaygroundRooms(insightId, { search, roomOptionsSearch, pinned, limit, offset, sort, mode })` or `RoomsClient.listRooms(...)` |
| `AskRoomParams`, `AddRoomToolExecutionParams`, `RoomMessage`, `RoomResponse`, `RoomAsk*`, `RoomStreamChunk` | `PlaygroundTurnParams`, `PlaygroundToolExecutionParams`, `PixelMessage` and its part types |
| `InsightStore.actions.getRoom()` → `RoomStore` | → a loaded `RoomEngine` bound to that insight |

`getRoomOptions`, `updateRoomOptions`, `setRoomForInsight` and `getRoomForInsight`
keep their signatures. `AgentStore` and the agent-run API are unchanged.

## New

- **Pixel builders** — `chatPixels.*` (`createRoom`, `ask`, `addToolExecution`,
  `getMessages`, `getRooms`, `getRoomOptions`, `setRoomForInsight`,
  `updateRoomOptions`, `removeRoom`, `renameRoom`, `pinRoom`, `generateRoomName`,
  `stopJob`, `submitFeedback`, `exportMarkdown`, `compactMessages`, `dropInsight`)
  and runners `removeUserRoom`, `renameRoom`, `pinRoom`, `generateRoomName`,
  `stopPixelExecution`, `submitLlmFeedback`, `exportMarkdown`. `insightAssetPixels`
  for an insight's own folder.
- **The room engine** — `RoomEngine`, `RoomsClient`, `RoomEngineConfig`
  (`roomScope`, `turnContext`, `runParams`, `clientTools`, `onPendingAction`,
  `autoNameRooms`, …), message stores, `ToolCallStore`, `ContextItemsStore`,
  `ChatToolsStore`, `ObservableStore` + `batchChanges` for host stores.
- **Client tools** — the `ClientToolProvider` seam and
  `createChatFilesToolProvider()` (the room's files tools).
- **React** (`@semoss/sdk/react`) — `useRoomSelector`, `useOptionalRoomSelector`,
  `useMessageSelector`, `useToolSelector`, `useToolsSelector`, `useStoresSelector`,
  `useRoomsClient`, `useObservableStore`.
- **Auth** — `setSignInWindowOpener(opener)` to open sign ins somewhere other than a
  browser popup (a desktop webview); `SignInWindow`, `SignInWindowRequest`.
- **Websocket** — an absolute `Env.MODULE` (`https://host/Monolith`) now connects
  `InsightWebSocket` to that host.

## Recipes

A room without React:

```ts
import { Env, RoomEngine, Session, createPlaygroundRoom } from "@semoss/sdk";

Env.update({ MODULE: "https://semoss.example.com/Monolith", BEARER_TOKEN: token });
await Session.initialize();

const { roomId } = await createPlaygroundRoom();
const room = new RoomEngine({ roomId });
await room.initialize({ isNew: true });
room.setModel({ engine_id: modelId, engine_name: "Model", engine_type: "MODEL" });
const reply = await room.send("Summarize the attached file");
```

Reading a room in React:

```tsx
const { isLoading, history } = useRoomSelector(room, (r) => ({
	isLoading: r.isLoading,
	history: r.history,
}));
const parts = useMessageSelector(message, (m) => m.parts);
```

The full guide ships in `skills/sdk-chat/SKILL.md`.
