import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import {
	WorkUpdatesContext,
	type WorkUpdatesStatus,
} from "@/features/collaboration/live/work-updates.context";
import { readRoomSourceAssociation } from "@/features/rooms/api/read-room-source-association";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import { listRoomTopics } from "@/features/rooms/api/room-topics";
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
vi.mock("@/features/rooms/api/room-topics", () => ({
	listRoomTopics: vi.fn(),
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
const readTopics = vi.mocked(listRoomTopics);
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
	read.mockResolvedValue({ threadId: null, isDelegation: false });
	readTopics.mockReset();
	readTopics.mockResolvedValue([]);
});

it("reads no metadata before activation and inspects only 25 already-loaded rooms per batch", async () => {
	mocks.rooms = rows(70);
	const view = render(content(false));
	expect(read).not.toHaveBeenCalled();
	expect(readTopics).not.toHaveBeenCalled();
	view.rerender(content());
	await screen.findByText("Checked 25 saved sessions.");
	expect(read).toHaveBeenCalledTimes(25);
	expect(readTopics).toHaveBeenCalledTimes(25);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Load more sessions" }));
	await screen.findByText("Checked 50 saved sessions.");
	expect(read).toHaveBeenCalledTimes(50);
	expect(readTopics).toHaveBeenCalledTimes(50);
	expect(mocks.loadMore).not.toHaveBeenCalled();
});

it("includes explicitly linked topic chats and ignores suggested, dismissed, and other topics", async () => {
	mocks.rooms = ["linked", "suggested", "dismissed", "other"].map(
		(roomId) => ({ roomId, roomName: roomId }),
	);
	readTopics.mockImplementation(async (_actions, roomId) => [
		{
			topicId: roomId === "other" ? "topic-other" : "topic-one",
			state:
				roomId === "suggested" || roomId === "dismissed"
					? roomId
					: "linked",
		},
	]);
	render(content());
	await screen.findByText("Checked 4 saved sessions.");
	expect(screen.getAllByRole("link")).toHaveLength(1);
	expect(screen.getByRole("link", { name: /^linked/ })).toBeVisible();
});

it("keeps source and topic metadata reads within four concurrent requests", async () => {
	mocks.rooms = rows(25);
	let active = 0;
	let maximum = 0;
	const waitForMetadata = async () => {
		active += 1;
		maximum = Math.max(maximum, active);
		await new Promise((resolve) => setTimeout(resolve, 0));
		active -= 1;
	};
	read.mockImplementation(async () => {
		await waitForMetadata();
		return { threadId: null, isDelegation: false };
	});
	readTopics.mockImplementation(async () => {
		await waitForMetadata();
		return [];
	});
	render(content());
	await screen.findByText("Checked 25 saved sessions.");
	expect(maximum).toBe(4);
	expect(read).toHaveBeenCalledTimes(25);
	expect(readTopics).toHaveBeenCalledTimes(25);
});

it("skips topic reads for delegation rooms without hiding genuine chat lookup failures", async () => {
	mocks.rooms = ["delegation", "topic-chat"].map((roomId) => ({
		roomId,
		roomName: roomId,
	}));
	read.mockImplementation(async (_actions, roomId) => ({
		threadId: null,
		isDelegation: roomId === "delegation",
	}));
	readTopics.mockImplementation(async (_actions, roomId) => {
		if (roomId === "delegation") throw new Error("Chat not found");
		return [{ topicId: "topic-one", state: "linked" }];
	});
	const view = render(content());
	await screen.findByText("Checked 2 saved sessions.");
	expect(readTopics).toHaveBeenCalledExactlyOnceWith(
		mocks.actions,
		"topic-chat",
	);
	expect(screen.getAllByRole("link")).toHaveLength(1);
	expect(screen.getByRole("link", { name: /^topic-chat/ })).toBeVisible();
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	view.rerender(content(false));
	readTopics.mockRejectedValueOnce(new Error("Chat not found"));
	view.rerender(content());
	await screen.findByText(
		"Could not check 1 session. These results may be incomplete.",
	);
	expect(screen.getByRole("link", { name: /^topic-chat/ })).toBeVisible();
	expect(readTopics).toHaveBeenCalledTimes(2);
});

it("keeps successful topic and source matches when their other metadata read fails", async () => {
	mocks.rooms = ["topic-chat", "source-chat", "legacy"].map((roomId) => ({
		roomId,
		roomName: roomId,
	}));
	read.mockImplementation(async (_actions, roomId) => {
		if (roomId !== "source-chat") throw new Error("Source unavailable");
		return { threadId: "source-one", isDelegation: false };
	});
	readTopics.mockImplementation(async (_actions, roomId) => {
		if (roomId === "source-chat") throw new Error("Topics unavailable");
		return roomId === "topic-chat"
			? [{ topicId: "topic-one", state: "linked" }]
			: [];
	});
	render(content());
	await screen.findByText(
		"Could not check 3 sessions. These results may be incomplete.",
	);
	expect(screen.getAllByRole("link")).toHaveLength(2);
	expect(screen.getByRole("link", { name: /^topic-chat/ })).toBeVisible();
	expect(screen.getByRole("link", { name: /^source-chat/ })).toBeVisible();
	expect(screen.queryByRole("link", { name: /^legacy/ })).toBeNull();
});

it("keeps separate rooms for one source and uses legacy links only when source metadata is absent", async () => {
	mocks.rooms = ["first", "second", "legacy", "mismatch", "generic"].map(
		(roomId) => ({ roomId, roomName: roomId }),
	);
	read.mockImplementation(async (_actions, roomId) => ({
		threadId:
			{
				first: "source-one",
				second: "source-one",
				mismatch: "source-other",
			}[roomId] ?? null,
		isDelegation: false,
	}));
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
		return { threadId: "source-one", isDelegation: false };
	});
	render(content());
	await screen.findByRole("link", { name: /^Known session/ });
	await screen.findByText(
		"Could not check 1 session. These results may be incomplete.",
	);
	expect(
		screen.queryByText(
			"No linked chats in the history loaded so far. Ask the assistant above to start one.",
		),
	).not.toBeInTheDocument();
	read.mockResolvedValue({ threadId: "source-one", isDelegation: false });
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
	read.mockResolvedValue({ threadId: null, isDelegation: false });
	const view = render(content());
	await screen.findByText(
		"No linked chats in the history loaded so far. Ask the assistant above to start one.",
	);
	view.rerender(content(false));
	read.mockResolvedValue({ threadId: "source-one", isDelegation: false });
	view.rerender(content());
	await screen.findByRole("link", { name: /^Changed source/ });
	expect(read).toHaveBeenCalledTimes(2);
	expect(readTopics).toHaveBeenCalledTimes(2);
});

