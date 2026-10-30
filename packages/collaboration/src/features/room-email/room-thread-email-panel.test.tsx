import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ContextType } from "react";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import type { readThreadMessagesPage } from "@/features/collaboration/live/live-state";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { InsightActions } from "@/lib/pixel";
import { RoomEmailContext } from "./room-email.context";
import { RoomEmailStore } from "./room-email-store";
import {
	ROOM_THREAD_EMAIL_PANEL_COMPONENTS,
	ROOM_THREAD_EMAIL_PANEL_TYPE,
	RoomThreadEmailPanel,
} from "./room-thread-email-panel";

const readPage = vi.hoisted(() => vi.fn<typeof readThreadMessagesPage>());
vi.mock("@/features/collaboration/live/live-state", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("@/features/collaboration/live/live-state")
	>()),
	readThreadMessagesPage: readPage,
}));

const nomination: WorkspaceMessage = {
	id: "nomination",
	fromId: "amanda",
	fromName: "Amanda Montenegro",
	fromAddress: "amanda@example.com",
	subject: "NVIDIA GTC DC | OME Workshop Nomination & Registration",
	at: "2026-10-20T12:00:00Z",
	text: "Register through the NVIDIA GTC DC site.",
};

const ownReply: WorkspaceMessage = {
	id: "own-reply",
	fromId: "owner",
	fromName: "Owner",
	subject: "RE: NVIDIA GTC DC | OME Workshop Nomination & Registration",
	at: "2026-10-21T12:00:00Z",
	text: "Will do.",
};

const excluded: WorkspaceMessage = {
	id: "excluded",
	fromId: "muted",
	at: "2026-10-22T12:00:00Z",
	text: "Excluded message body",
	excluded: true,
};

function page(
	messages: WorkspaceMessage[],
	extra: Partial<Awaited<ReturnType<typeof readThreadMessagesPage>>> = {},
) {
	return {
		messages,
		hasMore: false,
		hiddenCount: 0,
		unavailableCount: 0,
		...extra,
	};
}

function setup(config: Record<string, string> = {}) {
	const actions = { run: vi.fn() } as unknown as InsightActions;
	const room: NonNullable<ContextType<typeof RoomEmailContext>> = {
		store: new RoomEmailStore(),
		session: {
			insight: { insightId: "room-insight", actions },
			retain: vi.fn(() => vi.fn()),
			readEmailAttachment: vi.fn(),
			updateSourceFile: vi.fn(),
		},
		source: null,
		sourceMessages: [],
		isSourceLoading: false,
		sourceError: null,
		reloadSource: vi.fn(),
		hasSourceEmail: false,
		hasSourceChat: false,
		openSource: vi.fn(),
		selectSourceMessage: vi.fn(),
		replyToSource: vi.fn(),
		openDraft: vi.fn(),
		openItem: vi.fn(),
		requestSend: vi.fn(),
	};
	const store = createWorkbenchStore({
		components: ROOM_THREAD_EMAIL_PANEL_COMPONENTS,
	});
	const id = store
		.getState()
		.layout.actions.selectPanel(
			ROOM_THREAD_EMAIL_PANEL_TYPE,
			{ threadId: "thread-1", ...config },
			{ name: "Email" },
		);
	const state = createInitialCollaborationState();
	render(
		<CollaborationSessionProvider
			initialState={{
				...state,
				liveProfile: { ...state.profile, id: "owner" },
			}}
		>
			<RoomEmailContext.Provider value={room}>
				<WorkbenchProvider store={store}>
					<RoomThreadEmailPanel id={id} />
				</WorkbenchProvider>
			</RoomEmailContext.Provider>
		</CollaborationSessionProvider>,
	);
	return { actions, store, id };
}

beforeEach(() => vi.clearAllMocks());

it("reads the thread through the room and shows the newest email someone else sent, without a reply", async () => {
	readPage.mockResolvedValue(page([nomination, ownReply, excluded]));
	const test = setup();
	expect(screen.getByRole("status")).toHaveTextContent("Loading email…");
	expect(
		await screen.findByRole("heading", { name: nomination.subject }),
	).toBeVisible();
	expect(readPage).toHaveBeenCalledWith(test.actions, "thread-1");
	expect(screen.getByText(nomination.text)).toBeVisible();
	expect(screen.queryByText(excluded.text)).not.toBeInTheDocument();
	expect(screen.getByRole("combobox", { name: "Email" })).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "Reply" }),
	).not.toBeInTheDocument();
	expect(test.store.getState().layout.panels[test.id]?.name).toBe(
		nomination.subject,
	);
});

it("keeps a failed read recoverable", async () => {
	readPage
		.mockRejectedValueOnce(new Error("Brain could not read this thread."))
		.mockResolvedValueOnce(page([nomination]));
	setup();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Brain could not read this thread.",
	);
	await userEvent.click(screen.getByRole("button", { name: "Try again" }));
	expect(
		await screen.findByRole("heading", { name: nomination.subject }),
	).toBeVisible();
	expect(readPage).toHaveBeenCalledTimes(2);
});

it("opens the exact email asked for, and says so when it is not there instead of quietly showing another", async () => {
	readPage.mockResolvedValue(page([nomination, ownReply]));
	setup({ messageId: "own-reply" });
	expect(await screen.findByText(ownReply.text)).toBeVisible();
	expect(screen.queryByText(nomination.text)).not.toBeInTheDocument();
	expect(
		screen.queryByText(/not among the emails you can read/),
	).not.toBeInTheDocument();
});

it("tells the owner when the email asked for is gone", async () => {
	readPage.mockResolvedValue(page([nomination]));
	setup({ messageId: "deleted-email" });
	expect(
		await screen.findByText(
			"That email is not among the emails you can read in this thread.",
		),
	).toBeVisible();
	expect(screen.getByRole("status")).toHaveTextContent(
		"not among the emails you can read",
	);
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("reads a Brain Teams thread as a chat with its Teams link", async () => {
	readPage.mockResolvedValue(
		page(
			[
				{
					id: "m2",
					fromId: "raj",
					fromName: "Raj Patel",
					at: "2026-10-21T12:00:00Z",
					text: "Second message",
					webLink: "https://teams.microsoft.com/l/message/2",
				},
				{
					id: "m1",
					fromId: "dana",
					fromName: "Dana Lee",
					at: "2026-10-20T12:00:00Z",
					text: "First message",
				},
			],
			{ source: "teams" },
		),
	);
	setup({ source: "teams" });
	expect(screen.getByRole("status")).toHaveTextContent("Loading chat...");
	const chat = await screen.findByRole("region", { name: "Teams chat" });
	expect(chat).toHaveTextContent("Dana Lee, Raj Patel");
	const [first, second] = [
		screen.getByText("First message"),
		screen.getByText("Second message"),
	];
	expect(
		first.compareDocumentPosition(second) &
			Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();
	// the header opens the newest message in Teams; that message also has its own link
	const links = screen.getAllByRole("link", { name: "Open in Teams" });
	expect(links).toHaveLength(2);
	for (const link of links)
		expect(link).toHaveAttribute(
			"href",
			"https://teams.microsoft.com/l/message/2",
		);
});

it("says why a thread shows nothing", async () => {
	readPage.mockResolvedValue(page([], { unavailableCount: 2 }));
	setup();
	expect(
		await screen.findByText(
			"This thread's messages were deleted or moved.",
		),
	).toBeVisible();
});
