import type { RoomStore } from "@/stores";
import type { Engine, PixelMessage } from "@/types";
import { InputMessageStore } from "./input-message.store";
import { PlanMessageStore } from "./plan-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * Detects whether an engine model is an image-generation model by inspecting
 * its tag and tags CHECK THIS
 */
export const isImageGenerationModel = (
	model:
		| (Engine & { tag?: string | string[]; tags?: string | string[] })
		| null,
): boolean => {
	if (!model) return false;

	const tags = [model.tag, model.tags]
		.flatMap((raw) => {
			if (Array.isArray(raw)) return raw;
			if (typeof raw === "string") return raw.split(",");
			return [];
		})
		.map((t) => t.toLowerCase().trim())
		.filter(Boolean);

	return tags.includes("image-generation");
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