it("discards pending results when the account/insight owner changes", async () => {
	mocks.rooms = [{ roomId: "same-room", roomName: "Old account session" }];
	let resolveOld:
		| ((
				value: Awaited<ReturnType<typeof readRoomSourceAssociation>>,
		  ) => void)
		| undefined;
	read.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				resolveOld = resolve;
			}),
	).mockResolvedValue({ threadId: null, isDelegation: false });
	const view = render(content());
	await waitFor(() => expect(read).toHaveBeenCalledOnce());
	view.rerender(content(true, "account-two"));
	await screen.findByText(
		"No linked chats in the history loaded so far. Ask the assistant above to start one.",
	);
	await act(async () =>
		resolveOld?.({ threadId: "source-one", isDelegation: false }),
	);
	expect(
		screen.queryByRole("link", { name: /^Old account session/ }),
	).not.toBeInTheDocument();
	expect(read).toHaveBeenCalledTimes(2);
	expect(readTopics).toHaveBeenCalledOnce();
});

it("discards pending topic links when the account/insight owner changes", async () => {
	mocks.rooms = [{ roomId: "same-room", roomName: "Old topic chat" }];
	let resolveOld:
		| ((value: Awaited<ReturnType<typeof listRoomTopics>>) => void)
		| undefined;
	readTopics.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				resolveOld = resolve;
			}),
	);
	const view = render(content());
	await waitFor(() => expect(readTopics).toHaveBeenCalledOnce());
	view.rerender(content(true, "account-two"));
	await screen.findByText(
		"No linked chats in the history loaded so far. Ask the assistant above to start one.",
	);
	await act(async () =>
		resolveOld?.([{ topicId: "topic-one", state: "linked" }]),
	);
	expect(screen.queryByRole("link", { name: /^Old topic chat/ })).toBeNull();
});

