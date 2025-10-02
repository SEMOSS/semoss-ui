import { makeObservable, observable } from "mobx";
import type {
	InputToolExecPixelMessage,
	ResponseTextPixelMessage,
	ResponseToolPixelMessage,
} from "@/types";
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
		parameters: Record<string, unknown>;

		/** Response for the tool */
		response: string;
	}[] = [];

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
		room: AbstractMessageStore["room"],
		message:
			| ResponseTextPixelMessage
			| ResponseToolPixelMessage
			| InputToolExecPixelMessage,
	) {
		super(room, message);

		if (message.type === "RESPONSE_TEXT") {
			this.text = message.content;
		}

		if (message.type === "RESPONSE_TOOL") {
			this.tools = message.tool_responses.map((t) => ({
				id: t.id,
				_meta: t._meta,
				title: t.title,
				name: t.name,
				parameters: t.arguments,
				response: "",
			}));
		}

		makeObservable(this, {
			text: observable,
			tools: observable,
			rating: observable,
		});
	}
}
