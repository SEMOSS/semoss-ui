import type { PixelMessage } from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import type { InputMessageStore } from "./input-message.store";
import type { PlanMessageStore } from "./plan-message.store";
import type { ResponseMessageStore } from "./response-message.store";
import { createMessageStore } from "./utility";

/**
 * Root Message Store
 */
export class RootMessageStore extends AbstractMessageStore {
	readonly type = "ROOT";
	readonly pixelMessageType = null;

	constructor(room: AbstractMessageStore["room"]) {
		super(room, {
			messageId: "root",
			type: "ROOT",
			visible: false,
			dateCreated: new Date().toString(),
		});
	}

	/**
	 * Sync store properties from the pixel message
	 */
	sync = (message: PixelMessage) => {
		// set the id
		this.id = message.messageId;
	};

	/**
	 * Run a new user message and recieve a response
	 * @param parentMessage - parent message to connect to
	 * @param inputMessage - input message to send
	 */
	runMessage = async (
		inputMessage: InputMessageStore,
	): Promise<PlanMessageStore | ResponseMessageStore> => {
		const room = this.room;

		// connect to the parent
		this.addChild(inputMessage);

		// build the context if it is there
		let context = "";
		if (room.options?.instructions) {
			context = room.options?.instructions;
		}

		let pixel = "";
		if (room.mode === "chat") {
			pixel = `AskPlayground(
engine=["${room.model.app_id}"],
roomId=["${room.roomId}"],
command=["<encode>${inputMessage.text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${inputMessage.mediaInputs.length ? `image=${JSON.stringify(inputMessage.mediaInputs.map((info) => info.fileLocation))},` : "image=[],"}
paramValues=[${JSON.stringify({
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			})}]
);`;
		} else if (room.mode === "planning") {
			pixel = `AskCOTRoom(
engine=["${room.model.app_id}"],
roomId=["${room.roomId}"],
command=["<encode>${inputMessage.text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${inputMessage.mediaInputs.length ? `image=${JSON.stringify(inputMessage.mediaInputs.map((info) => info.fileLocation))},` : "image=[],"}
paramValues=[${JSON.stringify({
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			})}]
);`;
		} else {
			throw new Error(`Cannot start with mode: ${room.mode}`);
		}

		// wait for the pixel to run
		const response =
			await room.runRoomPixel<
				[
					{
						inputMessage: PixelMessage;
						responseMessage: PixelMessage;
					},
				]
			>(pixel);

		const { output } = response.pixelReturn[0];

		// sync the message
		inputMessage.sync(output.inputMessage);

		// create the response and link to the input
		const responseMessage = createMessageStore(
			room,
			output.responseMessage,
		) as PlanMessageStore | ResponseMessageStore;
		inputMessage.addChild(responseMessage);

		// start running tools if there are any
		if (responseMessage.type === "RESPONSE") {
			responseMessage.startToolExecution();
		}

		return responseMessage;
	};
}
