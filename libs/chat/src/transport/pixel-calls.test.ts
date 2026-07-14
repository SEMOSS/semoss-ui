import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RawPixelMessage, RawPlaygroundRoom } from "../types";
import {
	deletePlaygroundRoom,
	getPlaygroundRoomHistory,
	listPinnedPlaygroundRooms,
	listPlaygroundRooms,
	pinPlaygroundRoom,
	renamePlaygroundRoom,
} from "./pixel-calls";

function fakeActions(output: unknown) {
	return {
		run: vi.fn().mockResolvedValue({ pixelReturn: [{ output }] }),
		// biome-ignore lint/suspicious/noExplicitAny: minimal fake of the real InsightActions surface
	} as any;
}

function rawRoom(
	overrides: Partial<RawPlaygroundRoom> = {},
): RawPlaygroundRoom {
	return {
		ROOM_ID: "room-1",
		ROOM_NAME: "Claim question",
		DATE_CREATED: "2026-06-22 12:00:00",
		...overrides,
	};
}

describe("listPinnedPlaygroundRooms", () => {
	it("runs the exact pinned-rooms pixel and maps to RoomSummary", async () => {
		const actions = fakeActions([rawRoom({ PINNED: true })]);

		const result = await listPinnedPlaygroundRooms(actions);

		expect(actions.run).toHaveBeenCalledWith(
			'META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);',
		);
		expect(result).toEqual([
			{
				roomId: "room-1",
				name: "Claim question",
				dateCreated: expect.any(Date),
				pinned: true,
				workspaceId: undefined,
			},
		]);
	});
});

describe("listPlaygroundRooms", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("runs the paged pixel with no search term", async () => {
		const actions = fakeActions([rawRoom()]);

		await listPlaygroundRooms(actions, { limit: 25, offset: 0 });

		expect(actions.run).toHaveBeenCalledWith(
			'META | GetPlaygroundRooms(limit=25, offset=0, sort=["DESC"]);',
		);
	});

	it("encodes a search term into the pixel", async () => {
		const actions = fakeActions([rawRoom()]);

		await listPlaygroundRooms(actions, {
			search: "claim",
			limit: 25,
			offset: 25,
		});

		expect(actions.run).toHaveBeenCalledWith(
			'META | GetPlaygroundRooms(search="<encode>claim</encode>", limit=25, offset=25, sort=["DESC"]);',
		);
	});

	it("defaults pinned to false when PINNED is absent", async () => {
		const actions = fakeActions([rawRoom({ PINNED: undefined })]);

		const result = await listPlaygroundRooms(actions, {
			limit: 25,
			offset: 0,
		});

		expect(result[0]?.pinned).toBe(false);
	});
});

describe("renamePlaygroundRoom", () => {
	it("runs the encoded rename pixel", async () => {
		const actions = fakeActions(undefined);

		await renamePlaygroundRoom(actions, {
			roomId: "room-1",
			name: "New name",
		});

		expect(actions.run).toHaveBeenCalledWith(
			'META | RenameRoom(roomId=["room-1"], name=["<encode>New name</encode>"]);',
		);
	});
});

describe("pinPlaygroundRoom", () => {
	it("runs the pin pixel with pinned=true", async () => {
		const actions = fakeActions(undefined);

		await pinPlaygroundRoom(actions, { roomId: "room-1", pinned: true });

		expect(actions.run).toHaveBeenCalledWith(
			'PinRoom(roomId=["room-1"], pinned=[true]);',
		);
	});

	it("runs the pin pixel with pinned=false", async () => {
		const actions = fakeActions(undefined);

		await pinPlaygroundRoom(actions, { roomId: "room-1", pinned: false });

		expect(actions.run).toHaveBeenCalledWith(
			'PinRoom(roomId=["room-1"], pinned=[false]);',
		);
	});
});

describe("deletePlaygroundRoom", () => {
	it("runs the remove-room pixel", async () => {
		const actions = fakeActions(undefined);

		await deletePlaygroundRoom(actions, "room-1");

		expect(actions.run).toHaveBeenCalledWith(
			'RemoveUserRoom(roomId=["room-1"]);',
		);
	});
});

describe("getPlaygroundRoomHistory", () => {
	it("runs the batched history pixel and returns the messages output, with an empty mcp default", async () => {
		const messages: RawPixelMessage[] = [
			{
				io: "INPUT",
				messageId: "m1",
				dateCreated: "2026-06-22 12:00:00",
				parts: [{ type: "TEXT", text: "hello" }],
			},
		];
		const actions = fakeActions(messages);

		const result = await getPlaygroundRoomHistory(actions, "room-1");

		expect(actions.run).toHaveBeenCalledWith(
			'GetPlaygroundMessages(roomId=["room-1"]); GetRoomOptions(roomId="room-1"); SetRoomForInsight(roomId="room-1");',
		);
		expect(result).toEqual({ messages, mcp: [] });
	});

	it("parses mcp out of GetRoomOptions' pixelReturn slot", async () => {
		const messages: RawPixelMessage[] = [
			{
				io: "INPUT",
				messageId: "m1",
				dateCreated: "2026-06-22 12:00:00",
				parts: [{ type: "TEXT", text: "hello" }],
			},
		];
		const mcp = [{ type: "VECTOR" as const, id: "kb-1", name: "Docs" }];
		const actions = {
			run: vi.fn().mockResolvedValue({
				pixelReturn: [
					{ output: messages },
					{ output: { OPTIONS: { mcp } } },
					{ output: undefined },
				],
			}),
			// biome-ignore lint/suspicious/noExplicitAny: minimal fake of the real InsightActions surface
		} as any;

		const result = await getPlaygroundRoomHistory(actions, "room-1");

		expect(result).toEqual({ messages, mcp });
	});
});
