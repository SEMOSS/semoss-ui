import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MailFolder, MailFolders } from "@semoss/connectors";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { TopicContents } from "./topic-contents";

const mocks = vi.hoisted(() => ({
	provider: vi.fn(),
	mailbox: {} as MailFolders,
}));

vi.mock("@semoss/connectors", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/connectors")>()),
	useMailFolders: (provider: unknown) => {
		mocks.provider(provider);
		return mocks.mailbox;
	},
}));
// each list is covered where it lives; the page only has to pick the right one
vi.mock("./mailbox-source", () => ({
	MailboxSource: (props: { folderId: string; folderName: string }) => (
		<p>
			Mail in {props.folderId}, named {props.folderName}
		</p>
	),
}));
vi.mock("./chat-source", () => ({
	ChatSource: ({ view }: { view: string }) => <p>Chats: {view}</p>,
}));

const folder = (
	id: string,
	name: string,
	depth: number,
	path = name,
): MailFolder => ({
	id,
	name,
	depth,
	path,
	unreadCount: id === "inbox" ? 4 : 0,
});

const TOPIC = "t-geng";

/** The fixture's topic as a saved one unless asked for the sample, with its threads to match. */
function setup(path = `/topics/${TOPIC}/contents`, isSample = false) {
	const state: CollaborationState = createInitialCollaborationState();
	for (const record of [...state.topics, ...state.threads])
		record.isSample = isSample;
	const router = createMemoryRouter(
		[
			{ path: "/topics/:topicId/contents", element: <TopicContents /> },
			{ path: "/topics/:topicId", element: <p>Topic page</p> },
		],
		{ initialEntries: [path] },
	);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return { router, state, user: userEvent.setup() };
}

const rail = () => screen.getByRole("navigation", { name: "What to list" });
// two groups each have an Assistant chats entry: the topic's own, and all of them
const group = (name: string) => within(rail()).getByRole("region", { name });

beforeEach(() => {
	vi.clearAllMocks();
	mocks.mailbox = {
		status: "ready",
		data: [],
		error: null,
		isRefreshing: false,
		reload: vi.fn(),
		folders: [
			folder("inbox", "Inbox", 0),
			folder("f-clients", "Clients", 1, "Inbox/Clients"),
			folder("f-northwind", "Northwind", 2, "Inbox/Clients/Northwind"),
			folder("f-sent", "Sent Items", 0),
		],
	};
});
afterEach(cleanup);

it("opens a saved topic on the inbox, with the mailbox's folders as a tree beside it", () => {
	const { state } = setup();
	expect(mocks.provider).toHaveBeenLastCalledWith("microsoft");
	expect(
		screen.getByRole("heading", {
			level: 1,
			name: "Emails and chats in Northwind - Engineering partnership",
		}),
	).toBeVisible();
	expect(screen.getByText("Mail in inbox, named Inbox")).toBeVisible();

	const tree = within(rail()).getByRole("tree", { name: "Outlook folders" });
	const inbox = within(tree).getByRole("treeitem", { name: /^Inbox/ });
	expect(inbox).toHaveAttribute("aria-selected", "true");
	// the inbox starts open; the folders inside its folders wait for their chevron
	expect(inbox).toHaveAttribute("aria-expanded", "true");
	expect(inbox).toHaveTextContent("4 unread");
	expect(
		within(tree).getByRole("treeitem", { name: /^Clients/ }),
	).toHaveAttribute("aria-expanded", "false");
	expect(
		within(tree).queryByRole("treeitem", { name: /^Northwind/ }),
	).not.toBeInTheDocument();

	// what the topic holds and what Brain has read, each with its count
	const inTopic = state.threads.filter((thread) =>
		thread.topicLinks.some((link) => link.topicId === TOPIC),
	).length;
	expect(
		within(group("In this topic")).getByRole("button", {
			name: `Emails and Teams chats ${inTopic}`,
		}),
	).toBeVisible();
	expect(
		within(group("Add from")).getByRole("button", {
			name: `Everything Brain has read ${state.threads.length}`,
		}),
	).toBeVisible();
});

