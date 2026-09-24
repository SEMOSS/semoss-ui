import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useId } from "react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { TOOL_WORKBENCH_COMPONENTS } from "../tool-workbench.components";
import { toolCardTriggerId } from "../tool-workbench.constants";
import { useToolWorkbench } from "../tool-workbench.context";
import { ToolWorkbench } from "./tool-workbench";
import { ToolWorkbenchProvider } from "./tool-workbench-provider";

const tool: ConversationTool = {
	id: "tool-1",
	parentMessageId: "response-1",
	name: "search",
	title: "Search",
	arguments: {},
	status: "RUNNING",
};

function Harness() {
	const workbench = useToolWorkbench();
	return (
		<>
			<span data-testid="inline">
				{String(workbench.isToolInline(tool.id))}
			</span>
			<span data-testid="workbench">
				{String(workbench.isOpen && workbench.activeToolId === tool.id)}
			</span>
			<span data-testid="mode">
				{workbench.getToolDisplayMode(tool.id)}
			</span>
			<button id={toolCardTriggerId(tool.id)} type="button">
				Transcript tool
			</button>
			<button type="button" onClick={() => workbench.openInline(tool.id)}>
				Inline
			</button>
			<button
				type="button"
				onClick={() => workbench.openWorkbench(tool.id)}
			>
				Workbench
			</button>
			<button type="button" onClick={() => workbench.openWorkbench()}>
				Open sidebar
			</button>
			<button type="button" onClick={workbench.closeWorkbench}>
				Hide workbench
			</button>
			<button type="button" onClick={() => workbench.closeTool(tool.id)}>
				Close tool
			</button>
			{workbench.isOpen && <ToolWorkbench />}
		</>
	);
}

function RunFocusHarness() {
	const { isOpen, openRun, closeWorkbench } = useToolWorkbench();
	const runId = useId();
	return isOpen ? (
		<button key="back" type="button" onClick={closeWorkbench}>
			Back to conversation
		</button>
	) : (
		<button
			key="run"
			id={`run-${runId}`}
			type="button"
			onClick={() => openRun(runId)}
		>
			Inspect child
		</button>
	);
}

function renderProvider(
	pendingApprovals: PendingToolApproval[] = [],
	callbacks: {
		onApproveTool?: (
			approval: PendingToolApproval,
			argumentsValue: Record<string, unknown>,
		) => Promise<void>;
		onRejectTool?: (approval: PendingToolApproval) => Promise<void>;
	} = {},
) {
	return render(
		<ToolWorkbenchProvider
			roomId="room-1"
			insightId="insight-1"
			tools={{ [tool.id]: tool }}
			pendingApprovals={pendingApprovals}
			onApproveTool={callbacks.onApproveTool ?? vi.fn()}
			onRejectTool={callbacks.onRejectTool ?? vi.fn()}
		>
			<Harness />
		</ToolWorkbenchProvider>,
	);
}

