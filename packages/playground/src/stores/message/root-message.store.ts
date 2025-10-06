import { computed, makeObservable } from "mobx";
import type { PixelMessage } from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import { PlanMessageStore } from "./plan-message.store";
import { ResponseMessageStore } from "./response-message.store";
import { createMessageStore } from "./utility";

/**
 * Root Message Store
 */
export class RootMessageStore extends AbstractMessageStore {
	readonly type = "ROOT";

	constructor(room: AbstractMessageStore["room"]) {
		super(room, {
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

	/**
	 * Run a new user message and recieve a response
	 * @param parentMessage - parent message to connect to
	 * @param inputMessage - input message to send
	 */
	runMessage = async (inputMessage: InputMessageStore): Promise<void> => {
		const room = this.room;

		// connect to the parent
		this.addChild(inputMessage);

		// build the context if it is there
		let context = "";
		if (room.options?.instructions) {
			context = room.options?.instructions;
		}

		// get a list of tool ids
		const tools: string[] = room.options.tools.map((t) => t.id, []);

		let pixel = "";
		if (room.mode === "chat") {
			pixel = `AskPlayground(
engine=["${room.modelId}"],
roomId=["${room.roomId}"],
command=["<encode>${inputMessage.text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${inputMessage.files.length ? `images=${JSON.stringify(inputMessage.files.map((file) => file.fileLocation))},` : "images=[],"}
${tools.length ? `mcpToolID=${JSON.stringify(tools)},` : "mcpToolID=[],"}
paramValues=[${JSON.stringify({
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			})}]
);`;
		} else if (room.mode === "planning") {
			pixel = `AskCOTRoom(
engine=["${room.modelId}"],
roomId=["${room.roomId}"],
command=["<encode>${inputMessage.text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${inputMessage.files.length ? `images=${JSON.stringify(inputMessage.files.map((file) => file.fileLocation))},` : "images=[],"}
${tools.length ? `mcpToolID=${JSON.stringify(tools)},` : "mcpToolID=[],"}
paramValues=[${JSON.stringify({
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			})}]
);`;
		} else {
			throw new Error(`Unknown mode: ${room.mode}`);
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

		// update the input's id
		inputMessage.updateId(output.inputMessage.messageId);

		// create the response and link to the input
		const responseMessage = createMessageStore(
			room,
			output.responseMessage,
		);
		inputMessage.addChild(responseMessage);
	};
}
