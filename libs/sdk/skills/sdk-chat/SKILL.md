---
name: sdk-chat
description: "Use when working with @semoss/sdk rooms: the RoomEngine/RoomsClient room engine, the playground chat reactors (AskPlayground, CreatePlaygroundRoom, GetPlaygroundRooms, AddPlaygroundToolExecution), client-run tools, streaming, RunAgent runs and approvals, room options, or room-to-insight binding. Covers public imports, configuration, lifecycle, React selector hooks, and known gaps."
---

# @semoss/sdk Rooms, Chat and Agent Runs

This self-contained guide ships with the SDK. It describes this package's
implementation, not a guarantee about every SEMOSS server. Use a signed in
session (`Session`; see the SDK's `session.skill.md`). Pass SEMOSS model engine
IDs, not provider model names such as `gpt-4o`.

Import stores, API functions and types from `@semoss/sdk`; React hooks from
`@semoss/sdk/react`. Migrating from 1.x? See `MIGRATION.md` in the package.

**Every surface uses the playground reactors** — `CreatePlaygroundRoom`,
`AskPlayground`, `GetPlaygroundMessages`, `AddPlaygroundToolExecution`,
`GetPlaygroundRooms` — whether it is the playground, a desktop app, an embedded
chat, a terminal agent or a custom app. There is no per-surface reactor choice.

## Choose a Level

| You want | Use |
|---|---|
| A whole chat: rooms, turns, streaming, tool loop, agent runs | **The room engine**: `RoomsClient` + `RoomEngine` (below) |
| One pixel, batched or streamed your own way | **Builders**: `chatPixels.*` (strings) |
| One call with no state | **Runners**: `createPlaygroundRoom`, `askPlayground`, `getPlaygroundRooms`, … |
| An agent run you drive yourself | `runAgent` / `AgentStore` (see Agent Runs) |

The engine is framework-free — no React, DOM or `window` — so it runs in a
browser, a webview, or Node (with `Env.HEADLESS` / a bearer token).

## The Room Engine

### RoomsClient — the user's rooms

`new RoomsClient<R>(config?)` keeps the rooms opened on a page and makes new
ones; every room it makes shares `config.engine` (a `RoomEngineConfig`).

| Member | Contract |
|---|---|
| `initialize()` | Reads the models and picks the one new rooms run on (profile default → last pick this login → host default → first). Never rejects |
| `createRoom(mode, prompt, files, options, workspaceId?, askOptions?, prepareRoom?)` | Creates a room in a fresh insight, saves its options, then sends the first message without waiting; the room is listed optimistically. Resolves with the room |
| `createEmptyRoom(mode, name, options, workspaceId?, prepareRoom?)` | A room with no first message (e.g. an agent greeting) |
| `loadRoom(roomId)` | The cached room, or loads one — which binds a fresh insight. Throws for a room with no messages |
| `closeRoom(roomId)` | `RemoveUserRoom` in the session's insight, then `DropInsight` on the room's |
| `renameRoom(roomId, name)`, `pinRoom(roomId, pinned)` | Through the session's insight; bump `roomsVersion` |
| `listRooms(query?)` | `GetPlaygroundRooms` in the session's insight, within `roomScope` |
| `roomsVersion` | Moves whenever rooms change; lists read again on it |
| `optimisticRooms`, `addOptimisticRoom`, `removeOptimisticRoom` | Rooms shown before the backend lists them (a room is listed once its first message has data) |
| `models`, `setSelectedModel`, `selectModelById`, `applyProfileDefaultModel` | The model new rooms run on; remembered through `config.preferences` |

`RoomsClientConfig`: `engine`, `enableModelSelect`, `defaultModel`,
`preferences` (`ChatPreferencesAdapter`: read/write the picked model; reads never
throw), `createRoomStore(init)` (make your subclass of `RoomEngine`),
`onFirstMessageError(room, error)`.

### RoomEngine — one room

**1 room = 1 insight per load.** `initialize()` reads the room's messages and
options and binds the insight it runs in (`SetRoomForInsight`) in one request;
`new RoomEngine({ roomId })` starts in `"new"`, so loading makes a fresh insight.
Never rebind one insight to another room; close rooms through `RoomsClient`.

| Member | Contract |
|---|---|
| `initialize({ isNew? })` | Builds the conversation tree, restores agent mode from a persisted `harnessType`, merges the agent's toolboxes and greeting, picks the model the history ran on. Reconnects a running agent turn, or continues a chat turn's unfinished tool calls |
| `history`, `tail`, `latestResponseMessage`, `root` | The active branch of the tree |
| `askMessage(prompt, files?, { visible? })` | Shows the user's turn and a placeholder at once, saves options (with turn context), uploads files, sends queued `contextItems`, then runs the turn. Rejects with `UploadError` when a file could not be read; queued files go back on failure |
| `send(prompt, files?)` | `askMessage` then `waitForIdle()`; resolves with the last response's text — for hosts with no view |
| `waitForIdle()` | Resolves when no stream, tool call, or tool save is running. Calls waiting for the user do not hold it |
| `cancelActiveJob()` | Stops the live stream (and commits what streamed), or hard-stops pending tool calls |
| `canCancel`, `isCancelling`, `isLoading`, `error` | Turn state |
| `compactMessages(strategy?)` | `SUMMARY`, `TOOL_PRUNE` or the backend's choice |
| `updateRoomOptions(options)`, `syncRoomOptions()`, `setOptions`, `setModel`, `setMode`, `setMetadata` | Saved options skip a save the backend already holds; agent and folder toolboxes (`fromWorkspace`, `fromRoom`) are never stored |
| `getTool(id)`, `tools`, `chatTools`, `contextItems` | Tool calls, client tools, files queued for the next message |
| `runRoomPixel(pixel, showLoading?, setErrorOnFail?, throwOnError?)` | Any pixel in the room's insight |

`RoomEngine<O>` is generic over its options so a host can keep richer types.

Hooks a host with a UI overrides (protected or public no-ops):
`onInsightBound({ isNew })` (re-point file views at the new insight; restore
integrations), `refreshFiles()`, `showToolPanel(tool)`, `hideToolPanel(tool)`.

### RoomEngineConfig

| Field | Effect |
|---|---|
| `clientTools` | `ClientToolProvider[]` — see Client Tools |
| `roomScope: { token }` | Stamped into every saved options (`roomScope`) and passed as `roomOptionsSearch` by `listRooms`. LIKE match: tokens must not prefix one another |
| `instructions` | A new room's instructions |
| `turnContext()` | Read before **every** turn; appended to the instructions the turn is saved and sent with (local options keep the room's own) |
| `runParams: { maxTurns, maxReflections }` | Sent with agent runs |
| `onPendingAction(action, room)` | Answer an agent run's pending action yourself: resolve `{ decision, paramValues }`, or null to leave it to the user. Each action is offered once |
| `autoNameRooms` | Names a new room from its first exchange with `GenerateRoomName` |
| `toolAutoExecutionLimit` | Calls running at once in a chat turn (5 when unset) |
| `sendTemperature`, `allowedFileTypes`, `defaultRoomSettings.model`, `appName` | Model temperature, which files go to the model, the default model, export file names |

### Messages and tool calls

`InputMessageStore` and `ResponseMessageStore` (`parts`, `isThinking`,
`feedback`, `hasTools`, `hasUnfinishedTools`, `shouldFoldUp`, `recordFeedback`,
`rewriteMessage`, `downloadResponse`, `continueToolExecution`,
`saveToolExecution`) and `ToolCallStore` (`status`, `json`, `parameters`,
`response`, `pendingAction`, `isResolved`, `display`, `openTool`, `closeTool`).
`decideAgentToolAction(tool, decision, paramValues?)` decides a paused agent
run's call through the run's live watcher.

### Observing

Every engine store is an `ObservableStore`: `getSnapshot()` returns a change
counter (a new object per change) and `subscribe(listener)` hears each change.
A message or tool call's change also tells its room, so reading the room sees
everything; a streamed chunk replaces its message's `parts` (copy-on-write).
Wrap several changes in `batchChanges(fn)` to notify once. Hosts can build their
own stores on `ObservableStore` (`observeFields` in the constructor).

React (`@semoss/sdk/react`) selector hooks render again only when the selection
changes (shallow compare):

```tsx
const { isLoading, history } = useRoomSelector(room, (r) => ({
	isLoading: r.isLoading,
	history: r.history,
}));
const parts = useMessageSelector(message, (m) => m.parts); // one message only
const status = useToolSelector(tool, (t) => t.status, "INITIAL");
const { roomsVersion } = useRoomsClient(client, (c) => ({ roomsVersion: c.roomsVersion }));
```

Also `useOptionalRoomSelector(room | null, selector, fallback)`,
`useToolsSelector(tools, selector)`, `useStoresSelector(stores, selector)` and
`useObservableStore(store, selector, fallback)`. Write selectors inline: a
stable function reference is cached per snapshot of the store it is given.

## Client Tools

A `ClientToolProvider` runs tools on the client with no backend change:

```ts
interface ClientToolProvider {
	id: string;
	getTools(room): ClientToolDefinition[];   // sent in paramValues.tools
	canHandle(call): boolean;
	execute(call, room): Promise<{ output: string; isError?: boolean }>;
	decorateToolCall?(call, room): RoomToolCall; // restore _meta, title, execution
	policy?(toolName, room): "auto" | "ask" | "disabled";
}
```

- The room sends every provider's tools with **every** chat turn **and** every
  tool-result save — the model's follow up only re-adds the room's own tools, so
  leaving them off a save drops them mid-task.
- Calls come back with no `_meta`; `decorateToolCall` restores it.
  `SMSS_MCP_EXECUTION: "auto"` runs at once; `"ask"` waits for
  `chatTools.approveChatTool(tool)` / `declineChatTool(tool)`.
- Agent runs bring their own tools; answer agent-run tools with
  `onPendingAction` instead.
- `createChatFilesToolProvider({ labels? })` is the room's files tools (list,
  read, search, write, move, delete) over the insight asset pixels. A room's
  `defaultTools` option sets each to `auto`, `ask` or `disabled` (reads auto,
  changes ask by default). It never addresses the room folder's root for a write
  and hides its `mcp` folder — `DeleteInsightAssets` with an empty path clears the
  whole space.

## Pixel Builders and Runners

`chatPixels` builds one statement each: `createRoom({ workspaceId, mode })`,
`ask(turn, commit?)`, `addToolExecution(params, commit?)`, `getMessages(roomId)`,
`getRooms(query)`, `getRoomOptions`, `setRoomForInsight`, `updateRoomOptions`,
`removeRoom`, `renameRoom`, `pinRoom`, `generateRoomName`, `stopJob`,
`submitFeedback`, `exportMarkdown`, `compactMessages`, `dropInsight`.
A `commit` (`{ responseParts, hiddenMessage }`) persists a stopped turn instead of
asking the model.

| Runner | Returns |
|---|---|
| `createPlaygroundRoom({ workspaceId?, mode? }, insightId = "new")` | `{ roomId, insightId }` |
| `askPlayground(insightId, turn, commit?)` | `{ jobId }` — stream it (Chat Jobs) |
| `addPlaygroundToolExecution(insightId, params, commit?)` | `{ jobId }` |
| `getPlaygroundMessages(insightId, roomId)` | `PixelMessage[]` |
| `getPlaygroundRooms(insightId, { search, roomOptionsSearch, pinned, limit, offset, sort, mode })` | `PlaygroundRoomRow[]` |
| `getRoomOptions`, `updateRoomOptions`, `setRoomForInsight`, `getRoomForInsight` | As before |
| `removeUserRoom`, `renameRoom`, `pinRoom`, `stopPixelExecution`, `submitLlmFeedback` | `void` |
| `generateRoomName(insightId, { roomId, prompt?, engine? })` | The name, or null |
| `exportMarkdown(insightId, { markdown, fileName, format })` | A file key to `download` from the same insight |

`PlaygroundTurnParams`: `engine`, `roomId`, `command`, `context?`, `media?`,
`parentMessageId?`, `paramValues?` (one map; client tools go in `tools`).
Runners throw on pixel errors; `runPixel` itself returns `errors` instead.

## Chat Jobs

A chat turn and a tool save are pixel jobs: `askPlayground` / 
`addPlaygroundToolExecution` return `{ jobId }`. Poll `getPixelJobStreaming(jobId)`
for chunks, then read `getPixelAsyncResult(jobId)` once the status is
`Complete` or `ProgressComplete`. `Canceled`, `Error` and `UnknownJob` are
failures; `Paused` needs explicit handling. Space polls (the engine uses 500 ms)
and bound the wait locally (see below). Read chunks with
`readPixelStreamChunk(chunk, { onText, onThinking, onTool, onUsage })`; never run a
tool from incomplete streamed arguments, and validate the settled output before
reading message parts. A settled tool save's output is either the model's reply
(`{ inputMessage, responseMessage }`) or, while more calls of the response are
pending, a string or `{ responseMessage: string }`.

To stop a turn: `StopPixelExecution`, then persist what streamed by replaying the
same turn with `commit` (`responseParts` + `hiddenMessage`); the backend skips the
model and appends a hidden note so the next turn knows. `RoomEngine.cancelActiveJob`
does all of this.

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

## Agent Runs

`runAgent(params, insightId?)` requires `roomId` and `command` strings. Optional
fields are `engine`, `harnessType`, `agentId`, `space`, `subdir` (strings),
`maxTurns` and `maxReflections` (numbers), `media` and `urls` (`string[]`), and
`paramValues` (`Record<string, unknown>`, not the chat array form).
There is no `images` or separate `agentParams` parameter in this version.

`space` picks where the run works: `INSIGHT` (the room's folder, and what a run
without `space` uses), `USER` (the user's file space), or an editable project
id. `subdir` narrows that to a folder inside it. The backend refuses
`paramValues.space`, `space` together with `paramValues.project`, and a
`subdir` that leaves the space.

The wrapper JSON-serializes raw command text, maps `agentId` to `workspaceId`,
`urls` to `url`, and `media` to `media`; `space` is sent as its own argument
and `subdir` as `paramValues.subdir`, replacing one already there. Nonempty
`paramValues` is sent as a one-element array. It does not URL-encode commands
or inject a harness default.
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

## Known Gaps and Verification Boundary

- `AskPlayground` reads `media` and `paramValues`; the `context` argument the
  builders send is not one of `AskRoom`'s keys. Room instructions reach the
  model through the saved room options (`updateRoomOptions`), which the engine
  saves before every turn.
- The agent watcher keeps its subscription after stopping; wait for the previous
  `done` before attaching another store to the same run. Stop/abort does not abort
  an in-flight request.
- Internal reconciliation omits the store's insight ID and can miss a new approval
  batch while status stays `INPUT_REQUIRED`; compare pending action IDs in
  `onSnapshot`.
- Command encoding, tool-result shapes, approval resumption and
  StopAgentRun/child cancellation require deployed-backend verification.
- Engine tests run in Node against mocked transport; they verify client behavior
  only.
