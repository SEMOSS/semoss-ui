import { getAgent } from "@/features/agents/api/get-agent";
import { getRoomMessages } from "@/features/messages/api/get-room-messages";
import { resolveThreadModel } from "@/features/thread-assistant/api/thread-model";
import {
	readThreadCommand,
	setThreadAgent,
} from "@/features/thread-assistant/thread-context";
import * as runApi from "./api/agent-run-api";
import { uploadRoomFiles } from "./api/upload-room-files";
import {
	createRoomSession,
	getRoomSession,
	type RoomSession,
} from "./room-session";
import type { RoomSource } from "./source-import/room-source";

const transport = vi.hoisted(() => ({
	nextInsight: 0,
	nextRoom: 0,
	run: vi.fn(),
	options: new Map<string, Record<string, unknown>>(),
	failOptions: false,
}));
vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	Insight: class {
		insightId = `isolated-${++transport.nextInsight}`;
		isReady = false;
		isInitialized = false;
		actions = {
			run: (statement: string) =>
				transport.run(this.insightId, statement),
		};
		async initialize(options: unknown) {
			expect(options).toEqual({ disableRoom: true });
			this.isReady = true;
			this.isInitialized = true;
		}
		async destroy() {
			this.isReady = false;
		}
	},
}));
vi.mock("@/features/agents/api/get-agent", () => ({ getAgent: vi.fn() }));
vi.mock("@/features/thread-assistant/api/thread-model", () => ({
	resolveThreadModel: vi.fn(),
}));
vi.mock("@/features/messages/api/get-room-messages", () => ({
	getRoomMessages: vi.fn(),
}));
vi.mock("./api/upload-room-files", () => ({ uploadRoomFiles: vi.fn() }));
vi.mock("./api/agent-run-api", async (original) => ({
	...(await original<typeof import("./api/agent-run-api")>()),
	listRoomRuns: vi.fn(),
	listChildRuns: vi.fn(),
	readRun: vi.fn(),
	startAgentRun: vi.fn(),
	pollRun: vi.fn(),
	cancelRun: vi.fn(),
	decideRunAction: vi.fn(),
}));

const instances: RoomSession[] = [];
const source: RoomSource = {
	version: 1,
	threadId: "source-one",
	title: "Project email",
	channel: "email",
	kind: "brain",
	file: {
		fileName: "Project-email.md",
		fileLocation: "room-files/Project-email.md",
	},
	messages: [
		{
			id: "mail-one",
			at: "2026-10-07T09:00:00Z",
			fromAddress: "sender@example.com",
		},
	],
};
function own(session: RoomSession): RoomSession {
	instances.push(session);
	return session;
}
function draft(): RoomSession {
	return own(createRoomSession(crypto.randomUUID()));
}
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
	let resolve: (value: T) => void = () => undefined;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

