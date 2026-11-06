import type { InputPixelMessage } from "../room.types";
import type { RoomEngine } from "../room-engine.store";
import { AbstractMessageStore } from "./abstract-message.store";

/**
 * A user turn, or the results of tool calls the backend records as one.
 */
export class InputMessageStore extends AbstractMessageStore {
	readonly type = "INPUT";

	/** The message's parts, replaced on every change. */
	parts: InputPixelMessage["parts"] = [];

	/**
	 * @param room - The room it belongs to.
	 * @param message - The message as the backend stores it.
	 */
	constructor(room: RoomEngine, message: InputPixelMessage) {
		super(room, message);
		this.sync(message);
		this.observeMessageFields<InputMessageStore>(["parts"]);
	}

	/**
	 * Take the message's state from the stored message, including the tool
	 * results it carries.
	 *
	 * @param message - The message as the backend stores it.
	 */
	sync(message: InputPixelMessage): void {
		super.sync(message);
		this.id = message.messageId;
		this.parts = message.parts;

		for (const part of message.parts) {
			if (part.type === "TOOL_RESULT") {
				this.room.syncTool(part.toolResult.toolCallId, this, part);
			}
		}

		this.tokens = message.tokens;
	}

	/**
	 * Add parts to the end of the message, such as the files sent with it.
	 *
	 * @param parts - The parts to add.
	 */
	appendParts = (parts: InputPixelMessage["parts"]): void => {
		if (parts.length > 0) {
			this.parts = [...this.parts, ...parts];
		}
	};
}
