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
 * Maps an AgentToolItem's status onto ToolStore's status enum. ToolStore has
 * no dedicated "waiting on a human decision" state (see PendingAgentAction /
 * approval UI — not yet built), so INPUT_REQUIRED is approximated as LOADING:
 * honestly "still in progress" without falsely reading as done. QUEUED has no
 * branch here — it's ToolStore's own default status for a freshly synced
 * tool, so nothing needs setting.
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
 * Build a TOOL_CALL part from a fully-parsed AgentToolItem. Unlike the
 * OpenAI-delta tool stream (tool-stream.ts), agent-run tool items always
 * arrive complete — full name/arguments/metadata — so there's no placeholder
 * phase to manage here.
 *
 * SMSS_MCP_EXECUTION is forced to "disabled" regardless of what the item's
 * metadata carries: the backend harness already executed this tool itself
 * (HarnessToolExecutor / AgentToolDecisionHandler). The FE must never queue it
 * for its own client-side dispatch (continueToolExecution's auto-run path) —
 * that would re-run a tool the backend already ran.
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
 * Apply one canonical agent-run item event onto the response message. Must
 * already be inside a mobx action.
 *
 * `items` is the SDK's own assembled state for this event (subscribeAgentRun
 * runs applyAgentRunItemEvent internally and hands back the result) — tool
 * status reads come from there rather than from the raw event, so Playground
 * never has to know whether a given update was a delta or a patch, or how
 * multiple patches merge together; that's protocol-level knowledge the SDK
 * already owns.
 *
 * message/reasoning text is the one exception: it's read straight off the
 * event rather than off `items`, because the raw event already gives exactly
 * what needs to be appended in either case text can arrive (see
 * AgentRunStreamService on the backend) — deltas (item.started with empty
 * text, then item.updated.delta chunks) or all-at-once (item.started already
 * carries the full text, no item.updated at all — e.g. a resume path where
 * nothing streamed incrementally). savePart's own merge-consecutive-parts
 * behavior does the accumulation; item.completed never re-saves text, since
 * one of the two paths above already built it.
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
 * Submits the run without waiting (wait=false) and drives the response
 * through the SDK's agent-run subscription: item events (message/reasoning
 * deltas, tool lifecycle) stream in via applyAgentRunItem, and the durable
 * snapshot reconciles the turn at INPUT_REQUIRED/terminal boundaries.
 *
 * A non-COMPLETED terminal status rejects, matching the prior contract (the
 * caller removes the optimistic input on failure). INPUT_REQUIRED does not
 * settle this promise — the turn stays mounted, "thinking," until the run
 * resumes or finishes. There is no pending-action UI yet (see
 * PendingAgentAction), so a paused run currently has no way to move forward
 * from the FE short of a future decideAgentRunAction-backed affordance.
 *
 * @param message - The response message store initiating the turn. Its room is
 *   used and the new messages are wired beneath it.
 * @param inputMessage - The user input message to send to the agent.
 * @param existingResponse - Optional pre-created response placeholder already
 *   wired into the message tree. When provided, skips creating a new
 *   ResponseMessageStore and the addChild setup.
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

	// The old code relied on streamJob.run()'s own showLoading toggle. This
	// path no longer goes through streamJob, so it owns room.isLoading itself.
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
