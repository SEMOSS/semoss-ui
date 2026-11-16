import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MailMessage, MailPages } from "@semoss/connectors";
import { toast } from "@semoss/ui/next";
import {
	WorkUpdatesContext,
	type WorkUpdatesStatus,
} from "@/features/collaboration/live/work-updates.context";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import {
	type CollaborationChange,
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import { connectMicrosoft } from "@/features/connectors/api/microsoft";
import { addMailToTopic } from "./api/topic-mail";
import { MailboxSource } from "./mailbox-source";

const mocks = vi.hoisted(() => ({
	insight: { actions: {} },
	pages: {} as MailPages,
	options: vi.fn(),
}));

// the mailbox's paging is the library's own; the list only has to pass its folder and search on
vi.mock("@semoss/connectors", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/connectors")>()),
	useMailPages: (options: unknown) => {
		mocks.options(options);
		return mocks.pages;
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => mocks.insight,
}));
vi.mock("./api/topic-mail", () => ({ addMailToTopic: vi.fn() }));
vi.mock("@/features/connectors/api/microsoft", () => ({
	connectMicrosoft: vi.fn(),
}));
vi.mock("./mail-reader", () => ({
	MailReader: ({ messageId }: { messageId: string }) => (
		<p>Reading {messageId}</p>
	),
}));

const TOPIC = "t-geng";
const OTHER = "t-gsales";
const addMail = vi.mocked(addMailToTopic);

const mail = (
	id: string,
	conversationId: string,
	subject: string,
	fromName: string,
	hour: number,
): MailMessage => ({
	id,
	conversationId,
	subject,
	fromName,
	from: `${fromName.toLowerCase().replace(" ", ".")}@example.com`,
	to: [],
	cc: [],
	receivedDate: new Date(Date.UTC(2026, 10, 9, hour)).toISOString(),
	isUnread: false,
	hasAttachments: false,
	isBodyTruncated: false,
	attachments: [],
});

/** A page of the folder as the mailbox answers it, ready unless changed. */
function mailbox(changes: Partial<MailPages> = {}): MailPages {
	return {
		status: "ready",
		data: [
			mail("m1", "c-held", "RE: Renewal pricing", "Ava Reed", 15),
			mail("m2", "c-new", "Lunch on Thursday", "Ben Carter", 14),
			mail("m3", "c-new", "RE: Lunch on Thursday", "Dana Ortiz", 13),
			mail("m4", "c-other", "", "Kira Stone", 12),
		],
		error: null,
		pageError: null,
		isRefreshing: false,
		hasMore: false,
		reload: vi.fn(),
		loadMore: vi.fn(),
		...changes,
	};
}

const updates: WorkUpdatesStatus = {
	isRefreshing: false,
	lastUpdated: null,
	error: "",
	lastMailCheck: null,
	refresh: vi.fn(),
	refreshTopic: vi.fn(),
	isSyncing: false,
	lastSync: null,
	syncError: "",
	syncMail: vi.fn(),
	serverId: async (id) => (id === TOPIC ? "server-geng" : id),
	localId: (id) => id,
};

function SourceFixture({ onSignedIn }: { onSignedIn: () => void }) {
	const { state } = useCollaborationSession();
	const topic = state.topics.find((candidate) => candidate.id === TOPIC);
	if (!topic) throw new Error("Missing topic fixture");
	return (
		<MailboxSource
			topic={topic}
			folderId="f-clients"
			folderName="Inbox / Clients"
			onSignedIn={onSignedIn}
		/>
	);
}

