import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import {
	type CollaborationChange,
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import { ThreadSource } from "./thread-source";
import type { ThreadView } from "./thread-views";

// the reader's own loading is covered where it lives; here it only has to show the open thread
vi.mock("@/features/collaboration/components/thread-conversation", () => ({
	ThreadConversation: ({ thread }: { thread: Thread }) => (
		<p>Reading {thread.subject}</p>
	),
}));

const TOPIC = "t-geng";
const OTHER = "t-gsales";

function SourceFixture({ view }: { view: ThreadView }) {
	const { state } = useCollaborationSession();
	const topic = state.topics.find((candidate) => candidate.id === TOPIC);
	if (!topic) throw new Error("Missing topic fixture");
	return <ThreadSource topic={topic} view={view} />;
}

const link = (topicId: string, source: "you" | "suggested" = "you") => ({
	topicId,
	source,
	confidence: 100,
	primary: true,
});

/** Threads named by subject, newest first, from Ava unless the changes say otherwise. */
function setup(
	view: ThreadView,
	threads: (Partial<Thread> & { subject: string })[],
) {
	const state = createInitialCollaborationState();
	const [template] = state.threads;
	if (!template) throw new Error("Missing thread fixture");
	state.threads = threads.map((changes, index) => ({
		...template,
		id: `thread-${index}`,
		topicLinks: [],
		needsTopicChoice: false,
		muted: false,
		automated: false,
		summary: "",
		lastAt: new Date(
			Date.UTC(2026, 8, 28) - index * 3600_000,
		).toISOString(),
		participants: [
			{ personId: "p-ava", role: "from", included: true },
			{ personId: "me", role: "to", included: true },
		],
		...changes,
	}));
	state.items = [];
	const onChange = vi.fn<(change: CollaborationChange) => void>();
	render(
		<CollaborationSessionProvider initialState={state} onChange={onChange}>
			<SourceFixture view={view} />
		</CollaborationSessionProvider>,
	);
	return { onChange, user: userEvent.setup() };
}

const box = (name: string) => screen.getByRole("checkbox", { name });
const subjects = () =>
	screen.queryAllByRole("checkbox").map((item) => {
		const id = item.getAttribute("aria-labelledby");
		return id ? document.getElementById(id)?.textContent : "";
	});

afterEach(cleanup);

it("lists the threads with no topic and adds one where it stands", async () => {
	const { onChange, user } = setup("unfiled", [
		{ subject: "Unfiled" },
		{ subject: "Here", topicLinks: [link(TOPIC)] },
		{ subject: "Elsewhere", topicLinks: [link(OTHER)] },
		{ subject: "Newsletter", automated: true },
		{ subject: "Ignored", muted: true },
	]);
	// automated and ignored mail is not offered for filing
	expect(subjects()).toEqual(["Unfiled"]);

	await user.click(box("Unfiled"));

	expect(onChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			commands: [
				{
					type: "thread.link",
					threadId: "thread-0",
					topicId: TOPIC,
					operation: "add",
				},
			],
		}),
	);
	// it is filed now, and stays listed so the change can be undone here
	expect(box("Unfiled")).toBeChecked();
	expect(screen.getByRole("status")).toHaveTextContent(
		'Added "Unfiled" to this topic.',
	);
});

it("takes a thread off the topic's own list and leaves it there, unchecked", async () => {
	const { onChange, user } = setup("topic", [
		{ subject: "Here", topicLinks: [link(TOPIC)] },
		{ subject: "Suggested here", topicLinks: [link(TOPIC, "suggested")] },
		{ subject: "Unfiled" },
	]);
	expect(subjects()).toEqual(["Here", "Suggested here"]);
	expect(box("Suggested here")).toHaveAccessibleDescription(
		/Suggested for this topic/,
	);
	// the list says what it is, and what unchecking does
	expect(
		screen.getByRole("heading", {
			name: "Emails and Teams chats in this topic",
		}),
	).toBeVisible();
	expect(screen.getByRole("status")).toHaveTextContent(
		"Uncheck a conversation to take it off this topic.",
	);

	await user.click(box("Here"));

	expect(onChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			commands: [
				{
					type: "thread.link",
					threadId: "thread-0",
					topicId: TOPIC,
					operation: "remove",
				},
			],
		}),
	);
	expect(box("Here")).not.toBeChecked();
	expect(subjects()).toEqual(["Here", "Suggested here"]);
});