it("keeps the two kinds of chat apart, each under its own name and above the folders", () => {
	const { state } = setup();
	const teams = state.threads.filter(
		(thread) => thread.channel === "teams",
	).length;
	expect(teams).toBeGreaterThan(0);
	// the short lists come before the tree, so a long mailbox cannot push them out of view
	const names = within(rail())
		.getAllByRole("heading")
		.map((heading) => heading.textContent);
	expect(names).toEqual(["In this topic", "Add from", "Outlook folders"]);
	expect(
		within(group("Add from"))
			.getAllByRole("button")
			.map((button) => button.textContent),
	).toEqual([
		`Teams chats${teams}`,
		"Assistant chats",
		expect.stringMatching(/^No topic yet/),
		expect.stringMatching(/^Everything Brain has read/),
	]);
	// the topic's own assistant chats are a list of their own
	expect(
		within(group("In this topic")).getByRole("button", {
			name: "Assistant chats",
		}),
	).toBeVisible();
});

it("leaves out the Outlook folders Brain never reads, with what is under them", () => {
	mocks.mailbox = {
		...mocks.mailbox,
		folders: [
			folder("inbox", "Inbox", 0),
			// a folder of the owner's that only shares a system folder's name is theirs to file from
			folder("f-drafts-mine", "Drafts", 1, "Inbox/Drafts"),
			folder("f-archive", "Archive", 0),
			folder("f-deleted", "Deleted Items", 0),
			folder("f-drafts", "Drafts", 0),
			folder("f-templates", "Templates", 1, "Drafts/Templates"),
			folder("f-junk", "Junk Email", 0),
			folder("f-history", "Conversation History", 0),
			folder("f-sync", "Sync Issues", 0),
			folder("f-conflicts", "Conflicts", 1, "Sync Issues/Conflicts"),
			folder("f-sent", "Sent Items", 0),
		],
	};
	setup();
	const tree = within(rail()).getByRole("tree", { name: "Outlook folders" });
	expect(
		within(tree)
			.getAllByRole("treeitem")
			.map((item) => item.querySelector(".truncate")?.textContent),
	).toEqual(["Inbox", "Drafts", "Archive", "Sent Items"]);
});

it("lists a nested folder by its path, and keeps the place in the address without adding history", async () => {
	const { router, user } = setup();
	const tree = within(rail()).getByRole("tree", { name: "Outlook folders" });
	await user.click(
		within(
			within(tree).getByRole("treeitem", { name: /^Clients/ }),
		).getByRole("button", { name: "Expand" }),
	);
	await user.click(
		within(
			within(tree).getByRole("treeitem", { name: /^Northwind/ }),
		).getByRole("button", { name: "Northwind" }),
	);
	expect(
		screen.getByText(
			"Mail in f-northwind, named Inbox / Clients / Northwind",
		),
	).toBeVisible();
	expect(router.state.location.search).toBe("?in=folder%3Af-northwind");
	expect(
		within(tree).getByRole("treeitem", { name: /^Northwind/ }),
	).toHaveAttribute("aria-selected", "true");

	await user.click(
		within(rail()).getByRole("button", { name: /^No topic yet/ }),
	);
	expect(screen.getByRole("list", { name: "No topic yet" })).toBeVisible();
	expect(
		within(rail()).getByRole("button", { name: /^No topic yet/ }),
	).toHaveAttribute("aria-current", "true");

	await user.click(
		within(group("Add from")).getByRole("button", {
			name: "Assistant chats",
		}),
	);
	expect(screen.getByText("Chats: all")).toBeVisible();
	// one entry, so Back leaves the page rather than walking the places
	expect(router.state.historyAction).toBe("REPLACE");
});

