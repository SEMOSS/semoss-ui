import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, type ReactNode, StrictMode, useRef } from "react";
import { createMemoryRouter, MemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { TooltipProvider } from "@semoss/ui/next";
import type { Workbench, WorkbenchChromeButton } from "@semoss/workbench";
import { threadMenuTriggerId } from "@/features/collaboration/components/thread-menu.utils";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { selectThreadContext } from "@/features/collaboration/state/collaboration.selectors";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import type { AssistantComposer } from "./assistant-composer";
import {
	draftTransport,
	pendingDraftInitialization,
} from "./reply-draft.test-fixtures";
import { UnifiedThread } from "./unified-thread";
import { useWorkPanelActions } from "./use-work-panel-actions";
import type { WorkConversation } from "./work-conversation";
import { workSnapshot } from "./work-thread.test-fixtures";

const dock = vi.hoisted(() => ({
	isOpen: false,
	tools: [],
	pendingApprovals: [],
	onApproveTool: vi.fn(),
	onRejectTool: vi.fn(),
	selectPanel: vi.fn(),
	store: {
		getState: () => ({
			layout: {
				actions: {
					selectPanel: (...args: unknown[]) =>
						dock.selectPanel(...args),
				},
			},
		}),
	},
	snapshot: {},
	closeWorkbench: vi.fn(),
	openWorkbench: vi.fn(),
}));
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => dock,
}));
vi.mock("@semoss/workbench", () => ({
	WorkbenchProvider: ({ children }: { children: ReactNode }) => children,
	WorkbenchChromeButton: ({
		label,
		onClick,
	}: ComponentProps<typeof WorkbenchChromeButton>) => (
		<button type="button" onClick={onClick}>
			{label}
		</button>
	),
	Workbench: ({
		borderSlots,
		mobileTopBorder,
	}: ComponentProps<typeof Workbench>) => {
		const ctx = {
			side: "top" as const,
			vertical: false,
			open: false,
			panelIds: [],
		};
		const before = borderSlots?.top?.before;
		const after = borderSlots?.top?.after;
		return (
			<div data-testid="dock" data-mobile-top-border={mobileTopBorder}>
				<div data-testid="dock-top">
					{typeof before === "function" ? before(ctx) : before}
					{typeof after === "function" ? after(ctx) : after}
				</div>
				Panel content
			</div>
		);
	},
}));
vi.mock("./work-pane-controls", () => ({
	WorkPaneControls: ({
		isChatVisible,
		onToggleChat,
	}: {
		isChatVisible: boolean;
		onToggleChat: () => void;
	}) => (
		<button type="button" onClick={onToggleChat}>
			{isChatVisible ? "Collapse chat" : "Show chat"}
		</button>
	),
}));
vi.mock("./work-pane-layout", () => ({
	chatPanelTarget: () => ({ kind: "join", tabsetId: "tools" }),
	workPanelTarget: () => ({ kind: "join", tabsetId: "work-main" }),
}));
vi.mock("@/features/daily-chat/daily-chat-controls", () => ({
	DailyChatControls: () => {
		const trigger = useRef<HTMLButtonElement>(null);
		const actions = useWorkPanelActions(trigger);
		return (
			<fieldset aria-label="Chat controls">
				<button type="button">Select agent</button>
				<button
					ref={trigger}
					type="button"
					onClick={
						actions.find((action) => action.id === "settings")
							?.onSelect
					}
				>
					Settings
				</button>
				{actions.some((action) => action.id === "emails") && (
					<button type="button">View emails</button>
				)}
			</fieldset>
		);
	},
}));
vi.mock("./work-panel-menu", () => ({
	WorkPanelMenu: () => <button type="button">File</button>,
}));
vi.mock("./work-conversation", () => ({
	WORK_ASSISTANT: {},
	WorkConversation: ({
		actions,
		showAssistant,
	}: ComponentProps<typeof WorkConversation>) => (
		<div>
			Conversation{actions}
			{showAssistant && <section aria-label="Assistant conversation" />}
		</div>
	),
}));
vi.mock("./assistant-composer", () => ({
	AssistantComposer: ({
		actionsTriggerId,
		isOpen,
		composerSession,
	}: ComponentProps<typeof AssistantComposer>) => (
		<div hidden={!isOpen}>
			<output>{composerSession?.getSnapshot().mode}</output>
			<textarea
				aria-label="Draft"
				value={composerSession?.getSnapshot().draft.text ?? ""}
				onChange={(event) => {
					if (!composerSession) return;
					const { revision, draft } = composerSession.getSnapshot();
					composerSession.setDraft(revision, {
						...draft,
						text: event.currentTarget.value,
					});
				}}
			/>
			<input
				type="file"
				aria-label="Attachment"
				onChange={(event) => {
					if (!composerSession) return;
					const { revision, draft } = composerSession.getSnapshot();
					composerSession.setDraft(revision, {
						...draft,
						files: Array.from(event.currentTarget.files ?? []),
					});
				}}
			/>
			<button id={actionsTriggerId} type="button">
				Actions
			</button>
		</div>
	),
}));
vi.mock("@/features/rooms/components/room-run-status", () => ({
	RoomRunStatus: () => null,
}));
vi.mock("@/features/dashboard/brief-context-rail", () => ({
	BriefContextRail: () => <div>Daily context</div>,
}));
vi.mock("@/features/dashboard/brief-suggestions", () => ({
	BriefSuggestions: ({
		onSelect,
		disabled,
		hidden,
	}: {
		onSelect: (prompt: string) => void;
		disabled?: boolean;
		hidden?: boolean;
	}) => (
		<button
			type="button"
			aria-hidden={hidden}
			disabled={disabled || hidden}
			onClick={() => onSelect("Help me plan my day")}
		>
			Help me plan my day
		</button>
	),
}));