beforeEach(() => {
	vi.resetAllMocks();
	localStorage.clear();
	setThreadAgent(null);
	transport.options.clear();
	transport.failOptions = false;
	transport.run.mockImplementation(
		async (_insightId: string, statement: string) => {
			const roomId = JSON.parse(
				statement.match(/roomId=(\[[^\]]*\])/)?.[1] ?? '[""]',
			)[0] as string;
			let output: unknown = true;
			if (statement.startsWith("CreatePlaygroundRoom"))
				output = { roomId: `created-${++transport.nextRoom}` };
			if (statement.startsWith("GetRoomOptions"))
				output = {
					ROOM_NAME: "Saved room",
					OPTIONS: transport.options.get(roomId) ?? {},
				};
			if (statement.startsWith("UpdateRoomOptions")) {
				if (transport.failOptions) {
					transport.failOptions = false;
					throw new Error("Settings unavailable");
				}
				transport.options.set(
					roomId,
					JSON.parse(
						statement.slice(
							statement.indexOf("roomOptions=") + 12,
							-2,
						),
					)[0],
				);
			}
			return { pixelReturn: [{ output, operationType: [] }] };
		},
	);
	vi.mocked(resolveThreadModel).mockImplementation(async (_actions, ids) => ({
		engine_id: ids.find(Boolean) ?? "model-one",
		engine_name: "Test model",
	}));
	vi.mocked(getAgent).mockImplementation(async (_actions, id) => ({
		workspace_id: id,
		name: "Researcher",
		description: "",
		system_prompt: "Research",
		mcp: [],
		skills: [],
		prompts: [],
	}));
	vi.mocked(getRoomMessages).mockResolvedValue([]);
	vi.mocked(runApi.listRoomRuns).mockResolvedValue([]);
	vi.mocked(runApi.listChildRuns).mockResolvedValue([]);
	vi.mocked(runApi.startAgentRun).mockImplementation(
		async (_insightId, request) => ({
			runId: `run-${request.roomId}`,
			roomId: request.roomId,
			status: "RUNNING",
			pendingActions: [],
		}),
	);
	vi.mocked(runApi.pollRun).mockImplementation(
		() => new Promise(() => undefined),
	);
	vi.mocked(uploadRoomFiles).mockResolvedValue([]);
});
afterEach(() => {
	for (const session of instances.splice(0)) session.dispose();
	setThreadAgent(null);
});

it("loads the actual room and its queued source without allocating or sending", async () => {
	transport.options.set("saved-one", { modelId: "model-one", source });
	const session = own(getRoomSession(crypto.randomUUID(), "saved-one"));
	await Promise.all([session.initialize(), session.initialize()]);
	expect(session.getSnapshot()).toMatchObject({
		roomId: "saved-one",
		isReady: true,
		source,
		contextFiles: [source.file],
	});
	expect(
		transport.run.mock.calls.filter(([, statement]) =>
			statement.startsWith("SetRoomForInsight"),
		),
	).toHaveLength(1);
	expect(
		transport.run.mock.calls.some(([, statement]) =>
			statement.startsWith("CreatePlaygroundRoom"),
		),
	).toBe(false);
	expect(runApi.startAgentRun).not.toHaveBeenCalled();
	expect(getRoomMessages).toHaveBeenCalledWith(
		session.insight.actions,
		"saved-one",
	);
});

it("allocates once and preserves settings, draft, and files across partial creation failure", async () => {
	const session = draft();
	await session.initialize();
	const settings = {
		modelId: "model-two",
		agentId: "researcher",
		instructions: "Keep my wording",
		temperature: 0.4,
		mcp: [],
	};
	await session.saveSettings("Research", settings);
	const file = new File(["notes"], "notes.txt");
	session.setComposerDraft({
		document: null,
		text: "Investigate this",
		files: [file],
	});
	transport.failOptions = true;
	const first = session.create("Research");
	expect(session.create("Research")).toBe(first);
	await expect(first).rejects.toThrow("Settings unavailable");
	const roomId = session.getSnapshot().roomId;
	expect(roomId).toBeTruthy();
	expect(getRoomSession(session.scope, roomId)).toBe(session);
	await expect(session.create("Research")).resolves.toBe(roomId);
	expect(
		transport.run.mock.calls.filter(([, statement]) =>
			statement.startsWith("CreatePlaygroundRoom"),
		),
	).toHaveLength(1);
	expect(transport.options.get(roomId)).toMatchObject({
		modelId: settings.modelId,
		instructions: settings.instructions,
		temperature: settings.temperature,
		workspace: { workspace_id: "researcher" },
	});
	expect(session.getSnapshot()).toMatchObject({
		settings,
		composerDraft: { text: "Investigate this", files: [file] },
		isCreationUncertain: false,
	});
	await session.send({ text: "Investigate this", files: [file] });
	expect(uploadRoomFiles).toHaveBeenCalledWith(session.insight.insightId, [
		file,
	]);
	expect(runApi.startAgentRun).toHaveBeenCalledWith(
		session.insight.insightId,
		expect.objectContaining({
			roomId,
			agentId: "researcher",
			engine: "model-two",
		}),
	);
	expect(session.getSnapshot().composerDraft).toEqual({
		document: null,
		text: "",
		files: [],
	});
});

