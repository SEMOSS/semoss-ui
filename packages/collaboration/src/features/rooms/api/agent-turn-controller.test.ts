import type { AgentEvent, AgentRun } from "./agent-run-api";
import * as api from "./agent-run-api";
import { AgentTurnController } from "./agent-turn-controller";
import { uploadRoomFiles } from "./upload-room-files";

vi.mock("./agent-run-api", async (original) => ({
	...(await original<typeof import("./agent-run-api")>()),
	startAgentRun: vi.fn(),
	pollRun: vi.fn(),
	readRun: vi.fn(),
	listRoomRuns: vi.fn(),
	listChildRuns: vi.fn(),
	cancelRun: vi.fn(),
	decideRunAction: vi.fn(),
}));
vi.mock("./upload-room-files", () => ({ uploadRoomFiles: vi.fn() }));

const config = {
	insightId: "insight-1",
	roomId: "room-1",
	agentId: "agent-1",
	engine: "model-1",
	maxTurns: 40,
};
const controllers: AgentTurnController[] = [];
const run = (overrides: Partial<AgentRun> = {}): AgentRun => ({
	runId: "run-1",
	roomId: "room-1",
	status: "RUNNING",
	pendingActions: [],
	...overrides,
});
const action = {
	actionId: "action-1",
	runId: "run-1",
	toolCallId: "tool-1",
	toolName: "send_email",
	toolArgs: { to: "user@example.com" },
};
const messages = [
	{
		messageId: "input-1",
		type: "INPUT_TEXT",
		parts: [{ type: "TEXT", text: "Hello" }],
	},
	{
		messageId: "output-1",
		type: "RESPONSE_TEXT",
		parts: [{ type: "TEXT", text: "Done" }],
	},
];

function controller(): AgentTurnController {
	const value = new AgentTurnController(config);
	controllers.push(value);
	return value;
}
function event(
	sequence: number,
	type: "item.started" | "item.completed",
	text: string,
): Extract<AgentEvent, { type: "item.started" | "item.completed" }> {
	return {
		eventId: `event-${sequence}`,
		runId: "run-1",
		sequence,
		type,
		item: { id: "text-1", kind: "message", text, messageId: "output-1" },
	};
}
function stream(
	snapshot: AgentRun,
	events: AgentEvent[] = [],
	droppedEvents = 0,
) {
	return { run: snapshot, events, droppedEvents };
}
function deferred<T>() {
	let resolve: (value: T) => void = () => undefined;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.resetAllMocks();
	vi.mocked(api.listRoomRuns).mockResolvedValue([]);
	vi.mocked(api.listChildRuns).mockResolvedValue([]);
	vi.mocked(api.startAgentRun).mockResolvedValue(
		run({ status: "SUBMITTED" }),
	);
	vi.mocked(api.readRun).mockResolvedValue(run());
	vi.mocked(api.pollRun).mockImplementation(
		() => new Promise(() => undefined),
	);
	vi.mocked(api.cancelRun).mockResolvedValue(run({ status: "CANCELLED" }));
	vi.mocked(api.decideRunAction).mockResolvedValue(undefined);
	vi.mocked(uploadRoomFiles).mockResolvedValue([]);
});
afterEach(() => {
	for (const instance of controllers.splice(0)) instance.dispose();
	vi.clearAllTimers();
	vi.useRealTimers();
});

it("submits the selected agent, model, attachments, and configured turn budget once", async () => {
	const instance = controller();
	const attachment = new File(["Brief"], "brief.txt");
	vi.mocked(uploadRoomFiles).mockResolvedValue([
		{ fileName: "brief.txt", fileLocation: "/upload/brief.txt" },
	]);
	await instance.send({ text: "Review this", files: [attachment] });
	expect(api.startAgentRun).toHaveBeenCalledExactlyOnceWith("insight-1", {
		roomId: "room-1",
		agentId: "agent-1",
		engine: "model-1",
		command: "Review this",
		media: ["/upload/brief.txt"],
		maxTurns: 40,
		maxReflections: undefined,
	});
	await expect(
		instance.send({ text: "Duplicate", files: [] }),
	).rejects.toThrow("Wait for this run");
	expect(instance.getSnapshot().isRunning).toBe(true);
});

