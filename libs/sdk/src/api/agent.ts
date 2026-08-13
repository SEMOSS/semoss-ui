import { Env } from "../env";
import { post } from "../utility";
import type {
	AgentRunItemEvent,
	AgentRunSnapshot,
	AgentRunStatusValue,
	AgentToolDecision,
} from "./agent.types";
import { runPixel } from "./base";

export type * from "./agent.types";

/**
 * Submit a durable agent run without waiting for it to finish (RunAgent with
 * wait=false). Poll progress with pollAgentRun(runId) or subscribeAgentRun.
 *
 * @param params.roomId - Room the run's messages are written to.
 * @param params.command - The user's message text.
 * @param params.engine - Model engine id. Defaults to the room's configured model.
 * @param params.harnessType - Which agent harness runs the loop (e.g. "semoss").
 * @param params.workspaceId - Workspace whose tools/config the run should use.
 * @param params.maxTurns - Cap on model round-trips before the run stops itself.
 * @param params.maxReflections - Cap on self-reflection turns.
 * @param params.images - Image file locations to attach to the command.
 * @param params.urls - URLs to attach to the command.
 * @param insightId - Insight to run the pixel against.
 * @returns The submitted run's id, room id, and initial status (always
 * "SUBMITTED") — not a full snapshot.
 */
export const submitAgentRun = async (
	params: {
		roomId: string;
		command: string;
		engine?: string;
		harnessType?: string;
		workspaceId?: string;
		maxTurns?: number;
		maxReflections?: number;
		images?: string[];
		urls?: string[];
	},
	insightId?: string,
): Promise<{ runId: string; roomId: string; status: AgentRunStatusValue }> => {
	const {
		roomId,
		command,
		engine,
		harnessType,
		workspaceId,
		maxTurns,
		maxReflections,
		images,
		urls,
	} = params;

	const clauses = [
		`roomId=${JSON.stringify([roomId])}`,
		`command=${JSON.stringify([command])}`,
		engine ? `engine=${JSON.stringify([engine])}` : null,
		harnessType ? `harnessType=${JSON.stringify(harnessType)}` : null,
		workspaceId ? `workspaceId=${JSON.stringify([workspaceId])}` : null,
		maxTurns !== undefined ? `maxTurns=${JSON.stringify(maxTurns)}` : null,
		maxReflections !== undefined
			? `maxReflections=${JSON.stringify(maxReflections)}`
			: null,
		images && images.length > 0 ? `image=${JSON.stringify(images)}` : null,
		urls && urls.length > 0 ? `url=${JSON.stringify(urls)}` : null,
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
			? `paramValues=${JSON.stringify(paramValues)}`
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
