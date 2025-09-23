import { makeObservable, observable } from "mobx";
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
		id: string,
		text: string,
		files: {
			fileName: string;
			fileLocation: string;
		}[],
	) {
		super(room, id);

		this.text = text;
		this.files = files;

		makeObservable(this, {
			text: observable,
			files: observable,
		});
	}
}
