import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
	type AgentRunItem,
	type AgentRunItemEvent,
	type AgentRunItemsState,
	type AgentRunSnapshot,
	type AgentRunStatusValue,
	type AgentRunSubscription,
	AgentStore,
	getSubagentRuns,
	type PendingAgentAction,
	type SubagentRunSummary,
} from "@semoss/sdk";
import { runPixel } from "@semoss/sdk/react";
import { testChatOptions } from "../../../test/chat-options";
import { servePixelTransport } from "../../../test/pixel-transport";
import type { ResponsePixelMessage } from "../../../types";
import { InputMessageStore } from "../store/input-message.store";
import { ResponseMessageStore } from "../store/response-message.store";
import { RoomStore } from "../store/room.store";
import {
	decideAgentToolAction,
	reconstructAllSubagents,
} from "./agent-turn-runner";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

// the SDK's own calls go out over HTTP; answer them from the mocks above
servePixelTransport({ runPixel: vi.mocked(runPixel) });

// The SDK's own pixels run inside its bundle, out of reach of the mock above,
// so the one SDK query the harness calls directly is replaced here.
vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	getSubagentRuns: vi.fn(),
}));

vi.mock("../../connectors/store/connector-tools", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("../../connectors/store/connector-tools")
	>()),
	readUserConnectorTools: vi.fn().mockResolvedValue(null),
}));

const SPEND_LIMIT =
	"Your project has reached its configured enforced spend limit.";

/** Every room pixel succeeds with one output per statement. */
const pixelsSucceed = (outputs: unknown[]) =>
	vi.mocked(runPixel).mockResolvedValue({
		errors: [],
		insightId: "insight-test",
		pixelReturn: outputs.map((output) => ({
			output,
			isMeta: false,
			operationType: [],
			pixelExpression: "",
			pixelId: "",
			timeToRun: 0,
		})),
	});

/** An agent room with a model, ready to send a message. */
const createAgentRoom = async () => {
	const room = new RoomStore({
		chatOptions: testChatOptions(),
		roomId: "agent-test",
		insightId: "insight-test",
		workbenchPanels: {},
	});
	pixelsSucceed([[], {}]);
	await room.initialize({ isNew: true });
	room.setModel({
		engine_id: "model-test",
		engine_name: "Model",
		engine_type: "MODEL",
	});
	room.setMode("agent");
	pixelsSucceed([true]);
	return room;
};

/** Every watched run settles at once with `snapshot`. */
const runsSettleWith = (snapshot: AgentRunSnapshot) =>
	vi
		.spyOn(AgentStore.prototype, "watch")
		.mockImplementation((handlers): AgentRunSubscription => {
			handlers.onReconcile(snapshot);
			return {
				stop: vi.fn(),
				getItems: () => ({ itemsById: {}, itemOrder: [] }),
				pokeNow: vi.fn(),
				done: Promise.resolve(snapshot),
			};
		});

/** A run that failed on the spend limit. */
const failedRun = (runId: string): AgentRunSnapshot => ({
	runId,
	roomId: "agent-test",
	status: "FAILED",
	errorMessage: SPEND_LIMIT,
	pendingActions: [],
});

type WatchHandlers = Parameters<AgentStore["watch"]>[0];

/** One live poller the harness started, and the handlers it gave it. */
interface WatchedRun {
	readonly agent: AgentStore;
	readonly handlers: WatchHandlers;
}

/**
 * Record every poller the harness starts, instead of polling. Like the real
 * `AgentStore.watch`, a second `watch` on the same instance returns the live
 * subscription and drops the new handlers.
 */
const recordWatches = () => {
	const runs: WatchedRun[] = [];
	const subscriptions = new Map<AgentStore, AgentRunSubscription>();
	const watch = vi
		.spyOn(AgentStore.prototype, "watch")
		.mockImplementation(function (
			this: AgentStore,
			handlers,
		): AgentRunSubscription {
			const live = subscriptions.get(this);
			if (live) {
				return live;
			}
			const subscription: AgentRunSubscription = {
				stop: vi.fn(),
				getItems: () => ({ itemsById: {}, itemOrder: [] }),
				pokeNow: vi.fn(),
				done: Promise.resolve(null),
			};
			subscriptions.set(this, subscription);
			runs.push({ agent: this, handlers });
			return subscription;
		});
	const stop = vi
		.spyOn(AgentStore.prototype, "stop")
		.mockImplementation(() => undefined);
	const decide = vi
		.spyOn(AgentStore.prototype, "decide")
		.mockResolvedValue("decided");
	return { runs, watch, stop, decide };
};

