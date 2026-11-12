import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "@semoss/ui/next";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { linkRoomTopic } from "@/features/rooms/api/room-topics";
import { takeFileToShow } from "@/features/rooms/room-file-to-show";
import { type DriveFile, useOpenFileRoom } from "./use-open-file-room";

const rooms = vi.hoisted(() => {
	// every pixel a room's own insight runs; the download is the only one here
	const run = vi.fn();
	const make = (roomId: string, isReady: boolean) => ({
		retain: vi.fn(() => vi.fn()),
		initialize: vi.fn(async () => undefined),
		create: vi.fn(async (_title: string) => "room-new"),
		getSnapshot: () => ({ roomId, isReady }),
		insight: { actions: { run } },
	});
	return {
		run,
		make,
		created: [] as ReturnType<typeof make>[],
		loaded: [] as string[],
		isSavedRoomReady: true,
		openRoom: vi.fn(async (_roomId: string) => undefined),
	};
});
vi.mock("@/features/rooms/room-session", () => ({
	createRoomSession: () => {
		const session = rooms.make("", true);
		rooms.created.push(session);
		return session;
	},
	getRoomSession: (_scope: string, roomId: string) => {
		rooms.loaded.push(roomId);
		return rooms.make(roomId, rooms.isSavedRoomReady);
	},
}));
vi.mock("@/features/rooms/api/room-topics", () => ({
	linkRoomTopic: vi.fn(async () => []),
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ insightId: "scope", actions: {} }),
}));
vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({ openRoom: rooms.openRoom }),
}));

const DECK: DriveFile = { id: "f1", driveId: "d1", name: "Q1 Review.pptx" };

function Opener({ file }: { file: DriveFile }) {
	const { open, openingId } = useOpenFileRoom();
	return (
		<button type="button" onClick={() => open(file)}>
			{openingId ? `Opening ${openingId}` : "Open"}
		</button>
	);
}

/** Two topics: the first has the deck linked, the second another file. */
function stateWithLinkedDeck(): CollaborationState {
	const state = createInitialCollaborationState();
	state.topics = state.topics.slice(0, 2).map((topic, index) => ({
		...topic,
		id: index === 0 ? "launch" : "other",
		files: [
			{
				itemId: index === 0 ? "f1" : "f9",
				driveId: "d1",
				name: "linked",
				source: "onedrive",
			},
		],
	}));
	return state;
}

async function openDeck(state = stateWithLinkedDeck()) {
	render(
		<CollaborationSessionProvider initialState={state}>
			<Opener file={DECK} />
		</CollaborationSessionProvider>,
	);
	await userEvent.click(screen.getByRole("button", { name: "Open" }));
}

beforeEach(() => {
	rooms.run.mockImplementation(async () => ({
		pixelReturn: [
			{
				output: { filePath: "Q1 Review.pptx", name: "Q1 Review.pptx" },
				operationType: ["OPERATION"],
			},
		],
	}));
});

afterEach(() => {
	cleanup();
	localStorage.clear();
	vi.clearAllMocks();
	rooms.created.length = 0;
	rooms.loaded.length = 0;
	rooms.isSavedRoomReady = true;
	takeFileToShow("room-new");
});

it("opens a file in a new room named after it, in the topics it is linked to, with the file shown there", async () => {
	await openDeck();
	await waitFor(() =>
		expect(rooms.openRoom).toHaveBeenCalledWith("room-new"),
	);
	expect(rooms.created).toHaveLength(1);
	expect(rooms.created[0]?.create).toHaveBeenCalledWith("Q1 Review.pptx");
	// copied by the room's own insight, which is whose folder it lands in
	expect(rooms.run).toHaveBeenCalledWith(
		'MicrosoftOneDriveDownloadFile(driveId=["d1"], itemId=["f1"]);',
	);
	expect(linkRoomTopic).toHaveBeenCalledTimes(1);
	expect(linkRoomTopic).toHaveBeenCalledWith(
		expect.anything(),
		"room-new",
		"launch",
	);
	expect(takeFileToShow("room-new")).toEqual({
		path: "Q1 Review.pptx",
		name: "Q1 Review.pptx",
	});
	await screen.findByRole("button", { name: "Open" });
});

it("returns to the room this browser opened for the file before, without taking its topics again", async () => {
	await openDeck();
	await waitFor(() => expect(rooms.openRoom).toHaveBeenCalledTimes(1));
	cleanup();
	vi.mocked(linkRoomTopic).mockClear();
	await openDeck();
	await waitFor(() => expect(rooms.openRoom).toHaveBeenCalledTimes(2));
	expect(rooms.loaded).toEqual(["room-new"]);
	// no second room, and a topic the owner took off the chat is not put back
	expect(rooms.created).toHaveLength(1);
	expect(linkRoomTopic).not.toHaveBeenCalled();
	// the copy is brought up to date on the way in
	expect(rooms.run).toHaveBeenCalledTimes(2);
	expect(takeFileToShow("room-new")).toEqual({
		path: "Q1 Review.pptx",
		name: "Q1 Review.pptx",
	});
});

it("makes a new room when the remembered one no longer loads", async () => {
	await openDeck();
	await waitFor(() => expect(rooms.openRoom).toHaveBeenCalledTimes(1));
	cleanup();
	rooms.isSavedRoomReady = false;
	await openDeck();
	await waitFor(() => expect(rooms.openRoom).toHaveBeenCalledTimes(2));
	expect(rooms.created).toHaveLength(2);
	expect(rooms.created[1]?.create).toHaveBeenCalledWith("Q1 Review.pptx");
});

it("says why a file could not be opened, opens no room, and tries the same room next time", async () => {
	const error = vi.spyOn(toast, "error").mockImplementation(() => "");
	rooms.run.mockImplementation(async () => ({
		pixelReturn: [
			{ output: "Sign in to Microsoft.", operationType: ["ERROR"] },
		],
	}));
	await openDeck();
	await waitFor(() =>
		expect(error).toHaveBeenCalledWith("Sign in to Microsoft."),
	);
	expect(rooms.openRoom).not.toHaveBeenCalled();
	expect(takeFileToShow("room-new")).toBeUndefined();
	await screen.findByRole("button", { name: "Open" });
	// the room made for it is kept, so a retry does not leave an empty room behind
	cleanup();
	await openDeck();
	await waitFor(() => expect(rooms.loaded).toEqual(["room-new"]));
	expect(rooms.created).toHaveLength(1);
});