/** Brain holds c-held, not in the topic unless asked for, and c-other under another topic. */
function setup(isHeldInTopic = false) {
	const state = createInitialCollaborationState();
	const [template] = state.threads;
	if (!template) throw new Error("Missing thread fixture");
	const held = (
		id: string,
		conversationId: string,
		topicId?: string,
	): Thread => ({
		...template,
		id,
		source: { kind: "outlook", nativeId: `${id}-latest`, conversationId },
		topicLinks: topicId
			? [{ topicId, source: "you", confidence: 100, primary: true }]
			: [],
	});
	state.threads = [
		held("thread-held", "c-held", isHeldInTopic ? TOPIC : undefined),
		held("thread-other", "c-other", OTHER),
	];
	state.items = [];
	const onChange = vi.fn<(change: CollaborationChange) => void>();
	const onSignedIn = vi.fn();
	render(
		<WorkUpdatesContext.Provider value={updates}>
			<CollaborationSessionProvider
				initialState={state}
				onChange={onChange}
			>
				<SourceFixture onSignedIn={onSignedIn} />
			</CollaborationSessionProvider>
		</WorkUpdatesContext.Provider>,
	);
	return { onChange, onSignedIn, user: userEvent.setup() };
}

const box = (name: string) => screen.getByRole("checkbox", { name });

beforeEach(() => {
	vi.clearAllMocks();
	mocks.pages = mailbox();
	addMail.mockResolvedValue(undefined);
});
afterEach(cleanup);

it("lists the folder a conversation a row, with what Brain knows of each", () => {
	setup(true);
	expect(mocks.options).toHaveBeenLastCalledWith(
		expect.objectContaining({
			provider: "microsoft",
			folder: "f-clients",
			search: "",
		}),
	);
	expect(screen.getByRole("list", { name: "Inbox / Clients" })).toBeVisible();
	// reply prefixes go, and an email with no subject still has a name
	expect(box("Renewal pricing")).toBeChecked();
	expect(box("Renewal pricing")).toHaveAccessibleDescription("Ava Reed");
	// two emails of one conversation share a row, named for the newest
	expect(box("Lunch on Thursday")).not.toBeChecked();
	expect(box("Lunch on Thursday")).toHaveAccessibleDescription(
		"Ben Carter · 2 emails",
	);
	expect(box("(no subject)")).toHaveAccessibleDescription(
		"Kira Stone · In Northwind - Sales / GTM",
	);
	expect(screen.getAllByRole("checkbox")).toHaveLength(3);
});

it("files a conversation Brain already holds without asking the server", async () => {
	const { onChange, user } = setup();
	await user.click(box("Renewal pricing"));
	expect(onChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			commands: [
				{
					type: "thread.link",
					threadId: "thread-held",
					topicId: TOPIC,
					operation: "add",
				},
			],
		}),
	);
	expect(box("Renewal pricing")).toBeChecked();
	expect(addMail).not.toHaveBeenCalled();

	await user.click(box("Renewal pricing"));
	expect(onChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			commands: [expect.objectContaining({ operation: "remove" })],
		}),
	);
	expect(box("Renewal pricing")).not.toBeChecked();
});

it("has the server read and file a conversation Brain does not hold", async () => {
	let finish: () => void = () => undefined;
	addMail.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const { onChange, user } = setup();
	await user.click(box("Lunch on Thursday"));
	// every email of the conversation the folder lists, under the id the server knows the topic by
	expect(addMail).toHaveBeenCalledExactlyOnceWith(
		mocks.insight.actions,
		"server-geng",
		["m2", "m3"],
	);
	expect(box("Lunch on Thursday")).toHaveAttribute("aria-busy", "true");
	expect(box("Lunch on Thursday")).not.toBeChecked();
	// a second click while it saves asks for nothing more
	await user.click(box("Lunch on Thursday"));
	expect(addMail).toHaveBeenCalledOnce();

	await act(async () => finish());
	expect(box("Lunch on Thursday")).toBeChecked();
	expect(box("Lunch on Thursday")).not.toHaveAttribute("aria-busy");
	expect(screen.getByRole("status")).toHaveTextContent(
		'Added "Lunch on Thursday" to this topic.',
	);
	// Brain holds it now, so the page reads Brain again for its thread
	expect(updates.refresh).toHaveBeenCalledOnce();
	expect(onChange).not.toHaveBeenCalled();

	// until that thread arrives there is nothing on the page to take the topic off
	await user.click(box("Lunch on Thursday"));
	expect(box("Lunch on Thursday")).toBeChecked();
	expect(screen.getByRole("status")).toHaveTextContent(
		'"Lunch on Thursday" is still being filed. Try again in a moment.',
	);
});