/**
 * Feed one watched run its events, snapshots and reconciles, keeping the
 * merged items the SDK would hand `onEvent`.
 *
 * @param run - The watched run.
 */
const feedRun = (run: WatchedRun) => {
	const items: AgentRunItemsState = { itemsById: {}, itemOrder: [] };
	let sequence = 0;
	const header = () => {
		sequence += 1;
		return {
			version: 1 as const,
			eventId: `event-${sequence}`,
			sequence,
			runId: run.agent.runId,
			timestamp: "",
		};
	};
	const emit = (event: AgentRunItemEvent) =>
		run.handlers.onEvent(event, items);
	return {
		start: (item: AgentRunItem) => {
			items.itemsById[item.id] = item;
			items.itemOrder.push(item.id);
			emit({ ...header(), type: "item.started", item });
		},
		delta: (
			itemId: string,
			kind: "message" | "reasoning",
			delta: string,
		) => {
			// the SDK merges a delta into its item's text
			const item = items.itemsById[itemId];
			if (item?.kind === "message") {
				items.itemsById[itemId] = { ...item, text: item.text + delta };
			} else if (item?.kind === "reasoning") {
				items.itemsById[itemId] = {
					...item,
					summary: item.summary + delta,
				};
			}
			emit({ ...header(), type: "item.updated", itemId, kind, delta });
		},
		patch: (itemId: string, patch: Record<string, unknown>) => {
			const merged = {
				...items.itemsById[itemId],
				...patch,
			} as AgentRunItem;
			items.itemsById[itemId] = merged;
			emit({
				...header(),
				type: "item.updated",
				itemId,
				kind: merged.kind,
				patch,
			});
		},
		complete: (item: AgentRunItem) => {
			items.itemsById[item.id] = item;
			emit({ ...header(), type: "item.completed", item });
		},
		snapshot: (snapshot: AgentRunSnapshot) =>
			run.handlers.onSnapshot(snapshot, { droppedEvents: 0 }),
		reconcile: (snapshot: AgentRunSnapshot) =>
			run.handlers.onReconcile(snapshot),
	};
};

/** A run's durable snapshot. */
const runSnapshot = (
	runId: string,
	status: AgentRunStatusValue,
	changes: Partial<AgentRunSnapshot> = {},
): AgentRunSnapshot => ({
	runId,
	roomId: "agent-test",
	status,
	pendingActions: [],
	...changes,
});

/** A tool call the run paused on. */
const pendingAction = (
	runId: string,
	toolCallId: string | null,
	changes: Partial<PendingAgentAction> = {},
): PendingAgentAction => ({
	actionId: `action-${toolCallId}`,
	runId,
	parentMessageId: null,
	toolCallId,
	toolName: "engine__send_mail",
	toolArgs: { to: "a@example.com" },
	editedArgs: null,
	toolMeta: { SMSS_ORIGINAL_TOOL_NAME: "send_mail" },
	hasUi: false,
	uiUrl: null,
	status: "PENDING",
	...changes,
});

/** A tool item of the run. */
const toolItem = (
	id: string,
	status: Extract<AgentRunItem, { kind: "tool" }>["status"],
	changes: Partial<Extract<AgentRunItem, { kind: "tool" }>> = {},
): AgentRunItem => ({
	id,
	kind: "tool",
	name: `engine__${id}`,
	arguments: { query: id },
	status,
	...changes,
});

/** A subagent item of the run. */
const subagentItem = (
	id: string,
	status: AgentRunStatusValue,
	changes: Partial<Extract<AgentRunItem, { kind: "subagent" }>> = {},
): AgentRunItem => ({
	id,
	kind: "subagent",
	childRunId: id,
	roomId: id,
	status,
	...changes,
});

/** Send a message in the room and wait for its run's poller. */
const sendAgentMessage = async (
	room: RoomStore,
	runId: string,
	watches: ReturnType<typeof recordWatches>,
) => {
	const agent = new AgentStore("agent-test", "insight-test", runId);
	vi.spyOn(AgentStore, "start").mockResolvedValue(agent);
	const sent = room.askMessage("Plan my week");
	await vi.waitFor(() =>
		expect(watches.runs.some((run) => run.agent === agent)).toBe(true),
	);
	const run = watches.runs.find((watched) => watched.agent === agent);
	if (!run) {
		throw new Error("The run was not watched");
	}
	const response = room.tail;
	if (!(response instanceof ResponseMessageStore)) {
		throw new Error("The run has no response");
	}
	const input = response.parent;
	if (!(input instanceof InputMessageStore)) {
		throw new Error("The response has no input");
	}
	return { agent, run, feed: feedRun(run), sent, response, input };
};

