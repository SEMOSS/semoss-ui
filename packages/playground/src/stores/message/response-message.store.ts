import {
	action,
	computed,
	makeObservable,
	observable,
	runInAction,
} from "mobx";
import { download } from "@semoss/sdk/react";
import {
	MCP_EXECUTION_AUTO,
	STREAMING_PLACEHOLDER_ID,
	TOOL_CANCELLATION_PROMPT,
	TOOL_ERROR_PROMPT,
	TOOL_OUTPUT_UNREADABLE_PROMPT,
	TURN_CANCELLATION_PROMPT,
} from "@/constants";
import type { ToolStore } from "@/stores";
import type { InputPixelMessage, ResponsePixelMessage } from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";
import { runAgentMessage } from "./agent-harness";
import { InputMessageStore } from "./input-message.store";
import { applyToolStreamChunk } from "./tool-stream";
import { createMessageStore } from "./utility";

/**
 * Shape returned by the cancel-commit pixels (AskPlayground /
 * AddPlaygroundToolExecution with `responseParts`): the visible pair plus any
 * hidden (invisible) input/response pairs the backend appended alongside it.
 */
interface CancelCommitOutput {
	inputMessage: InputPixelMessage;
	responseMessage: ResponsePixelMessage;
	extraMessages: {
		inputMessage: InputPixelMessage;
		responseMessage: ResponsePixelMessage;
	}[];
}

/**
 * Response Message Store
 */
export class ResponseMessageStore extends AbstractMessageStore {
	readonly type = "OUTPUT";

	/**
	 * Parts associated with the message
	 */
	parts: ResponsePixelMessage["parts"] = [];

	/**
	 *  Track if the message is thinking
	 */
	isThinking: boolean = false;

	/**
	 * Guards the tool-execution cancel commit: every in-flight tool stream
	 * carries an onCancel, but only the first should persist the stopped turn.
	 * Scoped to this response (each turn is its own store), so it never leaks
	 * across turns.
	 */
	private cancelCommitted: boolean = false;

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

	/**
	 * Whether this conversation is compacted above this message
	 */
	conversationCompactedAbove: boolean = false;

	/**
	 * Whether this message's conversation is currently being compacted
	 */
	isCompacting: boolean = false;

	constructor(
		room: AbstractMessageStore["room"],
		message: ResponsePixelMessage,
	) {
		super(room, message);

		// if prune, compaction happened
		this.conversationCompactedAbove ||= message.pruneToolsAbove;

		makeObservable(this, {
			isThinking: observable,
			parts: observable,
			feedback: observable,
			conversationCompactedAbove: observable,
			isCompacting: observable,
			runMessage: action,
			savePart: action,
			recordFeedback: action,
			rewriteMessage: action,
			hasUnfinishedTools: computed,
			continueToolExecution: action,
			saveToolExecution: action,
			setConversationCompactedAbove: action,
			setIsCompacting: action,
		});

		// sync the message
		this.sync(message);
	}

	/**
	 * Sync store properties from the pixel message
	 */
	sync(message: ResponsePixelMessage) {
		super.sync(message);

		// set the id
		this.id = message.messageId;

		// set the parts
		this.parts = message.parts;

		// sync the tools — server tools (e.g. provider-side web_search) deliver
		// both the call and result in the same response message, so we sync both
		// part types here.
		for (const part of message.parts) {
			if (part.type === "TOOL_CALL") {
				this.room.syncTool(part.toolCall.id, this, part);
			} else if (part.type === "TOOL_RESULT") {
				this.room.syncTool(part.toolResult.toolCallId, this, part);
			}
		}

		// set tokens
		this.tokens = message.tokens;

		// set the model that was used
		this.model = {
			id: message.modelId,
			name: message.ornaments?.modelName || "AI",
		};

		// set feedback if there
		if (message.feedback) {
			this.feedback = {
				rating: message.feedback.rating,
				feedbackText: message.feedback.feedbackText,
			};
		}
	}

