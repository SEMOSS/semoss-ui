import { action, makeObservable, observable, runInAction } from "mobx";
import {
	MCP_EXECUTION_ASK,
	MCP_EXECUTION_AUTO,
	TOOL_ERROR_PROMPT,
} from "@/constants";
import type {
	InputMediaPixelMessage,
	InputTextPixelMessage,
	InputToolExecPixelMessage,
	McpExecution,
	PixelMessage,
	ResponseTextPixelMessage,
	ResponseToolPixelMessage,
} from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import { PlanMessageStore } from "./plan-message.store";

interface Tool {
	/** tool execution id */
	id: string;

	/**  title of tool **/
	title: string;

	/** meta data from the tool */
	_meta: {
		SMSS_MCP_EXECUTION: McpExecution;
		SMSS_PROJECT_NAME: string;
		SMSS_PROJECT_ID: string;
		SMSS_MCP_UI?: {
			loadingMessage?: string;
			resourceURI?: string;
		};
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

	/** If the tool is currently executing */
	is_executing: boolean;
}

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
	 *  Track if the message is thinking
	 */
	isThinking: boolean = false;

	/**
	 * Thinking for the tool
	 */
	thinking: string = "";

	/**
	 * Text associated with the message
	 */
	text: string = "";

	/**
	 * Tools associated with the message
	 */
	tools: Tool[] = [];

	/**
	 * If this is input tool exec, the tool call id it is executing
	 */
	inputToolExecData: {
		toolCallId: string;
		inputPrompt: string;
		toolStatus?: "success" | "error" | "cancelled";
	} | null = null;

	/**
	 * Current execution index of the tool, used for auto execution
	 */
	toolAutoExecutionIdx: number = 0;

	/**
	 * Response to an execution
	 */
	toolResponseMessage: ResponseMessageStore | null = null;

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

		makeObservable(this, {
			isThinking: observable,
			thinking: observable,
			text: observable,
			tools: observable,
			rating: observable,
			sync: action,
			runMessage: action,
			recordFeedback: action,
			rewriteMessage: action,
			getTool: action,
			startToolExecution: action,
			continueToolExecution: action,
			hasUnfinishedTools: action,
			saveToolExecution: action,
			markToolAsUsed: action,
		});