/** An agent response from history, as a reload builds it. */
const historyResponse = (
	room: RoomStore,
	messageId: string,
	runId: string,
	parts: ResponsePixelMessage["parts"] = [],
) =>
	room.createMessage({
		io: "OUTPUT",
		messageId,
		visible: true,
		platform_generated: true,
		modelId: "model-test",
		modelType: "",
		dateCreated: "",
		parts,
		tokens: 0,
		agentRun: { runId },
		ornaments: {},
		pruneToolsAbove: false,
	});

/** A user message from history, as a reload builds it. */
const historyInput = (
	room: RoomStore,
	messageId: string,
	runId: string,
	parts: InputMessageStore["parts"] = [],
) =>
	room.createMessage({
		io: "INPUT",
		type: "INPUT_TEXT",
		messageId,
		visible: true,
		platform_generated: false,
		modelId: "model-test",
		modelType: "",
		dateCreated: "",
		parts,
		tokens: 0,
		agentRun: { runId },
		ornaments: {},
		pruneToolsAbove: false,
	});

/** A subagent run GetSubagentRuns returns. */
const subagentRun = (
	runId: string,
	changes: Partial<SubagentRunSummary> = {},
): SubagentRunSummary => ({
	runId,
	parentRunId: "parent",
	roomId: runId,
	roomName: null,
	workspaceId: null,
	modelId: null,
	harnessType: "semoss",
	jobId: runId,
	status: "COMPLETED",
	input: null,
	inputMessageId: null,
	finalText: null,
	finalOutputMessageId: null,
	errorMessage: null,
	dateCreated: null,
	startedAt: null,
	completedAt: null,
	userId: "user",
	artifacts: [],
	...changes,
});

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("a failed run shows its error on the room", async () => {
	const room = await createAgentRoom();
	vi.spyOn(AgentStore, "start").mockResolvedValue(
		new AgentStore("agent-test", "insight-test", "run-1"),
	);
	runsSettleWith(failedRun("run-1"));

	await expect(room.askMessage("Plan my week")).rejects.toThrow(SPEND_LIMIT);

	expect(room.error?.message).toBe(SPEND_LIMIT);
	expect(room.isLoading).toBe(false);
});

test("a run that cannot start shows its error on the room", async () => {
	const room = await createAgentRoom();
	vi.spyOn(AgentStore, "start").mockRejectedValue(
		new Error("RunAgent failed"),
	);

	await expect(room.askMessage("Plan my week")).rejects.toThrow(
		"RunAgent failed",
	);

	expect(room.error?.message).toBe("RunAgent failed");
});

test("a run that fails after a reload shows its error on the room", async () => {
	const room = await createAgentRoom();
	runsSettleWith(failedRun("run-2"));
	vi.spyOn(console, "error").mockImplementation(() => undefined);
	const response = room.createMessage({
		io: "OUTPUT",
		messageId: "response-1",
		visible: true,
		platform_generated: true,
		modelId: "model-test",
		modelType: "",
		dateCreated: "",
		parts: [],
		tokens: 0,
		agentRun: { runId: "run-2" },
		ornaments: {},
		pruneToolsAbove: false,
	});

	room.agentTurns.reconnect(response);

	await vi.waitFor(() => expect(room.error?.message).toBe(SPEND_LIMIT));
	expect(room.isLoading).toBe(false);
});

test("a message starts a run with the room's model, harness and text", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();

	const { feed, sent, response } = await sendAgentMessage(
		room,
		"run-start",
		watches,
	);

	expect(AgentStore.start).toHaveBeenCalledWith(
		{
			roomId: "agent-test",
			command: "Plan my week",
			engine: "model-test",
			harnessType: "semoss",
			agentId: undefined,
			media: [],
		},
		"insight-test",
	);
	expect(room.isLoading).toBe(true);
	expect(response.isThinking).toBe(true);

	feed.reconcile(
		runSnapshot("run-start", "COMPLETED", { finalText: "Done" }),
	);
	await sent;
});

