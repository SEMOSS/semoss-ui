import { act, renderHook, waitFor } from "@testing-library/react";
import {
	listRoomsPage,
	ROOM_HISTORY_CHANGED,
} from "@/features/rooms/api/list-rooms";
import { useChatHistory } from "./use-chat-history";

const { actions } = vi.hoisted(() => ({ actions: {} }));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions, insightId: "current-scope" }),
}));
vi.mock("@/features/rooms/api/list-rooms", () => ({
	listRoomsPage: vi.fn(),
	ROOM_HISTORY_CHANGED: "test-room-change",
}));
const read = vi.mocked(listRoomsPage);
const rows = (start: number, count: number) =>
	Array.from({ length: count }, (_, index) => ({
		roomId: `room-${start + index}`,
		roomName: `Chat ${start + index}`,
	}));
beforeEach(() => {
	read.mockReset();
});

it("loads 25-room pages, deduplicates overlap, retries the failed offset, and retains scrolling", async () => {
	read.mockResolvedValueOnce({
		rooms: rows(0, 25),
		hasMore: true,
		nextOffset: 25,
	})
		.mockRejectedValueOnce(new Error("offline"))
		.mockResolvedValueOnce({
			rooms: rows(24, 25),
			hasMore: true,
			nextOffset: 50,
		})
		.mockResolvedValueOnce({
			rooms: rows(49, 2),
			hasMore: false,
			nextOffset: 52,
		});
	const { result } = renderHook(useChatHistory);
	await waitFor(() => expect(result.current.rooms).toHaveLength(25));
	result.current.scrollTop.current = 640;
	act(() => result.current.loadMore());
	await waitFor(() => expect(result.current.error).toBe("offline"));
	expect(result.current.rooms).toHaveLength(25);
	act(() => result.current.retry());
	await waitFor(() => expect(result.current.rooms).toHaveLength(49));
	expect(read.mock.calls.map((call) => call[1])).toEqual([0, 25, 25]);
	act(() => result.current.loadMore());
	await waitFor(() => expect(result.current.hasMore).toBe(false));
	expect(result.current.rooms).toHaveLength(51);
	expect(result.current.scrollTop.current).toBe(640);
});

it("retains newly created chats before the server list catches up and refreshes saved names", async () => {
	read.mockResolvedValue({
		rooms: rows(0, 2),
		hasMore: false,
		nextOffset: 2,
	});
	const { result } = renderHook(useChatHistory);
	await waitFor(() => expect(result.current.rooms).toHaveLength(2));
	read.mockResolvedValue({
		rooms: [{ roomId: "room-0", roomName: "Renamed" }],
		hasMore: false,
		nextOffset: 1,
	});
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: { roomId: "new", roomName: "New task" },
			}),
		),
	);
	await waitFor(() =>
		expect(
			result.current.rooms.find((row) => row.roomId === "room-0")
				?.roomName,
		).toBe("Renamed"),
	);
	expect(result.current.rooms.some((row) => row.roomId === "new")).toBe(true);
	expect(result.current.rooms.some((row) => row.roomId === "room-1")).toBe(
		true,
	);
});

it("preserves creation dates and room metadata when saved activity updates history", async () => {
	read.mockResolvedValueOnce({
		rooms: [
			{
				roomId: "room-1",
				roomName: "Existing chat",
				workspaceId: "assistant-1",
				dateCreated: "2025-01-01T10:00:00Z",
				dateUpdated: "2025-02-01T10:00:00Z",
				pinned: true,
			},
		],
		hasMore: false,
		nextOffset: 1,
	});
	const { result } = renderHook(useChatHistory);
	await waitFor(() => expect(result.current.rooms).toHaveLength(1));
	read.mockRejectedValueOnce(new Error("offline"));
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					roomId: "room-1",
					dateUpdated: "2026-10-08T10:00:00Z",
				},
			}),
		),
	);
	await waitFor(() => expect(result.current.error).toBe("offline"));
	expect(result.current.rooms[0]).toMatchObject({
		roomId: "room-1",
		roomName: "Existing chat",
		workspaceId: "assistant-1",
		dateCreated: "2025-01-01T10:00:00Z",
		dateUpdated: "2026-10-08T10:00:00Z",
		pinned: true,
	});
});

it("ignores history notifications from a retained room in a previous account scope", async () => {
	read.mockResolvedValue({
		rooms: rows(0, 1),
		hasMore: false,
		nextOffset: 1,
	});
	const { result } = renderHook(useChatHistory);
	await waitFor(() => expect(result.current.rooms).toHaveLength(1));
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "previous-scope",
					roomId: "private-room",
					roomName: "Previous account's room",
					dateUpdated: "2026-10-08T10:00:00Z",
				},
			}),
		),
	);
	expect(result.current.rooms.map((room) => room.roomId)).toEqual(["room-0"]);
	expect(read).toHaveBeenCalledOnce();
	act(() =>
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					scope: "current-scope",
					roomId: "current-room",
					roomName: "Current room",
					dateUpdated: "2026-10-08T10:00:00Z",
				},
			}),
		),
	);
	await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
	expect(
		result.current.rooms.some((room) => room.roomId === "current-room"),
	).toBe(true);
});
