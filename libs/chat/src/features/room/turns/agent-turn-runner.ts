import type {
	AgentRunItem,
	AgentRunItemEvent,
	AgentRunItemsState,
	AgentRunSnapshot,
	PendingAgentAction,
} from "@semoss/sdk";
import { AgentStore, getSubagentRuns, isTerminalRunStatus } from "@semoss/sdk";
import type {
	PixelMessageSubagentPart,
	PixelMessageToolCallPart,
} from "../../../types";
import {
	MCP_EXECUTION_AGENT_ASK,
	MCP_EXECUTION_AGENT_AUTO,
	MCP_EXECUTION_ASK,
} from "../../tools/mcp/mcp-constants";
import { InputMessageStore } from "../store/input-message.store";
import type { ResponseMessageData } from "../store/message-map";
import { ResponseMessageStore } from "../store/response-message.store";
import { readInputPayload } from "../store/response-placeholder";
import type { RoomStore } from "../store/room.store";
import type { ToolStore } from "../store/tool.store";
import { isToolSettled, type ToolStatus } from "../store/tool-status";
import { type Turn, type TurnRunner, trackTurn } from "./turn-runner";

/**
 * Agent harness type sent to the backend RunAgent reactor.
 */
export const AGENT_HARNESS_TYPE = "semoss";

/** A run's tool item, as the SDK types it. */
type AgentToolItem = Extract<AgentRunItem, { kind: "tool" }>;

/** A run's item that carries text: a message or a reasoning summary. */
type AgentTextItem = Extract<AgentRunItem, { kind: "message" | "reasoning" }>;

/**
 * The call's status for a run's tool item status. QUEUED and INPUT_REQUIRED
 * have none: they leave the call at its "INITIAL" status, which renders as
 * the ask/awaiting card (see `needsDecision` in ResponseMessageTool and
 * ResponseMessageToolGroup, keyed off execution mode via isAskExecutionMode)
 * rather than a loading spinner.
 *
 * @param status - The tool item's status.
 * @returns The call's status, or null to leave it as it is.
 */
