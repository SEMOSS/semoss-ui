import { computed, makeObservable } from "mobx";
import { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import { PlanMessageStore } from "./plan-message.store";
import { ResponseMessageStore } from "./response-message.store";

/**
 * Root Message Store
 */
export class RootMessageStore extends AbstractMessageStore {
	readonly type = "ROOT";

	constructor() {
		super(null, {
			messageId: "root",
			type: "ROOT",
			visible: false,
			dateCreated: new Date().toString(),
		});

		makeObservable(this, {
			history: computed,
		});
	}
	/**
	 * Get the history of the room based on the active children
	 */
	get history(): (
		| InputMessageStore
		| ResponseMessageStore
		| PlanMessageStore
	)[] {
		let current: AbstractMessageStore = this;

		const history = [];
		while (current) {
			if (current.activeChild) {
				// save it
				if (current.activeChild instanceof InputMessageStore) {
					history.push(current.activeChild);
				} else if (
					current.activeChild instanceof ResponseMessageStore
				) {
					history.push(current.activeChild);
				} else if (current.activeChild instanceof PlanMessageStore) {
					history.push(current.activeChild);
				}
			}

			// move forward
			current = current.activeChild;
		}

		return history;
	}
}
