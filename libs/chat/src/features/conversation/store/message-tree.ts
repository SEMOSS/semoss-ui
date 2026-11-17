import type {
	InputPixelMessage,
	PixelMessage,
	ResponsePixelMessage,
} from "../../../types";
import type { RoomStore } from "../../room/store/room.store";
import type { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * Shape returned by the cancel-commit pixels (AskPlayground /
 * AddPlaygroundToolExecution with `responseParts`): the visible pair plus any
 * hidden (invisible) input/response pairs the backend appended alongside it.
 */
export interface CancelCommitOutput {
	/** The user's message, as the backend saved it. */
	inputMessage: InputPixelMessage;
	/** The response, with the parts that streamed before the cancel. */
	responseMessage: ResponsePixelMessage;
	/** Hidden pairs, in conversation order after the visible one. */
	extraMessages: {
		inputMessage: InputPixelMessage;
		responseMessage: ResponsePixelMessage;
	}[];
}

/**
 * Make the store for a message the backend sent.
 *
 * @param room - The room the message belongs to.
 * @param pixelMessage - The backend's message.
 * @returns An `InputMessageStore` for the user's message, else a
 * `ResponseMessageStore`.
 * @throws When the message is neither input nor output.
 */
export const createMessageStore = (
	room: RoomStore,
	pixelMessage: PixelMessage,
): ResponseMessageStore | InputMessageStore => {
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
 *
 * @param parent - The visible response the hidden pairs follow.
 * @param extraMessages - The backend's hidden pairs, if any.
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
