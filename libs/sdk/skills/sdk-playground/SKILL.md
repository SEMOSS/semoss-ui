---
name: sdk-playground
description: "How to use the @semoss/sdk playground API. Use for: creating or listing playground rooms, sending messages (AskPlayground), fetching room messages or options, binding a room to an insight, updating room config. Covers imports, typed parameters, error handling, and usage patterns for all playground pixel wrappers."
---

# @semoss/sdk — Playground API

All playground functions are exported from `@semoss/sdk`. They wrap the underlying SEMOSS pixel
reactors so consuming applications never need to write pixel strings directly.

## Imports

```ts
import {
    createPlaygroundRoom,
    getPlaygroundRooms,
    getPlaygroundMessages,
    getRoomOptions,
    setRoomForInsight,
    updateRoomOptions,
    askPlayground,
} from "@semoss/sdk";

// Types (all exported alongside functions)
import type {
    PlaygroundRoom,
    PlaygroundMessage,
    PlaygroundRoomOptions,
    PlaygroundWorkspace,
    AskPlaygroundParams,
    PlaygroundResponse,
} from "@semoss/sdk";
```

## Functions

### `createPlaygroundRoom(insightId, workspaceId)`

Creates a new room tied to a workspace. Returns the created `PlaygroundRoom`.

```ts
const room = await createPlaygroundRoom(insightId, "workspace-abc");
console.log(room.roomId);
```

---

### `getPlaygroundRooms(insightId, options?)`

Lists all rooms. Optionally filter by pinned status or sort direction.

```ts
// All rooms
const rooms = await getPlaygroundRooms(insightId);

// Pinned rooms, newest first
const pinned = await getPlaygroundRooms(insightId, { pinned: true, sort: "DESC" });
```

---

### `getPlaygroundMessages(insightId, roomId)`

Returns all messages in a room as `PlaygroundMessage[]`.

```ts
const messages = await getPlaygroundMessages(insightId, room.roomId);
```

---

### `getRoomOptions(insightId, roomId)`

Returns the current `PlaygroundRoomOptions` for a room (model, instructions, MCP tools, etc.).

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
const newOptions: PlaygroundRoomOptions[] = [
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

### `askPlayground(insightId, params)`

Sends a message and returns the model's `PlaygroundResponse`.

```ts
const params: AskPlaygroundParams = {
    engine: "gpt-4o",
    roomId: room.roomId,
    command: "What is the capital of France?",
    context: "You are a helpful assistant.",
    parentMessageId: "ROOT_PLACEHOLDER_ID", // use for new threads
};

const response = await askPlayground(insightId, params);
console.log(response.content);
```

**Optional fields on `AskPlaygroundParams`:**
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
    const room = await createPlaygroundRoom(insightId, workspaceId);
} catch (error) {
    // error.message contains the reactor error string
    console.error("Failed to create room:", error);
}
```

## Typical Workflow

```ts
// 1. Create or load a room
const room = await createPlaygroundRoom(insightId, workspaceId);

// 2. Bind the room to the insight
await setRoomForInsight(insightId, room.roomId);

// 3. Configure the room
await updateRoomOptions(insightId, room.roomId, [{ ... }]);

// 4. Send a message
const response = await askPlayground(insightId, {
    engine: "gpt-4o",
    roomId: room.roomId,
    command: "Hello!",
    context: "You are helpful.",
    parentMessageId: "ROOT_PLACEHOLDER_ID",
});
```
