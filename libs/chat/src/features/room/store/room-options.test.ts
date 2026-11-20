import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { getWorkspace, type WorkspaceDetails } from "@semoss/sdk";
import {
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { servePixelTransport } from "../../../test/pixel-transport";
import type { Engine, MCPConfig, PixelMessage } from "../../../types";
import { DEFAULT_WORKBENCH_PANEL_COMPONENTS } from "../../workbench/panels/room-panel-components";
import type { ResponseMessageStore } from "./response-message.store";
import { RoomStore } from "./room.store";

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getWorkspace: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	download: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	getPixelJobStreaming: vi.fn(),
	runMcpTool: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

// the SDK's own calls go out over HTTP; answer them from the mocks above
servePixelTransport({
	runPixel: vi.mocked(runPixel),
	runPixelAsync: vi.mocked(runPixelAsync),
});

/** A pixel response with one output per statement. */
const reply = (outputs: unknown[], errors: string[] = []) => ({
	errors,
	insightId: "insight-1",
	pixelReturn: outputs.map((output) => ({
		output,
		isMeta: false,
		operationType: [],
		pixelExpression: "",
		pixelId: "",
		timeToRun: 0,
	})),
});

/** The pixels the room sent, in order. */
const sentPixels = () => vi.mocked(runPixel).mock.calls.map(([pixel]) => pixel);

/** The options a sent UpdateRoomOptions saves. */
const savedOptions = (pixel: string | undefined) => {
	const match = /roomOptions=\[(.*)\]\);$/.exec(pixel ?? "");
	return match ? JSON.parse(match[1] ?? "") : undefined;
};

const MODEL: Engine = {
	engine_id: "model-a",
	engine_name: "Model A",
	engine_type: "MODEL",
};

/** A toolbox. */
const mcp = (id: string, extra: Partial<MCPConfig> = {}) =>
	({ id, type: "MCP", name: id, ...extra }) as MCPConfig;

/** A message of the room's history. */
const message = (
	io: "INPUT" | "OUTPUT",
	messageId: string,
	parentMessageId: string,
	parts: PixelMessage["parts"] = [
		{ type: "TEXT", text: messageId, uiText: messageId },
	],
) =>
	({
		io,
		type: "INPUT_TEXT",
		messageId,
		parentMessageId,
		visible: true,
		platform_generated: false,
		modelId: "model-a",
		modelType: "",
		dateCreated: "2026-01-01 00:00:00",
		parts,
		tokens: 0,
		ornaments: {},
		pruneToolsAbove: false,
	}) as PixelMessage;

/**
 * A room on a model, loaded with `messages` and no stored options.
 *
 * @param messages - The room's history.
 * @returns The loaded room, its pixel calls cleared.
 */
const createRoom = async (messages: PixelMessage[] = []) => {
	const room = new RoomStore({
		theme: {} as ThemeMap["playground"],
		roomId: "room-1",
		insightId: "insight-1",
		panelComponents: DEFAULT_WORKBENCH_PANEL_COMPONENTS,
	});
	vi.spyOn(room.connectors, "restore").mockResolvedValue(undefined);
	room.setModel(MODEL);
	vi.mocked(runPixel).mockResolvedValueOnce(reply([messages, {}, true]));
	await room.initialize();
	vi.mocked(runPixel).mockReset();
	return room;
};

/** A conversation of one exchange. */
const ONE_EXCHANGE = [
	message("INPUT", "i1", ""),
	message("OUTPUT", "r1", "i1"),
];

beforeEach(() => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
	vi.useRealTimers();
	vi.resetAllMocks();
	vi.restoreAllMocks();
});

/** An agent bringing `tools`, as the SDK reads it. */
const agent = (tools: MCPConfig[]) =>
	({
		workspace_id: "agent-1",
		name: "Agent",
		mcp: tools,
		skills: [],
		prompts: [],
	}) as unknown as WorkspaceDetails;

