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
				SMSS_MCP_EXECUTION: "auto" | "ask" | "disabled";
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
	 * Current execution index of the tool
	 */
	toolExecutionIdx: number = 0;

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
				_meta: {
					map: {
						// SMSS_MCP_EXECUTION: "auto",
						...t._meta.map,
					},
				},
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
		console.log("running message from response store", inputMessage);

		// connect to the parent
		this.addChild(inputMessage);

		// build the context if it is there
		let context = "";
		if (room.options?.instructions) {
			context = room.options?.instructions;
		}

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
		) as ResponseMessageStore;
		inputMessage.addChild(responseMessage);
		console.log("response message created", responseMessage);

		// start running tools if there are any
		this.startToolExecution();
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
	 * Get a tool
	 * @param toolId - id of the tool
	 * @param toolName - func of the tool to run
	 */
	getTool = (
		toolId: string,
		toolName: string,
	): ResponseMessageStore["tools"][number] | null => {
		const tool = this.tools.find(
			(tool) => tool.id === toolId && tool.name === toolName,
		);

		if (!tool) {
			return null;
		}

		return tool;
	};

	/**
	 * Execution
	 */

	/**
	 * Start executing from the first step
	 */
	startToolExecution = async (): Promise<void> => {
		this.toolExecutionIdx = 0;
		await this.runToolExecution();
	};

	/**
	 * Continue executing the tools from the current tool
	 *
	 * @param current - current tool that was executed
	 */
	continueToolExecution = async (
		current: ResponseMessageStore["tools"][number],
	): Promise<void> => {
		const currentIdx = this.tools.findIndex((t) => t.id === current.id);

		this.toolExecutionIdx = currentIdx + 1;
		await this.runToolExecution();
	};

	/**
	 * Run a tool if possible
	 */
	private runToolExecution = async (): Promise<void> => {
		const room = this.room;

		console.log("running tool execution at index", this.toolExecutionIdx);

		// skip if the index is out of bounds
		if (
			this.toolExecutionIdx < 0 ||
			this.toolExecutionIdx >= this.tools.length
		) {
			return;
		}

		const tool = this.tools[this.toolExecutionIdx];
		if (!tool) {
			return;
		}
		console.log(tool);

		// only run if it is set to auto execute
		if (tool._meta.map.SMSS_MCP_EXECUTION !== "auto") {
			return;
		}
		console.log("auto executing tool", tool.name);

		// wait for the pixel to run
		const response = await room.runRoomPixel<[string]>(
			`RunMCPTool(project = [ "${tool._meta.map.SMSS_PROJECT_ID}" ], function=[ "${tool.name}" ], paramValues=[ ${JSON.stringify(tool.parameters)} ]);`,
		);

		const { output } = response.pixelReturn[0];

		// save the response
		await this.saveToolExecution(tool, output, false);
	};

	/**
	 * Save a tool execution response
	 * @param tool - tool to save
	 * @param toolResponse - response of the tool
	 * @param disableToolChoice - if true, turn off tool choice
	 */
	saveToolExecution = async (
		tool: ResponseMessageStore["tools"][number],
		toolResponse: string,
		disableToolChoice: boolean,
	): Promise<void> => {
		const room = this.room;

		// save the response
		runInAction(() => {
			tool.response = toolResponse;
		});

		const paramValues: Record<string, unknown> = {};

		// turn off tool_choice
		if (disableToolChoice) {
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
toolId = ["${tool.id}"],
toolName=["${tool.name}"],
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

		// keep going
		await this.continueToolExecution(tool);
	};
}
