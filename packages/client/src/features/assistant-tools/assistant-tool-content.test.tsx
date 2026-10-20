import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import { AssistantPendingActions } from "@/components/assistant/assistant-pending-actions";
import { AssistantTurn } from "@/components/assistant/assistant-turn";
import { AssistantStoreProvider } from "@/contexts/assistant.context";
import { createBuildRunFromRecord } from "@/stores/assistant/assistant.runs";
import { createAssistantStore } from "@/stores/assistant/assistant.store";
import { AssistantToolActivity } from "./assistant-tool-activity";
import { AssistantToolContent } from "./assistant-tool-content";
import {
	ASSISTANT_TOOL_PANEL,
	AssistantToolPanel,
} from "./assistant-tool-panel";
import {
	ASSISTANT_TOOL_PANEL_TYPE,
	getPresentedTools,
} from "./assistant-tool-ui";

const read = vi.hoisted(() =>
	vi.fn<
		() => {
			status: string;
			data: { project_type?: string };
			error: string | null;
		}
	>(() => ({
		status: "SUCCESS",
		data: { project_type: "CODE" },
		error: null,
	})),
);
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	usePixel: read,
}));
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});
beforeEach(() =>
	read.mockReturnValue({
		status: "SUCCESS",
		data: { project_type: "CODE" },
		error: null,
	}),
);
const run = createBuildRunFromRecord({
	runId: "child",
	roomId: "child-room",
	parentRunId: "root",
	status: "INPUT_REQUIRED",
	pendingActions: [
		{
			actionId: "action",
			runId: "child",
			toolCallId: "call",
			parentMessageId: "message",
			toolName: "Tool",
			toolArgs: { query: "hello" },
			editedArgs: null,
			toolMeta: null,
			hasUi: true,
			uiUrl: null,
			status: "PENDING",
		},
	],
});
const tool = {
	id: "call",
	messageId: "message",
	name: "Tool",
	status: "QUEUED",
	timestamp: "",
	arguments: { query: "hello" },
	metadata: {
		SMSS_MCP_UI: {
			displayLocation: "inline",
			resourceURI: "system://automation/form",
		},
	},
};
const makeStore = () => {
	const store = createAssistantStore({
		workbenchId: "test",
		workbench: createWorkbenchStore({ components: {} }),
	});
	store.setState({
		roomId: "conversation",
		runs: { child: run },
		reconcileRun: vi.fn().mockResolvedValue(undefined),
		respondTool: vi.fn().mockResolvedValue(undefined),
	});
	return store;
};