describe("ToolWorkbenchProvider", () => {
	beforeEach(() => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});
	});

	it("returns focus to a remounted run card after closing the mobile inspector", async () => {
		render(
			<ToolWorkbenchProvider
				roomId="room-1"
				insightId="insight-1"
				tools={{}}
				pendingApprovals={[]}
				onApproveTool={vi.fn()}
				onRejectTool={vi.fn()}
			>
				<RunFocusHarness />
			</ToolWorkbenchProvider>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Inspect child" }));
		expect(
			screen.queryByRole("button", { name: "Inspect child" }),
		).not.toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("button", { name: "Back to conversation" }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Inspect child" }),
			).toHaveFocus(),
		);
	});

	it("keeps the selected panel when the workbench shell mounts", async () => {
		renderProvider();
		fireEvent.click(screen.getByRole("button", { name: "Workbench" }));
		await waitFor(() =>
			expect(screen.getByTestId("workbench").textContent).toBe("true"),
		);
		expect(screen.getByTestId("mode").textContent).toBe("workbench");
		expect(screen.getByRole("tab", { name: "Files" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Hide workbench" }));
		expect(screen.getByTestId("workbench").textContent).toBe("false");
		expect(screen.getByTestId("mode").textContent).toBe("workbench");
		await waitFor(() =>
			expect(document.activeElement?.textContent).toBe("Transcript tool"),
		);
	});

	it("registers editors for files opened from the left rail", () => {
		expect(
			TOOL_WORKBENCH_COMPONENTS[FILE_PANEL_TYPES.FILE_CODE_EDITOR],
		).toBeDefined();
		renderProvider();
		const workbench = screen.getByTestId("mode");
		expect(workbench).toHaveTextContent("hidden");

		// The provider owns the store before the shell is visible, so its seeded
		// explorer and editor registrations must already be present.
		fireEvent.click(screen.getByRole("button", { name: "Workbench" }));
		expect(
			screen.getByTestId(
				`workbench-tab-${FILE_PANEL_TYPES.FILE_EXPLORER}`,
			),
		).toBeInTheDocument();
	});

	it("stays open for files after its last tool closes", async () => {
		renderProvider();
		fireEvent.click(screen.getByRole("button", { name: "Workbench" }));
		expect(screen.getByRole("tab", { name: "Files" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Close tool" }));
		await waitFor(() =>
			expect(screen.getByTestId("mode")).toHaveTextContent("hidden"),
		);
		expect(screen.getByRole("tab", { name: "Files" })).toBeInTheDocument();
	});

	it("opens the sidebar without an active tool", async () => {
		renderProvider();
		fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));

		expect(
			await screen.findByRole("tab", { name: "Files" }),
		).toBeInTheDocument();
	});

	it("opens an approval in the desktop workbench automatically", async () => {
		renderProvider([
			{
				toolId: tool.id,
				parentMessageId: tool.parentMessageId,
				toolName: tool.name,
				arguments: {},
			},
		]);
		await waitFor(() =>
			expect(screen.getByTestId("workbench").textContent).toBe("true"),
		);
		expect(screen.getByTestId("mode").textContent).toBe("workbench");
	});

	it("submits edited approval parameters and announces approval errors", async () => {
		const onApproveTool = vi.fn(async () => {
			throw new Error("Approval could not be saved");
		});
		const approval: PendingToolApproval = {
			toolId: tool.id,
			parentMessageId: tool.parentMessageId,
			toolName: tool.name,
			arguments: { query: "first" },
		};
		renderProvider([approval], { onApproveTool });
		const argumentsEditor = await screen.findByRole("textbox", {
			name: "Tool arguments",
		});
		fireEvent.change(argumentsEditor, {
			target: { value: '{"query":"edited"}' },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Approve and run" }),
		);

		await waitFor(() =>
			expect(onApproveTool).toHaveBeenCalledWith(approval, {
				query: "edited",
			}),
		);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Approval could not be saved",
		);
	});

	it("keeps a rejected approval open when cancellation persistence fails", async () => {
		const onRejectTool = vi.fn(async () => {
			throw new Error("Rejection could not be saved");
		});
		const approval: PendingToolApproval = {
			toolId: tool.id,
			parentMessageId: tool.parentMessageId,
			toolName: tool.name,
			arguments: {},
		};
		renderProvider([approval], { onRejectTool });
		fireEvent.click(await screen.findByRole("button", { name: "Reject" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Rejection could not be saved",
		);
		expect(screen.getByTestId("workbench").textContent).toBe("true");
	});

	it("shows an agent's question and submits a response with its action identity", async () => {
		const onApproveTool = vi.fn().mockResolvedValue(undefined);
		const approval: PendingToolApproval = {
			toolId: tool.id,
			parentMessageId: tool.parentMessageId,
			toolName: "RequestUserInput",
			actionId: "action-1",
			runId: "child-1",
			requiresResponse: true,
			arguments: {
				questions: [
					{
						id: "answer",
						question: "Which report should I use?",
						type: "text",
					},
				],
			},
		};
		renderProvider([approval], { onApproveTool });
		const editor = await screen.findByRole("textbox");
		expect(
			screen.getByText(/Which report should I use/),
		).toBeInTheDocument();
		fireEvent.change(editor, {
			target: { value: "Quarterly report" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Submit answers" }));
		await waitFor(() =>
			expect(onApproveTool).toHaveBeenCalledWith(approval, {
				answer: "Quarterly report",
			}),
		);
	});

	it("moves a tool inline and returns focus when it closes", async () => {
		renderProvider();
		fireEvent.click(screen.getByRole("button", { name: "Inline" }));
		expect(screen.getByTestId("inline").textContent).toBe("true");
		fireEvent.click(screen.getByRole("button", { name: "Close tool" }));
		await waitFor(() =>
			expect(document.activeElement?.textContent).toBe("Transcript tool"),
		);
		expect(screen.getByTestId("mode").textContent).toBe("hidden");
	});
});
