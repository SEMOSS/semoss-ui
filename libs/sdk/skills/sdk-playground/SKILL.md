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
    getPixelJobStreaming,
    getPixelAsyncResult,
} from "@semoss/sdk";

// Types (all exported alongside functions)
import type {
    PlaygroundRoom,
    PlaygroundMessage,
    PlaygroundRoomOptions,
    PlaygroundWorkspace,
    AskPlaygroundParams,
    PixelStreamMessage,
    PixelJobStreamingStatus,
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

Fires the `AskPlayground` reactor asynchronously and returns `{ jobId }`. Use
`getPixelJobStreaming` to stream tokens as they arrive, then `getPixelAsyncResult`
to fetch the full structured result once the job completes.

```ts
const params: AskPlaygroundParams = {
    engine: "gpt-4o",
    roomId: room.roomId,
    command: "What is the capital of France?",
    context: "You are a helpful assistant.",
    parentMessageId: "ROOT_PLACEHOLDER_ID", // use for new threads
};

// 1. Start the async job
const { jobId } = await askPlayground(insightId, params);

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

// 4. Send a message and get the job ID
const { jobId } = await askPlayground(insightId, {
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

---

### `addPlaygroundToolExecution(insightId, params)`

Submits a tool execution result back to the playground and fires a follow-up LLM
completion turn. Call this after your application has run an MCP tool and has its output.
Returns `{ jobId }` — use `getPixelJobStreaming` and `getPixelAsyncResult` exactly as you
would after `askPlayground`.

```ts
import type { AddPlaygroundToolExecutionParams } from "@semoss/sdk";

const params: AddPlaygroundToolExecutionParams = {
    engine: "my-app-id",        // room.model.app_id — the engine that owns the room
    roomId: room.roomId,
    parentMessageId: responseMessage.id,  // the response message that contains the tool call
    toolId: tool.id,            // tool call ID from the TOOL_CALL message part
    toolName: tool.json.name,
    toolExecutionResponse: toolOutput,    // raw string output from the tool
    mcpToolStatus: "success",   // "success" | "error" | "cancelled" | "paused"
    toolParameterValues: tool.parameters, // params actually passed to the tool
    // paramValues defaults to [{}] — pass only if you need extra model params
};

const { jobId } = await addPlaygroundToolExecution(insightId, params);

// Stream tokens from the follow-up LLM response
const TERMINAL: PixelJobStreamingStatus[] = [
    "Complete", "ProgressComplete", "Canceled", "Error", "UnknownJob",
];
while (true) {
    const { message, status } = await getPixelJobStreaming(jobId);
    for (const chunk of message) {
        if (chunk.stream_type === "content" && chunk.data.content) {
            setContent(prev => prev + chunk.data.content);
        } else if (chunk.stream_type === "thinking" && chunk.data.thinking) {
            setThinking(prev => prev + chunk.data.thinking);
        }
    }
    if (TERMINAL.includes(status)) break;
}

const { errors, results } = await getPixelAsyncResult(jobId);
const output = results[0].output;

if (typeof output.responseMessage === "string") {
    // More tool calls are still pending in the same turn.
    // Continue executing the next queued tool — do NOT create a new
    // response bubble yet.
    runNextTool();
} else {
    // All tools for this turn are complete. The backend has returned the
    // final input + response message pair.
    // Sync your local message state and begin executing any new tool calls
    // that appear in the new responseMessage.
    syncMessages(output.inputMessage, output.responseMessage);
    continueToolExecution(output.responseMessage);
}
```

**`AddPlaygroundToolExecutionParams` fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `engine` | Yes | The engine/app ID (`room.model.app_id`) |
| `roomId` | Yes | ID of the room the tool call belongs to |
| `parentMessageId` | No | ID of the response message containing the tool call |
| `toolId` | Yes | The tool call ID from the `TOOL_CALL` message part |
| `toolName` | Yes | The tool's function name |
| `toolExecutionResponse` | Yes | Raw string output of the tool (encoded automatically) |
| `mcpToolStatus` | Yes | `"success"` \| `"error"` \| `"cancelled"` \| `"paused"` |
| `toolParameterValues` | Yes | The parameters that were actually used when calling the tool |
| `paramValues` | No | Extra model parameters; defaults to `[{}]` |

---

## Tool Execution Call Stack

This section documents how `addPlaygroundToolExecution` fits into the full
tool-call lifecycle so you can replicate the same flow outside the playground app.

```
AskPlayground → stream chunks → getPixelAsyncResult
    │
    └─ responseMessage.parts contains TOOL_CALL entries
           │
           ├─ For each TOOL_CALL with SMSS_MCP_EXECUTION === "AUTO":
           │       │
           │       ├─ RunMCPTool(project, roomId, function, paramValues)
           │       │       └─ Returns raw tool output string
           │       │
           │       └─ addPlaygroundToolExecution(insightId, {
           │               engine,          ← room.model.app_id
           │               roomId,
           │               parentMessageId, ← the response message's ID
           │               toolId,          ← part.toolCall.id
           │               toolName,        ← tool.json.name
           │               toolExecutionResponse, ← output from RunMCPTool
           │               mcpToolStatus,   ← "success" | "error" | ...
           │               toolParameterValues,
           │           })
           │               │
           │               └─ stream chunks (content / thinking / tool)
           │                       │
           │                       ├─ Partial output { responseMessage: string }
           │                       │       └─ More tools pending → run next tool
           │                       │
           │                       └─ Final output { inputMessage, responseMessage }
           │                               └─ Sync messages, run continueToolExecution()
           │                                  on the new responseMessage (may trigger
           │                                  another round of tool calls)
           │
           └─ Repeat until responseMessage has no INITIAL/LOADING tool calls
```

### Key rules

1. **`engine` vs `model.engine_id`**: `addPlaygroundToolExecution` uses
   `room.model.app_id` (the *app* engine ID), not `room.model.engine_id` (the
   *LLM* engine ID) that `askPlayground` uses. These are different IDs.

2. **Partial vs final output**: Check `typeof output.responseMessage === "string"`.
   A string means the backend is still aggregating tool results and wants you to
   keep running tools. An object means the turn is complete.

3. **Error wrapping**: If the tool itself throws, set `mcpToolStatus: "error"` and
   pass the error message as `toolExecutionResponse` so the model can reason about
   the failure. If `addPlaygroundToolExecution` itself throws while saving a
   successful result, retry with `mcpToolStatus: "error"` and wrap the save-error
   message in `toolExecutionResponse`.

4. **Paused / cancelled tools**: Use `mcpToolStatus: "paused"` or `"cancelled"` to
   tell the model the tool was skipped without executing. The model will receive a
   standard prompt explaining why execution was halted.

5. **Concurrency limit**: A room has a `toolAutoExecutionLimit` (default 5). Track
   how many tools are currently `LOADING` and only dispatch up to the limit at a
   time. Re-check after each tool completes.