it("keeps the model's display name through allocation and on saved rooms", async () => {
	localStorage.setItem(
		"collaboration.lastModel",
		JSON.stringify({ modelId: "model-two", modelName: "Last model" }),
	);
	const session = draft();
	await session.initialize();
	expect(session.getSnapshot()).toMatchObject({
		modelId: "model-two",
		modelName: "Test model",
	});
	await session.create("Research");
	expect(session.getSnapshot()).toMatchObject({
		modelId: "model-two",
		modelName: "Test model",
	});

	transport.options.set("saved-one", { modelId: "model-one" });
	const saved = own(getRoomSession(crypto.randomUUID(), "saved-one"));
	expect(saved.getSnapshot().modelName).toBe("");
	await saved.initialize();
	expect(saved.getSnapshot()).toMatchObject({
		modelId: "model-one",
		modelName: "Test model",
	});
});

it("keeps a pending upload and agent run bound to its room while another room initializes", async () => {
	const first = draft();
	await first.create("First");
	await first.setSource(source);
	const pending = deferred<Awaited<ReturnType<typeof uploadRoomFiles>>>();
	vi.mocked(uploadRoomFiles).mockReturnValueOnce(pending.promise);
	const send = first.send({ text: "Summarize", files: [] });
	const second = draft();
	await second.create("Second");
	expect(second.insight.insightId).not.toBe(first.insight.insightId);
	pending.resolve([]);
	await send;
	expect(runApi.startAgentRun).toHaveBeenCalledExactlyOnceWith(
		first.insight.insightId,
		expect.objectContaining({
			roomId: first.getSnapshot().roomId,
			media: [source.file.fileLocation],
		}),
	);
	const request = vi.mocked(runApi.startAgentRun).mock.calls[0][1];
	expect(readThreadCommand(request.command)?.context.context).toMatchObject({
		sourceFile: source.file.fileLocation,
		messages: source.messages,
	});
	expect(first.getSnapshot().contextFiles).toEqual([]);
	expect(second.getSnapshot().turn.messages).toEqual([]);
});

it("retains the draft and source receipt until a failed submission is reconciled", async () => {
	const session = draft();
	await session.create("Imported");
	await session.setSource(source);
	session.setComposerDraft({ document: null, text: "Review", files: [] });
	vi.mocked(runApi.startAgentRun).mockRejectedValueOnce(
		new Error("Connection lost"),
	);
	await expect(session.send({ text: "Review", files: [] })).rejects.toThrow(
		"Connection lost",
	);
	expect(session.getSnapshot()).toMatchObject({
		hasUnconfirmedSubmission: true,
		contextFiles: [source.file],
		composerDraft: { text: "Review" },
	});
	await expect(session.send({ text: "Review", files: [] })).rejects.toThrow(
		"Wait for",
	);
	await session.reconnect();
	expect(session.getSnapshot()).toMatchObject({
		hasUnconfirmedSubmission: false,
		contextFiles: [source.file],
		composerDraft: { text: "Review" },
	});
	await session.send({ text: "Review", files: [] });
	expect(runApi.startAgentRun).toHaveBeenLastCalledWith(
		session.insight.insightId,
		expect.objectContaining({ media: [source.file.fileLocation] }),
	);
});

it("does not queue source context again when the room already has a user message", async () => {
	transport.options.set("used-room", { modelId: "model-one", source });
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "user-one",
			type: "INPUT_TEXT",
			parts: [{ type: "TEXT", text: "Already sent" }],
		},
	]);
	const session = own(getRoomSession(crypto.randomUUID(), "used-room"));
	await session.initialize();
	expect(session.getSnapshot().contextFiles).toEqual([]);
});