	/**
	 * Execute a user message and stream the AI response
	 *
	 * Creates a placeholder response message, sends the input to the AI model,
	 * and streams back the response in real-time. After completion, automatically
	 * initiates tool execution if the response contains tool calls.
	 *
	 * @param inputMessage - The user input message to send to the AI model
	 * @param existingResponse - Optional pre-created response placeholder already wired into the message tree. When provided, skips creating a new ResponseMessageStore and skips the addChild setup calls, streaming directly into the existing placeholder instead.
	 * @returns Promise resolving to the pixel response containing input and output messages
	 */
	runMessage = async (
		inputMessage: InputMessageStore,
		existingResponse?: ResponseMessageStore,
	) => {
		const room = this.room;

		// In agent-harness mode the message is run server-side via RunAgent
		// instead of the streaming AskPlayground flow. See ./agent-harness.
		if (room.mode === "agent") {
			await runAgentMessage(this, inputMessage, existingResponse);
			return;
		}

		// Create a placeholder response message to show streaming content
		const responseMessage =
			existingResponse ??
			new ResponseMessageStore(room, {
				io: "OUTPUT",
				messageId: STREAMING_PLACEHOLDER_ID,
				visible: true,
				platform_generated: true,
				modelId: room.model.engine_id,
				dateCreated: new Date().toISOString(),
				parts: [
					{
						type: "THINKING",
						thinking: "",
					},
				],
				tokens: 0,
				ornaments: {
					modelName:
						room.model.engine_display_name ||
						room.model.engine_name ||
						"",
				},
			} as ResponsePixelMessage);

		try {
			// build the context if it is there
			let context = "";
			if (room.options?.instructions) {
				context = room.options?.instructions;
			}

			if (!existingResponse) {
				// connect to the parent
				this.addChild(inputMessage);

				// Add placeholder as child of input to show streaming text
				inputMessage.addChild(responseMessage);
			}

			// turn on thinking
			responseMessage.isThinking = true;

			// get the text
			const text = inputMessage.parts.reduce((acc, part) => {
				if (part.type === "TEXT") {
					return acc + part.text;
				}

				return acc;
			}, "");

			const media = inputMessage.parts.reduce((acc, part) => {
				if (part.type === "MEDIA") {
					acc.push(part.mediaInfo.fileLocation as string);
				}

				return acc;
			}, [] as string[]);

			// per-stream map from tool delta `index` → wire `id`, used to associate
			// arguments/name deltas with the ToolStore created on the opening chunk
			const toolStreamIndexToId: Record<number, string> = {};

			// Shared param block for the turn. On a stop, recordCancelledTurn
			// must replay the exact same params, so both the live AskPlayground
			// call and the cancel-commit call are built from this single string —
			// the cancel call just adds responseParts + hiddenMessage.
			const turnParams = `engine=["${room.model.engine_id}"],
roomId=["${room.roomId}"],
command=["<encode>${text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${media.length ? `image=${JSON.stringify(media)},` : "image=[],"}
${this.id ? `parentMessageId=["${this.id}"],` : ""}
paramValues=[${JSON.stringify({
				max_new_tokens: room.options.tokenLength,
				temperature: room.options.temperature,
			})}]`;

			// wait for the pixel to run with streaming
			await room.runRoomPixelStreaming<
				[
					{
						inputMessage: InputPixelMessage;
						responseMessage: ResponsePixelMessage;
					},
				]
			>(`AskPlayground(${turnParams});`, {
				onEmit: (chunk) => {
					runInAction(() => {
						if (chunk.stream_type === "content") {
							if (chunk.data.content) {
								responseMessage.savePart({
									type: "TEXT",
									text: chunk.data.content,
									uiText: chunk.data.content,
								});
							}
						} else if (chunk.stream_type === "thinking") {
							if (chunk.data.thinking) {
								responseMessage.savePart({
									type: "THINKING",
									thinking: chunk.data.thinking,
								});
							}
						} else if (chunk.stream_type === "tool") {
							applyToolStreamChunk(
								responseMessage,
								toolStreamIndexToId,
								chunk.data,
							);
						} else {
							console.error(`Unknown stream type`, chunk);
						}
					});
				},
				onResult: ({ results }) => {
					const { output } = results[0];

					// sync with the results
					inputMessage.sync(output.inputMessage);
					responseMessage.sync(output.responseMessage);

					// start running tools if there are any
					responseMessage.continueToolExecution();
				},
				// The user stopped the stream mid-response: persist what they
				// saw, rather than treating it as a result or error.
				onCancel: () =>
					this.recordCancelledTurn(
						turnParams,
						inputMessage,
						responseMessage,
					),
			});
		} catch (e) {
			// remove message if we failed
			this.removeChild(inputMessage);

			throw e;
		} finally {
			runInAction(() => {
				// turn off thinking
				responseMessage.isThinking = false;
			});
		}
	};