const mapToolStatus = (
	status: AgentToolItem["status"],
): Exclude<ToolStatus, "INITIAL"> | null => {
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
 *
 * @param originalExecution - The tool's own `SMSS_MCP_EXECUTION`.
 * @returns `agent-ask` for an ask tool, else `agent-auto`.
 */
const toAgentExecutionMode = (originalExecution: unknown): string =>
	originalExecution === MCP_EXECUTION_ASK
		? MCP_EXECUTION_AGENT_ASK
		: MCP_EXECUTION_AGENT_AUTO;

/**
 * The TOOL_CALL part for a run's call. `name` is the raw, engine-id-prefixed
 * name the model called; it is never shown, the title is.
 *
 * @param call - The call's id, name, title, original name, arguments,
 * `_meta`, and mode.
 * @returns The part.
 */
const toolCallPart = (call: {
	id: string;
	name: string;
	title: string;
	originalName: string;
	arguments: Record<string, unknown>;
	meta: Record<string, unknown> | null | undefined;
	execution: string;
}): PixelMessageToolCallPart => ({
	type: "TOOL_CALL",
	toolCall: {
		id: call.id,
		type: "function",
		name: call.name,
		title: call.title,
		arguments: call.arguments,
		_tool_found: true,
		original_name: call.originalName,
		description: "",
		_meta: {
			SMSS_ENGINE_NAME: "",
			SMSS_ENGINE_ID: "",
			SMSS_ENGINE_TYPE: "",
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
			...call.meta,
			SMSS_MCP_EXECUTION: call.execution,
		},
	} as PixelMessageToolCallPart["toolCall"],
});

/**
 * Agent-run tool items arrive fully parsed (no placeholder phase like the
 * OpenAI-delta tool stream in tool-stream.ts), with their real `_meta` in
 * `metadata`. The title is `item.title`, else the tool's original name.
 *
 * @param item - The run's tool item.
 * @returns The TOOL_CALL part for it.
 */
const buildToolCallPart = (item: AgentToolItem): PixelMessageToolCallPart => {
	const originalName =
		(item.metadata?.SMSS_ORIGINAL_TOOL_NAME as string | undefined) ||
		item.name;
	return toolCallPart({
		id: item.id,
		name: item.name,
		title: item.title || originalName,
		originalName: originalName,
		arguments: item.arguments,
		meta: item.metadata,
		execution: toAgentExecutionMode(item.metadata?.SMSS_MCP_EXECUTION),
	});
};

/**
 * Synthesize a TOOL_CALL part when reconnecting to an ask tool whose queued
 * stream item was missed. Live runs normally receive item.started before the
 * PendingAgentAction snapshot, so syncPendingActions keeps the existing part.
 * Always agent-ask: only ask tools ever become pending actions.
 *
 * @param action - The run's pending action.
 * @param toolCallId - The call it pauses.
 * @returns The TOOL_CALL part for it.
 */
const buildPendingToolCallPart = (
	action: PendingAgentAction,
	toolCallId: string,
): PixelMessageToolCallPart => {
	const displayName =
		(action.toolMeta?.SMSS_ORIGINAL_TOOL_NAME as string | undefined) ||
		action.toolName ||
		"";
	return toolCallPart({
		id: toolCallId,
		name: action.toolName ?? "",
		title: displayName,
		originalName: displayName,
		arguments: action.toolArgs ?? {},
		meta: action.toolMeta,
		execution: MCP_EXECUTION_AGENT_ASK,
	});
};

/**
 * Find an already-pushed SUBAGENT part by its item id.
 *
 * @param responseMessage - The response that holds it.
 * @param id - The subagent item's id.
 * @returns The part, or undefined.
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
 * The text a run's message or reasoning item carries.
 *
 * @param item - The item, as the SDK merged it.
 * @returns Its text, or an empty string for any other item.
 */
const readItemText = (item: AgentRunItem | undefined): string =>
	item?.kind === "message"
		? item.text
		: item?.kind === "reasoning"
			? item.summary
			: "";

/**
 * The text a TEXT or THINKING part shows.
 *
 * @param part - The part.
 * @returns Its text, or undefined for any other part.
 */
const readPartText = (
	part: ResponseMessageData["parts"][number] | undefined,
): string | undefined =>
	part?.type === "TEXT"
		? part.text
		: part?.type === "THINKING"
			? part.thinking
			: undefined;

/**
 * Writes one run into the response it fills: its items as parts, its tools'
 * statuses and results, and its pending actions. Text and status are read
 * from the SDK's merged items, so a late delta lands on its own item's part
 * and a tool's result is whatever the item holds. Parts the run writes are
 * only ever appended, so each keeps its index for the run's life.
 */
class AgentRunWriter {
	/** The part each message or reasoning item writes into, by item id. */
	private readonly partIndexByItem = new Map<string, number>();

	/** The items whose text makes up each part the run wrote, by part index, in order. */
	private readonly itemsByPart = new Map<number, string[]>();

	/** @param response - The response the run fills. */
	constructor(private readonly response: ResponseMessageStore) {}

	/**
	 * Apply one item event.
	 *
	 * @param event - The event.
	 * @param items - The run's items, with the event already merged in.
	 */
	apply(event: AgentRunItemEvent, items: AgentRunItemsState): void {
		if (event.type === "item.started") {
			this.startItem(event.item, items);
		} else if (event.type === "item.updated") {
			this.updateItem(event.itemId, items);
		} else {
			this.completeItem(event.item, items);
		}
	}

	/**
	 * Add a started item's part.
	 *
	 * @param item - The item as it started.
	 * @param items - The run's merged items.
	 */
	private startItem(item: AgentRunItem, items: AgentRunItemsState): void {
		const response = this.response;
		// The sequential reveal queue (response-message.tsx) holds on the last
		// part while isThinking is true, waiting for more content on that same
		// part — fine for streamed deltas, but agent-run items arrive as
		// one-shot bursts, so it would hang forever and hide every part after.
		// room.isLoading already covers "run still in progress" for the input
		// box, so it's safe to drop this once any real content exists.
		response.setIsThinking(false);
		if (item.kind === "message" || item.kind === "reasoning") {
			this.writeText(item.id, items);
		} else if (item.kind === "tool") {
			const part = buildToolCallPart(item);
			response.addPart(part);
			response.room.syncTool(item.id, response, part);
			// syncTool never sets a status, so seed it from the item: one that
			// already ended settles with its result now
			this.syncToolStatus(item.id, items, item);
		} else if (item.kind === "subagent") {
			response.addPart({
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
	}

	/**
	 * Follow an updated item: its text, its tool's status, or its subagent.
	 *
	 * @param itemId - The item's id.
	 * @param items - The run's merged items.
	 */
	private updateItem(itemId: string, items: AgentRunItemsState): void {
		const merged = items.itemsById[itemId];
		if (merged?.kind === "message" || merged?.kind === "reasoning") {
			this.writeText(itemId, items);
		} else if (merged?.kind === "tool") {
			const status = mapToolStatus(merged.status);
			const tool = this.response.room.getTool(itemId);
			if (tool && status) {
				tool.setStatus(status);
			}
		} else if (merged?.kind === "subagent") {
			this.updateSubagent(merged);
		}
	}

	/**
	 * Settle a completed item: its text, its tool's result, or its subagent.
	 *
	 * @param item - The item as it completed.
	 * @param items - The run's merged items.
	 */
	private completeItem(item: AgentRunItem, items: AgentRunItemsState): void {
		if (item.kind === "message" || item.kind === "reasoning") {
			this.writeText(item.id, items);
		} else if (item.kind === "tool") {
			const tool = this.response.room.getTool(item.id);
			if (tool) {
				tool.settle({
					status: mapToolStatus(item.status) ?? tool.status,
					response: item.output ?? item.error ?? "",
				});
			}
		} else if (item.kind === "subagent") {
			this.updateSubagent(item);
		}
	}

	/**
	 * Seed a just-started tool call's status from its item. A call that has
	 * already ended settles with its output, or its error.
	 *
	 * @param toolId - The call's id.
	 * @param items - The run's merged items.
	 * @param started - The item as it started, when it is not merged yet.
	 */
	private syncToolStatus(
		toolId: string,
		items: AgentRunItemsState,
		started: AgentToolItem,
	): void {
		const tool = this.response.room.getTool(toolId);
		const merged = items.itemsById[toolId];
		const item = merged?.kind === "tool" ? merged : started;
		const status = mapToolStatus(item.status);
		if (!tool || !status) {
			return;
		}
		if (isToolSettled(status)) {
			tool.settle({ status, response: item.output ?? item.error ?? "" });
		} else {
			tool.setStatus(status);
		}
	}

	/**
	 * Write a message or reasoning item's whole text into its part. Its first
	 * text joins the part before it when that is the same kind and the run
	 * wrote it, as consecutive items always have; else it starts a part.
	 * Later text replaces the item's share of that part, wherever it is now.
	 *
	 * @param itemId - The item's id.
	 * @param items - The run's merged items.
	 */
	private writeText(itemId: string, items: AgentRunItemsState): void {
		const item = items.itemsById[itemId] as AgentTextItem | undefined;
		const text = readItemText(item);
		// an empty text never starts a part, nor erases one
		if (!item || !text) {
			return;
		}
		const type = item.kind === "message" ? "TEXT" : "THINKING";
		const parts = this.response.parts;
		let index = this.partIndexByItem.get(itemId);
		if (index === undefined) {
			const lastIndex = parts.length - 1;
			const owners = this.itemsByPart.get(lastIndex);
			if (owners && parts[lastIndex]?.type === type) {
				index = lastIndex;
				owners.push(itemId);
			} else {
				index = parts.length;
				this.itemsByPart.set(index, [itemId]);
			}
			this.partIndexByItem.set(itemId, index);
		}
		const whole = (this.itemsByPart.get(index) ?? [itemId])
			.map((id) => readItemText(items.itemsById[id]))
			.join("");
		const part: ResponseMessageData["parts"][number] =
			type === "TEXT"
				? { type, text: whole, uiText: whole }
				: { type, thinking: whole };
		if (index === parts.length) {
			this.response.addPart(part);
			return;
		}
		// a patch that left the text as it was changes nothing
		if (readPartText(parts[index]) === whole) {
			return;
		}
		const at = index;
		this.response.room.updateMessageParts<ResponseMessageData["parts"]>(
			this.response.key,
			(current) =>
				current.map((existing, i) => (i === at ? part : existing)),
		);
	}

	/**
	 * Follow a subagent item's status, preview and error on its part.
	 *
	 * @param item - The subagent item, as merged or completed.
	 */
	private updateSubagent(
		item: Extract<AgentRunItem, { kind: "subagent" }>,
	): void {
		if (!findSubagentPart(this.response, item.id)) {
			return;
		}
		this.response.updateParts(
			(part): part is PixelMessageSubagentPart =>
				part.type === "SUBAGENT" && part.subagent.id === item.id,
			(part) => ({
				...part,
				subagent: {
					...part.subagent,
					status: item.status,
					resultPreview: item.resultPreview,
					error: item.error,
				},
			}),
		);
	}

	/**
	 * Sync each tool's pendingAction from the run's current snapshot. Matched by
	 * toolCallId; a tool not in `pendingActions` is cleared (its decision has
	 * been made, or it was never a pending call). An action whose call has no
	 * part, because its item.started was missed, gets one.
	 *
	 * @param pendingActions - The run's pending actions.
	 */
	syncPendingActions(
		pendingActions: readonly PendingAgentAction[] | undefined,
	): void {
		const response = this.response;
		const room = response.room;
		const byToolCallId = new Map<string, PendingAgentAction>();
		for (const action of pendingActions ?? []) {
			if (action.toolCallId) {
				byToolCallId.set(action.toolCallId, action);
			}
		}
		byToolCallId.forEach((action, toolCallId) => {
			const hasPart = response.parts.some(
				(part) =>
					part.type === "TOOL_CALL" &&
					part.toolCall.id === toolCallId,
			);
			if (!hasPart) {
				const part = buildPendingToolCallPart(action, toolCallId);
				response.addPart(part);
				room.syncTool(toolCallId, response, part);
			}
		});
		const paused: ToolStore[] = [];
		for (const part of response.parts) {
			if (part.type !== "TOOL_CALL") {
				continue;
			}
			const tool = room.getTool(part.toolCall.id);
			tool?.setPendingAction(byToolCallId.get(tool.id) ?? null);
			if (tool?.pendingAction) {
				paused.push(tool);
			}
		}
		// the client tool calls run in this browser, so it answers the ones that
		// do not wait for the user
		room.chatTools.answerAgentClientCalls(paused);
	}

	/**
	 * Take a durable snapshot: the saved message ids, the final text when none
	 * streamed, and the pending actions.
	 *
	 * @param snapshot - The run's snapshot.
	 * @param input - The user's message, when there is one.
	 */
	reconcile(
		snapshot: AgentRunSnapshot,
		input: InputMessageStore | null,
	): void {
		const response = this.response;
		if (input && snapshot.inputMessageId) {
			input.setId(snapshot.inputMessageId);
		}
		if (snapshot.finalOutputMessageId) {
			response.setId(snapshot.finalOutputMessageId);
		}
		const hasStreamedText = response.parts.some(
			(part) => part.type === "TEXT" && part.text,
		);
		if (!hasStreamedText && snapshot.finalText) {
			response.savePart({
				type: "TEXT",
				text: snapshot.finalText,
				uiText: snapshot.finalText,
			});
		}
		this.syncPendingActions(snapshot.pendingActions);
	}
}

/**
 * Runs an agent room's turns through the server-side harness (RunAgent):
 * submits without waiting, then follows the run with `AgentStore.watch`.
 * Owns the room's live `AgentStore`s by run id, so a decision made from the
 * tool UI (which only has the pending action) reaches the instance that is
 * polling the run, and a reconnect joins the live watch instead of mounting a
 * second, destructive poller.
 */
export class AgentTurnRunner implements TurnRunner {
	/** The room's agent stores, by run id; forgotten once a watch on them settles. */
	private readonly agents = new Map<string, AgentStore>();

	/** The live watch of each run, by run id, for a reconnect to join. */
	private readonly watches = new Map<string, Promise<void>>();

	/** @param room - The room whose turns it runs. */
	constructor(private readonly room: RoomStore) {}

	/**
	 * Start the turn's run and follow it to its end. INPUT_REQUIRED keeps the
	 * turn running; paused calls surface through `ToolStore.pendingAction`.
	 *
	 * @param turn - The turn.
	 * @returns Once the run completes.
	 * @throws When it cannot start, fails, or is cancelled.
	 */
	async run({ input, response }: Turn): Promise<void> {
		const room = this.room;
		// the text, and attachments uploaded to the room's insight, as
		// AskPlayground sends them
		const { text, media } = readInputPayload(input);
		const agent = await AgentStore.start(
			{
				roomId: room.roomId,
				command: text,
				engine: room.model.engine_id,
				harnessType: AGENT_HARNESS_TYPE,
				agentId: room.options.workspace?.workspace_id,
				media: media,
			},
			room.insightId,
		);
		this.agents.set(agent.runId, agent);
		await this.watch(agent, response, input);
	}

	/**
	 * Follow the run a response belongs to again after a page reload, or join
	 * its watch when it is already followed. Fire-and-forget; a response that
	 * is part of no run is left alone.
	 *
	 * @param response - The room's most recent response.
	 */
	reconnect(response: ResponseMessageStore): void {
		const runId = response.agentRun?.runId;
		if (!runId) {
			return;
		}
		const input =
			response.parent instanceof InputMessageStore
				? response.parent
				: null;
		const agent = this.getOrCreateAgent(runId);
		trackTurn(response, () => this.watch(agent, response, input)).catch(
			(e) => {
				console.error("Failed to reconnect to agent run", e);
			},
		);
	}

	/**
	 * The live AgentStore for a run if the room has one, otherwise a fresh,
	 * not-yet-watched one, which the room keeps.
	 *
	 * @param runId - The run's id.
	 * @returns The run's agent store.
	 */
	getOrCreateAgent(runId: string): AgentStore {
		const existing = this.agents.get(runId);
		if (existing) {
			return existing;
		}
		const agent = new AgentStore(
			this.room.roomId,
			this.room.insightId,
			runId,
		);
		this.agents.set(runId, agent);
		return agent;
	}

	/** Forget every run, for a room its owner dropped. Runs keep going. */
	dispose(): void {
		this.agents.clear();
		this.watches.clear();
	}

	/**
	 * Watch a run to its end, applying its events and snapshots to the
	 * response, or join the run's live watch.
	 *
	 * @param agent - The run's agent store.
	 * @param response - The response the run fills.
	 * @param input - The user's message, when there is one.
	 * @returns Resolves when the run completes; rejects when it fails or is cancelled.
	 */
	private watch(
		agent: AgentStore,
		response: ResponseMessageStore,
		input: InputMessageStore | null,
	): Promise<void> {
		const { runId } = agent;
		const live = this.watches.get(runId);
		if (live) {
			return live;
		}
		const writer = new AgentRunWriter(response);
		const watching: Promise<void> = new Promise<void>((resolve, reject) => {
			agent.watch({
				onEvent: (event, items) => writer.apply(event, items),
				onSnapshot: (snapshot) =>
					writer.syncPendingActions(snapshot.pendingActions),
				onReconcile: (snapshot) => {
					writer.reconcile(snapshot, input);
					if (!isTerminalRunStatus(snapshot.status)) {
						return;
					}
					agent.stop();
					// the harness's tools write Room Files server-side, so an
					// open explorer misses the turn's files
					this.room.refreshWorkbenchFileExplorer();
					if (snapshot.status === "COMPLETED") {
						resolve();
						return;
					}
					reject(
						new Error(
							snapshot.errorMessage ||
								`The agent run did not complete: ${snapshot.status}`,
						),
					);
				},
				onError: (e) => {
					console.error("Agent run stream error", e);
				},
			});
		}).finally(() => {
			if (this.agents.get(runId) === agent) {
				this.agents.delete(runId);
			}
			if (this.watches.get(runId) === watching) {
				this.watches.delete(runId);
			}
		});
		this.watches.set(runId, watching);
		return watching;
	}
}

/**
 * Resolve a tool call paused on a human decision. The legacy ask-tool paths
 * write straight into room history and never touch the AGENT_RUN_ACTION row,
 * so this is the only call that actually resumes the run. It goes to the
 * room's live store for the run, which wakes its poller.
 *
 * @param tool - The paused call; a call with no pending action is left alone.
 * @param decision - Approve (`submit`), reject, or `respond` with what the
 * user did instead.
 * @param paramValues - The edited arguments, or the response.
 */
export const decideAgentToolAction = async (
	tool: ToolStore,
	decision: "reject" | "submit" | "respond",
	paramValues?: Record<string, unknown>,
): Promise<void> => {
	const pendingAction = tool.pendingAction;
	if (!pendingAction) {
		return;
	}
	const agent = tool.room.agentTurns.getOrCreateAgent(pendingAction.runId);
	await agent.decide(pendingAction, decision, paramValues);
};

/**
 * Find the message whose TOOL_CALL spawned childRunId, by matching the
 * TOOL_RESULT whose output carries a `jobId`/`runId` equal to it.
 *
 * @param messages - The room's messages.
 * @param childRunId - The subagent's run id.
 * @returns The response with the spawning call, or undefined.
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
 * path so later updates replace it instead of duplicating.
 *
 * @param room - The room to rebuild subagents in.
 */
export const reconstructAllSubagents = async (room: RoomStore) => {
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
				target.addPart({
					type: "SUBAGENT",
					subagent: {
						id: subagent.runId,
						status: subagent.status,
						resultPreview: subagent.finalText ?? undefined,
						error: subagent.errorMessage ?? undefined,
					},
				});
			});
		} catch (e) {
			console.error("Failed to reconstruct subagent runs", e);
		}
	}
};
