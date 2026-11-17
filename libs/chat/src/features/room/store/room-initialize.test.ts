import {
	afterEach,
	beforeEach,
	expect,
	type MockInstance,
	test,
	vi,
} from "vitest";
import { getWorkspace, type WorkspaceDetails } from "@semoss/sdk";
import { runMcpTool, runPixel } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { servePixelTransport } from "../../../test/pixel-transport";
import type {
	Engine,
	InputPixelMessage,
	MCPConfig,
	PixelMessage,
	ResponsePixelMessage,
} from "../../../types";
import { MCP_EXECUTION_AUTO } from "../../tools/mcp/mcp-constants";
import { listRoomTools } from "../../tools/mcp/mcp-utils";
import { DEFAULT_WORKBENCH_PANEL_COMPONENTS } from "../../workbench/panels/room-panel-components";
import {
	AgentTurnRunner,
	reconstructAllSubagents,
} from "../turns/agent-turn-runner";
import { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";
import { RoomStore } from "./room.store";

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getWorkspace: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	download: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runMcpTool: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

// the SDK's own calls go out over HTTP; answer them from the mocks above
servePixelTransport({ runPixel: vi.mocked(runPixel) });

// the agent run's own polling is the harness's to test; here only whether
// the room picks it up
vi.mock("../turns/agent-turn-runner", async (importOriginal) => ({
	...(await importOriginal<typeof import("../turns/agent-turn-runner")>()),
	reconstructAllSubagents: vi.fn().mockResolvedValue(undefined),
}));

/** The room's stored options, as GetRoomOptions returns them. */
type StoredOptions = Partial<RoomStore["options"]> & { modelId?: string };

/** What the backend holds for the room. */
interface Backend {
	messages?: PixelMessage[];
	options?: StoredOptions;
	roomName?: string;
	workspace?: Partial<WorkspaceDetails>;
	engines?: Engine[];
}

/** A pixel response with one output per statement. */
const reply = (outputs: unknown[], errors: string[] = []) => ({
	errors,
	insightId: "insight-bound",
	pixelReturn: outputs.map((output) => ({
		output,
		isMeta: false,
		operationType: [],
		pixelExpression: "",
		pixelId: "",
		timeToRun: 0,
	})),
});

/** Answer the room's pixels and agent from `backend`; any other pixel fails the test. */
const serve = (backend: Backend = {}) => {
	// the SDK fills in the lists the backend leaves out
	vi.mocked(getWorkspace).mockImplementation(async () => ({
		mcp: [],
		skills: [],
		prompts: [],
		...(backend.workspace as WorkspaceDetails),
	}));
	return vi.mocked(runPixel).mockImplementation(async (pixel: string) => {
		if (pixel.startsWith("GetPlaygroundMessages")) {
			return reply([
				backend.messages ?? [],
				{ OPTIONS: backend.options, ROOM_NAME: backend.roomName },
				true,
			]);
		}
		if (pixel.startsWith("META | MyEngines")) {
			return reply([backend.engines ?? []]);
		}
		if (pixel.startsWith("UpdateRoomOptions")) {
			return reply([true]);
		}
		throw new Error(`Unexpected pixel: ${pixel}`);
	});
};

/** The pixels the room sent, in order. */
const sentPixels = () => vi.mocked(runPixel).mock.calls.map(([pixel]) => pixel);

/** A model, as MyEngines lists it. */
const model = (id: string): Engine => ({
	engine_id: id,
	engine_name: `Model ${id}`,
	engine_type: "MODEL",
});

/** A user's message. */
const input = (
	messageId: string,
	parentMessageId: string,
	extra: Partial<InputPixelMessage> = {},
): InputPixelMessage => ({
	io: "INPUT",
	type: "INPUT_TEXT",
	messageId,
	parentMessageId,
	visible: true,
	platform_generated: false,
	modelId: "model-a",
	modelType: "",
	dateCreated: "2026-01-01 00:00:00",
	parts: [{ type: "TEXT", text: messageId, uiText: messageId }],
	tokens: 0,
	ornaments: {},
	pruneToolsAbove: false,
	...extra,
});

/** A model's response. */
const output = (
	messageId: string,
	parentMessageId: string,
	extra: Partial<ResponsePixelMessage> = {},
): ResponsePixelMessage => ({
	io: "OUTPUT",
	messageId,
	parentMessageId,
	visible: true,
	platform_generated: false,
	modelId: "model-a",
	modelType: "",
	dateCreated: "2026-01-01 00:00:00",
	parts: [{ type: "TEXT", text: messageId, uiText: messageId }],
	tokens: 0,
	ornaments: {},
	pruneToolsAbove: false,
	...extra,
});

/** A toolbox. */
const mcp = (id: string, extra: Partial<MCPConfig> = {}) =>
	({ id, type: "MCP", name: id, ...extra }) as MCPConfig;

/** A room as the app builds one, its connectors' restore stubbed. */
const createRoom = (insightId = "insight-1") => {
	const room = new RoomStore({
		theme: {} as ThemeMap["playground"],
		roomId: "room-1",
		insightId,
		panelComponents: DEFAULT_WORKBENCH_PANEL_COMPONENTS,
	});
	const restore = vi
		.spyOn(room.connectors, "restore")
		.mockResolvedValue(undefined);
	return { room, restore };
};

/** The ids of the conversation as shown. */
const historyIds = (room: RoomStore) => room.history.map((m) => m.id);

/** The ids of a message's children. */
const childIds = (message: { children: readonly { id: string }[] } | null) =>
	message?.children.map((child) => child.id);

/** The room's reconnect to its agent run; here only whether the room asks. */
let reconnectAgentRun: MockInstance<AgentTurnRunner["reconnect"]>;

beforeEach(() => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	reconnectAgentRun = vi
		.spyOn(AgentTurnRunner.prototype, "reconnect")
		.mockImplementation(() => undefined);
});

