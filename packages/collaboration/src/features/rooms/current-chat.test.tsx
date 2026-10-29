import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { TooltipProvider, toast } from "@semoss/ui/next";
import { ThreadMenu } from "@/features/collaboration/components/thread-menu";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { uploadRoomFiles } from "./api/upload-room-files";
import { addThreadToChat, useShowCurrentChat } from "./current-chat";
import { getRoomSession, type RoomSession } from "./room-session";
import {
	loadSourceThread,
	type SourceThreadDocument,
} from "./source-import/load-source-thread";
import { sourceThreadFile } from "./source-import/source-thread-file";

vi.mock("./source-import/load-source-thread", () => ({
	loadSourceThread: vi.fn(),
}));
vi.mock("./source-import/source-thread-file", () => ({
	sourceThreadFile: vi.fn(
		(document: SourceThreadDocument) =>
			new File(["text"], `${document.thread.subject}.md`),
	),
}));
vi.mock("./api/upload-room-files", () => ({ uploadRoomFiles: vi.fn() }));
vi.mock("./room-session", async (original) => ({
	...(await original<typeof import("./room-session")>()),
	getRoomSession: vi.fn(),
}));

const threadId = "th-geng-review";
const document: SourceThreadDocument = {
	thread: {
		id: threadId,
		subject: "Budget review",
		channel: "email",
	} as Thread,
	kind: "brain",
	messages: [
		{
			id: "m1",
			fromId: "p1",
			at: "2026-10-01T09:00:00Z",
			text: "First draft attached",
			subject: "Budget review",
		},
		{
			id: "m2",
			fromId: "p2",
			at: "2026-10-02T09:00:00Z",
			text: "Numbers look right",
			subject: "RE: Budget review",
		},
	],
	limitations: [],
};
const getState = () => createInitialCollaborationState();

/** Only what adding touches; a draft gets its room id when it is created. */
function fakeChat(title = "New chat", roomId = "") {
	let snapshot = { roomId, title };
	const chat = {
		scope: "app",
		insight: { insightId: "chat-insight", actions: { run: vi.fn() } },
		getSnapshot: () => snapshot,
		retain: vi.fn(() => () => undefined),
		initialize: vi.fn(async () => undefined),
		create: vi.fn(async () => {
			snapshot = { ...snapshot, roomId: snapshot.roomId || "room-1" };
			return snapshot.roomId;
		}),
		addContextFile: vi.fn(),
	};
	vi.mocked(getRoomSession).mockReturnValue(chat as unknown as RoomSession);
	return chat;
}

beforeEach(() => {
	vi.mocked(loadSourceThread).mockResolvedValue(document);
	vi.mocked(uploadRoomFiles).mockImplementation(async (_insightId, files) =>
		files.map((file) => ({ fileName: file.name, fileLocation: file.name })),
	);
});
afterEach(() => {
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

it("gives a draft its room before saving the thread there, then queues it", async () => {
	const chat = fakeChat();
	await expect(
		addThreadToChat(chat as unknown as RoomSession, getState, threadId),
	).resolves.toBe("room-1");
	expect(chat.create.mock.invocationCallOrder[0]).toBeLessThan(
		vi.mocked(uploadRoomFiles).mock.invocationCallOrder[0],
	);
	expect(sourceThreadFile).toHaveBeenCalledWith(document);
	expect(uploadRoomFiles).toHaveBeenCalledWith("chat-insight", [
		expect.any(File),
	]);
	expect(chat.addContextFile).toHaveBeenCalledWith({
		fileName: "Budget review.md",
		fileLocation: "Budget review.md",
	});
});

it("adds one email under its own subject and refuses one the rules hide", async () => {
	const chat = fakeChat("Q3 plan", "room-q3");
	await addThreadToChat(
		chat as unknown as RoomSession,
		getState,
		threadId,
		"m2",
	);
	expect(sourceThreadFile).toHaveBeenLastCalledWith(
		expect.objectContaining({
			thread: expect.objectContaining({ subject: "RE: Budget review" }),
			messages: [document.messages[1]],
		}),
	);
	await expect(
		addThreadToChat(
			chat as unknown as RoomSession,
			getState,
			threadId,
			"excluded",
		),
	).rejects.toThrow("This email is not available to the assistant.");
	expect(chat.addContextFile).toHaveBeenCalledOnce();
});

it("offers Add to chat only once a chat was shown, and offers Open after leaving it", async () => {
	const success = vi.spyOn(toast, "success");
	const chat = fakeChat("Q3 plan", "room-q3");
	function Shown() {
		useShowCurrentChat(chat as unknown as RoomSession);
		return null;
	}
	function Page({ isChatShown }: { isChatShown: boolean }) {
		const thread = getState().threads.find((item) => item.id === threadId);
		if (!thread) throw new Error("Missing fixture thread");
		return (
			<>
				{isChatShown && <Shown />}
				<ThreadMenu thread={thread} />
			</>
		);
	}
	const page = (isChatShown: boolean) =>
		createMemoryRouter(
			[
				{
					path: "*",
					element: (
						<CollaborationSessionProvider initialState={getState()}>
							<Page isChatShown={isChatShown} />
						</CollaborationSessionProvider>
					),
				},
			],
			{ initialEntries: ["/brain/threads"] },
		);
	const user = userEvent.setup();
	const open = () =>
		user.click(screen.getByRole("button", { name: /^Thread actions for/ }));
	// the current chat is app-wide, so this case must run before any chat is shown
	const { unmount } = render(
		<TooltipProvider>
			<RouterProvider router={page(false)} />
		</TooltipProvider>,
	);
	await open();
	expect(screen.queryByRole("button", { name: /^Add to/ })).toBeNull();
	unmount();

	const shown = render(
		<TooltipProvider>
			<RouterProvider router={page(true)} />
		</TooltipProvider>,
	);
	await open();
	await user.click(screen.getByRole("button", { name: "Add to “Q3 plan”" }));
	await waitFor(() => expect(chat.addContextFile).toHaveBeenCalledOnce());
	await waitFor(() =>
		expect(success).toHaveBeenLastCalledWith(
			"Added to “Q3 plan”",
			expect.objectContaining({ action: undefined }),
		),
	);
	shown.unmount();

	render(
		<TooltipProvider>
			<RouterProvider router={page(false)} />
		</TooltipProvider>,
	);
	await open();
	await user.click(screen.getByRole("button", { name: "Add to “Q3 plan”" }));
	await waitFor(() =>
		expect(success).toHaveBeenLastCalledWith(
			"Added to “Q3 plan”",
			expect.objectContaining({
				action: expect.objectContaining({ label: "Open" }),
			}),
		),
	);
});
