import { Env } from "../env";
import { post } from "../lib/fetch";
import { runPixel } from "../lib/pixel";
import type {
	AgentRunItemEvent,
	AgentRunSnapshot,
	AgentRunStatusValue,
	AgentToolDecision,
	PendingAgentAction,
	SubagentRunSummary,
} from "../types";
import type { agentRunStreaming } from "./monolith/engine";

type NullableActionField =
	| "parentMessageId"
	| "toolCallId"
	| "toolName"
	| "toolArgs"
	| "editedArgs"
	| "toolMeta"
	| "uiUrl";

type AgentSnapshotResponse = Omit<AgentRunSnapshot, "pendingActions"> & {
	pendingActions?: Array<
		Omit<PendingAgentAction, NullableActionField> &
			Partial<Pick<PendingAgentAction, NullableActionField>>
	>;
};

/**
 * Restores nullable approval fields omitted by the backend's Gson serializer.
 *
 * @param snapshot - The raw durable snapshot or poll snapshot.
 * @returns The snapshot with a stable pending-actions array and nullable fields.
 */
function normalizeAgentSnapshot<T extends AgentSnapshotResponse>(
	snapshot: T,
): Omit<T, "pendingActions"> & AgentRunSnapshot {
	return {
		...snapshot,
		pendingActions: (snapshot.pendingActions ?? []).map((action) => ({
			...action,
			parentMessageId: action.parentMessageId ?? null,
			toolCallId: action.toolCallId ?? null,
			toolName: action.toolName ?? null,
			toolArgs: action.toolArgs ?? null,
			editedArgs: action.editedArgs ?? null,
			toolMeta: action.toolMeta ?? null,
			uiUrl: action.uiUrl ?? null,
		})),
	};
}

/**
 * Submit a durable agent run without waiting for it to finish (RunAgent with
 * wait=false). Poll progress with pollAgentRun(runId), or prefer
 * {@link AgentStore} (`stores/agent`) which owns the poll loop for you.
 *
 * @param params.roomId - Room the run's messages are written to.
 * @param params.command - The user's message text.
 * @param params.engine - Model engine id. Defaults to the room's configured model.
 * @param params.harnessType - Which agent harness runs the loop (e.g. "semoss").
 * @param params.agentId - The agent whose tools/config the run should use. Sent
 * to the backend as `workspaceId` -- a workspace IS the backend's agent record,
 * but "agent" is the term callers should use here.
 * @param params.maxTurns - Cap on model round-trips before the run stops itself.
 * @param params.maxReflections - Cap on self-reflection turns.
 * @param params.media - Media file locations to attach to the command. Any
 * file type the model accepts (image, pdf, document, spreadsheet, audio,
 * video), or base64 image/PDF data URIs.
 * @param params.urls - URLs to attach to the command.
 * @param params.space - Where the run works: `INSIGHT` for the room's own
 * folder, which is what a run without it uses, `USER` for the user's file
 * space, or the id of a project the user can edit. The harness's file, shell,
 * and code tools all work there. Sent as its own argument, since the backend
 * refuses `paramValues.space`, and never together with `paramValues.project`.
 * @param params.subdir - A folder inside the space to work in instead of its
 * top, such as `reports/2026`. Sent as `paramValues.subdir`, which it replaces
 * when both are given; the backend refuses a path that leaves the space.
 * @param params.paramValues - Extra run parameters forwarded to the harness.
 * The semoss harness honors `project` (project the run edits; also drives the
 * git-commit hook), `subdir` (see `params.subdir`), `permissionMode`
 * ("default" | "acceptEdits" | "plan" | "bypassPermissions"), and strips its
 * known keys before passing the rest (e.g. `thinking`, `effort`) through to
 * the model provider.
 * @param params.agentParams - Run values for the agent, never sent to the
 * model. The semoss harness reads `userText`: what the user typed when
 * `command` wraps it in extra context; it names the room and is what the
 * message shows.
 * @param insightId - Insight to run the pixel against.
 * @returns The submitted run's id, room id, and initial status (always
 * "SUBMITTED") — not a full snapshot.
 *
 * @deprecated Use `runPixel(buildPixel("RunAgent", { roomId, command, wait: false,
 * workspaceId: agentId, url: urls, paramValues }), insightId)` with `buildPixel` and
 * `runPixel` from `@semoss/sdk`. Check `errors` before reading `pixelReturn[0]?.output`; raw
 * reactor output may differ from this helper's declared or normalized result. Map subdir into
 * paramValues.subdir (overriding any prior value); forward engine, harnessType, space,
 * maxTurns, maxReflections, media and agentParams when present. Use literal values, not
 * pre-serialized clauses. Observe the returned runId through `agentRunStreaming` from
 * `@semoss/sdk/api/monolith/engine`; it is not a chat job ID.
 * @example
 * ```ts
 * import { buildPixel, runPixel } from "@semoss/sdk";
 * const agentId = "agent-id";
 * const urls = ["https://example.com/report"];
 * const subdir = "reports";
 * const response = await runPixel(buildPixel("RunAgent", {
 *     roomId: "room-id", command: "Summarize the report", wait: false,
 *     workspaceId: agentId, url: urls, space: "USER",
 *     paramValues: { subdir },
 * }), "insight-id");
 * if (response.errors.length) throw new Error(response.errors.join(", "));
 * const submission = response.pixelReturn[0]?.output;
 * ```
 */