it("renders full text and ordered deltas, ignoring duplicate events", async () => {
	const started = event(1, "item.started", "Hello");
	const updated: AgentEvent = {
		eventId: "event-2",
		runId: "run-1",
		sequence: 2,
		type: "item.updated",
		itemId: "text-1",
		delta: "!",
	};
	vi.mocked(api.pollRun).mockResolvedValueOnce(
		stream(run(), [updated, started, updated]),
	);
	const instance = controller();
	await instance.send({ text: "Hello", files: [] });
	await vi.advanceTimersByTimeAsync(0);
	expect(instance.getSnapshot().messages.at(-1)?.parts).toEqual([
		{ type: "text", text: "Hello!", state: "active", renderKey: "text-1" },
	]);
});

it("drains final events and reconciles durable messages without duplicate text", async () => {
	const terminal = run({
		status: "COMPLETED",
		inputMessageId: "input-1",
		finalOutputMessageId: "output-1",
		finalText: "Done",
	});
	vi.mocked(api.pollRun)
		.mockResolvedValueOnce(
			stream(terminal, [event(1, "item.completed", "Done")]),
		)
		.mockResolvedValueOnce(stream(terminal));
	vi.mocked(api.readRun).mockResolvedValue({ ...terminal, messages });
	const instance = controller();
	await instance.send({ text: "Hello", files: [] });
	await vi.advanceTimersByTimeAsync(0);
	expect(instance.getSnapshot().isRunning).toBe(true);
	await vi.advanceTimersByTimeAsync(100);
	expect(instance.getSnapshot()).toMatchObject({
		isRunning: false,
		phase: "completed",
		settlementVersion: 1,
	});
	expect(
		instance.getSnapshot().messages.map((message) => message.id),
	).toEqual(["input-1", "output-1"]);
	expect(api.readRun).toHaveBeenCalledWith("insight-1", "run-1");
});

it("refreshes each approval batch and sends edited arguments to the owning action", async () => {
	const paused = run({ status: "INPUT_REQUIRED", pendingActions: [action] });
	vi.mocked(api.pollRun).mockResolvedValueOnce(stream(paused));
	vi.mocked(api.readRun).mockResolvedValue(paused);
	const instance = controller();
	await instance.send({ text: "Send a message", files: [] });
	await vi.advanceTimersByTimeAsync(0);
	expect(api.decideRunAction).not.toHaveBeenCalled();
	const approval = instance.getSnapshot().pendingApprovals[0];
	expect(approval).toMatchObject({
		actionId: "action-1",
		runId: "run-1",
		toolId: "tool-1",
	});
	const second = { ...action, actionId: "action-2", toolCallId: "tool-2" };
	vi.mocked(api.pollRun).mockResolvedValueOnce(
		stream(run({ status: "INPUT_REQUIRED", pendingActions: [second] })),
	);
	vi.mocked(api.readRun).mockResolvedValue(
		run({ status: "INPUT_REQUIRED", pendingActions: [second] }),
	);
	await instance.approve(approval, { to: "edited@example.com" });
	await vi.advanceTimersByTimeAsync(0);
	expect(api.decideRunAction).toHaveBeenCalledWith(
		"insight-1",
		action,
		"submit",
		{ to: "edited@example.com" },
	);
	expect(instance.getSnapshot().pendingApprovals[0]?.actionId).toBe(
		"action-2",
	);
	expect(api.readRun).toHaveBeenCalledTimes(2);
});

it("recovers an active run and child approvals when a room is reopened", async () => {
	const child = run({
		runId: "child-1",
		roomId: "child-room",
		status: "INPUT_REQUIRED",
		pendingActions: [{ ...action, runId: "child-1" }],
	});
	vi.mocked(api.listRoomRuns).mockResolvedValue([run()]);
	vi.mocked(api.listChildRuns).mockImplementation(async (_insight, id) =>
		id === "run-1" ? [child] : [],
	);
	vi.mocked(api.readRun).mockImplementation(async (_insight, id) =>
		id === "child-1" ? child : run({ messages }),
	);
	const instance = controller();
	await instance.reconnect();
	expect(api.startAgentRun).not.toHaveBeenCalled();
	expect(instance.getSnapshot()).toMatchObject({
		isRunning: true,
		phase: "awaiting_approval",
	});
	expect(instance.getSnapshot().pendingApprovals[0]?.roomId).toBe(
		"child-room",
	);
	expect(
		instance
			.getSnapshot()
			.messages.flatMap((message) =>
				message.parts.flatMap((part) =>
					part.type === "run" ? [part.run.runId] : [],
				),
			),
	).toEqual(["child-1"]);
	await instance.reject(instance.getSnapshot().pendingApprovals[0]);
	expect(api.decideRunAction).toHaveBeenCalledWith(
		"insight-1",
		child.pendingActions[0],
		"reject",
		undefined,
	);
});

