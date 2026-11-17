import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runMcpTool,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { servePixelTransport } from "../../../test/pixel-transport";
import type {
	Engine,
	InputPixelMessage,
	PixelMessageToolCallPart,
	ResponsePixelMessage,
} from "../../../types";
import { RoomStore } from "../../room/store/room.store";
import {
	TOOL_ERROR_PROMPT,
	TURN_CANCELLATION_PROMPT,
} from "../../tools/mcp/mcp-constants";
import { ROOM_PANEL_COMPONENTS } from "../../workbench/panels/room-panel.components";
import type { ResponseMessageStore } from "./response-message.store";

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

/** One statement of a pixel's result. */
interface Statement {
	operationType: string[];
	output: unknown;
}

/** One poll of a streaming job. */
interface Poll {
	status: string;
	message: unknown[];
}

/** How a fake streaming job answers. */
interface FakeJob {
	/** What each poll returns, in order. */
	polls?: Poll[];
	/** What polls return once `polls` runs out; `Complete` when unset. */
	idle?: Poll;
	/** The settled result's statements. */
	results?: Statement[] | Promise<Statement[]>;
}

const ok = (output: unknown): Statement => ({
	operationType: ["OPERATION"],
	output,
});

/** A promise and the functions that settle it. */
const deferred = <T>() => {
	const handle = {} as {
		promise: Promise<T>;
		resolve: (value: T) => void;
		reject: (error: unknown) => void;
	};
	handle.promise = new Promise<T>((resolve, reject) => {
		handle.resolve = resolve;
		handle.reject = reject;
	});
	return handle;
};

/** Every pixel the room sent, in order, and whether it streamed. */
let sent: { via: "run" | "stream"; pixel: string }[] = [];
/** Answers a non-streaming pixel the test cares about. */
let answer: (pixel: string) => Statement[] | Promise<Statement[]>;
/** Answers a streaming pixel. */
let answerStream: (pixel: string) => FakeJob;
/** The tool runs in flight, by tool name. */
let toolRuns: Map<string, ReturnType<typeof deferred<string>>>;

/** The run of a tool by name, made the first time either side asks. */
const toolRun = (name: string) => {
	let run = toolRuns.get(name);
	if (!run) {
		run = deferred<string>();
		toolRuns.set(name, run);
	}
	return run;
};

/** The pixels sent that start with `name`. */
const sentNamed = (name: string) =>
	sent.filter((entry) => entry.pixel.startsWith(name));

const MODEL = {
	engine_id: "model-1",
	engine_name: "model-one",
	engine_display_name: "Model One",
} as Engine;

const BASE = {
	visible: true,
	platform_generated: false,
	modelId: "model-1",
	modelType: "OPEN_AI",
	dateCreated: "2026-01-01T00:00:00Z",
	tokens: 0,
	ornaments: {},
	pruneToolsAbove: false,
};

const inputPixel = (
	messageId: string,
	parentMessageId?: string,
	extra: Partial<InputPixelMessage> = {},
) =>
	({
		...BASE,
		io: "INPUT",
		type: "INPUT_TEXT",
		messageId,
		parentMessageId,
		parts: [{ type: "TEXT", text: "hi", uiText: "hi" }],
		...extra,
	}) as InputPixelMessage;

const responsePixel = (
	messageId: string,
	parentMessageId: string,
	parts: ResponsePixelMessage["parts"] = [],
	extra: Partial<ResponsePixelMessage> = {},
) =>
	({
		...BASE,
		io: "OUTPUT",
		messageId,
		parentMessageId,
		parts,
		...extra,
	}) as ResponsePixelMessage;

/** A call to an MCP tool of project `proj-1`, run on its own or after asking. */
const toolCall = (
	name: string,
	execution: "auto" | "ask" = "auto",
	args: Record<string, unknown> = {},
) =>
	({
		type: "TOOL_CALL",
		toolCall: {
			id: `t-${name}`,
			type: "function",
			name,
			arguments: args,
			_tool_found: true,
			original_name: name,
			description: "",
			_meta: {
				SMSS_ENGINE_NAME: "",
				SMSS_ENGINE_ID: "",
				SMSS_ENGINE_TYPE: "",
				SMSS_PROJECT_NAME: "Tools",
				SMSS_PROJECT_ID: "proj-1",
				SMSS_MCP_EXECUTION: execution,
			},
		},
	}) as PixelMessageToolCallPart;

