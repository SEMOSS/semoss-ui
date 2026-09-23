---
name: sdk-chat
description: "Use when working with @semoss/sdk rooms, AskRoom chat jobs, RunAgent runs, streaming, tool approvals, room options, or insight bindings. Covers public imports, parameters, return values, lifecycle cleanup, and known compatibility gaps."
---

# @semoss/sdk Room and Agent API

This self-contained guide ships with the SDK. Its signatures and lifecycle notes
describe this package's implementation, not a guarantee about every SEMOSS server.
Use an authenticated, configured SDK environment and a ready insight. Pass actual
SEMOSS model engine IDs, not provider model names such as `gpt-4o`.

Import core functions, `RoomStore`, `AgentStore`, and types from `@semoss/sdk`.
React hooks/providers such as `useInsight` and `InsightProvider` live under
`@semoss/sdk/react`. There is no core export named `Room`. Framework-independent
state does not imply that all SDK entry points are safe in Node or SSR environments.

## Agent Profile Images

Agent workspaces and skills use project catalog images. After creation returns a
project ID, call `uploadProjectImage(projectId, file)` from `@semoss/sdk`.
`uploadEngineImage(engineId, file)` handles engine catalog images. Both return
`Promise<CatalogImageUploadResult>` with `id`, `name`, `message`, `imageUrl`, and
`contentType`. `imageUrl` is a path on the backend origin, not necessarily the
frontend origin. These calls require edit access and the resource-scoped image
upload routes on Monolith.

Use `CATALOG_IMAGE_ACCEPT`, `CATALOG_IMAGE_MAX_BYTES`, and
`getCatalogImageValidationError(file)` for file-picker validation. Supported files
are PNG, JPEG, and GIF up to 10 MiB. The server validates the bytes and enforces a
25-million-pixel limit. A failure rejects; preserve the new project ID so a retry
uploads to the same agent. Do not pass a temporary form ID or an agent run ID.

## Choose the Transport Explicitly

| Operation | Submission | Progress | Settled result |
|---|---|---|---|
| Chat | `askRoom(insightId, params)` or `addRoomToolExecution(insightId, params)` returns `Promise<{ jobId: string }>` | `getPixelJobStreaming(jobId)` | `getPixelAsyncResult(jobId)` |
| Agent harness | `runAgent(params, insightId?)` returns `Promise<{ runId: string; roomId: string; status: AgentRunStatusValue }>` | `pollAgentRun(runId)` or `AgentStore.watch(...)` | `getAgentRun(runId, options?, insightId?)` |

The function you call chooses the protocol. `runAgent` sends `wait=false`; it does
not use the SDK's async pixel job APIs. Do not pass its `runId` to chat job polling,
even when a subagent summary also labels that identifier `jobId`.

`RoomOptions.harnessType?: string` is persisted configuration, not an enforced
creation-time switch. `room.ask()` always uses AskRoom; `room.askAgent()` always
uses RunAgent. The current `room.createAgent()` does not forward the room's
`harnessType`. Use `runAgent` or `AgentStore.start` to select a harness explicitly.
Omitted `engine` or `harnessType` values are omitted on the wire, not defaulted by
the SDK; server defaults must be checked against the deployed backend.

## Room Records and Options

All functions in this table are exported from `@semoss/sdk`.

| Call | Return type / behavior |
|---|---|
| `createRoomRecord(insightId, workspaceId?)` | `Promise<RoomRecord>`; creates a record, without binding it |
| `createRoom(insightId, workspaceId?)` | `Promise<RoomStore>`; creates a record, binds it, and seeds local default options |
| `getUserRooms(insightId, options?)` | `Promise<RoomRecord[]>`; options are `{ pinned?: boolean; sort?: "ASC" \| "DESC" }` |
| `getRoomMessages(insightId, roomId)` | `Promise<RoomMessage[]>` |
| `getRoomOptions(insightId, roomId)` | `Promise<RoomOptions>` |
| `getRoomForInsight(insightId)` | `Promise<RoomRecord \| null>` |
| `setRoomForInsight(insightId, roomId)` | `Promise<void>`; throws on returned pixel errors |
| `updateRoomOptions(insightId, roomId, roomOptions)` | `Promise<void>`; serializes a `RoomOptions[]`, without merging or returning server options |

The raw update wrapper does not establish server-side replace/merge semantics.
Fetch the current options before assembling an update when preservation matters.
`RoomRecord` requires `roomId` and `name`; `RoomMessage` declares `messageId`,
`content`, and `role`. Both allow extra fields. These types are not runtime
validators for richer backend message parts.

