import { makeObservable, observable } from "mobx";
import { AbstractMessageStore } from "./abstract-message.store";

/**
 * Response Message Store
 */
export class ResponseMessageStore extends AbstractMessageStore {
	readonly type = "RESPONSE";

	/**
	 * Text associated with the message
	 */
	text: string = "";

	/**
	 * Tools associated with the message
	 */
	tools: {
		/** tool execution id */
		id: string;

		/**  title of tool **/
		title: string;

		/** meta data from the tool */
		_meta: {
			map: {
				SMSS_PROJECT_NAME: string;
				SMSS_PROJECT_ID: string;
			};
		};

		/**  Name of function **/
		name: string;

		/** Parameters used in the tool */
		arguments: Record<string, unknown>;
	}[];

	/**
	 * Sources in the response
	 */
	sources: string[] = [];

	/**
	 * Feedback provided by the user; only applicable to messages provided via the LLM
	 */
	rating: {
		/** Sentiment */
		positive: boolean;

		/** Associated comment */
		comment: string;
	} | null = null;

	constructor(
		id: string,
		text: string,
		tools: ResponseMessageStore["tools"],
	) {
		super(id);

		this.text = text;
		this.tools = tools;

		makeObservable(this, {
			text: observable,
			tools: observable,
			sources: observable,
			rating: observable,
		});
	}
}
