import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentRunSnapshot, AgentStore } from "@semoss/sdk";
import { createWorkbenchStore } from "@semoss/workbench";
import { ASSISTANT_TOOL_PANEL_TYPE } from "@/features/assistant-tools/assistant-tool-ui";
import { createBuildRunFromRecord } from "./assistant.runs";
import { createAssistantStore } from "./assistant.store";

type Handlers = Parameters<AgentStore["watch"]>[0];
const api = vi.hoisted(() => ({
	get: vi.fn(),
	result: vi.fn(),
	decision: vi.fn(),
	messages: vi.fn(),
	options: vi.fn(),
	children: vi.fn(),
	run: vi.fn(),
	saveOptions: vi.fn(),
	handlers: new Map<string, Handlers>(),
	finish: new Map<string, (snapshot: AgentRunSnapshot) => void>(),
}));
vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getAgentRun: api.get,
	getSubagentRuns: api.children,
	decideAgentRunAction: api.decision,
	runAgent: api.run,
	AgentStore: class {
		constructor(
			_room: string,
			_insight: string,
			private runId: string,
		) {}
		watch(handlers: Handlers) {
			api.handlers.set(this.runId, handlers);
			return {
				done: new Promise<AgentRunSnapshot>((resolve) =>
					api.finish.set(this.runId, resolve),
				),
			};
		}
		pokeNow() {}
	},
}));
vi.mock("@/api/assistant-tools", async (original) => ({
	...(await original<typeof import("@/api/assistant-tools")>()),
	submitAssistantToolResult: api.result,
}));
vi.mock("@/api/rooms", async (original) => ({
	...(await original<typeof import("@/api/rooms")>()),
	getRoomOptions: api.options,
	updateRoomOptions: api.saveOptions,
	getPlaygroundMessages: api.messages,
	setRoomForInsight: vi.fn(),
}));
const stores: ReturnType<typeof createAssistantStore>[] = [];
const makeStore = () => {
	const workbench = createWorkbenchStore({
		components: {
			[ASSISTANT_TOOL_PANEL_TYPE]: { name: "Tool", content: () => null },
		},
	});
	const store = createAssistantStore({ workbenchId: "test", workbench });
	store.setState({ insightId: "insight", roomId: "conversation" });
	stores.push(store);
	return { store, workbench };
};
const action = {
	actionId: "action",
	runId: "child",
	toolCallId: "call",
	parentMessageId: "message",
	toolName: "Tool",
	toolArgs: {},
	editedArgs: null,
	toolMeta: null,
	hasUi: true,
	uiUrl: null,
	status: "PENDING",
};
const snapshot = {
	runId: "child",
	roomId: "child-room",
	parentRunId: "root",
	status: "INPUT_REQUIRED" as const,
	pendingActions: [action],
};
const tool = {
	id: "call",
	name: "Tool",
	timestamp: "",
	status: "QUEUED",
	metadata: {
		SMSS_MCP_UI: {
			autoOpen: true,
			displayLocation: "sidebar",
			resourceURI: "system://automation/form",
		},
	},
};
beforeEach(() => {
	vi.resetAllMocks();
	api.handlers.clear();
	api.finish.clear();
	api.messages.mockResolvedValue([]);
	api.options.mockResolvedValue({});
	api.get.mockResolvedValue(snapshot);
	api.children.mockResolvedValue([]);
});
afterEach(() => {
	for (const store of stores.splice(0)) store.getState().destroy();
});

