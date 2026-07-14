import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomSummary } from "./types";
import { useChatRooms } from "./use-chat-rooms";

const { useInsight, listPinnedPlaygroundRooms, listPlaygroundRooms } =
	vi.hoisted(() => ({
		useInsight: vi.fn(),
		listPinnedPlaygroundRooms: vi.fn(),
		listPlaygroundRooms: vi.fn(),
	}));

vi.mock("@semoss/sdk/react", () => ({ useInsight }));

// The hook debounces search input via @semoss/ui/next's useDebouncedValue —
// replaced with an identity passthrough so tests don't need real timers.
vi.mock("@semoss/ui/next", () => ({
	useDebouncedValue: (value: string) => value,
}));

vi.mock("./transport/pixel-calls", () => ({
	listPinnedPlaygroundRooms,
	listPlaygroundRooms,
	renamePlaygroundRoom: vi.fn().mockResolvedValue(undefined),
	pinPlaygroundRoom: vi.fn().mockResolvedValue(undefined),
	deletePlaygroundRoom: vi.fn().mockResolvedValue(undefined),
}));

function room(overrides: Partial<RoomSummary> = {}): RoomSummary {
	return {
		roomId: "room-1",
		name: "Claim question",
		dateCreated: new Date("2026-06-22T12:00:00.000Z"),
		pinned: false,
		...overrides,
	};
}

beforeEach(() => {
	// biome-ignore lint/suspicious/noExplicitAny: minimal fake of the real InsightActions surface
	useInsight.mockReturnValue({ actions: {} as any, insightId: "insight-1" });
	listPinnedPlaygroundRooms.mockResolvedValue([]);
	listPlaygroundRooms.mockResolvedValue([]);
});

describe("useChatRooms", () => {
	it("starts empty and re-renders once rooms load", async () => {
		listPinnedPlaygroundRooms.mockResolvedValue([
			room({ roomId: "pinned-1", pinned: true }),
		]);
		listPlaygroundRooms.mockResolvedValue([room({ roomId: "room-1" })]);

		const { result } = renderHook(() => useChatRooms());

		expect(result.current.pinnedRooms).toHaveLength(0);
		expect(result.current.rooms).toHaveLength(0);

		await waitFor(() => {
			expect(result.current.pinnedRooms).toHaveLength(1);
			expect(result.current.rooms).toHaveLength(1);
		});
		expect(result.current.isLoading).toBe(false);
	});

	it("passes the debounced search term through to the underlying session", async () => {
		const { result } = renderHook(() => useChatRooms());
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		listPlaygroundRooms.mockClear();
		listPlaygroundRooms.mockResolvedValue([
			room({ roomId: "match", name: "matched" }),
		]);

		act(() => {
			result.current.setSearch("claim");
		});

		await waitFor(() => {
			expect(result.current.rooms).toEqual([
				room({ roomId: "match", name: "matched" }),
			]);
		});
		expect(listPlaygroundRooms).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ search: "claim" }),
		);
	});

	it("re-renders after renameRoom patches the list", async () => {
		listPlaygroundRooms.mockResolvedValue([room({ roomId: "room-1" })]);
		const { result } = renderHook(() => useChatRooms());
		await waitFor(() => expect(result.current.rooms).toHaveLength(1));

		await act(async () => {
			await result.current.renameRoom("room-1", "Renamed");
		});

		expect(result.current.rooms[0]?.name).toBe("Renamed");
	});
});
