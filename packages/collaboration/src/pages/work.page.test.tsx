import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type {
	CollaborationState,
	Memory,
	Thread,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { TopicPage } from "./topic.page";
import { WorkPage } from "./work.page";

const sessions = vi.hoisted(() => ({ mounted: vi.fn() }));
// the topic page opens its assistant by default; these tests are not about it
vi.mock("@/features/daily-chat/landing-chat-composer", () => ({
	LandingChatComposer: () => null,
}));
vi.mock("@/features/dashboard/topic-sessions", () => ({
	TopicSessions: ({ topicId }: { topicId: string }) => {
		sessions.mounted(topicId);
		return <p>Sessions for {topicId}</p>;
	},
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

/** Mixed status/source fixture exposes accidental global scope and stale stored totals. */
function workState(): CollaborationState {
	const state = createInitialCollaborationState();
	const topic = state.topics[0];
	const person = state.people[0];
	const secondPerson = state.people[1];
	const item = state.items[0];
	if (!topic || !person || !secondPerson || !item)
		throw new Error("Missing work fixture");
	state.topics = [
		{
			...topic,
			id: "alpha",
			name: "Alpha launch",
			short: "Alpha",
			description: "Ship the launch with the customer.",
			status: "active",
			stats: { threads: 999, openItems: 999, lastActivity: "" },
			goals: [
				{ noteId: "goal", text: "Launch by Friday", status: "open" },
			],
			people: [
				{
					personId: person.id,
					role: "Launch owner",
					engagement: null,
					state: "member",
					origin: "you",
				},
				{
					personId: secondPerson.id,
					role: "Suggested",
					engagement: null,
					state: "suggested",
					origin: "brain",
				},
			],
		},
		{
			...topic,
			id: "beta",
			name: "Beta hiring",
			short: "Beta",
			description: "Build the hiring team.",
			goals: [],
			people: [],
		},
		{
			...topic,
			id: "archived",
			name: "Archived topic",
			status: "archived",
		},
	];
	// a topic's notes are memories about it
	const note = (changes: Partial<Memory>): Memory => ({
		id: "note",
		kind: "fact",
		text: "",
		state: "active",
		origin: "you",
		confirmed: true,
		pinned: false,
		about: [{ type: "topic", id: "alpha" }],
		expiresAt: null,
		replacesId: null,
		source: {},
		createdAt: "2026-10-07T00:00:00Z",
		updatedAt: "2026-10-07T00:00:00Z",
		isSample: topic.isSample,
		...changes,
	});
	state.memories = [
		note({ id: "confirmed", text: "Confirmed Alpha context" }),
		note({
			id: "learned",
			text: "Unconfirmed Alpha guess",
			origin: "assistant",
			confirmed: false,
		}),
	];
	const specifications: Array<
		Partial<WorkItem> &
			Pick<WorkItem, "id" | "status" | "channel" | "topicIds">
	> = [
		{
			id: "alpha-email",
			status: "open",
			channel: "email",
			topicIds: ["alpha"],
			score: 99,
			received: "2026-10-06T09:00:00Z",
		},
		{
			id: "alpha-fyi",
			status: "open",
			channel: "teams",
			topicIds: ["alpha"],
			askType: "fyi",
		},
		{
			id: "alpha-wait",
			status: "waiting",
			channel: "email",
			topicIds: ["alpha"],
		},
		{
			id: "alpha-done",
			status: "done",
			channel: "calendar",
			topicIds: ["alpha"],
		},
		{
			id: "alpha-snooze",
			status: "snoozed",
			channel: "teams",
			topicIds: ["alpha"],
			snoozeUntil: "2099-10-08T12:00:00Z",
		},
		{
			id: "alpha-muted",
			status: "open",
			channel: "email",
			topicIds: ["alpha"],
		},
		{
			id: "alpha-auto",
			status: "open",
			channel: "email",
			topicIds: ["alpha"],
		},
		{
			id: "beta-open",
			status: "open",
			channel: "email",
			topicIds: ["beta"],
		},
		{
			id: "shared",
			status: "open",
			channel: "email",
			topicIds: ["alpha", "beta"],
			score: 10,
			received: "2026-10-07T09:00:00Z",
		},
	];
	state.items = specifications.map((specification) => ({
		...item,
		actorId: person.id,
		title: `Action ${specification.id}`,
		threadId: specification.id,
		askType: "reply",
		reasons: [],
		suggested: false,
		score: 20,
		...specification,
	}));
	state.threads = state.items.map(
		(record): Thread => ({
			id: record.threadId,
			channel: record.channel,
			subject: `Source ${record.id}`,
			summary: "",
			roomId: null,
			topicLinks: record.topicIds.map((topicId, index) => ({
				topicId,
				source: "confirmed",
				confidence: 100,
				primary: index === 0,
			})),
			participants: [],
			muted: record.id === "alpha-muted",
			automated: record.id === "alpha-auto",
			messageCount: 3,
			lastAt: record.received,
			isSample: true,
		}),
	);
	state.people = [person, secondPerson];
	state.workspaces = {};
	state.reviews = [];
	return state;
}

/** Mounts real Work composition and shared commands without room/network reads. */
function renderWork(path: string, initialState = workState()) {
	const router = createMemoryRouter(
		[
			...["/work", "/work/all", "/work/waiting", "/work/done"].map(
				(route) => ({ path: route, Component: WorkPage }),
			),
			{ path: "/topics/:topicId", Component: TopicPage },
			{ path: "/thread/:threadId", element: <p>Source import</p> },
		],
		{ initialEntries: [path] },
	);
	render(
		<CollaborationSessionProvider initialState={initialState}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return { router, user: userEvent.setup() };
}

it("opens Work as a topic index with selector-based counts and the existing new-topic dialog", async () => {
	const { user } = renderWork("/work");
	expect(screen.getByRole("heading", { name: "Work" })).toBeVisible();
	const index = screen.getByRole("list", { name: "Work topics" });
	const alpha = within(index).getByRole("link", { name: /Alpha launch/ });
	expect(alpha).toHaveAttribute("href", "/topics/alpha");
	expect(alpha).toHaveTextContent("Ship the launch with the customer.");
	expect(alpha).toHaveTextContent("3 open");
	expect(alpha).toHaveTextContent("1 waiting");
	expect(alpha).not.toHaveTextContent("999");
	expect(screen.queryByText("Archived topic")).not.toBeInTheDocument();
	expect(screen.queryByRole("article")).not.toBeInTheDocument();
	expect(screen.getByRole("link", { name: "All work" })).toHaveAttribute(
		"href",
		"/work/all",
	);
	const create = screen.getByRole("button", { name: "New topic" });
	await user.click(create);
	expect(screen.getByRole("dialog", { name: "New topic" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(create).toHaveFocus();
});

it("combines scoped work with editable goals, people, and notes in one topic", async () => {
	const { user } = renderWork("/topics/alpha");
	expect(screen.getByRole("heading", { name: "Alpha launch" })).toBeVisible();
	expect(
		screen.getByRole("checkbox", { name: "Launch by Friday" }),
	).not.toBeChecked();
	await user.click(
		screen.getByRole("checkbox", { name: "Launch by Friday" }),
	);
	expect(
		screen.getByRole("checkbox", { name: "Launch by Friday" }),
	).toBeChecked();
	expect(
		screen.queryByRole("link", { name: "Edit in Brain" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("link", { name: "Open feed" }),
	).not.toBeInTheDocument();
	expect(screen.getByText("Confirmed Alpha context")).toBeVisible();
	expect(screen.getByText("Unconfirmed Alpha guess")).toBeVisible();
	const context = screen.getByRole("complementary", {
		name: "Topic context",
	});
	expect(within(context).getByText("· Launch owner")).not.toHaveClass(
		"sr-only",
	);
	expect(
		within(context).getByRole("heading", { name: "Suggested" }),
	).toBeVisible();
	expect(screen.getByRole("button", { name: "Add people" })).toBeVisible();
	expect(screen.getByRole("button", { name: "Add keyword" })).toBeVisible();
	expect(
		screen.queryByRole("heading", { name: "Brain wants to check" }),
	).not.toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: "Filter work: Open 3" }),
	).toBeVisible();
	expect(
		screen.queryByRole("link", { name: "Action beta-open" }),
	).not.toBeInTheDocument();
	expect(sessions.mounted).not.toHaveBeenCalled();
});

it("shows a goal resolution as plain text and keeps it when reopening and completing the goal", async () => {
	const state = workState();
	const goal = {
		noteId: "goal",
		text: "Get room code for Florida",
		status: "done" as const,
		resolution: "Florida room code is 444553 <b>Keep this code</b>",
	};
	state.topics[0].goals = [goal];
	const { user } = renderWork("/topics/alpha", state);
	const checkbox = screen.getByRole("checkbox", { name: goal.text });
	const resolution = screen.getByText(goal.resolution);
	expect(checkbox).toBeChecked();
	expect(resolution).toBeVisible();
	expect(resolution.querySelector("b")).toBeNull();
	expect(resolution.closest(".line-through")).toBeNull();
	expect(screen.getByText(goal.text)).not.toHaveClass("line-through");
	await user.click(checkbox);
	expect(checkbox).not.toBeChecked();
	expect(screen.getByText(goal.resolution)).toBeVisible();
	await user.click(checkbox);
	expect(checkbox).toBeChecked();
	expect(screen.getByText(goal.resolution)).toBeVisible();
});

it("combines topic status and source filters, keeps multi-topic work, and sorts scoped rows", async () => {
	const { user } = renderWork("/topics/alpha");
	const openFilter = () =>
		user.click(screen.getByRole("button", { name: /^Filter work:/ }));
	await openFilter();
	expect(
		screen.getByRole("menuitemradio", { name: "All sources 3" }),
	).toBeVisible();
	expect(
		screen.getByRole("menuitemradio", { name: "Teams 1" }),
	).toBeVisible();
	await user.click(screen.getByRole("menuitemradio", { name: "Email 2" }));
	const actions = screen.getByRole("region", { name: "Open 2, Email" });
	expect(within(actions).getAllByRole("article")).toHaveLength(2);
	expect(within(actions).getAllByRole("article")[0]).toHaveTextContent(
		"Action alpha-email",
	);
	expect(
		within(actions).getByRole("link", { name: "Action shared" }),
	).toHaveAttribute("href", "/thread/shared");
	await openFilter();
	await user.click(screen.getByRole("menuitemradio", { name: "Latest" }));
	expect(
		within(
			screen.getByRole("region", { name: "Open 2, Latest, Email" }),
		).getAllByRole("article")[0],
	).toHaveTextContent("Action shared");
	await openFilter();
	await user.click(screen.getByRole("menuitemradio", { name: "Waiting 1" }));
	expect(
		screen.getByRole("link", { name: "Action alpha-wait" }),
	).toBeVisible();
	expect(
		screen.queryByRole("link", { name: "Action alpha-email" }),
	).not.toBeInTheDocument();
	await openFilter();
	await user.click(screen.getByRole("menuitemradio", { name: "Handled 1" }));
	const handled = screen.getByRole("region", { name: /^Handled 1/ });
	await user.click(
		within(handled).getByRole("button", { name: "Move back" }),
	);
	await openFilter();
	expect(
		screen.getByRole("menuitemradio", { name: "Handled 0" }),
	).toBeVisible();
	await user.click(screen.getByRole("menuitemradio", { name: "Open 4" }));
	await openFilter();
	await user.click(
		screen.getByRole("menuitemradio", { name: "All sources 4" }),
	);
	expect(
		screen.getByRole("link", { name: "Action alpha-done" }),
	).toBeVisible();
	await openFilter();
	await user.click(screen.getByRole("menuitemradio", { name: "Snoozed 1" }));
	expect(
		screen.getByRole("link", { name: "Action alpha-snooze" }),
	).toBeVisible();
});

it("defaults All work to Needs you while preserving Open and direct legacy statuses", async () => {
	const { router, user } = renderWork("/work/all");
	expect(
		screen.getByRole("button", { name: "Filter work: Needs you 3" }),
	).toBeVisible();
	expect(
		screen.queryByRole("link", { name: "Action alpha-fyi" }),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: /^Filter work:/ }));
	await user.click(screen.getByRole("menuitemradio", { name: "Open 4" }));
	expect(
		screen.getByRole("link", { name: "Action alpha-fyi" }),
	).toBeVisible();
	expect(
		screen.queryByRole("link", { name: "Action alpha-muted" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("link", { name: "Action alpha-auto" }),
	).not.toBeInTheDocument();
	await act(() => router.navigate("/work/waiting"));
	expect(
		screen.getByRole("button", { name: "Filter work: Waiting 1" }),
	).toBeVisible();
	await act(() => router.navigate("/work/done"));
	expect(
		screen.getByRole("button", { name: "Filter work: Handled 1" }),
	).toBeVisible();
});

it("opens source threads by their canonical import route and reads sessions only on selection", async () => {
	const { router, user } = renderWork("/topics/alpha");
	await user.click(screen.getByRole("tab", { name: "Threads" }));
	expect(sessions.mounted).not.toHaveBeenCalled();
	expect(
		screen.getByRole("list", { name: "Topic threads" }),
	).not.toHaveTextContent("Source beta-open");
	expect(
		screen.getByRole("link", { name: "Source alpha-email" }),
	).toHaveAttribute("href", "/thread/alpha-email");
	expect(
		screen.getByRole("button", {
			name: "Thread actions for Source alpha-email",
		}),
	).toBeVisible();
	await user.click(screen.getByRole("tab", { name: "Chats" }));
	expect(sessions.mounted).toHaveBeenCalledWith("alpha");
	await user.click(screen.getByRole("tab", { name: /^Actions/ }));
	expect(screen.queryByText("Sessions for alpha")).not.toBeInTheDocument();
	await act(() => router.navigate("/topics/beta"));
	expect(screen.getByRole("tab", { name: /^Actions/ })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(
		screen.getByRole("button", { name: "Filter work: Open 2" }),
	).toBeVisible();
	expect(
		screen.queryByRole("link", { name: "Action alpha-email" }),
	).not.toBeInTheDocument();
});

it("never falls back to global work for an unknown topic", () => {
	renderWork("/topics/missing");
	expect(
		screen.getByRole("heading", { name: "Topic unavailable" }),
	).toBeVisible();
	expect(screen.getByRole("link", { name: "All topics" })).toHaveAttribute(
		"href",
		"/work",
	);
	expect(screen.queryByRole("article")).not.toBeInTheDocument();
	expect(screen.queryByRole("tab")).not.toBeInTheDocument();
});

it("keeps empty-topic setup optional and preserves context when toggled", async () => {
	const { user } = renderWork("/topics/beta");
	const toggle = screen.getByRole("button", { name: "Context" });
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(
		screen.queryByRole("complementary", { name: "Topic context" }),
	).not.toBeInTheDocument();
	expect(
		screen.getByRole("link", { name: "Action beta-open" }),
	).toBeVisible();
	await user.click(toggle);
	expect(
		screen.getByRole("heading", { name: "Topic settings" }),
	).toBeVisible();
	expect(
		screen.getByRole("combobox", { name: "Topic status" }),
	).toBeVisible();
	await user.click(
		screen.getByRole("button", { name: "Notes for the assistant" }),
	);
	await user.click(toggle);
	expect(
		screen.queryByRole("button", { name: "Add keyword" }),
	).not.toBeInTheDocument();
	await user.click(toggle);
	expect(
		screen.getByRole("button", { name: "Notes for the assistant" }),
	).toHaveAttribute("aria-expanded", "true");
	expect(toggle).toHaveFocus();
});

it("finds work within status and source, clears an empty search, and restores keyboard focus", async () => {
	const { user } = renderWork("/work/all");
	const search = screen.getByRole("searchbox", { name: "Find work" });
	await user.type(search, " ALPHA email ");
	expect(
		screen.getByRole("link", { name: "Action alpha-email" }),
	).toBeVisible();
	expect(screen.getByRole("link", { name: "Action shared" })).toBeVisible();
	expect(
		screen.queryByRole("link", { name: "Action beta-open" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByRole("link", { name: "Action alpha-fyi" }),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: /^Filter work:/ }));
	await user.click(screen.getByRole("menuitemradio", { name: "Waiting 1" }));
	await waitFor(() =>
		expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
	);
	expect(
		screen.getByRole("link", { name: "Action alpha-wait" }),
	).toBeVisible();
	await user.clear(search);
	await user.type(search, "no matching work");
	expect(
		screen.getByText("No work matches your search in this view."),
	).toBeVisible();
	await user.click(
		within(screen.getByRole("region", { name: "Waiting 0" })).getByRole(
			"button",
			{ name: "Clear search" },
		),
	);
	expect(search).toHaveValue("");
	expect(search).toHaveFocus();
	expect(
		screen.getByRole("link", { name: "Action alpha-wait" }),
	).toBeVisible();
	await user.type(search, "alpha");
	await user.keyboard("{Escape}");
	expect(search).toHaveValue("");
	expect(search).toHaveFocus();
});

it("searches summaries and people while retaining the selected source", async () => {
	const state = workState();
	const email = state.threads.find((thread) => thread.id === "alpha-email");
	const fyi = state.threads.find((thread) => thread.id === "alpha-fyi");
	if (!email || !fyi) throw new Error("Missing search fixtures");
	email.summary = "Confirm the rollout schedule";
	fyi.summary = "Rollout notes";
	const { user } = renderWork("/work/all", state);
	await user.click(screen.getByRole("button", { name: /^Filter work:/ }));
	await user.click(screen.getByRole("menuitemradio", { name: "Open 4" }));
	await user.click(screen.getByRole("button", { name: /^Filter work:/ }));
	await user.click(screen.getByRole("menuitemradio", { name: "Teams 1" }));
	const search = screen.getByRole("searchbox", { name: "Find work" });
	await user.type(search, "rollout");
	expect(
		screen.getByRole("link", { name: "Action alpha-fyi" }),
	).toBeVisible();
	expect(
		screen.queryByRole("link", { name: "Action alpha-email" }),
	).not.toBeInTheDocument();
	await user.clear(search);
	await user.type(search, state.people[0].name);
	expect(
		screen.getByRole("link", { name: "Action alpha-fyi" }),
	).toBeVisible();
});

it("keeps urgency visible and classification reasons under row details", async () => {
	const state = workState();
	const item = state.items.find((item) => item.id === "alpha-email");
	if (!item) throw new Error("Missing details fixture");
	item.reasons = ["Asks you to act", "From a VIP", "Urgency: Today"];
	const thread = state.threads.find((thread) => thread.id === item.threadId);
	if (!thread) throw new Error("Missing details thread");
	thread.participants = [
		{ personId: state.people[0].id, role: "Participant", included: false },
	];
	const { user } = renderWork("/work/all", state);
	expect(screen.getByText("Today")).toBeVisible();
	expect(screen.getByText("1 participant excluded")).toBeVisible();
	expect(screen.getByText("From a VIP")).not.toBeVisible();
	await user.click(
		screen.getByRole("button", {
			name: "Thread actions for Source alpha-email",
		}),
	);
	await user.click(screen.getByRole("button", { name: "Show details" }));
	expect(screen.getByText("From a VIP")).toBeVisible();
	expect(
		screen.getByRole("list", { name: "Why this is in your work list" }),
	).toHaveTextContent("Asks you to act");
	expect(
		screen.getByRole("button", {
			name: "Thread actions for Source alpha-email",
		}),
	).toHaveFocus();
});

it("takes focus to context below the viewport and returns to the work on close", async () => {
	const { user } = renderWork("/topics/beta");
	const context = screen.getByRole("complementary", { hidden: true });
	vi.spyOn(context, "getBoundingClientRect").mockReturnValue(
		new DOMRect(0, 1200, 320, 800),
	);
	const toggle = screen.getByRole("button", { name: "Context" });
	await user.click(toggle);
	await waitFor(() => expect(context).toHaveFocus());
	await user.click(
		screen.getByRole("button", { name: "Close topic context" }),
	);
	expect(toggle).toHaveFocus();
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(context).not.toBeVisible();
});

// Route composition is exercised with isolated child views; hydration has its own integration coverage.
vi.mock("@/features/collaboration/components/saved-record-boundary", () => ({
	SavedRecordBoundary: ({ children }: { children: ReactNode }) => children,
}));