it("serializes settings and source metadata writes without losing either", async () => {
	const session = draft();
	await session.create("Imported");
	await Promise.all([
		session.setSource(source),
		session.saveSettings("Imported", {
			...session.getSnapshot().settings,
			instructions: "Concise answers",
		}),
	]);
	expect(transport.options.get(session.getSnapshot().roomId)).toMatchObject({
		source,
		instructions: "Concise answers",
		overrideSystemPrompt: false,
	});
});

it("preserves the draft and source file when cancelled before the run is submitted", async () => {
	const session = draft();
	await session.create("Imported");
	await session.setSource(source);
	const file = new File(["notes"], "notes.txt");
	session.setComposerDraft({ document: null, text: "Review", files: [file] });
	const pending = deferred<Awaited<ReturnType<typeof uploadRoomFiles>>>();
	vi.mocked(uploadRoomFiles).mockReturnValueOnce(pending.promise);
	const send = session.send({ text: "Review", files: [file] });
	await session.cancel();
	pending.resolve([]);
	await send;
	expect(runApi.startAgentRun).not.toHaveBeenCalled();
	expect(session.getSnapshot()).toMatchObject({
		composerDraft: { text: "Review", files: [file] },
		contextFiles: [source.file],
		hasUnconfirmedSubmission: false,
		turn: { phase: "cancelled", isRunning: false },
	});
});

it("keeps later draft edits when reconnect confirms an earlier uncertain request", async () => {
	const session = draft();
	await session.create("Imported");
	await session.setSource(source);
	session.setComposerDraft({
		document: null,
		text: "First request",
		files: [],
	});
	vi.mocked(runApi.startAgentRun).mockRejectedValueOnce(
		new Error("Disconnected"),
	);
	await expect(
		session.send({ text: "First request", files: [] }),
	).rejects.toThrow("Disconnected");
	const submitted = vi.mocked(runApi.startAgentRun).mock.calls[0][1].command;
	session.setComposerDraft({
		document: null,
		text: "My next request",
		files: [],
	});
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "accepted-one",
			type: "INPUT_TEXT",
			parts: [{ type: "TEXT", text: submitted }],
		},
	]);
	await session.reconnect();
	expect(session.getSnapshot()).toMatchObject({
		hasUnconfirmedSubmission: false,
		contextFiles: [],
		composerDraft: { text: "My next request" },
		submissionNotice: "Your last message was received.",
	});
});

it("does not mistake an earlier identical message for a newly uncertain submission", async () => {
	const session = draft();
	await session.create("Repeated requests");
	session.setComposerDraft({
		document: null,
		text: "Check again",
		files: [],
	});
	vi.mocked(runApi.startAgentRun).mockRejectedValueOnce(
		new Error("Disconnected"),
	);
	await expect(
		session.send({ text: "Check again", files: [] }),
	).rejects.toThrow("Disconnected");
	const previousCommand = vi.mocked(runApi.startAgentRun).mock.calls[0][1]
		.command;
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "previous-request",
			type: "INPUT_TEXT",
			parts: [{ type: "TEXT", text: previousCommand }],
		},
	]);
	await session.reconnect();
	session.setComposerDraft({
		document: null,
		text: "Check again",
		files: [],
	});
	vi.mocked(runApi.startAgentRun).mockRejectedValueOnce(
		new Error("Disconnected again"),
	);
	await expect(
		session.send({ text: "Check again", files: [] }),
	).rejects.toThrow("Disconnected again");
	expect(vi.mocked(runApi.startAgentRun).mock.calls[1][1].command).not.toBe(
		previousCommand,
	);
	await session.reconnect();
	expect(session.getSnapshot()).toMatchObject({
		hasUnconfirmedSubmission: false,
		composerDraft: { text: "Check again" },
		submissionNotice:
			"Your last message was not found. You can try sending it again.",
	});
});
