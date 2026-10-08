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
		"Start a conversation",
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

it("keeps all topics visible with the composer before the mobile reading order", () => {
	const { container } = renderBrief();
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"3 things need you",
	);
	const needs = within(screen.getByRole("region", { name: "Needs you" }));
	for (const name of [
		"Review the sprint backlog",
		"Confirm revised pricing",
		"Choose support tier",
	]) {
		expect(needs.getByRole("link", { name })).toBeVisible();
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
		"Needs you",
		"Brain wants to check",
		"Your day",
		"Handled",
	]);
	expect(request).not.toHaveBeenCalled();
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

it("links the global overview to Work and Brain directories", () => {
	renderBrief();
	expect(screen.getByRole("link", { name: "3 open" })).toHaveAttribute(
		"href",
		"/work/all",
	);
	const directories = within(
		screen.getByRole("navigation", { name: "Brain directories" }),
	);
	for (const [name, path] of [
		["Topics", "/work"],
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