let width = 1440;
beforeEach(() => {
	dock.isOpen = false;
	dock.closeWorkbench.mockClear();
	dock.selectPanel.mockClear();
	dock.openWorkbench.mockImplementation(() => {
		dock.isOpen = true;
	});
	dock.openWorkbench.mockClear();
	width = 1440;
	vi.stubGlobal(
		"ResizeObserver",
		class {
			constructor(private callback: ResizeObserverCallback) {}
			observe(target: Element) {
				this.callback(
					[
						{
							target,
							contentRect: new DOMRect(0, 0, width, 800),
							borderBoxSize: [
								{ inlineSize: width, blockSize: 800 },
							],
							contentBoxSize: [
								{ inlineSize: width, blockSize: 800 },
							],
							devicePixelContentBoxSize: [],
						},
					],
					this,
				);
			}
			unobserve() {}
			disconnect() {}
		},
	);
});
afterEach(() => vi.unstubAllGlobals());

function props(): ComponentProps<typeof UnifiedThread> {
	const state = createInitialCollaborationState();
	const thread = state.threads[0];
	const context = selectThreadContext(state, thread.id);
	if (!context) throw new Error("Missing test context");
	return {
		thread,
		workspace: state.workspaces[thread.id],
		context,
		session: { reconnect: vi.fn() } as unknown as ThreadSession,
		snapshot: workSnapshot(),
		header: "Thread title",
		inspector: null,
		attachments: [],
	};
}
function view(input: ComponentProps<typeof UnifiedThread>) {
	return (
		<MemoryRouter>
			<TooltipProvider>
				<UnifiedThread {...input} />
			</TooltipProvider>
		</MemoryRouter>
	);
}
const sizes = (container: HTMLElement) =>
	Array.from(
		container.querySelectorAll<HTMLElement>(
			'[data-slot="resizable-panel"]',
		),
	).map((panel) => Number(panel.style.flexGrow));
const frame = () =>
	act(
		() =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() => resolve()),
			),
	);

it("opens source-free chat settings in the generic dock and returns focus to Settings", async () => {
	const input = { ...props(), isSourceFreeSession: true, isNewChat: true };
	render(view(input));
	expect(screen.queryByRole("button", { name: "View emails" })).toBeNull();
	const trigger = screen.getByRole("button", { name: "Settings" });
	fireEvent.click(trigger);
	await waitFor(() =>
		expect(dock.selectPanel).toHaveBeenCalledWith(
			"work-settings",
			undefined,
			{ name: "Settings", target: { kind: "join", tabsetId: "tools" } },
		),
	);
	await frame();
	fireEvent.click(screen.getByRole("button", { name: "Close workbench" }));
	await waitFor(() => expect(trigger).toHaveFocus());
});