Required `RoomOptions` fields are `predefinedPrompts: PredefinedPrompt[]`,
`instructions: string`, `mcp: MCPToolConfig[]`, and `modelId: string`.
Optional fields are `workspace: RoomWorkspace`, `harnessType: string`, and
`overrideSystemPrompt: boolean`.

On backends supporting `overrideSystemPrompt`, set it to `false` to append
`instructions` after the selected agent's authored system prompt. Set it to
`true` to replace that prompt with nonempty `instructions`. Omitting the flag
retains the legacy replacement behavior; blank instructions retain the agent
prompt in either mode. Workbench assistants send `false` by default. Deploy the
backend change together with clients using this option; older servers ignore
the flag and continue replacing the agent prompt.

- `PredefinedPrompt` requires `{ id, title, context }` strings, not plain strings;
  optional fields are `tags?: string[]`, `version?: number`, and `intent?: string`.
- `MCPToolConfig` requires `{ id, type, name }` strings; `fromWorkspace` and
  `fromRoom` are optional booleans. The type does not restrict server entry kinds.
- `RoomWorkspace` requires `{ workspace_id: string; name: string }`.

```ts
import { createRoom } from "@semoss/sdk";

async function configureRoom(
	insightId: string,
	modelEngineId: string,
	workspaceId?: string,
) {
	const room = await createRoom(insightId, workspaceId);
	await room.updateOptions({
		modelId: modelEngineId,
		instructions: "Be concise.",
		predefinedPrompts: [
			{ id: "summary", title: "Summarize", context: "Summarize this." },
		],
	});
	return room;
}
```

## Managed RoomStore

`createRoom` seeds `{ predefinedPrompts: [], instructions: "", mcp: [], modelId: "" }`.
It does not load existing server/workspace options; configure it before asking.
For an existing room, fetch its options and use
`new RoomStore(roomId, insightId, options)`. That constructor neither binds the
insight nor restores the conversation's last response ID from history.

| Member | Contract |
|---|---|
| `room.updateOptions(partial)` | `Promise<void>`; shallow-merges local options, persists `[merged]`, then updates local state |
| `room.getMessages()` | `Promise<RoomMessage[]>` |
| `room.ask(command, options?)` | `Promise<RoomAskResult>` containing `inputMessageId`, `responseMessageId`, `text` |
| `room.createAgent(command, engine?)` | `Promise<AgentStore>`; caches it as `room.agent`, but does not start watching |
| `room.askAgent(command, options?)` | `Promise<RoomAskAgentResult>`; same result fields plus `status: string`, checked for `"COMPLETED"` on success |
| `room.options` | `Readonly<RoomOptions>` getter; not a deeply frozen copy |
| `room.roomId`, `room.insightId`, `room.agent` | IDs and the latest `AgentStore \| null` |

`RoomAskOptions` accepts `onChunk`, `parentMessageId`, `image`, and `context`.
The parent defaults to the last successful response ID on this instance, initially
`"ROOT_PLACEHOLDER_ID"`; `image` defaults to `[]`; `context` defaults to local
instructions. It exposes no `paramValues`, timeout, or abort option. Serialize
turns on one instance to avoid racing the mutable last-response ID.

`RoomAskAgentOptions` accepts only `onChunk` and `onPendingActions`. Neither is an
awaited async callback. Handle errors from async approval UI actions yourself.
If durable reconciliation reports `INPUT_REQUIRED` without a handler, the method
stops local observation and rejects; it does not cancel or reject backend actions.
`RoomStreamChunk` has `type: "content" | "thinking" | "tool"` and optional
`content`, `thinking`, or `toolData` respectively.

**Current managed-method limitations:** `room.ask` has an unbounded poll loop with
no delay, deadline, or cancellation and attempts result retrieval after any
terminal status. `room.askAgent` waits for reconciliation callbacks, not
`AgentStore.done`; local stop/abort, exhausted polling, or failed terminal
reconciliation can leave its promise pending. Its chunk adapter also misses full
message/reasoning text supplied only on item start/completion. Prefer the explicit
lifecycles below when bounded observation and reliable completion matter. Merely
racing a Room method against a timeout does not stop its internal work.

## Bounded Local Observation

The following helper is application code, not an SDK export. Subsequent examples
use it to reject a local wait after 60 seconds and signal polling cleanup.
Choose a deadline suitable for your workflow, especially human approvals.

```ts
async function withLocalDeadline<Result>(
	work: (signal: AbortSignal) => Promise<Result>,
	timeoutMs = 60_000,
): Promise<Result> {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			const error = new Error(
				"Local observation timed out; backend work may continue",
			);
			reject(error);
			controller.abort(error);
		}, timeoutMs);
	});
	try {
		return await Promise.race([work(controller.signal), timeout]);
	} finally {
		clearTimeout(timer);
		controller.abort();
	}
}
```

