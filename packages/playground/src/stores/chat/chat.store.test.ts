import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { runPixel, Session } from "@semoss/sdk/react";
import { RootStore } from "@/stores/root/root.store";
import { ChatStore } from "./chat.store";

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	runPixel: vi.fn(),
}));

/** A chat store with the playground's default theme. */
const createChat = () => new ChatStore(new RootStore().theme, {});

beforeEach(() => {
	vi.mocked(runPixel).mockReset();
});
afterEach(() => {
	vi.restoreAllMocks();
});

test("a room pixel that fails rejects with its error and keeps the room list", async () => {
	vi.mocked(runPixel).mockResolvedValueOnce({
		errors: ["Room not found"],
		insightId: "",
		pixelReturn: [],
	});
	const chat = createChat();

	await expect(chat.renameRoom("room-1", "Renamed")).rejects.toThrow(
		"Room not found",
	);
	expect(runPixel).toHaveBeenCalledWith(
		'META | RenameRoom(roomId=["room-1"], name=["<encode>Renamed</encode>"]);',
	);
	expect(chat.keys.roomCounter).toBe(0);
});

test("a conversation is read on its own, then exported and downloaded in the session's insight", async () => {
	vi.mocked(runPixel).mockResolvedValueOnce({
		errors: [],
		insightId: "temporary",
		pixelReturn: [
			{
				isMeta: false,
				operationType: ["OPERATION"],
				output: [
					{
						io: "INPUT",
						dateCreated: "",
						parts: [{ type: "TEXT", text: "Hello" }],
					},
				],
				pixelExpression: "",
				pixelId: "",
				timeToRun: 0,
			},
		],
	});
	const run = vi.spyOn(Session.insight, "run").mockResolvedValue({
		errors: [],
		insightId: "session",
		pixelReturn: [
			{
				isMeta: false,
				operationType: ["FILE_DOWNLOAD"],
				output: "file-key",
				pixelExpression: "",
				pixelId: "",
				timeToRun: 0,
			},
		],
	});
	const download = vi
		.spyOn(Session.insight, "download")
		.mockResolvedValue(undefined);
	const chat = createChat();

	await chat.downloadConversation("room-1", "word");

	// the messages need no insight
	expect(runPixel).toHaveBeenCalledWith(
		'GetPlaygroundMessages(roomId=["room-1"]);',
	);
	expect(run).toHaveBeenCalledWith(expect.stringMatching(/^ToDocx\(/));
	expect(download).toHaveBeenCalledWith("file-key");
});
