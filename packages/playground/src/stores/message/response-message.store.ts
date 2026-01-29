import { action, makeObservable, observable, runInAction } from "mobx";
import {
	MCP_EXECUTION_ASK,
	MCP_EXECUTION_AUTO,
	TOOL_CANCELLATION_PROMPT,
	TOOL_ERROR_PROMPT,
} from "@/constants";
import { ToolStore } from "@/stores";
import type {
	InputMediaPixelMessage,
	InputTextPixelMessage,
	InputToolExecPixelMessage,
	PixelMessage,
	ResponseTextPixelMessage,
	ResponseToolPixelMessage,
} from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import { PlanMessageStore } from "./plan-message.store";

/**
 * Response Message Store
 */
export class ResponseMessageStore extends AbstractMessageStore {
	readonly type = "RESPONSE";

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
	tools: ToolStore[] = [];

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
	feedback: {
		/** Sentiment */
		rating: boolean;

		/** Comment, unused for now */
		feedbackText: string;
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
		message: ResponseTextPixelMessage | ResponseToolPixelMessage,
	) {
		super(room, message);

		makeObservable(this, {
			isThinking: observable,
			thinking: observable,
			text: observable,
			tools: observable,
			feedback: observable,
			sync: action,
			runMessage: action,
			recordFeedback: action,
			rewriteMessage: action,
			getTool: action,
			startToolExecution: action,
			continueToolExecution: action,
			hasUnfinishedTools: action,
			saveToolExecution: action,
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
				(t) =>
					new ToolStore(this.room, this, {
						id: t.id,
						_meta: {
							SMSS_MCP_EXECUTION: MCP_EXECUTION_ASK,
							// On 12/16/25 we changed from _meta.map to just _meta, so support both
							...(t._meta as { map?: Record<string, unknown> })
								?.map,
							...t._meta,
						},
						title: t.title,
						name: t.name,
						original_name: t.original_name,
						parameters: t.arguments,
					}),
			);
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

		// set tokens
		this.tokens = message.tokens;

		// set the model that was used
		this.model = {
			id: message.modelId,
			name: message.ornaments?.modelName || "AI",
		};

		// set feedback if there
		if (message.type === "RESPONSE_TEXT" && message.feedback) {
			this.feedback = {
				rating: message.feedback.rating,
				feedbackText: message.feedback.feedbackText,
			};
		}
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
			modelId: room.model.app_id,
			paramMap: {
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			},
			ornaments: {
				modelName: room.model.app_name,
			},
			dateCreated: new Date().toISOString(),
			tokens: 0,
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
engine=["${room.model.app_id}"],
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

			// start running tools if there are any
			responseMessage.startToolExecution();

			return response;
		} catch (e) {
			// remove as a child
			this.removeChild(responseMessage);

			throw e;
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
	 * @param feedbackText
	 */
	recordFeedback = async (
		rating: boolean,
		feedbackText = "",
	): Promise<void> => {
		const room = this.room;

		try {
			// wait for the pixel to run
			await room.runRoomPixel<[boolean]>(
				`SubmitLlmFeedback(messageId=${JSON.stringify(this.id)}, feedbackText=${JSON.stringify(feedbackText)}, rating=${JSON.stringify(rating)}, roomId=${JSON.stringify(room.roomId)});`,
				false,
			);

			// save the feedback to the message's state
			this.feedback = {
				rating,
				feedbackText,
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
				"Can only if the parent is a response or plan message",
			);
		}

		// create a new input message
		const rewrittenMessage = new InputMessageStore(room, {
			messageId: "REWRITE_PLACEHOLDER_ID",
			type: "INPUT_TEXT",
			visible: true,
			inputUIPrompt: parentMessage.text,
			mediaInputs: parentMessage.mediaInputs,
			modelId: room.model.app_id,
			paramMap: {
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			},
			dateCreated: "",
			tokens: parentMessage.tokens,
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
			(tool) => tool.id === toolId && tool.json.name === toolName,
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
			return;
		}

		const tool = this.tools[this.toolAutoExecutionIdx];
		if (!tool) {
			return;
		} else if (tool.status === "SUCCESS" || tool.status === "CANCELLED") {
			// already has a response, skip
			this.toolAutoExecutionIdx += 1;
			await this.runToolExecution();
			return;
		} else if (tool.status === "ERROR") {
			return;
		}

		// only run if it is set to auto execute
		if (tool.json._meta.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO) {
			return;
		}

		runInAction(() => {
			tool.status = "LOADING";
		});

		try {
			// wait for the pixel to run
			const response = await room.runRoomPixel<[string]>(
				`RunMCPTool(project = [ "${tool.json._meta.SMSS_PROJECT_ID}" ], function=[ "${tool.json.name}" ], paramValues=[ ${JSON.stringify(tool.json.parameters)} ]);`,
				false,
				false,
			);

			const { output } = response.pixelReturn[0];

			// save the response
			await this.saveToolExecution(tool, output);
		} catch (e) {
			// mark the failure
			await this.saveToolExecution(tool, e.toString(), "error");
		}
	};

	/**
	 * Save a tool execution response
	 * @param tool - tool to save
	 * @param toolResponse - response of the tool
	 * @param toolStatus - status of the tool
	 */
	saveToolExecution = async (
		tool: ResponseMessageStore["tools"][number],
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled" = "success",
	): Promise<void> => {
		const room = this.room;

		// wrap the message
		if (toolStatus === "error") {
			toolResponse = `${TOOL_ERROR_PROMPT}${toolResponse ? `\n\nError Details: ${toolResponse}` : ""}`;
		} else if (toolStatus === "cancelled") {
			toolResponse = `${TOOL_CANCELLATION_PROMPT}${toolResponse ? `\n\nCancellation Details: ${toolResponse}` : ""}`;
		}

		// skip if the tool is already completed
		if (tool.status === "SUCCESS" || tool.status === "CANCELLED") {
			// If this tool already has a response, this must be an outdated call, skip
			return;
		} else if (tool.status === "ERROR") {
			return;
		}

		// save the response
		runInAction(() => {
			tool.response = toolResponse;

			if (toolStatus === "success") {
				tool.status = "SUCCESS";
			} else if (toolStatus === "cancelled") {
				tool.status = "CANCELLED";
			} else if (toolStatus === "error") {
				tool.status = "ERROR";
			}
		});

		// if there is no responseMessage create it. This will hold it.
		let responseMessage = this.toolResponseMessage;
		if (!responseMessage) {
			this.toolResponseMessage = new ResponseMessageStore(room, {
				messageId: "STREAMING_TOOL_PLACEHOLDER_ID",
				type: "RESPONSE_TEXT",
				visible: true,
				content: "",
				modelId: this.room.model.app_id,
				paramMap: {
					max_new_tokens: room.options.tokenLength,
					temperature: room.options.temperature,
				},
				ornaments: {
					modelName: this.room.model.app_name,
				},
				tokens: 0,
				dateCreated: new Date().toISOString(),
			} as ResponseTextPixelMessage);

			// add as a child
			this.addChild(this.toolResponseMessage);

			// save it
			responseMessage = this.toolResponseMessage;
		}

		try {
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
engine=["${room.model.app_id}"],
roomId = ["${room.roomId}"],
${this.id ? `parentMessageId=["${this.id}"],` : ""}
toolId = ["${tool.id}"],
toolName=["${tool.json.name}"],
toolExecutionResponse=["<encode>${toolResponse}</encode>"],
paramValues=[${JSON.stringify({})}],
mcpToolStatus=${JSON.stringify(toolStatus)}
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
		} catch (e) {
			// set error status
			tool.status = "ERROR";

			// remove as a child
			this.removeChild(responseMessage);

			// clear it
			this.toolResponseMessage = null;

			throw e;
		} finally {
			runInAction(() => {
				// turn off thinking
				responseMessage.isThinking = false;
			});
		}
	};
}