The wrappers below do not accept a request-level `AbortSignal`. This helper bounds
the caller's wait, not the duration of an in-flight HTTP request. That request may
still finish; check the signal before updating UI or starting more work. Retain
the job/run ID for later reconciliation. Local timeout or stopping a watcher does
not establish that backend execution was cancelled.

## Chat Jobs

`AskRoomParams` requires `engine`, `roomId`, `command`, `context`, and
`parentMessageId`, all strings. Use `"ROOT_PLACEHOLDER_ID"` for a new thread.
Optional `image: string[]` defaults to `[]`; optional
`paramValues: Record<string, unknown>[]` defaults to `[{}]`.

The wrapper places `command` and `context` inside Pixel `<encode>` markers; it
does not call `encodeURIComponent`. Do not assume this is general-purpose input
escaping. See the backend compatibility notes below.

This example consumes an already submitted job, spaces polls by 500 ms, and
handles every declared status without treating cancellation or errors as success.
Submit with `await askRoom(insightId, params)` using a complete `AskRoomParams`,
then pass its `jobId` to this function.

```ts
import { getPixelAsyncResult, getPixelJobStreaming } from "@semoss/sdk";
import type { PixelStreamMessage } from "@semoss/sdk";

async function observeChatJob(
	jobId: string,
	onChunk: (chunk: PixelStreamMessage) => void,
) {
	return withLocalDeadline(async (signal) => {
		for (let attempt = 0; attempt < 120; attempt += 1) {
			signal.throwIfAborted();
			const { message, status } = await getPixelJobStreaming(jobId);
			signal.throwIfAborted();
			for (const chunk of message) onChunk(chunk);
			switch (status) {
				case "Complete":
				case "ProgressComplete": {
					const { errors, results } =
						await getPixelAsyncResult<[unknown]>(jobId);
					signal.throwIfAborted();
					if (errors.length) throw new Error(errors.join(", "));
					const result = results[0];
					if (!result) throw new Error("Chat job returned no result");
					return result.output;
				}
				case "Canceled":
				case "Error":
				case "UnknownJob":
					throw new Error(`Chat job ended with ${status}`);
				case "Paused":
					throw new Error(
						"Chat job is paused; explicit application handling is required",
					);
				case "Created":
				case "Submitted":
				case "InProgress":
				case "Streaming":
					break;
				default:
					throw new Error(`Unexpected chat job status: ${status}`);
			}
			await new Promise<void>((resolve) => setTimeout(resolve, 500));
		}
		throw new Error("Chat polling limit reached");
	});
}
```

`PixelStreamMessage` is discriminated by `stream_type`: `content` carries
`data.content`, `thinking` carries `data.thinking`, and `tool` carries optional
`data.index`, `id`, and `function` name/argument fragments. Do not execute tools
from incomplete streamed arguments. Validate the settled `unknown` output before
reading message parts or executing tool calls. A generic type argument is not
runtime validation. Keep one consumer per job's incremental stream.

Room record/options wrappers throw on pixel errors. In contrast, `runPixel` and
`getPixelAsyncResult` return an `errors` array for pixel failures; inspect it.
Transport failures can reject. Successful `askRoom` submission only establishes
receipt of a job handle, not a successful model turn.

## Chat Tool Results

`addRoomToolExecution(insightId, params)` returns `Promise<{ jobId: string }>`.
Observe that job with the same bounded chat lifecycle. Required
`AddRoomToolExecutionParams` fields are:

| Field | Type |
|---|---|
| `engine`, `roomId`, `toolId`, `toolName`, `toolExecutionResponse` | `string` |
| `mcpToolStatus` | `"success" \| "error" \| "cancelled" \| "paused"` |
| `toolParameterValues` | `Record<string, unknown>` |
| `parentMessageId` (optional) | `string`; normally the response containing the tool call |
| `paramValues` (optional) | `Record<string, unknown>[]`; defaults to `[{}]` |

Use the model engine identifier for `engine`, not a project/workspace ID or an
assumed `room.model.app_id` field. `RoomStore` has no `model` field. The wrapper
passes this string through; verify the deployed reactor's identifier contract.
It wraps tool output in `<encode>` markers and does not URL-encode it.

