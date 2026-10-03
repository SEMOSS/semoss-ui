import { describe, expect, test, vi } from "vitest";
import type { RoomStore } from "./room.store";
import {
	parseMcpFile,
	ROOM_TOOL_FILE_PATH,
	readRoomToolFile,
	saveRoomToolFile,
} from "./room-tool-file";

/** A room whose pixels answer with `output`, or fail with `errors`. */
const createRoom = (output: unknown, errors: string[] = []) =>
	({
		runRoomPixel: vi.fn(async () => ({
			errors: errors,
			insightId: "insight-1",
			pixelReturn: [{ output: output }],
		})),
	}) as unknown as RoomStore;

describe("a room's tool file", () => {
	test("is read and parsed from the room's insight", async () => {
		const room = createRoom('{"tools":[]}');

		await expect(readRoomToolFile(room)).resolves.toEqual({ tools: [] });
		expect(room.runRoomPixel).toHaveBeenCalledWith(
			`GetInsightAssets(filePath=["${ROOM_TOOL_FILE_PATH}"]);`,
			false,
			false,
			false,
		);
	});

	test("reads as null when the room has none, and fails for any other error", async () => {
		await expect(
			readRoomToolFile(
				createRoom(null, [`${ROOM_TOOL_FILE_PATH} does not exist`]),
			),
		).resolves.toBeNull();
		await expect(
			readRoomToolFile(createRoom(null, ["Access denied"])),
		).rejects.toThrow("Access denied");
	});

	test("is saved as indented JSON that cannot close its encode block", async () => {
		const room = createRoom(true);

		await saveRoomToolFile(room, { note: "</encode>" });
		expect(room.runRoomPixel).toHaveBeenCalledWith(
			`SaveInsightAssets(filePath=["${ROOM_TOOL_FILE_PATH}"], content=["<encode>{\n    "note": "<\\/encode>"\n}</encode>"]);`,
			false,
			false,
			true,
		);
	});
});

describe("parseMcpFile", () => {
	test("parses the file's text, and answers null for text that is not JSON", () => {
		expect(parseMcpFile('{"tools":[]}')).toEqual({ tools: [] });
		expect(parseMcpFile("not json")).toBeNull();
		expect(parseMcpFile(undefined)).toBeNull();
		expect(parseMcpFile({ tools: [] })).toEqual({ tools: [] });
	});
});
