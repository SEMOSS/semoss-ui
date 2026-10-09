import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { listRoomsPage } from "./list-rooms";
import { pinRoom } from "./pin-room";

function transport(output: unknown) {
	const run = vi
		.fn()
		.mockResolvedValue({ pixelReturn: [{ output, operationType: [] }] });
	return { run, actions: { run } as unknown as InsightActions };
}

describe("saved room pins", () => {
	it("encodes room IDs and requires a confirmed write", async () => {
		const { actions, run } = transport(true);
		await pinRoom(actions, 'room"one', false);
		expect(run).toHaveBeenCalledWith(
			'PinRoom(roomId=["room\\"one"], pinned=[false]);',
		);
	});
	it.each([false, "true", null])(
		"rejects an unconfirmed result: %s",
		async (result) => {
			await expect(
				pinRoom(transport(result).actions, "room", true),
			).rejects.toThrow();
		},
	);
	it("filters pinned navigation before pagination while leaving ordinary history unfiltered", async () => {
		const { actions, run } = transport([{ ROOM_ID: "room", PINNED: true }]);
		const page = await listRoomsPage(actions, 25, undefined, true);
		expect(run).toHaveBeenLastCalledWith(
			'META | GetPlaygroundRooms(mode=["collaboration"], sort=["DESC"], limit=[25], offset=[25], includeUnnamedRooms=[true], pinned=[true]);',
		);
		expect(page.rooms[0]?.pinned).toBe(true);
		await listRoomsPage(actions);
		expect(run.mock.calls.at(-1)?.[0]).not.toContain("pinned=");
	});
});