afterEach(() => {
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

test("loading binds the room to its insight in one pixel and restores its connectors", async () => {
	const { room, restore } = createRoom("new");
	serve();
	const loading: boolean[] = [];
	room.subscribe(() => loading.push(room.isLoading));

	await room.initialize({ isNew: true });

	expect(sentPixels()).toEqual([
		'GetPlaygroundMessages(roomId=["room-1"]); GetRoomOptions(roomId="room-1"); SetRoomForInsight(roomId="room-1");',
	]);
	// the pixel runs on the insight the room started on
	expect(vi.mocked(runPixel).mock.calls[0]?.[1]).toBe("new");
	expect(room.insightId).toBe("insight-bound");
	expect(restore).toHaveBeenCalledWith({ isNew: true });
	// the load never shows the room's spinner
	expect(loading).not.toContain(true);
	expect(room.isLoading).toBe(false);
	expect(room.error).toBeNull();
});

test("an empty room hangs from a hidden root placeholder", async () => {
	const { room } = createRoom();
	room.setModel({ ...model("model-a"), engine_display_name: "Model A" });
	serve();

	await room.initialize();

	const root = room.root;
	expect(root).toBeInstanceOf(ResponseMessageStore);
	expect(root.id).toBe("ROOT_PLACEHOLDER_ID");
	expect(root.visible).toBe(false);
	expect(root.type).toBe("OUTPUT");
	expect(root.modelId).toBe("model-a");
	expect(root.ornaments.modelName).toBe("Model A");
	expect(room.history).toEqual([]);
	expect(room.tail).toBe(root);
	// the root is no response, so an empty room has none
	expect(room.latestResponseMessage).toBeNull();
});

test("messages link to their parents in any order, the last sibling active", async () => {
	const { room } = createRoom();
	serve({
		messages: [
			// a child before its parent
			output("r1", "i1"),
			input("i1", ""),
			input("i2a", "r1"),
			output("r2a", "i2a"),
			// a second branch from r1, listed later, so it is the one shown
			input("i2b", "r1"),
			output("r2b", "i2b"),
			// a hidden pair stays in the tree and in the history
			input("hidden-in", "r2b", { visible: false }),
			output("hidden-out", "hidden-in", { visible: false }),
		],
	});

	await room.initialize();

	const root = room.root;
	expect(childIds(root)).toEqual(["i1"]);
	expect(childIds(room.getMessage("r1"))).toEqual(["i2a", "i2b"]);
	expect(room.getMessage("r1")?.activeChild?.id).toBe("i2b");
	expect(room.getMessage("i2a")?.parent?.id).toBe("r1");
	expect(historyIds(room)).toEqual([
		"i1",
		"r1",
		"i2b",
		"r2b",
		"hidden-in",
		"hidden-out",
	]);
	expect(room.history.map((m) => m.visible)).toEqual([
		true,
		true,
		true,
		true,
		false,
		false,
	]);
	expect(room.history[0]).toBeInstanceOf(InputMessageStore);
	expect(room.history[1]).toBeInstanceOf(ResponseMessageStore);
	expect(room.tail.id).toBe("hidden-out");
	expect(room.latestResponseMessage.id).toBe("hidden-out");
	// the branch not shown is still found
	expect(room.getMessage("r2a")?.id).toBe("r2a");
});

test("compaction gives a message whose parent is gone its summary leaf as parent", async () => {
	const { room } = createRoom();
	serve({
		messages: [
			input("i1", ""),
			output("r1", "i1"),
			// its parent was compacted away; it hangs from the summary leaf
			input("i2", "compacted-away", { summaryLeafMessageId: "r1" }),
			output("r2", "i2", { pruneToolsAbove: true }),
			// neither parent nor leaf is in the room: it hangs from the root
			input("orphan", "missing", { summaryLeafMessageId: "missing-too" }),
		],
	});

	await room.initialize();

	const root = room.root;
	expect(childIds(root)).toEqual(["i1", "orphan"]);
	expect(childIds(room.getMessage("r1"))).toEqual(["i2"]);
	const leaf = room.getMessage("r1") as ResponseMessageStore;
	expect(leaf.conversationCompactedAbove).toBe(true);
	// a response the backend pruned above is marked from its own flag
	const pruned = room.getMessage("r2") as ResponseMessageStore;
	expect(pruned.conversationCompactedAbove).toBe(true);
	const first = room.getMessage("i1");
	expect(first).toBeInstanceOf(InputMessageStore);
	// the root's active child is the orphan, added last
	expect(historyIds(room)).toEqual(["orphan"]);
});

test("a stored harness promotes the room to agent mode, and nothing demotes it", async () => {
	const promoted = createRoom().room;
	serve({ options: { harnessType: "semoss" } });
	await promoted.initialize();
	expect(promoted.mode).toBe("agent");
	expect(promoted.options.harnessType).toBe("semoss");

	const kept = createRoom().room;
	kept.setMode("agent");
	serve({ options: {} });
	await kept.initialize();
	expect(kept.mode).toBe("agent");

	const chat = createRoom().room;
	serve({ options: {} });
	await chat.initialize();
	expect(chat.mode).toBe("chat");
});

test("an agent room reconnects the run its last response belongs to", async () => {
	const { room } = createRoom();
	serve({
		options: { harnessType: "semoss" },
		messages: [
			input("i1", ""),
			output("r1", "i1", {
				agentRun: {
					runId: "run-1",
				} as ResponsePixelMessage["agentRun"],
			}),
		],
	});

	await room.initialize();

	expect(reconstructAllSubagents).toHaveBeenCalledWith(room);
	expect(reconnectAgentRun).toHaveBeenCalledTimes(1);
	expect(reconnectAgentRun).toHaveBeenCalledWith(room.getMessage("r1"));
});

test("an agent room whose last message is the user's reconnects nothing", async () => {
	const { room } = createRoom();
	serve({ options: { harnessType: "semoss" }, messages: [input("i1", "")] });

	await room.initialize();

	expect(reconstructAllSubagents).toHaveBeenCalledTimes(1);
	expect(reconnectAgentRun).not.toHaveBeenCalled();
});

test("an empty agent room reconnects nothing", async () => {
	const { room } = createRoom();
	serve({ options: { harnessType: "semoss" } });

	await room.initialize();

	// the root placeholder is no turn, so there is nothing to reconnect
	expect(reconstructAllSubagents).toHaveBeenCalledTimes(1);
	expect(reconnectAgentRun).not.toHaveBeenCalled();
});

test("a chat room continues the auto tool calls its last response left", async () => {
	const { room } = createRoom();
	vi.mocked(runMcpTool).mockReturnValue(new Promise(() => {}));
	serve({
		messages: [
			input("i1", ""),
			output("r1", "i1", {
				parts: [
					{
						type: "TOOL_CALL",
						toolCall: {
							id: "call-1",
							type: "function",
							name: "lookup",
							arguments: { q: "x" },
							_tool_found: true,
							original_name: "lookup",
							description: "",
							_meta: { SMSS_MCP_EXECUTION: MCP_EXECUTION_AUTO },
						},
					} as unknown as ResponsePixelMessage["parts"][number],
				],
			}),
		],
	});

	await room.initialize();

	expect(reconnectAgentRun).not.toHaveBeenCalled();
	expect(reconstructAllSubagents).not.toHaveBeenCalled();
	expect(room.getTool("call-1")?.status).toBe("LOADING");
	expect(runMcpTool).toHaveBeenCalledTimes(1);
	expect(vi.mocked(runMcpTool).mock.calls[0]?.[0]).toMatchObject({
		roomId: "room-1",
		name: "lookup",
		paramValues: { q: "x" },
	});
});

test("an agent's tools are the room's agent tools, apart from its own", async () => {
	const { room } = createRoom();
	serve({
		options: {
			workspace: { workspace_id: "agent-1" },
			mcp: [
				mcp("shared", { name: "room copy" }),
				mcp("room-only"),
				mcp("dup", { name: "first" }),
				mcp("dup", { name: "second" }),
			],
		},
		workspace: {
			name: "agent-name",
			display_name: "Agent One",
			mcp: [mcp("shared", { name: "agent copy" }), mcp("agent-only")],
			system_prompt: "Agent prompt",
			config_json: { greeting_enabled: true, greeting: "Hello there" },
		},
	});

	await room.initialize();

	// the agent is read in the room's insight
	expect(getWorkspace).toHaveBeenCalledWith("insight-bound", "agent-1");
	expect(room.agentTools.map(({ id, name }) => [id, name])).toEqual([
		["shared", "agent copy"],
		["agent-only", "agent-only"],
	]);
	// the options hold the room's own tools, as stored
	expect(room.options.mcp.map(({ id, name }) => [id, name])).toEqual([
		["shared", "room copy"],
		["room-only", "room-only"],
		["dup", "first"],
		["dup", "second"],
	]);
	// listed together, the agent's come first and each id is shown once, a
	// room tool of an agent tool's id as the agent's
	expect(
		listRoomTools(room.options.mcp, room.agentTools).map(({ id, name }) => [
			id,
			name,
		]),
	).toEqual([
		["shared", "agent copy"],
		["agent-only", "agent-only"],
		["room-only", "room-only"],
		// the same id twice: the later one is kept, in the earlier one's place
		["dup", "second"],
	]);
	// the display name wins over the name
	expect(room.options.workspace).toEqual({
		workspace_id: "agent-1",
		name: "Agent One",
	});
	// empty instructions take the agent's system prompt
	expect(room.options.instructions).toBe("Agent prompt");
	expect(room.agentGreeting).toBe("Hello there");
});

test("the agent's prompt and greeting apply only when the room and agent allow", async () => {
	const own = createRoom().room;
	serve({
		options: {
			workspace: { workspace_id: "agent-1" },
			instructions: "Room prompt",
		},
		workspace: {
			name: "Agent",
			mcp: [],
			system_prompt: "Agent prompt",
			config_json: { greeting_enabled: false, greeting: "Hidden" },
		},
	});
	await own.initialize();
	expect(own.options.instructions).toBe("Room prompt");
	expect(own.agentGreeting).toBe("");
	expect(own.options.workspace?.name).toBe("Agent");

	const noTools = createRoom().room;
	serve({
		options: { workspace: { workspace_id: "agent-1" } },
		workspace: { name: "Agent", system_prompt: "Agent prompt" },
	});
	await noTools.initialize();
	// an agent without tools still lends its prompt
	expect(noTools.options.instructions).toBe("Agent prompt");
	expect(noTools.agentTools).toEqual([]);
});

test("a room without an agent id loads no workspace and drops the field", async () => {
	const { room } = createRoom();
	serve({ options: { workspace: { workspace_id: "" }, instructions: "x" } });

	await room.initialize();

	expect(sentPixels()).toHaveLength(1);
	expect(getWorkspace).not.toHaveBeenCalled();
	expect(room.options.workspace).toBeUndefined();
	expect(room.agentTools).toEqual([]);
	expect(room.options.instructions).toBe("x");
	expect(room.agentGreeting).toBe("");
});

test("the model comes from the last input message, else the agent's default", async () => {
	const fromHistory = createRoom().room;
	serve({
		messages: [
			input("i1", "", { modelId: "model-old" }),
			output("r1", "i1"),
			input("i2", "r1", { modelId: "model-new" }),
		],
		engines: [model("model-new")],
	});
	await fromHistory.initialize();
	expect(sentPixels()).toContain(
		'META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"], filterWord="model-new");',
	);
	expect(fromHistory.model).toEqual(model("model-new"));

	vi.mocked(runPixel).mockClear();
	const fromAgent = createRoom().room;
	serve({
		options: { workspace: { workspace_id: "agent-1" } },
		workspace: { name: "Agent", config_json: { model_id: "model-agent" } },
		engines: [model("model-agent")],
	});
	await fromAgent.initialize();
	expect(sentPixels().at(-1)).toContain('filterWord="model-agent"');
	expect(fromAgent.model).toEqual(model("model-agent"));

	// history wins over the agent's default
	vi.mocked(runPixel).mockClear();
	const both = createRoom().room;
	serve({
		messages: [input("i1", "", { modelId: "model-history" })],
		options: { workspace: { workspace_id: "agent-1" } },
		workspace: { name: "Agent", config_json: { model_id: "model-agent" } },
		engines: [model("model-history")],
	});
	await both.initialize();
	expect(sentPixels().at(-1)).toContain('filterWord="model-history"');
});

test("a room already on its model, or with an unknown one, keeps the model it has", async () => {
	const same = createRoom().room;
	same.setModel(model("model-a"));
	serve({ messages: [input("i1", "", { modelId: "model-a" })] });
	await same.initialize();
	expect(sentPixels().some((p) => p.includes("MyEngines"))).toBe(false);
	expect(same.model).toEqual(model("model-a"));

	const unknown = createRoom().room;
	unknown.setModel(model("model-a"));
	serve({ messages: [input("i1", "", { modelId: "model-gone" })] });
	await unknown.initialize();
	expect(sentPixels().at(-1)).toContain('filterWord="model-gone"');
	expect(unknown.model).toEqual(model("model-a"));
});

test("the stored room name becomes the room's name", async () => {
	const { room } = createRoom();
	serve({ roomName: "Quarterly plan" });

	await room.initialize();

	expect(room.metadata.name).toBe("Quarterly plan");
});

test("after loading, saving the options the backend holds sends nothing", async () => {
	const { room } = createRoom();
	room.setModel(model("model-a"));
	serve({
		options: {
			instructions: "Be brief",
			mcp: [mcp("room-tool")],
			predefinedPrompts: [],
			modelId: "model-a",
		},
	});
	await room.initialize();
	vi.mocked(runPixel).mockClear();

	await room.updateRoomOptions(room.options);

	expect(runPixel).not.toHaveBeenCalled();
});

test("after loading, the first save of options the backend did not spell out is sent", async () => {
	const partial = createRoom().room;
	partial.setModel(model("model-a"));
	serve({ options: { instructions: "Be brief", modelId: "model-a" } });
	await partial.initialize();
	vi.mocked(runPixel).mockClear();
	await partial.updateRoomOptions(partial.options);
	// today: the local defaults (empty mcp and prompts) make the options
	// differ from the stored ones, so an unchanged room saves once
	expect(sentPixels()).toHaveLength(1);

	const agent = createRoom().room;
	agent.setModel(model("model-a"));
	serve({
		options: {
			instructions: "",
			mcp: [],
			predefinedPrompts: [],
			modelId: "model-a",
			workspace: { workspace_id: "agent-1" },
		},
		workspace: { name: "Agent", mcp: [mcp("agent-tool")] },
	});
	await agent.initialize();
	vi.mocked(runPixel).mockClear();
	await agent.updateRoomOptions(agent.options);
	// the agent's name, read on load to be shown, is no change to save
	expect(sentPixels()).toHaveLength(0);
	expect(agent.agentTools.map((tool) => tool.id)).toEqual(["agent-tool"]);

	// a change to the options is saved, with the room's tools alone
	await agent.updateRoomOptions({ ...agent.options, instructions: "New" });
	expect(sentPixels()).toHaveLength(1);
	expect(sentPixels()[0]).not.toContain("agent-tool");
});

test("a load that fails leaves the room idle with the failure", async () => {
	const { room } = createRoom();
	vi.mocked(runPixel).mockResolvedValue(reply([], ["Room not found"]));

	await expect(room.initialize()).rejects.toThrow("Room not found");

	expect(room.isLoading).toBe(false);
	expect(room.error).toEqual(new Error("Room not found"));
	// nothing was bound or built
	expect(room.insightId).toBe("insight-1");
	expect(room.root).toBeNull();
});

test("a failing agent lookup fails the load after the tree is built", async () => {
	const { room } = createRoom();
	vi.mocked(runPixel).mockImplementation(async (pixel: string) => {
		if (pixel.startsWith("GetPlaygroundMessages")) {
			return reply([
				[input("i1", "")],
				{ OPTIONS: { workspace: { workspace_id: "agent-1" } } },
				true,
			]);
		}
		throw new Error(`Unexpected pixel: ${pixel}`);
	});
	vi.mocked(getWorkspace).mockRejectedValue(new Error("network down"));

	await expect(room.initialize()).rejects.toThrow("network down");

	expect(room.error).toEqual(new Error("network down"));
	expect(room.isLoading).toBe(false);
	// the tree and insight were already taken; the options were not
	expect(historyIds(room)).toEqual(["i1"]);
	expect(room.insightId).toBe("insight-bound");
	expect(room.options.workspace).toBeUndefined();
});

test("loading again replaces the messages, and drops the calls only the last load held", async () => {
	const { room } = createRoom();
	/** A tool call the user has to answer, so loading runs nothing. */
	const call = (id: string) =>
		({
			type: "TOOL_CALL",
			toolCall: {
				id,
				type: "function",
				name: "lookup",
				arguments: {},
				_tool_found: true,
				original_name: "lookup",
				description: "",
			},
		}) as ResponsePixelMessage["parts"][number];
	serve({
		messages: [
			input("i1", ""),
			output("r1", "i1", {
				parts: [call("call-old"), call("call-kept")],
			}),
		],
	});
	await room.initialize();
	const oldReply = room.getMessage("r1") as ResponseMessageStore;
	const oldKeys = Object.keys(room.getSnapshot().messages);
	const keptTool = room.getTool("call-kept");

	serve({
		messages: [
			input("i1", ""),
			output("r1", "i1", { parts: [call("call-kept")] }),
		],
	});
	await room.initialize();

	const { messages, tools } = room.getSnapshot();
	// the root and the two messages of this load, none of the last one's
	expect(Object.keys(messages)).toHaveLength(3);
	expect(oldKeys.some((key) => key in messages)).toBe(false);
	expect(historyIds(room)).toEqual(["i1", "r1"]);
	expect(room.getMessage("r1")).not.toBe(oldReply);
	// a view of the last load reads as empty rather than throwing
	expect(oldReply.id).toBe("");
	expect(oldReply.parts).toEqual([]);
	// a call this load synced again keeps its entry and its view
	expect(tools["call-old"]).toBeUndefined();
	expect(room.getTool("call-kept")).toBe(keptTool);
	expect(keptTool?.message).toBe(room.getMessage("r1"));
});