		// sync the message (must be after makeObservable so sync action is registered)
		this.sync(message);
	}

	/**
	 * Sync store properties from the pixel message
	 */
	sync = (message: PixelMessage) => {
		// type guard + specifics
		if (message.type === "RESPONSE_TEXT") {
			this.thinking = message.thinking || "";
			this.text = message.content;
		} else if (message.type === "RESPONSE_TOOL") {
			this.thinking = message.thinking || "";
			this.tools = message.tool_responses.map(
				(t): Tool => ({
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
					tool_status: "success",
					is_executing: false,
				}),
			);
		} else if (message.type === "INPUT_TOOL_EXEC") {
			this.inputToolExecData = {
				toolCallId: message.tool_call_id,
				inputPrompt: message.inputPrompt,
				toolStatus: message.tool_status ?? "success", // default to success
			};
		} else {
			throw new Error(
				`Invalid message object passed to ResponseMessageStore.update: ${JSON.stringify(message)}`,
			);
		}

		// cast the types
		message = message as
			| ResponseTextPixelMessage
			| ResponseToolPixelMessage
			| InputToolExecPixelMessage;

		// set the id
		this.id = message.messageId;

		// set the model that was used
		this.model = {
			id: message.modelId,
			name: message.ornaments?.modelName || "AI",
		};
	};

	/**
	 * Run a new user message and receive a response with streaming
	 * @param inputMessage - input message to send
	 */
	runMessage = async (inputMessage: InputMessageStore) => {
		const room = this.room;

		// Create a placeholder response message to show streaming content
		const responseMessage = new ResponseMessageStore(room, {
			messageId: "STREAMING_PLACEHOLDER_ID",
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

		try {
			// connect to the parent
			this.addChild(inputMessage);

			// build the context if it is there
			let context = "";
			if (room.options?.instructions) {
				context = room.options?.instructions;
			}

			// Add placeholder as child of input to show streaming text
			inputMessage.addChild(responseMessage);

			// turn on thinking
			responseMessage.isThinking = true;

			// wait for the pixel to run with streaming
			const response = await room.runRoomPixelStreaming<
				[
					{
						inputMessage:
							| InputTextPixelMessage
							| InputMediaPixelMessage;
						responseMessage:
							| ResponseTextPixelMessage
							| ResponseToolPixelMessage
							| InputToolExecPixelMessage;
					},
				]
			>(
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
							if (chunk.data.content) {
								responseMessage.text += chunk.data.content;
							}
						} else if (chunk.stream_type === "thinking") {
							if (chunk.data.thinking) {
								responseMessage.thinking += chunk.data.thinking;
							}
						} else if (chunk.stream_type === "tool") {
							//noop
						} else {
							console.error(`Unknown stream type`, chunk);
						}
					});
				},
			);

			const { output } = response.results[0];

			// sync withe the results
			inputMessage.sync(output.inputMessage);
			responseMessage.sync(output.responseMessage);

			// TODO: clean up

			// start running tools if there are any
			responseMessage.startToolExecution();

			return response;
		} finally {
			runInAction(() => {
				// turn off thinking
				responseMessage.isThinking = false;
			});
		}
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
			messageId: "REWRITE_PLACEHOLDER_ID",
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
		// reset it
		this.toolAutoExecutionIdx = 0;
		this.toolResponseMessage = null;

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

		if (currentIdx === this.toolAutoExecutionIdx) {
			// we just finished this tool, move to the next
			this.toolAutoExecutionIdx += 1;
			await this.runToolExecution();
		}
	};

	/**
	 * Check if all tools have been completed
	 * @returns if all tools have been completed
	 */
	hasUnfinishedTools = (): boolean => {
		return this.tools.some((tool) => !tool.response);
	};

	/**
	 * Run a tool if possible
	 */
	private runToolExecution = async (): Promise<void> => {
		const room = this.room;

		// skip if the index is out of bounds
		if (
			this.toolAutoExecutionIdx < 0 ||
			this.toolAutoExecutionIdx >= this.tools.length
		) {
			// all tools have run
			room.setHasUnfinishedTools(false);
			return;
		}

		const tool = this.tools[this.toolAutoExecutionIdx];
		if (!tool) {
			return;
		} else if (tool.response) {
			// already has a response, skip
			this.toolAutoExecutionIdx += 1;
			await this.runToolExecution();
			return;
		}

		// only run if it is set to auto execute
		if (tool._meta.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO) {
			return;
		}

		runInAction(() => {
			tool.is_executing = true;
		});

		try {
			// wait for the pixel to run
			const response = await room.runRoomPixel<[string]>(
				`RunMCPTool(project = [ "${tool._meta.SMSS_PROJECT_ID}" ], function=[ "${tool.name}" ], paramValues=[ ${JSON.stringify(tool.parameters)} ]);`,
				false,
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

		if (tool.response) {
			// If this tool already has a response, this must be an outdated call, skip
			return;
		}

		// if there is no responseMessage create it. This will hold it.
		let responseMessage = this.toolResponseMessage;
		if (!responseMessage) {
			this.toolResponseMessage = new ResponseMessageStore(room, {
				messageId: "STREAMING_TOOL_PLACEHOLDER_ID",
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

			// add as a child
			this.addChild(this.toolResponseMessage);

			// save it
			responseMessage = this.toolResponseMessage;
		}

		try {
			// save the response
			runInAction(() => {
				tool.response = toolResponse;
				tool.tool_status = status;
				tool.is_executing = false;
			});

			// turn on thinking
			responseMessage.isThinking = true;

			// wait for the pixel to run
			const response = await room.runRoomPixelStreaming<
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
				(chunk) => {
					runInAction(() => {
						if (chunk.stream_type === "content") {
							if (chunk.data.content) {
								responseMessage.text += chunk.data.content;
							}
						} else if (chunk.stream_type === "thinking") {
							if (chunk.data.thinking) {
								responseMessage.thinking += chunk.data.thinking;
							}
						} else if (chunk.stream_type === "tool") {
							//noop
						} else {
							console.error(`Unknown stream type`, chunk);
						}
					});
				},
			);

			const { output } = response.results[0];

			// If the output is a string (as opposed to a tool response message), continue tool execution. Otherwise, create the response message
			if (
				typeof output === "string" ||
				typeof output.responseMessage === "string"
			) {
				// Keep executing tools
				await this.continueToolExecution(tool);
			} else {
				// create the response and link to the message
				responseMessage.sync(output.responseMessage);

				// start running tools if there are any
				responseMessage.startToolExecution();

				// clear it
				this.toolResponseMessage = null;
			}
		} finally {
			runInAction(() => {
				// turn off thinking
				responseMessage.isThinking = false;
			});
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
