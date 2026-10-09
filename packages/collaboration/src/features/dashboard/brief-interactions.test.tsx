import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type {
	CollaborationState,
	Thread,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import {
	type CollaborationChange,
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import {
	buildForYouItems,
	type ForYouItem,
} from "@/features/for-you/for-you.model";
import type { InsightActions } from "@/lib/pixel";
import { DashboardPage } from "@/pages/dashboard.page";
import { BriefNeeds } from "./brief-needs";
import { DashboardContext } from "./dashboard.context";
import { presetWidgets, saveDashboardPreferences } from "./dashboard-layout";
import { useDashboardLayout } from "./use-dashboard-layout";

const queue = vi.hoisted(() => ({
	errors: [] as string[],
	isLoading: false,
	isComplete: true,
	refresh: vi.fn(),
}));
vi.mock("@/features/for-you/for-you.context", () => ({
	useForYou: () => {
		const { state } = useCollaborationSession();
		return {
			...queue,
			items: buildForYouItems(state, {
				runs: [],
				delegations: [],
				roomSource: () => undefined,
			}),
			setPriority: vi.fn(),
		};
	},
}));
vi.mock("@/features/for-you/for-you-card", () => ({
	ForYouCard: ({
		item,
		view,
	}: {
		item: ForYouItem;
		view: "board" | "list";
	}) => (
		<article data-view={view}>
			<button type="button">{item.title}</button>
		</article>
	),
}));

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
	state.memories = [];
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
					mail: {
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

beforeAll(() => {
	// JSDOM does not provide the pointer-capture APIs used by the shared Select.
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

afterEach(() => {
	cleanup();
	localStorage.clear();
	queue.errors = [];
	queue.isLoading = false;
	queue.isComplete = true;
	vi.clearAllMocks();
});

it("shows the complete daily brief without applying or replacing saved widget customization", () => {
	saveDashboardPreferences(storageKey, {
		version: 1,
		widgets: presetWidgets().map((widget) => ({
			...widget,
			visible: false,
		})),
		presets: [],
	});
	const saved = localStorage.getItem(storageKey);
	renderBrief();
	for (const name of [
		"Your day",
		"Handled",
		"For you",
		"Start a conversation",
		"Brain",
	]) {
		expect(screen.getByRole("region", { name })).toBeVisible();
	}
	expect(
		screen.getByRole("button", { name: "Confirm revised pricing" }),
	).toBeVisible();
	expect(
		screen.queryByRole("button", { name: /Customize dashboard/i }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: /^Resize / }),
	).not.toBeInTheDocument();
	expect(localStorage.getItem(storageKey)).toBe(saved);
});

it("greets by the given name for first-last and last-first profile names", () => {
	renderBrief();
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		/^Good (morning|afternoon|evening), Riley\. 3 things need you\.$/,
	);
	cleanup();
	const state = createBriefState();
	state.profile.name = "Wong, Riley";
	renderBrief(state);
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		/^Good (morning|afternoon|evening), Riley\. 3 things need you\.$/,
	);
});

it("keeps all topics visible with the composer before the mobile reading order", () => {
	const { container } = renderBrief();
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"3 things need you",
	);
	const needs = within(screen.getByRole("region", { name: "For you" }));
	for (const name of [
		"Review the sprint backlog",
		"Confirm revised pricing",
		"Choose support tier",
	]) {
		expect(needs.getByRole("button", { name })).toBeVisible();
	}
	expect(
		screen.queryByRole("combobox", { name: "Topic scope" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("region", { name: "Ask" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("link", { name: "Chat" }),
	).not.toBeInTheDocument();
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
		"For you",
		"Brain",
		"Your day",
		"Handled",
	]);
	expect(request).not.toHaveBeenCalled();
});

it("uses the queue priority order and keeps Brain review items out of the context panel", () => {
	const state = createBriefState();
	state.items = state.items.map((item) => ({
		...item,
		priority: item.id === "sprint" ? "P0" : "P2",
	}));
	const initial = createInitialCollaborationState();
	state.reviews = initial.reviews
		.filter((review) => review.status === "open")
		.slice(0, 1);
	renderBrief(state);
	const preview = within(screen.getByRole("region", { name: "For you" }));
	expect(preview.getAllByRole("article")[0]).toHaveTextContent(
		"Review the sprint backlog",
	);
	for (const article of preview.getAllByRole("article"))
		expect(article).toHaveAttribute("data-view", "list");
	expect(preview.getAllByRole("article")).toHaveLength(4);
	expect(
		within(screen.getByRole("region", { name: "Brain" })).queryByRole(
			"article",
		),
	).not.toBeInTheDocument();
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"4 things need you",
	);
});

it("links the global overview to For you and Brain directories", () => {
	renderBrief();
	expect(screen.getByRole("link", { name: "3 for you" })).toHaveAttribute(
		"href",
		"/for-you",
	);
	const directories = within(
		screen.getByRole("navigation", { name: "Brain directories" }),
	);
	for (const [name, path] of [
		["Topics", "/tasks/topics"],
		["People", "/brain/people"],
		["Threads", "/brain/threads"],
		["Sources", "/brain/sources"],
	]) {
		expect(directories.getByRole("link", { name })).toHaveAttribute(
			"href",
			path,
		);
	}
});

it("keeps failed, loading, partial, and complete empty queues distinct", async () => {
	const user = userEvent.setup();
	const state = createBriefState();
	state.items = [];
	const content = () => (
		<MemoryRouter>
			<CollaborationSessionProvider initialState={state}>
				<BriefNeeds />
			</CollaborationSessionProvider>
		</MemoryRouter>
	);
	queue.errors = ["Could not check agent activity."];
	const { rerender } = render(content());
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not check agent activity.",
	);
	expect(screen.queryByText(/You're all caught up/)).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "Retry" }));
	expect(queue.refresh).toHaveBeenCalledOnce();
	queue.errors = [];
	queue.isLoading = true;
	rerender(content());
	expect(screen.getByText("Loading this section")).toBeInTheDocument();
	expect(screen.queryByText(/You're all caught up/)).not.toBeInTheDocument();
	queue.isLoading = false;
	queue.isComplete = false;
	rerender(content());
	expect(
		screen.getByText(
			"Nothing found yet. Some sources are still being checked.",
		),
	).toBeVisible();
	queue.isComplete = true;
	rerender(content());
	expect(
		screen.getByText("You're all caught up. Nothing to review right now."),
	).toBeVisible();
});

it("keeps the topic-filtered preview linked to the queue instead of replacing the topic workspace", () => {
	render(
		<MemoryRouter>
			<CollaborationSessionProvider initialState={createBriefState()}>
				<BriefNeeds topicId="tailspin" compact />
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
	expect(
		screen.getByRole("link", { name: "See all 2 For you items" }),
	).toHaveAttribute("href", "/for-you?topic=tailspin");
	expect(
		screen.queryByRole("button", { name: "Review the sprint backlog" }),
	).not.toBeInTheDocument();
});
