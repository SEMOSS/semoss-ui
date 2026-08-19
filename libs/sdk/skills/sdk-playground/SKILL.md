---
name: sdk-playground
description: "How to use the @semoss/sdk playground API. Use for: creating or listing playground rooms, sending messages (AskRoom or RunAgent), fetching room messages or options, binding a room to an insight, updating room config, toggling between chat and agent-harness mode. Covers imports, typed parameters, error handling, and usage patterns for all chat pixel wrappers."
---

# @semoss/sdk — Playground / Chat API

All playground functions are exported from `@semoss/sdk`. They wrap the underlying SEMOSS pixel
reactors so consuming applications never need to write pixel strings directly.

## Imports

```ts
import {
    createPlaygroundRoom,
    getUserRooms,
    getRoomMessages,
    getRoomOptions,
    setRoomForInsight,
    updateRoomOptions,
    askRoom,
    addRoomToolExecution,
    getPixelJobStreaming,
    getPixelAsyncResult,
    // Agent-harness mode — a different wire protocol, not job-streaming (see below)
    runAgent,
    pollAgentRun,
    getAgentRun,
    decideAgentRunAction,
    subscribeRunAgent,
    submitAgentToolDecision,
} from "@semoss/sdk";

// Types (exported from @semoss/sdk)
import type {
    PlaygroundRoom,
    PlaygroundMessage,
    PlaygroundRoomOptions,
    PlaygroundWorkspace,
    MCPToolConfig,
    PredefinedPrompt,
    AskRoomParams,
    AddRoomToolExecutionParams,
    PixelStreamMessage,
    PixelJobStreamingStatus,
    // Agent-harness mode
    AgentRunSnapshot,
    AgentRunItemEvent,
    PendingAgentAction,
} from "@semoss/sdk";
```

---

## Room construct (managed state)

The `Room` class wraps all the low-level API functions and handles the streaming poll loop,
conversation threading, and options state for you. Use it when you want to get up and running
quickly without managing job IDs or polling yourself.

Both approaches are valid — pick whichever fits your app:

| | **Raw API** (`askRoom`, `runAgent`, …) | **Room construct** (`createRoom`, `room.ask`, …) |
|---|---|---|
| State management | Caller manages job IDs, parentMessageId, options | Room handles it internally |
| Control | Full — every parameter exposed | Opinionated defaults with optional overrides |
| Good for | Custom UI, existing state layer (MobX, Redux, etc.) | Rapid integration, scripts, simple chat UIs |

### Quick start

```ts
import { createRoom } from "@semoss/sdk";
import type { RoomStreamChunk } from "@semoss/sdk";

// 1. Create a room (handles insight binding automatically)
const room = await createRoom(insightId);

// 2. Configure it
await room.updateOptions({
    modelId: "gpt-4o",
    instructions: "You are a helpful assistant.",
});

// 3. Chat — threads automatically from the previous response
const result = await room.ask("What is the capital of France?", {
    onChunk: (chunk: RoomStreamChunk) => {
        if (chunk.type === "content") process.stdout.write(chunk.content ?? "");
        if (chunk.type === "thinking") process.stdout.write(chunk.thinking ?? "");
    },
});
console.log(result.text);           // "Paris"
console.log(result.responseMessageId); // server-assigned message ID

// 4. Follow-up — parentMessageId is set automatically
const followUp = await room.ask("And Germany?");
console.log(followUp.text); // "Berlin"
```

### Agent-harness mode

```ts
// Enable agent harness by setting harnessType in options
await room.updateOptions({
    modelId: "gpt-4o",
    instructions: "You are a research agent.",
    harnessType: "semoss",
});

// Use askAgent instead of ask — server drives the full agentic loop.
// Internally this submits via runAgent (agent.ts) and polls the run to
// completion with subscribeRunAgent — not job-streaming (see below).
const result = await room.askAgent("Summarize the latest news on AI.", {
    onChunk: (chunk) => {
        if (chunk.type === "content") appendToUI(chunk.content ?? "");
    },
});

console.log(result.text);   // full response
console.log(result.status); // "COMPLETED"
```

