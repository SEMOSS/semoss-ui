import { action, makeObservable, observable } from "mobx";
import type {
	InputMediaPixelMessage,
	InputTextPixelMessage,
	PixelMessage,
} from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";

/**
 * Input Message Store
 */
export class InputMessageStore extends AbstractMessageStore {
	readonly type = "INPUT";
	readonly pixelMessageType:
		| InputTextPixelMessage["type"]
		| InputMediaPixelMessage["type"];

	/**
	 * Text associated with the message
	 */
	text: string = "";

	/**
	 * Files associated with the message
	 */
	mediaInputs: {
		fileName: string;
		fileLocation?: string;
		base64Data?: string;
		mimeType?: string;
		imageType?: "FILE";
	}[] = [];

	constructor(
		room: AbstractMessageStore["room"],
		message: InputTextPixelMessage | InputMediaPixelMessage,
	) {
		super(room, message);
		this.pixelMessageType = message.type;

		makeObservable(this, {
			text: observable,
			mediaInputs: observable,
			sync: action,
		});

		// sync the message (must be after makeObservable so sync action is registered)
		this.sync(message);
	}

	/**
	 * Sync store properties from the pixel message
	 */
	sync = (message: PixelMessage) => {
		if (message.type === "INPUT_TEXT") {
			this.text = message.inputUIPrompt;
			this.mediaInputs = message.mediaInputs;
		} else if (message.type === "INPUT_MEDIA") {
			this.text = message.inputUIPrompt;
			this.mediaInputs = message.mediaInputs;
		} else {
			throw new Error(
				`Invalid message object passed to InputMessageStore.update: ${JSON.stringify(message)}`,
			);
		}

		// cast the types
		message = message as InputMediaPixelMessage | InputMediaPixelMessage;

		// set the id
		this.id = message.messageId;
	};
}
