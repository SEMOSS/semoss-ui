import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { readRoomSourceAssociation } from "@/features/rooms/api/read-room-source-association";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import { RoomSourceAssociationsProvider } from "./room-source-associations-provider";
import { TopicSessions } from "./topic-sessions";

const mocks = vi.hoisted(() => ({
	rooms: [] as RoomRow[],
	isLoading: false,
	error: "",
	hasMore: false,
	loadMore: vi.fn(),
	retry: vi.fn(),
	openRoom: vi.fn(),
	actions: { run: vi.fn() },
}));

vi.mock("@/features/rooms/api/read-room-source-association", () => ({
	readRoomSourceAssociation: vi.fn(),
}));
vi.mock("@/features/collaboration/state/collaboration-session.context", () => ({
	useCollaborationSession: () => ({
		state: {
			threads: [
				{
					id: "source-one",
					roomId: "legacy",
					topicLinks: [{ topicId: "topic-one" }],
				},
				{
					id: "source-two",
					roomId: "mismatch",
					topicLinks: [{ topicId: "topic-one" }],
				},
				{
					id: "source-other",
					roomId: null,
					topicLinks: [{ topicId: "topic-other" }],
				},
			],
		},
	}),
}));
vi.mock("./dashboard.context", () => ({
	useDashboard: () => ({
		history: {
			rooms: mocks.rooms,
			isLoading: mocks.isLoading,
			error: mocks.error,
			hasMore: mocks.hasMore,
			loadMore: mocks.loadMore,
			retry: mocks.retry,
		},
		openRoom: mocks.openRoom,
		openingRoom: null,
	}),
}));

const read = vi.mocked(readRoomSourceAssociation);
const rows = (count: number): RoomRow[] =>
	Array.from({ length: count }, (_, index) => ({
		roomId: `room-${index}`,
		roomName: `Session ${index}`,
	}));

function content(
	isActive = true,
	owner = "account-one",
	topicId = "topic-one",
) {
	return (
		<MemoryRouter>
			<RoomSourceAssociationsProvider
				key={owner}
				actions={mocks.actions as never}
			>
				{isActive ? (
					<TopicSessions topicId={topicId} />
				) : (
					<p>Actions tab</p>
				)}
			</RoomSourceAssociationsProvider>
		</MemoryRouter>
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.rooms = [];
	mocks.isLoading = false;
	mocks.error = "";
	mocks.hasMore = false;
	read.mockReset();
	read.mockResolvedValue(null);
});

it("reads no metadata before activation and inspects only 25 already-loaded rooms per batch", async () => {
	mocks.rooms = rows(70);
	const view = render(content(false));
	expect(read).not.toHaveBeenCalled();
	view.rerender(content());
	await screen.findByText("Checked 25 saved sessions.");
	expect(read).toHaveBeenCalledTimes(25);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Load more sessions" }));
	await screen.findByText("Checked 50 saved sessions.");
	expect(read).toHaveBeenCalledTimes(50);
	expect(mocks.loadMore).not.toHaveBeenCalled();
});

it("keeps separate rooms for one source and uses legacy links only when source metadata is absent", async () => {
	mocks.rooms = ["first", "second", "legacy", "mismatch", "generic"].map(
		(roomId) => ({ roomId, roomName: roomId }),
	);
	read.mockImplementation(
		async (_actions, roomId) =>
			({
				first: "source-one",
				second: "source-one",
				mismatch: "source-other",
			})[roomId] ?? null,
	);
	render(content());
	await screen.findByText("Checked 5 saved sessions.");
	expect(screen.getAllByRole("link")).toHaveLength(3);
	for (const name of [/^first/, /^second/, /^legacy/])
		expect(screen.getByRole("link", { name })).toBeVisible();
	await userEvent
		.setup()
		.click(screen.getByRole("link", { name: /^second/ }));
	expect(mocks.openRoom).toHaveBeenCalledExactlyOnceWith("second");
	expect(mocks.actions.run).not.toHaveBeenCalled();
});

