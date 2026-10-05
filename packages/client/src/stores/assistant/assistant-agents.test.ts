import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkbenchStore } from "@semoss/workbench";
import { createAssistantStore } from "./assistant.store";
import {
	APP_BUILDER_AGENT,
	AUTOMATION_BUILDER_AGENT,
	DATABASE_EXPLORER_AGENT,
	NOTEBOOK_ANALYST_AGENT,
} from "./assistant-agents";

const requests = vi.hoisted(() => ({
	runAgent: vi.fn(),
	updateRoomOptions: vi.fn(),
	getRoomOptions: vi.fn(),
	getPlaygroundMessages: vi.fn(),
	setRoomForInsight: vi.fn(),
}));

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	runAgent: requests.runAgent,
}));
vi.mock("@/api/rooms", async (original) => ({
	...(await original<typeof import("@/api/rooms")>()),
	updateRoomOptions: requests.updateRoomOptions,
	getRoomOptions: requests.getRoomOptions,
	getPlaygroundMessages: requests.getPlaygroundMessages,
	setRoomForInsight: requests.setRoomForInsight,
}));

const customAgent = { workspace_id: "custom-agent", name: "My analyst" };
const stores: ReturnType<typeof createAssistantStore>[] = [];

/** Ready conversation; transport is mocked so tests never launch remote runs. */
const makeStore = () => {
	const store = createAssistantStore({
		workbenchId: "test-workbench",
		workbench: createWorkbenchStore({ components: {} }),
	});
	store.setState({
		insightId: "insight-1",
		roomId: "room-1",
		model: {
			engine_id: "model-1",
			engine_name: "Model",
			engine_type: "MODEL",
		},
		mcp: [{ id: "project-1", name: "Project tools", type: "PROJECT" }],
	});
	stores.push(store);
	return store;
};

beforeEach(() => {
	vi.resetAllMocks();
	// These tests check request construction, not the run-watching lifecycle.
	requests.runAgent.mockRejectedValue(
		new Error("Submission stopped by test"),
	);
	requests.updateRoomOptions.mockResolvedValue(undefined);
	requests.setRoomForInsight.mockResolvedValue(undefined);
	requests.getPlaygroundMessages.mockResolvedValue([]);
});

afterEach(() => {
	for (const store of stores.splice(0)) store.getState().destroy();
});

