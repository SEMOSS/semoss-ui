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

	constructor(id: string, text: string) {
		super(id);

		this.text = text;

		makeObservable(this, {
			text: observable,
		});
	}
}
