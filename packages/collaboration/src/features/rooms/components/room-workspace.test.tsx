import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import { Env } from "@semoss/sdk/react";
import { createWorkbenchStore } from "@semoss/workbench";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { CollaborationHeaderLayoutContext } from "@/features/collaboration/components/collaboration-header.context";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import type { ConversationMessage } from "@/features/messages/types/message";
import {
	CALENDAR_BROWSER_PANEL,
	EMAIL_BROWSER_PANEL,
	ONEDRIVE_BROWSER_PANEL,
	ROOM_TASK_PANEL_TYPE,
} from "@/features/room-connectors/room-connectors.constants";
import type { Session } from "@/types/session";
import { showFileOnOpen } from "../room-file-to-show";
import { RoomSession } from "../room-session";
import { roomWorkbenchTriggerId } from "../room-workbench-trigger-id";
import { roomDockStorageKey } from "../use-room-dock-preference";
import { RoomWorkspace } from "./room-workspace";

// what the mocked composer sends
const composerText = vi.hoisted(() => ({ value: "" }));

// one actions object, as the provider gives; the room reads through it what its agent is
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

vi.mock("@semoss/i18n", async (original) => ({
	...(await original<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({
		t: (key: string, values?: { name?: string }) =>
			key === "contextItems.remove"
				? `Remove ${values?.name} from your next message`
				: key,
	}),
}));

const workbenchState = vi.hoisted(() => ({
	insightId: "room-insight",
	isOpen: true,
	activeToolId: null as string | null,
	openWorkbench: vi.fn(),
	closeWorkbench: vi.fn(),
	selectPanel: vi.fn(),
	activatePanel: vi.fn(),
	updatePanel: vi.fn(),
	openFile: vi.fn(),
	returnToBrowser: vi.fn(),
}));

const layoutStore = createWorkbenchStore({
	components: { preview: { name: "Preview" }, files: { name: "Files" } },
});

vi.mock("@/features/room-connectors/room-connectors.context", () => ({
	useRoomConnectors: () => ({
		returnToBrowser: workbenchState.returnToBrowser,
	}),
}));

vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({
		...workbenchState,
		store: {
			subscribe: layoutStore.subscribe,
			getState: () => ({
				layout: {
					...layoutStore.getState().layout,
					actions: {
						selectPanel: workbenchState.selectPanel,
						activatePanel: workbenchState.activatePanel,
						updatePanel: workbenchState.updatePanel,
						resizeBorder:
							layoutStore.getState().layout.actions.resizeBorder,
					},
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

// the header and the thread show what the room hands them about its agent
vi.mock("./room-header", () => ({
	RoomHeader: ({
		onToggleToolWorkbench,
		agentImage,
		agentLine,
		agentDetails,
	}: ComponentProps<typeof import("./room-header")["RoomHeader"]>) => (
		<>
			<button type="button" onClick={onToggleToolWorkbench}>
				Toggle workbench
			</button>
			<output aria-label="Header picture">{agentImage}</output>
			<output aria-label="Header line">{agentLine}</output>
			<output aria-label="Header details">{agentDetails}</output>
		</>
	),
}));

vi.mock("./room-thread", () => ({
	RoomThread: ({ agentImage }: { agentImage?: string }) => (
		<>
			<div>Thread</div>
			<output aria-label="Message picture">{agentImage}</output>
		</>
	),
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
		starterPrompts,
		onSend,
	}: ComponentProps<typeof import("./room-composer")["RoomComposer"]>) => (
		<div className={className}>
			Composer{attachmentSummary}
			<input aria-label="Message draft" defaultValue="" />
			{starterPrompts?.map((prompt) => (
				<span key={prompt.id}>{prompt.title}</span>
			))}
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
	// the read of what the agent is stays out unless a test answers it
	insight.actions.run.mockReset();
	insight.actions.run.mockReturnValue(new Promise(() => undefined));
	layoutStore.getState().layout.actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: ["preview"],
			activeId: "preview",
			enableDeleteWhenEmpty: false,
		},
		panels: {
			preview: { id: "preview", type: "preview", name: "Preview" },
			files: { id: "files", type: "files", name: "Files" },
		},
		borders: {
			left: { panelIds: ["files"], activeId: "files", size: 300 },
		},
	});
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

it("offers source starting points only before the first turn with the source still queued", () => {
	const owner = new RoomSession("starter-test");
	const file = { fileLocation: "source.md", fileName: "Source-email.md" };
	const snapshot = {
		...owner.getSnapshot(),
		source: {
			version: 1 as const,
			threadId: "source",
			title: "Source email",
			channel: "email" as const,
			kind: "brain" as const,
			file,
			messages: [],
		},
		contextFiles: [file],
	};
	const { rerender } = render(
		<RoomWorkspace
			{...defaultProps}
			roomSession={owner}
			roomSnapshot={snapshot}
		/>,
	);
	expect(screen.getByText("Summarize")).toBeVisible();
	expect(screen.getByText("Next steps")).toBeVisible();
	expect(screen.getByText("Draft reply")).toBeVisible();
	rerender(
		<RoomWorkspace
			{...defaultProps}
			roomSession={owner}
			roomSnapshot={{
				...snapshot,
				source: { ...snapshot.source, channel: "calendar" },
			}}
		/>,
	);
	expect(screen.queryByText("Draft reply")).toBeNull();
	rerender(
		<RoomWorkspace
			{...defaultProps}
			roomSession={owner}
			roomSnapshot={{ ...snapshot, contextFiles: [] }}
		/>,
	);
	expect(screen.queryByText("Summarize")).toBeNull();
	rerender(
		<RoomWorkspace
			{...defaultProps}
			roomSession={owner}
			roomSnapshot={snapshot}
			isLoadingHistory
		/>,
	);
	expect(screen.queryByText("Summarize")).toBeNull();
	rerender(
		<RoomWorkspace
			{...defaultProps}
			roomSession={owner}
			roomSnapshot={snapshot}
			thread={[
				{
					id: "existing",
					role: "user",
					parts: [{ type: "text", text: "Existing question" }],
				},
			]}
		/>,
	);
	expect(screen.queryByText("Summarize")).toBeNull();
	owner.dispose();
});

describe("RoomWorkspace", () => {
	beforeEach(() => {
		localStorage.clear();
		workbenchState.isOpen = true;
		workbenchState.activeToolId = null;
		workbenchState.openWorkbench.mockClear();
		workbenchState.closeWorkbench.mockClear();
		workbenchState.selectPanel.mockClear();
		workbenchState.updatePanel.mockClear();
		workbenchState.openFile.mockClear();
		workbenchState.returnToBrowser.mockClear();
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

	it("shows the file a room was opened for, once, when the room comes on screen", () => {
		showFileOnOpen("another-room", {
			path: "other.docx",
			name: "other.docx",
		});
		showFileOnOpen(session.id, {
			path: "Q1 Review.pptx",
			name: "Q1 Review.pptx",
		});
		const { rerender } = render(<RoomWorkspace {...defaultProps} />);
		rerender(<RoomWorkspace {...defaultProps} thread={[]} />);
		expect(workbenchState.openFile).toHaveBeenCalledTimes(1);
		expect(workbenchState.openFile).toHaveBeenCalledWith(
			"Q1 Review.pptx",
			"Q1 Review.pptx",
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

	it("opens Settings, Files, and the Microsoft 365 browsers from the composer", () => {
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
		workbenchState.openWorkbench.mockClear();
		fireEvent.click(screen.getByRole("button", { name: "Open Files" }));
		expect(workbenchState.selectPanel).toHaveBeenCalledWith(
			"file-explorer",
			{ mode: { type: "INSIGHT", insightId: "room-insight" } },
			{
				name: "Files",
				target: { kind: "border", side: "left", index: 0 },
			},
		);
		expect(workbenchState.openWorkbench).toHaveBeenCalledWith(
			undefined,
			expect.any(String),
		);
		for (const [label, browser] of [
			["Open Emails", "mail"],
			["Open Calendar", "calendar"],
			["Open OneDrive", "onedrive"],
			["Open Teams Chats", "teams-chats"],
			["Open Teams Channels", "teams-channels"],
			["Open Teams Files", "teams-files"],
		]) {
			fireEvent.click(screen.getByRole("button", { name: label }));
			expect(workbenchState.returnToBrowser).toHaveBeenLastCalledWith(
				browser,
				"microsoft",
				undefined,
				expect.any(String),
			);
		}
		expect(
			screen.queryByRole("button", { name: "Open workbench" }),
		).not.toBeInTheDocument();
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

	it("keeps the chat and its unsent message while a viewer opens and closes", () => {
		workbenchState.isOpen = false;
		const { rerender } = render(<RoomWorkspace {...defaultProps} />);
		const draft = screen.getByRole("textbox", { name: "Message draft" });
		fireEvent.change(draft, { target: { value: "Thanks Amanda, I will" } });
		const thread = screen.getByText("Thread");
		workbenchState.isOpen = true;
		rerender(<RoomWorkspace {...defaultProps} />);
		workbenchState.isOpen = false;
		rerender(<RoomWorkspace {...defaultProps} />);
		// the same nodes: nothing remounted, so typed text and scroll position stay
		expect(screen.getByRole("textbox", { name: "Message draft" })).toBe(
			draft,
		);
		expect(draft).toHaveValue("Thanks Amanda, I will");
		expect(screen.getByText("Thread")).toBe(thread);
		workbenchState.isOpen = true;
	});

	it("aligns the composer with the message column", () => {
		render(<RoomWorkspace {...defaultProps} />);

		const composer = screen.getByText("Composer");
		expect(composer.parentElement).toHaveClass(
			"mx-auto",
			"w-full",
			"max-w-4xl",
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

	it("fits the browser when the preview closes and restores the saved split without remounting drafts", () => {
		const { container } = render(<RoomWorkspace {...defaultProps} />);
		fireEvent.keyDown(
			screen.getByRole("separator", { name: "Resize tool workbench" }),
			{ key: "ArrowLeft" },
		);
		const draft = screen.getByRole("textbox", { name: "Panel draft" });
		fireEvent.change(draft, {
			target: { value: "Keep the browser state" },
		});
		const dock = container.querySelector<HTMLElement>(
			'[data-panel-id="collaboration-room-tool-workbench"]',
		);
		const actions = layoutStore.getState().layout.actions;
		act(() => actions.closePanel("preview"));
		expect(dock).toHaveStyle({ flexGrow: "0", flexBasis: "364px" });
		expect(
			screen.getByRole("separator", { name: "Resize tool workbench" }),
		).toHaveAttribute("data-panel-resize-handle-enabled", "false");
		act(() => actions.resizeBorder("left", 400));
		expect(dock).toHaveStyle({ flexBasis: "464px" });
		act(() => actions.selectPanel("preview"));
		expect(panelSizes(container)).toEqual([30, 70]);
		expect(dock).toHaveStyle({ flexBasis: "0px" });
		expect(screen.getByRole("textbox", { name: "Panel draft" })).toBe(
			draft,
		);
		expect(draft).toHaveValue("Keep the browser state");
	});

	it("resizes the fitted browser from the room handle within the sidebar's limits and keeps the saved split", () => {
		const { container } = render(<RoomWorkspace {...defaultProps} />);
		const savedSplit = panelSizes(container);
		const handle = screen.getByRole("separator", {
			name: "Resize tool workbench",
		});
		const dock = container.querySelector<HTMLElement>(
			'[data-panel-id="collaboration-room-tool-workbench"]',
		);
		const actions = layoutStore.getState().layout.actions;
		act(() => actions.closePanel("preview"));
		fireEvent.keyDown(handle, { key: "ArrowLeft" });
		expect(dock).toHaveStyle({ flexBasis: "384px" });
		fireEvent.keyDown(handle, { key: "ArrowRight" });
		fireEvent.keyDown(handle, { key: "ArrowRight" });
		expect(dock).toHaveStyle({ flexBasis: "344px" });
		act(() => actions.resizeBorder("left", 630));
		fireEvent.keyDown(handle, { key: "ArrowLeft" });
		expect(layoutStore.getState().layout.borders.left.size).toBe(640);
		act(() => actions.resizeBorder("left", 150));
		fireEvent.keyDown(handle, { key: "ArrowRight" });
		expect(layoutStore.getState().layout.borders.left.size).toBe(140);
		act(() => actions.selectPanel("preview"));
		expect(panelSizes(container)).toEqual(savedSplit);
	});

	it("keeps room controls wide enough as the shared workspace resizes without losing a panel draft", () => {
		let workspaceWidth = 800;
		let resizeWorkspace: () => void = () => undefined;
		const originalRect = HTMLElement.prototype.getBoundingClientRect;
		const geometry = vi
			.spyOn(HTMLElement.prototype, "getBoundingClientRect")
			.mockImplementation(function (this: HTMLElement) {
				return this.firstElementChild?.getAttribute("data-slot") ===
					"resizable-panel-group"
					? new DOMRect(0, 0, workspaceWidth, 800)
					: originalRect.call(this);
			});
		const OriginalResizeObserver = globalThis.ResizeObserver;
		vi.stubGlobal(
			"ResizeObserver",
			class implements ResizeObserver {
				constructor(callback: ResizeObserverCallback) {
					resizeWorkspace = () => callback([], this);
				}
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		);
		try {
			const { container } = render(
				<CollaborationHeaderLayoutContext.Provider value={vi.fn()}>
					<RoomWorkspace {...defaultProps} />
				</CollaborationHeaderLayoutContext.Provider>,
			);
			expect(panelSizes(container)).toEqual([40, 60]);
			const draft = screen.getByRole("textbox", { name: "Panel draft" });
			fireEvent.change(draft, {
				target: { value: "Keep these settings while resizing" },
			});
			const handle = screen.getByRole("separator", {
				name: "Resize tool workbench",
			});
			fireEvent.keyDown(handle, { key: "Home" });
			expect(panelSizes(container)).toEqual([40, 60]);

			act(() => {
				workspaceWidth = 640;
				resizeWorkspace();
			});
			expect(panelSizes(container)).toEqual([50, 50]);
			act(() => {
				workspaceWidth = 1600;
				resizeWorkspace();
			});
			fireEvent.keyDown(handle, { key: "Home" });
			expect(panelSizes(container)).toEqual([20, 80]);
			expect(screen.getByRole("textbox", { name: "Panel draft" })).toBe(
				draft,
			);
			expect(draft).toHaveValue("Keep these settings while resizing");
		} finally {
			vi.stubGlobal("ResizeObserver", OriginalResizeObserver);
			geometry.mockRestore();
		}
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

describe("who the room is with", () => {
	const TWIN_ROW =
		'MyProjects(projectType=["WORKSPACE"], metaFilters=[{"digital_twin":["true"]}], noMeta=[true], project=["agent-1"], limit=[1]);';
	const MINE_ROW =
		'MyProjects(projectType=["WORKSPACE"], metaFilters=[{"digital_twin":["true"]}], noMeta=[true], project=["agent-1"], limit=[1], createdByMe=[true]);';
	/** Answer the two reads that tell what the room's agent is. */
	const answerTwinRead = (rows: Record<string, unknown[]>) =>
		insight.actions.run.mockImplementation(async (pixel: string) => ({
			pixelReturn: [
				{ output: rows[pixel] ?? [], operationType: ["OPERATION"] },
			],
		}));
	const row = (owner?: string) => ({
		project_id: "agent-1",
		project_name: "Renewals Twin",
		digital_twin_owner_name: owner ?? null,
	});
	const withTwin = (name: string, avatar: string) => ({
		...createInitialCollaborationState(),
		mainTwin: { name, avatar, agentId: "collaboration-agent" },
	});

	it.each(["", "collaboration-agent"])(
		"shows the person's own twin for a room the seeded agent runs (agent id %j), with no read",
		async (agentId) => {
			render(
				<CollaborationSessionProvider
					initialState={withTwin(
						"Robin's Digital Twin",
						"data:image/png;base64,AAAA",
					)}
				>
					<RoomWorkspace
						{...defaultProps}
						// the room session names the agent as the chat does
						agent={{ ...agent, name: "Robin's Digital Twin" }}
						session={{ ...session, agentId }}
					/>
				</CollaborationSessionProvider>,
			);
			expect(screen.getByLabelText("Header picture")).toHaveTextContent(
				"data:image/png;base64,AAAA",
			);
			expect(screen.getByLabelText("Message picture")).toHaveTextContent(
				"data:image/png;base64,AAAA",
			);
			expect(screen.getByLabelText("Header line")).toHaveTextContent(
				"Robin's Digital Twin · Private to you",
			);
			// its sentence opens with "Private to you", so its name stands alone over it
			expect(screen.getByLabelText("Header details")).toHaveTextContent(
				/^Robin's Digital TwinPrivate to you\. Works with your mail, Teams, calendar, files, work and routines\.$/,
			);
			// the read that had nothing to ask settles on its own
			await act(async () => undefined);
			expect(insight.actions.run).not.toHaveBeenCalled();
		},
	);

	it("keeps another agent's own image and no message picture, and says what it is once one read has told", async () => {
		answerTwinRead({ [TWIN_ROW]: [row("Dana Ortiz")] });
		render(
			<CollaborationSessionProvider
				initialState={withTwin("Robin's Digital Twin", "")}
			>
				<RoomWorkspace
					{...defaultProps}
					agent={{ ...agent, name: "Renewals Twin" }}
				/>
			</CollaborationSessionProvider>,
		);
		expect(screen.getByLabelText("Header picture")).toHaveTextContent(
			"project-agent-1/projectImage/download",
		);
		expect(screen.getByLabelText("Message picture")).toBeEmptyDOMElement();
		// until the read lands it is an AI agent, and no more is said
		expect(screen.getByLabelText("Header line")).toHaveTextContent(
			"Renewals Twin · AI agent",
		);
		expect(screen.getByLabelText("Header details")).toHaveTextContent(
			/^Renewals Twin · AI agent$/,
		);
		await waitFor(() =>
			expect(screen.getByLabelText("Header line")).toHaveTextContent(
				"Renewals Twin · Shared by Dana Ortiz",
			),
		);
		// the details say the line in full, then what the twin can reach
		expect(screen.getByLabelText("Header details")).toHaveTextContent(
			/^Renewals Twin · Shared by Dana OrtizIt answers only from what its owner shared with it\./,
		);
		expect(
			insight.actions.run.mock.calls.map(([pixel]) => pixel).sort(),
		).toEqual([TWIN_ROW, MINE_ROW].sort());
	});

	it("says a twin the person shares is theirs, and any other agent what it can use", async () => {
		answerTwinRead({ [TWIN_ROW]: [row()], [MINE_ROW]: [row()] });
		const { unmount } = render(<RoomWorkspace {...defaultProps} />);
		await waitFor(() =>
			expect(screen.getByLabelText("Header line")).toHaveTextContent(
				"Research agent · A twin you share",
			),
		);
		expect(screen.getByLabelText("Header details")).toHaveTextContent(
			"It answers only from the copies you gave it.",
		);
		unmount();

		answerTwinRead({});
		render(<RoomWorkspace {...defaultProps} />);
		await waitFor(() =>
			expect(screen.getByLabelText("Header details")).toHaveTextContent(
				"It can use your mail, Teams, calendar, files and work in this chat.",
			),
		);
		expect(screen.getByLabelText("Header line")).toHaveTextContent(
			"Research agent · AI agent",
		);
	});

	it("says nothing of the agent before it while a room's new agent is still being read", async () => {
		answerTwinRead({ [TWIN_ROW]: [row("Dana Ortiz")] });
		const view = render(<RoomWorkspace {...defaultProps} />);
		await waitFor(() =>
			expect(screen.getByLabelText("Header line")).toHaveTextContent(
				"Research agent · Shared by Dana Ortiz",
			),
		);
		// the room is given another agent, whose read stays out
		insight.actions.run.mockReturnValue(new Promise(() => undefined));
		view.rerender(
			<RoomWorkspace
				{...defaultProps}
				agent={{ ...agent, name: "Planning agent" }}
				session={{ ...session, agentId: "agent-2" }}
			/>,
		);
		expect(screen.getByLabelText("Header line")).toHaveTextContent(
			"Planning agent · AI agent",
		);
		expect(screen.getByLabelText("Header details")).toHaveTextContent(
			/^Planning agent · AI agent$/,
		);
	});

	it("says only that it is an AI agent when the read fails, and in a delegated task's room", async () => {
		insight.actions.run.mockRejectedValue(new Error("Offline"));
		const { unmount } = render(<RoomWorkspace {...defaultProps} />);
		await waitFor(() =>
			expect(insight.actions.run).toHaveBeenCalledTimes(2),
		);
		await act(async () => undefined);
		expect(screen.getByLabelText("Header line")).toHaveTextContent(
			"Research agent · AI agent",
		);
		expect(screen.getByLabelText("Header details")).toHaveTextContent(
			/^Research agent · AI agent$/,
		);
		unmount();

		// the seeded agent runs it, yet a delegated task is not a chat with the person's own twin
		insight.actions.run.mockClear();
		const owner = new RoomSession("delegation-test", "room-1");
		render(
			<RoomWorkspace
				{...defaultProps}
				session={{ ...session, agentId: "" }}
				roomSnapshot={{
					...owner.getSnapshot(),
					options: {
						...owner.getSnapshot().options,
						delegation_action_id: "action-1",
					} as never,
				}}
			/>,
		);
		expect(screen.getByLabelText("Header line")).toHaveTextContent(
			"Research agent · AI agent",
		);
		expect(screen.getByLabelText("Header picture")).toBeEmptyDOMElement();
		expect(screen.getByLabelText("Message picture")).toBeEmptyDOMElement();
		expect(screen.getByLabelText("Header details")).toHaveTextContent(
			/^Research agent · AI agent$/,
		);
		await act(async () => undefined);
		expect(insight.actions.run).not.toHaveBeenCalled();
		owner.dispose();
	});
});

/** Loads the dock's rail: Files, Emails, Calendar, OneDrive opened on demand, and the task for a work item chat. */
function loadRail({
	task = false,
	activeId = null,
}: {
	task?: boolean;
	activeId?: string | null;
} = {}) {
	const rail = [
		...(task ? [ROOM_TASK_PANEL_TYPE] : []),
		FILE_PANEL_TYPES.FILE_EXPLORER,
		EMAIL_BROWSER_PANEL,
		CALENDAR_BROWSER_PANEL,
		ONEDRIVE_BROWSER_PANEL,
	];
	layoutStore.getState().layout.actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: ["preview"],
			activeId: "preview",
			enableDeleteWhenEmpty: false,
		},
		panels: {
			preview: { id: "preview", type: "preview", name: "Preview" },
			...Object.fromEntries(
				rail.map((id) => [id, { id, type: id, name: id }]),
			),
		},
		borders: { left: { panelIds: rail, activeId, size: 300 } },
	});
}

describe("RoomWorkspace drawer memory per chat", () => {
	const owner = createInitialCollaborationState().profile.email;
	const deployment = `${window.location.origin}${Env.MODULE}${window.location.pathname}`;
	const keyOf = (roomId: string) =>
		roomDockStorageKey(owner, deployment, roomId);
	const storageKey = keyOf(session.id);
	const activeKey = `${storageKey}:activeTab`;
	const leftRail = { kind: "border", id: "left" };

	/** The room as the given chat. */
	function chat(roomId: string = session.id) {
		return (
			<CollaborationSessionProvider
				initialState={createInitialCollaborationState()}
			>
				<RoomWorkspace
					{...defaultProps}
					session={{ ...session, id: roomId }}
				/>
			</CollaborationSessionProvider>
		);
	}

	beforeEach(() => {
		localStorage.clear();
		loadRail();
		workbenchState.isOpen = false;
		workbenchState.openWorkbench.mockClear();
		workbenchState.closeWorkbench.mockClear();
		workbenchState.selectPanel.mockClear();
		workbenchState.activatePanel.mockClear();
	});

	afterEach(() => {
		workbenchState.isOpen = true;
	});

	it("reopens the drawer the owner left open in this chat, once", () => {
		localStorage.setItem(storageKey, "true");
		const { rerender } = render(chat());
		expect(workbenchState.openWorkbench).toHaveBeenCalledExactlyOnceWith(
			undefined,
			roomWorkbenchTriggerId(session.id),
		);

		rerender(chat());
		rerender(chat());
		expect(workbenchState.openWorkbench).toHaveBeenCalledTimes(1);
	});

	it.each([
		["Files", FILE_PANEL_TYPES.FILE_EXPLORER],
		["Emails", EMAIL_BROWSER_PANEL],
		["Calendar", CALENDAR_BROWSER_PANEL],
		["Task", ROOM_TASK_PANEL_TYPE],
	])(
		"brings the %s tab back before opening the drawer, so the owner sees it and not just the rail",
		(_name, tab) => {
			localStorage.setItem(storageKey, "true");
			localStorage.setItem(activeKey, tab);
			loadRail({ task: tab === ROOM_TASK_PANEL_TYPE });
			render(chat());
			expect(
				workbenchState.activatePanel,
			).toHaveBeenCalledExactlyOnceWith(leftRail, tab);
			expect(workbenchState.openWorkbench).toHaveBeenCalledTimes(1);
			expect(
				workbenchState.activatePanel.mock.invocationCallOrder[0],
			).toBeLessThan(
				workbenchState.openWorkbench.mock.invocationCallOrder[0],
			);
			// never by creating a tab: the one in the rail is shown
			expect(workbenchState.selectPanel).not.toHaveBeenCalled();
		},
	);

	it("only opens when the saved tab is not in the rail now, such as the task of a finished work item", () => {
		localStorage.setItem(storageKey, "true");
		localStorage.setItem(activeKey, ROOM_TASK_PANEL_TYPE);
		render(chat());
		expect(workbenchState.openWorkbench).toHaveBeenCalledTimes(1);
		expect(workbenchState.activatePanel).not.toHaveBeenCalled();
	});

	it("reopens a drawer left on its bare tab rail the same way, with no tab selected", () => {
		localStorage.setItem(storageKey, "true");
		render(chat());
		expect(workbenchState.openWorkbench).toHaveBeenCalledTimes(1);
		expect(workbenchState.activatePanel).not.toHaveBeenCalled();
		expect(workbenchState.selectPanel).not.toHaveBeenCalled();
	});

	it("does not bring back a saved tab it does not know, or one opened on demand", () => {
		for (const saved of [ONEDRIVE_BROWSER_PANEL, "not-a-tab"]) {
			localStorage.setItem(storageKey, "true");
			localStorage.setItem(activeKey, saved);
			const { unmount } = render(chat());
			expect(workbenchState.activatePanel).not.toHaveBeenCalled();
			expect(workbenchState.openWorkbench).toHaveBeenCalledTimes(1);
			unmount();
			workbenchState.openWorkbench.mockClear();
		}
	});

	it("remembers which of the rail's tabs is showing in a drawer the owner left open", () => {
		localStorage.setItem(storageKey, "true");
		workbenchState.isOpen = true;
		loadRail({ task: true, activeId: FILE_PANEL_TYPES.FILE_EXPLORER });
		render(chat());
		expect(localStorage.getItem(activeKey)).toBe(
			FILE_PANEL_TYPES.FILE_EXPLORER,
		);

		for (const tab of [
			FILE_PANEL_TYPES.FILE_EXPLORER,
			EMAIL_BROWSER_PANEL,
			CALENDAR_BROWSER_PANEL,
			ROOM_TASK_PANEL_TYPE,
		]) {
			act(() => loadRail({ task: true, activeId: tab }));
			expect(localStorage.getItem(activeKey)).toBe(tab);
		}

		// a tab opened on demand, and the bare tab rail, count as none
		act(() => loadRail({ activeId: ONEDRIVE_BROWSER_PANEL }));
		expect(localStorage.getItem(activeKey)).toBeNull();
		act(() => loadRail({ activeId: EMAIL_BROWSER_PANEL }));
		expect(localStorage.getItem(activeKey)).toBe(EMAIL_BROWSER_PANEL);
		act(() => loadRail({ activeId: null }));
		expect(localStorage.getItem(activeKey)).toBeNull();
	});

	it("remembers no tab for a drawer that is closed, or that opened by itself and was not left open by the owner", () => {
		loadRail({ activeId: EMAIL_BROWSER_PANEL });
		const closed = render(chat());
		expect(localStorage.length).toBe(0);
		closed.unmount();

		// opened by itself, as for a file or a tool
		workbenchState.isOpen = true;
		const byItself = render(chat());
		act(() => loadRail({ activeId: FILE_PANEL_TYPES.FILE_EXPLORER }));
		expect(localStorage.length).toBe(0);
		byItself.unmount();
	});

	it("selects no tab when the owner opens the drawer by hand, as before", () => {
		render(chat());
		fireEvent.click(
			screen.getByRole("button", { name: "Toggle workbench" }),
		);
		expect(workbenchState.openWorkbench).toHaveBeenCalledTimes(1);
		expect(workbenchState.activatePanel).not.toHaveBeenCalled();
		expect(workbenchState.selectPanel).not.toHaveBeenCalled();
	});

	it("stays closed when nothing was saved, or when the owner left it closed", () => {
		const { unmount } = render(chat());
		expect(workbenchState.openWorkbench).not.toHaveBeenCalled();
		unmount();

		localStorage.setItem(storageKey, "false");
		localStorage.setItem(activeKey, EMAIL_BROWSER_PANEL);
		render(chat());
		expect(workbenchState.openWorkbench).not.toHaveBeenCalled();
		expect(workbenchState.activatePanel).not.toHaveBeenCalled();
	});

	it("remembers each chat on its own: a drawer left open in one chat does not open another", () => {
		localStorage.setItem(keyOf("room-one"), "true");
		localStorage.setItem(
			`${keyOf("room-one")}:activeTab`,
			EMAIL_BROWSER_PANEL,
		);

		const other = render(chat("room-two"));
		expect(workbenchState.openWorkbench).not.toHaveBeenCalled();
		expect(workbenchState.activatePanel).not.toHaveBeenCalled();
		other.unmount();

		render(chat("room-one"));
		expect(workbenchState.openWorkbench).toHaveBeenCalledTimes(1);
		expect(workbenchState.activatePanel).toHaveBeenCalledExactlyOnceWith(
			leftRail,
			EMAIL_BROWSER_PANEL,
		);
	});

	it("does not reopen on a phone, where the dock covers the chat", () => {
		localStorage.setItem(storageKey, "true");
		localStorage.setItem(activeKey, EMAIL_BROWSER_PANEL);
		const width = window.innerWidth;
		window.innerWidth = 500;
		try {
			render(chat());
			expect(workbenchState.openWorkbench).not.toHaveBeenCalled();
			expect(workbenchState.activatePanel).not.toHaveBeenCalled();
		} finally {
			window.innerWidth = width;
		}
	});

	it("leaves an already open drawer as it is", () => {
		localStorage.setItem(storageKey, "true");
		localStorage.setItem(activeKey, EMAIL_BROWSER_PANEL);
		workbenchState.isOpen = true;
		render(chat());
		expect(workbenchState.openWorkbench).not.toHaveBeenCalled();
		expect(workbenchState.closeWorkbench).not.toHaveBeenCalled();
		expect(workbenchState.activatePanel).not.toHaveBeenCalled();
	});

	it("saves an open drawer when the owner opens it with the header toggle", () => {
		render(chat());
		fireEvent.click(
			screen.getByRole("button", { name: "Toggle workbench" }),
		);
		expect(workbenchState.openWorkbench).toHaveBeenCalledTimes(1);
		expect(localStorage.getItem(storageKey)).toBe("true");
	});

	it("forgets the drawer, and its tab, when it closes from any path", () => {
		localStorage.setItem(storageKey, "true");
		localStorage.setItem(activeKey, EMAIL_BROWSER_PANEL);
		workbenchState.isOpen = true;
		const { rerender } = render(chat());
		expect(localStorage.getItem(storageKey)).toBe("true");

		// the dock's own Back to conversation button closes it without the header toggle
		workbenchState.isOpen = false;
		rerender(chat());
		expect(localStorage.getItem(storageKey)).toBeNull();
		expect(localStorage.getItem(activeKey)).toBeNull();
	});

	it("still closes through the header toggle exactly as before", () => {
		workbenchState.isOpen = true;
		render(chat());
		fireEvent.click(
			screen.getByRole("button", { name: "Toggle workbench" }),
		);
		expect(workbenchState.closeWorkbench).toHaveBeenCalledTimes(1);
		expect(workbenchState.openWorkbench).not.toHaveBeenCalled();
	});

	it("saves nothing for a drawer that opens and closes by itself", () => {
		const { rerender } = render(chat());
		workbenchState.isOpen = true;
		rerender(chat());
		workbenchState.isOpen = false;
		rerender(chat());
		expect(localStorage.length).toBe(0);
	});
});
