import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import { getAgent } from "@/features/agents/api/get-agent";
import {
	downloadStagedAttachment,
	stageMailAttachment,
} from "@/features/connectors/api/microsoft";
import { getRoomMessages } from "@/features/messages/api/get-room-messages";
import * as runApi from "@/features/rooms/api/agent-run-api";
import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import { stageThreadAttachment } from "./api/thread-attachments";
import { compactThreadMessages } from "./api/thread-compaction";
import { resolveThreadModel, type ThreadModel } from "./api/thread-model";
import {
	bindThreadRoom,
	findThreadRoom,
	prepareThreadRoom,
} from "./api/thread-room";
import {
	LEGACY_THREAD_ASSISTANT_INSTRUCTIONS,
	readThreadCommand,
	setThreadAgent,
} from "./thread-context";
import { canStartNewConversation, ThreadSession } from "./thread-session";
import type { ThreadChatSettings } from "./thread-settings";

vi.mock("@/features/agents/api/get-agent", () => ({ getAgent: vi.fn() }));
vi.mock("./api/thread-model", () => ({ resolveThreadModel: vi.fn() }));
vi.mock("./api/thread-compaction", () => ({ compactThreadMessages: vi.fn() }));
vi.mock("./api/thread-attachments", async (original) => ({
	...(await original<typeof import("./api/thread-attachments")>()),
	stageThreadAttachment: vi.fn(),
}));

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
		instructions: "",
		overrideSystemPrompt: false,
		predefinedPrompts: [],
	},
};
const selectedAgent: WorkspaceAgent = {
	workspace_id: "research-agent",
	name: "Research assistant",
	description: "Researches a topic",
	system_prompt: "Use the agent's research instructions.",
	mcp: [{ id: "knowledge", name: "Knowledge", type: "VECTOR" }],
	skills: [],
	prompts: [],
	config_json: { model_id: "agent-default-model" },
};
const customSettings: ThreadChatSettings = {
	modelId: "model-2",
	agentId: selectedAgent.workspace_id,
	instructions: "  Keep my instructions and spacing.  ",
	temperature: 0.4,
	mcp: [
		{ id: "knowledge", name: "Knowledge", type: "VECTOR" },
		{ id: "toolbox", name: "Tools", type: "PROJECT" },
	],
};

async function session(): Promise<ThreadSession> {
	const instance = new ThreadSession("t1");
	instances.push(instance);
	await instance.initialize();
	instance.selectModel("model-1", "Test model");
	return instance;
}