/** The model's reply once the last result completes the set. */
const modelReply = (
	messageId: string,
	tokens: number,
	parts: ResponsePixelMessage["parts"] = [
		{ type: "TEXT", text: "Done", uiText: "Done" },
	],
) => ({
	responseMessage: responsePixel(messageId, "resp-1", parts),
	inputMessage: inputPixel("tool-input", "resp-1", { tokens }),
});

/**
 * A room loaded with one turn: the user's message `in-1` and the response
 * `resp-1`, which holds the given tool calls. Loading it starts the auto ones.
 */
const loadRoom = async (
	parts: ResponsePixelMessage["parts"],
	theme = {} as ThemeMap["playground"],
) => {
	const room = new RoomStore({
		theme,
		roomId: "room-1",
		insightId: "insight-1",
		panelComponents: ROOM_PANEL_COMPONENTS,
	});
	const history = [
		inputPixel("in-1"),
		responsePixel("resp-1", "in-1", parts),
	];
	const loading = answer;
	answer = (pixel) => {
		if (pixel.startsWith("GetPlaygroundMessages")) {
			return [ok(history), ok({ OPTIONS: {} }), ok(true)];
		}
		if (pixel.startsWith("META | MyEngines")) {
			return [ok([MODEL])];
		}
		return loading(pixel);
	};
	await room.initialize({ isNew: true });
	answer = loading;
	const response = room.getMessage("resp-1") as ResponseMessageStore;
	return { room, response };
};

/**
 * The params of an AddPlaygroundToolExecution for a call in `resp-1`, as the
 * backend reads them.
 */
const toolExecParams = (
	room: RoomStore,
	{
		name,
		response,
		status,
		parameters,
	}: {
		name: string;
		response: string;
		status: "success" | "error" | "cancelled";
		parameters: Record<string, unknown>;
	},
) => `engine=["model-1"],
roomId=["room-1"],
parentMessageId=["resp-1"],
toolId=["t-${name}"],
toolName=["${name}"],
toolExecutionResponse=["<encode>${response}</encode>"],
paramValues=[${JSON.stringify(room.chatTools.chatParamValues)}],
mcpToolStatus="${status}",
toolParameterValues=[${JSON.stringify(parameters)}]`;

beforeEach(() => {
	vi.clearAllMocks();
	sent = [];
	toolRuns = new Map();
	answer = () => [];
	answerStream = () => ({ results: [] });
	const jobs = new Map<string, FakeJob>();
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});

	vi.mocked(runPixel).mockImplementation((async (pixel: string) => {
		sent.push({ via: "run", pixel });
		const statements = await answer(pixel);
		return {
			errors: [],
			insightId: "insight-1",
			pixelReturn: statements.map((statement) => ({
				...statement,
				isMeta: false,
				pixelExpression: "",
				pixelId: "",
				timeToRun: 0,
			})),
		};
	}) as never);
	vi.mocked(runPixelAsync).mockImplementation((async (pixel: string) => {
		sent.push({ via: "stream", pixel });
		const jobId = `job-${jobs.size + 1}`;
		jobs.set(jobId, answerStream(pixel));
		return { jobId };
	}) as never);
	vi.mocked(getPixelJobStreaming).mockImplementation((async (
		jobId: string,
	) => {
		const job = jobs.get(jobId);
		return (
			job?.polls?.shift() ??
			job?.idle ?? { status: "Complete", message: [] }
		);
	}) as never);
	vi.mocked(getPixelAsyncResult).mockImplementation((async (
		jobId: string,
	) => ({
		errors: [],
		insightId: "insight-1",
		results: (await jobs.get(jobId)?.results) ?? [],
	})) as never);
	vi.mocked(runMcpTool).mockImplementation(
		(({ name }: { name: string }) => toolRun(name).promise) as never,
	);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

