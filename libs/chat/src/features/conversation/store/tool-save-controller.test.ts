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
	TOOL_CANCELLATION_PROMPT,
	TOOL_ERROR_PROMPT,
	TOOL_INTERRUPTED_PROMPT,
	TOOL_OUTPUT_UNREADABLE_PROMPT,
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
const failed = (output: unknown): Statement => ({
	operationType: ["ERROR"],
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

/** Lets every settled promise run its callbacks. */
const flushPromises = async () => {
	for (let i = 0; i < 20; i++) {
		await Promise.resolve();
	}
};

/** Tracks whether a promise has settled, and how. */
const track = (promise: Promise<unknown>) => {
	const state: {
		status: "pending" | "resolved" | "rejected";
		value?: unknown;
	} = { status: "pending" };
	promise.then(
		() => {
			state.status = "resolved";
		},
		(error) => {
			state.status = "rejected";
			state.value = error;
		},
	);
	return state;
};

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

test("a tool result is saved with AddPlaygroundToolExecution and the model's follow-up streams in and runs its own tools", async () => {
	answerStream = (pixel) =>
		pixel.startsWith("AddPlaygroundToolExecution")
			? {
					results: [
						ok(
							modelReply("follow-1", 42, [
								{
									type: "TEXT",
									text: "Found 3",
									uiText: "Found 3",
								},
								toolCall("next"),
							]),
						),
					],
				}
			: { results: [] };
	const { room, response } = await loadRoom([
		toolCall("lookup", "auto", { q: "cats" }),
	]);

	// loading the room starts its auto tool against the room's insight
	expect(runMcpTool).toHaveBeenCalledWith(
		{
			project: "proj-1",
			roomId: "room-1",
			name: "lookup",
			paramValues: { q: "cats" },
		},
		"insight-1",
	);
	expect(room.getTool("t-lookup").status).toBe("LOADING");

	toolRun("lookup").resolve("3 cats");
	await vi.waitFor(() => expect(response.children).toHaveLength(1));
	await flushPromises();

	expect(sentNamed("AddPlaygroundToolExecution")).toEqual([
		{
			via: "stream",
			pixel: `AddPlaygroundToolExecution(${toolExecParams(room, {
				name: "lookup",
				response: "3 cats",
				status: "success",
				parameters: { q: "cats" },
			})});`,
		},
	]);
	expect(room.getTool("t-lookup")).toMatchObject({
		status: "SUCCESS",
		response: "3 cats",
	});

	// the follow-up joins the tree under the response and becomes the tail
	const [followUp] = response.children as ResponseMessageStore[];
	expect(followUp.id).toBe("follow-1");
	expect(followUp.isThinking).toBe(false);
	expect(room.tail).toBe(followUp);
	expect(response.toolResponseMessage).toBeNull();
	// the server's cumulative input tokens stand in on the response
	expect(response.tokens).toBe(42);

	// the follow-up continues tool execution with its own calls
	expect(runMcpTool).toHaveBeenLastCalledWith(
		expect.objectContaining({ name: "next" }),
		"insight-1",
	);
	// the tool phase ending refreshes the room's options, once
	expect(sentNamed("GetRoomOptions")).toHaveLength(1);
});

test("results that land while a write is in flight go out as one batch, and only the batch that completes the set streams the reply", async () => {
	const firstWrite = deferred<Statement[]>();
	answer = (pixel) =>
		pixel.startsWith("AddPlaygroundToolExecution")
			? firstWrite.promise
			: [];
	answerStream = () => ({
		results: [ok("2 of 3 saved"), ok(modelReply("follow-1", 7))],
	});
	const { room, response } = await loadRoom([
		toolCall("a"),
		toolCall("b"),
		toolCall("c"),
	]);
	expect(runMcpTool).toHaveBeenCalledTimes(3);

	toolRun("a").resolve("A");
	await vi.waitFor(() =>
		expect(sentNamed("AddPlaygroundToolExecution")).toHaveLength(1),
	);
	const params = (name: string, result: string) =>
		toolExecParams(room, {
			name,
			response: result,
			status: "success",
			parameters: {},
		});

	// b and c are still running, so a's write is a plain, non-streaming persist
	expect(sentNamed("AddPlaygroundToolExecution")).toEqual([
		{
			via: "run",
			pixel: `AddPlaygroundToolExecution(${params("a", "A")});`,
		},
	]);
	expect(runPixel).toHaveBeenCalledWith(
		`AddPlaygroundToolExecution(${params("a", "A")});`,
		"insight-1",
	);
	expect(response.children).toHaveLength(0);
	expect(response.toolResponseMessage).toBeNull();
	expect(room.isLoading).toBe(false);

	// b and c finish while a's write is out: they wait for it
	toolRun("b").resolve("B");
	toolRun("c").resolve("C");
	await flushPromises();
	expect(sentNamed("AddPlaygroundToolExecution")).toHaveLength(1);
	expect(sentNamed("GetRoomOptions")).toHaveLength(0);

	firstWrite.resolve([ok("1 of 3 saved")]);
	await vi.waitFor(() =>
		expect(response.children.map((child) => child.id)).toEqual([
			"follow-1",
		]),
	);

	// one pixel, one statement per result, in the order they landed
	expect(sentNamed("AddPlaygroundToolExecution")).toEqual([
		{
			via: "run",
			pixel: `AddPlaygroundToolExecution(${params("a", "A")});`,
		},
		{
			via: "stream",
			pixel: `AddPlaygroundToolExecution(${params("b", "B")});\nAddPlaygroundToolExecution(${params("c", "C")});`,
		},
	]);
	expect(room.tail.id).toBe("follow-1");
	expect(response.tokens).toBe(7);
	expect(sentNamed("GetRoomOptions")).toHaveLength(1);
});

test("an error or a cancellation goes to the model wrapped in its guidance", async () => {
	answer = () => [ok("saved")];
	answerStream = () => ({ results: [ok(modelReply("follow-1", 1))] });
	const { room, response } = await loadRoom([
		toolCall("send", "ask", { to: "Ann" }),
		toolCall("delete", "ask"),
	]);
	// ask tools wait for the user
	expect(runMcpTool).not.toHaveBeenCalled();

	await response.saveToolExecution(
		room.getTool("t-send"),
		"mailbox full",
		"error",
		{ to: "Ann" },
	);
	await response.saveToolExecution(
		room.getTool("t-delete"),
		"",
		"cancelled",
		{},
	);
	await vi.waitFor(() => expect(response.children).toHaveLength(1));

	const errorText = `${TOOL_ERROR_PROMPT}\n\nError Details: mailbox full`;
	expect(sentNamed("AddPlaygroundToolExecution")).toEqual([
		{
			via: "run",
			pixel: `AddPlaygroundToolExecution(${toolExecParams(room, {
				name: "send",
				response: errorText,
				status: "error",
				parameters: { to: "Ann" },
			})});`,
		},
		{
			via: "stream",
			pixel: `AddPlaygroundToolExecution(${toolExecParams(room, {
				name: "delete",
				response: TOOL_CANCELLATION_PROMPT,
				status: "cancelled",
				parameters: {},
			})});`,
		},
	]);
	expect(room.getTool("t-send")).toMatchObject({
		status: "ERROR",
		response: errorText,
	});
	expect(room.getTool("t-delete").status).toBe("CANCELLED");

	// a call that already ended is not saved again
	await response.saveToolExecution(
		room.getTool("t-send"),
		"late",
		"success",
		{},
	);
	expect(sentNamed("AddPlaygroundToolExecution")).toHaveLength(2);
});

test("a commit that fails is re-sent as unreadable output, and the save resolves once that lands", async () => {
	const jobs: FakeJob[] = [
		{ results: [failed("commit failed")] },
		{ results: [ok(modelReply("follow-1", 3))] },
	];
	answerStream = () => jobs.shift() ?? { results: [] };
	const { room, response } = await loadRoom([
		toolCall("draft", "ask", { to: "Ann" }),
	]);
	const tool = room.getTool("t-draft");

	const saving = track(
		response.saveToolExecution(tool, "drafted", "success", { to: "Ann" }),
	);
	// marked up front, before any write lands
	expect(tool.status).toBe("SUCCESS");

	await vi.waitFor(() => expect(saving.status).toBe("resolved"));

	const retried = `${TOOL_OUTPUT_UNREADABLE_PROMPT}\n\nError Details: Failed to save tool response: commit failed`;
	expect(sentNamed("AddPlaygroundToolExecution")).toEqual([
		{
			via: "stream",
			pixel: `AddPlaygroundToolExecution(${toolExecParams(room, {
				name: "draft",
				response: "drafted",
				status: "success",
				parameters: { to: "Ann" },
			})});`,
		},
		{
			via: "stream",
			pixel: `AddPlaygroundToolExecution(${toolExecParams(room, {
				name: "draft",
				response: retried,
				status: "error",
				parameters: { to: "Ann" },
			})});`,
		},
	]);
	expect(tool).toMatchObject({ status: "ERROR", response: retried });
	// the retry reuses the placeholder the first attempt made
	expect(response.children.map((child) => child.id)).toEqual(["follow-1"]);
	expect(response.toolResponseMessage).toBeNull();
});

test("a result whose re-sent error fails too is marked ERROR, and its save rejects with that failure", async () => {
	const jobs: FakeJob[] = [
		// the whole call fails, with no per-statement detail
		{ polls: [{ status: "Error", message: [] }] },
		{ results: [failed("still broken")] },
	];
	answerStream = () => jobs.shift() ?? { results: [] };
	const { room, response } = await loadRoom([toolCall("draft", "ask")]);
	const tool = room.getTool("t-draft");

	const saving = track(
		response.saveToolExecution(tool, "drafted", "success", {}),
	);
	await vi.waitFor(() => expect(saving.status).toBe("rejected"));
	await flushPromises();

	expect(saving.value).toBe("still broken");
	const retried = `${TOOL_OUTPUT_UNREADABLE_PROMPT}\n\nError Details: Failed to save tool response: Error: Streaming job encountered an error`;
	expect(
		sentNamed("AddPlaygroundToolExecution").map((entry) => entry.pixel),
	).toEqual([
		`AddPlaygroundToolExecution(${toolExecParams(room, {
			name: "draft",
			response: "drafted",
			status: "success",
			parameters: {},
		})});`,
		`AddPlaygroundToolExecution(${toolExecParams(room, {
			name: "draft",
			response: retried,
			status: "error",
			parameters: {},
		})});`,
	]);
	expect(tool).toMatchObject({ status: "ERROR", response: retried });
	// the given-up save takes its empty follow-up out of the tree, and the
	// failure is on the room
	expect(response.toolResponseMessage).toBeNull();
	expect(response.children).toEqual([]);
	expect(room.tail).toBe(response);
	expect(room.error?.message).toBe("still broken");
});

test("stopping with tools outstanding commits the queued results and the pending tools, as CANCELLED, in one pixel", async () => {
	const firstWrite = deferred<Statement[]>();
	answer = (pixel) => {
		if (!pixel.startsWith("AddPlaygroundToolExecution")) return [];
		if (sentNamed("AddPlaygroundToolExecution").length === 1) {
			return firstWrite.promise;
		}
		return [
			ok("saved"),
			ok("saved"),
			ok({
				inputMessage: inputPixel("tool-input", "resp-1"),
				responseMessage: responsePixel("follow-1", "resp-1"),
				extraMessages: [
					{
						inputMessage: inputPixel("hidden-in", "follow-1", {
							visible: false,
						}),
						responseMessage: responsePixel(
							"hidden-out",
							"hidden-in",
							[],
							{
								visible: false,
							},
						),
					},
				],
			}),
		];
	};
	const { room, response } = await loadRoom([
		toolCall("a"),
		toolCall("b"),
		toolCall("ask_first", "ask"),
		toolCall("slow"),
	]);

	// a's write goes out and b's result queues behind it
	toolRun("a").resolve("A");
	await vi.waitFor(() =>
		expect(sentNamed("AddPlaygroundToolExecution")).toHaveLength(1),
	);
	const saving = track(
		response.saveToolExecution(room.getTool("t-b"), "B", "success", {}),
	);
	expect(room.canCancel).toBe(true);

	const stopping = room.cancelActiveJob();
	expect(room.isCancelling).toBe(true);
	// the stop waits for the write in flight
	await flushPromises();
	expect(sentNamed("AddPlaygroundToolExecution")).toHaveLength(1);
	firstWrite.resolve([ok("1 of 4 saved")]);
	await stopping;

	const commit = sentNamed("AddPlaygroundToolExecution")[1];
	expect(commit.via).toBe("run");
	expect(commit.pixel).toBe(
		[
			`AddPlaygroundToolExecution(${toolExecParams(room, {
				name: "b",
				response: "B",
				status: "success",
				parameters: {},
			})});`,
			`AddPlaygroundToolExecution(${toolExecParams(room, {
				name: "ask_first",
				response: TOOL_INTERRUPTED_PROMPT,
				status: "cancelled",
				parameters: {},
			})});`,
			`AddPlaygroundToolExecution(${toolExecParams(room, {
				name: "slow",
				response: TOOL_INTERRUPTED_PROMPT,
				status: "cancelled",
				parameters: {},
			})}, responseParts=[], hiddenMessage=["<encode>${TURN_CANCELLATION_PROMPT}</encode>"]);`,
		].join("\n"),
	);
	expect(saving.status).toBe("resolved");
	for (const id of ["t-ask_first", "t-slow"]) {
		expect(room.getTool(id)).toMatchObject({
			status: "CANCELLED",
			response: TOOL_INTERRUPTED_PROMPT,
		});
	}

	// the empty follow-up and the hidden pair join the tree, so the tail is
	// where the backend's history ends
	const [followUp] = response.children;
	expect(followUp.id).toBe("follow-1");
	expect(followUp.children.map((child) => child.id)).toEqual(["hidden-in"]);
	expect(followUp.children[0].children.map((child) => child.id)).toEqual([
		"hidden-out",
	]);
	expect(room.tail.id).toBe("hidden-out");
	expect(response.toolResponseMessage).toBeNull();
	expect(room.isCancelling).toBe(false);
	expect(room.canCancel).toBe(false);

	// a late result is dropped, and stopping again commits nothing
	toolRun("slow").resolve("too late");
	await room.cancelActiveJob();
	await flushPromises();
	expect(sentNamed("AddPlaygroundToolExecution")).toHaveLength(2);
	expect(room.getTool("t-slow").response).toBe(TOOL_INTERRUPTED_PROMPT);
});

test("stopping the follow-up mid-stream replays only the finalizing result, with what streamed and the hidden note", async () => {
	vi.useFakeTimers();
	const firstWrite = deferred<Statement[]>();
	answer = (pixel) => {
		if (pixel.startsWith("StopPixelExecution")) return [ok(true)];
		if (!pixel.startsWith("AddPlaygroundToolExecution")) return [];
		if (sentNamed("AddPlaygroundToolExecution").length === 1) {
			return firstWrite.promise;
		}
		return [
			ok({
				inputMessage: inputPixel("tool-input", "resp-1", {
					tokens: 77,
				}),
				responseMessage: responsePixel("follow-1", "resp-1", [
					{ type: "TEXT", text: "Partial", uiText: "Partial" },
				]),
				extraMessages: [
					{
						inputMessage: inputPixel("hidden-in", "follow-1", {
							visible: false,
						}),
						responseMessage: responsePixel(
							"hidden-out",
							"hidden-in",
							[],
							{
								visible: false,
							},
						),
					},
				],
			}),
		];
	};
	answerStream = () => ({
		polls: [
			{
				status: "Streaming",
				message: [
					{ stream_type: "content", data: { content: "Partial" } },
				],
			},
		],
		idle: { status: "Streaming", message: [] },
	});
	const { room, response } = await loadRoom([
		toolCall("a"),
		toolCall("b"),
		toolCall("c"),
	]);
	toolRun("a").resolve("A");
	await vi.waitFor(() =>
		expect(sentNamed("AddPlaygroundToolExecution")).toHaveLength(1),
	);
	const savingB = track(
		response.saveToolExecution(room.getTool("t-b"), "B", "success", {}),
	);
	toolRun("c").resolve("C");
	await flushPromises();
	firstWrite.resolve([ok("1 of 3 saved")]);

	// the final batch [b, c] streams its reply into a placeholder
	await vi.waitFor(() =>
		expect(response.toolResponseMessage?.parts).toEqual([
			{ type: "TEXT", text: "Partial", uiText: "Partial" },
		]),
	);
	const placeholder = response.toolResponseMessage;
	expect(placeholder.isThinking).toBe(true);
	expect(room.canCancel).toBe(true);

	await room.cancelActiveJob();
	await vi.advanceTimersByTimeAsync(500);

	const [streamed] = sent.filter((entry) => entry.via === "stream");
	expect(
		sent.filter((entry) => entry.pixel.startsWith("StopPixelExecution")),
	).toEqual([{ via: "run", pixel: 'StopPixelExecution(id=["job-1"]);' }]);
	// the backend committed b; only c, whose statement was aborted, replays
	const replay = sentNamed("AddPlaygroundToolExecution")[2];
	expect(replay).toEqual({
		via: "run",
		pixel: `AddPlaygroundToolExecution(${toolExecParams(room, {
			name: "c",
			response: "C",
			status: "success",
			parameters: {},
		})}, responseParts=${JSON.stringify([
			{ type: "TEXT", text: "Partial", uiText: "Partial" },
		])}, hiddenMessage=["<encode>${TURN_CANCELLATION_PROMPT}</encode>"]);`,
	});
	expect(streamed.pixel).toContain('toolId=["t-b"]');
	expect(streamed.pixel).toContain('toolId=["t-c"]');

	expect(placeholder.id).toBe("follow-1");
	expect(placeholder.isThinking).toBe(false);
	expect(response.tokens).toBe(77);
	expect(response.toolResponseMessage).toBeNull();
	expect(response.children).toEqual([placeholder]);
	expect(placeholder.children.map((child) => child.id)).toEqual([
		"hidden-in",
	]);
	expect(room.tail.id).toBe("hidden-out");
	expect(room.isCancelling).toBe(false);
	// the final batch's saves settle with the stop's commit
	await flushPromises();
	expect(savingB.status).toBe("resolved");
});
