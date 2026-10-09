import { beforeEach, expect, it, vi } from "vitest";
import { listRoomsPage } from "@/features/rooms/api/list-rooms";
import type { InsightActions } from "@/lib/pixel";
import { listRoomTree } from "./list-room-tree";

vi.mock("@/features/rooms/api/list-rooms", () => ({ listRoomsPage: vi.fn() }));
const list = vi.mocked(listRoomsPage);
const rooms = Array.from({ length: 25 }, (_, index) => ({
	roomId: `r${index}`,
	roomName: `Room ${index}`,
	pinned: true,
}));
function transport() {
	const run = vi.fn(async (statement: string) => {
		expect(statement).toMatch(/^BrainListRoomTopics\(/);
		const roomId = JSON.parse(
			statement.match(/roomId=(\[.*\])/)?.[1] ?? "[]",
		)[0];
		return {
			pixelReturn: [
				{
					output: {
						roomId,
						topics: [
							{
								topicId: "direct",
								name: "Direct",
								state: "linked",
							},
							{ topicId: "dismissed", state: "dismissed" },
							{ topicId: "suggested", state: "suggested" },
						],
					},
					operationType: [],
				},
			],
		};
	});
	return { run, actions: { run } as unknown as InsightActions };
}
beforeEach(() => {
	vi.resetAllMocks();
	list.mockResolvedValue({ rooms, hasMore: true, nextOffset: 25 });
});
it("reads one pinned page and direct associations only for loaded rooms", async () => {
	const { run, actions } = transport();
	const page = await listRoomTree(actions);
	expect(list).toHaveBeenCalledExactlyOnceWith(actions, 0, undefined, true);
	expect(run).toHaveBeenCalledTimes(25);
	expect(page.hasMore).toBe(true);
	expect(page.nextOffset).toBe(25);
	expect(page.rooms).toHaveLength(25);
	expect(page.rooms[0].topics).toEqual([
		{ topicId: "direct", name: "Direct" },
	]);
	list.mockResolvedValue({
		rooms: [{ roomId: "older" }],
		hasMore: false,
		nextOffset: 26,
	});
	const next = await listRoomTree(actions, new Map(), () => true, 25);
	expect(list).toHaveBeenLastCalledWith(actions, 25, undefined, true);
	expect(next.rooms[0].roomId).toBe("older");
});
it("keeps rooms visible when association reads fail", async () => {
	const { run, actions } = transport();
	run.mockRejectedValueOnce(new Error("Offline"));
	const page = await listRoomTree(actions);
	expect(page.rooms).toHaveLength(25);
	expect(page.warning).toContain("could not be loaded");
	expect(page.rooms.find((room) => room.roomId === "r0")).toMatchObject({
		topicUnavailable: true,
		topics: [],
	});
});
it("bounds association concurrency and stops after its owner disappears", async () => {
	let active = true;
	const finish: (() => void)[] = [];
	const run = vi.fn(
		(statement: string) =>
			new Promise((resolve) => {
				finish.push(() =>
					resolve({
						pixelReturn: [
							{
								output: {
									roomId: JSON.parse(
										statement.match(
											/roomId=(\[.*\])/,
										)?.[1] ?? "[]",
									)[0],
									topics: [],
								},
								operationType: [],
							},
						],
					}),
				);
			}),
	);
	const request = listRoomTree(
		{ run } as unknown as InsightActions,
		new Map(),
		() => active,
	);
	const rejected = expect(request).rejects.toThrow("superseded");
	await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(4));
	active = false;
	for (const release of finish) release();
	await rejected;
	expect(run).toHaveBeenCalledTimes(4);
});
it("rejects repeated rows and non-progressing pages", async () => {
	const { actions } = transport();
	list.mockResolvedValueOnce({
		rooms: [rooms[0], rooms[0]],
		hasMore: false,
		nextOffset: 2,
	});
	await expect(listRoomTree(actions)).rejects.toThrow("duplicate");
	list.mockResolvedValueOnce({ rooms: [], hasMore: true, nextOffset: 0 });
	await expect(listRoomTree(actions)).rejects.toThrow("no progress");
});