test("a chat turn sends AskPlayground with the turn's params, takes the saved pair, and runs the reply's auto tools", async () => {
	const { room, response } = await loadRoom([
		{ type: "TEXT", text: "Hi", uiText: "Hi" },
	]);
	room.setOptions({ instructions: "Be brief" });
	answerStream = (pixel) =>
		pixel.startsWith("AskPlayground")
			? {
					polls: [
						{
							status: "Complete",
							message: [
								{
									stream_type: "content",
									data: { content: "Let me" },
								},
							],
						},
					],
					results: [
						ok({
							inputMessage: inputPixel("in-2", "resp-1"),
							responseMessage: responsePixel("resp-2", "in-2", [
								{
									type: "TEXT",
									text: "Let me look",
									uiText: "Let me look",
								},
								toolCall("lookup", "auto", { q: "cats" }),
							]),
						}),
					],
				}
			: { results: [] };
	const input = room.createMessage(
		inputPixel("INPUT_PLACEHOLDER", undefined, {
			parts: [
				{ type: "TEXT", text: "find ", uiText: "find " },
				{ type: "TEXT", text: "cats", uiText: "cats" },
				{
					type: "MEDIA",
					mediaInfo: {
						fileName: "a.pdf",
						fileLocation: "/room/a.pdf",
						mediaInputType: "FILE",
					},
				},
			],
		}),
	);

	await response.runMessage(input);

	expect(sentNamed("AskPlayground")).toEqual([
		{
			via: "stream",
			pixel: `AskPlayground(engine=["model-1"],
roomId=["room-1"],
command=["<encode>find cats</encode>"],
context=["<encode>Be brief</encode>"],
media=["/room/a.pdf"],
parentMessageId=["resp-1"],
paramValues=[${JSON.stringify(room.chatTools.chatParamValues)}]);`,
		},
	]);
	// the placeholders take the backend's saved pair
	expect(response.children).toEqual([input]);
	expect(input.id).toBe("in-2");
	const [reply] = input.children as ResponseMessageStore[];
	expect(reply.id).toBe("resp-2");
	expect(reply.isThinking).toBe(false);
	expect(room.tail).toBe(reply);
	// and the reply's auto tool starts
	expect(runMcpTool).toHaveBeenCalledWith(
		{
			project: "proj-1",
			roomId: "room-1",
			name: "lookup",
			paramValues: { q: "cats" },
		},
		"insight-1",
	);
});

test("a turn that fails takes the user's message back out and puts the failure on the room", async () => {
	const { room, response } = await loadRoom([]);
	answerStream = () => ({ polls: [{ status: "Error", message: [] }] });
	const input = room.createMessage(inputPixel("INPUT_PLACEHOLDER"));

	await expect(response.runMessage(input)).rejects.toThrow(
		"Streaming job encountered an error",
	);

	expect(response.children).toEqual([]);
	expect(room.tail).toBe(response);
	expect(room.error?.message).toBe("Streaming job encountered an error");
});