test("streamed items fill the response with text, reasoning, tools and subagents", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();
	const { feed, sent, response } = await sendAgentMessage(
		room,
		"run-items",
		watches,
	);

	// reasoning first: thinking stops on the first item of any kind
	feed.start({ id: "reasoning-1", kind: "reasoning", summary: "Look" });
	expect(response.isThinking).toBe(false);
	feed.delta("reasoning-1", "reasoning", " at the calendar");

	// a message with no text yet adds nothing; its deltas merge into one part
	feed.start({
		id: "message-1",
		kind: "message",
		role: "assistant",
		text: "",
	});
	feed.delta("message-1", "message", "Here is");
	feed.delta("message-1", "message", " your week");
	feed.complete({
		id: "message-1",
		kind: "message",
		role: "assistant",
		text: "Here is your week",
	});

	expect(response.parts).toEqual([
		{ type: "THINKING", thinking: "Look at the calendar" },
		{
			type: "TEXT",
			text: "Here is your week",
			uiText: "Here is your week",
		},
	]);

	// an ask tool waiting in the queue keeps the INITIAL (awaiting) status
	feed.start(
		toolItem("send-mail", "QUEUED", {
			metadata: {
				SMSS_MCP_EXECUTION: "ask",
				SMSS_ORIGINAL_TOOL_NAME: "send_mail",
				SMSS_ENGINE_ID: "engine-1",
			},
		}),
	);
	// an auto tool already running shows as loading, under its title
	feed.start(toolItem("search", "RUNNING", { title: "Search the web" }));
	const sendMail = room.getTool("send-mail");
	const search = room.getTool("search");

	expect(sendMail.status).toBe("INITIAL");
	expect(sendMail.message).toBe(response);
	expect(sendMail.parameters).toEqual({ query: "send-mail" });
	expect(response.parts[2]).toEqual({
		type: "TOOL_CALL",
		toolCall: {
			id: "send-mail",
			type: "function",
			name: "engine__send-mail",
			title: "send_mail",
			arguments: { query: "send-mail" },
			_tool_found: true,
			original_name: "send_mail",
			description: "",
			_meta: {
				SMSS_ENGINE_NAME: "",
				SMSS_ENGINE_ID: "engine-1",
				SMSS_ENGINE_TYPE: "",
				SMSS_PROJECT_NAME: "",
				SMSS_PROJECT_ID: "",
				SMSS_ORIGINAL_TOOL_NAME: "send_mail",
				SMSS_MCP_EXECUTION: "agent-ask",
			},
		},
	});
	expect(search.status).toBe("LOADING");
	expect(response.parts[3]).toMatchObject({
		type: "TOOL_CALL",
		toolCall: {
			id: "search",
			name: "engine__search",
			title: "Search the web",
			original_name: "engine__search",
			_meta: { SMSS_MCP_EXECUTION: "agent-auto" },
		},
	});

	// tool updates read the merged item's status
	feed.patch("send-mail", { status: "RUNNING" });
	expect(sendMail.status).toBe("LOADING");
	feed.patch("send-mail", { status: "INPUT_REQUIRED" });
	expect(sendMail.status).toBe("LOADING");

	// completion settles each tool with its output, or its error
	feed.complete(
		toolItem("search", "COMPLETED", {
			title: "Search",
			output: "3 results",
		}),
	);
	feed.complete(toolItem("send-mail", "FAILED", { error: "No mailbox" }));
	expect(search.status).toBe("SUCCESS");
	expect(search.response).toBe("3 results");
	expect(sendMail.status).toBe("ERROR");
	expect(sendMail.response).toBe("No mailbox");

	feed.start(toolItem("delete-file", "QUEUED"));
	feed.complete(toolItem("delete-file", "REJECTED"));
	expect(room.getTool("delete-file").status).toBe("CANCELLED");
	expect(room.getTool("delete-file").response).toBe("");

	feed.start(toolItem("open-file", "RUNNING"));
	feed.complete(toolItem("open-file", "QUEUED"));
	// an unmapped completion status keeps the status it had
	expect(room.getTool("open-file").status).toBe("LOADING");

	// a completion for a tool the room never saw is ignored
	feed.complete(toolItem("unknown-tool", "COMPLETED", { output: "x" }));
	expect(room.getTool("unknown-tool")).toBeNull();

	// subagents start a part and follow the merged item's status
	feed.start(subagentItem("child-1", "RUNNING", { alias: "researcher" }));
	feed.patch("child-1", { status: "COMPLETED", resultPreview: "Found it" });
	expect(response.parts.at(-1)).toEqual({
		type: "SUBAGENT",
		subagent: {
			id: "child-1",
			status: "COMPLETED",
			alias: "researcher",
			resultPreview: "Found it",
			error: undefined,
		},
	});
	feed.complete(
		subagentItem("child-1", "FAILED", {
			alias: "renamed",
			error: "Timed out",
		}),
	);
	expect(response.parts.at(-1)).toEqual({
		type: "SUBAGENT",
		subagent: {
			id: "child-1",
			status: "FAILED",
			alias: "researcher",
			resultPreview: undefined,
			error: "Timed out",
		},
	});

	// a late delta merges into its own item's part, wherever it is
	feed.delta("message-1", "message", " (updated)");
	expect(response.parts[1]).toEqual({
		type: "TEXT",
		text: "Here is your week (updated)",
		uiText: "Here is your week (updated)",
	});
	expect(
		response.parts.map((part) =>
			part.type === "TOOL_CALL" ? part.toolCall.id : part.type,
		),
	).toEqual([
		"THINKING",
		"TEXT",
		"send-mail",
		"search",
		"delete-file",
		"open-file",
		"SUBAGENT",
	]);

	feed.reconcile(runSnapshot("run-items", "COMPLETED"));
	await sent;
});

