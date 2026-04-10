import type { RoomStore } from "@/stores";
import type { PixelMessage } from "@/types";
import { InputMessageStore } from "./input-message.store";
import { PlanMessageStore } from "./plan-message.store";
import { ResponseMessageStore } from "./response-message.store";

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