it("searches subject, people and summary together", async () => {
	const { user } = setup("all", [
		{ subject: "Renewal pricing" },
		{
			subject: "Quick question",
			summary: "Ben wants the renewal date.",
			topicLinks: [link(OTHER)],
			participants: [
				{ personId: "p-ben", role: "from", included: true },
				{ personId: "me", role: "to", included: true },
			],
		},
		{ subject: "Lunch" },
	]);
	const search = screen.getByRole("searchbox", {
		name: "Search Everything Brain has read",
	});

	await user.type(search, "renewal ava");
	expect(subjects()).toEqual(["Renewal pricing"]);
	expect(box("Renewal pricing")).toHaveAccessibleDescription(/Ava Reed/);

	await user.clear(search);
	await user.type(search, "renewal ben");
	expect(subjects()).toEqual(["Quick question"]);
	expect(box("Quick question")).toHaveAccessibleDescription(
		/Ben Carter · In Northwind - Sales \/ GTM/,
	);

	await user.clear(search);
	await user.type(search, "nothing like this");
	expect(
		screen.getByText('No conversations here match "nothing like this".'),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Clear search" }));
	expect(search).toHaveValue("");
	expect(search).toHaveFocus();
	expect(subjects()).toHaveLength(3);
});

it("lists only Teams chats under Teams, fifty threads at a time", async () => {
	const { user } = setup(
		"teams",
		Array.from({ length: 130 }, (_, index) => ({
			subject: `Thread ${index}`,
			channel: index < 120 ? ("teams" as const) : ("email" as const),
		})),
	);
	const list = screen.getByRole("list");
	expect(within(list).getAllByRole("checkbox")).toHaveLength(50);
	await user.click(
		screen.getByRole("button", { name: "Show more (70 left)" }),
	);
	await user.click(
		screen.getByRole("button", { name: "Show more (20 left)" }),
	);
	expect(within(list).getAllByRole("checkbox")).toHaveLength(120);
	expect(
		screen.queryByRole("button", { name: /^Show more/ }),
	).not.toBeInTheDocument();
});

it("opens a thread in the reading pane and adds it from there", async () => {
	const { onChange, user } = setup("all", [
		{ subject: "Renewal pricing" },
		{ subject: "Lunch" },
	]);
	const pane = screen.getByRole("region", { name: "Reading pane" });
	expect(pane).toHaveTextContent("Select a conversation to read it here.");

	await user.click(screen.getByRole("button", { name: /^Renewal pricing/ }));

	expect(within(pane).getByText("Reading Renewal pricing")).toBeVisible();
	expect(
		within(pane).getByRole("heading", { name: "Renewal pricing" }),
	).toBeVisible();
	expect(
		screen.getByRole("button", { name: /^Renewal pricing/ }),
	).toHaveAttribute("aria-current", "true");

	await user.click(
		within(pane).getByRole("button", { name: "Add to topic" }),
	);
	expect(onChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			commands: [
				{
					type: "thread.link",
					threadId: "thread-0",
					topicId: TOPIC,
					operation: "add",
				},
			],
		}),
	);
	expect(box("Renewal pricing")).toBeChecked();
	expect(
		within(pane).getByRole("button", { name: "Remove from topic" }),
	).toBeVisible();

	// the way back from the pane, which a narrow screen shows in the list's place
	await user.click(
		within(pane).getByRole("button", { name: "Back to the list" }),
	);
	expect(pane).toHaveTextContent("Select a conversation to read it here.");
});