describe("assistant tool panel lifecycle", () => {
	it("opens live ready calls once, respects manual closure, and supports manual reopening", async () => {
		const { store, workbench } = makeStore();
		await store.getState().reconcileRun("child");
		store.setState({
			runs: { child: { ...store.getState().runs.child, tools: [tool] } },
		});
		const handler = api.handlers.get("child");
		expect(handler).toBeDefined();
		handler?.onSnapshot(snapshot, { droppedEvents: 0 });
		let panels = workbench
			.getState()
			.layout.actions.findPanels(
				(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
			);
		expect(panels).toHaveLength(1);
		expect(panels[0].config).toEqual({
			conversationId: "conversation",
			runId: "child",
			toolCallId: "call",
		});
		workbench.getState().layout.actions.closePanel(panels[0].id);
		handler?.onSnapshot(snapshot, { droppedEvents: 0 });
		expect(
			workbench
				.getState()
				.layout.actions.findPanels(
					(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
				),
		).toHaveLength(0);
		store.getState().openToolPanel("child", "call");
		panels = workbench
			.getState()
			.layout.actions.findPanels(
				(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
			);
		expect(panels).toHaveLength(1);
		await store.getState().resumeRoom("other");
		expect(
			workbench
				.getState()
				.layout.actions.findPanels(
					(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
				),
		).toHaveLength(0);
		handler?.onSnapshot(snapshot, { droppedEvents: 0 });
		expect(store.getState().runs.child).toBeUndefined();
	});
	it("opens restored pending calls once without waiting for their live subscription", async () => {
		const { store, workbench } = makeStore();
		api.get.mockResolvedValue({
			...snapshot,
			messages: [
				{
					messageId: "message",
					agentRun: { runId: "child" },
					parts: [
						{
							type: "TOOL_CALL",
							toolCall: {
								id: "call",
								name: "Tool",
								_meta: tool.metadata,
							},
						},
					],
				},
			],
		});
		await store.getState().reconcileRun("child");
		const panels = workbench
			.getState()
			.layout.actions.findPanels(
				(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
			);
		expect(panels).toHaveLength(1);
		workbench.getState().layout.actions.closePanel(panels[0].id);
		api.handlers.get("child")?.onSnapshot(snapshot, { droppedEvents: 0 });
		expect(
			workbench
				.getState()
				.layout.actions.findPanels(
					(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
				),
		).toHaveLength(0);
	});
	it.each([false, undefined])(
		"opens pending-only sidebar calls with autoOpen=%s, once per action",
		async (autoOpen) => {
			const { store, workbench } = makeStore();
			const pending = {
				...snapshot,
				pendingActions: [
					{
						...action,
						toolMeta: {
							SMSS_MCP_UI: {
								displayLocation: "sidebar",
								resourceURI: "system://automation/form",
								autoOpen,
							},
						},
					},
				],
			};
			api.get.mockResolvedValue(pending);
			await store.getState().reconcileRun("child");
			const panels = () =>
				workbench
					.getState()
					.layout.actions.findPanels(
						(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
					);
			expect(panels()).toHaveLength(1);
			workbench.getState().layout.actions.closePanel(panels()[0].id);
			await store.getState().reconcileRun("child");
			api.handlers
				.get("child")
				?.onSnapshot(pending, { droppedEvents: 0 });
			expect(panels()).toHaveLength(0);
			api.handlers.get("child")?.onSnapshot(
				{
					...pending,
					pendingActions: [
						{
							...pending.pendingActions[0],
							actionId: "next-action",
						},
					],
				},
				{ droppedEvents: 0 },
			);
			expect(panels()).toHaveLength(1);
		},
	);
	it("restores a pending batch on room resume and keeps completed history closed", async () => {
		const { store, workbench } = makeStore();
		api.messages.mockResolvedValue([
			{
				messageId: "input",
				io: "INPUT",
				agentRun: { runId: "child" },
				parts: [{ type: "TEXT", text: "Review" }],
			},
		]);
		api.get.mockResolvedValue({
			...snapshot,
			pendingActions: [
				{ ...action, toolMeta: tool.metadata },
				{
					...action,
					actionId: "second",
					toolCallId: "second",
					toolMeta: tool.metadata,
				},
			],
		});
		await store.getState().resumeRoom("restored");
		expect(
			workbench
				.getState()
				.layout.actions.findPanels(
					(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
				),
		).toHaveLength(2);
		api.messages.mockResolvedValue([
			{
				messageId: "input",
				io: "INPUT",
				agentRun: { runId: "history-run" },
				parts: [{ type: "TEXT", text: "Previous review" }],
			},
		]);
		api.get.mockResolvedValue({
			...snapshot,
			runId: "history-run",
			status: "COMPLETED",
			pendingActions: [],
			messages: [
				{
					messageId: "message",
					agentRun: { runId: "history-run" },
					parts: [
						{
							type: "TOOL_CALL",
							toolCall: {
								id: "call",
								name: "Tool",
								_meta: tool.metadata,
							},
						},
					],
				},
			],
		});
		await store.getState().resumeRoom("history");
		expect(
			workbench
				.getState()
				.layout.actions.findPanels(
					(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
				),
		).toHaveLength(0);
	});
	it.each(["inline", "hidden"])(
		"never opens a sidebar for %s pending UI",
		async (displayLocation) => {
			const { store, workbench } = makeStore();
			api.get.mockResolvedValue({
				...snapshot,
				pendingActions: [
					{
						...action,
						toolMeta: {
							SMSS_MCP_UI: {
								displayLocation,
								resourceURI: "system://automation/form",
							},
						},
					},
				],
			});
			await store.getState().reconcileRun("child");
			expect(
				workbench
					.getState()
					.layout.actions.findPanels(
						(panel) => panel.type === ASSISTANT_TOOL_PANEL_TYPE,
					),
			).toHaveLength(0);
		},
	);
	it("serializes UI results and approval buttons, reconciles the owning child, and prevents duplicates", async () => {
		const { store } = makeStore();
		store.setState({ runs: { child: createBuildRunFromRecord(snapshot) } });
		let release: () => void = () => undefined;
		api.result.mockReturnValue(
			new Promise<void>((resolve) => {
				release = resolve;
			}),
		);
		const result = {
			status: "success" as const,
			response: "already performed",
		};
		const first = store.getState().respondTool("child", "action", result);
		const duplicate = store
			.getState()
			.respondTool("child", "action", result);
		const approval = store
			.getState()
			.decideAction("child", "action", "approve");
		expect(api.result).toHaveBeenCalledTimes(1);
		expect(api.decision).not.toHaveBeenCalled();
		release();
		await Promise.all([first, duplicate, approval]);
		expect(api.get).toHaveBeenCalledWith(
			"child",
			{ includeMessages: true },
			"insight",
		);
		await store.getState().respondTool("child", "action", result);
		expect(api.result).toHaveBeenCalledTimes(1);
	});
	it("allows retry after a failed result submission and rejects another run's action", async () => {
		const { store } = makeStore();
		store.setState({ runs: { child: createBuildRunFromRecord(snapshot) } });
		const result = { status: "error" as const, response: "tool failed" };
		api.result.mockRejectedValueOnce(new Error("Unavailable"));
		await expect(
			store.getState().respondTool("child", "action", result),
		).rejects.toThrow("Unavailable");
		await store.getState().respondTool("child", "action", result);
		expect(api.result).toHaveBeenCalledTimes(2);
		await expect(
			store.getState().respondTool("root", "action", result),
		).rejects.toThrow("no longer");
	});
	it("does not turn a duplicate approval result into a follow-up after reconciliation", async () => {
		const { store } = makeStore();
		const submit = vi.fn().mockResolvedValue(true);
		store.setState({
			runs: {
				child: { ...createBuildRunFromRecord(snapshot), tools: [tool] },
			},
			submit,
		});
		const result = {
			status: "success" as const,
			response: '{"META":692.48}',
		};
		await store.getState().respondToolView("child", "call", result);
		expect(api.result).toHaveBeenCalledTimes(1);
		store.setState({
			runs: {
				child: {
					...store.getState().runs.child,
					tools: [tool],
					status: "COMPLETED",
					pendingActions: [],
				},
			},
			activeRunId: null,
		});
		await store.getState().respondToolView("child", "call", result);
		expect(submit).not.toHaveBeenCalled();
		await store.getState().respondToolView("child", "call", {
			...result,
			response: '{"META":693.10}',
			executedParameters: { symbol: "META" },
		});
		expect(submit).toHaveBeenCalledTimes(1);
		expect(submit.mock.calls[0][0]).toContain('"symbol": "META"');
		expect(api.result).toHaveBeenCalledTimes(1);
	});
	it("retains a finished tool result for retry while the assistant is busy or submission fails", async () => {
		const { store } = makeStore();
		const submit = vi
			.fn()
			.mockResolvedValueOnce(false)
			.mockResolvedValue(true);
		store.setState({
			runs: {
				child: {
					...createBuildRunFromRecord(snapshot),
					tools: [tool],
					status: "COMPLETED",
					pendingActions: [],
				},
			},
			activeRunId: "busy",
			submit,
		});
		const result = {
			status: "success" as const,
			response: '{"META":692.48}',
		};
		await expect(
			store.getState().respondToolView("child", "call", result),
		).rejects.toThrow("Wait for the assistant");
		expect(submit).not.toHaveBeenCalled();
		store.setState({ activeRunId: null });
		await expect(
			store.getState().respondToolView("child", "call", result),
		).rejects.toThrow("could not be sent");
		await store.getState().respondToolView("child", "call", result);
		await store.getState().respondToolView("child", "call", result);
		expect(submit).toHaveBeenCalledTimes(2);
		expect(submit.mock.calls[0]).toEqual(submit.mock.calls[1]);
		expect(api.result).not.toHaveBeenCalled();
	});
	it("discards queued UI results when the conversation changes", async () => {
		const { store } = makeStore();
		const submit = vi.fn().mockResolvedValue(true);
		store.setState({
			runs: {
				child: {
					...createBuildRunFromRecord(snapshot),
					tools: [tool],
					status: "COMPLETED",
					pendingActions: [],
				},
			},
			submit,
		});
		const result = { status: "success" as const, response: "done" };
		const pending = store
			.getState()
			.respondToolView("child", "call", result);
		store.getState().dispose();
		store.setState({ roomId: "new-conversation", runs: {} });
		await expect(pending).rejects.toThrow("conversation changed");
		await expect(
			store.getState().respondToolView("child", "call", result),
		).rejects.toThrow("no longer belongs");
		expect(submit).not.toHaveBeenCalled();
	});
	it("starts and reconciles a real assistant follow-up from a completed view without replacing history", async () => {
		const { store } = makeStore();
		const previous = {
			...createBuildRunFromRecord({
				runId: "root",
				roomId: "conversation",
				status: "COMPLETED",
			}),
			tools: [
				{ ...tool, status: "COMPLETED", output: "previous result" },
			],
		};
		store.setState({
			runs: { root: previous },
			roomRunIds: ["root"],
			model: {
				engine_id: "model",
				engine_name: "Model",
				engine_type: "MODEL",
			},
			mcp: [{ id: "project", name: "Tool project", type: "PROJECT" }],
			refreshUsage: vi.fn().mockResolvedValue(undefined),
		});
		api.run.mockResolvedValue({
			runId: "follow-up",
			roomId: "conversation",
			status: "SUBMITTED",
		});
		const pending = store.getState().respondToolView("root", "call", {
			status: "success",
			response: '{"META":692.48}',
		});
		await vi.waitFor(() =>
			expect(api.handlers.has("follow-up")).toBe(true),
		);
		expect(api.run).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				roomId: "conversation",
				engine: "model",
				harnessType: "semoss",
				command: expect.stringContaining("692.48"),
			}),
			"insight",
		);
		const completed: AgentRunSnapshot = {
			runId: "follow-up",
			roomId: "conversation",
			status: "COMPLETED",
			pendingActions: [],
			finalText: "The updated price is 692.48.",
		};
		api.handlers.get("follow-up")?.onReconcile(completed);
		api.finish.get("follow-up")?.(completed);
		await pending;
		expect(store.getState().roomRunIds).toEqual(["root", "follow-up"]);
		expect(store.getState().runs["follow-up"].finalText).toBe(
			completed.finalText,
		);
		expect(store.getState().runs.root.tools[0].output).toBe(
			"previous result",
		);
		expect(api.result).not.toHaveBeenCalled();
	});
});
