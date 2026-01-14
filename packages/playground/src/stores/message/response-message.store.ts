import { makeObservable, observable, runInAction } from "mobx";
import {
	MCP_EXECUTION_ASK,
	MCP_EXECUTION_AUTO,
	TOOL_ERROR_PROMPT,
} from "@/constants";
import type {
	InputToolExecPixelMessage,
	McpExecution,
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
	readonly pixelMessageType:
		| ResponseTextPixelMessage["type"]
		| ResponseToolPixelMessage["type"]
		| InputToolExecPixelMessage["type"];

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
			SMSS_MCP_EXECUTION: McpExecution;
			SMSS_PROJECT_NAME: string;
			SMSS_PROJECT_ID: string;
		};

		/**  Name of function with app_id **/
		name: string;

		/**  Name of function in mcp json **/
		original_name: string;

		/** Parameters used in the tool */
		parameters: Record<string, unknown>;

		/** Response for the tool */
		response: string;

		/** If the tool execution was cancelled or errored */
		tool_status?: "success" | "error" | "cancelled";
	}[] = [];

	/**
	 * If this is input tool exec, the tool call id it is executing
	 */
	inputToolExecData: {
		toolCallId: string;
		inputPrompt: string;
		toolStatus?: "success" | "error" | "cancelled";
	} | null = null;

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

	/**
	 * Model information associated with the message
	 */
	model: {
		/** Id of the model */
		id: string;

		/** Name of the model */
		name: string;
	} = {
		id: "",
		name: "",
	};

	constructor(
		room: AbstractMessageStore["room"],
		message:
			| ResponseTextPixelMessage
			| ResponseToolPixelMessage
			| InputToolExecPixelMessage,
	) {
		super(room, message);
		this.pixelMessageType = message.type;

		if (message.type === "RESPONSE_TEXT") {
			this.text = message.content;
		}

		if (message.type === "RESPONSE_TOOL") {
			this.tools = message.tool_responses.map((t) => ({
				id: t.id,
				_meta: {
					SMSS_MCP_EXECUTION: MCP_EXECUTION_ASK,
					// On 12/16/25 we changed from _meta.map to just _meta, so support both
					...(t._meta as { map?: Record<string, unknown> })?.map,
					...t._meta,
				},
				title: t.title,
				name: t.name,
				original_name: t.original_name,
				parameters: t.arguments,
				response: "",
				cancelled: false,
			}));
		}

		if (message.type === "INPUT_TOOL_EXEC") {
			this.inputToolExecData = {
				toolCallId: message.tool_call_id,
				inputPrompt: message.inputPrompt,
				toolStatus: message.tool_status ?? "success", // default to success
			};
		}

		// set the model
		this.model = {
			id: message.modelId,
			name: message.ornaments?.modelName || "AI",
		};

		makeObservable(this, {
			text: observable,
			tools: observable,
			rating: observable,
		});
	}

	/**
	 * Run a new user message and receive a response with streaming
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

		// Create a placeholder response message to show streaming content
		const responseMessage = new ResponseMessageStore(room, {
			messageId: "FAKE_ID",
			type: "RESPONSE_TEXT",
			visible: true,
			content: "",
			modelId: this.model.id,
			paramMap: {
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			},
			ornaments: {
				modelName: this.model.name,
			},
			dateCreated: new Date().toISOString(),
		} as ResponseTextPixelMessage);

		// Add placeholder as child of input to show streaming text
		inputMessage.addChild(responseMessage);

		// wait for the pixel to run with streaming
		await room.runRoomPixelStreaming(
			`AskPlayground(
engine=["${room.modelId}"],
roomId=["${room.roomId}"],
command=["<encode>${inputMessage.text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${inputMessage.mediaInputs.length ? `image=${JSON.stringify(inputMessage.mediaInputs.map((info) => info.fileLocation))},` : "image=[],"}
${this.id ? `parentMessageId=["${this.id}"],` : ""}
paramValues=[${JSON.stringify({
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			})}]
);`,
			(chunk) => {
				runInAction(() => {
					if (chunk.stream_type === "content") {
						responseMessage.text += chunk;
					}
				});
			},
		);

		// update the input's id
		inputMessage.updateId("TODO");
		responseMessage.updateId("TODO");

		// start running tools if there are any
		responseMessage.startToolExecution();
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
			mediaInputs: parentMessage.mediaInputs,
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

		// only run if it is set to auto execute
		if (tool._meta.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO) {
			return;
		}

		try {
			// wait for the pixel to run
			const response = await room.runRoomPixel<[string]>(
				`RunMCPTool(project = [ "${tool._meta.SMSS_PROJECT_ID}" ], function=[ "${tool.name}" ], paramValues=[ ${JSON.stringify(tool.parameters)} ]);`,
			);

			const { output } = response.pixelReturn[0];

			// save the response
			await this.saveToolExecution(tool, output);
		} catch {
			// mark the failure
			await this.saveToolExecution(tool, TOOL_ERROR_PROMPT, "error");
		}
	};

	/**
	 * Save a tool execution response
	 * @param tool - tool to save
	 * @param toolResponse - response of the tool
	 */
	saveToolExecution = async (
		tool: ResponseMessageStore["tools"][number],
		toolResponse: string,
		status: "success" | "error" | "cancelled" = "success",
	): Promise<void> => {
		const room = this.room;

		// save the response
		runInAction(() => {
			tool.response = toolResponse;
			tool.tool_status = status;
		});

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
paramValues=[${JSON.stringify({})}],
mcpToolStatus=${JSON.stringify(status)}
);`,
		);

		const { output } = response.pixelReturn[0];

		// If the output is a string (as opposed to a tool response message), continue tool execution. Otherwise, create the response message
		if (
			typeof output === "string" ||
			typeof output.responseMessage === "string"
		) {
			// Keep executing tools
			await this.continueToolExecution(tool);
		} else {
			// create the response and link to the message
			const responseMessage = createMessageStore(
				room,
				output.responseMessage,
			);
			this.addChild(responseMessage);

			// start running tools if there are any
			(responseMessage as ResponseMessageStore).startToolExecution();
		}
	};

	/**
	 * Mark a tool as used. Should be called when reconstructing from an INPUT_TOOL_EXEC message
	 * @param tool - tool to save
	 * @param inputToolExecData - data from the input tool exec message
	 */
	markToolAsUsed = (
		inputToolExecData: ResponseMessageStore["inputToolExecData"],
	): void => {
		// find the correct tool
		const tool = this.tools.find(
			(t) => t.id === inputToolExecData.toolCallId,
		);
		if (!tool) {
			return;
		}

		// save the response
		runInAction(() => {
			tool.response = inputToolExecData.inputPrompt;
			tool.tool_status = inputToolExecData.toolStatus ?? "success";
		});
	};
}
