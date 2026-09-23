import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import type { Session } from "@/types/session";
import { RoomWorkspace } from "./room-workspace";

const workbenchState = vi.hoisted(() => ({
	isOpen: true,
	activeToolId: null as string | null,
	openWorkbench: vi.fn(),
	closeWorkbench: vi.fn(),
}));

vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => workbenchState,
}));

vi.mock("@/features/tools/components/tool-workbench", () => ({
	ToolWorkbench: () => <div>Tool workbench</div>,
}));

vi.mock("./room-header", () => ({
	RoomHeader: ({
		onToggleToolWorkbench,
	}: {
		onToggleToolWorkbench: () => void;
	}) => (
		<button type="button" onClick={onToggleToolWorkbench}>
			Toggle workbench
		</button>
	),
}));

vi.mock("./room-thread", () => ({
	RoomThread: () => <div>Thread</div>,
}));

vi.mock("./room-run-status", () => ({
	RoomRunStatus: () => <div>Status</div>,
}));

vi.mock("./room-composer", () => ({
	RoomComposer: ({ className }: { className?: string }) => (
		<div className={className}>Composer</div>
	),
}));

const agent: AgentConfiguration = {
	name: "Research agent",
	description: "Research",
	system_prompt: "Research carefully.",
	mcp: [],
	skills: [],
	prompts: [],
};

const session: Session = {
	id: "room-1",
	agentId: "agent-1",
	title: "Research room",
	origin: "You",
	status: "Ready",
	updatedAt: "2026-09-22T00:00:00Z",
	unread: false,
	pinned: false,
	preview: "",
};

const defaultProps: ComponentProps<typeof RoomWorkspace> = {
	agent,
	agentId: session.agentId,
	session,
	thread: [],
	isSending: false,
	isRunning: false,
	isCancelling: false,
	isLoadingHistory: false,
	turnError: null,
	transportError: null,
	pendingApprovals: [],
	phase: null,
	modelId: "model-1",
	modelName: "Model",
	isModelSaving: false,
	modelError: null,
	roomInstructions: "",
	onSendMessage: vi.fn(async () => undefined),
	onModelChange: vi.fn(async () => undefined),
	onOptimizePrompt: vi.fn(async (draft) => draft),
	onCancelTurn: vi.fn(async () => undefined),
	onReconnect: vi.fn(),
	onConfigure: vi.fn(),
};

const panelSizes = (container: HTMLElement): number[] =>
	Array.from(
		container.querySelectorAll<HTMLElement>(
			'[data-slot="resizable-panel"]',
		),
	).map((panel) => Number(panel.style.flexGrow));

describe("RoomWorkspace", () => {
	beforeEach(() => {
		localStorage.clear();
		workbenchState.isOpen = true;
		workbenchState.activeToolId = null;
		workbenchState.openWorkbench.mockClear();
		workbenchState.closeWorkbench.mockClear();
	});

	it("opens without an active tool", () => {
		workbenchState.isOpen = false;
		render(<RoomWorkspace {...defaultProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Toggle workbench" }),
		);
		expect(workbenchState.openWorkbench).toHaveBeenCalledWith(undefined);
	});

	it("aligns the composer with the message column", () => {
		render(<RoomWorkspace {...defaultProps} />);

		const composer = screen.getByText("Composer");
		expect(composer).toHaveClass("mx-auto", "w-full", "max-w-5xl");
		expect(composer.parentElement).toHaveClass(
			"border-t",
			"px-5",
			"lg:px-7",
		);
	});

	it("defaults to 65 percent and restores a resized width after reopening", async () => {
		const { container, rerender } = render(
			<RoomWorkspace {...defaultProps} />,
		);
		expect(panelSizes(container)).toEqual([35, 65]);

		fireEvent.keyDown(
			screen.getByRole("separator", { name: "Resize tool workbench" }),
			{ key: "ArrowLeft" },
		);
		expect(panelSizes(container)).toEqual([30, 70]);
		await waitFor(() =>
			expect(
				localStorage.getItem(
					"react-resizable-panels:collaboration-room-workspace-v1",
				),
			).toContain('"layout":[30,70]'),
		);

		workbenchState.isOpen = false;
		rerender(<RoomWorkspace {...defaultProps} />);
		workbenchState.isOpen = true;
		rerender(<RoomWorkspace {...defaultProps} />);

		expect(panelSizes(container)).toEqual([30, 70]);
	});
});