The client owns chat tool execution, authorization, concurrency, and result
submission. There is no SDK `toolAutoExecutionLimit` option or default of five.
Report a genuine tool failure using `mcpToolStatus: "error"`; a failure to save a
successful tool result is a separate transport/persistence failure. Do not relabel
it as tool failure and automatically resubmit, or blindly rerun a side-effecting
tool. Reconcile first and use an integration-verified retry policy.

Do not assume every settled tool result is `{ inputMessage, responseMessage }`.
Known server variants include a top-level string for intermediate/duplicate
submissions. Check `typeof output === "string"` before accessing any fields;
validate objects too. A string alone does not prove another tool should run.

## Agent Runs

`runAgent(params, insightId?)` requires `roomId` and `command` strings. Optional
fields are `engine`, `harnessType`, `agentId` (strings), `maxTurns` and
`maxReflections` (numbers), `media` and `urls` (`string[]`), and
`paramValues` (`Record<string, unknown>`, not the chat array form).
There is no `images` or separate `agentParams` parameter in this version.

The wrapper JSON-serializes raw command text, maps `agentId` to `workspaceId`,
`urls` to `url`, and `media` to `media`; nonempty `paramValues` is sent as a
one-element array. It does not URL-encode commands or inject a harness default.
The returned status is typed as `AgentRunStatusValue`, not guaranteed by local
validation to equal `"SUBMITTED"`.

| Call | Result |
|---|---|
| `pollAgentRun(runId)` | `{ run: AgentRunSnapshot; events: AgentRunItemEvent[]; droppedEvents: number }` |
| `getAgentRun(runId, { includeMessages?: boolean }, insightId?)` | Snapshot with optional `messages`; the options argument itself defaults to `{}` |
| `stopAgentRun(runId, insightId?)` | `Promise<AgentRunSnapshot>` from the StopAgentRun reactor |
| `getSubagentRuns(runId, insightId?)` | `Promise<SubagentRunSummary[]>` |
| `AgentStore.start(params, insightId)` | `Promise<AgentStore>`; insight ID is required here |
| `new AgentStore(roomId, insightId, runId)` | Attaches locally without submitting or starting a watcher |
| `agent.getSnapshot(options?)` | Durable fetch with this store's insight ID; return type is `Promise<AgentRunSnapshot>` |
| `agent.cancel()` | Calls `stopAgentRun`; unlike `agent.stop()`, requests backend cancellation |

`AgentRunSnapshot` requires `runId`, `roomId`, `status`, and `pendingActions`;
optional fields are `inputMessageId`, `finalOutputMessageId`, `finalText`,
and `errorMessage`. Status values are `SUBMITTED`, `RUNNING`,
`INPUT_REQUIRED`, `COMPLETED`, `FAILED`, and `CANCELLED`. `INPUT_REQUIRED` is a
pause, not a terminal success. Do not infer durable success from streamed text.
`getAgentRun` and `stopAgentRun` normalize missing `pendingActions` to `[]`;
`pollAgentRun` returns the endpoint payload without that normalization.

### Watch Lifecycle

`agent.watch(handlers, options?)` requires `onEvent`, `onSnapshot`, and
`onReconcile`; `onError` is optional. It returns an `AgentRunSubscription` with
`stop()`, `pokeNow()`, `getItems()`, and `done`. `agent.done` also exposes the
subscription promise, or a resolved `null` before any watch.

- Defaults: `pollIntervalMs: 500`, `inputRequiredIntervalMultiplier: 3`,
    `maxConsecutiveFailures: 8`. Optional `signal` stops local observation only.
- Events are sorted by `sequence` per poll and deduplicated by `eventId`.
    `onEvent(event, items)` receives accumulated state. Render that state so full
    text arriving on `item.started` or `item.completed` is not lost. Kinds include
    `message`, `reasoning`, `tool`, and `subagent`.
- Treat agent streaming as a destructive drain without replay: keep exactly one
    live watcher per run ID, including across separate store instances. Use durable
    reads to reconcile `droppedEvents`; the store reports gaps but does not itself
    reconstruct missing item history.
- Terminal observations drain remaining new events, then reconcile on an empty
    drain. Failed polls back off, capped at 10 seconds; at the failure cap the store
    attempts one durable read and ends observation. `done` never rejects and may
    contain a nonterminal or stale snapshot, or `null`.

This example watches an already-started store. Supply synchronous rendering
callbacks; catch errors in any async work they launch. The snapshot callback runs
on every successful poll, so an approval UI should compare pending action IDs and
track in-flight decisions, not automatically resubmit approvals.