it("shrinks chat to 30/70, restores a resized split, and retains drafts and attachments", async () => {
	const input = props();
	const { container, rerender } = render(view(input));
	const draft = screen.getByRole("textbox", { name: "Draft" });
	fireEvent.change(draft, { target: { value: "Keep this text" } });
	const attachment = screen.getByLabelText("Attachment");
	const file = new File(["test"], "notes.txt");
	fireEvent.change(attachment, { target: { files: [file] } });
	dock.isOpen = true;
	rerender(view(input));
	await frame();
	expect(sizes(container)).toEqual([30, 70]);
	fireEvent.keyDown(
		screen.getByRole("separator", {
			name: "Resize conversation and workbench",
		}),
		{ key: "ArrowLeft" },
	);
	expect(sizes(container)).toEqual([25, 75]);
	dock.isOpen = false;
	rerender(view(input));
	await frame();
	expect(sizes(container)).toEqual([100, 0]);
	dock.isOpen = true;
	rerender(view(input));
	await frame();
	expect(sizes(container)).toEqual([25, 75]);
	expect(screen.getByRole("textbox", { name: "Draft" })).toBe(draft);
	expect(draft).toHaveValue("Keep this text");
	expect((attachment as HTMLInputElement).files?.[0]).toBe(file);
	expect(screen.queryByRole("button", { name: "Expand panel" })).toBeNull();
	expect(screen.queryByRole("button", { name: "Restore split" })).toBeNull();
	expect(screen.getByTestId("dock")).toHaveAttribute(
		"data-mobile-top-border",
		"toolbar",
	);
	expect(screen.getByTestId("dock-top")).toContainElement(
		screen.getByRole("button", { name: "File" }),
	);
	expect(screen.getByTestId("dock-top")).toContainElement(
		screen.getByRole("button", { name: "Close workbench" }),
	);
	fireEvent.click(screen.getByRole("button", { name: "Close workbench" }));
	expect(dock.closeWorkbench).toHaveBeenCalledOnce();
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus(),
	);
});

it.each([
	{ availableWidth: 360, expectedSizes: [0, 100] },
	{ availableWidth: 1440, expectedSizes: [30, 70] },
])(
	"opens an email draft with the larger editing canvas at $availableWidth px",
	async ({ availableWidth, expectedSizes }) => {
		width = availableWidth;
		const input = props();
		const transport = draftTransport();
		input.session = transport.session;
		const source = input.workspace.messages[0];
		const router = createMemoryRouter(
			[
				{
					path: "*",
					element: (
						<TooltipProvider>
							<UnifiedThread {...input} />
						</TooltipProvider>
					),
				},
			],
			{
				initialEntries: [
					{
						pathname: `/work/thread/${input.thread.id}`,
						state: {
							threadAction: {
								id: "reply-from-feed",
								threadId: input.thread.id,
								action: "reply",
								sourceMessageId: source.id,
							},
						},
					},
				],
			},
		);
		const { container } = render(<RouterProvider router={router} />);
		await waitFor(() =>
			expect(dock.selectPanel).toHaveBeenCalledWith(
				"work-email-draft",
				{ draftId: `reply:${source.id}` },
				{
					name: "Reply draft",
					target: { kind: "join", tabsetId: "work-main" },
				},
			),
		);
		await frame();
		expect(dock.openWorkbench).toHaveBeenCalled();
		expect(sizes(container)).toEqual(expectedSizes);
		expect(transport.send).not.toHaveBeenCalled();
	},
);

it.each([360, 767, 768, 900, 1440])(
	"uses available content width %i to choose phone or split view",
	async (availableWidth) => {
		width = availableWidth;
		dock.isOpen = true;
		const { container } = render(view(props()));
		await frame();
		if (availableWidth < 1024)
			expect(screen.getByText("Thread title")).not.toBeVisible();
		else expect(screen.getByText("Thread title")).toBeVisible();
		expect(screen.getByRole("button", { name: "File" })).toBeVisible();
		expect(sizes(container)).toEqual(
			availableWidth < 1024 ? [0, 100] : [30, 70],
		);
		expect(
			screen.getByRole("textbox", { name: "Draft", hidden: true }),
		).toHaveValue("");
		if (availableWidth < 1024)
			expect(
				screen.getByRole("button", { name: "Back to chat" }),
			).toHaveFocus();
	},
);

