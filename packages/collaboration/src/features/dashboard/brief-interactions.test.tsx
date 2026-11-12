import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type {
	CollaborationState,
	Thread,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import {
	type CollaborationChange,
	CollaborationSessionProvider,
} from "@/features/collaboration/state/collaboration-session.context";
import type { InsightActions } from "@/lib/pixel";
import { DashboardPage } from "@/pages/dashboard.page";
import { DashboardContext } from "./dashboard.context";
import { useDashboardLayout } from "./use-dashboard-layout";

vi.mock("@/features/daily-chat/landing-chat-composer", () => ({
	LandingChatComposer: () => (
		<section aria-label="Start a conversation">Chat composer</section>
	),
}));
// Today reads the onboarding flag and the owner's work items from the server; one actions
// object, since those reads rerun whenever it changes
const insight = vi.hoisted(() => ({
	workItems: [] as Record<string, unknown>[],
	workError: "",
	actions: {
		run: vi.fn(async (statement: string) => ({
			pixelReturn: [
				statement.startsWith("WorkListMyWork") && !insight.workError
					? {
							output: {
								selfId: "me",
								workItems: insight.workItems,
							},
							operationType: ["OPERATION"],
						}
					: // an unread connection keeps Today, as a server without the onboarding flag does
						{
							output:
								insight.workError || "Not read in these tests",
							operationType: ["ERROR"],
						},
			],
		})),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

/** A work item as WorkListMyWork returns it. */
const workItem = (index: number) => ({
	id: `task-${index}`,
	title: `Work item ${index}`,
	state: "active",
	mine: true,
	openSteps: [],
});

const storageKey = "brief-interaction-layout";
const request = vi.fn((): never => {
	throw new Error("The brief must not submit an SDK request.");
});
const actions: InsightActions = {
	requestOTP: request,
	login: request,
	logout: request,
	run: request,
	runAsync: request,
	runPy: request,
	askModel: request,
	getRoom: request,
	sendMCPResponseToRoom: request,
	runMCPTool: request,
	queryDatabase: request,
	upload: request,
	download: request,
	uploadApp: request,
	uploadEngine: request,
	uploadInsight: request,
	uploadUser: request,
};

/** A small work queue keeps the tests independent of the demo's changing counts. */
function createBriefState(): CollaborationState {
	const state = createInitialCollaborationState();
	state.profile.name = "Riley Wong";
	state.topics = state.topics.slice(0, 2).map((topic, index) => ({
		...topic,
		id: index === 0 ? "tailspin" : "product",
		name: index === 0 ? "Tailspin Renewal" : "Product Build",
		short: index === 0 ? "Tailspin" : "Product Build",
		status: "active",
	}));
	state.reviews = [];
	state.workspaces = {};
	state.items = [
		{
			id: "pricing",
			threadId: "pricing-thread",
			title: "Confirm revised pricing",
			topicIds: ["tailspin"],
			status: "open",
		},
		{
			id: "support",
			threadId: "support-thread",
			title: "Choose support tier",
			topicIds: ["tailspin"],
			status: "open",
		},
		{
			id: "sprint",
			threadId: "sprint-thread",
			title: "Review the sprint backlog",
			topicIds: ["product"],
			status: "open",
		},
		{
			id: "notes",
			threadId: "notes-thread",
			title: "Send the sprint notes",
			topicIds: ["product"],
			status: "done",
		},
	].map<WorkItem>((item, index) => ({
		...item,
		status: item.status === "done" ? "done" : "open",
		channel: "email",
		actorId: state.profile.id,
		askType: "reply",
		priority: "P2",
		score: 90 - index,
		reasons: [],
		due: null,
		received: "2026-10-06T12:00:00.000Z",
		...(item.status === "done"
			? { completedAt: "2026-10-06T12:30:00.000Z" }
			: {}),
		isSample: true,
	}));
	state.threads = state.items.map<Thread>((item) => ({
		id: item.threadId,
		channel: item.channel,
		subject: item.title,
		topicLinks: item.topicIds.map((topicId) => ({
			topicId,
			source: "confirmed",
			confidence: 100,
			primary: true,
		})),
		participants: [],
		muted: false,
		messageCount: 1,
		lastAt: item.received,
		roomId: null,
		summary: "Review the conversation before replying.",
		isSample: true,
	}));
	return state;
}

function BriefHarness({
	children,
	state,
	onChange,
	calendarError = "",
}: {
	children: ReactNode;
	state: CollaborationState;
	onChange: (change: CollaborationChange) => void;
	calendarError?: string;
}) {
	const layout = useDashboardLayout(storageKey);
	return (
		<CollaborationSessionProvider initialState={state} onChange={onChange}>
			<DashboardContext.Provider
				value={{
					actions,
					layout,
					history: {
						rooms: [],
						closedRoomIds: [],
						setRoomClosed: vi.fn(),
						renameRoom: vi.fn(),
						closeError: "",
						isLoading: false,
						error: "",
						hasMore: false,
						loadMore: vi.fn(),
						refresh: vi.fn(),
						retry: vi.fn(),
						scrollTop: { current: 0 },
					},
					calendar: {
						data: [],
						error: calendarError,
						isLoading: false,
						checkedAt: null,
						refresh: vi.fn(),
					},
					refreshSources: vi.fn(),
					refreshRevision: 0,
					isSearchOpen: false,
					setIsSearchOpen: vi.fn(),
					searchReturnFocus: { current: null },
					sourceReturnFocus: { current: null },
					source: null,
					setSource: vi.fn(),
					openRoom: vi.fn(),
					openingRoom: null,
				}}
			>
				{children}
			</DashboardContext.Provider>
		</CollaborationSessionProvider>
	);
}

function renderBrief(state = createBriefState(), calendarError = "") {
	const onChange = vi.fn<(change: CollaborationChange) => void>();
	const router = createMemoryRouter([
		{ path: "/", Component: DashboardPage },
	]);
	const result = render(
		<BriefHarness
			state={state}
			onChange={onChange}
			calendarError={calendarError}
		>
			<RouterProvider router={router} />
		</BriefHarness>,
	);
	return { ...result, router, onChange };
}

beforeAll(() => {
	// JSDOM does not provide the pointer-capture APIs used by the shared Select.
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

afterEach(() => {
	cleanup();
	localStorage.clear();
	vi.clearAllMocks();
	insight.workItems = [];
	insight.workError = "";
});

it("shows Today as greeting, ask box, your work, Your day and Recent activity without setup panels", () => {
	const { container } = renderBrief();
	expect(
		[
			...container.querySelectorAll(
				"section[aria-label], section[aria-labelledby]",
			),
		].map(
			(region) =>
				region.getAttribute("aria-label") ||
				document.getElementById(
					region.getAttribute("aria-labelledby") || "",
				)?.textContent,
		),
	).toEqual([
		"Start a conversation",
		"Your work",
		"Your day",
		"Recent activity",
	]);
	for (const name of ["Brain wants to check", "Handled", "Needs you"]) {
		expect(screen.queryByRole("region", { name })).not.toBeInTheDocument();
	}
	for (const name of [
		"What do I need to do today?",
		"Prep me for my next meeting",
		"What am I waiting on?",
	]) {
		expect(screen.getByRole("button", { name })).toBeVisible();
	}
	expect(request).not.toHaveBeenCalled();
});

it.each(["disconnected", "failed"])(
	"does not describe an unavailable calendar as a free day when %s",
	(status) => {
		const state = createBriefState();
		state.settings.sourcesJson.calendar = status !== "disconnected";
		renderBrief(
			state,
			status === "failed" ? "Calendar could not be loaded." : "",
		);
		const calendar = within(
			screen.getByRole("region", { name: "Your day" }),
		);
		expect(calendar.queryByText("0 meetings")).not.toBeInTheDocument();
		expect(
			calendar.queryByText("No meetings today. A little room to focus."),
		).not.toBeInTheDocument();
	},
);

it("shows a free day after the calendar has successfully returned no events", () => {
	const state = createBriefState();
	state.settings.sourcesJson.calendar = true;
	renderBrief(state);
	const calendar = within(screen.getByRole("region", { name: "Your day" }));
	expect(calendar.getByText("0 meetings")).toBeVisible();
	expect(
		calendar.getByText("No meetings today. A little room to focus."),
	).toBeVisible();
});

it("greets by the given name for first-last and last-first profile names", () => {
	renderBrief();
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		/^Good (morning|afternoon|evening), Riley\.$/,
	);
	expect(screen.getByText("Nothing is due today.")).toBeVisible();
	cleanup();
	const state = createBriefState();
	state.profile.name = "Wong, Riley";
	renderBrief(state);
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		/^Good (morning|afternoon|evening), Riley\.$/,
	);
	expect(screen.getByText("Nothing is due today.")).toBeVisible();
});

it("counts overdue and due-today work in the headline", () => {
	const state = createBriefState();
	const now = Date.now();
	state.items = state.items.map((item) =>
		item.id === "support"
			? { ...item, due: new Date(now - 86_400_000).toISOString() }
			: item.id === "sprint"
				? { ...item, due: new Date(now).toISOString() }
				: item,
	);
	renderBrief(state);
	expect(screen.getByText("2 things are due today.")).toBeVisible();
});

it("shows six work items without another click and keeps the rest behind Work", async () => {
	insight.workItems = Array.from({ length: 7 }, (_, index) =>
		workItem(index),
	);
	renderBrief();
	const work = await screen.findByRole("list", { name: "Your work items" });
	expect(within(work).getAllByRole("listitem")).toHaveLength(6);
	expect(
		screen.queryByRole("button", { name: "Work item 6" }),
	).not.toBeInTheDocument();
	expect(screen.getByRole("link", { name: "See all 7" })).toHaveAttribute(
		"href",
		"/work",
	);
	expect(
		screen.getByRole("link", { name: "All work items" }),
	).toHaveAttribute("href", "/work");
});

it("lists each work item with its next step or who it waits on, above what waits for review", async () => {
	insight.workItems = [
		{
			...workItem(0),
			title: "Set up GPU capacity",
			openSteps: [
				{ id: "s1", text: "Pick the instance type", status: "open" },
				{
					id: "s2",
					text: "Ask AWS for quota",
					status: "open",
					kind: "waiting_on",
					assigneeId: "kunal",
					assigneeName: "Patel, Kunal",
				},
			],
		},
		{
			...workItem(1),
			openSteps: [
				{
					id: "s3",
					text: "Send the approval policy",
					status: "open",
					kind: "waiting_on",
					assigneeId: "priya",
					assigneeName: "Shah, Priya",
				},
			],
		},
		{ ...workItem(2), state: "proposed" },
	];
	renderBrief();
	const work = within(
		await screen.findByRole("list", { name: "Your work items" }),
	);
	expect(
		work.getByRole("link", { name: "Set up GPU capacity" }),
	).toHaveAttribute("href", "/work/item/task-0");
	// the owner's own step leads; who they wait on shows only when nothing is theirs
	expect(work.getByText("Next: Pick the instance type")).toBeVisible();
	expect(
		work.getByText("Waiting on Priya Shah: Send the approval policy"),
	).toBeVisible();
	expect(work.queryByText(/Ask AWS for quota/)).not.toBeInTheDocument();
	expect(
		screen.getByRole("link", { name: /^1 new work item/ }),
	).toHaveAttribute("href", "/work/review");
});

it("lists the newest conversations under Recent activity and leaves out muted and automated ones", () => {
	const state = createBriefState();
	const edits: Partial<Thread>[] = [
		{ subject: "Older mail", lastAt: "2026-10-05T09:00:00.000Z" },
		{
			subject: "Newer chat",
			channel: "teams",
			lastAt: "2026-10-06T09:00:00.000Z",
		},
		{
			subject: "Muted mail",
			muted: true,
			lastAt: "2026-10-07T09:00:00.000Z",
		},
		{
			subject: "Newsletter",
			automated: true,
			lastAt: "2026-10-07T10:00:00.000Z",
		},
	];
	state.threads = state.threads.map((thread, index) => ({
		...thread,
		...edits[index],
	}));
	renderBrief(state);
	const activity = within(
		screen.getByRole("region", { name: "Recent activity" }),
	);
	expect(
		activity.getAllByRole("link").map((link) => link.textContent),
	).toEqual(["Teams: Newer chat", "Email: Older mail"]);
	expect(
		activity.getByRole("link", { name: "Teams: Newer chat" }),
	).toHaveAttribute("href", "/thread/support-thread");
});

it("fills the ask box from a suggestion without sending it", async () => {
	const user = userEvent.setup();
	const { router } = renderBrief();
	await user.click(
		screen.getByRole("button", { name: "What am I waiting on?" }),
	);
	expect(router.state.location.state).toEqual({
		prompt: expect.stringMatching(/waiting on/),
	});
	expect(request).not.toHaveBeenCalled();
});

it("keeps a failed work load distinct from having no work", async () => {
	insight.workError = "Could not load your work.";
	renderBrief();
	expect(await screen.findByText("Could not load your work.")).toBeVisible();
	expect(screen.queryByText(/^No work items yet/)).not.toBeInTheDocument();
	cleanup();
	insight.workError = "";
	renderBrief();
	expect(await screen.findByText(/^No work items yet/)).toBeVisible();
	expect(
		screen.queryByText("Could not load your work."),
	).not.toBeInTheDocument();
});