it("responds to RequestUserInput instead of approving it as a normal tool", async () => {
	const question = { ...action, toolName: "RequestUserInput" };
	const paused = run({
		status: "INPUT_REQUIRED",
		pendingActions: [question],
	});
	vi.mocked(api.listRoomRuns).mockResolvedValue([paused]);
	vi.mocked(api.readRun).mockResolvedValue(paused);
	const instance = controller();
	await instance.reconnect();
	await instance.approve(instance.getSnapshot().pendingApprovals[0], {
		answer: "Yes",
	});
	expect(api.decideRunAction).toHaveBeenCalledWith(
		"insight-1",
		question,
		"respond",
		{ answer: "Yes" },
	);
});

it("honors a stop requested while RunAgent submission is in flight", async () => {
	const submitted = deferred<AgentRun>();
	vi.mocked(api.startAgentRun).mockReturnValue(submitted.promise);
	const instance = controller();
	const sending = instance.send({ text: "Hello", files: [] });
	await vi.advanceTimersByTimeAsync(0);
	await instance.cancel();
	submitted.resolve(run({ status: "SUBMITTED" }));
	await sending;
	expect(api.cancelRun).toHaveBeenCalledWith("insight-1", "run-1");
});

it("cancels active descendants as well as their parent", async () => {
	const child = run({ runId: "child-1", roomId: "child-room" });
	vi.mocked(api.listRoomRuns).mockResolvedValue([run()]);
	vi.mocked(api.listChildRuns).mockImplementation(async (_insight, id) =>
		id === "run-1" ? [child] : [],
	);
	const instance = controller();
	await instance.reconnect();
	await instance.cancel();
	expect(vi.mocked(api.cancelRun).mock.calls).toEqual([
		["insight-1", "run-1"],
		["insight-1", "child-1"],
	]);
});

it("keeps a failed run's saved output and reports its failure", async () => {
	const failed = run({
		status: "FAILED",
		errorMessage: "Turn budget exceeded",
		messages,
	});
	vi.mocked(api.listRoomRuns).mockResolvedValue([failed]);
	vi.mocked(api.readRun).mockResolvedValue(failed);
	const instance = controller();
	await instance.reconnect();
	expect(instance.getSnapshot()).toMatchObject({
		isRunning: false,
		phase: "failed",
		turnError: "Turn budget exceeded",
	});
	expect(
		instance
			.getSnapshot()
			.messages.filter((message) =>
				message.parts.some((part) => part.type !== "run"),
			),
	).toHaveLength(2);
});

it("reconciles dropped stream events from durable messages", async () => {
	vi.mocked(api.pollRun).mockResolvedValueOnce(stream(run(), [], 3));
	vi.mocked(api.readRun).mockResolvedValue(run({ messages }));
	const instance = controller();
	await instance.send({ text: "Hello", files: [] });
	await vi.advanceTimersByTimeAsync(0);
	expect(
		instance
			.getSnapshot()
			.messages.filter((message) =>
				message.parts.some((part) => part.type !== "run"),
			)
			.map((message) => message.id),
	).toEqual(["input-1", "output-1"]);
});

it("keeps streaming text that temporarily matches an earlier saved response", async () => {
	const started: AgentEvent = {
		...event(1, "item.started", "Done"),
		item: { id: "text-2", kind: "message", text: "Done" },
	};
	vi.mocked(api.pollRun)
		.mockResolvedValueOnce(stream(run(), [started], 1))
		.mockResolvedValueOnce(
			stream(run(), [
				{
					eventId: "event-2",
					runId: "run-1",
					sequence: 2,
					type: "item.updated",
					itemId: "text-2",
					delta: " with the next step",
				},
			]),
		);
	vi.mocked(api.readRun).mockResolvedValue(run({ messages }));
	const instance = controller();
	await instance.send({ text: "Hello", files: [] });
	await vi.advanceTimersByTimeAsync(500);
	expect(
		instance
			.getSnapshot()
			.messages.at(-1)
			?.parts.filter((part) => part.type !== "run"),
	).toEqual([
		{
			type: "text",
			text: "Done with the next step",
			state: "active",
			renderKey: "text-2",
		},
	]);
});

it("does not restart a run after an ambiguous submission failure", async () => {
	vi.mocked(api.startAgentRun).mockRejectedValueOnce(
		new Error("Network interrupted"),
	);
	const instance = controller();
	await expect(instance.send({ text: "Hello", files: [] })).rejects.toThrow(
		"Network interrupted",
	);
	vi.mocked(api.listRoomRuns).mockResolvedValue([run()]);
	await expect(instance.send({ text: "Hello", files: [] })).rejects.toThrow(
		"Wait for this run",
	);
	expect(api.startAgentRun).toHaveBeenCalledTimes(1);
});