If a tool call needs a human decision (status `INPUT_REQUIRED`), pass `onPendingActions` —
otherwise `askAgent` rejects as soon as the run pauses, since there'd be no way to unpause it:

```ts
const result = await room.askAgent("Delete all rows where status is 'archived'.", {
    onPendingActions: (pendingActions) => {
        for (const action of pendingActions) {
            // Import decideAgentRunAction / submitAgentToolDecision from "@semoss/sdk".
            // Use action.runId, not room.roomId — a paused subagent's action
            // belongs to the subagent's own run.
            submitAgentToolDecision(action, "submit"); // or "reject"
        }
    },
});
```

### Getting messages

```ts
const messages = await room.getMessages();
```

### Room method reference

| Method | Description |
|--------|-------------|
| `createRoom(insightId, workspaceId?)` | Factory — creates a room and binds it to the insight |
| `room.updateOptions(partial)` | Merge-update room config; persists to backend |
| `room.getMessages()` | Fetch full message history |
| `room.ask(command, options?)` | Chat mode — client-driven via AskRoom |
| `room.askAgent(command, options?)` | Agent-harness mode — server-driven via RunAgent |
| `room.options` | Read-only getter for the current `PlaygroundRoomOptions` |
| `room.roomId` | The room's server ID |
| `room.insightId` | The insight the room is bound to |

**`RoomAskOptions`** (second arg to `room.ask`):

| Field | Default | Description |
|-------|---------|-------------|
| `onChunk` | — | Streaming callback; receives `RoomStreamChunk` |
| `parentMessageId` | last response ID | Override to fork the thread |
| `image` | `[]` | Base64 image attachments |
| `context` | `room.options.instructions` | System instructions override for this request |

**`RoomAskAgentOptions`** (second arg to `room.askAgent`):

| Field | Default | Description |
|-------|---------|-------------|
| `onChunk` | — | Streaming callback; receives `RoomStreamChunk` |
| `onPendingActions` | — | Called with the paused `PendingAgentAction[]` when the run hits `INPUT_REQUIRED`. Omit only if the room's tools never require approval — otherwise `askAgent` rejects the moment the run pauses, since without a handler there's no way to resume it. |

---

## Functions

### `createPlaygroundRoom(insightId, workspaceId)`

Creates a new room tied to a workspace. Returns the created `PlaygroundRoom`.

```ts
const room = await createPlaygroundRoom(insightId, "workspace-abc");
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

Returns all messages in a room as `PlaygroundMessage[]`.

```ts
const messages = await getRoomMessages(insightId, room.roomId);
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
        // PredefinedPrompt objects, not plain strings
        predefinedPrompts: [
            { id: "p1", title: "Summarize", context: "Summarize this for me" },
            { id: "p2", title: "Explain",   context: "Explain this simply" },
        ],
        instructions: "You are a helpful assistant.",
        // MCPToolConfig objects — empty array means no tools
        mcp: [],
        // workspace is optional; omit for a plain chat room
        workspace: { workspace_id: "ws-123", name: "My Workspace" },
        modelId: "gpt-4o",
        // harnessType: "semoss"  ← set this to enable agent-harness mode
    },
];

await updateRoomOptions(insightId, room.roomId, newOptions);
```

**Key `PlaygroundRoomOptions` fields:**

| Field | Type | Description |
|-------|------|-------------|
| `predefinedPrompts` | `PredefinedPrompt[]` | Quick-start prompt chips shown in the chat input |
| `instructions` | `string` | System persona / instructions injected into every turn |
| `mcp` | `MCPToolConfig[]` | MCP tool servers and knowledge sources enabled for the room |
| `workspace` | `PlaygroundWorkspace?` | Agent workspace linked to the room (omit for plain chat) |
| `modelId` | `string` | Engine ID of the model to use |
| `harnessType` | `string?` | Set to `"semoss"` to run via the server-side RunAgent harness |

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
            // Plain text token from the model
            setMessage(prev => prev + chunk.data.content);
        } else if (chunk.stream_type === "thinking" && chunk.data.thinking) {
            // Reasoning token (extended-thinking models only)
            setThinking(prev => prev + chunk.data.thinking);
        } else if (chunk.stream_type === "tool") {
            // The model is streaming a tool call — name / arguments arrive
            // incrementally. Track by chunk.data.index to correlate deltas.
            // You typically buffer these and act once the job completes.
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

---

### `addRoomToolExecution(insightId, params)`

Submits a tool execution result back to the playground and fires a follow-up LLM
completion turn. Call this after your application has run an MCP tool and has its output.
Returns `{ jobId }` — use `getPixelJobStreaming` and `getPixelAsyncResult` exactly as you
would after `askRoom`.

```ts
import type { AddRoomToolExecutionParams } from "@semoss/sdk";

