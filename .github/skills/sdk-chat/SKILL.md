---
name: sdk-chat
description: "How to use the @semoss/sdk room API. Use for: creating or listing rooms, sending messages (AskRoom), fetching room messages or options, binding a room to an insight, updating room config. Covers imports, typed parameters, error handling, and usage patterns for all room pixel wrappers."
---

# @semoss/sdk — Room API

All room functions are exported from `@semoss/sdk`. They wrap the underlying SEMOSS pixel
reactors so consuming applications never need to write pixel strings directly.

## Imports

```ts
import {
    createRoom,
    getUserRooms,
    getRoomMessages,
    getRoomOptions,
    setRoomForInsight,
    updateRoomOptions,
    askRoom,
    getPixelJobStreaming,
    getPixelAsyncResult,
} from "@semoss/sdk";

// Types (all exported alongside functions)
import type {
    RoomRecord,
    RoomMessage,
    RoomOptions,
    RoomWorkspace,
    AskRoomParams,
    PixelStreamMessage,
    PixelJobStreamingStatus,
} from "@semoss/sdk";
```

## Functions

### `createRoom(insightId, workspaceId?)`

Creates a new room tied to a workspace. Returns the created `RoomRecord`.

```ts
const room = await createRoom(insightId, "workspace-abc");
console.log(room.roomId);
```

---

### `getUserRooms(insightId, options?)`

Lists all rooms. Optionally filter by pinned status or sort direction.

```ts
// All rooms
const rooms = await getUserRooms(insightId);

// Pinned rooms, newest first
const pinned = await getUserRooms(insightId, { pinned: true, sort: "DESC" });
```

---

### `getRoomMessages(insightId, roomId)`

Returns all messages in a room as `RoomMessage[]`.

```ts
const messages = await getRoomMessages(insightId, room.roomId);
```

---

### `getRoomOptions(insightId, roomId)`

Returns the current `RoomOptions` for a room (model, instructions, MCP tools, etc.).

```ts
const options = await getRoomOptions(insightId, room.roomId);
console.log(options.modelId, options.instructions);
```

---

### `setRoomForInsight(insightId, roomId)`

Associates a room with the active insight session. Returns `void`. Call this before sending
messages if the backend requires a room binding on the insight.

```ts
await setRoomForInsight(insightId, room.roomId);
```

---

### `updateRoomOptions(insightId, roomId, roomOptions)`

Replaces a room's configuration. Pass the full options array. Returns `void`.

```ts
const newOptions: RoomOptions[] = [
    {
        predefinedPrompts: ["Summarize this", "Explain simply"],
        instructions: "You are a helpful assistant.",
        mcp: [],
        workspace: { workspace_id: "ws-123", name: "My Workspace" },
        modelId: "gpt-4o",
    },
];

await updateRoomOptions(insightId, room.roomId, newOptions);
```

---

### `askRoom(insightId, params)`

Fires the `AskRoom` reactor asynchronously and returns `{ jobId }`. Use
`getPixelJobStreaming` to stream tokens as they arrive, then `getPixelAsyncResult`
to fetch the full structured result once the job completes.

```ts
const params: AskRoomParams = {
    engine: "gpt-4o",
    roomId: room.roomId,
    command: "What is the capital of France?",
    context: "You are a helpful assistant.",
    parentMessageId: "ROOT_PLACEHOLDER_ID", // use for new threads
};

// 1. Start the async job
const { jobId } = await askRoom(insightId, params);

// 2. Stream tokens as they arrive
const TERMINAL: PixelJobStreamingStatus[] = [
    "Complete", "ProgressComplete", "Canceled", "Error", "UnknownJob",
];

while (true) {
    const { message, status } = await getPixelJobStreaming(jobId);

    for (const chunk of message) {
        if (chunk.stream_type === "content" && chunk.data.content) {
            setMessage(prev => prev + chunk.data.content);
        }
    }

    if (TERMINAL.includes(status)) break;
}

// 3. Fetch the full structured result
const { errors, results } = await getPixelAsyncResult(jobId);
```

**Optional fields on `AskRoomParams`:**
| Field | Default | Description |
|-------|---------|-------------|
| `image` | `[]` | Base64-encoded image strings |
| `paramValues` | `[{}]` | Extra model parameters |
| `parentMessageId` | — | Use `"ROOT_PLACEHOLDER_ID"` to start a new thread |

---

## Error Handling

All functions throw on pixel errors. Wrap calls in `try/catch`:

```ts
try {
    const room = await createRoom(insightId, workspaceId);
} catch (error) {
    // error.message contains the reactor error string
    console.error("Failed to create room:", error);
}
```

## Typical Workflow

```ts
// 1. Create or load a room
const room = await createRoom(insightId, workspaceId);

// 2. Bind the room to the insight
await setRoomForInsight(insightId, room.roomId);

// 3. Configure the room
await updateRoomOptions(insightId, room.roomId, [{ ... }]);

// 4. Send a message and get the job ID
const { jobId } = await askRoom(insightId, {
    engine: "gpt-4o",
    roomId: room.roomId,
    command: "Hello!",
    context: "You are helpful.",
    parentMessageId: "ROOT_PLACEHOLDER_ID",
});

// 5. Stream tokens
const TERMINAL: PixelJobStreamingStatus[] = [
    "Complete", "ProgressComplete", "Canceled", "Error", "UnknownJob",
];
while (true) {
    const { message, status } = await getPixelJobStreaming(jobId);
    for (const chunk of message) {
        if (chunk.stream_type === "content" && chunk.data.content) {
            setMessage(prev => prev + chunk.data.content);
        }
    }
    if (TERMINAL.includes(status)) break;
}

// 6. Fetch the full structured result
const { errors, results } = await getPixelAsyncResult(jobId);
```
