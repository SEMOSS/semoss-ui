import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RawPixelMessage, RawPlaygroundRoom, StreamChunk } from "../types";

const { runPixelAsync, getPixelJobStreaming, getPixelAsyncResult } = vi.hoisted(
	() => ({
		runPixelAsync: vi.fn(),
		getPixelJobStreaming: vi.fn(),
		getPixelAsyncResult: vi.fn(),
	}),
);

// `runAgent`/`askPlayground` stream through these SDK primitives directly
// (via `streamPixel`) rather than `actions.run`, so they need their own
// mock instead of `fakeActions` below.
vi.mock("@semoss/sdk/react", () => ({
	runPixelAsync,
	getPixelJobStreaming,
	getPixelAsyncResult,
	download: vi.fn(),
	uploadInsight: vi.fn(),
}));

import {
	createPlaygroundRoom,
	deletePlaygroundRoom,
	getPlaygroundRoomHistory,
	listPinnedPlaygroundRooms,
	listPlaygroundRooms,
	pinPlaygroundRoom,
	renamePlaygroundRoom,
	runAgent,
	updateRoomOptions,
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

describe("createPlaygroundRoom", () => {
	it("associates a new room with a workspace", async () => {
		const actions = fakeActions({ roomId: "room-1" });

		await createPlaygroundRoom(actions, "workspace-1");

		expect(actions.run).toHaveBeenCalledWith(
			'CreatePlaygroundRoom(workspaceId="workspace-1")',
		);
	});

	it("preserves the unscoped room pixel when no workspace is provided", async () => {
		const actions = fakeActions({ roomId: "room-1" });

		await createPlaygroundRoom(actions);

		expect(actions.run).toHaveBeenCalledWith("CreatePlaygroundRoom()");
	});
});

describe("updateRoomOptions", () => {
	it("preserves the room workspace in persisted options", async () => {
		const actions = fakeActions(undefined);

		await updateRoomOptions(actions, {
			roomId: "room-1",
			workspaceId: "workspace-1",
		});

		expect(actions.run).toHaveBeenCalledWith(
			'UpdateRoomOptions(roomId="room-1", roomOptions=[{"instructions":"","mcp":[],"temperature":0.7,"workspace":{"workspace_id":"workspace-1"}}])',
		);
	});
});

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

describe("runAgent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function mockCompletedRun(
		result: Record<string, unknown>,
		chunks: StreamChunk[] = [],
	) {
		runPixelAsync.mockResolvedValue({ jobId: "job-1" });
		getPixelJobStreaming.mockResolvedValue({
			message: chunks,
			status: "Complete",
		});
		getPixelAsyncResult.mockResolvedValue({
			errors: [],
			insightId: "insight-1",
			results: [{ output: result }],
		});
	}

	it("builds the RunAgent pixel and returns the completed run record", async () => {
		mockCompletedRun({
			status: "COMPLETED",
			waitTimedOut: false,
			finalText: "done",
		});

		const result = await runAgent(
			"insight-1",
			{
				engineId: "engine-1",
				roomId: "room-1",
				command: "hello",
				harnessType: "semoss",
			},
			vi.fn(),
		);

		expect(runPixelAsync).toHaveBeenCalledWith(
			'RunAgent(roomId=["room-1"], engine=["engine-1"], command=["<encode>hello</encode>"], harnessType="semoss", wait=true)',
			"insight-1",
		);
		expect(result).toEqual({
			status: "COMPLETED",
			waitTimedOut: false,
			finalText: "done",
		});
	});

	it("includes maxTurns and workspaceId when provided", async () => {
		mockCompletedRun({ status: "COMPLETED", waitTimedOut: false });

		await runAgent(
			"insight-1",
			{
				engineId: "engine-1",
				roomId: "room-1",
				command: "hello",
				harnessType: "claude_code",
				maxTurns: 10,
				workspaceId: "workspace-1",
			},
			vi.fn(),
		);

		expect(runPixelAsync).toHaveBeenCalledWith(
			'RunAgent(roomId=["room-1"], engine=["engine-1"], command=["<encode>hello</encode>"], harnessType="claude_code", maxTurns=10, workspaceId=["workspace-1"], wait=true)',
			"insight-1",
		);
	});

	it("streams content/thinking/tool chunks to onChunk as they arrive", async () => {
		const chunks: StreamChunk[] = [
			{ stream_type: "content", data: { content: "hi" } },
			{ stream_type: "thinking", data: { thinking: "..." } },
		];
		mockCompletedRun(
			{ status: "COMPLETED", waitTimedOut: false, finalText: "hi" },
			chunks,
		);
		const onChunk = vi.fn();

		await runAgent(
			"insight-1",
			{
				engineId: "engine-1",
				roomId: "room-1",
				command: "hello",
				harnessType: "semoss",
			},
			onChunk,
		);

		expect(onChunk).toHaveBeenNthCalledWith(1, chunks[0]);
		expect(onChunk).toHaveBeenNthCalledWith(2, chunks[1]);
	});

	it("throws when the run times out before completing", async () => {
		mockCompletedRun({ status: "RUNNING", waitTimedOut: true });

		await expect(
			runAgent(
				"insight-1",
				{
					engineId: "engine-1",
					roomId: "room-1",
					command: "hello",
					harnessType: "semoss",
				},
				vi.fn(),
			),
		).rejects.toThrow("The agent run timed out before completing.");
	});

	it("throws when the run ends in a non-COMPLETED status", async () => {
		mockCompletedRun({ status: "FAILED", waitTimedOut: false });

		await expect(
			runAgent(
				"insight-1",
				{
					engineId: "engine-1",
					roomId: "room-1",
					command: "hello",
					harnessType: "semoss",
				},
				vi.fn(),
			),
		).rejects.toThrow("The agent run did not complete: FAILED");
	});
});
