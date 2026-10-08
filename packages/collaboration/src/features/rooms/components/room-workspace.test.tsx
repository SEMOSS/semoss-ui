import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import type { Session } from "@/types/session";
import { RoomSession } from "../room-session";
import { RoomWorkspace } from "./room-workspace";

// what the mocked composer sends
const composerText = vi.hoisted(() => ({ value: "" }));

const workbenchState = vi.hoisted(() => ({
	isOpen: true,
	activeToolId: null as string | null,
	openWorkbench: vi.fn(),
	closeWorkbench: vi.fn(),
	selectPanel: vi.fn(),
}));

vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({
		...workbenchState,
		store: {
			getState: () => ({
				layout: {
					actions: { selectPanel: workbenchState.selectPanel },
				},
			}),
		},
	}),
}));

vi.mock("@/features/tools/components/tool-workbench", () => ({
	ToolWorkbench: () => (
		<div>
			Tool workbench
			<input aria-label="Panel draft" defaultValue="" />
		</div>
	),
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
	RoomComposer: ({
		className,
		attachmentSummary,
		panelActions,
		extraCommands,
		onSend,
	}: ComponentProps<typeof import("./room-composer")["RoomComposer"]>) => (
		<div className={className}>
			Composer{attachmentSummary}
			{panelActions?.map((action) => (
				<button key={action.id} type="button" onClick={action.onSelect}>
					{action.label}
				</button>
			))}
			{extraCommands?.map((command) => (
				<span key={command.id}>{command.label}</span>
			))}
			<button
				type="button"
				onClick={() =>
					void onSend({ text: composerText.value, files: [] })
				}
			>
				Send
			</button>
		</div>
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
	roomSettings: { instructions: "", mcp: [] },
	onSendMessage: vi.fn(async () => undefined),
	onModelChange: vi.fn(async () => undefined),
	onSaveRoomSettings: vi.fn(async () => undefined),
	onOptimizePrompt: vi.fn(async (draft) => draft),
	onCancelTurn: vi.fn(async () => undefined),
	onReconnect: vi.fn(),
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
		workbenchState.selectPanel.mockClear();
	});

	it("opens without an active tool", () => {
		workbenchState.isOpen = false;
		render(<RoomWorkspace {...defaultProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Toggle workbench" }),
		);
		expect(workbenchState.openWorkbench).toHaveBeenCalledWith();
	});

	it("opens Settings as a selected panel and allows opening an empty workbench from the composer", () => {
		workbenchState.isOpen = false;
		render(<RoomWorkspace {...defaultProps} />);
		fireEvent.click(screen.getByRole("button", { name: "Settings" }));
		expect(workbenchState.selectPanel).toHaveBeenCalledWith(
			"collaboration-room-settings",
			{},
		);
		expect(workbenchState.openWorkbench).toHaveBeenCalledWith(
			undefined,
			expect.any(String),
		);
		workbenchState.selectPanel.mockClear();
		fireEvent.click(screen.getByRole("button", { name: "Open workbench" }));
		expect(workbenchState.selectPanel).not.toHaveBeenCalled();
	});

	it("retains unsaved panel state while the workbench is hidden", () => {
		const { rerender } = render(<RoomWorkspace {...defaultProps} />);
		fireEvent.change(screen.getByRole("textbox", { name: "Panel draft" }), {
			target: { value: "Keep these settings" },
		});
		workbenchState.isOpen = false;
		rerender(<RoomWorkspace {...defaultProps} />);
		expect(
			screen.queryByRole("complementary", { name: "Tool workbench" }),
		).not.toBeInTheDocument();
		workbenchState.isOpen = true;
		rerender(<RoomWorkspace {...defaultProps} />);
		expect(
			screen.getByRole("textbox", { name: "Panel draft" }),
		).toHaveValue("Keep these settings");
	});

	it("aligns the composer with the message column", () => {
		render(<RoomWorkspace {...defaultProps} />);

		const composer = screen.getByText("Composer");
		expect(composer.parentElement).toHaveClass(
			"mx-auto",
			"w-full",
			"max-w-3xl",
		);
		expect(composer.parentElement?.parentElement).toHaveClass(
			"px-4",
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

it("visibly queues the imported source file and allows removal before the first message", () => {
	const owner = new RoomSession("test-owner", "room-1");
	const remove = vi.spyOn(owner, "removeContextFile");
	const file = {
		fileName: "Project-email.md",
		fileLocation: "Project-email.md",
	};
	workbenchState.isOpen = false;
	render(
		<RoomWorkspace
			{...defaultProps}
			roomSession={owner}
			roomSnapshot={{ ...owner.getSnapshot(), contextFiles: [file] }}
		/>,
	);
	expect(screen.getByText(file.fileName)).toBeVisible();
	expect(
		screen.queryByRole("complementary", { name: "Tool workbench" }),
	).not.toBeInTheDocument();
	fireEvent.click(
		screen.getByRole("button", {
			name: "Remove Project-email.md from context",
		}),
	);
	expect(remove).toHaveBeenCalledWith(file.fileLocation);
	owner.dispose();
});

function OwnMemories() {
	const { state } = useCollaborationSession();
	return (
		<output aria-label="Own memories">
			{state.memories
				.filter((memory) => memory.id.startsWith("local-"))
				.map((memory) => `${memory.kind}:${memory.text}`)
				.join("|")}
		</output>
	);
}

it("saves /remember as the owner's memory without asking the assistant", async () => {
	const onSendMessage = vi.fn(async () => undefined);
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<RoomWorkspace {...defaultProps} onSendMessage={onSendMessage} />
			<OwnMemories />
		</CollaborationSessionProvider>,
	);
	expect(screen.getByText("/remember")).toBeInTheDocument();
	composerText.value = "/remember Always cc Dana on Acme emails";
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Own memories")).toHaveTextContent(
			"preference:Always cc Dana on Acme emails",
		),
	);
	expect(onSendMessage).not.toHaveBeenCalled();

	composerText.value = "What did Dana ask for?";
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	expect(onSendMessage).toHaveBeenCalledWith({
		text: "What did Dana ask for?",
		files: [],
	});
});

it("offers /remember only inside a collaboration session", () => {
	const onSendMessage = vi.fn(async () => undefined);
	render(<RoomWorkspace {...defaultProps} onSendMessage={onSendMessage} />);
	expect(screen.queryByText("/remember")).not.toBeInTheDocument();
	composerText.value = "/remember Always cc Dana on Acme emails";
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	expect(onSendMessage).toHaveBeenCalledWith({
		text: "/remember Always cc Dana on Acme emails",
		files: [],
	});
});

it("keeps reconnect available for an unconfirmed send even when the run has failed", () => {
	const owner = new RoomSession("test-owner", "room-1");
	const reconnect = vi.fn();
	render(
		<RoomWorkspace
			{...defaultProps}
			onReconnect={reconnect}
			turnError="Connection lost"
			roomSnapshot={{
				...owner.getSnapshot(),
				hasUnconfirmedSubmission: true,
			}}
		/>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Reconnect" }));
	expect(reconnect).toHaveBeenCalledOnce();
	owner.dispose();
});
