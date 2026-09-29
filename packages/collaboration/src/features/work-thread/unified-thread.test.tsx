import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { type ComponentProps, type ReactNode, StrictMode } from "react";
import { createMemoryRouter, MemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { TooltipProvider } from "@semoss/ui/next";
import type { Workbench } from "@semoss/workbench";
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
import type { WorkConversation } from "./work-conversation";
import { workSnapshot } from "./work-thread.test-fixtures";

const dock = vi.hoisted(() => ({
	isOpen: false,
	tools: [],
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
vi.mock("./work-panel-menu", () => ({
	WorkPanelMenu: () => <button type="button">Workspace</button>,
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
			<textarea aria-label="Draft" />
			<input type="file" aria-label="Attachment" />
			<button id={actionsTriggerId} type="button">
				Actions
			</button>
		</div>
	),
}));
vi.mock("@/features/rooms/components/room-run-status", () => ({
	RoomRunStatus: () => null,
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

it("shrinks chat to 60/40, restores a resized split, and retains drafts and attachments", async () => {
	const input = props();
	const { container, rerender } = render(view(input));
	fireEvent.click(screen.getByRole("button", { name: "Ask Assistant" }));
	const draft = screen.getByRole("textbox", { name: "Draft" });
	fireEvent.change(draft, { target: { value: "Keep this text" } });
	const attachment = screen.getByLabelText("Attachment");
	const file = new File(["test"], "notes.txt");
	fireEvent.change(attachment, { target: { files: [file] } });
	dock.isOpen = true;
	rerender(view(input));
	await frame();
	expect(sizes(container)).toEqual([60, 40]);
	fireEvent.keyDown(
		screen.getByRole("separator", {
			name: "Resize conversation and workbench",
		}),
		{ key: "ArrowLeft" },
	);
	expect(sizes(container)).toEqual([55, 45]);
	dock.isOpen = false;
	rerender(view(input));
	await frame();
	expect(sizes(container)).toEqual([100, 0]);
	dock.isOpen = true;
	rerender(view(input));
	await frame();
	expect(sizes(container)).toEqual([55, 45]);
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
		screen.getByRole("button", { name: "Workspace" }),
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
				{ name: "Reply draft" },
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
		if (availableWidth < 768)
			expect(screen.getByText("Thread title")).not.toBeVisible();
		else expect(screen.getByText("Thread title")).toBeVisible();
		expect(screen.getByRole("button", { name: "Workspace" })).toBeVisible();
		expect(sizes(container)).toEqual(
			availableWidth < 768 ? [0, 100] : [60, 40],
		);
		expect(
			screen.getByRole("textbox", { name: "Draft", hidden: true }),
		).toHaveValue("");
		if (availableWidth < 768)
			expect(
				screen.getByRole("button", { name: "Back to conversation" }),
			).toHaveFocus();
		else
			expect(
				screen.getByRole("complementary", { name: "Thread workbench" }),
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
		fireEvent.click(
			screen.getByRole("button", { name: "Draft with assistant" }),
		);
		await waitFor(() =>
			expect(dock.selectPanel).toHaveBeenCalledWith(
				"work-email-draft",
				{ draftId: `reply:${source.id}` },
				{ name: "Reply draft" },
			),
		);
		await waitFor(() => expect(transport.send).toHaveBeenCalledOnce());
		expect(transport.send.mock.calls[0][1]).toMatchObject({
			threadId: input.thread.id,
			selectedSourceMessageId: source.id,
			emailDraft: { draftId: `reply:${source.id}`, body: "" },
		});
		expect(transport.send.mock.calls[0][2].text).toContain(
			"Draft a reply to this email",
		);
		// The conversation is concealed in the mobile layout; repeat the same action programmatically.
		fireEvent.click(
			screen.getByRole("button", {
				name: "Draft with assistant",
				hidden: true,
			}),
		);
		expect(transport.send).toHaveBeenCalledOnce();
		await act(async () =>
			transport.complete(
				`\`\`\`semoss-email-draft\n${JSON.stringify({ sourceMessageId: source.id, body: "Friday works." })}\n\`\`\``,
			),
		);
		expect(screen.getByText("Friday works.")).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("button", {
				name: "Draft with assistant",
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
			transport.complete(
				`\`\`\`semoss-email-draft\n${JSON.stringify({ sourceMessageId: source.id, body: "Friday is confirmed." })}\n\`\`\``,
			),
		);
		expect(screen.getByText("Friday is confirmed.")).toBeInTheDocument();
		// Reopening the local draft card never sends a message.
		fireEvent.click(screen.getByText("Friday is confirmed."));
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
			{ name: "Reply draft" },
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
		transport.complete(
			`\`\`\`semoss-email-draft\n${JSON.stringify({ sourceMessageId: source.id, body: "Reply to selected email." })}\n\`\`\``,
		),
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
	fireEvent.click(screen.getByRole("button", { name: "Ask Assistant" }));
	expect(screen.getByRole("textbox", { name: "Draft" })).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Draft with assistant" }),
	).toBeVisible();
	expect(dock.openWorkbench).not.toHaveBeenCalled();
});

it("offers only Assistant without an Outlook source", () => {
	render(view(props()));
	expect(screen.getByRole("button", { name: "Ask Assistant" })).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "Draft with assistant" }),
	).not.toBeInTheDocument();
});

it("introduces a confirmed fresh thread until the assistant is explicitly opened", () => {
	const input = props();
	input.snapshot.isLoading = true;
	const { rerender } = render(view(input));
	expect(
		screen.queryByRole("heading", { name: "Move this thread forward" }),
	).toBeNull();
	input.snapshot = { ...input.snapshot, isLoading: false };
	rerender(view(input));
	expect(
		screen.getByRole("heading", { name: "Move this thread forward" }),
	).toBeVisible();
	expect(screen.queryByRole("textbox")).toBeNull();
	fireEvent.click(screen.getByRole("button", { name: "Ask Assistant" }));
	expect(
		screen.queryByRole("heading", { name: "Move this thread forward" }),
	).toBeNull();
	expect(screen.getByRole("textbox", { name: "Draft" })).toBeVisible();
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
	expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
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

it("opens the requested workbench without opening the composer, and returns to the header menu", async () => {
	const input = props();
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
		screen.queryByRole("textbox", { name: "Draft with assistant" }),
	).not.toBeInTheDocument();
	expect(router.state.location.state).toEqual({});
	fireEvent.click(screen.getByRole("button", { name: "Close workbench" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Thread actions" }),
		).toHaveFocus(),
	);
	// Selecting the action again must focus an already-open workbench as well.
	await act(() =>
		router.navigate(`/work/thread/${input.thread.id}`, {
			replace: true,
			state: {
				threadWorkbench: { id: "open-two", threadId: input.thread.id },
			},
		}),
	);
	await waitFor(() =>
		expect(
			screen.getByRole("complementary", { name: "Thread workbench" }),
		).toHaveFocus(),
	);
	expect(dock.openWorkbench).toHaveBeenCalledTimes(2);
});

it("keeps Workspace inside the workbench and out of the conversation header", async () => {
	const input = props();
	const { rerender } = render(view(input));
	const header = screen.getByText("Thread title").closest("header");
	expect(
		screen.queryByRole("button", { name: "Workspace" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: "Open workbench" }),
	).not.toBeInTheDocument();
	dock.isOpen = true;
	rerender(view(input));
	await frame();
	const menu = screen.getByRole("button", { name: "Workspace" });
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
	expect(screen.getByRole("button", { name: "Workspace" })).toBe(menu);
});
