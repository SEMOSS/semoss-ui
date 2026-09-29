import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { createMemoryRouter, MemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { TooltipProvider } from "@semoss/ui/next";
import type { Workbench } from "@semoss/workbench";
import { threadMenuTriggerId } from "@/features/collaboration/components/thread-menu.utils";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { selectThreadContext } from "@/features/collaboration/state/collaboration.selectors";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import type { AssistantComposer } from "./assistant-composer";
import { UnifiedThread } from "./unified-thread";
import type { WorkConversation } from "./work-conversation";
import { workSnapshot } from "./work-thread.test-fixtures";

const dock = vi.hoisted(() => ({
	isOpen: false,
	tools: [],
	store: {},
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
	WorkPanelMenu: () => (
		<>
			<button type="button">File</button>
			<button type="button">View</button>
		</>
	),
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

it.each([360, 767, 768, 900, 1440])(
	"uses available content width %i to choose phone or split view",
	async (availableWidth) => {
		width = availableWidth;
		dock.isOpen = true;
		const { container } = render(view(props()));
		await frame();
		expect(sizes(container)).toEqual(
			availableWidth < 768 ? [0, 100] : [60, 40],
		);
		expect(
			screen.getByRole("textbox", { name: "Draft", hidden: true }),
		).toHaveValue("");
		if (availableWidth < 768)
			expect(
				screen.getByRole("button", { name: "Close workbench" }),
			).toHaveFocus();
		else
			expect(
				screen.getByRole("complementary", { name: "Thread workbench" }),
			).toHaveFocus();
	},
);

it.each(["Ask Assistant", "Draft"])(
	"reveals the selected destination through %s without a request",
	(action) => {
		const input = { ...props(), sourceUid: "email-1" };
		render(view(input));
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("region", { name: "Assistant conversation" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Draft" })).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: action }));
		expect(screen.getByRole("textbox", { name: "Draft" })).toBeVisible();
		expect(
			screen.getByText(
				action === "Ask Assistant" ? "assistant" : "draft",
			),
		).toBeVisible();
		expect(
			screen.queryByRole("group", { name: "Thread quick actions" }),
		).not.toBeInTheDocument();
		expect(input.session.reconnect).not.toHaveBeenCalled();
	},
);

it("offers only Assistant without an Outlook source", () => {
	render(view(props()));
	expect(screen.getByRole("button", { name: "Ask Assistant" })).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "Draft" }),
	).not.toBeInTheDocument();
});

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
		screen.queryByRole("textbox", { name: "Draft" }),
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