test("syncing options reads them quietly and keeps the agent's tools", async () => {
	const room = await createRoom();
	room.setAgentTools("agent-1", [
		mcp("agent-tool"),
		mcp("shared", { name: "agent copy" }),
	]);
	room.setOptions({ workspace: { workspace_id: "agent-1", name: "Agent" } });
	const agentTools = room.agentTools;
	vi.mocked(runPixel).mockResolvedValue(
		reply([
			{
				OPTIONS: {
					instructions: "Fresh",
					predefinedPrompts: [],
					modelId: "model-a",
					workspace: { workspace_id: "agent-1" },
					mcp: [
						mcp("room-tool"),
						mcp("shared", { name: "room copy" }),
					],
				},
			},
		]),
	);
	const loading: boolean[] = [];
	room.subscribe(() => loading.push(room.isLoading));

	await room.syncRoomOptions();

	expect(sentPixels()).toEqual(['GetRoomOptions(roomId="room-1");']);
	expect(vi.mocked(runPixel).mock.calls[0]?.[1]).toBe("insight-1");
	expect(loading).not.toContain(true);
	expect(room.options.instructions).toBe("Fresh");
	// the options are the room's own tools, as stored
	expect(room.options.mcp.map((tool) => [tool.id, tool.name])).toEqual([
		["room-tool", "room-tool"],
		["shared", "room copy"],
	]);
	// the same agent, so its tools stay and are not read again
	expect(room.agentTools).toBe(agentTools);
	expect(getWorkspace).not.toHaveBeenCalled();

	// the synced options are what the backend holds, so saving them sends nothing
	vi.mocked(runPixel).mockClear();
	await room.updateRoomOptions(room.options);
	expect(runPixel).not.toHaveBeenCalled();
});

test("a room whose agent changes reads the new agent's tools, and drops a late read", async () => {
	const room = await createRoom();
	let answerFirst: (workspace: WorkspaceDetails) => void = () => {};
	vi.mocked(getWorkspace)
		.mockReturnValueOnce(
			new Promise((resolve) => {
				answerFirst = resolve;
			}),
		)
		.mockResolvedValueOnce(agent([mcp("second-tool")]));

	room.setOptions({ workspace: { workspace_id: "agent-1" } });
	expect(getWorkspace).toHaveBeenLastCalledWith("insight-1", "agent-1");
	room.setOptions({ workspace: { workspace_id: "agent-2" } });
	expect(getWorkspace).toHaveBeenLastCalledWith("insight-1", "agent-2");
	await vi.waitFor(() =>
		expect(room.agentTools.map((tool) => tool.id)).toEqual(["second-tool"]),
	);

	// the first agent's read lands late, for an agent the room no longer has
	answerFirst(agent([mcp("first-tool")]));
	await Promise.resolve();
	expect(room.agentTools.map((tool) => tool.id)).toEqual(["second-tool"]);

	// no agent, no tools, and nothing to read
	room.setOptions({ workspace: undefined });
	expect(room.agentTools).toEqual([]);
	expect(getWorkspace).toHaveBeenCalledTimes(2);
});

test("a draft reads no agent; it is handed the agent's tools", () => {
	const draft = new RoomStore({
		theme: {} as ThemeMap["playground"],
		roomId: "temp",
		panelComponents: DEFAULT_WORKBENCH_PANEL_COMPONENTS,
	});
	draft.setAgentTools("agent-1", [mcp("agent-tool")]);
	draft.setOptions({ workspace: { workspace_id: "agent-1" } });
	expect(draft.agentTools.map((tool) => tool.id)).toEqual(["agent-tool"]);

	// another agent drops the last one's tools until it is handed the new one's
	draft.setOptions({ workspace: { workspace_id: "agent-2" } });
	expect(draft.agentTools).toEqual([]);
	expect(getWorkspace).not.toHaveBeenCalled();
});

test("syncing options with none stored, or failing, changes nothing and throws nothing", async () => {
	const room = await createRoom();
	room.setOptions({ instructions: "Local" });
	const before = room.getSnapshot();

	vi.mocked(runPixel).mockResolvedValueOnce(reply([{}]));
	await room.syncRoomOptions();
	expect(room.getSnapshot().options).toBe(before.options);

	vi.mocked(runPixel).mockResolvedValueOnce(reply([], ["boom"]));
	await expect(room.syncRoomOptions()).resolves.toBeUndefined();
	expect(room.options.instructions).toBe("Local");
	// a failed sync is not shown on the room
	expect(room.error).toBeNull();
	expect(room.isLoading).toBe(false);
});