export const runAgent = async (
	params: {
		roomId: string;
		command: string;
		engine?: string;
		harnessType?: string;
		agentId?: string;
		maxTurns?: number;
		maxReflections?: number;
		media?: string[];
		urls?: string[];
		space?: string;
		subdir?: string;
		paramValues?: Record<string, unknown>;
		agentParams?: Record<string, unknown>;
	},
	insightId?: string,
): Promise<{ runId: string; roomId: string; status: AgentRunStatusValue }> => {
	const {
		roomId,
		command,
		engine,
		harnessType,
		agentId,
		maxTurns,
		maxReflections,
		media,
		urls,
		space,
		subdir,
		agentParams,
	} = params;
	const paramValues =
		subdir !== undefined
			? { ...params.paramValues, subdir: subdir }
			: params.paramValues;

	const clauses = [
		`roomId=${JSON.stringify([roomId])}`,
		`command=${JSON.stringify([command])}`,
		engine ? `engine=${JSON.stringify([engine])}` : null,
		harnessType ? `harnessType=${JSON.stringify(harnessType)}` : null,
		// The backend's RunAgent pixel calls this workspaceId -- see the agentId
		// param doc above for why the public name here differs.
		agentId ? `workspaceId=${JSON.stringify([agentId])}` : null,
		space ? `space=${JSON.stringify([space])}` : null,
		maxTurns !== undefined ? `maxTurns=${JSON.stringify(maxTurns)}` : null,
		maxReflections !== undefined
			? `maxReflections=${JSON.stringify(maxReflections)}`
			: null,
		media && media.length > 0 ? `media=${JSON.stringify(media)}` : null,
		urls && urls.length > 0 ? `url=${JSON.stringify(urls)}` : null,
		paramValues && Object.keys(paramValues).length > 0
			? `paramValues=[${JSON.stringify(paramValues)}]`
			: null,
		agentParams && Object.keys(agentParams).length > 0
			? `agentParams=[${JSON.stringify(agentParams)}]`
			: null,
		"wait=false",
	].filter((clause): clause is string => clause !== null);

	const response = await runPixel<
		[{ runId: string; roomId: string; status: AgentRunStatusValue }]
	>(`RunAgent(${clauses.join(",\n")});`, insightId);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	return response.pixelReturn[0].output;
};

/**
 * Drain buffered stream events for a run and get its current durable
 * snapshot in one call. Scoped to the run's owner by the backend. Each call
 * removes the drained events — there's no replay.
 *
 * @param runId - The run to poll.
 * @returns `run` — the current durable snapshot; `events` — new item events
 * since the last drain, unordered; `droppedEvents` — events evicted by the
 * backend's bounded buffer before this drain could collect them.
 *
 * @deprecated Use `agentRunStreaming({ runId })` from `@semoss/sdk/api/monolith/engine`. The
 * raw snapshot does not default pendingActions to [] or missing approval fields to null. Each
 * call drains events; keep one consumer and handle droppedEvents explicitly.
 */
export const pollAgentRun = async (
	runId: string,
): Promise<{
	run: AgentRunSnapshot;
	events: AgentRunItemEvent[];
	droppedEvents: number;
}> => {
	if (!runId) {
		throw new Error("Missing runId");
	}

	const response = await post<Awaited<ReturnType<typeof agentRunStreaming>>>(
		`${Env.MODULE}/api/engine/agentRunStreaming`,
		{ runId },
	);
	return { ...response.data, run: normalizeAgentSnapshot(response.data.run) };
};

/**
 * Get the durable AgentRun snapshot directly (GetAgentRun), optionally with
 * this run's persisted room messages. For reconciliation, not live progress.
 *
 * @param runId - The run to fetch.
 * @param options.includeMessages - Also fetch this run's persisted room messages.
 * @param insightId - Insight to run the pixel against.
 * @returns The durable snapshot; `messages` is only populated when
 * `includeMessages` is true.
 *
 * @deprecated Use `runPixel(buildPixel("GetAgentRun", { runId, includeMessages:
 * options.includeMessages }), insightId)` with `buildPixel` and `runPixel` from `@semoss/sdk`.
 * Check `errors` before reading `pixelReturn[0]?.output`; raw reactor output may differ from
 * this helper's declared or normalized result. The raw snapshot does not default
 * pendingActions to [] or missing approval fields to null.
 */
export const getAgentRun = async <
	M extends Record<string, unknown> = Record<string, unknown>,
