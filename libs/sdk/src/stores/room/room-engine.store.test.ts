import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "../../api/base";
import type { ClientToolProvider } from "./chat-tools/client-tool-provider";
import type {
	InputPixelMessage,
	ModelEngine,
	ResponsePixelMessage,
} from "./room.types";
import { RoomEngine } from "./room-engine.store";

// Runs in Node, with no DOM: the engine must work for a terminal agent.
vi.mock("../../api/base", () => ({
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	getPixelJobStreaming: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	console: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);
const mockRunPixelAsync = vi.mocked(runPixelAsync);
const mockStreaming = vi.mocked(getPixelJobStreaming);
const mockResult = vi.mocked(getPixelAsyncResult);

const MODEL: ModelEngine = {
	engine_id: "model-1",
	engine_name: "Model",
	engine_type: "MODEL",
};

/** A runPixel answer, one output per statement. */
const pixelAnswer = (outputs: unknown[], insightId = "insight-1") =>
	({
		errors: [],
		insightId: insightId,
		pixelReturn: outputs.map((output) => ({
			isMeta: false,
			operationType: ["OPERATION"],
			output: output,
			pixelExpression: "",
			pixelId: "",
			timeToRun: 0,
		})),
	}) as Awaited<ReturnType<typeof runPixel>>;

/** A stored message pair, as the backend returns it. */
const storedTurn = (
	inputId: string,
	responseId: string,
	parentId: string,
	responseParts: ResponsePixelMessage["parts"] = [
		{ type: "TEXT", text: "Hello back", uiText: "Hello back" },
	],
): [InputPixelMessage, ResponsePixelMessage] => [
	{
		io: "INPUT",
		type: "INPUT_TEXT",
		messageId: inputId,
		parentMessageId: parentId,
		visible: true,
		platform_generated: false,
		modelId: "model-1",
		modelType: "MODEL",
		dateCreated: "2026-11-05 10:00:00",
		parts: [{ type: "TEXT", text: "Hello", uiText: "Hello" }],
		tokens: 10,
		ornaments: {},
		pruneToolsAbove: false,
	},
	{
		io: "OUTPUT",
		messageId: responseId,
		parentMessageId: inputId,
		visible: true,
		platform_generated: false,
		modelId: "model-1",
		modelType: "MODEL",
		dateCreated: "2026-11-05 10:00:01",
		parts: responseParts,
		tokens: 5,
		ornaments: { modelName: "Model" },
		pruneToolsAbove: false,
	},
];

/** A streaming job that finishes on its first poll with `output`. */
const finishJob = (output: unknown) => {
	mockStreaming.mockResolvedValueOnce({ status: "Complete", message: [] });
	mockResult.mockResolvedValueOnce({
		errors: [],
		results: [{ output: output, operationType: ["OPERATION"] }],
	} as unknown as Awaited<ReturnType<typeof getPixelAsyncResult>>);
};

/** A client tool that echoes its arguments, run without asking. */
const echoProvider: ClientToolProvider = {
	id: "echo",
	getTools: () => [
		{
			name: "echo",
			description: "Echo the text",
			inputSchema: { type: "object", properties: {}, required: [] },
		},
	],
	canHandle: (call) => call.name === "echo",
	execute: async (call) => ({
		output: `echo:${String(call.arguments.text)}`,
	}),
	decorateToolCall: (call) =>
		call.name === "echo"
			? {
					...call,
					_meta: {
						SMSS_ENGINE_NAME: "",
						SMSS_ENGINE_ID: "",
						SMSS_ENGINE_TYPE: "",
						SMSS_PROJECT_NAME: "",
						SMSS_PROJECT_ID: "",
						...call._meta,
						SMSS_MCP_EXECUTION: "auto",
						SMSS_CLIENT_TOOL: true,
					},
				}
			: call,
};

describe("RoomEngine", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRunPixelAsync.mockResolvedValue({ jobId: "job-1" });
	});

	it("binds a fresh insight on load and builds the active history", async () => {
		const [input, response] = storedTurn("in-1", "out-1", "");
		mockRunPixel.mockResolvedValueOnce(
			pixelAnswer(
				[
					[input, response],
					{
						OPTIONS: { instructions: "Be brief", mcp: [] },
						ROOM_NAME: "Plans",
					},
					true,
				],
				"bound-insight",
			),
		);

		const room = new RoomEngine({ roomId: "room-1" });
		room.setModel(MODEL);
		await room.initialize();

		const [pixel, insightId] = mockRunPixel.mock.calls[0];
		expect(insightId).toBe("new");
		expect(pixel).toBe(
			'GetPlaygroundMessages(roomId=["room-1"]); GetRoomOptions(roomId="room-1"); SetRoomForInsight(roomId="room-1");',
		);
		expect(room.insightId).toBe("bound-insight");
		expect(room.history.map((message) => message.id)).toEqual([
			"in-1",
			"out-1",
		]);
		expect(room.metadata.name).toBe("Plans");
		expect(room.options.instructions).toBe("Be brief");
	});

	it("sends client tools with the turn and again with the tool's result", async () => {
		const room = new RoomEngine({
			roomId: "room-1",
			insightId: "insight-1",
			config: { clientTools: [echoProvider] },
		});
		room.setModel(MODEL);

		// UpdateRoomOptions, then the tool result's save
		mockRunPixel.mockResolvedValue(pixelAnswer([true]));

		const [input, response] = storedTurn("in-1", "out-1", "", [
			{
				type: "TOOL_CALL",
				toolCall: {
					id: "call-1",
					type: "function",
					name: "echo",
					arguments: { text: "hi" },
					_tool_found: true,
					original_name: "echo",
					description: "",
				},
			},
		]);
		finishJob({ inputMessage: input, responseMessage: response });
		const [, followUp] = storedTurn("in-2", "out-2", "out-1");
		finishJob({
			inputMessage: { ...input, tokens: 20 },
			responseMessage: followUp,
		});

		await room.askMessage("Hello");
		await room.waitForIdle();

		const [askPixel] = mockRunPixelAsync.mock.calls[0];
		expect(askPixel).toContain("AskPlayground(");
		expect(askPixel).toContain('"tools":[{"name":"echo"');

		const [savePixel] = mockRunPixelAsync.mock.calls[1];
		expect(savePixel).toContain("AddPlaygroundToolExecution(");
		expect(savePixel).toContain(
			'toolExecutionResponse=["<encode>echo:hi</encode>"]',
		);
		expect(savePixel).toContain('"tools":[{"name":"echo"');

		expect(room.getTool("call-1").status).toBe("SUCCESS");
		expect(room.tail.id).toBe("out-2");
	});

	it("adds the host's turn context to the saved instructions and stamps its scope", async () => {
		const room = new RoomEngine({
			roomId: "room-1",
			insightId: "insight-1",
			config: {
				roomScope: { token: "scope:widget" },
				turnContext: () => "The user is on the claims page.",
			},
			options: { instructions: "Be brief" },
		});
		room.setModel(MODEL);
		mockRunPixel.mockResolvedValue(pixelAnswer([true]));
		const [input, response] = storedTurn("in-1", "out-1", "");
		finishJob({ inputMessage: input, responseMessage: response });

		await room.askMessage("Hello");

		const [savePixel] = mockRunPixel.mock.calls[0];
		expect(savePixel).toContain("UpdateRoomOptions(");
		expect(savePixel).toContain(
			'"instructions":"Be brief\\n\\nThe user is on the claims page."',
		);
		expect(savePixel).toContain('"roomScope":"scope:widget"');

		const [askPixel] = mockRunPixelAsync.mock.calls[0];
		expect(askPixel).toContain(
			'context=["<encode>Be brief\n\nThe user is on the claims page.</encode>"]',
		);
		// the local options keep the room's own instructions
		expect(room.options.instructions).toBe("Be brief");
	});

	it("tells its listeners when its messages change", async () => {
		const room = new RoomEngine({
			roomId: "room-1",
			insightId: "insight-1",
		});
		room.setModel(MODEL);
		const listener = vi.fn();
		room.subscribe(listener);

		const placeholder = room.createResponsePlaceholder();
		room.root.addChild(placeholder);
		listener.mockClear();

		placeholder.savePart({ type: "TEXT", text: "Hel", uiText: "Hel" });
		const firstParts = placeholder.parts;
		placeholder.savePart({ type: "TEXT", text: "lo", uiText: "lo" });

		expect(listener).toHaveBeenCalled();
		// a streamed chunk replaces the parts, so a selector sees it
		expect(placeholder.parts).not.toBe(firstParts);
		expect(placeholder.parts).toEqual([
			{ type: "TEXT", text: "Hello", uiText: "Hello" },
		]);
	});

	it("puts queued files back when the message cannot be sent", async () => {
		const room = new RoomEngine({
			roomId: "room-1",
			insightId: "insight-1",
		});
		room.setModel(MODEL);
		room.contextItems.add({ path: "notes.txt", name: "notes.txt" });
		mockRunPixel.mockRejectedValueOnce(new Error("save failed"));

		await expect(room.askMessage("Hello")).rejects.toThrow();
		expect(room.contextItems.items.map((item) => item.path)).toEqual([
			"notes.txt",
		]);
		expect(room.history).toEqual([]);
	});
});