	/**
	 * Commit a stopped turn. Cancelling the AskPlayground stream leaves nothing
	 * persisted on the backend, so we replay the turn's exact params through a
	 * second AskPlayground call carrying `responseParts` (what the user actually
	 * saw) and a `hiddenMessage` note. The backend skips the LLM call, persists
	 * the turn, and appends a hidden user-note/assistant-ack pair so the model
	 * sees next turn that its response was cut short. We sync the visible pair
	 * from the result and splice the returned hidden pair(s) into the tree so
	 * the room's parent chain stays aligned with the backend's provider history.
	 */
	private recordCancelledTurn = async (
		turnParams: string,
		inputMessage: InputMessageStore,
		responseMessage: ResponseMessageStore,
	): Promise<void> => {
		const room = this.room;

		try {
			const response = await room.runRoomPixel<[CancelCommitOutput]>(
				`AskPlayground(${turnParams}, responseParts=${JSON.stringify(responseMessage.parts)}, hiddenMessage=["<encode>${TURN_CANCELLATION_PROMPT}</encode>"]);`,
			);

			const { output } = response.pixelReturn[0];

			// sync the visible pair with the committed result
			inputMessage.sync(output.inputMessage);
			responseMessage.sync(output.responseMessage);

			this.spliceHiddenMessages(responseMessage, output.extraMessages);
		} catch (e) {
			console.error("Failed to record cancelled turn", e);
		}
	};

	/**
	 * Commit a stopped tool-execution turn. Every in-flight
	 * AddPlaygroundToolExecution stream carries this onCancel, but only one
	 * should persist — the single-commit guard ensures the first to fire wins
	 * (in practice the sole streaming job, since the backend only streams once
	 * every tool result is recorded). Replays the same params plus responseParts
	 * (what streamed) and a hiddenMessage note; commits an empty response when
	 * the user stopped before anything streamed.
	 */
	private recordCancelledToolExecution = async (
		toolExecParams: string,
		responseMessage: ResponseMessageStore,
	): Promise<void> => {
		if (this.cancelCommitted) {
			return;
		}
		this.cancelCommitted = true;

		const room = this.room;

		try {
			const response = await room.runRoomPixel<[CancelCommitOutput]>(
				`AddPlaygroundToolExecution(${toolExecParams}, responseParts=${JSON.stringify(responseMessage.parts)}, hiddenMessage=["<encode>${TURN_CANCELLATION_PROMPT}</encode>"]);`,
			);

			const { output } = response.pixelReturn[0];

			responseMessage.sync(output.responseMessage);
			// No INPUT_TOOL_EXEC message store exists; stamp the server's
			// cumulative input token count onto this response as a proxy (matches
			// the live tool-exec onResult path).
			runInAction(() => {
				this.tokens = output.inputMessage.tokens;
			});

			this.spliceHiddenMessages(responseMessage, output.extraMessages);

			this.toolResponseMessage = null;
		} catch (e) {
			console.error("Failed to record cancelled tool execution", e);
		}
	};

	/**
	 * Splice the backend's hidden (invisible) input/response pair(s) into the
	 * tree in conversation order, parented under `parent`. They aren't rendered,
	 * but joining the tree keeps `tail` — and thus the next message's parent —
	 * aligned with the backend's provider history.
	 */
	private spliceHiddenMessages = (
		parent: AbstractMessageStore,
		extraMessages: CancelCommitOutput["extraMessages"] | undefined,
	): void => {
		let cursor = parent;
		for (const pair of extraMessages ?? []) {
			const hiddenInput = createMessageStore(
				this.room,
				pair.inputMessage,
			);
			const hiddenResponse = createMessageStore(
				this.room,
				pair.responseMessage,
			);
			cursor.addChild(hiddenInput);
			hiddenInput.addChild(hiddenResponse);
			cursor = hiddenResponse;
		}
	};

