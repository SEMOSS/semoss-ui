import { Env } from "../env";
import { post } from "../utility";
import type {
	AgentRunItemEvent,
	AgentRunSnapshot,
	AgentRunStatusValue,
	AgentToolDecision,
	SubagentRunSummary,
} from "./agent.types";
import { runPixel } from "./base";

export type * from "./agent.types";

/**
 * Submit a durable agent run without waiting for it to finish (RunAgent with
 * wait=false). Poll progress with pollAgentRun(runId) or subscribeRunAgent.
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
 * @param params.images - Image file locations to attach to the command.
 * @param params.urls - URLs to attach to the command.
 * @param params.paramValues - Extra run parameters forwarded to the harness.
 * The semoss harness honors `project` (project the run edits; also drives the
 * git-commit hook), `permissionMode` ("default" | "acceptEdits" | "plan" |
 * "bypassPermissions"), and strips its known keys before passing the rest
 * (e.g. `thinking`, `effort`) through to the model provider.
 * @param insightId - Insight to run the pixel against.
 * @returns The submitted run's id, room id, and initial status (always
 * "SUBMITTED") — not a full snapshot.
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
		images?: string[];
		urls?: string[];
		paramValues?: Record<string, unknown>;
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
		images,
		urls,
		paramValues,
	} = params;

	const clauses = [
		`roomId=${JSON.stringify([roomId])}`,
		`command=${JSON.stringify([command])}`,
		engine ? `engine=${JSON.stringify([engine])}` : null,
		harnessType ? `harnessType=${JSON.stringify(harnessType)}` : null,
		// The backend's RunAgent pixel calls this workspaceId -- see the agentId
		// param doc above for why the public name here differs.
		agentId ? `workspaceId=${JSON.stringify([agentId])}` : null,
		maxTurns !== undefined ? `maxTurns=${JSON.stringify(maxTurns)}` : null,
		maxReflections !== undefined
			? `maxReflections=${JSON.stringify(maxReflections)}`
			: null,
		images && images.length > 0 ? `image=${JSON.stringify(images)}` : null,
		urls && urls.length > 0 ? `url=${JSON.stringify(urls)}` : null,
		paramValues && Object.keys(paramValues).length > 0
			? `paramValues=[${JSON.stringify(paramValues)}]`
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

	const response = await post<{
		run: AgentRunSnapshot;
		events: AgentRunItemEvent[];
		droppedEvents: number;
	}>(`${Env.MODULE}/api/engine/agentRunStreaming`, { runId });

	return response.data;
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

	const response = await runPixel<[AgentRunSnapshot & { messages?: M[] }]>(
		`GetAgentRun(${clauses.join(",\n")});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	const output = response.pixelReturn[0].output;

	// The backend only sets pendingActions while INPUT_REQUIRED — normalize it
	// here so this always matches AgentRunSnapshot's contract for every caller.
	return { ...output, pendingActions: output.pendingActions ?? [] };
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
 */
export const stopAgentRun = async (
	runId: string,
	insightId?: string,
): Promise<AgentRunSnapshot> => {
	if (!runId) {
		throw new Error("Missing runId");
	}

	const response = await runPixel<[AgentRunSnapshot]>(
		`StopAgentRun(runId=${JSON.stringify([runId])});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	const output = response.pixelReturn[0].output;

	// Same normalization as getAgentRun — the backend omits pendingActions
	// unless the run is INPUT_REQUIRED.
	return { ...output, pendingActions: output.pendingActions ?? [] };
};

/**
 * Decide a pending agent tool call (RunMCPTool's HITL path) — resumes the run
 * once every pending action in the batch has been decided. For the common
 * case of resolving approve vs. edit from submitted params automatically, use
 * submitAgentToolDecision instead.
 *
 * @param params.actionId - The PendingAgentAction.actionId being decided.
 * @param params.decision - "approve"/"edit" execute the tool; "reject"/"respond" don't.
 * @param params.paramValues - Required for "edit" and "respond"; ignored otherwise.
 * @param insightId - Insight to run the pixel against.
 * @returns The tool-result string the decision produced.
 */
export const decideAgentRunAction = async (
	params: {
		actionId: string;
		decision: AgentToolDecision;
		paramValues?: Record<string, unknown>;
	},
	insightId?: string,
): Promise<string> => {
	const { actionId, decision, paramValues } = params;

	const clauses = [
		`actionId=${JSON.stringify([actionId])}`,
		`decision=${JSON.stringify([decision])}`,
		decision === "edit" || decision === "respond"
			? `paramValues=${JSON.stringify(paramValues ?? {})}`
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