test("pending actions follow the run's snapshots, synthesizing a missing tool call", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();
	const { feed, sent, response } = await sendAgentMessage(
		room,
		"run-pending",
		watches,
	);

	feed.start(
		toolItem("send-mail", "QUEUED", {
			metadata: { SMSS_MCP_EXECUTION: "ask" },
		}),
	);
	feed.start(toolItem("search", "RUNNING"));
	const mailAction = pendingAction("run-pending", "send-mail");
	const missedAction = pendingAction("run-pending", "invite", {
		toolName: "engine__send_invite",
		toolArgs: { when: "Monday" },
		toolMeta: {
			SMSS_ORIGINAL_TOOL_NAME: "send_invite",
			SMSS_MCP_EXECUTION: "auto",
		},
	});
	const noCallAction = pendingAction("run-pending", null);

	feed.snapshot(
		runSnapshot("run-pending", "INPUT_REQUIRED", {
			pendingActions: [mailAction, missedAction, noCallAction],
		}),
	);

	expect(room.getTool("send-mail").pendingAction).toBe(mailAction);
	expect(room.getTool("search").pendingAction).toBeNull();
	// an action whose item.started was missed gets a TOOL_CALL part of its own
	expect(response.parts.at(-1)).toEqual({
		type: "TOOL_CALL",
		toolCall: {
			id: "invite",
			type: "function",
			name: "engine__send_invite",
			title: "send_invite",
			arguments: { when: "Monday" },
			_tool_found: true,
			original_name: "send_invite",
			description: "",
			_meta: {
				SMSS_ENGINE_NAME: "",
				SMSS_ENGINE_ID: "",
				SMSS_ENGINE_TYPE: "",
				SMSS_PROJECT_NAME: "",
				SMSS_PROJECT_ID: "",
				SMSS_ORIGINAL_TOOL_NAME: "send_invite",
				// always ask, whatever the tool's own mode
				SMSS_MCP_EXECUTION: "agent-ask",
			},
		},
	});
	expect(room.getTool("invite").pendingAction).toBe(missedAction);
	expect(room.getTool("invite").status).toBe("INITIAL");
	expect(
		response.parts.filter((part) => part.type === "TOOL_CALL"),
	).toHaveLength(3);

	// the same snapshot again adds nothing
	feed.snapshot(
		runSnapshot("run-pending", "INPUT_REQUIRED", {
			pendingActions: [mailAction, missedAction],
		}),
	);
	expect(
		response.parts.filter((part) => part.type === "TOOL_CALL"),
	).toHaveLength(3);

	// a decided action is cleared
	feed.snapshot(
		runSnapshot("run-pending", "RUNNING", {
			pendingActions: [missedAction],
		}),
	);
	expect(room.getTool("send-mail").pendingAction).toBeNull();
	expect(room.getTool("invite").pendingAction).toBe(missedAction);

	// a snapshot never settles the turn, even a terminal one
	feed.snapshot(runSnapshot("run-pending", "COMPLETED"));
	expect(room.getTool("invite").pendingAction).toBeNull();
	expect(room.isLoading).toBe(true);
	expect(watches.stop).not.toHaveBeenCalled();

	feed.reconcile(runSnapshot("run-pending", "COMPLETED"));
	await sent;
	expect(room.isLoading).toBe(false);
});