/** Hold a transport stage open while checking the retained session. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
	let resolve: (value: T) => void = () => undefined;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

beforeEach(() => {
	vi.resetAllMocks();
	setThreadAgent(null);
	vi.mocked(getAgent).mockImplementation(async (_actions, workspaceId) => ({
		...selectedAgent,
		workspace_id: workspaceId,
	}));
	vi.mocked(resolveThreadModel).mockImplementation(async (_actions, ids) => ({
		engine_id: ids.find(Boolean) ?? "model-1",
		engine_name: "Test model",
	}));
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
	setThreadAgent(null);
});

it("keeps agent and chat settings local until the first run uses the committed configuration", async () => {
	const instance = await session();
	await instance.saveSettings("New chat", customSettings);
	expect(instance.getSnapshot()).toMatchObject({
		settings: customSettings,
		agent: selectedAgent,
		modelId: "model-2",
		association: null,
		isSavingSettings: false,
		settingsError: null,
	});
	expect(prepareThreadRoom).not.toHaveBeenCalled();
	expect(bindThreadRoom).not.toHaveBeenCalled();
	expect(getRoomMessages).not.toHaveBeenCalled();

	await instance.send("New chat", context, { text: "Research", files: [] });
	expect(prepareThreadRoom).toHaveBeenCalledExactlyOnceWith(
		instance.insight.actions,
		instance.insight.insightId,
		"New chat",
		{ ...metadata, modelId: "model-2", agentId: "research-agent" },
		expect.objectContaining({ roomId: undefined }),
		customSettings,
		"Research assistant",
	);
	expect(runApi.startAgentRun).toHaveBeenCalledWith(
		instance.insight.insightId,
		expect.objectContaining({
			agentId: "research-agent",
			engine: "model-2",
		}),
	);
});

it("switches and clears draft agents without replacing manual instructions, model, or resources", async () => {
	const instance = await session();
	await instance.saveSettings("New chat", customSettings);
	await instance.saveSettings("New chat", {
		...instance.getSnapshot().settings,
		agentId: "another-agent",
	});
	expect(instance.getSnapshot().agent?.workspace_id).toBe("another-agent");
	await instance.saveSettings("New chat", {
		...instance.getSnapshot().settings,
		agentId: "",
	});
	expect(instance.getSnapshot()).toMatchObject({
		settings: { ...customSettings, agentId: "" },
		agent: null,
		association: null,
		modelId: "model-2",
	});
	expect(prepareThreadRoom).not.toHaveBeenCalled();
});

it("retains the committed draft after a failed agent lookup and allows a retry", async () => {
	const instance = await session();
	const before = instance.getSnapshot().settings;
	vi.mocked(getAgent).mockRejectedValueOnce(new Error("Agent unavailable"));
	await expect(
		instance.saveSettings("New chat", customSettings),
	).rejects.toThrow("Agent unavailable");
	expect(instance.getSnapshot()).toMatchObject({
		settings: before,
		agent: null,
		association: null,
		isSavingSettings: false,
		isCreationUncertain: false,
		settingsError: "Agent unavailable",
	});
	expect(prepareThreadRoom).not.toHaveBeenCalled();
	await instance.saveSettings("New chat", customSettings);
	expect(instance.getSnapshot().settings).toEqual(customSettings);
	expect(instance.getSnapshot().settingsError).toBeNull();
});

it("serializes settings saves against model selection, default refreshes, and sends", async () => {
	const instance = await session();
	const onSubmitStart = vi.fn();
	let finishAgent: ((agent: WorkspaceAgent) => void) | undefined;
	vi.mocked(getAgent).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finishAgent = resolve;
			}),
	);
	const saving = instance.saveSettings("New chat", customSettings);
	expect(instance.getSnapshot().isSavingSettings).toBe(true);
	instance.selectModel("competing-model", "Competing model");
	const reads = vi.mocked(resolveThreadModel).mock.calls.length;
	await instance.resolveDefaults();
	expect(resolveThreadModel).toHaveBeenCalledTimes(reads);
	expect(instance.getSnapshot().modelId).toBe("model-1");
	await expect(
		instance.saveSettings("New chat", { ...customSettings, agentId: "" }),
	).rejects.toThrow("Wait for the current connection");
	await expect(
		instance.send(
			"New chat",
			context,
			{ text: "Too early", files: [] },
			undefined,
			[],
			onSubmitStart,
		),
	).rejects.toThrow("Chat settings are still loading or saving");
	expect(onSubmitStart).not.toHaveBeenCalled();
	finishAgent?.(selectedAgent);
	await saving;
	expect(instance.getSnapshot().settings).toEqual(customSettings);
	expect(instance.getSnapshot().isLoadingModel).toBe(false);
});

it("does not let an older defaults response overwrite saved settings", async () => {
	const instance = await session();
	let finishModel: ((model: ThreadModel) => void) | undefined;
	vi.mocked(resolveThreadModel).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finishModel = resolve;
			}),
	);
	const resolving = instance.resolveDefaults();
	await instance.saveSettings("New chat", customSettings);
	finishModel?.({ engine_id: "old-model", engine_name: "Old model" });
	await resolving;
	expect(instance.getSnapshot()).toMatchObject({
		settings: customSettings,
		agent: selectedAgent,
		modelId: "model-2",
		isLoadingModel: false,
	});
});

it("keeps a newer explicit model and clears loading when an old defaults request settles", async () => {
	const instance = await session();
	let finishModel: ((model: ThreadModel) => void) | undefined;
	vi.mocked(resolveThreadModel).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finishModel = resolve;
			}),
	);
	const resolving = instance.resolveDefaults();
	instance.selectModel("model-2", "Chosen model");
	finishModel?.({ engine_id: "old-model", engine_name: "Old model" });
	await resolving;
	expect(instance.getSnapshot()).toMatchObject({
		settings: { modelId: "model-2" },
		modelId: "model-2",
		modelName: "Chosen model",
		isLoadingModel: false,
		modelError: null,
	});
});

it("resolves a pending selected agent before sending after an explicit model change", async () => {
	setThreadAgent({
		id: selectedAgent.workspace_id,
		name: selectedAgent.name,
		modelId: "agent-default-model",
	});
	let finishOriginalAgent: ((agent: WorkspaceAgent) => void) | undefined;
	let finishCurrentAgent: ((agent: WorkspaceAgent) => void) | undefined;
	const originalAgent = new Promise<WorkspaceAgent>((resolve) => {
		finishOriginalAgent = resolve;
	});
	const currentAgent = new Promise<WorkspaceAgent>((resolve) => {
		finishCurrentAgent = resolve;
	});
	vi.mocked(getAgent)
		.mockReturnValueOnce(originalAgent)
		.mockReturnValueOnce(currentAgent);
	const instance = new ThreadSession("t1");
	instances.push(instance);
	const initializing = instance.initialize();
	await vi.waitFor(() => expect(getAgent).toHaveBeenCalledOnce());
	instance.selectModel("model-2", "Chosen model");
	expect(instance.getSnapshot()).toMatchObject({
		modelId: "model-2",
		agent: null,
		isLoadingModel: true,
	});
	await expect(
		instance.send("New chat", context, { text: "Too early", files: [] }),
	).rejects.toThrow("Chat settings are still loading or saving");
	expect(prepareThreadRoom).not.toHaveBeenCalled();

	finishOriginalAgent?.({ ...selectedAgent, name: "Stale agent" });
	await initializing;
	expect(instance.getSnapshot().isLoadingModel).toBe(true);
	expect(instance.getSnapshot().agent).toBeNull();
	finishCurrentAgent?.(selectedAgent);
	await vi.waitFor(() =>
		expect(instance.getSnapshot().isLoadingModel).toBe(false),
	);
	expect(instance.getSnapshot()).toMatchObject({
		modelId: "model-2",
		settings: {
			modelId: "model-2",
			agentId: selectedAgent.workspace_id,
		},
		agent: selectedAgent,
	});
	await instance.send("New chat", context, { text: "Research", files: [] });
	expect(runApi.startAgentRun).toHaveBeenCalledWith(
		instance.insight.insightId,
		expect.objectContaining({
			agentId: selectedAgent.workspace_id,
			engine: "model-2",
		}),
	);
});

it("rejects sending when the resolved agent does not match the selection", async () => {
	setThreadAgent({
		id: selectedAgent.workspace_id,
		name: selectedAgent.name,
		modelId: "model-1",
	});
	vi.mocked(getAgent).mockResolvedValue({
		...selectedAgent,
		workspace_id: "different-agent",
	});
	const instance = new ThreadSession("t1");
	instances.push(instance);
	await instance.initialize();
	await expect(
		instance.send("New chat", context, { text: "Research", files: [] }),
	).rejects.toThrow("selected agent to finish loading");
	expect(prepareThreadRoom).not.toHaveBeenCalled();
	expect(runApi.startAgentRun).not.toHaveBeenCalled();
});

it("clears a failed draft settings error only after successful catalog recovery", async () => {
	const instance = await session();
	const committed = instance.getSnapshot().settings;
	vi.mocked(getAgent).mockRejectedValueOnce(new Error("Agent unavailable"));
	await expect(
		instance.saveSettings("New chat", customSettings),
	).rejects.toThrow("Agent unavailable");
	vi.mocked(resolveThreadModel).mockRejectedValueOnce(
		new Error("Catalog unavailable"),
	);
	await instance.resolveDefaults();
	expect(instance.getSnapshot().settingsError).toBe("Agent unavailable");
	await instance.resolveDefaults();
	expect(instance.getSnapshot()).toMatchObject({
		settings: committed,
		settingsError: null,
		modelError: null,
	});
	expect(prepareThreadRoom).not.toHaveBeenCalled();
	await instance.send("New chat", context, { text: "Continue", files: [] });
	expect(runApi.startAgentRun).toHaveBeenCalledOnce();
});

it("keeps a failed room settings write blocked until saving succeeds", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	const instance = await session();
	vi.mocked(prepareThreadRoom).mockRejectedValueOnce(
		new Error("Settings write failed"),
	);
	await expect(
		instance.saveSettings("Existing chat", customSettings),
	).rejects.toThrow("Settings write failed");
	await instance.resolveDefaults();
	expect(instance.getSnapshot().settingsError).toBe("Settings write failed");
	await expect(
		instance.send("Existing chat", context, { text: "Wait", files: [] }),
	).rejects.toThrow("Settings write failed");
	expect(runApi.startAgentRun).not.toHaveBeenCalled();
	await instance.saveSettings("Existing chat", customSettings);
	expect(instance.getSnapshot().settingsError).toBeNull();
});

it("updates an existing room and restores its selected agent, settings, and history", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	const savedAssociation = {
		...association,
		metadata: {
			...metadata,
			modelId: "model-2",
			agentId: selectedAgent.workspace_id,
		},
		options: {
			...association.options,
			...customSettings,
			workspace: {
				workspace_id: selectedAgent.workspace_id,
				name: selectedAgent.name,
			},
		},
	};
	vi.mocked(prepareThreadRoom).mockResolvedValueOnce(savedAssociation);
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "prior",
			type: "INPUT_TEXT",
			parts: [{ type: "TEXT", text: "Previous question" }],
		},
	]);
	const instance = await session();
	await instance.saveSettings("Existing chat", customSettings);
	expect(prepareThreadRoom).toHaveBeenCalledExactlyOnceWith(
		instance.insight.actions,
		instance.insight.insightId,
		"Existing chat",
		{ ...metadata, modelId: "model-2", agentId: "research-agent" },
		expect.objectContaining({ roomId: "room-1" }),
		customSettings,
		"Research assistant",
	);
	expect(instance.getSnapshot().association?.roomId).toBe("room-1");
	expect(instance.getSnapshot().turn.messages).toContainEqual(
		expect.objectContaining({ id: "prior" }),
	);
	vi.mocked(findThreadRoom).mockResolvedValueOnce(savedAssociation);
	const restored = new ThreadSession("t1");
	instances.push(restored);
	await restored.initialize();
	expect(restored.getSnapshot()).toMatchObject({
		settings: customSettings,
		agent: selectedAgent,
		modelId: "model-2",
		association: { roomId: "room-1" },
	});
	expect(restored.getSnapshot().turn.messages).toContainEqual(
		expect.objectContaining({ id: "prior" }),
	);
});

it("saves settings into a room allocated by a partially failed first send", async () => {
	const instance = await session();
	vi.mocked(prepareThreadRoom).mockImplementationOnce(
		async (_actions, _insightId, _title, _metadata, attempt) => {
			attempt.onCreated("partially-created");
			throw new Error("Association save failed");
		},
	);
	await expect(
		instance.send("New chat", context, { text: "Hello", files: [] }),
	).rejects.toThrow("Association save failed");
	await instance.saveSettings("New chat", customSettings);
	expect(prepareThreadRoom).toHaveBeenLastCalledWith(
		instance.insight.actions,
		instance.insight.insightId,
		"New chat",
		{
			...metadata,
			contextRevision: "",
			modelId: "model-2",
			agentId: selectedAgent.workspace_id,
		},
		expect.objectContaining({ roomId: "partially-created" }),
		customSettings,
		selectedAgent.name,
	);
	expect(runApi.startAgentRun).not.toHaveBeenCalled();
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
		context: {
			...context,
			attachments: [
				{
					messageId: "email-1",
					attachmentId: "a1",
					name: "brief.pdf",
					file: "mail/brief.pdf",
					sentAs: "file",
				},
			],
		},
		request: "Summarize",
	});
});

it("starts submission before delayed setup and keeps one send and observer across view reattachment", async () => {
	const instance = await session();
	const preparing = deferred<Awaited<ReturnType<typeof prepareThreadRoom>>>();
	const uploading = deferred<Awaited<ReturnType<typeof uploadRoomFiles>>>();
	const accepting =
		deferred<Awaited<ReturnType<typeof runApi.startAgentRun>>>();
	vi.mocked(prepareThreadRoom).mockReturnValueOnce(preparing.promise);
	vi.mocked(uploadRoomFiles).mockReturnValueOnce(uploading.promise);
	vi.mocked(runApi.startAgentRun).mockReturnValueOnce(accepting.promise);
	const releaseWelcome = instance.retain();
	const unsubscribeWelcome = instance.subscribe(vi.fn());
	const submission = {
		text: "Review this draft",
		files: [
			new File(["Draft content"], "draft.txt", { type: "text/plain" }),
		],
	};
	const onSubmitStart = vi.fn(() => {
		expect(instance.getSnapshot().isPreparing).toBe(true);
		expect(prepareThreadRoom).not.toHaveBeenCalled();
		expect(uploadRoomFiles).not.toHaveBeenCalled();
		expect(runApi.startAgentRun).not.toHaveBeenCalled();
	});
	const sending = instance.send(
		"New chat",
		context,
		submission,
		undefined,
		[],
		onSubmitStart,
	);
	expect(onSubmitStart).toHaveBeenCalledOnce();
	expect(prepareThreadRoom).toHaveBeenCalledOnce();
	unsubscribeWelcome();
	releaseWelcome();
	expect(instance.canEvict()).toBe(false);
	await expect(
		instance.send(
			"New chat",
			context,
			submission,
			undefined,
			[],
			onSubmitStart,
		),
	).rejects.toThrow("already being prepared");
	expect(onSubmitStart).toHaveBeenCalledOnce();

	const releaseThread = instance.retain();
	const threadUpdates = vi.fn();
	const unsubscribeThread = instance.subscribe(threadUpdates);
	await instance.initialize();
	expect(findThreadRoom).toHaveBeenCalledOnce();
	preparing.resolve(association);
	await vi.waitFor(() => expect(uploadRoomFiles).toHaveBeenCalledOnce());
	expect(uploadRoomFiles).toHaveBeenCalledWith(
		instance.insight.insightId,
		submission.files,
	);
	expect(runApi.startAgentRun).not.toHaveBeenCalled();
	expect(instance.getSnapshot().isPreparing).toBe(true);
	uploading.resolve([{ fileName: "draft.txt", fileLocation: "draft.txt" }]);
	await vi.waitFor(() => expect(runApi.startAgentRun).toHaveBeenCalledOnce());
	expect(runApi.startAgentRun).toHaveBeenCalledWith(
		instance.insight.insightId,
		expect.objectContaining({ roomId: "room-1", media: ["draft.txt"] }),
	);
	expect(runApi.pollRun).not.toHaveBeenCalled();
	expect(instance.getSnapshot().isPreparing).toBe(true);
	accepting.resolve({
		runId: "run-1",
		roomId: "room-1",
		status: "RUNNING",
		pendingActions: [],
	});
	await sending;
	await instance.initialize();
	await instance.reconnect();
	expect(onSubmitStart).toHaveBeenCalledOnce();
	expect(prepareThreadRoom).toHaveBeenCalledOnce();
	expect(uploadRoomFiles).toHaveBeenCalledOnce();
	expect(runApi.startAgentRun).toHaveBeenCalledOnce();
	expect(runApi.pollRun).toHaveBeenCalledExactlyOnceWith("run-1");
	expect(threadUpdates).toHaveBeenCalled();
	expect(instance.getSnapshot()).toMatchObject({
		isPreparing: false,
		turn: { isRunning: true },
	});
	unsubscribeThread();
	releaseThread();
	expect(instance.canEvict()).toBe(false);
});

it("does not announce submission for invalid context, source, or attachment count", async () => {
	const instance = await session();
	const onSubmitStart = vi.fn();
	await expect(
		instance.send(
			"New chat",
			{ ...context, threadId: "other-thread" },
			{ text: "Hello", files: [] },
			undefined,
			[],
			onSubmitStart,
		),
	).rejects.toThrow("different thread");
	await expect(
		instance.send(
			"New chat",
			context,
			{ text: "Hello", files: [] },
			undefined,
			[{ id: "file-1", name: "brief.pdf", isFile: true }],
			onSubmitStart,
		),
	).rejects.toThrow("source for this attachment is unavailable");
	await expect(
		instance.send(
			"New chat",
			context,
			{
				text: "Hello",
				files: Array.from(
					{ length: 6 },
					(_, index) => new File(["Draft"], `draft-${index}.txt`),
				),
			},
			undefined,
			[],
			onSubmitStart,
		),
	).rejects.toThrow("Attach up to 5 files");
	expect(onSubmitStart).not.toHaveBeenCalled();
	expect(prepareThreadRoom).not.toHaveBeenCalled();
	expect(instance.getSnapshot().isPreparing).toBe(false);
});

it("stages each Brain attachment from its own email and sends Office files as their text", async () => {
	const instance = await session();
	vi.mocked(stageThreadAttachment).mockImplementation(
		async (_actions, insightId, _threadId, attachment) => ({
			insightId,
			sourceUid: attachment.messageId ?? "",
			attachmentId: attachment.id,
			name: attachment.name,
			size: 100,
			filePath: `staged-${attachment.name}`,
			...(attachment.name.endsWith(".xlsx")
				? { textPath: `staged-${attachment.name}.txt` }
				: {}),
		}),
	);
	const budget = {
		id: "a1",
		name: "Budget.xlsx",
		isFile: true,
		messageId: "m-older",
	};
	const scan = {
		id: "a2",
		name: "scan.pdf",
		isFile: true,
		messageId: "m-newest",
	};
	await instance.send(
		"Thread",
		context,
		{ text: "Compare these", files: [] },
		undefined,
		[budget, scan],
	);
	expect(
		vi.mocked(prepareThreadRoom).mock.invocationCallOrder[0],
	).toBeLessThan(
		vi.mocked(stageThreadAttachment).mock.invocationCallOrder[0] ?? 0,
	);
	expect(stageThreadAttachment).toHaveBeenCalledWith(
		instance.insight.actions,
		instance.insight.insightId,
		"t1",
		budget,
		true,
	);
	expect(stageMailAttachment).not.toHaveBeenCalled();
	const [, parameters] = vi.mocked(runApi.startAgentRun).mock.calls[0] ?? [];
	expect(parameters?.media).toEqual([
		"staged-Budget.xlsx.txt",
		"staged-scan.pdf",
	]);
	expect(
		readThreadCommand(parameters?.command ?? "")?.context.attachments,
	).toEqual([
		{
			messageId: "m-older",
			attachmentId: "a1",
			name: "Budget.xlsx",
			file: "staged-Budget.xlsx.txt",
			sentAs: "text",
		},
		{
			messageId: "m-newest",
			attachmentId: "a2",
			name: "scan.pdf",
			file: "staged-scan.pdf",
			sentAs: "file",
		},
	]);
});

it("checks attachment sizes before preparing a room or downloading anything", async () => {
	const instance = await session();
	const onSubmitStart = vi.fn();
	const MB = 1024 * 1024;
	const file = (id: string, name: string, size: number) => ({
		id,
		name,
		size,
		isFile: true,
		messageId: `m-${id}`,
	});
	await expect(
		instance.send(
			"Thread",
			context,
			{ text: "Read", files: [] },
			undefined,
			[file("a1", "huge.pdf", 11 * MB)],
			onSubmitStart,
		),
	).rejects.toThrow("huge.pdf is larger than the 10 MB attachment limit.");
	await expect(
		instance.send(
			"Thread",
			context,
			{ text: "Read", files: [] },
			undefined,
			[
				file("a1", "one.pdf", 9 * MB),
				file("a2", "two.pdf", 9 * MB),
				file("a3", "three.png", 3 * MB),
			],
			onSubmitStart,
		),
	).rejects.toThrow("Files sent with one message can total 20 MB.");
	expect(onSubmitStart).not.toHaveBeenCalled();
	expect(prepareThreadRoom).not.toHaveBeenCalled();
	expect(stageThreadAttachment).not.toHaveBeenCalled();
	// Office files reach the model as their text, so they do not count.
	vi.mocked(stageThreadAttachment).mockImplementation(
		async (_actions, insightId, _threadId, attachment) => ({
			insightId,
			sourceUid: attachment.messageId ?? "",
			attachmentId: attachment.id,
			name: attachment.name,
			size: attachment.size ?? 0,
			filePath: attachment.name,
			...(attachment.name.endsWith(".docx")
				? { textPath: `${attachment.name}.txt` }
				: {}),
		}),
	);
	await instance.send(
		"Thread",
		context,
		{ text: "Read", files: [] },
		undefined,
		[
			file("a1", "one.pdf", 9 * MB),
			file("a2", "two.pdf", 9 * MB),
			file("a3", "notes.docx", 9 * MB),
		],
	);
	expect(runApi.startAgentRun).toHaveBeenCalledTimes(1);
});

it("never sends an Office file raw when its text could not be read", async () => {
	const instance = await session();
	vi.mocked(stageThreadAttachment).mockResolvedValue({
		insightId: instance.insight.insightId,
		sourceUid: "m1",
		attachmentId: "a1",
		name: "locked.docx",
		size: 100,
		filePath: "locked.docx",
		textError:
			"This file is password protected, so its text could not be read.",
	});
	await expect(
		instance.send(
			"Thread",
			context,
			{ text: "Read", files: [] },
			undefined,
			[{ id: "a1", name: "locked.docx", isFile: true, messageId: "m1" }],
		),
	).rejects.toThrow("This file is password protected");
	expect(runApi.startAgentRun).not.toHaveBeenCalled();
});

it("previews and downloads Brain attachments from the download area, never the room", async () => {
	const instance = await session();
	vi.mocked(stageThreadAttachment).mockImplementation(
		async (_actions, insightId, _threadId, attachment) => ({
			insightId,
			sourceUid: attachment.messageId ?? "",
			attachmentId: attachment.id,
			name: attachment.name,
			size: 100,
			filePath: `staged-${attachment.name}`,
			textPath: `staged-${attachment.name}.txt`,
		}),
	);
	const budget = {
		id: "a1",
		name: "Budget.xlsx",
		isFile: true,
		messageId: "m1",
	};
	const preview = await instance.previewAttachment(undefined, budget);
	expect(preview).toEqual({
		insightId: expect.stringMatching(/^isolated-/),
		path: "staged-Budget.xlsx.txt",
		name: "Budget.xlsx (text)",
	});
	expect(preview.insightId).not.toBe(instance.insight.insightId);
	const [actions] = vi.mocked(stageThreadAttachment).mock.calls[0] ?? [];
	expect(actions).not.toBe(instance.insight.actions);
	await instance.downloadAttachment(undefined, budget);
	// One staged copy serves both the preview and the download.
	expect(stageThreadAttachment).toHaveBeenCalledTimes(1);
	expect(downloadStagedAttachment).toHaveBeenCalledWith(
		actions,
		expect.objectContaining({ filePath: "staged-Budget.xlsx" }),
	);
	await expect(
		instance.previewAttachment(undefined, {
			id: "a2",
			name: "Plan.docx",
			isFile: false,
			messageId: "m1",
		}),
	).rejects.toThrow("Open this linked or embedded attachment in Outlook.");
});

it("reuses the recovered room and model when source context changes", async () => {
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
		expect.objectContaining({ roomId: "room-1" }),
		instance.getSnapshot().settings,
		undefined,
	);
});

it("migrates legacy instructions in a recovered room before starting the next run", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue({
		...association,
		options: {
			...association.options,
			instructions: `${LEGACY_THREAD_ASSISTANT_INSTRUCTIONS}\n\nKeep replies concise.`,
			overrideSystemPrompt: true,
		},
	});
	const instance = await session();
	expect(instance.getSnapshot().settings.instructions).toBe(
		"Keep replies concise.",
	);
	await instance.send("Thread", context, { text: "Continue", files: [] });
	expect(prepareThreadRoom).toHaveBeenCalledWith(
		instance.insight.actions,
		instance.insight.insightId,
		"Thread",
		metadata,
		expect.objectContaining({ roomId: "room-1" }),
		expect.objectContaining({ instructions: "Keep replies concise." }),
		undefined,
	);
	expect(
		vi.mocked(prepareThreadRoom).mock.invocationCallOrder[0],
	).toBeLessThan(
		vi.mocked(runApi.startAgentRun).mock.invocationCallOrder[0] ?? 0,
	);
});

it("uses the selected model for the next turn while retaining the thread room", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	const instance = await session();
	instance.selectModel("model-2", "Second model");
	expect(instance.getSnapshot()).toMatchObject({
		modelId: "model-2",
		modelName: "Second model",
	});
	await instance.send("Thread", context, {
		text: "Continue with this model",
		files: [],
	});
	expect(prepareThreadRoom).toHaveBeenCalledWith(
		instance.insight.actions,
		instance.insight.insightId,
		"Thread",
		{ ...metadata, modelId: "model-2" },
		expect.objectContaining({ roomId: "room-1" }),
		expect.objectContaining({ modelId: "model-2" }),
		undefined,
	);
	expect(runApi.startAgentRun).toHaveBeenCalledWith(
		instance.insight.insightId,
		expect.objectContaining({ engine: "model-2" }),
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
		instance.getSnapshot().settings,
		undefined,
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

it("keeps the owned room and updates its metadata when source context changes", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	const instance = await session();
	await instance.send(
		"Thread",
		{
			...context,
			contextRevision: "r2",
			contextText: "Only selected material",
		},
		{ text: "Continue", files: [] },
	);
	expect(prepareThreadRoom).toHaveBeenCalledWith(
		expect.anything(),
		instance.insight.insightId,
		"Thread",
		expect.objectContaining({ contextRevision: "r2" }),
		expect.objectContaining({ roomId: "room-1" }),
		expect.anything(),
		undefined,
	);
	expect(instance.getSnapshot().association?.roomId).toBe("room-1");
	const command =
		vi.mocked(runApi.startAgentRun).mock.calls[0]?.[1].command ?? "";
	expect(readThreadCommand(command)?.context).toMatchObject({
		contextRevision: "r2",
		contextText: "Only selected material",
	});
});

it("compacts only the persisted assistant leaf and locks concurrent writes", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "question",
			type: "INPUT_TEXT",
			tokens: 120,
			parts: [{ type: "TEXT", text: "Question" }],
		},
		{
			messageId: "answer",
			parentMessageId: "question",
			type: "RESPONSE_TEXT",
			tokens: 30,
			parts: [{ type: "TEXT", text: "Answer" }],
		},
	]);
	const instance = await session();
	let finish: ((result: "compacted") => void) | undefined;
	vi.mocked(compactThreadMessages).mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const pending = instance.compact("SUMMARY");
	expect(instance.getSnapshot().isCompacting).toBe(true);
	await expect(
		instance.send("Thread", context, { text: "Wait", files: [] }),
	).rejects.toThrow();
	await vi.waitFor(() =>
		expect(compactThreadMessages).toHaveBeenCalledWith(
			instance.insight.actions,
			"room-1",
			"answer",
			"SUMMARY",
		),
	);
	finish?.("compacted");
	await pending;
	expect(instance.getSnapshot()).toMatchObject({
		isCompacting: false,
		compactionNotice: "Conversation context compacted.",
		usage: { contextTokens: 150, totalTokens: 150 },
	});
});

it("retains compaction failure details and allows a safe retry", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "answer",
			type: "RESPONSE_TEXT",
			parts: [{ type: "TEXT", text: "Answer" }],
		},
	]);
	const instance = await session();
	vi.mocked(compactThreadMessages).mockRejectedValueOnce(
		new Error("Summary service unavailable"),
	);
	await expect(instance.compact()).rejects.toThrow(
		"Summary service unavailable",
	);
	expect(instance.getSnapshot()).toMatchObject({
		isCompacting: false,
		compactionError: "Summary service unavailable",
	});
	vi.mocked(compactThreadMessages).mockResolvedValueOnce("skipped");
	await instance.compact();
	expect(instance.getSnapshot()).toMatchObject({
		compactionError: null,
		compactionNotice: "No compaction was needed.",
	});
});

it("does not compact an active run or an unanswered message", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "question",
			type: "INPUT_TEXT",
			parts: [{ type: "TEXT", text: "Question" }],
		},
	]);
	const instance = await session();
	await expect(instance.compact()).rejects.toThrow("completed a response");
	await instance.send("Thread", context, { text: "Continue", files: [] });
	await expect(instance.compact()).rejects.toThrow("finish or reconnect");
	expect(compactThreadMessages).not.toHaveBeenCalled();
});

it("starts a Work run without a draft-review capability endpoint", async () => {
	const instance = await session();
	vi.mocked(instance.insight.actions.run)
		.mockClear()
		.mockRejectedValue(new Error("Unknown reactor"));
	await expect(
		instance.send("Thread", context, { text: "Draft a reply", files: [] }),
	).resolves.toBeUndefined();
	expect(runApi.startAgentRun).toHaveBeenCalledOnce();
	expect(prepareThreadRoom).toHaveBeenCalledOnce();
	expect(instance.insight.actions.run).not.toHaveBeenCalled();
});

it("a new conversation leaves the old room and creates another on the next send", async () => {
	vi.mocked(findThreadRoom).mockResolvedValue(association);
	vi.mocked(getRoomMessages).mockResolvedValue([
		{
			messageId: "prior",
			type: "INPUT_TEXT",
			parts: [{ type: "TEXT", text: "Previous question" }],
		},
	]);
	vi.mocked(prepareThreadRoom).mockImplementation(
		async (_actions, _insightId, _title, next, attempt) => {
			attempt.onCreated("room-2");
			return { ...association, roomId: "room-2", metadata: next };
		},
	);
	const instance = await session();
	expect(canStartNewConversation(instance.getSnapshot())).toBe(true);
	instance.startNewConversation();
	expect(instance.getSnapshot().association).toBeNull();
	expect(instance.getSnapshot().turn.messages).toEqual([]);
	vi.mocked(getRoomMessages).mockResolvedValue([]);
	await instance.send("Thread", context, { text: "Start over", files: [] });
	expect(prepareThreadRoom).toHaveBeenCalledWith(
		instance.insight.actions,
		instance.insight.insightId,
		"Thread",
		metadata,
		expect.objectContaining({ roomId: undefined }),
		instance.getSnapshot().settings,
		undefined,
	);
	expect(instance.getSnapshot().association?.roomId).toBe("room-2");
	expect(instance.getSnapshot().turn.messages).not.toContainEqual(
		expect.objectContaining({ id: "prior" }),
	);
});

it("cannot start a new conversation before a room exists", async () => {
	const instance = await session();
	expect(canStartNewConversation(instance.getSnapshot())).toBe(false);
	expect(() => instance.startNewConversation()).toThrow(/Wait/);
});
