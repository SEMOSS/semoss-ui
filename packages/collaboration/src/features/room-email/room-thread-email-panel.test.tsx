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

function page(messages: WorkspaceMessage[]) {
	return { messages, hasMore: false, hiddenCount: 0, unavailableCount: 0 };
}

function setup() {
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
		openThread: vi.fn(),
		requestSend: vi.fn(),
	};
	const store = createWorkbenchStore({
		components: ROOM_THREAD_EMAIL_PANEL_COMPONENTS,
	});
	const id = store
		.getState()
		.layout.actions.selectPanel(
			ROOM_THREAD_EMAIL_PANEL_TYPE,
			{ threadId: "thread-1" },
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