it("keeps history failure distinct from an empty linked-session result", () => {
	mocks.error = "Saved sessions could not be loaded.";
	render(content());
	expect(screen.getByRole("alert")).toHaveTextContent(mocks.error);
	expect(
		screen.queryByText(
			"No linked chats in the history loaded so far. Ask the assistant above to start one.",
		),
	).not.toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: "Retry sessions" }),
	).toBeVisible();
});

it("keeps verified associations through revalidation and failure until a successful read replaces them", async () => {
	mocks.rooms = [{ roomId: "cached", roomName: "Verified conversation" }];
	read.mockResolvedValue({ threadId: "source-one", isDelegation: false });
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
	read.mockResolvedValue({ threadId: "source-other", isDelegation: false });
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Retry session links" }));
	await screen.findByText(
		"No linked chats in the history loaded so far. Ask the assistant above to start one.",
	);
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
	read.mockResolvedValue({ threadId: "source-one", isDelegation: false });
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

it("keeps cached topic links visible through failed refreshes and retries them", async () => {
	mocks.rooms = [{ roomId: "topic-chat", roomName: "Topic assistant" }];
	readTopics.mockResolvedValue([{ topicId: "topic-one", state: "linked" }]);
	const view = render(content());
	await screen.findByRole("link", { name: /^Topic assistant/ });
	view.rerender(content(false));
	readTopics.mockRejectedValueOnce(new Error("Offline"));
	view.rerender(content());
	expect(
		screen.getByRole("link", { name: /^Topic assistant/ }),
	).toBeVisible();
	await screen.findByText(
		"Could not check 1 session. These results may be incomplete.",
	);
	expect(
		screen.getByRole("link", { name: /^Topic assistant/ }),
	).toBeVisible();
	readTopics.mockResolvedValue([
		{ topicId: "topic-one", state: "dismissed" },
	]);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Retry session links" }));
	await screen.findByText(
		"No linked chats in the history loaded so far. Ask the assistant above to start one.",
	);
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	expect(readTopics).toHaveBeenCalledTimes(3);
});

it("lists a chat linked to a topic made on this page, which the chat knows by its server id", async () => {
	mocks.rooms = [
		{ roomId: "new-topic-chat", roomName: "Registration deadline" },
	];
	readTopics.mockResolvedValue([
		{ topicId: "server-topic", state: "linked" },
	]);
	const updates: WorkUpdatesStatus = {
		isRefreshing: false,
		lastUpdated: null,
		error: "",
		lastMailCheck: null,
		refresh: vi.fn(),
		refreshTopicGoal: vi.fn(),
		isSyncing: false,
		lastSync: null,
		syncError: "",
		syncMail: vi.fn(),
		serverId: async (id) => (id === "local-topic-1" ? "server-topic" : id),
		localId: (id) => (id === "server-topic" ? "local-topic-1" : id),
	};
	render(
		<WorkUpdatesContext.Provider value={updates}>
			{content(true, "account-one", "local-topic-1")}
		</WorkUpdatesContext.Provider>,
	);
	expect(
		await screen.findByRole("link", { name: /^Registration deadline/ }),
	).toBeVisible();
});
