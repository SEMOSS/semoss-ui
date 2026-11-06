import { batchChanges } from "../observable-store";
import type {
	InputPixelMessage,
	PixelMessage,
	ResponsePixelMessage,
} from "../room.types";
import type { RoomEngine } from "../room-engine.store";
import type { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * What the commit of a stopped turn returns (AskPlayground /
 * AddPlaygroundToolExecution with `responseParts`): the visible pair plus any
 * hidden input/response pairs the backend appended alongside it.
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
 * Make the store for a stored message.
 *
 * @param room - The room it belongs to.
 * @param pixelMessage - The message as the backend stores it.
 * @returns A user turn or a response.
 */
export const createMessageStore = (
	room: RoomEngine,
	pixelMessage: PixelMessage,
): ResponseMessageStore | InputMessageStore => {
	if (pixelMessage.io === "INPUT") {
		return new InputMessageStore(room, pixelMessage);
	}
	if (pixelMessage.io === "OUTPUT") {
		return new ResponseMessageStore(room, pixelMessage);
	}
	throw new Error(`Unknown message type: ${JSON.stringify(pixelMessage)}`);
};

/**
 * Splice the backend's hidden input/response pairs into the tree in
 * conversation order, under `parent`. They are not shown, but joining the
 * tree keeps `tail` — and so the next message's parent — aligned with the
 * backend's provider history. Shared by the stopped-turn and stopped-tool
 * commits.
 *
 * @param parent - The message the pairs follow.
 * @param extraMessages - The hidden pairs.
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

/**
 * Build a room's conversation tree from its stored messages under `root`:
 * each message under its parent, a compacted message under its summary, and
 * the rest under the root.
 *
 * @param room - The room.
 * @param root - The conversation's root.
 * @param pixelMessages - The messages as the backend stores them, in order.
 * @returns The model the last user turn ran on, or undefined for none.
 */
export const linkMessageTree = (
	room: RoomEngine,
	root: AbstractMessageStore,
	pixelMessages: PixelMessage[],
): string | undefined => {
	const messages: Record<
		string,
		{
			parentMessageId: string;
			summaryLeafMessageId: string;
			message: InputMessageStore | ResponseMessageStore;
		}
	> = {};

	let activeModelId: string | undefined;
	batchChanges(() => {
		for (const pixelMessage of pixelMessages) {
			if (pixelMessage.io === "INPUT") {
				activeModelId = pixelMessage.modelId;
			}
			const message = createMessageStore(room, pixelMessage);
			messages[message.id] = {
				parentMessageId: pixelMessage.parentMessageId || "",
				summaryLeafMessageId: pixelMessage.summaryLeafMessageId || "",
				message: message,
			};
		}

		// linked once all exist
		for (const entry of Object.values(messages)) {
			const parent = messages[entry.parentMessageId];
			if (parent) {
				parent.message.addChild(entry.message);
				continue;
			}
			// a compacted message hangs off its summary
			const pseudoParent = messages[entry.summaryLeafMessageId];
			if (pseudoParent) {
				pseudoParent.message.addChild(entry.message);
				if (pseudoParent.message instanceof ResponseMessageStore) {
					pseudoParent.message.setConversationCompactedAbove(true);
				}
				continue;
			}
			root.addChild(entry.message);
		}
	});
	return activeModelId;
};