it("keeps partial results visible and retries only failed metadata without a false empty state", async () => {
	mocks.rooms = [
		{ roomId: "good", roomName: "Known session" },
		{ roomId: "failed", roomName: "Recovered session" },
	];
	read.mockImplementation(async (_actions, roomId) => {
		if (roomId === "failed") throw new Error("Offline");
		return "source-one";
	});
	render(content());
	await screen.findByRole("link", { name: /^Known session/ });
	await screen.findByText(
		"Could not check 1 session. These results may be incomplete.",
	);
	expect(
		screen.queryByText("No linked sessions in loaded history."),
	).not.toBeInTheDocument();
	read.mockResolvedValue("source-one");
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Retry session links" }));
	await screen.findByRole("link", { name: /^Recovered session/ });
	expect(read.mock.calls.map((call) => call[1])).toEqual([
		"good",
		"failed",
		"failed",
	]);
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("requests the next history page explicitly when the current 25 rows are exhausted", async () => {
	mocks.rooms = rows(25);
	mocks.hasMore = true;
	const view = render(content());
	await screen.findByText("Checked 25 saved sessions.");
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Load more sessions" }));
	expect(mocks.loadMore).toHaveBeenCalledOnce();
	mocks.rooms = rows(50);
	view.rerender(content());
	await screen.findByText("Checked 50 saved sessions.");
	expect(read).toHaveBeenCalledTimes(50);
});

it("revalidates associations on a new tab activation without relying on room timestamps", async () => {
	mocks.rooms = [{ roomId: "room-one", roomName: "Changed source" }];
	read.mockResolvedValue(null);
	const view = render(content());
	await screen.findByText("No linked sessions in loaded history.");
	view.rerender(content(false));
	read.mockResolvedValue("source-one");
	view.rerender(content());
	await screen.findByRole("link", { name: /^Changed source/ });
	expect(read).toHaveBeenCalledTimes(2);
});

it("discards pending results when the account/insight owner changes", async () => {
	mocks.rooms = [{ roomId: "same-room", roomName: "Old account session" }];
	let resolveOld: ((value: string | null) => void) | undefined;
	read.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				resolveOld = resolve;
			}),
	).mockResolvedValue(null);
	const view = render(content());
	await waitFor(() => expect(read).toHaveBeenCalledOnce());
	view.rerender(content(true, "account-two"));
	await screen.findByText("No linked sessions in loaded history.");
	await act(async () => resolveOld?.("source-one"));
	expect(
		screen.queryByRole("link", { name: /^Old account session/ }),
	).not.toBeInTheDocument();
	expect(read).toHaveBeenCalledTimes(2);
});

it("keeps history failure distinct from an empty linked-session result", () => {
	mocks.error = "Saved sessions could not be loaded.";
	render(content());
	expect(screen.getByRole("alert")).toHaveTextContent(mocks.error);
	expect(
		screen.queryByText("No linked sessions in loaded history."),
	).not.toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: "Retry sessions" }),
	).toBeVisible();
});

it("keeps verified associations through revalidation and failure until a successful read replaces them", async () => {
	mocks.rooms = [{ roomId: "cached", roomName: "Verified conversation" }];
	read.mockResolvedValue("source-one");
	const view = render(content());
	await screen.findByRole("link", { name: /^Verified conversation/ });
	view.rerender(content(false));
	let failRefresh: ((cause: Error) => void) | undefined;
	read.mockImplementationOnce(
		() =>
			new Promise((_resolve, reject) => {
				failRefresh = reject;
			}),
	);
	view.rerender(content());
	expect(
		screen.getByRole("link", { name: /^Verified conversation/ }),
	).toBeVisible();
	expect(screen.getByRole("status")).toHaveTextContent(
		"Checking linked sessions",
	);
	await act(async () => failRefresh?.(new Error("Offline")));
	expect(
		screen.getByRole("link", { name: /^Verified conversation/ }),
	).toBeVisible();
	expect(screen.getByRole("alert")).toHaveTextContent(
		"results may be incomplete",
	);
	read.mockResolvedValue("source-other");
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Retry session links" }));
	await screen.findByText("No linked sessions in loaded history.");
	expect(
		screen.queryByRole("link", { name: /^Verified conversation/ }),
	).not.toBeInTheDocument();
});

it("interprets timezone-free room timestamps as UTC and labels missing or invalid dates", async () => {
	mocks.rooms = [
		{
			roomId: "dated",
			roomName: "Dated conversation",
			dateUpdated: "2026-10-07 08:30:00",
		},
		{
			roomId: "invalid",
			roomName: "Invalid date",
			dateCreated: "not-a-date",
		},
		{ roomId: "missing", roomName: "Missing date" },
	];
	read.mockResolvedValue("source-one");
	render(content());
	const dated = await screen.findByRole("link", {
		name: /^Dated conversation/,
	});
	expect(dated.querySelector("time")).toHaveAttribute(
		"dateTime",
		"2026-10-07T08:30:00.000Z",
	);
	expect(
		screen.getByRole("link", { name: /^Invalid date/ }),
	).toHaveTextContent("Date unavailable");
	expect(
		screen.getByRole("link", { name: /^Missing date/ }),
	).toHaveTextContent("Date unavailable");
});
