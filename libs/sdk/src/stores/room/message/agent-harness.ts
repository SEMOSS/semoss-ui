import { toError } from "@semoss/utility/error";
import { getSubagentRuns } from "../../../api/agent";
import type {
	AgentRunItemEvent,
	AgentRunItemsState,
	AgentRunSnapshot,
	AgentRunStatusValue,
	PendingAgentAction,
} from "../../../types";
import { AgentStore } from "../../agent/agent.store";
import { batchChanges } from "../observable-store";
import {
	MCP_EXECUTION_AGENT_ASK,
	MCP_EXECUTION_AGENT_AUTO,
	MCP_EXECUTION_ASK,
} from "../room.constants";
import type {
	PixelMessageSubagentPart,
	PixelMessageToolCallPart,
} from "../room.types";
import type { RoomEngine } from "../room-engine.store";
import type { ToolCallStore } from "../tool-call.store";
import { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * Agent harness type sent to the backend RunAgent reactor.
 */
export const AGENT_HARNESS_TYPE = "semoss";

/**
 * Live AgentStores keyed by runId, so a decision made from the tool UI (which
 * only has the pendingAction, not the run's watcher) can poke the SAME
 * instance that's polling it, and reconnectAgentRun never mounts a second,
 * destructive poller on a run runAgentMessage (or an earlier reconnect) is
 * already watching.
 */
const agentsByRunId = new Map<string, AgentStore>();

/**
 * Get the live AgentStore for a run if one is already being watched,
 * otherwise create (and register) a fresh, not-yet-watched one.
 */
const getOrCreateAgent = (
	roomId: string,
	insightId: string,
	runId: string,
): AgentStore => {
	const existing = agentsByRunId.get(runId);
	if (existing) {
		return existing;
	}
	const agent = new AgentStore(roomId, insightId, runId);
	agentsByRunId.set(runId, agent);
	return agent;
};

/**
 * QUEUED and INPUT_REQUIRED have no branch — they leave the tool at
 * the tool call store's own default "INITIAL" status, which renders as the ask/awaiting
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
 * Agent-run tool items arrive fully parsed (no placeholder phase like the
 * OpenAI-delta tool stream in tool-stream.ts). `item.metadata` is the tool's
 * real `_meta` block, passed through as-is. `item.name` is the raw,
 * engine-id-prefixed LLM-facing name — never display it directly; prefer
 * `item.title` or `metadata.SMSS_ORIGINAL_TOOL_NAME`.
 */
const buildToolCallPart = (item: {
	id: string;
	name: string;
	title?: string;
	arguments: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}): PixelMessageToolCallPart => {
	const originalName =
		(item.metadata?.SMSS_ORIGINAL_TOOL_NAME as string | undefined) ||
		item.name;
	const displayName = item.title || originalName;
	return {
		type: "TOOL_CALL",
		toolCall: {
			id: item.id,
			type: "function",
			name: item.name,
			title: displayName,
			arguments: item.arguments,
			_tool_found: true,
			original_name: originalName,
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
	};
};

/**
 * Synthesize a TOOL_CALL part when reconnecting to an ask tool whose queued
 * stream item was missed. Live runs normally receive item.started before the
 * PendingAgentAction snapshot, so syncPendingActions keeps the existing part.
 * Always agent-ask: only ask tools ever become pending actions.
 */
const buildPendingToolCallPart = (
	action: PendingAgentAction,
	toolCallId: string,
): PixelMessageToolCallPart => {
	const displayName =
		(action.toolMeta?.SMSS_ORIGINAL_TOOL_NAME as string | undefined) ||
		action.toolName ||
		"";
	return {
		type: "TOOL_CALL",
		toolCall: {
			id: toolCallId,
			type: "function",
			name: action.toolName ?? "",
			title: displayName,
			arguments: action.toolArgs ?? {},
			_tool_found: true,
			original_name: displayName,
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
	};
};

/**
 * Find an already-pushed SUBAGENT part by its item id, for item.updated/
 * item.completed to mutate in place.
 */
const findSubagentPart = (
	responseMessage: ResponseMessageStore,
	id: string,
): PixelMessageSubagentPart | undefined =>
	responseMessage.parts.find(
		(part): part is PixelMessageSubagentPart =>
			part.type === "SUBAGENT" && part.subagent.id === id,
	);

/**
 * Change a SUBAGENT part's status and outcome, as a new part.
 *
 * @param responseMessage - The message holding the part.
 * @param id - The subagent's id.
 * @param update - Its new status and outcome.
 */
const updateSubagentPart = (
	responseMessage: ResponseMessageStore,
	id: string,
	update: Pick<
		PixelMessageSubagentPart["subagent"],
		"status" | "resultPreview" | "error"
	>,
): void => {
	responseMessage.updateParts(
		(part) => part.type === "SUBAGENT" && part.subagent.id === id,
		(part) =>
			part.type === "SUBAGENT"
				? { ...part, subagent: { ...part.subagent, ...update } }
				: part,
	);
};

/**
 * Apply one agent-run item event onto the response message, inside a
 * {@link batchChanges}. Tool status reads from `items` (the SDK's
 * already-merged state), not the raw event, so Playground never handles
 * patch merging itself. Text is read straight off the event.
 */
const applyAgentRunItem = (
	responseMessage: ResponseMessageStore,
	event: AgentRunItemEvent,
	items: AgentRunItemsState,
) => {
	const room = responseMessage.room;

	if (event.type === "item.started") {
		const { item } = event;
		// The sequential reveal queue (response-message.tsx) holds on the last
		// part while isThinking is true, waiting for more content on that same
		// part — fine for streamed deltas, but agent-run items arrive as
		// one-shot bursts, so it would hang forever and hide every part after.
		// room.isLoading already covers "run still in progress" for the input
		// box, so it's safe to drop this once any real content exists.
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
			responseMessage.appendPart(part);
			room.syncTool(item.id, responseMessage, part);
			// syncMessage's TOOL_CALL branch never sets status, so seed it here —
			// otherwise a tool with no item.updated in between sits at "INITIAL"
			// (no loading UI) until it jumps straight to item.completed's status.
			const tool = room.getTool(item.id);
			const status = mapToolStatus(item.status);
			if (tool && status) {
				tool.status = status;
			}
		} else if (item.kind === "subagent") {
			responseMessage.appendPart({
				type: "SUBAGENT",
				subagent: {
					id: item.id,
					status: item.status,
					alias: item.alias,
					resultPreview: item.resultPreview,
					error: item.error,
				},
			});
		}
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
		} else if (event.kind === "subagent") {
			const merged = items.itemsById[event.itemId];
			if (merged?.kind === "subagent") {
				updateSubagentPart(responseMessage, event.itemId, {
					status: merged.status,
					resultPreview: merged.resultPreview,
					error: merged.error,
				});
			}
		}
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
	} else if (item.kind === "subagent") {
		updateSubagentPart(responseMessage, item.id, {
			status: item.status,
			resultPreview: item.resultPreview,
			error: item.error,
		});
	}
	// message/reasoning completion carries no new text (see comment above).
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
	const byToolCallId = new Map<string, PendingAgentAction>(
		(pendingActions ?? [])
			.filter(
				(
					action,
				): action is PendingAgentAction & { toolCallId: string } =>
					Boolean(action.toolCallId),
			)
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
		const part = buildPendingToolCallPart(action, toolCallId);
		responseMessage.appendPart(part);
		room.syncTool(toolCallId, responseMessage, part);
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

/** The pending actions the host already answered, so each is decided once. */
const autoDecidedActionIds = new Set<string>();

/**
 * Offer each new pending action to the host's `onPendingAction` first; an
 * action it answers is decided at once and never shown to the user.
 *
 * @param responseMessage - The response of the paused run.
 * @param pendingActions - The run's pending actions.
 */
const autoDecidePendingActions = (
	responseMessage: ResponseMessageStore,
	pendingActions: readonly PendingAgentAction[] | undefined,
): void => {
	const room = responseMessage.room;
	const onPendingAction = room.config.onPendingAction;
	if (!onPendingAction) {
		return;
	}
	for (const action of pendingActions ?? []) {
		if (autoDecidedActionIds.has(action.actionId)) {
			continue;
		}
		autoDecidedActionIds.add(action.actionId);
		void (async () => {
			try {
				const answer = await onPendingAction(action, room);
				if (!answer) {
					return;
				}
				const agent = getOrCreateAgent(
					room.roomId,
					room.insightId,
					action.runId,
				);
				await agent.decide(action, answer.decision, answer.paramValues);
			} catch (e) {
				console.error("Failed to decide a pending action", e);
			}
		})();
	}
};

/**
 * Resolve a tool call paused on a human decision. The legacy ask-tool paths
 * write straight into room history and never touch the AGENT_RUN_ACTION row,
 * so this is the only call that actually resumes the run. Thin wrapper over AgentStore.decide.
 */
export const decideAgentToolAction = async (
	tool: ToolCallStore,
	decision: "reject" | "submit" | "respond",
	paramValues?: Record<string, unknown>,
): Promise<void> => {
	const pendingAction = tool.pendingAction;
	if (!pendingAction) {
		return;
	}
	const agent = getOrCreateAgent(
		tool.room.roomId,
		tool.room.insightId,
		pendingAction.runId,
	);
	await agent.decide(pendingAction, decision, paramValues);
};

/**
 * Poll a run to completion, applying its events/snapshots onto
 * responseMessage. Shared between a fresh submit (runAgentMessage) and
 * reconnecting to one already in progress after a page reload
 * (reconnectAgentRun) — the wiring is identical either way, only how the
 * `agent` was obtained differs.
 */
const watchAgentRun = (
	agent: AgentStore,
	responseMessage: ResponseMessageStore,
	inputMessage: InputMessageStore | null,
): Promise<void> =>
	new Promise<void>((resolve, reject) => {
		const settleTerminal = (snapshot: AgentRunSnapshot) => {
			const status: AgentRunStatusValue = snapshot.status;
			if (
				status !== "COMPLETED" &&
				status !== "FAILED" &&
				status !== "CANCELLED"
			) {
				return;
			}
			agent.stop();
			// the harness's tools write the room's files server-side, so a view
			// of them misses the turn's files
			responseMessage.room.refreshFiles();
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

		agent.watch({
			onEvent: (event, items) => {
				batchChanges(() => {
					applyAgentRunItem(responseMessage, event, items);
				});
			},
			onSnapshot: (snapshot) => {
				batchChanges(() => {
					syncPendingActions(
						responseMessage,
						snapshot.pendingActions,
					);
				});
				autoDecidePendingActions(
					responseMessage,
					snapshot.pendingActions,
				);
			},
			onReconcile: (snapshot) => {
				batchChanges(() => {
					if (inputMessage && snapshot.inputMessageId) {
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
	}).finally(() => {
		if (agentsByRunId.get(agent.runId) === agent) {
			agentsByRunId.delete(agent.runId);
		}
	});

/**
 * Run a user message through the server-side agent harness (RunAgent).
 *
 * Submits without waiting (wait=false), then drives the response via
 * AgentStore.watch. A non-COMPLETED terminal status rejects (caller removes
 * the optimistic input). INPUT_REQUIRED leaves the turn mounted and pending;
 * paused tool calls surface via ToolCallStore.pendingAction for the approval UI.
 */
export const runAgentMessage = async (
	message: ResponseMessageStore,
	inputMessage: InputMessageStore,
	existingResponse?: ResponseMessageStore,
) => {
	const room = message.room;

	// Create a placeholder response message to stream content into
	const responseMessage =
		existingResponse ?? room.createResponsePlaceholder();

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

		// attachments uploaded to the room's insight, as AskPlayground sends them
		const media = inputMessage.parts.reduce<string[]>((acc, part) => {
			if (part.type === "MEDIA" && part.mediaInfo.fileLocation) {
				acc.push(part.mediaInfo.fileLocation);
			}
			return acc;
		}, []);

		const handle = await AgentStore.start(
			{
				roomId: room.roomId,
				command: text,
				engine: room.model.engine_id,
				harnessType: AGENT_HARNESS_TYPE,
				agentId: room.options.workspace?.workspace_id,
				media: media,
				...room.config.runParams,
			},
			room.insightId,
		);
		agentsByRunId.set(handle.runId, handle);

		await watchAgentRun(handle, responseMessage, inputMessage);
	} catch (e) {
		// remove message if we failed
		message.removeChild(inputMessage);

		// A chat turn's stream sets the room error itself; nothing does for a
		// run, and a new chat sends its first message without awaiting it, so
		// without this the failure is never shown.
		room.setError(toError(e));

		throw e;
	} finally {
		batchChanges(() => {
			// turn off thinking
			responseMessage.isThinking = false;
		});
		room.setIsLoading(false);
	}
};

/**
 * Find the message whose TOOL_CALL spawned childRunId, by matching the
 * TOOL_RESULT whose output carries a `jobId`/`runId` equal to it.
 */
const findSpawningMessage = (
	messages: (InputMessageStore | ResponseMessageStore)[],
	childRunId: string,
): ResponseMessageStore | undefined => {
	let toolCallId: string | undefined;
	for (const message of messages) {
		if (!(message instanceof InputMessageStore)) continue;
		for (const part of message.parts) {
			if (part.type !== "TOOL_RESULT") continue;
			try {
				const output = JSON.parse(part.toolResult.output) as {
					jobId?: string;
					runId?: string;
				};
				if (
					output.jobId === childRunId ||
					output.runId === childRunId
				) {
					toolCallId = part.toolResult.toolCallId;
					break;
				}
			} catch {
				// not JSON — not a spawn result
			}
		}
		if (toolCallId) break;
	}
	if (!toolCallId) {
		return undefined;
	}
	return messages.find(
		(message): message is ResponseMessageStore =>
			message instanceof ResponseMessageStore &&
			message.parts.some(
				(part) =>
					part.type === "TOOL_CALL" &&
					part.toolCall.id === toolCallId,
			),
	);
};

/**
 * Rebuilds every subagent from GetSubagentRuns (one query per agentRunId)
 * since live subagent parts don't survive a reload. Placed on the spawning
 * message (see findSpawningMessage), using the same part shape/id as the live
 * path so later updates mutate it instead of duplicating.
 */
export const reconstructAllSubagents = async (room: RoomEngine) => {
	const messagesByRunId = new Map<
		string,
		(InputMessageStore | ResponseMessageStore)[]
	>();
	room.history.forEach((message) => {
		const runId = message.agentRun?.runId;
		if (!runId) return;
		const messages = messagesByRunId.get(runId) ?? [];
		messages.push(message);
		messagesByRunId.set(runId, messages);
	});

	for (const [runId, messages] of messagesByRunId) {
		try {
			const subagents = await getSubagentRuns(runId, room.insightId);
			batchChanges(() => {
				subagents.forEach((subagent) => {
					const responseMessages = messages.filter(
						(message): message is ResponseMessageStore =>
							message instanceof ResponseMessageStore,
					);
					const target =
						findSpawningMessage(messages, subagent.runId) ??
						responseMessages[responseMessages.length - 1];
					if (!target || findSubagentPart(target, subagent.runId)) {
						return;
					}
					target.appendPart({
						type: "SUBAGENT",
						subagent: {
							id: subagent.runId,
							status: subagent.status,
							resultPreview: subagent.finalText ?? undefined,
							error: subagent.errorMessage ?? undefined,
						},
					});
				});
			});
		} catch (e) {
			console.error("Failed to reconstruct subagent runs", e);
		}
	}
};

/**
 * Re-establish live polling for a room's most recent agent run after a page
 * reload, since an AgentStore otherwise only ever starts watching from
 * runAgentMessage's own submit. Fire-and-forget; a no-op if the message was
 * never part of an agent run, or if it already settled.
 */
export const reconnectAgentRun = (responseMessage: ResponseMessageStore) => {
	const runId = responseMessage.agentRun?.runId;
	if (!runId) {
		return;
	}

	const room = responseMessage.room;
	const inputMessage =
		responseMessage.parent instanceof InputMessageStore
			? responseMessage.parent
			: null;

	room.setIsLoading(true);
	batchChanges(() => {
		responseMessage.isThinking = true;
	});

	(async () => {
		try {
			const agent = getOrCreateAgent(room.roomId, room.insightId, runId);
			await watchAgentRun(agent, responseMessage, inputMessage);
		} catch (e) {
			console.error("Failed to reconnect to agent run", e);
			room.setError(toError(e));
		} finally {
			batchChanges(() => {
				responseMessage.isThinking = false;
			});
			room.setIsLoading(false);
		}
	})();
};
