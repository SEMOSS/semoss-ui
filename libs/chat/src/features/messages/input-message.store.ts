import type { InputPixelMessage } from "../../types";
import type { RoomStore } from "../room/room.store";
import {
	AbstractMessageStore,
	initialMessageSnapshot,
	type MessageSnapshot,
} from "./abstract-message.store";

/** What a user's message holds. */
export interface InputMessageSnapshot extends MessageSnapshot {
	readonly parts: InputPixelMessage["parts"];
}

/** A message the user sent. */
export class InputMessageStore extends AbstractMessageStore<InputMessageSnapshot> {
	readonly type = "INPUT";

	/**
	 * @param room - The room the message is in.
	 * @param message - The pixel message.
	 */
	constructor(room: RoomStore, message: InputPixelMessage) {
		super(room, { ...initialMessageSnapshot(message), parts: [] });
		this.sync(message);
	}

	/**
	 * Take the backend's copy of the message, and the results of the tool
	 * calls it answers.
	 *
	 * @param message - The pixel message.
	 */
	sync(message: InputPixelMessage): void {
		super.sync(message);
		this.state.update({
			id: message.messageId,
			parts: message.parts,
			tokens: message.tokens,
		});
		for (const part of message.parts) {
			if (part.type === "TOOL_RESULT") {
				this.room.syncTool(part.toolResult.toolCallId, this, part);
			}
		}
	}
}