it("lists Teams chats on their own, and says how to turn them on when Brain reads none", async () => {
	const { state, user } = setup();
	await user.click(
		within(group("Add from")).getByRole("button", { name: /^Teams chats/ }),
	);
	expect(
		screen.getByRole("heading", { level: 2, name: "Teams chats" }),
	).toBeVisible();
	expect(
		screen.getByText(
			"Your Microsoft Teams chats, as far back as Brain has read them.",
		),
	).toBeVisible();
	const list = screen.getByRole("list", { name: "Teams chats" });
	expect(within(list).getAllByRole("checkbox")).toHaveLength(
		state.threads.filter((thread) => thread.channel === "teams").length,
	);
	expect(
		screen.queryByRole("link", {
			name: "Turn on Teams chats in Connections",
		}),
	).not.toBeInTheDocument();
});

it("points at Connections when Teams chats are off and Brain holds none", () => {
	const state = createInitialCollaborationState();
	for (const record of [...state.topics, ...state.threads])
		record.isSample = false;
	state.threads = state.threads.filter(
		(thread) => thread.channel !== "teams",
	);
	state.settings.sourcesJson = {
		...state.settings.sourcesJson,
		teams: false,
	};
	const router = createMemoryRouter(
		[{ path: "/topics/:topicId/contents", element: <TopicContents /> }],
		{ initialEntries: [`/topics/${TOPIC}/contents?in=teams`] },
	);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	// still offered, with nothing in it, so the owner learns where Teams chats would be
	expect(
		within(group("Add from")).getByRole("button", {
			name: "Teams chats 0",
		}),
	).toHaveAttribute("aria-current", "true");
	expect(
		screen.getByText("Brain has not read any Teams chats yet."),
	).toBeVisible();
	expect(
		screen.getByRole("link", {
			name: "Turn on Teams chats in Connections",
		}),
	).toHaveAttribute("href", "/brain/sources");
});

it("opens on the place a link asks for", () => {
	setup(`/topics/${TOPIC}/contents?in=topic-chats`);
	expect(screen.getByText("Chats: topic")).toBeVisible();
});

it("goes back to the topic on the tab that lists what was changed", async () => {
	const { router, user } = setup(`/topics/${TOPIC}/contents?in=chats`);
	expect(
		screen.getByRole("link", {
			name: "Back to Northwind - Engineering partnership",
		}),
	).toHaveAttribute("href", `/topics/${TOPIC}`);
	await user.click(screen.getByRole("link", { name: "Done" }));
	expect(screen.getByText("Topic page")).toBeVisible();
	expect(router.state.location.state).toEqual({ tab: "sessions" });
});

it("offers a sample topic only what Brain has read: no mailbox and no chats", () => {
	setup(`/topics/${TOPIC}/contents?in=chats`, true);
	expect(mocks.provider).toHaveBeenLastCalledWith(null);
	expect(
		within(rail()).queryByRole("tree", { name: "Outlook folders" }),
	).not.toBeInTheDocument();
	expect(
		within(rail()).queryByRole("button", { name: "Assistant chats" }),
	).not.toBeInTheDocument();
	// the place it cannot show falls back to the threads with no topic
	expect(screen.queryByText("Chats: all")).not.toBeInTheDocument();
	expect(screen.getByRole("list", { name: "No topic yet" })).toBeVisible();
});

it("says when the folders could not be read and reads them again", async () => {
	mocks.mailbox = {
		...mocks.mailbox,
		status: "error",
		folders: [folder("inbox", "Inbox", 0)],
	};
	const { user } = setup();
	expect(
		within(rail()).getByText("Could not read your folders."),
	).toBeVisible();
	await user.click(within(rail()).getByRole("button", { name: "Try again" }));
	expect(mocks.mailbox.reload).toHaveBeenCalledOnce();
});

it("sends a topic it does not have to the topic page, which says so", () => {
	const { router } = setup("/topics/gone/contents");
	expect(screen.getByText("Topic page")).toBeVisible();
	expect(router.state.location.pathname).toBe("/topics/gone");
});
