import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import {
	createPlaygroundRoom,
	exportMarkdown,
	generateRoomName,
	getPlaygroundRooms,
} from "./chat";

vi.mock("./base", () => ({ runPixel: vi.fn(), runPixelAsync: vi.fn() }));

const mockRunPixel = vi.mocked(runPixel);

/** A runPixel answer with one statement. */
const answer = (output: unknown, operationType = ["OPERATION"]) =>
	({
		errors: operationType.includes("ERROR") ? [String(output)] : [],
		insightId: "insight-1",
		pixelReturn: [
			{
				isMeta: false,
				operationType: operationType,
				output: output,
				pixelExpression: "",
				pixelId: "",
				timeToRun: 0,
			},
		],
	}) as Awaited<ReturnType<typeof runPixel>>;

describe("playground room wrappers", () => {
	beforeEach(() => vi.clearAllMocks());

	it("creates a room in a new insight and returns both ids", async () => {
		mockRunPixel.mockResolvedValueOnce(answer({ roomId: "room-1" }));
		await expect(
			createPlaygroundRoom({ workspaceId: "a" }),
		).resolves.toEqual({
			roomId: "room-1",
			insightId: "insight-1",
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'CreatePlaygroundRoom(workspaceId="a")',
			"new",
		);
	});

	it("throws when the room could not be created", async () => {
		mockRunPixel.mockResolvedValueOnce(answer("no access", ["ERROR"]));
		await expect(createPlaygroundRoom()).rejects.toThrow("no access");
		mockRunPixel.mockResolvedValueOnce(answer(null));
		await expect(createPlaygroundRoom()).rejects.toThrow(
			"CreatePlaygroundRoom returned no room",
		);
	});

	it("lists rooms through GetPlaygroundRooms, never the Reactor-suffixed name", async () => {
		mockRunPixel.mockResolvedValueOnce(
			answer([{ ROOM_ID: "r", ROOM_NAME: "Plans", DATE_CREATED: "" }]),
		);
		await expect(
			getPlaygroundRooms("session", {
				roomOptionsSearch: "scope:widget",
			}),
		).resolves.toHaveLength(1);
		const [pixel] = mockRunPixel.mock.calls[0];
		expect(pixel).toContain("GetPlaygroundRooms(");
		expect(pixel).not.toContain("Reactor(");
	});

	it("reads a generated name from either answer shape", async () => {
		mockRunPixel.mockResolvedValueOnce(answer("Trip plans"));
		await expect(generateRoomName("i", { roomId: "r" })).resolves.toBe(
			"Trip plans",
		);
		mockRunPixel.mockResolvedValueOnce(answer({ name: "Budget" }));
		await expect(generateRoomName("i", { roomId: "r" })).resolves.toBe(
			"Budget",
		);
	});

	it("refuses an export that made no file", async () => {
		mockRunPixel.mockResolvedValueOnce(answer("key", ["OPERATION"]));
		await expect(
			exportMarkdown("i", {
				markdown: "#",
				fileName: "f",
				format: "word",
			}),
		).rejects.toThrow("Failed to generate WORD file");
		mockRunPixel.mockResolvedValueOnce(answer("key", ["FILE_DOWNLOAD"]));
		await expect(
			exportMarkdown("i", {
				markdown: "#",
				fileName: "f",
				format: "word",
			}),
		).resolves.toBe("key");
	});
});