it("does not apply a late poll after local disposal", async () => {
	const response = deferred<Awaited<ReturnType<typeof api.pollRun>>>();
	vi.mocked(api.pollRun).mockReturnValue(response.promise);
	const instance = controller();
	await instance.send({ text: "Hello", files: [] });
	const before = instance.getSnapshot();
	instance.dispose();
	response.resolve(
		stream(run(), [event(1, "item.started", "Late response")]),
	);
	await vi.advanceTimersByTimeAsync(0);
	expect(instance.getSnapshot()).toBe(before);
	expect(api.cancelRun).not.toHaveBeenCalled();
});

it("stops retrying a failed stream and reconnects without starting another run", async () => {
	vi.mocked(api.pollRun).mockRejectedValue(new Error("Offline"));
	const instance = controller();
	await instance.send({ text: "Hello", files: [] });
	await vi.advanceTimersByTimeAsync(15000);
	expect(api.pollRun).toHaveBeenCalledTimes(5);
	expect(instance.getSnapshot()).toMatchObject({
		isRunning: true,
		transportError: new Error("Offline"),
	});
	vi.mocked(api.listRoomRuns).mockResolvedValue([run()]);
	vi.mocked(api.pollRun).mockImplementation(
		() => new Promise(() => undefined),
	);
	await instance.reconnect();
	expect(api.pollRun).toHaveBeenCalledTimes(6);
	expect(api.startAgentRun).toHaveBeenCalledTimes(1);
});

it("retries a failed approval reconciliation without losing the pending action", async () => {
	const paused = run({ status: "INPUT_REQUIRED", pendingActions: [action] });
	vi.mocked(api.pollRun).mockResolvedValue(stream(paused));
	vi.mocked(api.readRun)
		.mockRejectedValueOnce(new Error("Temporary failure"))
		.mockResolvedValue(paused);
	const instance = controller();
	await instance.send({ text: "Hello", files: [] });
	await vi.advanceTimersByTimeAsync(1000);
	expect(api.readRun).toHaveBeenCalledTimes(2);
	expect(instance.getSnapshot().pendingApprovals[0]?.actionId).toBe(
		"action-1",
	);
});

it("retains partial streamed text when a failed run has no persisted response", async () => {
	const failed = run({ status: "FAILED", errorMessage: "Model failed" });
	vi.mocked(api.pollRun)
		.mockResolvedValueOnce(
			stream(failed, [event(1, "item.started", "Partial answer")]),
		)
		.mockResolvedValueOnce(stream(failed));
	vi.mocked(api.readRun).mockResolvedValue({ ...failed, messages: [] });
	const instance = controller();
	await instance.send({ text: "Hello", files: [] });
	await vi.advanceTimersByTimeAsync(100);
	expect(
		instance
			.getSnapshot()
			.messages.at(-1)
			?.parts.filter((part) => part.type !== "run"),
	).toEqual([
		{
			type: "text",
			text: "Partial answer",
			state: "active",
			renderKey: "text-1",
		},
	]);
	expect(instance.getSnapshot()).toMatchObject({
		isRunning: false,
		phase: "failed",
		turnError: "Model failed",
	});
});

it("keeps observing a child that is paused after its parent completes", async () => {
	const parent = run({ status: "COMPLETED", messages });
	const child = run({
		runId: "child-1",
		roomId: "child-room",
		status: "INPUT_REQUIRED",
		pendingActions: [{ ...action, runId: "child-1" }],
	});
	vi.mocked(api.listRoomRuns).mockResolvedValue([parent]);
	vi.mocked(api.listChildRuns).mockImplementation(async (_insight, id) =>
		id === "run-1" ? [child] : [],
	);
	vi.mocked(api.readRun).mockImplementation(async (_insight, id) =>
		id === "child-1" ? child : parent,
	);
	const instance = controller();
	await instance.reconnect();
	expect(instance.getSnapshot()).toMatchObject({
		isRunning: true,
		phase: "awaiting_approval",
	});
	expect(api.pollRun).toHaveBeenCalledOnce();
});