test("saving options sends what the backend stores, and skips a save that changes nothing", async () => {
	const room = await createRoom();
	vi.mocked(runPixel).mockResolvedValue(reply([true]));
	const loading: boolean[] = [];
	room.subscribe(() => loading.push(room.isLoading));
	const options = {
		...room.options,
		instructions: "Be brief",
		mcp: [mcp("room-toolbox", { fromRoom: true }), mcp("room-tool")],
		defaultTools: { folder_write: "ask" as const },
	};

	await room.updateRoomOptions(options);

	expect(sentPixels()).toHaveLength(1);
	expect(sentPixels()[0]).toMatch(
		/^UpdateRoomOptions\(roomId="room-1", roomOptions=\[\{.*\}\]\);$/,
	);
	expect(savedOptions(sentPixels()[0])).toEqual({
		predefinedPrompts: [],
		instructions: "Be brief",
		// the room's own toolbox is not stored
		mcp: [mcp("room-tool")],
		defaultTools: { folder_write: "ask" },
		modelId: "model-a",
	});
	// locally, every tool stays
	expect(room.options.mcp.map((tool) => tool.id)).toEqual([
		"room-toolbox",
		"room-tool",
	]);
	// a save leaves the room's spinner alone
	expect(loading).not.toContain(true);

	// the same options again, or with only the room's own toolbox changed
	await room.updateRoomOptions(options);
	await room.updateRoomOptions({
		...options,
		mcp: [...options.mcp, mcp("other-toolbox", { fromRoom: true })],
	});
	expect(sentPixels()).toHaveLength(1);
	expect(room.options.mcp).toHaveLength(3);

	// a changed model is a change
	room.setModel({ ...MODEL, engine_id: "model-b" });
	await room.updateRoomOptions(options);
	expect(sentPixels()).toHaveLength(2);
	expect(savedOptions(sentPixels()[1]).modelId).toBe("model-b");
});

test("a refused save throws, shows the failure, and keeps the old options", async () => {
	const room = await createRoom();
	vi.mocked(runPixel).mockResolvedValue(reply([], ["Not allowed"]));

	await expect(
		room.updateRoomOptions({ ...room.options, instructions: "New" }),
	).rejects.toThrow("Not allowed");

	expect(room.options.instructions).toBe("");
	expect(room.error).toEqual(new Error("Not allowed"));

	// the failed save was not remembered, so the next try sends again
	vi.mocked(runPixel).mockResolvedValue(reply([true]));
	await room.updateRoomOptions({ ...room.options, instructions: "New" });
	expect(sentPixels()).toHaveLength(2);
	expect(room.options.instructions).toBe("New");
	expect(room.error).toBeNull();
});

test("runRoomPixel's showLoading, setErrorOnFail and throwOnError", async () => {
	const room = await createRoom();
	const loading: boolean[] = [];
	room.subscribe(() => loading.push(room.isLoading));

	// defaults: spinner on and off, failure shown, and thrown
	vi.mocked(runPixel).mockResolvedValueOnce(reply([], ["a", "b"]));
	await expect(room.runRoomPixel("Fail();")).rejects.toThrow("ab");
	expect(vi.mocked(runPixel).mock.calls[0]).toEqual(["Fail();", "insight-1"]);
	// the failure lands while the spinner is still on
	expect(loading).toEqual([true, true, false]);
	expect(room.error).toEqual(new Error("ab"));
	expect(room.isLoading).toBe(false);

	// a success clears the last failure
	loading.length = 0;
	vi.mocked(runPixel).mockResolvedValueOnce(reply(["ok"]));
	const response = await room.runRoomPixel("Ok();", { showLoading: false });
	expect(response.pixelReturn[0]?.output).toBe("ok");
	expect(room.error).toBeNull();
	expect(loading).not.toContain(true);

	// setErrorOnFail: false throws without showing it
	vi.mocked(runPixel).mockResolvedValueOnce(reply([], ["quiet"]));
	await expect(
		room.runRoomPixel("Fail();", {
			showLoading: false,
			setErrorOnFail: false,
		}),
	).rejects.toThrow("quiet");
	expect(room.error).toBeNull();

	// a transport failure is shown and thrown as it is
	const offline = new TypeError("Failed to fetch");
	vi.mocked(runPixel).mockRejectedValueOnce(offline);
	await expect(
		room.runRoomPixel("Ok();", { showLoading: false }),
	).rejects.toBe(offline);
	expect(room.error).toBe(offline);

	// throwOnError: false returns the errors for the caller to inspect
	vi.mocked(runPixel).mockResolvedValueOnce(reply(["x"], ["partial"]));
	const partial = await room.runRoomPixel("Multi();", {
		showLoading: false,
		throwOnError: false,
	});
	expect(partial.errors).toEqual(["partial"]);
	// a response with errors is no success, so the last failure stays
	expect(room.error).toBe(offline);
});

