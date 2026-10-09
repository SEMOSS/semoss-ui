import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { CollaborationWorkbenchLayoutContext } from "@/features/collaboration/components/collaboration-workbench-layout.context";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import type { ConversationMessage } from "@/features/messages/types/message";
import { RoomReadContext } from "@/features/room-tree/room-read.context";
import type { Session } from "@/types/session";
import { RoomSession } from "../room-session";
import { RoomWorkspace } from "./room-workspace";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({
		t: (key: string, options?: { name?: string }) =>
			key === "contextItems.remove"
				? `Remove ${options?.name} from your next message`
				: key,
	}),
}));

// what the mocked composer sends
const composerText = vi.hoisted(() => ({ value: "" }));

const workbenchState = vi.hoisted(() => ({
	isOpen: true,
	activeToolId: null as string | null,
	openWorkbench: vi.fn(),
	closeWorkbench: vi.fn(),
	selectPanel: vi.fn(),
	openFile: vi.fn(),
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

// jsdom has no matchMedia; useIsMobile reads it to keep auto-opened decks off phones
beforeEach(() => {
	vi.stubGlobal("matchMedia", () => ({
		matches: false,
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
	}));
});

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
		workbenchState.openFile.mockClear();
	});

	it("opens a PowerPoint linked by a reply it watched live, but not one from history", () => {
		const history: ConversationMessage = {
			id: "old",
			role: "assistant",
			runId: "run-old",
			parts: [
				{ type: "text", text: "Saved [old.pptx](room://old.pptx)." },
			],
		};
		const live: ConversationMessage = {
			id: "agent-run:run-1",
			role: "assistant",
			runId: "run-1",
			parts: [
				{ type: "text", text: "Building [the deck](room://Q3%20%28dr" },
			],
			live: { phase: "executing_tools", hasObservationIssue: false },
		};
		const final: ConversationMessage = {
			id: "final",
			role: "assistant",
			runId: "run-1",
			parts: [
				{
					type: "text",
					text: "Saved [Q3 (draft).pptx](room://Q3%20%28draft%29.pptx) (3 slides). See [notes.md](room://notes.md).",
				},
			],
		};
		const { rerender } = render(
			<RoomWorkspace {...defaultProps} thread={[history]} />,
		);
		rerender(<RoomWorkspace {...defaultProps} thread={[history, live]} />);
		expect(workbenchState.openFile).not.toHaveBeenCalled();
		rerender(<RoomWorkspace {...defaultProps} thread={[history, final]} />);
		rerender(
			<RoomWorkspace
				{...defaultProps}
				thread={[history, { ...final }]}
			/>,
		);
		expect(workbenchState.openFile).toHaveBeenCalledTimes(1);
		expect(workbenchState.openFile).toHaveBeenCalledWith(
			"/Q3 (draft).pptx",
			"Q3 (draft).pptx",
		);
	});

	it("opens without an active tool", () => {
		workbenchState.isOpen = false;
		render(<RoomWorkspace {...defaultProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Toggle workbench" }),
		);
		expect(workbenchState.openWorkbench).toHaveBeenCalledWith();
	});

	it("registers only an actual loaded room while its history is available", () => {
		workbenchState.isOpen = false;
		const owner = new RoomSession("test-owner", "room-1");
		const releaseRoom = vi.fn();
		const viewRoom = vi.fn(() => releaseRoom);
		const readContext = { viewRoom };
		const workspace = (isReady?: boolean, isLoadingHistory = false) => (
			<RoomReadContext.Provider value={readContext}>
				<RoomWorkspace
					{...defaultProps}
					roomSnapshot={
						isReady === undefined
							? undefined
							: { ...owner.getSnapshot(), isReady }
					}
					isLoadingHistory={isLoadingHistory}
				/>
			</RoomReadContext.Provider>
		);
		const view = render(workspace());
		expect(viewRoom).not.toHaveBeenCalled();
		view.rerender(workspace(false));
		expect(viewRoom).not.toHaveBeenCalled();
		view.rerender(workspace(true, true));
		expect(viewRoom).not.toHaveBeenCalled();
		view.rerender(workspace(true));
		expect(viewRoom).toHaveBeenCalledExactlyOnceWith("room-1");
		view.rerender(workspace(true));
		expect(viewRoom).toHaveBeenCalledOnce();
		view.rerender(workspace(true, true));
		expect(releaseRoom).toHaveBeenCalledOnce();
		view.unmount();
		owner.dispose();
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

	it("registers only an open shell workbench and keeps its conversation mounted", () => {
		workbenchState.isOpen = false;
		const releaseConversation = vi.fn();
		const registerConversation = vi.fn(() => releaseConversation);
		const shellLayout = { registerConversation };
		const workspace = (showToolWorkbench = true) => (
			<CollaborationWorkbenchLayoutContext.Provider value={shellLayout}>
				<RoomWorkspace
					{...defaultProps}
					showToolWorkbench={showToolWorkbench}
				/>
			</CollaborationWorkbenchLayoutContext.Provider>
		);
		const view = render(workspace());
		const conversation = screen.getByRole("region", {
			name: "Communication thread",
		});
		const wrapper = conversation.parentElement;
		expect(registerConversation).not.toHaveBeenCalled();
		expect(wrapper).not.toHaveClass(
			"md:pt-(--collaboration-header-height)",
		);

		workbenchState.isOpen = true;
		view.rerender(workspace());
		expect(registerConversation).toHaveBeenCalledExactlyOnceWith(wrapper);
		expect(wrapper).toHaveClass("md:pt-(--collaboration-header-height)");
		fireEvent.change(screen.getByRole("textbox", { name: "Panel draft" }), {
			target: { value: "Keep the panel draft" },
		});
		view.rerender(workspace());
		expect(registerConversation).toHaveBeenCalledTimes(1);
		expect(
			screen.getByRole("region", { name: "Communication thread" }),
		).toBe(conversation);

		workbenchState.isOpen = false;
		view.rerender(workspace());
		expect(releaseConversation).toHaveBeenCalledOnce();
		expect(wrapper).not.toHaveClass(
			"md:pt-(--collaboration-header-height)",
		);
		workbenchState.isOpen = true;
		view.rerender(workspace());
		expect(registerConversation).toHaveBeenCalledTimes(2);
		expect(
			screen.getByRole("textbox", { name: "Panel draft" }),
		).toHaveValue("Keep the panel draft");
		expect(
			screen.getByRole("region", { name: "Communication thread" }),
		).toBe(conversation);

		view.rerender(workspace(false));
		expect(releaseConversation).toHaveBeenCalledTimes(2);
		expect(wrapper).not.toHaveClass(
			"md:pt-(--collaboration-header-height)",
		);
		view.rerender(workspace());
		expect(registerConversation).toHaveBeenCalledTimes(3);
		view.unmount();
		expect(releaseConversation).toHaveBeenCalledTimes(3);
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
			name: "Remove Project-email.md from your next message",
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