test("a completed run adopts its message ids and settles the turn", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();
	const refresh = vi.spyOn(room, "refreshWorkbenchFileExplorer");
	const { agent, feed, sent, response, input } = await sendAgentMessage(
		room,
		"run-ids",
		watches,
	);
	feed.start({
		id: "message-1",
		kind: "message",
		role: "assistant",
		text: "Streamed",
	});

	// INPUT_REQUIRED reconciles ids and actions but keeps the turn running
	feed.reconcile(
		runSnapshot("run-ids", "INPUT_REQUIRED", {
			inputMessageId: "input-saved",
			pendingActions: [pendingAction("run-ids", "late-tool")],
		}),
	);
	expect(input.id).toBe("input-saved");
	expect(room.getTool("late-tool").pendingAction?.actionId).toBe(
		"action-late-tool",
	);
	expect(room.isLoading).toBe(true);
	expect(watches.stop).not.toHaveBeenCalled();
	expect(refresh).not.toHaveBeenCalled();

	feed.reconcile(
		runSnapshot("run-ids", "COMPLETED", {
			finalOutputMessageId: "output-saved",
			finalText: "Not shown, the text streamed",
		}),
	);
	await sent;

	expect(response.id).toBe("output-saved");
	expect(response.parts.filter((part) => part.type === "TEXT")).toEqual([
		{ type: "TEXT", text: "Streamed", uiText: "Streamed" },
	]);
	expect(room.getTool("late-tool").pendingAction).toBeNull();
	expect(watches.stop).toHaveBeenCalledTimes(1);
	expect(watches.stop.mock.contexts[0]).toBe(agent);
	expect(refresh).toHaveBeenCalledTimes(1);
	expect(room.isLoading).toBe(false);
	expect(response.isThinking).toBe(false);
	expect(room.error).toBeNull();
	expect(room.history).toEqual([input, response]);
});

test("a run that streamed no text shows its final text", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();
	const { feed, sent, response } = await sendAgentMessage(
		room,
		"run-final-text",
		watches,
	);
	feed.start(toolItem("search", "COMPLETED", { output: "ok" }));
	// a reasoning part is not visible text
	feed.start({ id: "reasoning-1", kind: "reasoning", summary: "Hmm" });

	feed.reconcile(
		runSnapshot("run-final-text", "COMPLETED", { finalText: "All done" }),
	);
	await sent;

	expect(response.parts.at(-1)).toEqual({
		type: "TEXT",
		text: "All done",
		uiText: "All done",
	});
	// a tool that started COMPLETED settles with the item's output
	expect(room.getTool("search").status).toBe("SUCCESS");
	expect(room.getTool("search").response).toBe("ok");
});

test.each([
	{
		status: "FAILED" as const,
		errorMessage: undefined,
		expected: "The agent run did not complete: FAILED",
	},
	{
		status: "CANCELLED" as const,
		errorMessage: undefined,
		expected: "The agent run did not complete: CANCELLED",
	},
	{
		status: "CANCELLED" as const,
		errorMessage: "Stopped by the user",
		expected: "Stopped by the user",
	},
])(
	"a $status run withdraws the message and shows $expected",
	async ({ status, errorMessage, expected }) => {
		const room = await createAgentRoom();
		const watches = recordWatches();
		const refresh = vi.spyOn(room, "refreshWorkbenchFileExplorer");
		const { feed, sent, response } = await sendAgentMessage(
			room,
			`run-${status}-${expected.length}`,
			watches,
		);
		feed.start({
			id: "message-1",
			kind: "message",
			role: "assistant",
			text: "Hi",
		});

		feed.reconcile(
			runSnapshot(`run-${status}-${expected.length}`, status, {
				errorMessage,
			}),
		);

		await expect(sent).rejects.toThrow(expected);
		expect(room.error?.message).toBe(expected);
		expect(room.history).toEqual([]);
		expect(room.isLoading).toBe(false);
		expect(response.isThinking).toBe(false);
		expect(watches.stop).toHaveBeenCalledTimes(1);
		expect(refresh).toHaveBeenCalledTimes(1);
	},
);

test("a poll error is logged and the run keeps going", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();
	const logged = vi
		.spyOn(console, "error")
		.mockImplementation(() => undefined);
	const { run, feed, sent } = await sendAgentMessage(
		room,
		"run-poll-error",
		watches,
	);

	run.handlers.onError?.(new Error("Network down"));

	expect(logged).toHaveBeenCalledWith(
		"Agent run stream error",
		new Error("Network down"),
	);
	expect(room.error).toBeNull();
	expect(room.isLoading).toBe(true);

	feed.reconcile(runSnapshot("run-poll-error", "COMPLETED"));
	await sent;
});

