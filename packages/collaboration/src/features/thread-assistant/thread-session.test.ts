import {
	downloadStagedAttachment,
	stageMailAttachment,
} from "@/features/connectors/api/microsoft";
import { getRoomMessages } from "@/features/messages/api/get-room-messages";
import * as runApi from "@/features/rooms/api/agent-run-api";
import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import {
	bindThreadRoom,
	findThreadRoom,
	prepareThreadRoom,
} from "./api/thread-room";
import {
	readThreadCommand,
	THREAD_ASSISTANT_INSTRUCTIONS,
} from "./thread-context";
import { ThreadSession } from "./thread-session";

vi.mock("@semoss/sdk", async (original) => {
	let nextInsight = 0;
	return {
		...(await original<typeof import("@semoss/sdk")>()),
		Insight: class {
			insightId = `isolated-${++nextInsight}`;
			isReady = false;
			actions = { run: vi.fn() };
			async initialize() {
				this.isReady = true;
			}
			async destroy() {
				this.isReady = false;
			}
		},
	};
});
vi.mock("./api/thread-room", async (original) => ({
	...(await original<typeof import("./api/thread-room")>()),
	findThreadRoom: vi.fn(),
	bindThreadRoom: vi.fn(),
	prepareThreadRoom: vi.fn(),
}));
vi.mock("@/features/connectors/api/microsoft", () => ({
	stageMailAttachment: vi.fn(),
	downloadStagedAttachment: vi.fn(),
}));
vi.mock("@/features/messages/api/get-room-messages", () => ({
	getRoomMessages: vi.fn(),
}));
vi.mock("@/features/rooms/api/upload-room-files", () => ({
	uploadRoomFiles: vi.fn(),
}));
vi.mock("@/features/rooms/api/agent-run-api", async (original) => ({
	...(await original<typeof import("@/features/rooms/api/agent-run-api")>()),
	listRoomRuns: vi.fn(),
	listChildRuns: vi.fn(),
	readRun: vi.fn(),
	startAgentRun: vi.fn(),
	pollRun: vi.fn(),
}));

const instances: ThreadSession[] = [];
const context = {
	threadId: "t1",
	contextRevision: "r1",
	contextText: "Included email only",
};
const metadata = {
	version: 1 as const,
	threadId: "t1",
	contextRevision: "r1",
	modelId: "model-1",
};
const association = {
	roomId: "room-1",
	metadata,
	options: {
		modelId: "model-1",
		mcp: [],
		instructions: THREAD_ASSISTANT_INSTRUCTIONS,
		predefinedPrompts: [],
	},
};

async function session(): Promise<ThreadSession> {
	const instance = new ThreadSession("t1");
	instances.push(instance);
	await instance.initialize();
	instance.selectModel("model-1", "Test model");
	return instance;
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(findThreadRoom).mockResolvedValue(null);
	vi.mocked(bindThreadRoom).mockResolvedValue(undefined);
	vi.mocked(prepareThreadRoom).mockImplementation(
		async (_actions, _insightId, _title, next, attempt) => {
			attempt.onCreated("room-1");
			return { ...association, metadata: next };
		},
	);
	vi.mocked(getRoomMessages).mockResolvedValue([]);
	vi.mocked(runApi.listRoomRuns).mockResolvedValue([]);
	vi.mocked(runApi.listChildRuns).mockResolvedValue([]);
	vi.mocked(runApi.startAgentRun).mockResolvedValue({
		runId: "run-1",
		roomId: "room-1",
		status: "RUNNING",
		pendingActions: [],
	});
	vi.mocked(runApi.pollRun).mockImplementation(
		() => new Promise(() => undefined),
	);
	vi.mocked(uploadRoomFiles).mockResolvedValue([]);
});
afterEach(() => {
	for (const instance of instances.splice(0)) instance.dispose();
});

it("does not create a room until an explicit send and stages native files after room setup", async () => {
	const instance = await session();
	expect(prepareThreadRoom).not.toHaveBeenCalled();
	vi.mocked(stageMailAttachment).mockResolvedValue({
		insightId: instance.insight.insightId,
		sourceUid: "email-1",
		attachmentId: "a1",
		filePath: "mail/brief.pdf",
		name: "brief.pdf",
		size: 40,
	});
	await instance.send(
		"Thread",
		context,
		{ text: "Summarize", files: [] },
		"email-1",
		[{ id: "a1", name: "brief.pdf", isFile: true }],
	);
	expect(
		vi.mocked(prepareThreadRoom).mock.invocationCallOrder[0],
	).toBeLessThan(
		vi.mocked(stageMailAttachment).mock.invocationCallOrder[0] ?? 0,
	);
	expect(stageMailAttachment).toHaveBeenCalledWith(
		instance.insight.actions,
		instance.insight.insightId,
		"email-1",
		"a1",
		"brief.pdf",
	);
	const [insightId, parameters] =
		vi.mocked(runApi.startAgentRun).mock.calls[0] ?? [];
	expect(insightId).toBe(instance.insight.insightId);
	expect(parameters).toMatchObject({
		agentId: "",
		engine: "model-1",
		media: ["mail/brief.pdf"],
	});
	expect(readThreadCommand(parameters?.command ?? "")).toEqual({
		context,
		request: "Summarize",
	});
});