	/**
	 * Append a message part during streaming
	 *
	 * Merges consecutive parts of the same type (TEXT or THINKING) or adds
	 * a new part if the type differs from the last part.
	 *
	 * @param part - The message part to append (TEXT or THINKING)
	 */
	savePart = async (part: ResponsePixelMessage["parts"][number]) => {
		const lastPart = this.parts[this.parts.length - 1];

		if (part.type === "TEXT") {
			if (lastPart?.type === "TEXT") {
				lastPart.text += part.text;
				lastPart.uiText += part.uiText;
			} else {
				// delete any existing empty thinking part, as we have new text coming in
				if (lastPart?.type === "THINKING" && !lastPart.thinking) {
					this.parts.pop();
				}
				this.parts.push(part);
			}
		} else if (part.type === "THINKING") {
			if (lastPart?.type === "THINKING") {
				lastPart.thinking += part.thinking;
			} else {
				this.parts.push(part);
			}
		}
	};

	/*
	 * Set whether this conversation is compacted above this message
	 */
	setConversationCompactedAbove = (compacted: boolean) => {
		this.conversationCompactedAbove = compacted;
	};

	/*
	 * Set whether this message's conversation is currently being compacted
	 */
	setIsCompacting = (compacting: boolean) => {
		this.isCompacting = compacting;
	};

