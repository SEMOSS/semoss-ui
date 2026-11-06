import { renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useRoomsQuery } from "./use-rooms-query";

const mocks = vi.hoisted(() => ({
	insightId: "session-insight",
	pixels: [] as string[],
	data: [] as { ROOM_ID: string; ROOM_NAME: string; DATE_CREATED: string }[],
	reset: vi.fn(),
	chat: {
		roomsVersion: 0,
		optimisticRooms: {} as Record<
			string,
			{ ROOM_ID: string; ROOM_NAME: string; DATE_CREATED: string }
		>,
		removeOptimisticRoom: vi.fn(),
	},
}));

vi.mock("@semoss/sdk/react", () => ({
	// the chat store's rooms version and optimistic rooms, read as they are
	useRoomsClient: <T,>(
		client: typeof mocks.chat,
		selector: (client: typeof mocks.chat) => T,
	) => selector(client),
	useSessionInsight: () => ({ insightId: mocks.insightId }),
	useIteratorPixel: (
		buildPixel: (limit: number, offset: number) => string,
	) => {
		mocks.pixels.push(buildPixel(25, 0));
		return {
			data: mocks.data,
			isLoading: false,
			isError: false,
			hasMore: false,
			next: vi.fn(),
			reset: mocks.reset,
		};
	},
}));
vi.mock("../../host/chat.context", () => ({
	useChat: () => ({ chat: mocks.chat }),
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.insightId = "session-insight";
	mocks.pixels = [];
	mocks.data = [];
	mocks.chat.roomsVersion = 0;
	mocks.chat.optimisticRooms = {};
});

test("reads pages through GetPlaygroundRooms and the pinned rooms in one", () => {
	renderHook(() => useRoomsQuery({ search: "plan", limit: 25 }));
	renderHook(() => useRoomsQuery({ pinned: true }));
	expect(mocks.pixels).toEqual([
		'META | GetPlaygroundRooms(search="<encode>plan</encode>", limit=25, offset=0, sort=["DESC"]);',
		'META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);',
	]);
});

test("waits for the session's insight and reads nothing while disabled", () => {
	mocks.insightId = "";
	renderHook(() => useRoomsQuery());
	mocks.insightId = "session-insight";
	renderHook(() => useRoomsQuery({ enabled: false }));
	expect(mocks.pixels).toEqual(["", ""]);
});

test("reads again, keeping its rows, only when the rooms version moves", () => {
	const { rerender } = renderHook(() => useRoomsQuery());
	rerender();
	expect(mocks.reset).not.toHaveBeenCalled();

	mocks.chat.roomsVersion = 1;
	rerender();
	expect(mocks.reset).toHaveBeenCalledTimes(1);
});

test("shows rooms not listed yet, and forgets them once the backend lists them", () => {
	mocks.chat.optimisticRooms = {
		fresh: { ROOM_ID: "fresh", ROOM_NAME: "New chat", DATE_CREATED: "" },
		listed: { ROOM_ID: "listed", ROOM_NAME: "Listed", DATE_CREATED: "" },
	};
	mocks.data = [{ ROOM_ID: "listed", ROOM_NAME: "Listed", DATE_CREATED: "" }];

	const { result } = renderHook(() =>
		useRoomsQuery({ includeOptimistic: true }),
	);
	expect(result.current.optimisticRooms.map((room) => room.ROOM_ID)).toEqual([
		"fresh",
	]);
	expect(mocks.chat.removeOptimisticRoom).toHaveBeenCalledWith("listed");

	const { result: searching } = renderHook(() =>
		useRoomsQuery({ search: "x", includeOptimistic: true }),
	);
	expect(searching.current.optimisticRooms).toEqual([]);
});