test("a stopped turn replays its params with what streamed, and the backend's hidden messages keep the tail aligned", async () => {
	vi.useFakeTimers();
	const { room, response } = await loadRoom([]);
	answerStream = () => ({
		polls: [
			{
				status: "Streaming",
				message: [
					{ stream_type: "content", data: { content: "Hel" } },
					{ stream_type: "content", data: { content: "lo" } },
				],
			},
		],
		idle: { status: "Streaming", message: [] },
	});
	const hiddenPair = (n: number, parentId: string) => ({
		inputMessage: inputPixel(`hidden-in-${n}`, parentId, {
			visible: false,
		}),
		responseMessage: responsePixel(
			`hidden-out-${n}`,
			`hidden-in-${n}`,
			[],
			{
				visible: false,
			},
		),
	});
	answer = (pixel) => {
		if (pixel.startsWith("StopPixelExecution")) return [ok(true)];
		if (!pixel.startsWith("AskPlayground")) return [];
		return [
			ok({
				inputMessage: inputPixel("in-2", "resp-1"),
				responseMessage: responsePixel("resp-2", "in-2", [
					{ type: "TEXT", text: "Hello", uiText: "Hello" },
				]),
				extraMessages: [
					hiddenPair(1, "resp-2"),
					hiddenPair(2, "hidden-out-1"),
				],
			}),
		];
	};
	const input = room.createMessage(inputPixel("INPUT_PLACEHOLDER"));

	const running = response.runMessage(input);
	await vi.waitFor(() =>
		expect(input.children[0]?.parts).toEqual([
			{ type: "TEXT", text: "Hello", uiText: "Hello" },
		]),
	);
	expect(room.canCancel).toBe(true);

	await room.cancelActiveJob();
	await vi.advanceTimersByTimeAsync(500);
	await running;

	const turnParams = `engine=["model-1"],
roomId=["room-1"],
command=["<encode>hi</encode>"],
context=[],
media=[],
parentMessageId=["resp-1"],
paramValues=[${JSON.stringify(room.chatTools.chatParamValues)}]`;
	expect(
		sent
			.map((entry) => entry.pixel)
			.filter((pixel) =>
				/^(AskPlayground|StopPixelExecution)/.test(pixel),
			),
	).toEqual([
		`AskPlayground(${turnParams});`,
		'StopPixelExecution(id=["job-1"]);',
		`AskPlayground(${turnParams}, responseParts=${JSON.stringify([
			{ type: "TEXT", text: "Hello", uiText: "Hello" },
		])}, hiddenMessage=["<encode>${TURN_CANCELLATION_PROMPT}</encode>"]);`,
	]);
	expect(sentNamed("AskPlayground")[1].via).toBe("run");

	// the visible pair takes the committed ids; the hidden pairs chain below
	const [reply] = input.children;
	expect(input.id).toBe("in-2");
	expect(reply.id).toBe("resp-2");
	expect(reply.children.map((child) => child.id)).toEqual(["hidden-in-1"]);
	expect(room.history.map((message) => message.id)).toEqual([
		"in-1",
		"resp-1",
		"in-2",
		"resp-2",
		"hidden-in-1",
		"hidden-out-1",
		"hidden-in-2",
		"hidden-out-2",
	]);
	expect(room.tail.id).toBe("hidden-out-2");
	expect(room.isCancelling).toBe(false);
	expect(room.canCancel).toBe(false);
});

test("auto tools run five at a time when the theme sets no limit", async () => {
	await loadRoom(
		["a", "b", "c", "d", "e", "f"].map((name) => toolCall(name)),
	);

	expect(vi.mocked(runMcpTool).mock.calls.map(([call]) => call.name)).toEqual(
		["a", "b", "c", "d", "e"],
	);
});

test("the theme's limit caps auto tools, a saved result makes room for the next, and ask tools wait", async () => {
	answer = (pixel) =>
		pixel.startsWith("AddPlaygroundToolExecution") ? [ok("saved")] : [];
	const { room } = await loadRoom(
		[toolCall("a"), toolCall("b"), toolCall("c"), toolCall("d", "ask")],
		{ toolAutoExecutionLimit: 2 } as ThemeMap["playground"],
	);
	const started = () =>
		vi.mocked(runMcpTool).mock.calls.map(([call]) => call.name);
	expect(started()).toEqual(["a", "b"]);
	expect(room.getTool("t-c").status).toBe("INITIAL");

	toolRun("a").resolve("A");
	await vi.waitFor(() => expect(started()).toEqual(["a", "b", "c"]));
	expect(room.getTool("t-d").status).toBe("INITIAL");
});

test("a tool run that throws saves its error for the model", async () => {
	answerStream = () => ({ results: [ok(modelReply("follow-1", 5))] });
	const { room, response } = await loadRoom([
		toolCall("lookup", "auto", { q: "cats" }),
	]);

	toolRun("lookup").reject(new Error("timeout"));
	await vi.waitFor(() => expect(response.children).toHaveLength(1));

	const errorText = `${TOOL_ERROR_PROMPT}\n\nError Details: timeout`;
	expect(sentNamed("AddPlaygroundToolExecution")).toEqual([
		{
			via: "stream",
			pixel: `AddPlaygroundToolExecution(${toolExecParams(room, {
				name: "lookup",
				response: errorText,
				status: "error",
				parameters: { q: "cats" },
			})});`,
		},
	]);
	expect(room.getTool("t-lookup")).toMatchObject({
		status: "ERROR",
		response: errorText,
	});
});