test("compacting adds each summary turn below the last response", async () => {
	const room = await createRoom(ONE_EXCHANGE);
	const target = room.getMessage("r1") as ResponseMessageStore;
	const compacting: boolean[] = [];
	target.subscribe(() => compacting.push(target.isCompacting));
	const loading: boolean[] = [];
	room.subscribe(() => loading.push(room.isLoading));
	vi.mocked(runPixel).mockResolvedValue(
		reply([
			[
				{
					type: "SUMMARY",
					success: true,
					inputMessage: message("INPUT", "s-in", "r1"),
					responseMessage: message("OUTPUT", "s-out", "s-in"),
				},
				{
					type: "TOOL_PRUNE",
					success: false,
					error: "nothing to prune",
				},
			],
		]),
	);

	await expect(room.compactMessages("SUMMARY")).resolves.toBe("compacted");

	expect(sentPixels()).toEqual([
		'CompactRoomMessages(roomId="room-1", parentMessageId="r1", compactionTypes=["SUMMARY"]);',
	]);
	expect(loading).toContain(true);
	expect(room.isLoading).toBe(false);
	expect(compacting[0]).toBe(true);
	expect(target.isCompacting).toBe(false);
	expect(target.conversationCompactedAbove).toBe(true);
	expect(target.children.map((child) => child.id)).toEqual(["s-in"]);
	expect(room.history.map((m) => m.id)).toEqual([
		"i1",
		"r1",
		"s-in",
		"s-out",
	]);
	expect(room.latestResponseMessage.id).toBe("s-out");
});

test("compacting with AUTO or no strategy lets the backend pick, and may skip", async () => {
	const room = await createRoom(ONE_EXCHANGE);
	vi.mocked(runPixel).mockResolvedValue(reply([[]]));

	await expect(room.compactMessages("AUTO")).resolves.toBe("skipped");
	await expect(room.compactMessages()).resolves.toBe("skipped");

	expect(sentPixels()).toEqual([
		'CompactRoomMessages(roomId="room-1", parentMessageId="r1");',
		'CompactRoomMessages(roomId="room-1", parentMessageId="r1");',
	]);
	const target = room.getMessage("r1") as ResponseMessageStore;
	expect(target.conversationCompactedAbove).toBe(false);
	expect(target.children).toHaveLength(0);
	expect(target.isCompacting).toBe(false);
});

test("compacting fails when every method fails, a response has tools, or the room is unloaded", async () => {
	const room = await createRoom(ONE_EXCHANGE);
	vi.mocked(runPixel).mockResolvedValue(
		reply([[{ type: "SUMMARY", success: false, error: "too short" }]]),
	);
	await expect(room.compactMessages()).rejects.toThrow();
	const target = room.getMessage("r1") as ResponseMessageStore;
	// nothing was compacted, so the response is not marked
	expect(target.conversationCompactedAbove).toBe(false);
	expect(target.children).toHaveLength(0);
	expect(target.isCompacting).toBe(false);

	const withTools = await createRoom([
		message("INPUT", "i1", ""),
		message("OUTPUT", "r1", "i1", [
			{
				type: "TOOL_CALL",
				toolCall: {
					id: "call-1",
					type: "function",
					name: "lookup",
					arguments: {},
					_tool_found: true,
					original_name: "lookup",
					description: "",
				},
			} as PixelMessage["parts"][number],
		]),
	]);
	await expect(withTools.compactMessages()).rejects.toThrow(
		"Cannot compact a response that includes tool calls",
	);
	expect(runPixel).not.toHaveBeenCalled();

	const unloaded = new RoomStore({
		theme: {} as ThemeMap["playground"],
		roomId: "room-2",
		panelComponents: DEFAULT_WORKBENCH_PANEL_COMPONENTS,
	});
	await expect(unloaded.compactMessages()).rejects.toThrow(
		"No response message to compact",
	);
});

