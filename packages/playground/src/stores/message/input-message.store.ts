import { makeObservable, observable } from "mobx";
import type { InputMediaPixelMessage, InputTextPixelMessage } from "@/types";
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
	}[];

	constructor(
		room: AbstractMessageStore["room"],
		message: InputTextPixelMessage | InputMediaPixelMessage,
	) {
		super(room, message);
		this.pixelMessageType = message.type;

		this.text = message.inputUIPrompt;
		this.mediaInputs = message.mediaInputs;

		makeObservable(this, {
			text: observable,
			mediaInputs: observable,
		});
	}
}
