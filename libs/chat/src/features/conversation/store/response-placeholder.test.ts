import { expect, test, vi } from "vitest";
import type { ThemeMap } from "@semoss/shared";
import type { Engine, InputPixelMessage } from "../../../types";
import { RoomStore } from "../../room/store/room.store";
import {
	ASK_PLACEHOLDER_ID,
	STREAMING_PLACEHOLDER_ID,
} from "../../tools/mcp/mcp-constants";
import {
	createInputPlaceholder,
	createResponsePlaceholder,
	getModelOrnamentName,
	readInputPayload,
} from "./response-placeholder";

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));

/** A room running the given model. */
const roomWith = (model: Engine) => {
	const room = new RoomStore({
		theme: {} as ThemeMap["playground"],
		roomId: "room-1",
		panelComponents: {},
	});
	room.setModel(model);
	return room;
};

test("names the model by its display name, else its engine name, never its legacy app name", () => {
	expect(
		getModelOrnamentName({
			engine_id: "m",
			engine_name: "gpt",
			engine_display_name: "GPT",
			app_name: "legacy",
		} as Engine),
	).toBe("GPT");
	expect(
		getModelOrnamentName({
			engine_id: "m",
			engine_name: "gpt",
			app_name: "legacy",
		} as Engine),
	).toBe("gpt");
	expect(getModelOrnamentName(null)).toBe("");
});

test("makes an empty, visible streaming placeholder for the room's model, outside the tree", () => {
	const room = roomWith({
		engine_id: "model-1",
		engine_name: "model-one",
		app_name: "legacy",
	} as Engine);

	const placeholder = createResponsePlaceholder(room);

	expect(placeholder.type).toBe("OUTPUT");
	expect(placeholder.id).toBe(STREAMING_PLACEHOLDER_ID);
	expect(placeholder.parts).toEqual([]);
	expect(placeholder.ornaments.modelName).toBe("model-one");
	expect(placeholder.parent).toBeNull();
});

test("reads a message's text and its uploaded attachments", () => {
	const parts: InputPixelMessage["parts"] = [
		{ type: "TEXT", text: "Hello ", uiText: "Hello " },
		{
			type: "MEDIA",
			mediaInfo: { fileName: "a.png", fileLocation: "/a.png" },
		},
		{ type: "TEXT", text: "there", uiText: "there" },
		{ type: "MEDIA", mediaInfo: { fileName: "b.png", fileLocation: "" } },
	] as InputPixelMessage["parts"];

	expect(readInputPayload({ parts })).toEqual({
		text: "Hello there",
		media: ["/a.png"],
	});
});

test("makes the user's message for the room's model, outside the tree, shown or not", () => {
	const room = roomWith({
		engine_id: "model-1",
		engine_name: "model-one",
		engine_type: "MODEL",
	} as Engine);

	const input = createInputPlaceholder(room, "Hello", true);

	expect(input.type).toBe("INPUT");
	expect(input.id).toBe(ASK_PLACEHOLDER_ID);
	expect(input.visible).toBe(true);
	expect(input.parts).toEqual([
		{ type: "TEXT", text: "Hello", uiText: "Hello" },
	]);
	expect(input.modelId).toBe("model-1");
	expect(input.modelType).toBe("MODEL");
	expect(input.ornaments.modelName).toBe("model-one");
	expect(input.parent).toBeNull();
	expect(createInputPlaceholder(room, "quiet", false).visible).toBe(false);
});
