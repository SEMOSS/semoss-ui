import { beforeEach, expect, test, vi } from "vitest";
import { runPixel, uploadInsight } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { RoomStore } from "./room.store";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

vi.mock("@/features/teamwork/connectors/connectors.api", () => ({
	getSessionLogins: vi.fn().mockResolvedValue({}),
	readSessionLoginConfig: vi.fn().mockResolvedValue({
		connectorAccess: null,
		availableProviders: null,
	}),
	readUserConnectorTools: vi.fn().mockResolvedValue(null),
}));

/** A chat with a platform file policy and an ordinary text model. */
const createRoom = async (allowedFileTypes: string[]) => {
	const room = new RoomStore({
		theme: { allowedFileTypes } as ThemeMap["playground"],
		roomId: "attachment-test",
		insightId: "insight-test",
		panelComponents: {},
	});
	vi.mocked(runPixel).mockResolvedValueOnce({
		errors: [],
		insightId: "insight-test",
		pixelReturn: [[], {}].map((output) => ({
			output,
			isMeta: false,
			operationType: [],
			pixelExpression: "",
			pixelId: "",
			timeToRun: 0,
		})),
	});
	await room.initialize({ isNew: true });
	room.setModel({
		engine_id: "laguna-test",
		engine_name: "Laguna",
		engine_type: "MODEL",
	});
	return room;
};

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

test("a blocked file rejects the whole submission before upload", async () => {
	const room = await createRoom(["pdf"]);
	await expect(
		room.askMessage("Read both files", [
			new File(["pdf"], "report.pdf"),
			new File(["pptx"], "deck.pptx"),
		]),
	).rejects.toThrow("file policy: deck.pptx");
	expect(uploadInsight).not.toHaveBeenCalled();
	expect(room.isLoading).toBe(false);
});

test("document uploads are allowed for a text model when policy permits them", async () => {
	const room = await createRoom([".PDF", "pptx", "csv"]);
	const uploadFailure = new Error("fixture upload stopped");
	vi.mocked(uploadInsight).mockRejectedValueOnce(uploadFailure);
	const files = [new File(["pptx"], "deck.PPTX")];
	await expect(room.askMessage("Read this deck", files)).rejects.toBe(
		uploadFailure,
	);
	expect(uploadInsight).toHaveBeenCalledWith("insight-test", "", files);
	expect(room.isLoading).toBe(false);
});

test("blocked queued files remain queued after submission fails", async () => {
	const room = await createRoom(["pdf"]);
	room.teamwork.addContextItem({ name: "deck.pptx", path: "deck.pptx" });
	await expect(room.askMessage("Read the queued deck")).rejects.toThrow(
		"file policy: deck.pptx",
	);
	expect(room.teamwork.contextItems.map((item) => item.path)).toEqual([
		"deck.pptx",
	]);
	expect(room.isLoading).toBe(false);
});