	/**
	 * Record Feedback
	 * @param rating
	 * @param feedbackText
	 */
	recordFeedback = async (
		rating: boolean | null,
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
			runInAction(() => {
				this.feedback =
					rating === null
						? null
						: {
								rating,
								feedbackText,
							};
			});
		} finally {
			// noop
		}
	};

	/**
	 * Download the response as a Word or PDF document
	 */
	downloadResponse = async (format: "word" | "pdf") => {
		// Extract text from all TEXT parts
		const text = this.parts
			.filter((part) => part.type === "TEXT")
			.map((part) => part.text)
			.join("");

		if (!text) throw new Error("No content to download");

		let pixelCommand: string;

		if (format === "word") {
			pixelCommand = `ToDocx(markdown=["<encode>${text}</encode>"], fileName="${this.room.roomId}");`;
		} else if (format === "pdf") {
			pixelCommand = `ToPdf(markdown=["<encode>${text}</encode>"], fileName="${this.room.roomId}");`;
		} else {
			throw new Error(`Unsupported format: ${format}`);
		}

		const resp = await this.room.runRoomPixel<[string]>(
			pixelCommand,
			false,
		);

		if (resp?.pixelReturn?.[0]) {
			const { operationType, output } = resp.pixelReturn[0];

			if (operationType?.includes("FILE_DOWNLOAD")) {
				download(this.room.insightId, output);
			} else {
				throw new Error(
					`Failed to generate ${format.toUpperCase()} file`,
				);
			}
		} else {
			throw new Error("No response received from server");
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
		if (grandParentMessage instanceof ResponseMessageStore === false) {
			throw new Error(
				"Can only rewrite if the parent is a response message",
			);
		}

		// create a new input message
		const rewrittenMessage = new InputMessageStore(room, {
			io: "INPUT",
			type: "INPUT_TEXT",
			messageId: "REWRITE_PLACEHOLDER_ID",
			visible: true,
			platform_generated: true,
			modelId: room.model.engine_id,
			modelType: room.model.engine_type,
			dateCreated: new Date().toISOString(),
			parts: parentMessage.parts,
			tokens: parentMessage.tokens,
			ornaments: {
				modelName:
					room.model.engine_display_name ||
					room.model.engine_name ||
					"",
			},
			pruneToolsAbove: false,
		});

		// Update room options with current modelId before running message
		await room.updateRoomOptions(room.options);

		grandParentMessage.runMessage(rewrittenMessage);
	};

	/**
	 * Execution
	 */
	/**
	 * Check if there are any unfinished tools
	 */
	get hasUnfinishedTools() {
		for (const part of this.parts) {
			if (part.type === "TOOL_CALL") {
				const tool = this.room.getTool(part.toolCall.id);
				if (tool) {
					if (
						tool.status === "LOADING" ||
						tool.status === "INITIAL"
					) {
						return true;
					}
				}
			}
		}
		return false;
	}

	/**
	 * Run tools associated with the message
	 */
	continueToolExecution = () => {
		// A stop halts the loop — don't spawn new tool runs once a cancel has
		// been issued and the in-flight streams are still unwinding.
		if (this.room.isCancelling) {
			return;
		}

		// Find the tools that can be run
		let numRunningTools: number = 0;
		const toolsToRun: ToolStore[] = [];
		for (const part of this.parts) {
			if (part.type === "TOOL_CALL") {
				const tool = this.room.getTool(part.toolCall.id);
				if (tool.json._meta.SMSS_MCP_EXECUTION === MCP_EXECUTION_AUTO) {
					if (tool.status === "INITIAL") {
						toolsToRun.push(tool);
					} else if (tool.status === "LOADING") {
						numRunningTools++;
					}
				}
			}
		}

		// Check how many tools can be run. If toolLimit is false-y, then limit to 5
		const toolLimit = this.room.theme.toolAutoExecutionLimit || 5;
		const numToolsToRun = toolLimit - numRunningTools;
		if (numToolsToRun > 0) {
			toolsToRun.slice(0, numToolsToRun).forEach((tool) => {
				this.runToolExecution(tool);
			});
		}
	};

	/**
	 * Run a tool
	 */
	private runToolExecution = async (tool: ToolStore): Promise<void> => {
		if (
			!tool ||
			tool.status !== "INITIAL" ||
			tool.json._meta.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO
		) {
			// skip
			return;
		}

		// mark as loading
		runInAction(() => {
			tool.status = "LOADING";
		});

		try {
			let output = "";
			let toolError = false;

			try {
				// wait for the pixel to run
				const response = await this.room.runRoomPixel<[unknown]>(
					`RunMCPTool(project = [ "${tool.json._meta.SMSS_PROJECT_ID}" ], function=[ "${tool.json.name}" ], paramValues=[ ${JSON.stringify(tool.parameters)} ]);`,
					false,
					false,
				);

				const rawOutput = response.pixelReturn[0].output;
				output =
					typeof rawOutput === "string"
						? rawOutput
						: JSON.stringify(rawOutput);
			} catch (e) {
				// If RunMCPTool fails, we want to save the error message as the tool response, and set the tool status to error
				output = (e as Error).message;
				toolError = true;
			}

			// save the response
			await this.saveToolExecution(
				tool,
				output,
				toolError ? "error" : "success",
				tool.parameters,
			);
		} catch {
			// Error in AddPlaygroundToolExecution handled by saveToolExecution, which will set the tool status to error and save the error response
		}
	};

	/**
	 * Save a tool execution response
	 * @param tool - tool to save
	 * @param toolResponse - response of the tool
	 * @param toolStatus - status of the tool
	 */
	saveToolExecution = async (
		tool: ToolStore,
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled" = "success",
		executedParameters: Record<string, unknown>,
		errorDuringSaving: boolean = false,
	): Promise<void> => {
		const room = this.room;

		// wrap the message
		if (toolStatus === "error") {
			toolResponse = `${errorDuringSaving ? TOOL_OUTPUT_UNREADABLE_PROMPT : TOOL_ERROR_PROMPT}${toolResponse ? `\n\nError Details: ${toolResponse}` : ""}`;
		} else if (toolStatus === "cancelled") {
			toolResponse = `${TOOL_CANCELLATION_PROMPT}${toolResponse ? `\n\nCancellation Details: ${toolResponse}` : ""}`;
		}

		// skip if the tool is already completed
		if (
			tool.status === "SUCCESS" ||
			tool.status === "CANCELLED" ||
			tool.status === "ERROR"
		) {
			// this must be an outdated call, skip
			return;
		}

		// save the response
		runInAction(() => {
			tool.response = toolResponse;
			tool.parameters = executedParameters;
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
				io: "OUTPUT",
				messageId: STREAMING_PLACEHOLDER_ID,
				visible: true,
				platform_generated: true,
				modelId: this.room.model.app_id,
				dateCreated: new Date().toISOString(),
				// Add blank thinking part for loading if this is the last tool
				// We've already updated this tool's status optimistically, so can check
				// hasUnfinishedTools to see if it was the last tool
				parts: this.hasUnfinishedTools
					? []
					: [
							{
								type: "THINKING",
								thinking: "",
							},
						],
				tokens: 0,
				ornaments: {
					modelName:
						room.model.engine_display_name || room.model.app_name,
				},
			} as ResponsePixelMessage);

			// add as a child
			this.addChild(this.toolResponseMessage);

			// save it
			responseMessage = this.toolResponseMessage;
		}

		type PartialResponse = {
			responseMessage: string;
		};
		type TotalResponse = {
			responseMessage: ResponsePixelMessage;
			inputMessage: InputPixelMessage;
		};

		try {
			// turn on thinking
			responseMessage.isThinking = true;

			// per-stream map from tool delta `index` → wire `id` for the post-exec stream
			const toolStreamIndexToId: Record<number, string> = {};

			// Shared param block for this tool-exec turn. On a stop,
			// recordCancelledToolExecution must replay the exact same params, so
			// both the live streaming call and the cancel-commit call are built
			// from this single string — the cancel call just adds responseParts +
			// hiddenMessage.
			const toolExecParams = `engine=["${room.model.engine_id}"],
roomId = ["${room.roomId}"],
${this.id ? `parentMessageId=["${this.id}"],` : ""}
toolId = ["${tool.id}"],
toolName=["${tool.json.name}"],
toolExecutionResponse=["<encode>${toolResponse}</encode>"],
paramValues=[${JSON.stringify({})}],
mcpToolStatus=${JSON.stringify(toolStatus)},
toolParameterValues=[${JSON.stringify(executedParameters ?? {})}]`;

			// wait for the pixel to run
			await room.runRoomPixelStreaming<[PartialResponse | TotalResponse]>(
				`AddPlaygroundToolExecution(${toolExecParams});`,
				{
					onEmit: (chunk) => {
						runInAction(() => {
							if (chunk.stream_type === "content") {
								if (chunk.data.content) {
									responseMessage.savePart({
										type: "TEXT",
										text: chunk.data.content,
										uiText: chunk.data.content,
									});
								}
							} else if (chunk.stream_type === "thinking") {
								if (chunk.data.thinking) {
									responseMessage.savePart({
										type: "THINKING",
										thinking: chunk.data.thinking,
									});
								}
							} else if (chunk.stream_type === "tool") {
								applyToolStreamChunk(
									responseMessage,
									toolStreamIndexToId,
									chunk.data,
								);
							} else {
								console.error(`Unknown stream type`, chunk);
							}
						});
					},
					onResult: ({ results }) => {
						const { output } = results[0];

						// If the output is a string (as opposed to a tool response message), continue tool execution. Otherwise, create the response message
						if (
							typeof output === "string" ||
							typeof output.responseMessage === "string"
						) {
							// Keep executing tools
							this.continueToolExecution();
						} else {
							const inputMessage = (output as TotalResponse)
								.inputMessage;

							// create the response and link to the message
							responseMessage.sync(output.responseMessage);

							// We don't create INPUT_TOOL_EXEC messages, so stamp the server's cumulative
							// input token count onto this response message as a proxy. tokensUsed() in
							// room.store relies on finding a (cumulative, incremental) pair when walking back.
							runInAction(() => {
								this.tokens = inputMessage.tokens;
							});

							// start running tools if there are any
							responseMessage.continueToolExecution();

							// clear it
							this.toolResponseMessage = null;
						}
					},
					// The user stopped mid tool-execution response: persist what
					// streamed, rather than treating it as a result or error.
					onCancel: () =>
						this.recordCancelledToolExecution(
							toolExecParams,
							responseMessage,
						),
				},
				// If the tool execution succeeds but saving it failed, we will try to save it again with an error status, so dont error the room yet
				{ setErrorOnFail: toolStatus !== "success" },
			);
		} catch (e) {
			if (toolStatus === "success") {
				// Attempt to save the error response

				// set status back to loading so that the error response can be saved
				runInAction(() => {
					tool.status = "LOADING";
				});

				await this.saveToolExecution(
					tool,
					`Failed to save tool response: ${e}`,
					"error",
					executedParameters,
					true,
				);
			} else {
				// set error status
				runInAction(() => {
					tool.status = "ERROR";
				});

				// remove as a child
				this.removeChild(responseMessage);

				// clear it
				this.toolResponseMessage = null;
			}

			throw e;
		} finally {
			// turn off thinking unless there are other tools still running
			let hasOtherRunningTools = false;
			for (const part of this.parts) {
				if (part.type === "TOOL_CALL") {
					const tool = this.room.getTool(part.toolCall.id);
					if (tool && tool.status === "LOADING") {
						hasOtherRunningTools = true;
						break;
					}
				}
			}
			if (!hasOtherRunningTools) {
				runInAction(() => {
					responseMessage.isThinking = false;
				});
			}
		}
	};
}