test("a reload reconnects to a running run and follows it to the end", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();
	const input = historyInput(room, "input-1", "run-reload", [
		{ type: "TEXT", text: "Plan my week", uiText: "Plan my week" },
	]);
	const response = historyResponse(room, "response-1", "run-reload", [
		{ type: "TEXT", text: "Working on it", uiText: "Working on it" },
	]);
	room.tail.addChild(input);
	input.addChild(response);

	room.agentTurns.reconnect(response);

	expect(room.isLoading).toBe(true);
	expect(response.isThinking).toBe(true);
	await vi.waitFor(() => expect(watches.runs).toHaveLength(1));
	const [run] = watches.runs;
	expect(run.agent.runId).toBe("run-reload");
	expect(run.agent.roomId).toBe("agent-test");
	expect(run.agent.insightId).toBe("insight-test");
	const feed = feedRun(run);

	// the paused call's item.started is long gone, so its part is rebuilt
	feed.reconcile(
		runSnapshot("run-reload", "INPUT_REQUIRED", {
			pendingActions: [pendingAction("run-reload", "send-mail")],
		}),
	);
	expect(response.parts.at(-1)).toMatchObject({
		type: "TOOL_CALL",
		toolCall: { id: "send-mail", title: "send_mail" },
	});
	expect(room.getTool("send-mail").pendingAction?.actionId).toBe(
		"action-send-mail",
	);
	expect(room.isLoading).toBe(true);

	feed.start(toolItem("search", "RUNNING"));
	expect(response.isThinking).toBe(false);

	feed.reconcile(
		runSnapshot("run-reload", "COMPLETED", {
			inputMessageId: "input-saved",
			finalOutputMessageId: "response-saved",
			finalText: "Not shown",
		}),
	);

	await vi.waitFor(() => expect(room.isLoading).toBe(false));
	expect(input.id).toBe("input-saved");
	expect(response.id).toBe("response-saved");
	expect(response.isThinking).toBe(false);
	expect(room.getTool("send-mail").pendingAction).toBeNull();
	expect(room.error).toBeNull();
});

test("a response that is not part of a run does not reconnect", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();
	const response = room.createMessage({
		io: "OUTPUT",
		messageId: "response-1",
		visible: true,
		platform_generated: true,
		modelId: "model-test",
		modelType: "",
		dateCreated: "",
		parts: [],
		tokens: 0,
		ornaments: {},
		pruneToolsAbove: false,
	});

	room.agentTurns.reconnect(response);

	expect(room.isLoading).toBe(false);
	expect(response.isThinking).toBe(false);
	expect(watches.watch).not.toHaveBeenCalled();
});

test("a decision resumes the watched run: submit, edit, reject and respond", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();
	const { agent, feed, sent } = await sendAgentMessage(
		room,
		"run-decide",
		watches,
	);
	feed.start(
		toolItem("send-mail", "QUEUED", {
			metadata: { SMSS_MCP_EXECUTION: "ask" },
		}),
	);
	feed.start(toolItem("search", "RUNNING"));
	const action = pendingAction("run-decide", "send-mail");
	feed.snapshot(
		runSnapshot("run-decide", "INPUT_REQUIRED", {
			pendingActions: [action],
		}),
	);
	const tool = room.getTool("send-mail");

	await decideAgentToolAction(tool, "submit");
	await decideAgentToolAction(tool, "submit", { to: "b@example.com" });
	await decideAgentToolAction(tool, "reject");
	await decideAgentToolAction(tool, "respond", { answer: "Monday" });

	expect(watches.decide.mock.calls).toEqual([
		[action, "submit", undefined],
		[action, "submit", { to: "b@example.com" }],
		[action, "reject", undefined],
		[action, "respond", { answer: "Monday" }],
	]);
	// every decision goes to the instance that is polling the run
	for (const context of watches.decide.mock.contexts) {
		expect(context).toBe(agent);
	}

	// a call with no pending action is left alone
	await decideAgentToolAction(room.getTool("search"), "submit");
	expect(watches.decide).toHaveBeenCalledTimes(4);

	feed.reconcile(runSnapshot("run-decide", "COMPLETED"));
	await sent;
});