const params: AddRoomToolExecutionParams = {
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

const { jobId } = await addRoomToolExecution(insightId, params);

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

**`AddRoomToolExecutionParams` fields:**

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

## Chat mode vs Agent-harness mode

The SDK supports two ways to send a message. The choice is made **at room creation**
by setting `harnessType` in `PlaygroundRoomOptions`, and is persisted with the room.

These are two genuinely different wire protocols, not just two functions — agent-harness mode
does **not** use job-streaming (`getPixelJobStreaming`/`getPixelAsyncResult`). The backend's
`RunAgent` reactor has no pollable-job path at all: it either returns an immediate handle
(`wait=false`, what `runAgent` uses) or blocks the request synchronously until the run finishes
(`wait=true`, no partial progress). Streaming progress instead comes from a separate durable-run
endpoint, polled via `pollAgentRun`/`subscribeRunAgent`.

| | **Chat mode** (`askRoom`) | **Agent-harness mode** (`runAgent`) |
|---|---|---|
| Who drives the tool loop | **Client** — browser executes each tool and submits results | **Server** — backend runs the full agentic cycle autonomously |
| Tool calls | Client calls `RunMCPTool`, then `addRoomToolExecution` per tool | Server handles all tool calls internally; paused (HITL) calls surface via `pendingActions` |
| Wire protocol | Job-streaming: `{ jobId }` polled via `getPixelJobStreaming` | Durable run: `{ runId }` polled via `pollAgentRun`/`subscribeRunAgent` — no `jobId` |
| Progress shape | Raw `content`/`thinking`/`tool` chunks | Typed `AgentRunItemEvent`s (`message`/`reasoning`/`tool`/`subagent`) |
| Result shape | `{ inputMessage, responseMessage }` — full message objects | `AgentRunSnapshot` — `finalText`, `status`, message IDs, `pendingActions` |
| Use when | Standard Q&A, simple tool use, full client control needed | Complex multi-step agents, subagent chains, audit logging, long-running jobs |
| `harnessType` option | omit / `undefined` | `"semoss"` |

### Creating a room in agent-harness mode

```ts
await updateRoomOptions(insightId, room.roomId, [{
    predefinedPrompts: [],
    instructions: "You are a research agent.",
    mcp: [],
    modelId: "gpt-4o",
    harnessType: "semoss", // ← this is the toggle
}]);
```

Once `harnessType` is persisted on the room, send all messages via `runAgent`.
To switch back to chat mode, update the room options with `harnessType: undefined`.

### `runAgent(params, insightId?)`

Submits a message to the server-side agent harness **without waiting** for it to finish
(`wait=false`) and returns immediately with a `runId` — not a `jobId`, and not the settled
result. Poll `runId` to completion with `pollAgentRun` directly, or use `subscribeRunAgent` to
get polling, event dedup/ordering, backoff, and `INPUT_REQUIRED`/terminal reconciliation for free.

```ts
const { runId } = await runAgent(
    {
        roomId: room.roomId,
        command: "Analyze this dataset and produce a summary report.",
        engine: "my-model-engine-id", // room.model.engine_id; defaults to the room's model
        // harnessType defaults to "semoss" — only override if targeting a different harness
    },
    insightId,
);

const finalSnapshot = await new Promise<AgentRunSnapshot>((resolve, reject) => {
    subscribeRunAgent(runId, {
        onEvent: (event: AgentRunItemEvent) => {
            // Typed item events, not raw content/thinking/tool chunks
            if (event.type === "item.updated" && event.kind === "message" && event.delta) {
                setContent(prev => prev + event.delta);
            }
        },
        onSnapshot: () => {}, // fires on every poll with the current durable snapshot
        onReconcile: (snapshot) => {
            if (["COMPLETED", "FAILED", "CANCELLED"].includes(snapshot.status)) {
                resolve(snapshot);
            }
        },
        onError: (error) => console.error("Agent run stream error", error),
    });
});

if (finalSnapshot.status !== "COMPLETED") {
    throw new Error(`Agent run did not complete: ${finalSnapshot.status}`);
}

// Adopt the server-assigned message IDs
console.log(finalSnapshot.inputMessageId);       // persisted user message ID
console.log(finalSnapshot.finalOutputMessageId); // persisted response message ID
console.log(finalSnapshot.finalText);            // full response text
```

**`runAgent` params:**

| Field | Required | Description |
|-------|----------|-------------|
| `roomId` | Yes | ID of the room |
| `command` | Yes | The user message (encoded automatically) |
| `engine` | No | Engine (model) ID — defaults to the room's configured model |
| `harnessType` | No | Which agent harness runs the loop; defaults to `"semoss"` |
| `agentId` | No | The agent whose tools/config the run should use (sent as `workspaceId` on the wire) |
| `maxTurns` / `maxReflections` | No | Caps on model round-trips / self-reflection turns |
| `images` / `urls` | No | Attachments for the command |

**`AgentRunSnapshot` key fields** (from `pollAgentRun`/`getAgentRun`, surfaced via `onReconcile`):

| Field | Description |
|-------|-------------|
| `status` | `"SUBMITTED"` \| `"RUNNING"` \| `"INPUT_REQUIRED"` \| `"COMPLETED"` \| `"FAILED"` \| `"CANCELLED"` |
| `inputMessageId` | Server-assigned ID for the persisted user message, once written |
| `finalOutputMessageId` | Server-assigned ID for the persisted response, once complete |
| `finalText` | The agent's full response text, once it completes successfully |
| `errorMessage` | Set when `status` is `"FAILED"` |
| `pendingActions` | Paused tool calls awaiting a human decision; non-empty only while `"INPUT_REQUIRED"` — resolve with `decideAgentRunAction`/`submitAgentToolDecision` |

---

## Tool Execution Call Stack

This section documents how `addRoomToolExecution` fits into the full
tool-call lifecycle so you can replicate the same flow outside the playground app.

```
AskRoom → stream chunks → getPixelAsyncResult
    │
    └─ responseMessage.parts contains TOOL_CALL entries
           │
           ├─ For each TOOL_CALL with SMSS_MCP_EXECUTION === "AUTO":
           │       │
           │       ├─ RunMCPTool(project, roomId, function, paramValues)
           │       │       └─ Returns raw tool output string
           │       │
           │       └─ addRoomToolExecution(insightId, {
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

1. **`engine` vs `model.engine_id`**: `addRoomToolExecution` uses
   `room.model.app_id` (the *app* engine ID), not `room.model.engine_id` (the
   *LLM* engine ID) that `askRoom` uses. These are different IDs.

2. **Partial vs final output**: Check `typeof output.responseMessage === "string"`.
   A string means the backend is still aggregating tool results and wants you to
   keep running tools. An object means the turn is complete.

3. **Error wrapping**: If the tool itself throws, set `mcpToolStatus: "error"` and
   pass the error message as `toolExecutionResponse` so the model can reason about
   the failure. If `addRoomToolExecution` itself throws while saving a
   successful result, retry with `mcpToolStatus: "error"` and wrap the save-error
   message in `toolExecutionResponse`.

4. **Paused / cancelled tools**: Use `mcpToolStatus: "paused"` or `"cancelled"` to
   tell the model the tool was skipped without executing. The model will receive a
   standard prompt explaining why execution was halted.

5. **Concurrency limit**: A room has a `toolAutoExecutionLimit` (default 5). Track
   how many tools are currently `LOADING` and only dispatch up to the limit at a
   time. Re-check after each tool completes.