describe("workbench agent selection", () => {
	it.each([null, customAgent])(
		"appends workbench instructions for agent selection %s by default",
		async (agent) => {
			const store = makeStore();
			store.getState().configure({
				defaultAgent: DATABASE_EXPLORER_AGENT,
				agent,
				systemPrompt: "Active engine: database-1",
			});
			await store.getState().submit("Analyze this database");
			expect(requests.updateRoomOptions).toHaveBeenLastCalledWith(
				"insight-1",
				"room-1",
				expect.objectContaining({
					instructions: "Active engine: database-1",
					overrideSystemPrompt: false,
					workspace: agent ?? DATABASE_EXPLORER_AGENT,
				}),
			);
		},
	);

	it("can explicitly replace the agent prompt and switch back to appending", async () => {
		const store = makeStore();
		store.getState().configure({
			systemPrompt: "Use this replacement persona",
			overrideSystemPrompt: true,
		});
		await store.getState().submit("First request");
		expect(requests.updateRoomOptions).toHaveBeenLastCalledWith(
			"insight-1",
			"room-1",
			expect.objectContaining({
				instructions: "Use this replacement persona",
				overrideSystemPrompt: true,
			}),
		);
		store.getState().configure({
			systemPrompt: "Updated workbench context",
			overrideSystemPrompt: false,
		});
		await store.getState().submit("Next request");
		expect(requests.updateRoomOptions).toHaveBeenLastCalledWith(
			"insight-1",
			"room-1",
			expect.objectContaining({
				instructions: "Updated workbench context",
				overrideSystemPrompt: false,
			}),
		);
	});

	it.each([
		APP_BUILDER_AGENT,
		DATABASE_EXPLORER_AGENT,
		NOTEBOOK_ANALYST_AGENT,
		AUTOMATION_BUILDER_AGENT,
	])("submits the configured $name default", async (defaultAgent) => {
		const store = makeStore();
		store.getState().configure({ defaultAgent });
		await store.getState().submit("Help with this workbench");
		expect(requests.updateRoomOptions).toHaveBeenCalledWith(
			"insight-1",
			"room-1",
			expect.objectContaining({
				workspace: defaultAgent,
				workbenchAgentMode: "default",
			}),
		);
		expect(requests.runAgent).toHaveBeenCalledWith(
			expect.objectContaining({ agentId: defaultAgent.workspace_id }),
			"insight-1",
		);
	});

	it("keeps a custom choice through workbench configuration updates and can reset it", async () => {
		const store = makeStore();
		store.getState().configure({ defaultAgent: NOTEBOOK_ANALYST_AGENT });
		store.getState().setAgent(customAgent);
		store.getState().configure({
			defaultAgent: NOTEBOOK_ANALYST_AGENT,
			systemPrompt: "Refreshed context",
		});
		await store.getState().submit("First request");
		expect(requests.runAgent).toHaveBeenLastCalledWith(
			expect.objectContaining({ agentId: "custom-agent" }),
			"insight-1",
		);
		expect(requests.updateRoomOptions).toHaveBeenLastCalledWith(
			"insight-1",
			"room-1",
			expect.objectContaining({
				workspace: customAgent,
				workbenchAgentMode: "custom",
			}),
		);
		store.getState().setAgent(null);
		await store.getState().submit("Use the default again");
		expect(requests.runAgent).toHaveBeenLastCalledWith(
			expect.objectContaining({ agentId: "notebook-analyst" }),
			"insight-1",
		);
	});

	it("keeps one agent for the room write and run when selection changes during submission", async () => {
		const store = makeStore();
		store.getState().configure({ defaultAgent: DATABASE_EXPLORER_AGENT });
		let release: () => void = () => undefined;
		requests.updateRoomOptions.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					release = resolve;
				}),
		);
		const pending = store.getState().submit("Inspect the database");
		expect(requests.updateRoomOptions).toHaveBeenCalledWith(
			"insight-1",
			"room-1",
			expect.objectContaining({ workspace: DATABASE_EXPLORER_AGENT }),
		);
		store.getState().setAgent(customAgent);
		release();
		await pending;
		expect(requests.runAgent).toHaveBeenLastCalledWith(
			expect.objectContaining({ agentId: "database-explorer" }),
			"insight-1",
		);
		await store.getState().submit("Next request");
		expect(requests.runAgent).toHaveBeenLastCalledWith(
			expect.objectContaining({ agentId: "custom-agent" }),
			"insight-1",
		);
	});

	it.each([
		{ mode: "custom", workspace: customAgent, expected: customAgent },
		{ mode: undefined, workspace: customAgent, expected: customAgent },
		{ mode: "default", workspace: NOTEBOOK_ANALYST_AGENT, expected: null },
		{ mode: undefined, workspace: null, expected: null },
	])(
		"restores $mode room selection with workspace $workspace",
		async ({ mode, workspace, expected }) => {
			const store = makeStore();
			store
				.getState()
				.configure({ defaultAgent: NOTEBOOK_ANALYST_AGENT });
			store
				.getState()
				.setAgent({ workspace_id: "other-agent", name: "Other agent" });
			requests.getRoomOptions.mockResolvedValue({
				modelId: "model-1",
				workspace,
				workbenchAgentMode: mode,
			});
			await store.getState().resumeRoom("saved-room");
			expect(store.getState().agent).toEqual(expected);
			expect(store.getState().defaultAgent).toEqual(
				NOTEBOOK_ANALYST_AGENT,
			);
		},
	);
});
