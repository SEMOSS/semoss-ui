import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatRoomsSession } from "./chat-rooms-session";
import type { RoomSummary } from "./types";

const {
	listPinnedPlaygroundRooms,
	listPlaygroundRooms,
	renamePlaygroundRoom,
	pinPlaygroundRoom,
	deletePlaygroundRoom,
} = vi.hoisted(() => ({
	listPinnedPlaygroundRooms: vi.fn(),
	listPlaygroundRooms: vi.fn(),
	renamePlaygroundRoom: vi.fn(),
	pinPlaygroundRoom: vi.fn(),
	deletePlaygroundRoom: vi.fn(),
}));

vi.mock("./transport/pixel-calls", () => ({
	listPinnedPlaygroundRooms,
	listPlaygroundRooms,
	renamePlaygroundRoom,
	pinPlaygroundRoom,
	deletePlaygroundRoom,
}));

// biome-ignore lint/suspicious/noExplicitAny: test double, real InsightActions is a large SDK type
const actions = {} as any;

function room(overrides: Partial<RoomSummary> = {}): RoomSummary {
	return {
		roomId: "room-1",
		name: "Claim question",
		dateCreated: new Date("2026-06-22T12:00:00.000Z"),
		pinned: false,
		...overrides,
	};
}

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
	listPinnedPlaygroundRooms.mockReset().mockResolvedValue([]);
	listPlaygroundRooms.mockReset().mockResolvedValue([]);
	renamePlaygroundRoom.mockReset().mockResolvedValue(undefined);
	pinPlaygroundRoom.mockReset().mockResolvedValue(undefined);
	deletePlaygroundRoom.mockReset().mockResolvedValue(undefined);
});

describe("ChatRoomsSession", () => {
	it("loads pinned rooms and the first page on construction", async () => {
		listPinnedPlaygroundRooms.mockResolvedValue([
			room({ roomId: "pinned-1", pinned: true }),
		]);
		listPlaygroundRooms.mockResolvedValue([room({ roomId: "room-1" })]);

		const session = new ChatRoomsSession(actions);
		await flushMicrotasks();

		expect(session.pinnedRooms).toHaveLength(1);
		expect(session.rooms).toHaveLength(1);
		expect(session.isLoading).toBe(false);
		expect(listPlaygroundRooms).toHaveBeenCalledWith(actions, {
			search: undefined,
			limit: 25,
			offset: 0,
		});
	});

	it("sets hasMore based on whether a full page came back", async () => {
		listPlaygroundRooms.mockResolvedValue(
			Array.from({ length: 25 }, (_, i) => room({ roomId: `r${i}` })),
		);

		const session = new ChatRoomsSession(actions);
		await flushMicrotasks();

		expect(session.hasMore).toBe(true);
	});

	it("sets hasMore false when a page comes back short", async () => {
		listPlaygroundRooms.mockResolvedValue([room()]);

		const session = new ChatRoomsSession(actions);
		await flushMicrotasks();

		expect(session.hasMore).toBe(false);
	});

	it("appends rather than replaces on loadMore", async () => {
		listPlaygroundRooms.mockResolvedValueOnce(
			Array.from({ length: 25 }, (_, i) => room({ roomId: `r${i}` })),
		);
		const session = new ChatRoomsSession(actions);
		await flushMicrotasks();
		expect(session.rooms).toHaveLength(25);

		listPlaygroundRooms.mockResolvedValueOnce([room({ roomId: "r25" })]);
		await session.loadMore();

		expect(session.rooms).toHaveLength(26);
		expect(listPlaygroundRooms).toHaveBeenLastCalledWith(actions, {
			search: undefined,
			limit: 25,
			offset: 25,
		});
	});

	it("no-ops loadMore when hasMore is false", async () => {
		listPlaygroundRooms.mockResolvedValue([room()]);
		const session = new ChatRoomsSession(actions);
		await flushMicrotasks();
		expect(session.hasMore).toBe(false);

		listPlaygroundRooms.mockClear();
		await session.loadMore();

		expect(listPlaygroundRooms).not.toHaveBeenCalled();
	});

	it("setSearch resets to page 0 and passes the search term through", async () => {
		const session = new ChatRoomsSession(actions);
		await flushMicrotasks();
		listPlaygroundRooms.mockClear();
		listPlaygroundRooms.mockResolvedValue([
			room({ roomId: "match", name: "matched room" }),
		]);

		session.setSearch("claim");
		await flushMicrotasks();

		expect(listPlaygroundRooms).toHaveBeenCalledWith(actions, {
			search: "claim",
			limit: 25,
			offset: 0,
		});
		expect(session.rooms).toEqual([
			room({ roomId: "match", name: "matched room" }),
		]);
	});

	it("drops a stale in-flight page when a newer search supersedes it", async () => {
		let resolveFirst: (value: RoomSummary[]) => void = () => {};
		listPlaygroundRooms.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveFirst = resolve;
				}),
		);
		const session = new ChatRoomsSession(actions);
		// initial construction kicks off the first (slow) load

		// Queued before setSearch (which synchronously kicks off its own
		// fetch up to the first await) so it's what that second fetch
		// actually consumes.
		listPlaygroundRooms.mockResolvedValueOnce([
			room({ roomId: "second-result" }),
		]);
		session.setSearch("second search");
		await flushMicrotasks();

		// the slow first request now resolves, after the second search
		// already landed — must not overwrite it.
		resolveFirst([room({ roomId: "stale-result" })]);
		await flushMicrotasks();

		expect(session.rooms.map((r) => r.roomId)).toEqual(["second-result"]);
	});

	it("renameRoom patches the room in place in both lists", async () => {
		listPinnedPlaygroundRooms.mockResolvedValue([
			room({ roomId: "room-1", pinned: true }),
		]);
		listPlaygroundRooms.mockResolvedValue([room({ roomId: "room-1" })]);
		const session = new ChatRoomsSession(actions);
		await flushMicrotasks();

		await session.renameRoom("room-1", "New name");

		expect(renamePlaygroundRoom).toHaveBeenCalledWith(actions, {
			roomId: "room-1",
			name: "New name",
		});
		expect(session.pinnedRooms[0]?.name).toBe("New name");
		expect(session.rooms[0]?.name).toBe("New name");
	});

	it("pinRoom refetches both lists instead of patching locally", async () => {
		const session = new ChatRoomsSession(actions);
		await flushMicrotasks();
		listPinnedPlaygroundRooms.mockClear();
		listPlaygroundRooms.mockClear();

		await session.pinRoom("room-1", true);

		expect(pinPlaygroundRoom).toHaveBeenCalledWith(actions, {
			roomId: "room-1",
			pinned: true,
		});
		expect(listPinnedPlaygroundRooms).toHaveBeenCalledTimes(1);
		expect(listPlaygroundRooms).toHaveBeenCalledTimes(1);
	});

	it("deleteRoom filters the room out of both lists", async () => {
		listPinnedPlaygroundRooms.mockResolvedValue([
			room({ roomId: "room-1", pinned: true }),
		]);
		listPlaygroundRooms.mockResolvedValue([
			room({ roomId: "room-1" }),
			room({ roomId: "room-2" }),
		]);
		const session = new ChatRoomsSession(actions);
		await flushMicrotasks();

		await session.deleteRoom("room-1");

		expect(deletePlaygroundRoom).toHaveBeenCalledWith(actions, "room-1");
		expect(session.pinnedRooms).toHaveLength(0);
		expect(session.rooms.map((r) => r.roomId)).toEqual(["room-2"]);
	});
});
