import { action, makeObservable, observable, runInAction } from "mobx";
import type { InputToolExecPixelMessage, PixelMessage } from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";

/**
 * Response Message Store
 */
export class ToolExecutionMessageStore extends AbstractMessageStore {
	readonly type = "TOOL_EXECUTION";

	/**
	 * Id of the tool call
	 */
	callId: string = "";

	/**
	 * Status for the tool
	 */
	status: "INITIAL" | "LOADING" | "CANCELLED" | "SUCCESS" | "ERROR" =
		"INITIAL";

	/**
	 * Response for the tool
	 */
	response: string = "";

	/**
	 * Parameters used by the tool
	 */
	executedParameters: Record<string, unknown> = {};

	constructor(
		room: AbstractMessageStore["room"],
		message: InputToolExecPixelMessage,
	) {
		super(room, message);

		makeObservable(this, {
			callId: observable,
			status: observable,
			response: observable,
			sync: action,
		});

		// sync the message (must be after makeObservable so sync action is registered)
		this.sync(message);
	}

	/**
	 * Sync store properties from the pixel message
	 */
	sync = (message: PixelMessage) => {
		if (message.type === "INPUT_TOOL_EXEC") {
			const m = message;

			// set the call id
			this.callId = m.tool_call_id;

			// save the response
			runInAction(() => {
				this.response = m.inputPrompt;

				if (m.tool_status === "success") {
					this.status = "SUCCESS";
				} else if (m.tool_status === "cancelled") {
					this.status = "CANCELLED";
				} else if (m.tool_status === "error") {
					this.status = "ERROR";
				}

				this.executedParameters = m.tool_parameter_values ?? {};
			});
		} else {
			throw new Error(
				`Invalid message object passed to ToolExecutionMessageStore.update: ${JSON.stringify(message)}`,
			);
		}

		// cast the types
		message = message as InputToolExecPixelMessage;

		// set the id
		this.id = message.messageId;

		// set tokens
		this.tokens = message.tokens;
	};
}