it("reuses the recovered model without an inventory lookup and starts fresh when exclusions change", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	const instance = await session();
	expect(bindThreadRoom).toHaveBeenCalledWith(
		instance.insight.actions,
		"room-1",
	);
	expect(instance.getSnapshot().modelId).toBe("model-1");
	await instance.send(
		"Thread",
		{ ...context, contextRevision: "r2", contextText: "Email excluded" },
		{ text: "Continue", files: [] },
	);
	expect(prepareThreadRoom).toHaveBeenCalledWith(
		instance.insight.actions,
		instance.insight.insightId,
		"Thread",
		{ ...metadata, contextRevision: "r2" },
		expect.anything(),
	);
});

it("retries partial setup with the known room id instead of allocating a duplicate", async () => {
	const instance = await session();
	vi.mocked(prepareThreadRoom).mockImplementationOnce(
		async (_actions, _insightId, _title, _metadata, attempt) => {
			attempt.onCreated("partially-created");
			throw new Error("Association save failed");
		},
	);
	await expect(
		instance.send("Thread", context, { text: "Hello", files: [] }),
	).rejects.toThrow("Association save failed");
	await instance.send("Thread", context, { text: "Hello", files: [] });
	expect(prepareThreadRoom).toHaveBeenLastCalledWith(
		instance.insight.actions,
		instance.insight.insightId,
		"Thread",
		metadata,
		expect.objectContaining({ roomId: "partially-created" }),
	);
	expect(runApi.startAgentRun).toHaveBeenCalledTimes(1);
});

it("requires explicit status recovery after a lost submit response and clears a confirmed request", async () => {
	const instance = await session();
	vi.mocked(runApi.startAgentRun).mockRejectedValueOnce(
		new Error("Response lost"),
	);
	await expect(
		instance.send("Thread", context, { text: "Hello", files: [] }),
	).rejects.toThrow("Response lost");
	await expect(
		instance.send("Thread", context, { text: "Hello", files: [] }),
	).rejects.toThrow("Check the last message");
	const command =
		vi.mocked(runApi.startAgentRun).mock.calls[0]?.[1].command ?? "";
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "saved",
			type: "INPUT_TEXT",
			parts: [{ type: "TEXT", text: command }],
		},
	]);
	await instance.reconnect();
	expect(instance.getSnapshot()).toMatchObject({
		hasUnconfirmedSubmission: false,
		composerResetKey: 1,
	});
	expect(runApi.startAgentRun).toHaveBeenCalledTimes(1);
});

it("keeps a lost creation response blocked until the user explicitly chooses another conversation", async () => {
	const instance = await session();
	vi.mocked(prepareThreadRoom).mockRejectedValueOnce(
		new Error("Create response lost"),
	);
	await expect(
		instance.send("Thread", context, { text: "Hello", files: [] }),
	).rejects.toThrow("Create response lost");
	await expect(
		instance.send("Thread", context, { text: "Hello", files: [] }),
	).rejects.toThrow("could not be confirmed");
	expect(prepareThreadRoom).toHaveBeenCalledTimes(1);
	instance.allowNewRoom();
	await instance.send("Thread", context, { text: "Hello", files: [] });
	expect(prepareThreadRoom).toHaveBeenCalledTimes(2);
});

it("can retry a failed native attachment without wedging the new room or creating another", async () => {
	const instance = await session();
	vi.mocked(stageMailAttachment).mockRejectedValueOnce(
		new Error("Attachment unavailable"),
	);
	await expect(
		instance.send(
			"Thread",
			context,
			{ text: "Read the file", files: [] },
			"email-1",
			[{ id: "a1", name: "brief.pdf", isFile: true }],
		),
	).rejects.toThrow("Attachment unavailable");
	expect(instance.getSnapshot().turn.isRestoring).toBe(false);
	await instance.send("Thread", context, {
		text: "Continue without the file",
		files: [],
	});
	expect(prepareThreadRoom).toHaveBeenCalledTimes(1);
	expect(runApi.startAgentRun).toHaveBeenCalledTimes(1);
});

it("reuses the matching room and preserves history independently of the latest live run", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "prior",
			type: "INPUT_TEXT",
			parts: [{ type: "TEXT", text: "Previous question" }],
		},
	]);
	const instance = await session();
	expect(instance.getSnapshot().turn.messages).toContainEqual(
		expect.objectContaining({ id: "prior" }),
	);
	await instance.send("Thread", context, { text: "Follow up", files: [] });
	expect(prepareThreadRoom).not.toHaveBeenCalled();
	expect(instance.getSnapshot().turn.messages).toContainEqual(
		expect.objectContaining({ id: "prior" }),
	);
});

it("isolates Download-only files from the assistant's room and media", async () => {
	const instance = await session();
	vi.mocked(stageMailAttachment).mockImplementation(
		async (_actions, insightId) => ({
			insightId,
			sourceUid: "email-1",
			attachmentId: "a1",
			filePath: "private-download.pdf",
			name: "brief.pdf",
			size: 40,
		}),
	);
	await instance.downloadAttachment("email-1", {
		id: "a1",
		name: "brief.pdf",
		isFile: true,
	});
	expect(vi.mocked(stageMailAttachment).mock.calls[0]?.[1]).not.toBe(
		instance.insight.insightId,
	);
	expect(downloadStagedAttachment).toHaveBeenCalledOnce();
	expect(prepareThreadRoom).not.toHaveBeenCalled();
	await instance.send("Thread", context, {
		text: "No file attached",
		files: [],
	});
	expect(runApi.startAgentRun).toHaveBeenCalledWith(
		instance.insight.insightId,
		expect.objectContaining({ media: [] }),
	);
});
