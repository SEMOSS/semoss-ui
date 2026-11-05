import { beforeEach, expect, test, vi } from "vitest";
import { runPixel, runPixelAsync, uploadInsight } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { RoomStore } from "./room.store";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

vi.mock("@/features/connectors/connector-tools", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("@/features/connectors/connector-tools")
	>()),
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

/** Sends a message and returns the media paths its model request carried. */
const sentMedia = async (room: RoomStore, files: File[] = []) => {
	// option saves and other room pixels succeed
	vi.mocked(runPixel).mockResolvedValue({
		errors: [],
		insightId: "insight-test",
		pixelReturn: [
			{
				output: true,
				isMeta: false,
				operationType: [],
				pixelExpression: "",
				pixelId: "",
				timeToRun: 0,
			},
		],
	});
	// the model request is recorded and stopped there
	let pixel = "";
	const stopped = new Error("stopped at the model request");
	vi.mocked(runPixelAsync).mockImplementation(async (expression) => {
		pixel = expression;
		throw stopped;
	});
	await expect(room.askMessage("Look at these", files)).rejects.toBe(stopped);
	const media = pixel.match(/media=(\[[^\]]*\])/);
	expect(media).not.toBeNull();
	return JSON.parse(media?.[1] ?? "[]") as string[];
};

const uploads = (...names: string[]) =>
	vi.mocked(uploadInsight).mockResolvedValueOnce({
		data: names.map((name) => ({ fileName: name, fileLocation: name })),
	} as Awaited<ReturnType<typeof uploadInsight>>);

beforeEach(() => {
	vi.clearAllMocks();
	// an upload left unused by a failed test must not reach the next one
	vi.mocked(uploadInsight).mockReset();
	localStorage.clear();
});

test("files outside the list are uploaded but not sent to the model", async () => {
	const room = await createRoom(["png", "jpg", "jpeg", "svg"]);
	uploads("photo.png", "report.pdf");
	const files = [
		new File(["png"], "photo.png"),
		new File(["pdf"], "report.pdf"),
	];
	expect(await sentMedia(room, files)).toEqual(["photo.png"]);
	expect(uploadInsight).toHaveBeenCalledWith("insight-test", "", files);
});

test("queued files outside the list stay in the room without failing", async () => {
	const room = await createRoom(["png"]);
	room.contextItems.add({ name: "deck.pptx", path: "deck.pptx" });
	room.contextItems.add({ name: "chart.png", path: "chart.png" });
	expect(await sentMedia(room)).toEqual(["chart.png"]);
	expect(uploadInsight).not.toHaveBeenCalled();
});

test("without a list every file is sent to the model", async () => {
	const room = await createRoom([]);
	uploads("deck.pptx", "photo.png");
	expect(
		await sentMedia(room, [
			new File(["pptx"], "deck.pptx"),
			new File(["png"], "photo.png"),
		]),
	).toEqual(["deck.pptx", "photo.png"]);
});

test("list matching ignores case, spaces, and a leading dot", async () => {
	const room = await createRoom([" .PDF ", "pptx"]);
	expect(room.shouldAttachToModel("deck.PPTX")).toBe(true);
	expect(room.shouldAttachToModel("report.pdf")).toBe(true);
	expect(room.shouldAttachToModel("notes.txt")).toBe(false);
	expect(room.shouldAttachToModel("README")).toBe(false);
});
