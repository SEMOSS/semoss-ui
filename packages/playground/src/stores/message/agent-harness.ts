import { runInAction } from "mobx";
import type {
	AgentRunItemEvent,
	AgentRunItemsState,
	AgentRunSnapshot,
	AgentRunStatusValue,
	AgentRunSubscription,
	PendingAgentAction,
} from "@semoss/sdk";
import {
	decideAgentRunAction,
	submitAgentRun,
	subscribeAgentRun,
} from "@semoss/sdk/react";
import {
	MCP_EXECUTION_AGENT_ASK,
	MCP_EXECUTION_AGENT_AUTO,
	MCP_EXECUTION_ASK,
	STREAMING_PLACEHOLDER_ID,
} from "@/constants";
import type { PixelMessageToolCallPart, ResponsePixelMessage } from "@/types";
import type { ToolStore } from "../tool/tool.store";
import type { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * Agent harness type sent to the backend RunAgent reactor.
 */
export const AGENT_HARNESS_TYPE = "semoss";

/**
 * QUEUED and INPUT_REQUIRED have no branch — they leave the tool at
 * ToolStore's own default "INITIAL" status, which renders as the ask/awaiting
 * card (see getShouldGroupTool/getToolState, keyed off execution mode via
 * isAskExecutionMode) rather than a generic loading spinner.
 */
const mapToolStatus = (
	status: string,
): "LOADING" | "SUCCESS" | "ERROR" | "CANCELLED" | null => {
	switch (status) {
		case "RUNNING":
			return "LOADING";
		case "COMPLETED":
			return "SUCCESS";
		case "FAILED":
			return "ERROR";
		case "REJECTED":
		case "CANCELLED":
			return "CANCELLED";
		default:
			return null;
	}
};

/**
 * The backend never client-dispatches an agent-run tool, so its execution
 * mode must never literally be "auto" (the FE's own continueToolExecution
 * would try to re-run it) or "ask" (the legacy ask-decision flow would try to
 * resolve it via RunMCPTool instead of decideAgentRunAction). Tagging with an
 * agent- prefix avoids both while still preserving which one it originally
 * was, so ask/auto-mode rendering (grouping, tool UI, custom UI resolution)
 * stays keyed on execution mode alone — see isAskExecutionMode.
 */
const toAgentExecutionMode = (originalExecution: unknown): string =>
	originalExecution === MCP_EXECUTION_ASK
		? MCP_EXECUTION_AGENT_ASK
		: MCP_EXECUTION_AGENT_AUTO;

/**
 * Agent-run tool items arrive fully parsed, unlike the OpenAI-delta tool
 * stream (tool-stream.ts) — no placeholder phase needed.
 *
 * `item.metadata` is the tool's real `_meta` block (SMSS_ORIGINAL_TOOL_NAME,
 * SMSS_ENGINE_ID, etc.), passed through as-is by the backend — not wrapped in
 * another `_meta`.
 */
const buildToolCallPart = (item: {
	id: string;
	name: string;
	arguments: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}): PixelMessageToolCallPart => ({
	type: "TOOL_CALL",
	toolCall: {
		id: item.id,
		type: "function",
		name: item.name,
		arguments: item.arguments,
		_tool_found: true,
		original_name: item.name,
		description: "",
		_meta: {
			SMSS_ENGINE_NAME: "",
			SMSS_ENGINE_ID: "",
			SMSS_ENGINE_TYPE: "",
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
			...item.metadata,
			SMSS_MCP_EXECUTION: toAgentExecutionMode(
				item.metadata?.SMSS_MCP_EXECUTION,
			),
		},
	} as PixelMessageToolCallPart["toolCall"],
});

/**
 * The backend never emits a stream item for a tool call awaiting an ask
 * decision (HarnessToolExecutor throws AgentInputRequiredException before any
 * item.started for it) — it only exists as a PendingAgentAction on the
 * snapshot. Synthesize its TOOL_CALL part here so it renders without a page
 * refresh. Always agent-ask: only ask tools ever become pending actions.
 */
const buildPendingToolCallPart = (
	action: PendingAgentAction,
): PixelMessageToolCallPart => ({
	type: "TOOL_CALL",
	toolCall: {
		id: action.toolCallId as string,
		type: "function",
		name: action.toolName ?? "",
		arguments: action.toolArgs ?? {},
		_tool_found: true,
		original_name: action.toolName ?? "",
		description: "",
		_meta: {
			SMSS_ENGINE_NAME: "",
			SMSS_ENGINE_ID: "",
			SMSS_ENGINE_TYPE: "",
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
			...action.toolMeta,
			SMSS_MCP_EXECUTION: MCP_EXECUTION_AGENT_ASK,
		},
	} as PixelMessageToolCallPart["toolCall"],
});

/**
 * Apply one agent-run item event onto the response message. Must already be
 * inside a mobx action.
 *
 * Tool status reads from `items` (the SDK's already-merged state) rather
 * than the raw event, so Playground never handles patch merging itself.
 * Text is read straight off the event — item.started carries either empty
 * text (deltas follow) or the full text (nothing streamed incrementally);
 * item.completed never re-saves text either way.
 */
const applyAgentRunItem = (
	responseMessage: ResponseMessageStore,
	event: AgentRunItemEvent,
	items: AgentRunItemsState,
) => {
	const room = responseMessage.room;

	if (event.type === "item.started") {
		const { item } = event;
		// The sequential reveal queue (response-message.tsx) holds at the last
		// known part while isThinking is true, waiting to see if more content
		// lands on that SAME part. That's fine for token-by-token deltas, but
		// agent-run items arrive as one-shot bursts — the queue can hold
		// forever on a part that already finished animating, with no later
		// event left to re-trigger it, permanently hiding every part after it
		// (e.g. a tool call that starts moments after its preceding text).
		// room.isLoading (set by runAgentMessage) already covers "run still in
		// progress" for the input box, so it's safe to drop this the moment
		// any real content exists.
		responseMessage.isThinking = false;
		if (item.kind === "message" && item.text) {
			responseMessage.savePart({
				type: "TEXT",
				text: item.text,
				uiText: item.text,
			});
		} else if (item.kind === "reasoning" && item.summary) {
			responseMessage.savePart({
				type: "THINKING",
				thinking: item.summary,
			});
		} else if (item.kind === "tool") {
			const part = buildToolCallPart(item);
			responseMessage.parts.push(part);
			room.syncTool(item.id, responseMessage, part);
			// syncMessage's TOOL_CALL branch never sets status, so seed it here —
			// otherwise a tool with no item.updated in between sits at "INITIAL"
			// (no loading UI) until it jumps straight to item.completed's status.
			const tool = room.getTool(item.id);
			const status = mapToolStatus(item.status);
			if (tool && status) {
				tool.status = status;
			}
		}
		// subagent: not yet rendered — see AgentSubagentItem/tools-view follow-up.
		return;
	}

	if (event.type === "item.updated") {
		if (event.kind === "message" && event.delta) {
			responseMessage.savePart({
				type: "TEXT",
				text: event.delta,
				uiText: event.delta,
			});
		} else if (event.kind === "reasoning" && event.delta) {
			responseMessage.savePart({
				type: "THINKING",
				thinking: event.delta,
			});
		} else if (event.kind === "tool") {
			const tool = room.getTool(event.itemId);
			const merged = items.itemsById[event.itemId];
			const status =
				merged?.kind === "tool" ? mapToolStatus(merged.status) : null;
			if (tool && status) {
				tool.status = status;
			}
		}
		// subagent: not yet rendered.
		return;
	}

	// item.completed
	const { item } = event;
	if (item.kind === "tool") {
		const tool = room.getTool(item.id);
		if (!tool) {
			return;
		}
		const status = mapToolStatus(item.status);
		if (status) {
			tool.status = status;
		}
		tool.response = item.output ?? item.error ?? "";
	}
	// message/reasoning completion carries no new text (see comment above).
	// subagent: not yet rendered.
};

/**
 * Sync each tool's pendingAction from the run's current snapshot. Matched by
 * toolCallId; a tool not in `pendingActions` is cleared (its decision has
 * been made, or it was never a pending call).
 */
const syncPendingActions = (
	responseMessage: ResponseMessageStore,
	pendingActions: readonly PendingAgentAction[] | undefined,
) => {
	const room = responseMessage.room;
	const byToolCallId = new Map(
		(pendingActions ?? [])
			.filter((action) => action.toolCallId)
			.map((action) => [action.toolCallId, action]),
	);

	byToolCallId.forEach((action, toolCallId) => {
		const hasPart = responseMessage.parts.some(
			(part) =>
				part.type === "TOOL_CALL" && part.toolCall.id === toolCallId,
		);
		if (hasPart) {
			return;
		}
		const part = buildPendingToolCallPart(action);
		responseMessage.parts.push(part);
		room.syncTool(toolCallId as string, responseMessage, part);
	});

	responseMessage.parts.forEach((part) => {
		if (part.type !== "TOOL_CALL") {
			return;
		}
		const tool = room.getTool(part.toolCall.id);
		if (!tool) {
			return;
		}
		tool.pendingAction = byToolCallId.get(tool.id) ?? null;
	});
};

/**
 * Live subscriptions for runs currently being driven by runAgentMessage,
 * keyed by runId. Lets decideAgentToolAction — called from UI far away from
 * the subscription itself — poke the poll loop instead of waiting out
 * INPUT_REQUIRED's slower interval for a change this tab just caused.
 */
const activeSubscriptions = new Map<string, AgentRunSubscription>();

/**
 * Resolve a tool call paused on a human decision. The legacy ask-tool paths
 * (message.saveToolExecution, room.processTool, RunMCPTool by
 * project/function) all write straight into room history and never touch the
 * AGENT_RUN_ACTION row — calling them here would leave the backend run stuck
 * at INPUT_REQUIRED forever while a stray, unrelated tool result lands in the
 * room. This is the only call that actually resumes the run.
 *
 * "approve" vs "edit" is derived from whether paramValues differs from the
 * call's original arguments — the backend only accepts paramValues for edit
 * (see decideAgentRunAction). Callers don't need to track that distinction
 * themselves.
 */
export const decideAgentToolAction = async (
	tool: ToolStore,
	decision: "reject" | "submit",
	paramValues?: Record<string, unknown>,
): Promise<void> => {
	const pendingAction = tool.pendingAction;
	if (!pendingAction) {
		return;
	}
	const resolvedDecision =
		decision === "reject"
			? "reject"
			: JSON.stringify(paramValues ?? {}) ===
					JSON.stringify(pendingAction.toolArgs ?? {})
				? "approve"
				: "edit";
	await decideAgentRunAction(
		{
			actionId: pendingAction.actionId,
			decision: resolvedDecision,
			paramValues: resolvedDecision === "edit" ? paramValues : undefined,
		},
		tool.room.insightId,
	);
	// The run resumed the instant the backend applied this decision — poll now
	// rather than waiting out INPUT_REQUIRED's slower interval to notice.
	activeSubscriptions.get(pendingAction.runId)?.pokeNow();
};

/**
 * Run a user message through the server-side agent harness (RunAgent).
 *
 * Submits without waiting (wait=false), then drives the response via
 * subscribeAgentRun. A non-COMPLETED terminal status rejects (caller removes
 * the optimistic input). INPUT_REQUIRED leaves the turn mounted and pending;
 * paused tool calls surface via ToolStore.pendingAction for the approval UI.
 */
export const runAgentMessage = async (
	message: ResponseMessageStore,
	inputMessage: InputMessageStore,
	existingResponse?: ResponseMessageStore,
) => {
	const room = message.room;

	const modelName =
		room.model.engine_display_name || room.model.engine_name || "";

	// Create a placeholder response message to stream content into
	const responseMessage =
		existingResponse ??
		new ResponseMessageStore(room, {
			io: "OUTPUT",
			messageId: STREAMING_PLACEHOLDER_ID,
			visible: true,
			platform_generated: true,
			modelId: room.model.engine_id,
			dateCreated: new Date().toISOString(),
			parts: [
				{
					type: "THINKING",
					thinking: "",
				},
			],
			tokens: 0,
			ornaments: {
				modelName,
			},
		} as ResponsePixelMessage);

	// This path doesn't go through streamJob, so it owns isLoading itself.
	room.setIsLoading(true);

	try {
		if (!existingResponse) {
			// connect to the parent
			message.addChild(inputMessage);

			// Add placeholder as child of input to show streaming text
			inputMessage.addChild(responseMessage);
		}

		// turn on thinking
		responseMessage.isThinking = true;

		// get the text
		const text = inputMessage.parts.reduce((acc, part) => {
			if (part.type === "TEXT") {
				return acc + part.text;
			}

			return acc;
		}, "");

		const handle = await submitAgentRun(
			{
				roomId: room.roomId,
				command: text,
				engine: room.model.engine_id,
				harnessType: AGENT_HARNESS_TYPE,
			},
			room.insightId,
		);

		await new Promise<void>((resolve, reject) => {
			let subscription: AgentRunSubscription | null = null;

			const settleTerminal = (snapshot: AgentRunSnapshot) => {
				const status: AgentRunStatusValue = snapshot.status;
				if (
					status !== "COMPLETED" &&
					status !== "FAILED" &&
					status !== "CANCELLED"
				) {
					return;
				}
				subscription?.stop();
				activeSubscriptions.delete(handle.runId);
				if (status !== "COMPLETED") {
					reject(
						new Error(
							snapshot.errorMessage ||
								`The agent run did not complete: ${status}`,
						),
					);
					return;
				}
				resolve();
			};

			subscription = subscribeAgentRun(handle.runId, {
				onEvent: (event, items) => {
					runInAction(() => {
						applyAgentRunItem(responseMessage, event, items);
					});
				},
				onSnapshot: (snapshot) => {
					runInAction(() => {
						syncPendingActions(
							responseMessage,
							snapshot.pendingActions,
						);
					});
				},
				onReconcile: (snapshot) => {
					runInAction(() => {
						if (snapshot.inputMessageId) {
							inputMessage.id = snapshot.inputMessageId;
						}
						if (snapshot.finalOutputMessageId) {
							responseMessage.id = snapshot.finalOutputMessageId;
						}

						// if nothing streamed as visible text, fall back to finalText
						const hasStreamedText = responseMessage.parts.some(
							(part) => part.type === "TEXT" && part.text,
						);
						if (!hasStreamedText && snapshot.finalText) {
							responseMessage.savePart({
								type: "TEXT",
								text: snapshot.finalText,
								uiText: snapshot.finalText,
							});
						}

						syncPendingActions(
							responseMessage,
							snapshot.pendingActions,
						);
					});
					settleTerminal(snapshot);
				},
				onError: (e) => {
					console.error("Agent run stream error", e);
				},
			});
			activeSubscriptions.set(handle.runId, subscription);
		});
	} catch (e) {
		// remove message if we failed
		message.removeChild(inputMessage);

		throw e;
	} finally {
		runInAction(() => {
			// turn off thinking
			responseMessage.isThinking = false;
		});
		room.setIsLoading(false);
	}
};
