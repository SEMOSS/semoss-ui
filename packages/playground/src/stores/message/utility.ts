import type { RoomStore } from "@/stores";
import type { Engine, PixelMessage } from "@/types";
import { InputMessageStore } from "./input-message.store";
import { PlanMessageStore } from "./plan-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * Normalizes the tag/tags fields of an engine into a flat lowercase array.
 * The backend may return `tag` (singular) or `tags` (plural), each as a
 * string (possibly comma-separated) or a string array.
 */
export const getEngineTags = (
	model: Pick<Engine, "tag" | "tags"> | null,
): string[] => {
	if (!model) return [];

	const toArray = (v: string | string[] | undefined): string[] =>
		Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];

	return [...toArray(model.tag), ...toArray(model.tags)];
};

/**
 * Detects whether an engine model is an image-generation model by inspecting
 * its tag or tags
 */
export const isImageGenerationModel = (model: Engine | null): boolean => {
	return getEngineTags(model).includes("image-generation");
};

/**
 * Create a messageStore from a pixelMessage
 * @param room - room store the message belongs to
 * @param pixelMessage - message from backend that needs to be converted
 */
export const createMessageStore = (
	room: RoomStore,
	pixelMessage: PixelMessage,
): ResponseMessageStore | InputMessageStore | PlanMessageStore => {
	// set data based on type
	if (pixelMessage.io === "INPUT") {
		return new InputMessageStore(room, pixelMessage);
	} else if (pixelMessage.io === "OUTPUT") {
		if (pixelMessage.ornaments.PLAYGROUND_MESSAGE_TYPE === "COT") {
			return new PlanMessageStore(room, pixelMessage);
		}

		return new ResponseMessageStore(room, pixelMessage);
	}
};
