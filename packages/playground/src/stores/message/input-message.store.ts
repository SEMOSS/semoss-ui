import { makeObservable, observable } from "mobx";
import type { InputTextPixelMessage } from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";

/**
 * Input Message Store
 */
export class InputMessageStore extends AbstractMessageStore {
	readonly type = "INPUT";

	/**
	 * Text associated with the message
	 */
	text: string = "";

	/**
	 * Files associated with the message
	 */
	imageInfos: {
		fileName: string;
		fileLocation: string;
		base64Data?: string;
		fileFormat?: "png";
		mimeType?: string;
		imageType?: "FILE";
	}[];

	constructor(
		room: AbstractMessageStore["room"],
		message: InputTextPixelMessage,
	) {
		super(room, message);

		this.text = message.inputUIPrompt;
		this.imageInfos = message.imageInfos;

		makeObservable(this, {
			text: observable,
			imageInfos: observable,
		});
	}
}