it.each([360, 1440])(
	"generates and revises the selected reply once at %i px",
	async (availableWidth) => {
		width = availableWidth;
		const input = props();
		const transport = draftTransport();
		const source = input.workspace.messages[0];
		input.sourceUid = source.id;
		input.context = {
			...input.context,
			emptyIds: [...input.context.emptyIds, source.id],
		};
		input.session = transport.session;
		render(view(input));
		fireEvent.click(screen.getByRole("button", { name: "Draft reply" }));
		await waitFor(() =>
			expect(dock.selectPanel).toHaveBeenCalledWith(
				"work-email-draft",
				{ draftId: `reply:${source.id}` },
				{
					name: "Reply draft",
					target: { kind: "join", tabsetId: "work-main" },
				},
			),
		);
		await waitFor(() => expect(transport.send).toHaveBeenCalledOnce());
		expect(transport.send.mock.calls[0][1]).toMatchObject({
			threadId: input.thread.id,
			context: {
				threadId: input.thread.id,
				revision: input.context.revision,
				messages: input.context.messages,
			},
			selectedSourceMessageId: source.id,
			emailDraft: { draftId: `reply:${source.id}`, body: "" },
		});
		expect(transport.send.mock.calls[0][1]).not.toHaveProperty(
			"contextText",
		);
		expect(transport.send.mock.calls[0][2].text).toContain(
			"Draft a reply to this email",
		);
		// The conversation is concealed in the mobile layout; repeat the same action programmatically.
		fireEvent.click(
			screen.getByRole("button", {
				name: "Draft reply",
				hidden: true,
			}),
		);
		expect(transport.send).toHaveBeenCalledOnce();
		await act(async () =>
			transport.complete({
				replyTo: source.id,
				message: "Friday works.",
			}),
		);
		expect(screen.queryByText("Friday works.")).toBeNull();
		fireEvent.click(
			screen.getByRole("button", {
				name: "Draft reply",
				hidden: true,
			}),
		);
		await waitFor(() => expect(transport.send).toHaveBeenCalledTimes(2));
		expect(transport.send.mock.calls[1][1].emailDraft?.body).toBe(
			"Friday works.",
		);
		expect(transport.send.mock.calls[1][2].text).toContain(
			"Revise the current email reply",
		);
		await act(async () =>
			transport.complete({
				replyTo: source.id,
				message: "Friday is confirmed.",
			}),
		);
		expect(screen.queryByText("Friday is confirmed.")).toBeNull();
		// Reopening the local draft card never sends a message.
		expect(transport.send).toHaveBeenCalledTimes(2);
	},
);

it("consumes a menu draft request once while initialization is pending", async () => {
	const input = props();
	const transport = draftTransport();
	const ready = pendingDraftInitialization();
	transport.initialize.mockReturnValueOnce(ready.promise);
	input.session = transport.session;
	input.snapshot = { ...input.snapshot, isLoading: true, isReady: false };
	const source = input.workspace.messages.at(-1);
	if (!source) throw new Error("Missing source fixture");
	input.context = {
		...input.context,
		emptyIds: [...input.context.emptyIds, source.id],
	};
	const request = {
		id: "draft-from-email-menu",
		threadId: input.thread.id,
		action: "draft",
		sourceMessageId: source.id,
	};
	const router = createMemoryRouter(
		[
			{
				path: "*",
				element: (
					<TooltipProvider>
						<UnifiedThread {...input} />
					</TooltipProvider>
				),
			},
		],
		{
			initialEntries: [
				{
					pathname: `/work/thread/${input.thread.id}`,
					state: { threadAction: request },
				},
			],
		},
	);
	render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>,
	);
	await waitFor(() =>
		expect(dock.selectPanel).toHaveBeenCalledWith(
			"work-email-draft",
			{ draftId: `reply:${source.id}` },
			{
				name: "Reply draft",
				target: { kind: "join", tabsetId: "work-main" },
			},
		),
	);
	expect(transport.send).not.toHaveBeenCalled();
	expect(router.state.location.state).toEqual({});
	await act(async () => ready.resolve());
	await waitFor(() => expect(transport.send).toHaveBeenCalledOnce());
	expect(transport.send.mock.calls[0][1].selectedSourceMessageId).toBe(
		source.id,
	);
	await act(async () =>
		transport.complete({
			replyTo: source.id,
			message: "Reply to selected email.",
		}),
	);
	await act(() =>
		router.navigate(`/work/thread/${input.thread.id}`, {
			state: { threadAction: request },
		}),
	);
	expect(transport.send).toHaveBeenCalledOnce();
});

it("opens the assistant independently while keeping reply actions available", () => {
	render(view({ ...props(), sourceUid: "email-1" }));
	expect(screen.getByRole("textbox", { name: "Draft" })).toBeVisible();
	expect(screen.getByRole("button", { name: "Draft reply" })).toBeVisible();
	expect(dock.openWorkbench).not.toHaveBeenCalled();
});

