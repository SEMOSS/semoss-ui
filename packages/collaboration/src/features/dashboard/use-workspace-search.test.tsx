import { act, renderHook } from "@testing-library/react";
import { listMail } from "@/features/connectors/api/microsoft";
import { listRoomsPage } from "@/features/rooms/api/list-rooms";
import { searchRoomMessages } from "@/features/rooms/api/search-room-messages";
import type { InsightActions } from "@/lib/pixel";
import { useWorkspaceSearch } from "./use-workspace-search";

vi.mock("@/features/connectors/api/microsoft", () => ({ listMail: vi.fn() }));
vi.mock("@/features/rooms/api/list-rooms", () => ({ listRoomsPage: vi.fn() }));
vi.mock("@/features/rooms/api/search-room-messages", () => ({
	searchRoomMessages: vi.fn(),
}));
const actions = {} as InsightActions;
const message = {
	uid: "mail-1",
	subject: "Renewal",
	from: "vip@example.com",
	unread: true,
	hasAttachments: false,
};
async function debounce(): Promise<void> {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(350);
	});
}
beforeEach(() => {
	vi.useFakeTimers();
	vi.resetAllMocks();
	vi.mocked(listRoomsPage).mockResolvedValue({
		rooms: [{ roomId: "one", roomName: "Renewal" }],
		hasMore: false,
		nextOffset: 1,
	});
	vi.mocked(searchRoomMessages).mockResolvedValue([
		{ roomId: "one", roomName: "Renewal" },
	]);
	vi.mocked(listMail).mockResolvedValue({
		folder: "inbox",
		count: 1,
		messages: [message],
	});
});
afterEach(() => vi.useRealTimers());

it("queries sender and subject independently and deduplicates both chat and mail results", async () => {
	const { result } = renderHook(() =>
		useWorkspaceSearch(actions, "Renewal", true, true, 7),
	);
	expect(listMail).not.toHaveBeenCalled();
	await debounce();
	expect(listMail).toHaveBeenCalledWith(actions, {
		sinceDays: 7,
		subject: "Renewal",
	});
	expect(listMail).toHaveBeenCalledWith(actions, {
		sinceDays: 7,
		from: "Renewal",
	});
	expect(result.current.chats).toHaveLength(1);
	expect(result.current.mail).toHaveLength(1);
});

it("discards stale queries, keeps successful categories through failure, and retries without losing results", async () => {
	let resolvePage:
		| ((page: Awaited<ReturnType<typeof listRoomsPage>>) => void)
		| undefined;
	const pending = new Promise<Awaited<ReturnType<typeof listRoomsPage>>>(
		(resolve) => {
			resolvePage = resolve;
		},
	);
	vi.mocked(listRoomsPage).mockReturnValueOnce(pending);
	const { result, rerender } = renderHook(
		({ query }) => useWorkspaceSearch(actions, query, true, true, 30),
		{ initialProps: { query: "Old" } },
	);
	await debounce();
	rerender({ query: "New" });
	vi.mocked(searchRoomMessages).mockRejectedValue(
		new Error("content unavailable"),
	);
	await debounce();
	expect(result.current.errors[0]).toContain("Chat content");
	expect(result.current.mail).toHaveLength(1);
	await act(async () =>
		resolvePage?.({
			rooms: [{ roomId: "stale", roomName: "Old" }],
			hasMore: false,
			nextOffset: 1,
		}),
	);
	expect(result.current.chats.some((row) => row.roomId === "stale")).toBe(
		false,
	);
	vi.mocked(listRoomsPage).mockRejectedValue(new Error("names unavailable"));
	act(() => result.current.retry());
	await debounce();
	expect(result.current.chats.some((row) => row.roomId === "one")).toBe(true);
	expect(result.current.errors).toHaveLength(2);
});

it("searches additional server pages beyond the sidebar and applies all supported mail windows", async () => {
	vi.mocked(listRoomsPage).mockResolvedValue({
		rooms: [],
		hasMore: true,
		nextOffset: 25,
	});
	const { result, rerender } = renderHook(
		({ days }: { days: 1 | 7 | 30 | 90 }) =>
			useWorkspaceSearch(actions, "review", true, true, days),
		{ initialProps: { days: 1 } },
	);
	await debounce();
	act(() => result.current.more());
	await debounce();
	expect(listRoomsPage).toHaveBeenLastCalledWith(actions, 25, "review");
	expect(searchRoomMessages).toHaveBeenLastCalledWith(actions, "review", 50);
	for (const days of [7, 30, 90] as const) {
		rerender({ days });
		await debounce();
		expect(listMail).toHaveBeenCalledWith(actions, {
			sinceDays: days,
			from: "review",
		});
	}
});
