import type { RoomStore } from "@/stores";
import type { PixelMessage } from "@/types";
import { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * Create a messageStore from a pixelMessage
 * @param room - room store the message belongs to
 * @param pixelMessage - message from backend that needs to be converted
 */
export const createMessageStore = (
	room: RoomStore,
	pixelMessage: PixelMessage,
): ResponseMessageStore | InputMessageStore => {
	// set data based on type
	if (pixelMessage.io === "INPUT") {
		return new InputMessageStore(room, pixelMessage);
	} else if (pixelMessage.io === "OUTPUT") {
		return new ResponseMessageStore(room, pixelMessage);
	}
	throw new Error(`Unknown message type: ${pixelMessage}`);
};