test("one run id has one watcher, until its run settles", async () => {
	const room = await createAgentRoom();
	const watches = recordWatches();
	const { agent, feed, sent, response } = await sendAgentMessage(
		room,
		"run-registry",
		watches,
	);

	// reconnecting while the run is watched joins the live watch
	const reloaded = historyResponse(room, "reloaded", "run-registry");
	room.agentTurns.reconnect(reloaded);
	room.agentTurns.reconnect(reloaded);
	expect(watches.watch).toHaveBeenCalledTimes(1);
	expect(watches.watch.mock.contexts).toEqual([agent]);
	expect(watches.runs).toHaveLength(1);
	expect(reloaded.isThinking).toBe(true);

	// a decision from any tool of that run reaches the same instance
	feed.start(toolItem("send-mail", "QUEUED"));
	const tool = room.getTool("send-mail");
	tool.setPendingAction(pendingAction("run-registry", "send-mail"));
	await decideAgentToolAction(tool, "reject");
	expect(watches.decide.mock.contexts[0]).toBe(agent);

	feed.reconcile(runSnapshot("run-registry", "COMPLETED"));
	await sent;
	expect(response.isThinking).toBe(false);
	// and the joined reconnects settle with it
	await vi.waitFor(() => expect(reloaded.isThinking).toBe(false));

	// once settled, the run is forgotten: a later decision gets a new store
	expect(tool.pendingAction).toBeNull();
	tool.setPendingAction(pendingAction("run-registry", "send-mail"));
	await decideAgentToolAction(tool, "reject");
	const later = watches.decide.mock.contexts[1];
	expect(later).toBeInstanceOf(AgentStore);
	expect(later).not.toBe(agent);
	expect((later as AgentStore).runId).toBe("run-registry");
	// and a reconnect after that watches the new store, not the settled one
	room.agentTurns.reconnect(historyResponse(room, "again", "run-registry"));
	await vi.waitFor(() => expect(watches.runs).toHaveLength(2));
	expect(watches.runs[1].agent).toBe(later);
	expect(watches.runs[1].agent.isWatching).toBe(false);
});

test("a reload rebuilds each run's subagents on the message that spawned them", async () => {
	const room = await createAgentRoom();
	vi.spyOn(console, "error").mockImplementation(() => undefined);
	const firstInput = historyInput(room, "input-1", "run-sub", [
		{ type: "TEXT", text: "Research", uiText: "Research" },
	]);
	const spawning = historyResponse(room, "response-1", "run-sub", [
		{
			type: "TOOL_CALL",
			toolCall: {
				id: "spawn-call",
				type: "function",
				name: "spawn",
				title: "Spawn",
				arguments: {},
				_tool_found: true,
				original_name: "spawn",
				description: "",
				_meta: {},
			} as unknown as Extract<
				ResponsePixelMessage["parts"][number],
				{ type: "TOOL_CALL" }
			>["toolCall"],
		},
	]);
	const toolResult = historyInput(room, "input-2", "run-sub", [
		{
			type: "TOOL_RESULT",
			toolResult: {
				toolCallId: "spawn-call",
				toolName: "spawn",
				output: JSON.stringify({ jobId: "child-spawned" }),
				toolParameterValues: {},
				toolStatus: "success",
			},
		},
	]);
	const last = historyResponse(room, "response-2", "run-sub", [
		{ type: "TEXT", text: "Done", uiText: "Done" },
	]);
	const otherInput = historyInput(room, "input-3", "run-broken", []);
	const otherResponse = historyResponse(room, "response-3", "run-broken", []);
	room.tail.addChild(firstInput);
	firstInput.addChild(spawning);
	spawning.addChild(toolResult);
	toolResult.addChild(last);
	last.addChild(otherInput);
	otherInput.addChild(otherResponse);

	vi.mocked(getSubagentRuns).mockImplementation(async (runId) => {
		if (runId === "run-broken") {
			throw new Error("GetSubagentRuns failed");
		}
		return [
			subagentRun("child-spawned", {
				status: "COMPLETED",
				finalText: "Found it",
			}),
			subagentRun("child-unmatched", {
				status: "FAILED",
				errorMessage: "Timed out",
			}),
		];
	});

	await reconstructAllSubagents(room);

	// one query per run, in the room's insight
	expect(vi.mocked(getSubagentRuns).mock.calls).toEqual([
		["run-sub", "insight-test"],
		["run-broken", "insight-test"],
	]);
	expect(spawning.parts.at(-1)).toEqual({
		type: "SUBAGENT",
		subagent: {
			id: "child-spawned",
			status: "COMPLETED",
			resultPreview: "Found it",
			error: undefined,
		},
	});
	// a subagent no tool result names lands on the run's last response
	expect(last.parts.at(-1)).toEqual({
		type: "SUBAGENT",
		subagent: {
			id: "child-unmatched",
			status: "FAILED",
			resultPreview: undefined,
			error: "Timed out",
		},
	});
	expect(console.error).toHaveBeenCalledWith(
		"Failed to reconstruct subagent runs",
		new Error("GetSubagentRuns failed"),
	);
	expect(otherResponse.parts).toEqual([]);

	// rebuilding again does not duplicate a part
	await reconstructAllSubagents(room);
	expect(
		[...spawning.parts, ...last.parts].filter(
			(part) => part.type === "SUBAGENT",
		),
	).toHaveLength(2);
});
