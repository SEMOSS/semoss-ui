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
import { presetWidgets, saveDashboardPreferences } from "./dashboard-layout";
import { useDashboardLayout } from "./use-dashboard-layout";

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

function renderBrief() {
	const state = createBriefState();
	const onChange = vi.fn<(change: CollaborationChange) => void>();
	const router = createMemoryRouter([
		{ path: "/", Component: DashboardPage },
		{ path: "/new", element: <p>New chat</p> },
	]);
	const result = render(
		<BriefHarness state={state} onChange={onChange}>
			<RouterProvider router={router} />
		</BriefHarness>,
	);
	return { ...result, router, onChange };
}

function workCard(title: string): HTMLElement {
	const card = within(screen.getByRole("region", { name: "Needs you" }))
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
		"Needs you",
		"Ask",
		"Brain wants to check",
	]) {
		expect(screen.getByRole("region", { name })).toBeVisible();
	}
	expect(
		screen.getByRole("link", { name: "Confirm revised pricing" }),
	).toBeVisible();
	expect(
		screen.queryByRole("button", { name: /Customize dashboard/i }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: /^Resize / }),
	).not.toBeInTheDocument();
	expect(localStorage.getItem(storageKey)).toBe(saved);
});

it("narrows the work queue, handled list, and headline to the selected topic", async () => {
	const user = userEvent.setup();
	renderBrief();
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"3 things need you",
	);
	await user.click(
		screen.getAllByRole("combobox", { name: "Topic scope" })[0],
	);
	await user.click(screen.getByRole("option", { name: "Product Build" }));
	const needs = within(screen.getByRole("region", { name: "Needs you" }));
	expect(
		needs.getByRole("link", { name: "Review the sprint backlog" }),
	).toBeVisible();
	expect(
		needs.queryByRole("link", { name: "Confirm revised pricing" }),
	).not.toBeInTheDocument();
	expect(
		needs.queryByRole("link", { name: "Choose support tier" }),
	).not.toBeInTheDocument();
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"1 thing needs you",
	);
	expect(
		within(screen.getByRole("region", { name: "Handled" })).getByRole(
			"link",
			{ name: "Send the sprint notes" },
		),
	).toBeVisible();
	await user.click(
		screen.getAllByRole("combobox", { name: "Topic scope" })[0],
	);
	await user.click(screen.getByRole("option", { name: "Tailspin Renewal" }));
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"2 things need you",
	);
	expect(
		within(screen.getByRole("region", { name: "Handled" })).getByText(
			"Completed work will appear here.",
		),
	).toBeVisible();
});

it("moves completed work into Handled and reopens only the chosen item after later changes", async () => {
	const user = userEvent.setup();
	const { onChange } = renderBrief();
	await user.click(
		within(workCard("Confirm revised pricing")).getByRole("button", {
			name: "Mark handled",
		}),
	);
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"2 things need you",
	);
	expect(
		within(screen.getByRole("region", { name: "Handled" })).getByText(
			"2 completed",
		),
	).toBeVisible();
	await user.click(
		within(workCard("Choose support tier")).getByRole("button", {
			name: "Mark handled",
		}),
	);
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"1 thing needs you",
	);
	await user.click(
		screen.getByRole("button", {
			name: "Undo: reopen Confirm revised pricing",
		}),
	);
	expect(workCard("Confirm revised pricing")).toBeVisible();
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"2 things need you",
	);
	const handled = within(screen.getByRole("region", { name: "Handled" }));
	expect(
		handled.getByRole("link", { name: "Choose support tier" }),
	).toBeVisible();
	expect(
		handled.getByRole("link", { name: "Send the sprint notes" }),
	).toBeVisible();
	expect(
		handled.queryByRole("link", { name: "Confirm revised pricing" }),
	).not.toBeInTheDocument();
	expect(onChange.mock.lastCall?.[0].commands).toEqual([
		{ type: "item.update", itemId: "pricing", changes: { status: "open" } },
	]);
});

it("carries a suggested question and selected topic to a new chat without submitting a request", async () => {
	const user = userEvent.setup();
	const { router, onChange } = renderBrief();
	await user.click(
		screen.getAllByRole("combobox", { name: "Topic scope" })[0],
	);
	await user.click(screen.getByRole("option", { name: "Product Build" }));
	await user.click(
		screen.getByRole("button", {
			name: "What changed on Product Build this week?",
		}),
	);
	expect(router.state.location.pathname).toBe("/new");
	expect(router.state.location.state).toEqual({
		prompt: "What changed on Product Build this week?",
		topicId: "product",
	});
	expect(request).not.toHaveBeenCalled();
	expect(onChange).not.toHaveBeenCalled();
});

it("opens an authored question as a draft and keeps blank questions disabled", async () => {
	const user = userEvent.setup();
	const { router } = renderBrief();
	const openQuestion = screen.getByRole("button", {
		name: "Open question in chat",
	});
	expect(openQuestion).toBeDisabled();
	await user.type(
		screen.getByRole("textbox", { name: "Ask anything" }),
		"  Help me prepare for today  ",
	);
	await user.click(openQuestion);
	expect(router.state.location.pathname).toBe("/new");
	expect(router.state.location.state).toEqual({
		prompt: "Help me prepare for today",
		topicId: "",
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
