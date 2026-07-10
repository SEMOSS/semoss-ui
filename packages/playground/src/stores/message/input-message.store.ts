import { action, makeObservable, observable } from "mobx";
import type { InputPixelMessage } from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import { PlanMessageStore } from "./plan-message.store";
import { ResponseMessageStore } from "./response-message.store";

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
			editMessage: action,
		});

		// sync the message
		this.sync(message);
	}

	/**
	 * Edit the message text and resubmit as a new sibling branch
	 */
	editMessage = async (newText: string): Promise<void> => {
		const room = this.room;

		// get the parent message (ResponseMessageStore or PlanMessageStore)
		const parentMessage = this.parent;
		if (
			parentMessage instanceof ResponseMessageStore === false &&
			parentMessage instanceof PlanMessageStore === false
		) {
			throw new Error(
				"Can only edit if the parent is a response or plan message",
			);
		}

		// create a new input message with the edited text
		const editedMessage = new InputMessageStore(room, {
			io: "INPUT",
			type: "INPUT_TEXT",
			messageId: "EDIT_PLACEHOLDER_ID",
			visible: true,
			platform_generated: true,
			modelId: room.model.engine_id,
			modelType: room.model.engine_type,
			dateCreated: new Date().toISOString(),
			parts: [{ type: "TEXT", text: newText, uiText: newText }],
			tokens: this.tokens,
			ornaments: {
				modelName:
					room.model.engine_display_name ||
					room.model.engine_name ||
					"",
			},
		});

		// Update room options with current modelId before running message
		await room.updateRoomOptions(room.options);

		parentMessage.runMessage(editedMessage);
	};

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
