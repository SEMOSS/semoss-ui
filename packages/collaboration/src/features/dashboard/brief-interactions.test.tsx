import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { buildAttentionItems } from "@/features/attention/attention.model";
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
import type { InsightActions } from "@/lib/pixel";
import { DashboardPage } from "@/pages/dashboard.page";
import { DashboardContext } from "./dashboard.context";
import { useDashboardLayout } from "./use-dashboard-layout";

const queue = vi.hoisted(() => ({
	errors: [] as string[],
	isLoading: false,
	isComplete: true,
	refresh: vi.fn(),
}));
vi.mock("@/features/attention/attention.context", () => ({
	useAttention: () => {
		const { state } = useCollaborationSession();
		return {
			...queue,
			items: buildAttentionItems(state, {
				runs: [],
				delegations: [],
				roomSource: () => undefined,
			}),
			setPriority: vi.fn(),
		};
	},
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

it("keeps Home's composer, calendar, Brain and handled work without For you", () => {
	const saved = JSON.stringify({ version: 1, widgets: [], presets: [] });
	localStorage.setItem(storageKey, saved);
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
	).toEqual(["Start a conversation", "Your day", "Brain", "Handled"]);
	expect(
		screen.queryByRole("region", { name: "For you" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: /Customize dashboard/i }),
	).not.toBeInTheDocument();
	expect(localStorage.getItem(storageKey)).toBe(saved);
	expect(request).not.toHaveBeenCalled();
});

it("greets by the given name for first-last and last-first profile names", () => {
	renderBrief();
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		/^Good (morning|afternoon|evening), Riley\.$/,
	);
	cleanup();
	const state = createBriefState();
	state.profile.name = "Wong, Riley";
	renderBrief(state);
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		/^Good (morning|afternoon|evening), Riley\.$/,
	);
});

it("keeps topic and Brain directories reachable from Home", () => {
	renderBrief();
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
