import { makeObservable, observable, runInAction } from "mobx";
import type {
	InputToolExecPixelMessage,
	PixelMessage,
	ResponseTextPixelMessage,
	ResponseToolPixelMessage,
} from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import { PlanMessageStore } from "./plan-message.store";
import { createMessageStore } from "./utility";

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

		// wait for the pixel to run
		const response = await room.runRoomPixel<
			[
				{
					inputMessage: PixelMessage;
					responseMessage: PixelMessage;
				},
			]
		>(`AskPlayground(
engine=["${room.modelId}"],
roomId=["${room.roomId}"],
command=["<encode>${inputMessage.text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${inputMessage.files.length ? `image=${JSON.stringify(inputMessage.files.map((file) => file.fileLocation))},` : "image=[],"}
${tools.length ? `mcpToolID=${JSON.stringify(tools)},` : "mcpToolID=[],"}
${this.id ? `parentMessageId=["${this.id}"],` : ""}
paramValues=[${JSON.stringify({
			max_new_tokens: room.options.tokenLength,
			temperature: room.options.temperature,
		})}]
);`);

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

	/**
	 * Record Feedback
	 * @param rating
	 * @param comment
	 */
	recordFeedback = async (rating: boolean, comment = ""): Promise<void> => {
		const room = this.room;

		try {
			// wait for the pixel to run
			await room.runRoomPixel<[boolean]>(
				`SubmitLlmFeedback(messageId = ["${this.id}"], feedbackText=["${comment}"], rating=[${rating}], roomId=["${room.roomId}"]);`,
				false,
			);

			// save the feedback to the message's state
			this.rating = {
				positive: rating,
				comment: comment,
			};
		} finally {
			// noop
		}
	};

	/**
	 * Rewrite a message and generate a new sibling
	 */
	rewriteMessage = async (): Promise<void> => {
		const room = this.room;

		// get the parent message
		const parentMessage = this.parent;
		if (parentMessage instanceof InputMessageStore === false) {
			throw new Error("Can only rewrite response to user messages");
		}

		// get the grand parent message
		const grandParentMessage = parentMessage.parent;
		if (
			grandParentMessage instanceof ResponseMessageStore === false &&
			grandParentMessage instanceof PlanMessageStore === false
		) {
			throw new Error(
				"Can only if the parent is a response, plan, or root message",
			);
		}

		// create a new input message
		const rewrittenMessage = new InputMessageStore(room, {
			messageId: "TEMP",
			type: "INPUT_TEXT",
			visible: true,
			inputUIPrompt: parentMessage.text,
			files: parentMessage.files,
			modelId: room.modelId,
			paramMap: {
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			},
			dateCreated: "",
		});

		grandParentMessage.runMessage(rewrittenMessage);
	};

	/**
	 * Run a tool
	 * @param appId - id of the app
	 * @param toolId - id of the tool
	 * @param toolName - func of the tool to run
	 * @param toolParameters - parameters to pass to the tool
	 */
	runTool = async (
		appId: string,
		toolId: string,
		toolName: string,
		toolParameters: Record<string, unknown>,
	): Promise<void> => {
		const room = this.room;

		// wait for the pixel to run
		const response = await room.runRoomPixel<[string]>(
			`RunMCPTool(project = [ "${appId}" ], function=[ "${toolName}" ], paramValues=[ ${JSON.stringify(toolParameters)} ]);`,
		);

		const { output } = response.pixelReturn[0];

		this.saveTool(toolId, toolName, output, true);
	};

	/**
	 * Save a tool response
	 * @param toolId - id of the tool
	 * @param toolName - func of the tool to run
	 * @param toolResponse - response of the tool
	 * @param toolChoice - allow the model to choose the tool or not
	 */
	saveTool = async (
		toolId: string,
		toolName: string,
		toolResponse: string,
		toolChoice: boolean,
	): Promise<void> => {
		const room = this.room;

		// save the response
		const tool = this.tools.find((tool) => tool.id === toolId);
		if (tool) {
			runInAction(() => {
				tool.response = toolResponse;
			});
		}

		const paramValues: Record<string, unknown> = {};
		if (!toolChoice) {
			paramValues.tool_choice = { type: "none" };
		}

		// wait for the pixel to run
		const response = await room.runRoomPixel<
			[
				{
					responseMessage: PixelMessage | string;
				},
			]
		>(
			`AddPlaygroundToolExecution(
engine=["${room.modelId}"],
roomId = ["${room.roomId}"],
${this.id ? `parentMessageId=["${this.id}"],` : ""}
toolId = ["${toolId}"],
toolName=["${toolName}"],
toolExecutionResponse=["<encode>${toolResponse}</encode>"],
paramValues=[${JSON.stringify(paramValues)}]
);`,
		);

		const { output } = response.pixelReturn[0];

		// don't create a new message if it is a string. More tools need to be executed
		if (typeof output.responseMessage === "string") {
			return;
		}

		// create the response and link to the message
		const responseMessage = createMessageStore(
			room,
			output.responseMessage,
		);
		this.addChild(responseMessage);
	};
}
