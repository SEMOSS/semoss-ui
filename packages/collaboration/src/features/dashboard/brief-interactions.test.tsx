import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { WorkUpdatesContext } from "@/features/collaboration/live/work-updates.context";
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
import { BriefNeeds } from "./brief-needs";
import { DashboardContext } from "./dashboard.context";
import { useDashboardLayout } from "./use-dashboard-layout";

vi.mock("@/features/daily-chat/landing-chat-composer", () => ({
	LandingChatComposer: () => (
		<section aria-label="Start a conversation">Chat composer</section>
	),
}));

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
}: {
	children: ReactNode;
	state: CollaborationState;
	onChange: (change: CollaborationChange) => void;
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
						error: "",
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

function renderBrief(state = createBriefState()) {
	const onChange = vi.fn<(change: CollaborationChange) => void>();
	const router = createMemoryRouter([
		{ path: "/", Component: DashboardPage },
	]);
	const result = render(
		<BriefHarness state={state} onChange={onChange}>
			<RouterProvider router={router} />
		</BriefHarness>,
	);
	return { ...result, router, onChange };
}

function workCard(title: string): HTMLElement {
	const card = within(
		screen.getByRole("region", { name: "When you're ready" }),
	)
		.getByRole("link", { name: title })
		.closest("article");
	if (!card) throw new Error(`Missing work card: ${title}`);
	return card;
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
});

it("shows Today as greeting, ask box, the short list and Your day without setup panels", () => {
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
	).toEqual(["Start a conversation", "When you're ready", "Your day"]);
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

it("puts overdue and due-today work first and counts it in the headline", () => {
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
	const today = within(
		screen.getByRole("region", { name: "When you're ready" }),
	);
	expect(
		today
			.getAllByRole("heading", { level: 3 })
			.map((heading) => heading.textContent),
	).toEqual([
		"Choose support tier",
		"Review the sprint backlog",
		"Confirm revised pricing",
	]);
});

it("starts with three tasks, shows up to five, and keeps the rest behind See everything", async () => {
	const user = userEvent.setup();
	const state = createBriefState();
	const [first] = state.items;
	if (!first) throw new Error("Missing sample item");
	state.items = [
		...state.items,
		...Array.from({ length: 4 }, (_, index) => ({
			...first,
			id: `extra-${index}`,
			title: `Extra task ${index}`,
			score: 10 - index,
		})),
	];
	renderBrief(state);
	const today = within(
		screen.getByRole("region", { name: "When you're ready" }),
	);
	expect(today.getAllByRole("article")).toHaveLength(3);
	await user.click(today.getByRole("button", { name: "Show 2 more" }));
	expect(today.getAllByRole("article")).toHaveLength(5);
	expect(
		today.getByRole("link", { name: "See everything (7)" }),
	).toHaveAttribute("href", "/work/all");
	expect(today.getByRole("link", { name: "1 done" })).toHaveAttribute(
		"href",
		"/work/done",
	);
});

it("keeps one main action and Done visible, with context one click away", async () => {
	const user = userEvent.setup();
	const { onChange } = renderBrief();
	const card = workCard("Confirm revised pricing");
	expect(
		within(card).getByRole("link", { name: "Review reply" }),
	).toHaveAttribute("href", "/thread/pricing-thread");
	expect(
		within(card).queryByText("Review the conversation before replying."),
	).not.toBeInTheDocument();
	await user.click(
		within(card).getByRole("button", { name: "Show details" }),
	);
	expect(
		within(card).getByText("Review the conversation before replying."),
	).toBeVisible();
	expect(
		within(card).getByRole("link", { name: "Ask about this" }),
	).toBeVisible();
	await user.click(within(card).getByRole("button", { name: "Done" }));
	expect(onChange.mock.lastCall?.[0].commands).toEqual([
		{ type: "item.update", itemId: "pricing", changes: { status: "done" } },
	]);
	expect(
		within(
			screen.getByRole("region", { name: "When you're ready" }),
		).queryByRole("link", { name: "Confirm revised pricing" }),
	).not.toBeInTheDocument();
	expect(screen.getByRole("link", { name: "2 done" })).toBeVisible();
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

it("keeps a failed empty work refresh distinct from being caught up and offers retry", async () => {
	const user = userEvent.setup();
	const state = createBriefState();
	state.items = [];
	const refresh = vi.fn();
	const content = (error: string) => (
		<MemoryRouter>
			<CollaborationSessionProvider initialState={state}>
				<WorkUpdatesContext.Provider
					value={{
						isRefreshing: false,
						lastUpdated: null,
						error,
						lastMailCheck: null,
						refresh,
						refreshTopicGoal: vi.fn(),
						isSyncing: false,
						lastSync: null,
						syncError: "",
						syncMail: vi.fn(),
					}}
				>
					<BriefNeeds />
				</WorkUpdatesContext.Provider>
			</CollaborationSessionProvider>
		</MemoryRouter>
	);
	const { rerender } = render(content("Could not refresh your work."));
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not refresh your work.",
	);
	expect(screen.queryByText(/You're all caught up/)).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "Retry" }));
	expect(refresh).toHaveBeenCalledTimes(1);
	rerender(content(""));
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	expect(
		screen.getByText("You're all caught up. Nothing needs you right now."),
	).toBeVisible();
});