it("offers only Assistant without an Outlook source", () => {
	render(view(props()));
	expect(screen.getByRole("textbox", { name: "Draft" })).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "Draft reply" }),
	).not.toBeInTheDocument();
});

it("shows the composer immediately for fresh threads", () => {
	const input = props();
	const { rerender } = render(view(input));
	expect(screen.getByRole("textbox", { name: "Draft" })).toBeVisible();
	expect(
		screen.queryByRole("heading", { name: "Move this thread forward" }),
	).toBeNull();
	input.snapshot = { ...input.snapshot, isLoading: false };
	rerender(view(input));
	expect(screen.getByRole("textbox", { name: "Draft" })).toBeVisible();
});

it.each(["Riley Warren", "", undefined])(
	"greets a fresh source-free task with profile name %s",
	(userName) => {
		render(
			view({
				...props(),
				isSourceFreeSession: true,
				isNewChat: true,
				userName,
			}),
		);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: userName
					? /Good (morning|afternoon|evening), Riley\./
					: /Good (morning|afternoon|evening)\./,
			}),
		).toBeVisible();
		expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
		expect(
			screen.queryByRole("region", { name: "Assistant welcome" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("group", { name: "Chat controls" }),
		).toBeVisible();
		expect(
			screen.queryByRole("link", { name: "New chat" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("textbox", { name: "Draft" })).toBeVisible();
		expect(screen.getByText("Daily context")).toBeInTheDocument();
		const editor = screen.getByRole("textbox", { name: "Draft" });
		const suggestion = screen.getByRole("button", {
			name: "Help me plan my day",
		});
		expect(
			editor.compareDocumentPosition(suggestion) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(screen.getByText("Thread title")).not.toBeVisible();
		expect(
			screen.queryByRole("region", { name: "Assistant conversation" }),
		).not.toBeInTheDocument();
		expect(dock.openWorkbench).not.toHaveBeenCalled();
	},
);

it("keeps suggestions mounted while text or attachments fill the draft without submitting", () => {
	const transport = draftTransport();
	const onSent = vi.fn();
	const input = {
		...props(),
		session: transport.session,
		isSourceFreeSession: true,
		isNewChat: true,
		onSent,
	};
	const { rerender } = render(view(input));
	const editor = screen.getByRole("textbox", { name: "Draft" });
	const attachment = screen.getByLabelText("Attachment");
	const suggestion = screen.getByRole("button", {
		name: "Help me plan my day",
	});

	input.snapshot = { ...input.snapshot, isPreparing: true };
	rerender(view(input));
	expect(suggestion).toBeDisabled();
	fireEvent.click(suggestion);
	expect(editor).toHaveValue("");
	input.snapshot = { ...input.snapshot, isPreparing: false };
	rerender(view(input));
	fireEvent.click(suggestion);
	expect(editor).toHaveValue("Help me plan my day");
	expect(suggestion).toBeInTheDocument();
	expect(suggestion).toBeDisabled();
	expect(
		screen.queryByRole("button", { name: "Help me plan my day" }),
	).not.toBeInTheDocument();

	fireEvent.change(editor, { target: { value: " " } });
	expect(screen.getByRole("button", { name: "Help me plan my day" })).toBe(
		suggestion,
	);
	expect(suggestion).toBeEnabled();
	const file = new File(["notes"], "notes.txt");
	fireEvent.change(attachment, { target: { files: [file] } });
	expect(suggestion).toBeInTheDocument();
	expect(suggestion).toBeDisabled();
	expect(
		screen.queryByRole("button", { name: "Help me plan my day" }),
	).not.toBeInTheDocument();
	fireEvent.change(attachment, { target: { files: [] } });
	expect(screen.getByRole("button", { name: "Help me plan my day" })).toBe(
		suggestion,
	);
	expect(suggestion).toBeEnabled();
	expect(screen.getByRole("textbox", { name: "Draft" })).toBe(editor);
	expect(transport.send).not.toHaveBeenCalled();
	expect(onSent).not.toHaveBeenCalled();
});

it("keeps the composer, draft, attachments, and focus through the first submission and workbench changes", async () => {
	const input = { ...props(), isSourceFreeSession: true, isNewChat: true };
	const { rerender } = render(view(input));
	const editor = screen.getByRole("textbox", { name: "Draft" });
	const attachment = screen.getByLabelText("Attachment");
	const workbench = screen.getByTestId("dock");
	const file = new File(["notes"], "notes.txt");
	fireEvent.change(editor, { target: { value: "Plan my next step" } });
	fireEvent.change(attachment, { target: { files: [file] } });
	editor.focus();
	input.snapshot = { ...input.snapshot, isPreparing: true };
	rerender(view(input));
	expect(
		screen.getByRole("heading", {
			level: 1,
			name: /Good (morning|afternoon|evening)\./,
		}),
	).toBeVisible();
	expect(screen.getByRole("group", { name: "Chat controls" })).toBeVisible();
	expect(screen.getByText("Daily context")).toBeInTheDocument();
	expect(screen.getByRole("textbox")).toBe(editor);
	expect(editor).toHaveFocus();
	// A rejected preparation stays on the start screen without discarding the draft.
	input.snapshot = { ...input.snapshot, isPreparing: false };
	dock.isOpen = true;
	rerender(view(input));
	await frame();
	expect(screen.queryByText("Daily context")).not.toBeInTheDocument();
	expect(screen.getByTestId("dock")).toBe(workbench);
	expect(screen.getByRole("textbox", { name: "Draft" })).toBe(editor);
	expect(editor).toHaveFocus();
	dock.isOpen = false;
	rerender(view(input));
	await frame();
	expect(
		screen.getByRole("heading", {
			level: 1,
			name: /Good (morning|afternoon|evening)\./,
		}),
	).toBeVisible();
	expect(screen.getByText("Daily context")).toBeInTheDocument();
	expect(screen.getByRole("textbox")).toBe(editor);
	expect(editor).toHaveValue("Plan my next step");
	expect(editor).toHaveFocus();
	expect(screen.getByLabelText("Attachment")).toBe(attachment);
	expect((attachment as HTMLInputElement).files?.[0]).toBe(file);
	input.isNewChat = false;
	input.snapshot = {
		...input.snapshot,
		turn: {
			...input.snapshot.turn,
			messages: [
				{
					id: "first",
					role: "user",
					parts: [{ type: "text", text: "Plan my next step" }],
				},
			],
		},
	};
	rerender(view(input));
	expect(
		screen.getByRole("heading", { level: 1, name: input.thread.subject }),
	).toBeVisible();
	expect(screen.getByRole("group", { name: "Chat controls" })).toBeVisible();
	expect(
		screen.getByRole("region", { name: "Assistant conversation" }),
	).toBeVisible();
	expect(screen.getByRole("textbox")).toBe(editor);
	expect(editor).toHaveFocus();
	expect(screen.getByTestId("dock")).toBe(workbench);
	expect(screen.getByText("Daily context")).toBeInTheDocument();
});

it.each([true, false])(
	"keeps new chat %s drafts and attachments while using Your day with the workbench",
	async (isNewChat) => {
		const user = userEvent.setup();
		const input = { ...props(), isSourceFreeSession: true, isNewChat };
		const { rerender } = render(view(input));
		const editor = screen.getByRole("textbox", { name: "Draft" });
		const attachment = screen.getByLabelText("Attachment");
		const file = new File(["notes"], "notes.txt");
		fireEvent.change(editor, { target: { value: "Keep my daily draft" } });
		fireEvent.change(attachment, { target: { files: [file] } });
		expect(screen.getByText("Daily context")).toBeInTheDocument();

		dock.isOpen = true;
		rerender(view(input));
		await frame();
		expect(screen.queryByText("Daily context")).not.toBeInTheDocument();
		const trigger = screen.getByRole("button", { name: "Your day" });
		trigger.focus();
		await user.keyboard("{Enter}");
		const drawer = screen.getByRole("dialog", { name: "Your day" });
		expect(within(drawer).getByText("Daily context")).toBeVisible();
		expect(drawer).toContainElement(document.activeElement as HTMLElement);
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", { name: "Your day" }),
			).not.toBeInTheDocument(),
		);
		expect(trigger).toHaveFocus();
		expect(screen.getByRole("textbox", { name: "Draft" })).toBe(editor);
		expect(editor).toHaveValue("Keep my daily draft");
		expect(screen.getByLabelText("Attachment")).toBe(attachment);
		expect((attachment as HTMLInputElement).files?.[0]).toBe(file);

		dock.isOpen = false;
		rerender(view(input));
		await frame();
		expect(screen.getByText("Daily context")).toBeInTheDocument();
		expect(screen.getByRole("textbox", { name: "Draft" })).toBe(editor);
		expect(editor).toHaveValue("Keep my daily draft");
	},
);

it("enters the room once a lost first submission is confirmed, without accepting optimistic messages", () => {
	const onSent = vi.fn();
	const input = {
		...props(),
		isSourceFreeSession: true,
		isNewChat: true,
		onSent,
	};
	input.snapshot = {
		...input.snapshot,
		association: {
			roomId: "confirmed-room",
			metadata: {
				version: 1,
				threadId: input.thread.id,
				contextRevision: input.context.revision,
				modelId: "model",
			},
			options: {
				modelId: "model",
				instructions: "",
				mcp: [],
				predefinedPrompts: [],
			},
		},
		turn: {
			...input.snapshot.turn,
			isSubmitting: true,
			isRunning: true,
			messages: [
				{
					id: "first-message",
					role: "user",
					parts: [{ type: "text", text: "Plan my day" }],
				},
			],
		},
	};
	const { rerender } = render(view(input));
	expect(onSent).not.toHaveBeenCalled();
	expect(
		screen.getByRole("heading", {
			level: 1,
			name: /Good (morning|afternoon|evening)\./,
		}),
	).toBeVisible();
	input.snapshot = {
		...input.snapshot,
		hasUnconfirmedSubmission: true,
		turn: {
			...input.snapshot.turn,
			isSubmitting: false,
			isRunning: false,
		},
	};
	rerender(view(input));
	expect(onSent).not.toHaveBeenCalled();
	input.snapshot = {
		...input.snapshot,
		hasUnconfirmedSubmission: false,
		composerResetKey: 1,
	};
	rerender(view(input));
	expect(onSent).toHaveBeenCalledOnce();
	input.onSent = vi.fn();
	rerender(view(input));
	expect(input.onSent).not.toHaveBeenCalled();
});

it.each([
	"not-ready",
	"loading",
	"restoring",
	"failed",
	"transport-error",
	"turn-error",
	"preparing",
	"running",
	"submitting",
	"cancelling",
	"unconfirmed",
	"uncertain",
	"approval",
	"restored",
] as const)("does not show the New Task landing for a %s session", (state) => {
	const input = { ...props(), isSourceFreeSession: true };
	if (state === "not-ready") input.snapshot.isReady = false;
	if (state === "loading") input.snapshot.isLoading = true;
	if (state === "restoring") input.snapshot.turn.isRestoring = true;
	if (state === "failed")
		input.snapshot.error = new Error("History unavailable");
	if (state === "transport-error")
		input.snapshot.turn.transportError = new Error("Connection lost");
	if (state === "turn-error")
		input.snapshot.turn.turnError = "Request failed";
	if (state === "preparing") input.snapshot.isPreparing = true;
	if (state === "running") input.snapshot.turn.isRunning = true;
	if (state === "submitting") input.snapshot.turn.isSubmitting = true;
	if (state === "cancelling") input.snapshot.turn.isCancelling = true;
	if (state === "unconfirmed") input.snapshot.hasUnconfirmedSubmission = true;
	if (state === "uncertain") input.snapshot.isCreationUncertain = true;
	if (state === "approval")
		input.snapshot.turn.pendingApprovals = [
			{
				actionId: "approval",
				runId: "run",
				toolId: "tool",
				parentMessageId: "message",
				toolName: "Review",
				arguments: {},
			},
		];
	if (state === "restored")
		input.snapshot.turn.messages = [
			{
				id: "previous",
				role: "assistant",
				parts: [{ type: "text", text: "Existing answer" }],
			},
		];
	render(view(input));
	expect(
		screen.queryByRole("region", { name: "Assistant welcome" }),
	).not.toBeInTheDocument();
	expect(
		screen.getByRole("heading", { level: 1, name: input.thread.subject }),
	).toBeVisible();
	expect(screen.getByRole("group", { name: "Chat controls" })).toBeVisible();
	expect(screen.getByText("Daily context")).toBeInTheDocument();
});

it.each([
	"loading",
	"restoring",
	"failed",
	"running",
	"submitting",
	"restored",
] as const)(
	"does not show the welcome illustration for %s conversations",
	(state) => {
		const input = props();
		if (state === "loading") input.snapshot.isLoading = true;
		if (state === "restoring") input.snapshot.turn.isRestoring = true;
		if (state === "failed")
			input.snapshot.error = new Error("History unavailable");
		if (state === "running") input.snapshot.turn.isRunning = true;
		if (state === "submitting") input.snapshot.turn.isSubmitting = true;
		if (state === "restored")
			input.snapshot.turn.messages = [
				{
					id: "previous",
					role: "assistant",
					parts: [{ type: "text", text: "Existing answer" }],
				},
			];
		render(view(input));
		expect(
			screen.queryByRole("heading", { name: "Move this thread forward" }),
		).toBeNull();
	},
);

it("waits for history and resumes an existing conversation without flashing actions", () => {
	const input = props();
	input.snapshot.isLoading = true;
	const { rerender } = render(view(input));
	expect(
		screen.queryByRole("group", { name: "Thread quick actions" }),
	).not.toBeInTheDocument();
	expect(screen.getByRole("textbox")).toBeVisible();
	input.snapshot = {
		...input.snapshot,
		isLoading: false,
		turn: {
			...input.snapshot.turn,
			messages: [
				{
					id: "answer",
					role: "assistant",
					parts: [{ type: "text", text: "Existing answer" }],
				},
			],
		},
	};
	rerender(view(input));
	expect(screen.getByRole("textbox")).toBeVisible();
	expect(
		screen.queryByRole("group", { name: "Thread quick actions" }),
	).not.toBeInTheDocument();
});

it("does not classify a failed history load as a fresh thread", () => {
	const input = props();
	input.snapshot.error = new Error("History unavailable");
	render(view(input));
	expect(
		screen.queryByRole("group", { name: "Thread quick actions" }),
	).not.toBeInTheDocument();
});

it.each([false, true])(
	"opens the requested workbench and returns to a visible control for source-free %s",
	async (isSourceFreeSession) => {
		const input = { ...props(), isSourceFreeSession };
		input.header = (
			<button type="button" id={threadMenuTriggerId(input.thread.id)}>
				Thread actions
			</button>
		);
		const router = createMemoryRouter(
			[
				{
					path: "*",
					element: (
						<TooltipProvider>
							<UnifiedThread {...input} />
						</TooltipProvider>
					),
				},
			],
			{
				initialEntries: [
					{
						pathname: `/work/thread/${input.thread.id}`,
						state: {
							threadWorkbench: {
								id: "open-one",
								threadId: input.thread.id,
							},
						},
					},
				],
			},
		);
		render(<RouterProvider router={router} />);
		await waitFor(() =>
			expect(dock.openWorkbench).toHaveBeenCalledExactlyOnceWith(),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("complementary", { name: "Thread workbench" }),
			).toHaveFocus(),
		);
		expect(
			screen.queryByRole("textbox", { name: "Draft reply" }),
		).not.toBeInTheDocument();
		expect(router.state.location.state).toEqual({});
		fireEvent.click(
			screen.getByRole("button", { name: "Close workbench" }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", {
					name: isSourceFreeSession ? "Actions" : "Thread actions",
				}),
			).toHaveFocus(),
		);
		// Selecting the action again must focus an already-open workbench as well.
		await act(() =>
			router.navigate(`/work/thread/${input.thread.id}`, {
				replace: true,
				state: {
					threadWorkbench: {
						id: "open-two",
						threadId: input.thread.id,
					},
				},
			}),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("complementary", { name: "Thread workbench" }),
			).toHaveFocus(),
		);
		expect(dock.openWorkbench).toHaveBeenCalledTimes(2);
	},
);

it("keeps File inside the workbench and out of the conversation header", async () => {
	const input = props();
	const { rerender } = render(view(input));
	const header = screen.getByText("Thread title").closest("header");
	expect(
		screen.queryByRole("button", { name: "File" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: "Open workbench" }),
	).not.toBeInTheDocument();
	dock.isOpen = true;
	rerender(view(input));
	await frame();
	const menu = screen.getByRole("button", { name: "File" });
	const workbench = screen.getByRole("complementary", {
		name: "Thread workbench",
	});
	expect(workbench).toContainElement(menu);
	expect(header).not.toContainElement(menu);
	dock.isOpen = false;
	rerender(view(input));
	await frame();
	expect(menu).not.toBeVisible();
	expect(screen.getByText("Thread title")).toBeVisible();
	dock.isOpen = true;
	rerender(view(input));
	await frame();
	expect(screen.getByRole("button", { name: "File" })).toBe(menu);
});