test("compacting an empty room has no response to compact, and sends nothing", async () => {
	const room = await createRoom();
	vi.mocked(runPixel).mockResolvedValue(reply([[]]));

	// the root placeholder is no response
	await expect(room.compactMessages()).rejects.toThrow(
		"No response message to compact",
	);
	expect(sentPixels()).toEqual([]);
});

test("cancelling stops a cancellable stream and tracks its state on the room", async () => {
	vi.useFakeTimers();
	const room = await createRoom(ONE_EXCHANGE);
	vi.mocked(runPixelAsync).mockResolvedValue({ jobId: "job-1" });
	vi.mocked(getPixelJobStreaming).mockResolvedValue({
		status: "Streaming",
		message: [],
	});
	vi.mocked(runPixel).mockResolvedValue(reply([]));
	const onCancel = vi.fn();

	const stream = room.runRoomPixelStreaming("AskPlayground();", {
		onEmit: vi.fn(),
		onResult: vi.fn(),
		onCancel,
	});
	await vi.advanceTimersByTimeAsync(0);
	expect(room.getSnapshot().canCancelJob).toBe(true);
	expect(room.canCancel).toBe(true);
	expect(room.isLoading).toBe(true);

	await room.cancelActiveJob();

	expect(sentPixels()).toEqual(['StopPixelExecution(id=["job-1"]);']);
	expect(onCancel).toHaveBeenCalledTimes(1);
	expect(room.getSnapshot().canCancelJob).toBe(false);
	expect(room.getSnapshot().isCancellingJob).toBe(true);
	expect(room.isCancelling).toBe(true);

	await vi.advanceTimersByTimeAsync(500);
	await stream;
	expect(room.getSnapshot().isCancellingJob).toBe(false);
	expect(room.isCancelling).toBe(false);
	expect(room.isLoading).toBe(false);
	expect(room.error).toBeNull();
});

test("cancelling a turn parked on tool calls cancels them, and otherwise does nothing", async () => {
	const idle = await createRoom(ONE_EXCHANGE);
	await idle.cancelActiveJob();
	expect(runPixel).not.toHaveBeenCalled();
	expect(idle.isCancelling).toBe(false);

	const room = await createRoom([
		message("INPUT", "i1", ""),
		message("OUTPUT", "r1", "i1", [
			{
				type: "TOOL_CALL",
				toolCall: {
					id: "call-1",
					type: "function",
					name: "lookup",
					arguments: {},
					_tool_found: true,
					original_name: "lookup",
					description: "",
				},
			} as PixelMessage["parts"][number],
		]),
	]);
	const parked = room.getMessage("r1") as ResponseMessageStore;
	expect(parked.hasUnfinishedTools).toBe(true);
	expect(room.canCancel).toBe(true);
	let release: () => void = () => {};
	const cancelPendingTools = vi
		.spyOn(parked, "cancelPendingTools")
		.mockReturnValue(
			new Promise<void>((resolve) => {
				release = resolve;
			}),
		);

	const cancel = room.cancelActiveJob();
	expect(cancelPendingTools).toHaveBeenCalledTimes(1);
	expect(room.getSnapshot().isCancellingTools).toBe(true);
	expect(room.isCancelling).toBe(true);
	expect(room.canCancel).toBe(false);

	// a second stop while the first commits does nothing
	await room.cancelActiveJob();
	expect(cancelPendingTools).toHaveBeenCalledTimes(1);

	release();
	await cancel;
	expect(room.getSnapshot().isCancellingTools).toBe(false);
	expect(room.isCancelling).toBe(false);
});
