import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type {
	CollaborationState,
	Thread,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { WorkPage } from "./work.page";

const sessions = vi.hoisted(() => ({ mounted: vi.fn() }));
vi.mock("@/features/dashboard/topic-sessions", () => ({
	TopicSessions: ({ topicId }: { topicId: string }) => {
		sessions.mounted(topicId);
		return <p>Sessions for {topicId}</p>;
	},
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
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
			notes: [
				{
					noteId: "confirmed",
					kind: "note",
					text: "Confirmed Alpha context",
					status: "confirmed",
					by: "you",
					date: "2026-10-07",
				},
				{
					noteId: "draft",
					kind: "note",
					text: "Unconfirmed Alpha guess",
					status: "draft",
					by: "assistant",
					date: "2026-10-07",
				},
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
			notes: [],
			people: [],
		},
		{
			...topic,
			id: "archived",
			name: "Archived topic",
			status: "archived",
		},
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
			...[
				"/work",
				"/work/all",
				"/work/waiting",
				"/work/done",
				"/work/topic/:topicId",
			].map((route) => ({ path: route, Component: WorkPage })),
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
	expect(alpha).toHaveAttribute("href", "/work/topic/alpha");
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

it("keeps topic goals visible and supporting context confirmed and scoped", () => {
	const state = workState();
	renderWork("/work/topic/alpha", state);
	expect(screen.getByRole("heading", { name: "Alpha launch" })).toBeVisible();
	expect(
		screen.getByRole("region", { name: "Topic goals" }),
	).toHaveTextContent("Launch by Friday");
	expect(screen.getByRole("link", { name: "Edit in Brain" })).toHaveAttribute(
		"href",
		"/brain/topics/alpha",
	);
	const context = screen.getByRole("complementary", {
		name: "Topic context",
	});
	expect(context).toHaveTextContent("Confirmed Alpha context");
	expect(context).not.toHaveTextContent("Unconfirmed Alpha guess");
	expect(context).toHaveTextContent("Launch owner");
	expect(context).not.toHaveTextContent("Suggested");
	expect(context).toHaveTextContent("Source alpha-done");
	expect(
		screen.queryByRole("heading", { name: "Brain wants to check" }),
	).not.toBeInTheDocument();
	expect(screen.getByRole("tab", { name: "Open 3" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(
		screen.queryByRole("link", { name: "Action beta-open" }),
	).not.toBeInTheDocument();
	expect(sessions.mounted).not.toHaveBeenCalled();
});

it("combines topic status and source filters, keeps multi-topic work, and sorts scoped rows", async () => {
	const { user } = renderWork("/work/topic/alpha");
	await user.click(
		screen.getByRole("button", { name: "Filter by source: All sources" }),
	);
	expect(
		screen.getByRole("menuitemradio", { name: "All sources 3" }),
	).toBeVisible();
	expect(
		screen.getByRole("menuitemradio", { name: "Teams 1" }),
	).toBeVisible();
	await user.click(screen.getByRole("menuitemradio", { name: "Email 2" }));
	const actions = screen.getByRole("tabpanel", { name: "Open 3" });
	expect(within(actions).getAllByRole("article")).toHaveLength(2);
	expect(within(actions).getAllByRole("article")[0]).toHaveTextContent(
		"Action alpha-email",
	);
	expect(
		within(actions).getByRole("link", { name: "Action shared" }),
	).toHaveAttribute("href", "/thread/shared");
	await user.click(screen.getByRole("radio", { name: "Latest" }));
	expect(within(actions).getAllByRole("article")[0]).toHaveTextContent(
		"Action shared",
	);
	await user.click(screen.getByRole("tab", { name: "Waiting 1" }));
	expect(
		screen.getByRole("link", { name: "Action alpha-wait" }),
	).toBeVisible();
	expect(
		screen.queryByRole("link", { name: "Action alpha-email" }),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("tab", { name: "Handled 1" }));
	const handled = screen.getByRole("tabpanel", { name: "Handled 1" });
	await user.click(
		within(handled).getByRole("button", { name: "Move back" }),
	);
	expect(screen.getByRole("tab", { name: "Handled 0" })).toBeVisible();
	await user.click(screen.getByRole("tab", { name: "Open 4" }));
	await user.click(screen.getByRole("button", { name: /Filter by source:/ }));
	await user.click(
		screen.getByRole("menuitemradio", { name: "All sources 4" }),
	);
	expect(
		screen.getByRole("link", { name: "Action alpha-done" }),
	).toBeVisible();
	await user.click(screen.getByRole("tab", { name: "Snoozed 1" }));
	expect(
		screen.getByRole("link", { name: "Action alpha-snooze" }),
	).toBeVisible();
});

it("defaults All work to Needs you while preserving Open and direct legacy statuses", async () => {
	const { router, user } = renderWork("/work/all");
	expect(screen.getByRole("tab", { name: "Needs you 3" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(
		screen.queryByRole("link", { name: "Action alpha-fyi" }),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("tab", { name: "Open 4" }));
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
	expect(screen.getByRole("tab", { name: "Waiting 1" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await act(() => router.navigate("/work/done"));
	expect(screen.getByRole("tab", { name: "Handled 1" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
});

it("opens source threads by their canonical import route and reads sessions only on selection", async () => {
	const { router, user } = renderWork("/work/topic/alpha");
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
	await user.click(screen.getByRole("tab", { name: "Sessions" }));
	expect(sessions.mounted).toHaveBeenCalledWith("alpha");
	await user.click(screen.getByRole("tab", { name: "Actions" }));
	expect(screen.queryByText("Sessions for alpha")).not.toBeInTheDocument();
	await act(() => router.navigate("/work/topic/beta"));
	expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(screen.getByRole("tab", { name: "Open 2" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(
		screen.queryByRole("link", { name: "Action alpha-email" }),
	).not.toBeInTheDocument();
});

it("never falls back to global work for an unknown topic", () => {
	renderWork("/work/topic/missing");
	expect(
		screen.getByRole("heading", { name: "Topic unavailable" }),
	).toBeVisible();
	expect(screen.getByRole("link", { name: "Back to Work" })).toHaveAttribute(
		"href",
		"/work",
	);
	expect(screen.queryByRole("article")).not.toBeInTheDocument();
	expect(screen.queryByRole("tab")).not.toBeInTheDocument();
});