describe("tool views and embedded protocol", () => {
	it.each(["inline", "sidebar"])(
		"preserves the submitted %s page through approval reconciliation and later results",
		async (displayLocation) => {
			const store = makeStore();
			const workbench = createWorkbenchStore({
				components: {
					[ASSISTANT_TOOL_PANEL_TYPE]: ASSISTANT_TOOL_PANEL,
				},
			});
			const portalTool = {
				...tool,
				metadata: {
					SMSS_PROJECT_ID: "app",
					SMSS_MCP_UI: { displayLocation, resourceURI: "/review" },
				},
			};
			const approvalUrl =
				"/Monolith/public_home/app/portals/review?actionId=action";
			const pendingRun = {
				...run,
				tools: [portalTool],
				pendingActions: [
					{
						...run.pendingActions[0],
						uiUrl: approvalUrl,
						toolMeta: portalTool.metadata,
					},
				],
			};
			const submit = vi.fn().mockResolvedValue(true);
			store.setState({ runs: { child: pendingRun }, submit });
			const panel = workbench
				.getState()
				.layout.actions.selectPanel(ASSISTANT_TOOL_PANEL_TYPE, {
					conversationId: "conversation",
					runId: "child",
					toolCallId: "call",
				});
			render(
				<WorkbenchProvider store={workbench}>
					<AssistantStoreProvider store={store}>
						{displayLocation === "inline" ? (
							<AssistantTurn runId="child" />
						) : (
							<AssistantToolPanel id={panel} />
						)}
					</AssistantStoreProvider>
				</WorkbenchProvider>,
			);
			const frame = screen.getByTitle<HTMLIFrameElement>("Tool");
			const source = frame.contentWindow;
			if (!source) throw new Error("Missing test frame");
			const post = vi.spyOn(source, "postMessage");
			fireEvent.load(frame);
			frame.focus();
			const event = (price = 692.48) =>
				new MessageEvent("message", {
					source,
					origin: window.location.origin,
					data: {
						type: "SMSS_EXEC_TOOL",
						tool: {
							type: "MCP",
							id: "call",
							message: "message",
							name: "Tool",
							response: { META: price },
						},
					},
				});
			await act(async () => window.dispatchEvent(event()));
			expect(store.getState().respondTool).toHaveBeenCalledTimes(1);
			// Approval clears before the durable result arrives. Neither this
			// interval nor the settled arguments/output may reset the page.
			const resumedRun = {
				...pendingRun,
				status: "RUNNING",
				pendingActions: [],
			};
			act(() => store.setState({ runs: { child: resumedRun } }));
			expect(screen.getByTitle("Tool")).toBe(frame);
			expect(frame).toHaveAttribute("src", approvalUrl);
			expect(screen.queryByText("Running tool…")).not.toBeInTheDocument();
			act(() =>
				store.setState({
					runs: {
						child: {
							...resumedRun,
							status: "COMPLETED",
							tools: [
								{
									...portalTool,
									status: "COMPLETED",
									arguments: { query: "META" },
									output: '{"META":692.48}',
								},
							],
						},
					},
				}),
			);
			await act(async () => window.dispatchEvent(event()));
			expect(submit).not.toHaveBeenCalled();
			await act(async () => window.dispatchEvent(event(700)));
			expect(submit).toHaveBeenCalledTimes(1);
			expect(screen.getByTitle("Tool")).toBe(frame);
			expect(frame.contentWindow).toBe(source);
			expect(frame).toHaveAttribute("src", approvalUrl);
			expect(document.activeElement).toBe(frame);
			expect(post).toHaveBeenCalledTimes(1);
			store.getState().destroy();
		},
	);
	it("initializes a different invocation at the same URL after the prior page submits", async () => {
		const store = makeStore();
		const draw = (currentRun: typeof run, currentTool: typeof tool) => (
			<AssistantStoreProvider store={store}>
				<AssistantToolContent run={currentRun} tool={currentTool} />
			</AssistantStoreProvider>
		);
		const view = render(draw(run, tool));
		const frame = screen.getByTitle<HTMLIFrameElement>("Tool");
		fireEvent.load(frame);
		await act(async () =>
			window.dispatchEvent(
				new MessageEvent("message", {
					source: frame.contentWindow,
					origin: window.location.origin,
					data: {
						type: "SMSS_EXEC_TOOL",
						tool: {
							type: "MCP",
							id: "call",
							message: "message",
							name: "Tool",
							response: "done",
						},
					},
				}),
			),
		);
		view.rerender(
			draw(
				{
					...run,
					runId: "another",
					roomId: "another-room",
					pendingActions: [],
				},
				{
					...tool,
					id: "another-call",
					messageId: "another-message",
					status: "COMPLETED",
				},
			),
		);
		const nextFrame = screen.getByTitle<HTMLIFrameElement>("Tool");
		expect(nextFrame).not.toBe(frame);
		expect(screen.getByText("Loading tool UI…")).toBeInTheDocument();
		if (!nextFrame.contentWindow) throw new Error("Missing test frame");
		const post = vi.spyOn(nextFrame.contentWindow, "postMessage");
		fireEvent.load(nextFrame);
		expect(post).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				tool: expect.objectContaining({
					id: "another-call",
					message: "another-message",
					roomId: "another-room",
				}),
			}),
			window.location.origin,
		);
		store.getState().destroy();
	});
	it.each(["INPUT_REQUIRED", "COMPLETED"])(
		"delivers legacy stock-price results from a %s tool view to the assistant",
		async (status) => {
			const store = makeStore();
			const currentTool = {
				...tool,
				status: status === "COMPLETED" ? "COMPLETED" : tool.status,
			};
			const currentRun = {
				...run,
				status,
				tools: [currentTool],
				pendingActions:
					status === "COMPLETED" ? [] : run.pendingActions,
			};
			const submit = vi.fn().mockResolvedValue(true);
			store.setState({ runs: { child: currentRun }, submit });
			const view = render(
				<AssistantStoreProvider store={store}>
					<AssistantToolContent run={currentRun} tool={currentTool} />
				</AssistantStoreProvider>,
			);
			const frame = screen.getByTitle<HTMLIFrameElement>("Tool");
			const event = () =>
				new MessageEvent("message", {
					source: frame.contentWindow,
					origin: window.location.origin,
					data: {
						type: "SMSS_EXEC_TOOL",
						tool: {
							type: "MCP",
							id: "call",
							message: "message",
							name: "Tool",
							response: { META: 692.48 },
						},
					},
				});
			await act(async () => {
				window.dispatchEvent(event());
				window.dispatchEvent(event());
			});
			if (status === "INPUT_REQUIRED") {
				expect(
					store.getState().respondTool,
				).toHaveBeenCalledExactlyOnceWith("child", "action", {
					response: '{"META":692.48}',
					status: "success",
				});
				expect(submit).not.toHaveBeenCalled();
			} else {
				expect(store.getState().respondTool).not.toHaveBeenCalled();
				expect(submit).toHaveBeenCalledTimes(1);
				expect(submit.mock.calls[0][0]).toContain("692.48");
			}
			view.unmount();
			window.dispatchEvent(event());
			expect(submit).toHaveBeenCalledTimes(
				status === "COMPLETED" ? 1 : 0,
			);
			store.getState().destroy();
		},
	);
	it("initializes the frame with owning child context, validates responses, and removes listeners under Strict Mode", async () => {
		const store = makeStore();
		const view = render(
			<StrictMode>
				<AssistantStoreProvider store={store}>
					<AssistantToolContent run={run} tool={tool} />
				</AssistantStoreProvider>
			</StrictMode>,
		);
		const frame = screen.getByTitle<HTMLIFrameElement>("Tool");
		if (!frame.contentWindow) throw new Error("Missing test frame");
		const post = vi.spyOn(frame.contentWindow, "postMessage");
		fireEvent.load(frame);
		expect(
			screen.queryByRole("button", { name: "Approve" }),
		).not.toBeInTheDocument();
		expect(post).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "SMSS_INIT_TOOL",
				tool: expect.objectContaining({
					id: "call",
					roomId: "child-room",
					message: "message",
					parameters: { query: "hello" },
					_meta: tool.metadata,
				}),
			}),
			window.location.origin,
		);
		view.rerender(
			<StrictMode>
				<AssistantStoreProvider store={store}>
					<AssistantToolContent
						run={{
							...run,
							pendingActions: run.pendingActions.map(
								(action) => ({ ...action }),
							),
						}}
						tool={{ ...tool }}
					/>
				</AssistantStoreProvider>
			</StrictMode>,
		);
		expect(screen.getByTitle("Tool")).toBe(frame);
		expect(post).toHaveBeenCalledTimes(1);
		const event = () =>
			new MessageEvent("message", {
				source: frame.contentWindow,
				origin: window.location.origin,
				data: {
					type: "SMSS_EXEC_TOOL",
					tool: {
						type: "MCP",
						id: "call",
						roomId: "child-room",
						message: "message",
						name: "Tool",
						response: "done",
						tool_status: "error",
					},
				},
			});
		await act(async () => window.dispatchEvent(event()));
		expect(store.getState().respondTool).toHaveBeenCalledExactlyOnceWith(
			"child",
			"action",
			{ response: "done", status: "error" },
		);
		view.unmount();
		window.dispatchEvent(event());
		expect(store.getState().respondTool).toHaveBeenCalledTimes(1);
		store.getState().destroy();
	});
	it("keeps a failed result for retry without asking the embedded tool to execute again", async () => {
		const store = makeStore();
		const respond = vi
			.fn()
			.mockRejectedValueOnce(new Error("Try result again"))
			.mockResolvedValue(undefined);
		store.setState({ respondTool: respond });
		render(
			<AssistantStoreProvider store={store}>
				<AssistantToolContent run={run} tool={tool} />
			</AssistantStoreProvider>,
		);
		const frame = screen.getByTitle<HTMLIFrameElement>("Tool");
		if (!frame.contentWindow) throw new Error("Missing test frame");
		const post = vi.spyOn(frame.contentWindow, "postMessage");
		fireEvent.load(frame);
		await act(async () =>
			window.dispatchEvent(
				new MessageEvent("message", {
					source: frame.contentWindow,
					origin: window.location.origin,
					data: {
						type: "SMSS_EXEC_TOOL",
						tool: {
							type: "MCP",
							id: "call",
							roomId: "child-room",
							message: "message",
							name: "Tool",
							response: "done",
							tool_status: "success",
						},
					},
				}),
			),
		);
		await screen.findByText("Try result again");
		fireEvent.click(
			screen.getByRole("button", { name: "Retry result submission" }),
		);
		await waitFor(() => expect(respond).toHaveBeenCalledTimes(2));
		expect(respond.mock.calls[0]).toEqual(respond.mock.calls[1]);
		expect(screen.getByTitle("Tool")).toBe(frame);
		expect(post).toHaveBeenCalledTimes(1);
		store.getState().destroy();
	});
	it("renders inline pages expanded and sidebar buttons separately without loading hidden or unsupported views", () => {
		const store = makeStore();
		const draw = (
			displayLocation: string,
			resourceURI = "system://automation/form",
		) => (
			<AssistantStoreProvider store={store}>
				<AssistantToolActivity
					run={run}
					tool={{
						...tool,
						metadata: {
							SMSS_MCP_UI: { displayLocation, resourceURI },
						},
					}}
				/>
			</AssistantStoreProvider>
		);
		const view = render(draw("inline"));
		expect(screen.getByTitle("Tool")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Open tool" }),
		).not.toBeInTheDocument();
		view.rerender(draw("sidebar"));
		expect(
			screen.getByRole("button", { name: "Open tool" }),
		).toBeInTheDocument();
		expect(screen.queryByTitle("Tool")).not.toBeInTheDocument();
		view.rerender(draw("hidden"));
		expect(view.container).toBeEmptyDOMElement();
		view.rerender(draw("inline", "component://mail/thread"));
		expect(screen.queryByTitle("Tool")).not.toBeInTheDocument();
		store.getState().destroy();
	});
	it("stops accepting frame results after load failure and exposes fallback controls", async () => {
		const store = makeStore();
		render(
			<AssistantStoreProvider store={store}>
				<AssistantToolContent run={run} tool={tool} />
			</AssistantStoreProvider>,
		);
		const frame = screen.getByTitle<HTMLIFrameElement>("Tool");
		const source = frame.contentWindow;
		fireEvent.error(frame);
		expect(
			screen.getByRole("button", { name: "Approve" }),
		).toBeInTheDocument();
		expect(screen.queryByTitle("Tool")).not.toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"could not be loaded",
		);
		await act(async () =>
			window.dispatchEvent(
				new MessageEvent("message", {
					source,
					origin: window.location.origin,
					data: {
						type: "SMSS_EXEC_TOOL",
						tool: {
							type: "MCP",
							id: "call",
							roomId: "child-room",
							message: "message",
							name: "Tool",
							response: "late result",
							tool_status: "success",
						},
					},
				}),
			),
		);
		expect(store.getState().respondTool).not.toHaveBeenCalled();
		store.getState().destroy();
	});
	it.each([
		{ displayLocation: "inline", autoOpen: false },
		{ displayLocation: "inline", autoOpen: undefined },
		{ displayLocation: "sidebar", autoOpen: false },
		{ displayLocation: "sidebar", autoOpen: undefined },
	])(
		"presents a pending-only $displayLocation call with autoOpen=$autoOpen without generic or bulk approval bypass",
		({ displayLocation, autoOpen }) => {
			const store = makeStore();
			const pendingRun = {
				...run,
				pendingActions: [
					{
						...run.pendingActions[0],
						toolMeta: {
							SMSS_MCP_UI: {
								displayLocation,
								resourceURI: "system://automation/form",
								autoOpen,
							},
						},
					},
				],
			};
			store.setState({
				runs: { child: pendingRun },
				openToolPanel: vi.fn(),
			});
			render(
				<AssistantStoreProvider store={store}>
					<AssistantTurn runId="child" />
				</AssistantStoreProvider>,
			);
			expect(
				screen.queryByRole("button", { name: "Approve" }),
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "Approve all" }),
			).not.toBeInTheDocument();
			if (displayLocation === "inline") {
				const frame = screen.getByTitle("Tool");
				act(() =>
					store.setState({
						runs: { child: { ...pendingRun, tools: [tool] } },
					}),
				);
				expect(screen.getAllByTitle("Tool")).toEqual([frame]);
			} else {
				fireEvent.click(
					screen.getByRole("button", { name: "Open tool" }),
				);
				expect(store.getState().openToolPanel).toHaveBeenCalledWith(
					"child",
					"call",
				);
			}
			store.getState().destroy();
		},
	);
	it("loads the resolved approval portal URL and preserves Blocks routing", () => {
		const store = makeStore();
		const pendingRun = {
			...run,
			pendingActions: [
				{
					...run.pendingActions[0],
					uiUrl: "/Monolith/public_home/app/portals/review?actionId=action",
					toolMeta: {
						SMSS_PROJECT_ID: "app",
						SMSS_MCP_UI: { resourceURI: "/review" },
					},
				},
			],
		};
		const draw = () => (
			<AssistantStoreProvider store={store}>
				<AssistantToolContent
					run={pendingRun}
					tool={getPresentedTools(pendingRun)[0]}
				/>
			</AssistantStoreProvider>
		);
		const view = render(draw());
		expect(screen.getByTitle("Tool")).toHaveAttribute(
			"src",
			pendingRun.pendingActions[0].uiUrl,
		);
		read.mockReturnValue({
			status: "SUCCESS",
			data: { project_type: "BLOCKS" },
			error: null,
		});
		view.rerender(draw());
		expect(screen.getByTitle("Tool")).toHaveAttribute(
			"src",
			"./#/s/app/review",
		);
		store.getState().destroy();
	});
	it.each(["ERROR", "LOADING"])(
		"shows %s portal resolution state and exposes fallback controls on failure",
		(status) => {
			const store = makeStore();
			read.mockReturnValue({ status, data: {}, error: "Unavailable" });
			const portal = {
				...tool,
				metadata: {
					SMSS_PROJECT_ID: "app",
					SMSS_MCP_UI: { resourceURI: "/review" },
				},
			};
			render(
				<AssistantStoreProvider store={store}>
					<AssistantToolContent run={run} tool={portal} />
				</AssistantStoreProvider>,
			);
			if (status === "LOADING") {
				expect(
					screen.getByText("Loading tool UI…"),
				).toBeInTheDocument();
				expect(
					screen.queryByRole("button", {
						name: "Approve",
					}),
				).not.toBeInTheDocument();
			} else {
				expect(screen.getByRole("alert")).toHaveTextContent(
					"could not be loaded",
				);
				expect(
					screen.getByRole("button", { name: "Approve" }),
				).toBeInTheDocument();
			}
			store.getState().destroy();
		},
	);
	it("limits bulk approval to generic actions and keeps reconciliation running for UI-only batches", async () => {
		vi.useFakeTimers();
		const store = makeStore();
		const decide = vi.fn().mockResolvedValue(undefined);
		const pendingRun = {
			...run,
			pendingActions: [
				{ ...run.pendingActions[0], toolMeta: tool.metadata },
				{
					...run.pendingActions[0],
					actionId: "generic-one",
					toolCallId: "generic-one",
					toolName: "First",
				},
				{
					...run.pendingActions[0],
					actionId: "generic-two",
					toolCallId: "generic-two",
					toolName: "Second",
				},
			],
		};
		store.setState({ decideAction: decide });
		const view = render(
			<AssistantStoreProvider store={store}>
				<AssistantPendingActions run={pendingRun} />
			</AssistantStoreProvider>,
		);
		await act(async () =>
			fireEvent.click(
				screen.getByRole("button", { name: "Approve all" }),
			),
		);
		expect(decide.mock.calls).toEqual([
			["child", "generic-one", "approve"],
			["child", "generic-two", "approve"],
		]);
		view.rerender(
			<AssistantStoreProvider store={store}>
				<AssistantPendingActions
					run={{
						...pendingRun,
						pendingActions: pendingRun.pendingActions.slice(0, 1),
					}}
				/>
			</AssistantStoreProvider>,
		);
		expect(view.container).toBeEmptyDOMElement();
		await act(async () => vi.advanceTimersByTime(2000));
		expect(store.getState().reconcileRun).toHaveBeenCalledWith("child");
		view.unmount();
		vi.useRealTimers();
		store.getState().destroy();
	});
	it("mounts background approval panels and retains their frames through tab changes", () => {
		const workbench = createWorkbenchStore({
			components: { [ASSISTANT_TOOL_PANEL_TYPE]: ASSISTANT_TOOL_PANEL },
		});
		const store = makeStore();
		const pendingRun = {
			...run,
			pendingActions: [
				{ ...run.pendingActions[0], toolMeta: tool.metadata },
				{
					...run.pendingActions[0],
					actionId: "second",
					toolCallId: "second",
					toolName: "Second",
					toolMeta: tool.metadata,
				},
			],
		};
		store.setState({ runs: { child: pendingRun } });
		const first = workbench
			.getState()
			.layout.actions.selectPanel(ASSISTANT_TOOL_PANEL_TYPE, {
				conversationId: "conversation",
				runId: "child",
				toolCallId: "call",
			});
		const second = workbench
			.getState()
			.layout.actions.selectPanel(ASSISTANT_TOOL_PANEL_TYPE, {
				conversationId: "conversation",
				runId: "child",
				toolCallId: "second",
			});
		render(
			<WorkbenchProvider store={workbench}>
				<AssistantStoreProvider store={store}>
					<AssistantToolPanel id={first} />
					<AssistantToolPanel id={second} />
				</AssistantStoreProvider>
			</WorkbenchProvider>,
		);
		const frame = screen.getByTitle("Tool");
		expect(screen.getByTitle("Second")).toBeInTheDocument();
		expect(ASSISTANT_TOOL_PANEL.mount).toBe("eager");
		act(() =>
			workbench
				.getState()
				.layout.actions.selectPanel(ASSISTANT_TOOL_PANEL_TYPE, {
					conversationId: "conversation",
					runId: "child",
					toolCallId: "call",
				}),
		);
		expect(screen.getByTitle("Tool")).toBe(frame);
		act(() => store.setState({ roomId: "other" }));
		expect(screen.queryByTitle("Tool")).not.toBeInTheDocument();
		expect(
			workbench.getState().layout.actions.findPanels(() => true),
		).toHaveLength(0);
		store.getState().destroy();
	});
});