it("says in plain words why a conversation could not be added, and leaves it unchecked", async () => {
	const error = vi.spyOn(toast, "error");
	addMail.mockRejectedValueOnce(
		new Error(
			'The email "Lunch on Thursday" cannot be added: it is in Junk, Deleted Items or Drafts, the owner keeps its sender out, or their mail is not set up yet',
		),
	);
	const { user } = setup();
	await user.click(box("Lunch on Thursday"));
	await waitFor(() =>
		expect(box("Lunch on Thursday")).not.toHaveAttribute("aria-busy"),
	);
	expect(box("Lunch on Thursday")).not.toBeChecked();
	expect(error).toHaveBeenCalledExactlyOnceWith(
		'Could not add "Lunch on Thursday".',
		{
			description:
				"It is in Junk, Deleted Items or Drafts, or your rules keep its sender out of Brain.",
		},
	);
	expect(updates.refresh).not.toHaveBeenCalled();
});

it("opens an email in the reading pane and adds it from there", async () => {
	const { user } = setup();
	const pane = screen.getByRole("region", { name: "Reading pane" });
	expect(pane).toHaveTextContent("Select an email to read it here.");

	await user.click(
		screen.getByRole("button", { name: /^Lunch on Thursday/ }),
	);
	// the newest email of the conversation
	expect(within(pane).getByText("Reading m2")).toBeVisible();
	await user.click(
		within(pane).getByRole("button", { name: "Add to topic" }),
	);
	expect(addMail).toHaveBeenCalledOnce();
	expect(
		await within(pane).findByRole("button", { name: "Remove from topic" }),
	).toBeVisible();
	expect(box("Lunch on Thursday")).toBeChecked();
});

it("searches the folder on the server once typing pauses", async () => {
	const { user } = setup();
	await user.type(
		screen.getByRole("searchbox", { name: "Search Inbox / Clients" }),
		"renewal",
	);
	await waitFor(() =>
		expect(mocks.options).toHaveBeenLastCalledWith(
			expect.objectContaining({ search: "renewal" }),
		),
	);
	// what was typed, not each key on the way to it
	const searches = new Set(
		mocks.options.mock.calls.map(([options]) => options.search),
	);
	expect([...searches]).toEqual(["", "renewal"]);
});

it("asks for a sign in when the mailbox is signed out, then reads it and its folders again", async () => {
	mocks.pages = mailbox({
		status: "signedOut",
		data: null,
		error: { kind: "signIn", message: "Sign in to continue." },
	});
	const { onSignedIn, user } = setup();
	expect(
		screen.getByText("Sign in to Microsoft 365 to read your mailbox."),
	).toBeVisible();
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "Sign in" }));
	await waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce());
	expect(connectMicrosoft).toHaveBeenCalledOnce();
	expect(mocks.pages.reload).toHaveBeenCalledOnce();
});

it("keeps the emails it has when the next page fails, and tries that page again", async () => {
	mocks.pages = mailbox({
		hasMore: true,
		pageError: { kind: "other", message: "Graph timed out" },
	});
	const { user } = setup();
	expect(screen.getByRole("alert")).toHaveTextContent("Graph timed out");
	expect(screen.getAllByRole("checkbox")).toHaveLength(3);
	await user.click(screen.getByRole("button", { name: "Try again" }));
	expect(mocks.pages.loadMore).toHaveBeenCalledOnce();
	expect(mocks.pages.reload).not.toHaveBeenCalled();
});