>(
	runId: string,
	options: { includeMessages?: boolean } = {},
	insightId?: string,
): Promise<AgentRunSnapshot & { messages?: M[] }> => {
	if (!runId) {
		throw new Error("Missing runId");
	}

	const clauses = [
		`runId=${JSON.stringify([runId])}`,
		options.includeMessages ? "includeMessages=true" : null,
	].filter((clause): clause is string => clause !== null);

	const response = await runPixel<
		[AgentSnapshotResponse & { messages?: M[] }]
	>(`GetAgentRun(${clauses.join(",\n")});`, insightId);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	const output = response.pixelReturn[0].output;

	return normalizeAgentSnapshot(output);
};

/**
 * Cancel a durable agent run (StopAgentRun). The backend interrupts the
 * harness, marks the run CANCELLED unless it already reached a terminal
 * status, and notifies its stream — a live subscription observes the
 * CANCELLED snapshot on its next poll (pokeNow() it for immediacy).
 *
 * @param runId - The run to cancel.
 * @param insightId - Insight to run the pixel against.
 * @returns The run's durable snapshot after the stop was applied.
 *
 * @deprecated Use `runPixel(buildPixel("StopAgentRun", { runId }), insightId)` with
 * `buildPixel` and `runPixel` from `@semoss/sdk`. Check `errors` before reading
 * `pixelReturn[0]?.output`; raw reactor output may differ from this helper's declared or
 * normalized result. The raw snapshot does not default pendingActions to [] or missing
 * approval fields to null; inspect its status to confirm cancellation.
 */
export const stopAgentRun = async (
	runId: string,
	insightId?: string,
): Promise<AgentRunSnapshot> => {
	if (!runId) {
		throw new Error("Missing runId");
	}

	const response = await runPixel<[AgentSnapshotResponse]>(
		`StopAgentRun(runId=${JSON.stringify([runId])});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	const output = response.pixelReturn[0].output;

	return normalizeAgentSnapshot(output);
};

/**
 * Decide a pending agent tool call (RunMCPTool's HITL path) — resumes the run
 * once every pending action in the batch has been decided. For the common
 * case of resolving approve vs. edit from submitted params automatically, use
 * {@link AgentStore.decide} instead.
 *
 * @param params.actionId - The PendingAgentAction.actionId being decided.
 * @param params.decision - "approve"/"edit" execute the tool; "reject"/"respond" don't.
 * @param params.paramValues - Required for "edit" (the tool's re-run arguments); ignored otherwise.
 * @param params.mcpToolResult - Required for "respond" (the string the tool "returned", e.g. JSON-stringified answers); ignored otherwise.
 * @param insightId - Insight to run the pixel against.
 * @returns The tool-result string the decision produced.
 *
 * @deprecated Use `runPixel(buildPixel("RunMCPTool", { actionId, decision, paramValues,
 * mcpToolResult }), insightId)` with `buildPixel` and `runPixel` from `@semoss/sdk`. Check
 * `errors` before reading `pixelReturn[0]?.output`; raw reactor output may differ from this
 * helper's declared or normalized result. Send paramValues only for edit and mcpToolResult
 * only for respond. Preserve the legacy {} / empty-string defaults when required. This is the
 * pending-action path, not a room tool call.
 */
export const decideAgentRunAction = async (
	params: {
		actionId: string;
		decision: AgentToolDecision;
		paramValues?: Record<string, unknown>;
		mcpToolResult?: string;
	},
	insightId?: string,
): Promise<string> => {
	const { actionId, decision, paramValues, mcpToolResult } = params;

	const clauses = [
		`actionId=${JSON.stringify([actionId])}`,
		`decision=${JSON.stringify([decision])}`,
		decision === "edit"
			? `paramValues=${JSON.stringify(paramValues ?? {})}`
			: null,
		decision === "respond"
			? `mcpToolResult=${JSON.stringify([mcpToolResult ?? ""])}`
			: null,
	].filter((clause): clause is string => clause !== null);

	const response = await runPixel<[string]>(
		`RunMCPTool(${clauses.join(",\n")});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	return response.pixelReturn[0].output;
};

/**
 * List every direct subagent run spawned by a parent run, newest first —
 * durable and DB-backed (GetSubagentRuns), unlike the ephemeral subagent item
 * events on the parent's own stream. Use to reconstruct subagent state after
 * a reload, where the stream has nothing left to replay.
 *
 * @param runId - The parent run whose direct subagent runs should be returned.
 * @param insightId - Insight to run the pixel against.
 * @returns Every direct child run, newest first.
 *
 * @deprecated Use `runPixel(buildPixel("GetSubagentRuns", { runId }), insightId)` with
 * `buildPixel` and `runPixel` from `@semoss/sdk`. Check `errors` before reading
 * `pixelReturn[0]?.output`; raw reactor output may differ from this helper's declared or
 * normalized result. Use the current reactor result contract for child summaries.
 */
export const getSubagentRuns = async (
	runId: string,
	insightId?: string,
): Promise<SubagentRunSummary[]> => {
	if (!runId) {
		throw new Error("Missing runId");
	}

	const response = await runPixel<[SubagentRunSummary[]]>(
		`GetSubagentRuns(runId=${JSON.stringify([runId])});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	return response.pixelReturn[0].output;
};
