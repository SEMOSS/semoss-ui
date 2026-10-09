import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type {
	CollaborationState,
	Memory,
	Thread,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import {
	type CollaborationChange,
	CollaborationSessionProvider,
} from "@/features/collaboration/state/collaboration-session.context";
import { WorkPage } from "./work.page";

const sessions = vi.hoisted(() => ({ mounted: vi.fn() }));
const pointerCaptureDescriptors = [
	"hasPointerCapture",
	"setPointerCapture",
	"releasePointerCapture",
].map((key) => ({
	key,
	descriptor: Object.getOwnPropertyDescriptor(HTMLElement.prototype, key),
}));
vi.mock("@/features/dashboard/topic-sessions", () => ({
	TopicSessions: ({ topicId }: { topicId: string }) => {
		sessions.mounted(topicId);
		return <p>Sessions for {topicId}</p>;
	},
}));

beforeAll(() => {
	// JSDOM lacks pointer capture used by the shared Select and toast primitives.
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.setPointerCapture = () => undefined;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

afterAll(() => {
	for (const { key, descriptor } of pointerCaptureDescriptors) {
		if (descriptor)
			Object.defineProperty(HTMLElement.prototype, key, descriptor);
		else Reflect.deleteProperty(HTMLElement.prototype, key);
	}
});

afterEach(() => {
	act(() => toast.dismiss());
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
		priority: "P2",
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

/** Mounts real task composition and shared commands without room/network reads. */
function renderWork(path: string, initialState = workState()) {
	const onChange = vi.fn<(change: CollaborationChange) => void>();
	const router = createMemoryRouter(
		[
			...[
				"/tasks",
				"/tasks/topics",
				"/work",
				"/work/all",
				"/work/waiting",
				"/work/done",
				"/work/topics",
				"/work/topic/:topicId",
				"/tasks/all",
				"/tasks/waiting",
				"/tasks/done",
				"/tasks/topic/:topicId",
			].map((route) => ({ path: route, Component: WorkPage })),
			{ path: "/for-you", element: <h1>For you queue</h1> },
			{ path: "/thread/:threadId", element: <p>Source import</p> },
		],
		{ initialEntries: [path] },
	);
	render(
		<CollaborationSessionProvider
			initialState={initialState}
			onChange={onChange}
		>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return { router, user: userEvent.setup(), onChange };
}

it("keeps the topic directory and existing new-topic dialog reachable from Tasks", async () => {
	const { user } = renderWork("/tasks/topics");
	expect(screen.getByRole("heading", { name: "Topics" })).toBeVisible();
	const index = screen.getByRole("list", { name: "Task topics" });
	const alpha = within(index).getByRole("link", { name: /Alpha launch/ });
	expect(alpha).toHaveAttribute("href", "/tasks/topic/alpha");
	expect(alpha).toHaveTextContent("Ship the launch with the customer.");
	expect(alpha).toHaveTextContent("3 open");
	expect(alpha).toHaveTextContent("1 waiting");
	expect(alpha).not.toHaveTextContent("999");
	expect(screen.queryByText("Archived topic")).not.toBeInTheDocument();
	expect(screen.queryByRole("article")).not.toBeInTheDocument();
	expect(screen.getByRole("link", { name: "For you" })).toHaveAttribute(
		"href",
		"/for-you",
	);
	const create = screen.getByRole("button", { name: "New topic" });
	await user.click(create);
	expect(screen.getByRole("dialog", { name: "New topic" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(create).toHaveFocus();
});

it.each(["/tasks/topic/alpha", "/work/topic/alpha"])(
	"keeps topic goals and confirmed context scoped on %s",
	(path) => {
		const state = workState();
		renderWork(path, state);
		expect(
			screen.getByRole("heading", { name: "Alpha launch" }),
		).toBeVisible();
		expect(
			screen.getByRole("region", { name: "Topic goals" }),
		).toHaveTextContent("Launch by Friday");
		expect(
			screen.getByRole("link", { name: "Edit in Brain" }),
		).toHaveAttribute("href", "/brain/topics/alpha");
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
	},
);

it("combines topic status and source filters, keeps multi-topic work, and sorts scoped rows", async () => {
	const { user } = renderWork("/tasks/topic/alpha");
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

it("opens source threads by their canonical import route and reads sessions only on selection", async () => {
	const { router, user } = renderWork("/tasks/topic/alpha");
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
	await act(() => router.navigate("/tasks/topic/beta"));
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
	renderWork("/tasks/topic/missing");
	expect(
		screen.getByRole("heading", { name: "Topic unavailable" }),
	).toBeVisible();
	expect(
		screen.getByRole("link", { name: "Back to For you" }),
	).toHaveAttribute("href", "/for-you");
	expect(screen.queryByRole("article")).not.toBeInTheDocument();
	expect(screen.queryByRole("tab")).not.toBeInTheDocument();
});

it.each(["/tasks", "/tasks/all", "/work", "/work/all"])(
	"redirects the saved queue %s to For you while preserving filters",
	async (path) => {
		const { router } = renderWork(
			`${path}?view=list&topic=alpha&q=pricing&status=open#review`,
		);
		await screen.findByRole("heading", { name: "For you queue" });
		expect(router.state.location.pathname).toBe("/for-you");
		expect(
			Object.fromEntries(
				new URLSearchParams(router.state.location.search),
			),
		).toEqual({ view: "list", topic: "alpha", q: "pricing" });
		expect(router.state.location.hash).toBe("#review");
		expect(router.state.historyAction).toBe("REPLACE");
	},
);

it.each([
	["/tasks/waiting", "Waiting on others", "Waiting 1", "alpha-wait"],
	["/work/waiting", "Waiting on others", "Waiting 1", "alpha-wait"],
	["/tasks/done", "Handled", "Handled 1", "alpha-done"],
	["/work/done", "Handled", "Handled 1", "alpha-done"],
	["/tasks?status=waiting", "Waiting on others", "Waiting 1", "alpha-wait"],
	["/work/all?status=done", "Handled", "Handled 1", "alpha-done"],
])(
	"preserves the status bookmark %s outside the pending queue",
	async (path, title, tab, id) => {
		const { router } = renderWork(path);
		await screen.findByRole("heading", { name: title });
		expect(screen.getByRole("tab", { name: tab })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(
			screen.getByRole("link", { name: `Action ${id}` }),
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Back to For you" }),
		).toHaveAttribute("href", "/for-you");
		expect(
			screen.queryByRole("button", { name: "New task" }),
		).not.toBeInTheDocument();
		expect(router.state.location.pathname).toBe(
			title === "Handled" ? "/tasks/done" : "/tasks/waiting",
		);
	},
);

it("preserves topic and search scope through a saved handled link", async () => {
	const { router } = renderWork("/work/all?status=done&topic=beta&q=alpha");
	await screen.findByRole("heading", { name: "Handled" });
	expect(screen.getByRole("tab", { name: "Handled 0" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(screen.queryByRole("article")).not.toBeInTheDocument();
	expect(
		Object.fromEntries(new URLSearchParams(router.state.location.search)),
	).toEqual({ topic: "beta", q: "alpha" });
});