```ts
import type {
	AgentRunItemsState,
	AgentRunSnapshot,
	AgentStore,
} from "@semoss/sdk";

async function observeAgent(
	agent: AgentStore,
	onItems: (items: AgentRunItemsState) => void,
	onSnapshot: (snapshot: AgentRunSnapshot) => void,
): Promise<AgentRunSnapshot> {
	return withLocalDeadline(async (signal) => {
		signal.throwIfAborted();
		const subscription = agent.watch(
			{
				onEvent: (_event, items) => {
					if (!signal.aborted) onItems(items);
				},
				onSnapshot: (snapshot, meta) => {
					if (signal.aborted) return;
					if (meta.droppedEvents > 0)
						console.warn("Agent stream has gaps", meta);
					onSnapshot(snapshot);
				},
				onReconcile: (snapshot) => {
					if (!signal.aborted) onSnapshot(snapshot);
				},
				onError: (error) => {
					if (!signal.aborted)
						console.error("Agent observation error", error);
				},
			},
			{ signal },
		);
		try {
			await subscription.done;
			signal.throwIfAborted();
			const final = await agent.getSnapshot({ includeMessages: true });
			signal.throwIfAborted();
			if (final.status !== "COMPLETED") {
				throw new Error(
					final.errorMessage ??
						`Observation ended with ${final.status}`,
				);
			}
			return final;
		} finally {
			subscription.stop();
		}
	});
}
```

To start: `await AgentStore.start({ roomId, command, engine: modelEngineId }, insightId)`.
Pass the resulting store to `observeAgent`. Submission itself is not bounded by
this observation helper. To stop locally use `agent.stop()`; to request remote
cancellation await `agent.cancel()`, inspect its returned status, and optionally
call `agent.pokeNow()` for a live watcher. Do not assume descendants or external
tool side effects are cancelled without backend verification.

### Approvals and Child Runs

Present every pending action to the user and submit only their chosen decision.
`PendingAgentAction.actionId` identifies the decision; `runId` identifies its
owning run, not a room ID. `toolArgs`, `editedArgs`, `toolMeta`, `toolCallId`,
`parentMessageId`, `toolName`, and `uiUrl` may be null.

- `await agent.decide(action, "submit", editedParams?)` returns a string; it maps
    omitted or JSON-equal parameters to `approve`, changed parameters to `edit`.
- `await agent.decide(action, "reject")` rejects that action.
- `await agent.decide(action, "respond", answers)` JSON-stringifies the answer
    object as `mcpToolResult`, for tools such as RequestUserInput.
- Raw `decideAgentRunAction({ actionId, decision, paramValues?, mcpToolResult? }, insightId?)`
    returns `Promise<string>` and calls RunMCPTool. Raw decisions are `approve`,
    `edit`, `reject`, or `respond`, not `submit`. Supply arguments for `edit` and a
    result string for `respond`; omission is serialized as `{}` or `""` respectively.

Await decisions and surface failures rather than discarding promises. Decide all
actions in a paused batch; one decision may not resume the run. The helper does
not validate that the action belongs to its store, so use the correct owner to
wake the right watcher. Child runs have independent rooms and run IDs; use
`getSubagentRuns`/`getAgentRun` and a separate owner per child when live observation
is needed. Do not assume a parent's watcher resolves child approvals.

## Known Gaps and Verification Boundary

These are current limitations, not recommendations to change SDK/backend source
while updating documentation:

- The watcher retains its subscription after stopping. `isWatching` can remain
    true, and another `watch()` on that instance returns the stopped subscription.
    Wait for the previous `done` before attaching a new store; never overlap drains.
- An already-aborted signal is not checked internally. Stop/abort does not abort
    an in-flight request or suppress all callbacks from it. Guard UI delivery and
    bound the outer wait as above.
- Internal reconciliation omits the store's insight ID, records status before a
    successful read, and does not retry that read for an unchanged status. It can
    miss a new approval batch while status remains `INPUT_REQUIRED`. Inspect
    `onSnapshot` pending action IDs and use `getSnapshot()` or
    `getAgentRun(runId, { includeMessages: true }, insightId)` explicitly.
- Legacy AskRoom `image`/`context` fields have a known compatibility gap with
    servers expecting `media` and persisted room instructions. Configuring room
    instructions does not prove the legacy request override is honored.
- Command encoding, separate harness/provider parameters, model engine ID
    interpretation, tool-result shapes, approval resumption, destructive drains,
    and StopAgentRun/child cancellation require deployed-backend verification.
    In particular, a server that URL-decodes RunAgent commands may not round-trip
    all text from this version's raw JSON serialization. There is no verified
    separate harness-parameter mapping here.

Local types and mocked tests verify client behavior only. Check these integration
contracts before promising compatibility, changing encodings, retrying tool
execution, or claiming successful cancellation.
