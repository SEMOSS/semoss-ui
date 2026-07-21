import type { RoomStore } from "@/stores";
import type {
	InputPixelMessage,
	PixelMessage,
	ResponsePixelMessage,
} from "@/types";
import type { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * Shape returned by the cancel-commit pixels (AskPlayground /
 * AddPlaygroundToolExecution with `responseParts`): the visible pair plus any
 * hidden (invisible) input/response pairs the backend appended alongside it.
 */
export interface CancelCommitOutput {
	inputMessage: InputPixelMessage;
	responseMessage: ResponsePixelMessage;
	extraMessages: {
		inputMessage: InputPixelMessage;
		responseMessage: ResponsePixelMessage;
	}[];
}

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

/**
 * Splice the backend's hidden (invisible) input/response pair(s) into the tree
 * in conversation order, parented under `parent`. They aren't rendered, but
 * joining the tree keeps `tail` — and thus the next message's parent — aligned
 * with the backend's provider history. Shared by the cancelled-turn and
 * cancelled-tool-execution commits.
 */
export const spliceHiddenMessages = (
	parent: AbstractMessageStore,
	extraMessages: CancelCommitOutput["extraMessages"] | undefined,
): void => {
	(extraMessages ?? []).reduce<AbstractMessageStore>((cursor, pair) => {
		const hiddenInput = createMessageStore(parent.room, pair.inputMessage);
		const hiddenResponse = createMessageStore(
			parent.room,
			pair.responseMessage,
		);
		cursor.addChild(hiddenInput);
		hiddenInput.addChild(hiddenResponse);
		return hiddenResponse;
	}, parent);
};
