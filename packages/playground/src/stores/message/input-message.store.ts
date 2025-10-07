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
	files: {
		fileName: string;
		fileLocation: string;
	}[];

	constructor(
		room: AbstractMessageStore["room"],
		message: InputTextPixelMessage,
	) {
		super(room, message);

		this.text = message.inputUIPrompt;
		this.files = message.files;

		makeObservable(this, {
			text: observable,
			files: observable,
		});
	}
}