it("reconciles an ambiguous decision before retrying and does not resubmit an accepted action", async () => {
	const paused = run({ status: "INPUT_REQUIRED", pendingActions: [action] });
	vi.mocked(api.listRoomRuns).mockResolvedValue([paused]);
	vi.mocked(api.readRun).mockResolvedValue(paused);
	const instance = controller();
	await instance.reconnect();
	const approval = instance.getSnapshot().pendingApprovals[0];
	vi.mocked(api.decideRunAction).mockRejectedValueOnce(
		new Error("Connection lost after submission"),
	);
	await expect(instance.approve(approval, action.toolArgs)).rejects.toThrow(
		"Connection lost",
	);
	vi.mocked(api.readRun).mockResolvedValue(run({ pendingActions: [] }));
	await instance.approve(approval, action.toolArgs);
	expect(api.decideRunAction).toHaveBeenCalledTimes(1);
	expect(instance.getSnapshot().pendingApprovals).toEqual([]);
});

it("exposes in-flight decisions and refuses a duplicate submission", async () => {
	const paused = run({ status: "INPUT_REQUIRED", pendingActions: [action] });
	vi.mocked(api.listRoomRuns).mockResolvedValue([paused]);
	vi.mocked(api.readRun).mockResolvedValue(paused);
	const instance = controller();
	await instance.reconnect();
	const approval = instance.getSnapshot().pendingApprovals[0];
	const saving = deferred<void>();
	vi.mocked(api.decideRunAction).mockReturnValueOnce(saving.promise);
	const first = instance.approve(approval, action.toolArgs);
	expect(instance.getSnapshot().pendingApprovals[0]?.isDeciding).toBe(true);
	await expect(instance.reject(approval)).rejects.toThrow(
		"already being saved",
	);
	saving.resolve();
	await first;
	expect(api.decideRunAction).toHaveBeenCalledTimes(1);
});

it("restores prior child runs with their parent identity", async () => {
	const previous = run({
		runId: "old-run",
		status: "COMPLETED",
		finalOutputMessageId: "output-1",
	});
	const latest = run({ status: "COMPLETED" });
	const child = run({
		runId: "old-child",
		roomId: "child-room",
		status: "COMPLETED",
		input: "Check the numbers",
		finalText: "Verified",
	});
	vi.mocked(api.listRoomRuns).mockResolvedValue([previous, latest]);
	vi.mocked(api.readRun).mockResolvedValue({ ...latest, messages });
	vi.mocked(api.listChildRuns).mockImplementation(async (_insight, id) =>
		id === "old-run" ? [child] : [],
	);
	const instance = controller();
	await instance.reconnect();
	expect(
		instance
			.getSnapshot()
			.messages.flatMap((message) => message.parts)
			.filter((part) => part.type === "run"),
	).toEqual([
		expect.objectContaining({
			type: "run",
			run: expect.objectContaining({
				runId: "old-child",
				parentRunId: "old-run",
				input: "Check the numbers",
			}),
		}),
	]);
	expect(api.startAgentRun).not.toHaveBeenCalled();
});

it("distinguishes durable cancellation from execution failure", async () => {
	const cancelled = run({ status: "CANCELLED" });
	vi.mocked(api.listRoomRuns).mockResolvedValue([cancelled]);
	vi.mocked(api.readRun).mockResolvedValue(cancelled);
	const instance = controller();
	await instance.reconnect();
	expect(instance.getSnapshot()).toMatchObject({
		phase: "cancelled",
		isRunning: false,
		turnError: null,
	});
});

it("replaces streamed proposals with the arguments actually executed in saved results", async () => {
	const completed = run({ status: "COMPLETED" });
	vi.mocked(api.pollRun).mockResolvedValue(
		stream(completed, [
			{
				eventId: "tool-finished",
				runId: "run-1",
				sequence: 1,
				type: "item.completed",
				item: {
					id: "tool-1",
					kind: "tool",
					name: "lookup",
					arguments: { query: "proposed" },
					status: "COMPLETED",
				},
			},
		]),
	);
	vi.mocked(api.readRun).mockResolvedValue({
		...completed,
		messages: [
			{
				messageId: "output-1",
				type: "RESPONSE_TEXT",
				parts: [
					{
						type: "TOOL_CALL",
						toolCall: {
							id: "tool-1",
							name: "lookup",
							arguments: { query: "proposed" },
						},
					},
					{
						type: "TOOL_RESULT",
						toolResult: {
							toolCallId: "tool-1",
							toolParameterValues: { query: "executed" },
							toolStatus: "success",
							output: "Found",
						},
					},
				],
			},
		],
	});
	const instance = controller();
	await instance.send({ text: "Lookup", files: [] });
	await vi.advanceTimersByTimeAsync(100);
	expect(instance.getSnapshot().toolStates["tool-1"]?.arguments).toEqual({
		query: "executed",
	});
});
