import { makeObservable, observable } from "mobx";
import type { InputPixelMessage } from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";

/**
 * Input Message Store
 */
export class InputMessageStore extends AbstractMessageStore {
	readonly type = "INPUT";

	/**
	 * Parts associated with the message
	 */
	parts: InputPixelMessage["parts"] = [];

	constructor(
		room: AbstractMessageStore["room"],
		message: InputPixelMessage,
	) {
		super(room, message);

		makeObservable(this, {
			parts: observable,
		});

		// sync the message
		this.sync(message);
	}

	/**
	 * Sync store properties from the pixel message
	 */
	sync(message: InputPixelMessage) {
		// super
		super.sync(message);

		// set the id
		this.id = message.messageId;

		// set the parts
		this.parts = message.parts;

		// sync the tools
		for (const part of message.parts) {
			if (part.type === "TOOL_RESULT") {
				this.room.syncTool(part.toolResult.toolCallId, this, part);
			}
		}

		// set tokens
		this.tokens = message.tokens;
	}
}
