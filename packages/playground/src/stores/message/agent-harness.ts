import { runInAction } from "mobx";
import type {
	AgentRunItemEvent,
	AgentRunItemsState,
	AgentRunSnapshot,
	AgentRunStatusValue,
} from "@semoss/sdk";
import { submitAgentRun, subscribeAgentRun } from "@semoss/sdk/react";
import { STREAMING_PLACEHOLDER_ID } from "@/constants";
import type { PixelMessageToolCallPart, ResponsePixelMessage } from "@/types";
import type { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * Agent harness type sent to the backend RunAgent reactor.
 */
export const AGENT_HARNESS_TYPE = "semoss";

/**
 * ToolStore has no "waiting on a human decision" state yet, so
 * INPUT_REQUIRED is approximated as LOADING. QUEUED has no branch — it's
 * ToolStore's own default status.
 */
const mapToolStatus = (
	status: string,
): "LOADING" | "SUCCESS" | "ERROR" | "CANCELLED" | null => {
	switch (status) {
		case "RUNNING":
		case "INPUT_REQUIRED":
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
 * Agent-run tool items arrive fully parsed, unlike the OpenAI-delta tool
 * stream (tool-stream.ts) — no placeholder phase needed.
 *
 * SMSS_MCP_EXECUTION is forced to "disabled": the backend already executed
 * this tool. The FE must never queue it for its own auto-run path.
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
		...(item.metadata as Record<string, unknown>),
		_meta: {
			SMSS_ENGINE_NAME: "",
			SMSS_ENGINE_ID: "",
			SMSS_ENGINE_TYPE: "",
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
			...(item.metadata?._meta as Record<string, unknown>),
			SMSS_MCP_EXECUTION: "disabled",
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
 * Run a user message through the server-side agent harness (RunAgent).
 *
 * Submits without waiting (wait=false), then drives the response via
 * subscribeAgentRun. A non-COMPLETED terminal status rejects (caller removes
 * the optimistic input). INPUT_REQUIRED leaves the turn mounted and pending —
 * there's no approval UI yet, so a paused run has no way to move forward.
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
			let subscription: { stop: () => void } | null = null;

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
				onSnapshot: () => {
					// pendingActions surfacing is a follow-up (see PendingAgentAction).
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
					});
					settleTerminal(snapshot);
				},
				onError: (e) => {
					console.error("Agent run stream error", e);
				},
			});
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
