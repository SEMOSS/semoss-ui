import { download } from "@semoss/sdk/react";
import {
	MCP_EXECUTION_AUTO,
	STREAMING_PLACEHOLDER_ID,
	TOOL_CANCELLATION_PROMPT,
	TOOL_ERROR_PROMPT,
	TOOL_OUTPUT_UNREADABLE_PROMPT,
	TOOL_PAUSE_PROMPT,
} from "@/constants";
import type { ToolStore } from "@/stores";
import type { InputPixelMessage, ResponsePixelMessage } from "@/types";
import {
	AbstractMessageStore,
	type BaseMessageState,
	createMessageStore,
	makeBaseMessageState,
} from "./abstract-message.store";
import { runAgentMessage } from "./agent-harness";
import { InputMessageStore } from "./input-message.store";
import { applyToolStreamChunk } from "./tool-stream";

interface ResponseMessageState extends BaseMessageState {
	parts: ResponsePixelMessage["parts"];
	isThinking: boolean;
	feedback: { rating: boolean; feedbackText: string } | null;
	isPaused: boolean;
	conversationCompactedAbove: boolean;
	isCompacting: boolean;
	model: { id: string; name: string };
}

/**
 * Response Message Store
 */
export class ResponseMessageStore extends AbstractMessageStore {
	readonly type = "OUTPUT" as const;

	/** Non-reactive cached reference — no component reads this directly */
	toolResponseMessage: ResponseMessageStore | null = null;

	private _zustand = createMessageStore<ResponseMessageState>({
		...makeBaseMessageState({
			messageId: "",
			visible: false,
			tokens: 0,
			modelId: "",
			modelType: "",
			ornaments: {},
		} as ResponsePixelMessage),
		parts: [],
		isThinking: false,
		feedback: null,
		isPaused: false,
		conversationCompactedAbove: false,
		isCompacting: false,
		model: { id: "", name: "" },
	});

	readonly getState = (): ResponseMessageState => this._zustand.getState();
	readonly subscribe = (
		listener: (
			state: ResponseMessageState,
			prev: ResponseMessageState,
		) => void,
	): (() => void) => this._zustand.subscribe(listener);
	readonly getInitialState = (): ResponseMessageState =>
		this._zustand.getInitialState();

	_setState = (partial: Partial<ResponseMessageState>) => {
		this._zustand.setState(partial as Partial<ResponseMessageState>);
	};

	/** Getters */
	get parts() {
		return this.getState().parts;
	}

	get isThinking() {
		return this.getState().isThinking;
	}

	set isThinking(value: boolean) {
		this._zustand.setState({ isThinking: value });
	}

	get feedback() {
		return this.getState().feedback;
	}

	set feedback(value: { rating: boolean; feedbackText: string } | null,) {
		this._zustand.setState({ feedback: value });
	}

	get isPaused() {
		return this.getState().isPaused;
	}

	set isPaused(value: boolean) {
		this._zustand.setState({ isPaused: value });
	}

	get conversationCompactedAbove() {
		return this.getState().conversationCompactedAbove;
	}

	get isCompacting() {
		return this.getState().isCompacting;
	}

	get model() {
		return this.getState().model;
	}

	constructor(
		room: AbstractMessageStore["room"],
		message: ResponsePixelMessage,
	) {
		super(room, message);

		const baseState = makeBaseMessageState(message);
		this._zustand.setState({
			...baseState,
			parts: message.parts ?? [],
			conversationCompactedAbove: message.pruneToolsAbove ?? false,
			model: {
				id: message.modelId,
				name: message.ornaments?.modelName ?? "AI",
			},
		});

		this.sync(message);
	}

	sync(message: ResponsePixelMessage) {
		super.sync(message);

		this._zustand.setState({
			id: message.messageId,
			parts: message.parts ?? [],
			tokens: message.tokens,
			model: {
				id: message.modelId,
				name: message.ornaments?.modelName ?? "AI",
			},
		});

		if (message.feedback) {
			this._zustand.setState({ feedback: message.feedback });
		}

		for (const part of message.parts) {
			if (part.type === "TOOL_CALL") {
				this.room.syncTool(part.toolCall.id, this, part);
			} else if (part.type === "TOOL_RESULT") {
				this.room.syncTool(part.toolResult.toolCallId, this, part);
			}
		}
	}

	runMessage = async (
		inputMessage: InputMessageStore,
		existingResponse?: ResponseMessageStore,
	) => {
		const room = this.room;

		if (room.mode === "agent") {
			await runAgentMessage(this, inputMessage, existingResponse);
			return;
		}

		const responseMessage =
			existingResponse ??
			new ResponseMessageStore(room, {
				io: "OUTPUT",
				messageId: STREAMING_PLACEHOLDER_ID,
				visible: true,
				platform_generated: true,
				modelId: room.model.engine_id,
				dateCreated: new Date().toISOString(),
				parts: [{ type: "THINKING", thinking: "" }],
				tokens: 0,
				ornaments: {
					modelName:
						room.model.engine_display_name ||
						room.model.engine_name ||
						"",
				},
			} as ResponsePixelMessage);

		try {
			let context = "";
			if (room.options?.instructions) {
				context = room.options.instructions;
			}

			if (!existingResponse) {
				this.addChild(inputMessage);
				inputMessage.addChild(responseMessage);
			}

			responseMessage.isThinking = true;

			const text = inputMessage.parts.reduce((acc, part) => {
				if (part.type === "TEXT") return acc + part.text;
				return acc;
			}, "");

			const media = inputMessage.parts.reduce((acc, part) => {
				if (part.type === "MEDIA") {
					acc.push(part.mediaInfo.fileLocation as string);
				}
				return acc;
			}, [] as string[]);

			const toolStreamIndexToId: Record<number, string> = {};

			const response = await room.runRoomPixelStreaming<
				[
					{
						inputMessage: InputPixelMessage;
						responseMessage: ResponsePixelMessage;
					},
				]
			>(
				`AskPlayground(
engine=["${room.model.engine_id}"],
roomId=["${room.roomId}"],
command=["<encode>${text}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${media.length ? `image=${JSON.stringify(media)},` : "image=[],"}
${this.id ? `parentMessageId=["${this.id}"],` : ""}
paramValues=[{}]
);`,
				(chunk) => {
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
				},
			);

			const { output } = response.results[0];
			inputMessage.sync(output.inputMessage);
			responseMessage.sync(output.responseMessage);
			responseMessage.continueToolExecution();

			return response;
		} catch (e) {
			this.removeChild(inputMessage);
			throw e;
		} finally {
			responseMessage.isThinking = false;
		}
	};

	savePart = async (part: ResponsePixelMessage["parts"][number]) => {
		const parts = this.getState().parts;
		const lastPart = parts[parts.length - 1];

		if (part.type === "TEXT") {
			if (lastPart?.type === "TEXT") {
				this._zustand.setState({
					parts: [
						...parts.slice(0, -1),
						{
							...lastPart,
							text: lastPart.text + part.text,
							uiText: lastPart.uiText + part.uiText,
						},
					],
				});
			} else {
				if (lastPart?.type === "THINKING" && !lastPart.thinking) {
					this._zustand.setState({
						parts: [...parts.slice(0, -1), part],
					});
				} else {
					this._zustand.setState({ parts: [...parts, part] });
				}
			}
		} else if (part.type === "THINKING") {
			if (lastPart?.type === "THINKING") {
				this._zustand.setState({
					parts: [
						...parts.slice(0, -1),
						{
							...lastPart,
							thinking: lastPart.thinking + part.thinking,
						},
					],
				});
			} else {
				this._zustand.setState({ parts: [...parts, part] });
			}
		}
	};

	setConversationCompactedAbove = (compacted: boolean) => {
		this._zustand.setState({ conversationCompactedAbove: compacted });
	};

	setIsCompacting = (compacting: boolean) => {
		this._zustand.setState({ isCompacting: compacting });
	};

	toggleIsPaused = () => {
		const { isPaused, parts } = this.getState();
		if (!isPaused) {
			this._zustand.setState({ isPaused: true });
			for (const part of parts) {
				if (part.type === "TOOL_CALL") {
					const tool = this.room.getTool(part.toolCall.id);
					if (
						tool.status === "LOADING" ||
						tool.status === "INITIAL"
					) {
						this.saveToolExecution(
							tool,
							"",
							"paused",
							tool.parameters,
							false,
						);
					}
				}
			}
		} else {
			this._zustand.setState({ isPaused: false });
		}
	};

	recordFeedback = async (
		rating: boolean | null,
		feedbackText = "",
	): Promise<void> => {
		const room = this.room;
		try {
			await room.runRoomPixel<[boolean]>(
				`SubmitLlmFeedback(messageId=${JSON.stringify(this.id)}, feedbackText=${JSON.stringify(feedbackText)}, rating=${JSON.stringify(rating)}, roomId=${JSON.stringify(room.roomId)});`,
				false,
			);
			this.feedback = rating === null ? null : { rating, feedbackText };
		} finally {
			// noop
		}
	};

	downloadResponse = async (format: "word" | "pdf") => {
		const text = this.getState()
			.parts.filter((part) => part.type === "TEXT")
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

	rewriteMessage = async (): Promise<void> => {
		const room = this.room;
		const parentMessage = this.parent;
		if (!(parentMessage instanceof InputMessageStore)) {
			throw new Error("Can only rewrite response to user messages");
		}
		const grandParentMessage = parentMessage.parent;
		if (!(grandParentMessage instanceof ResponseMessageStore)) {
			throw new Error(
				"Can only rewrite if the parent is a response message",
			);
		}

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

		await room.updateRoomOptions(room.options);
		grandParentMessage.runMessage(rewrittenMessage);
	};

	get hasTools() {
		return this.getState().parts.some((part) => part.type === "TOOL_CALL");
	}

	get hasUnfinishedTools() {
		for (const part of this.getState().parts) {
			if (part.type === "TOOL_CALL") {
				const tool = this.room.getTool(part.toolCall.id);
				if (
					tool &&
					(tool.status === "LOADING" || tool.status === "INITIAL")
				) {
					return true;
				}
			}
		}
		return false;
	}

	continueToolExecution = () => {
		let numRunningTools = 0;
		const toolsToRun: ToolStore[] = [];
		for (const part of this.getState().parts) {
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

		const toolLimit = this.room.theme.toolAutoExecutionLimit || 5;
		const numToolsToRun = toolLimit - numRunningTools;
		if (numToolsToRun > 0) {
			toolsToRun.slice(0, numToolsToRun).forEach((tool) => {
				this.runToolExecution(tool);
			});
		}
	};

	private runToolExecution = async (tool: ToolStore): Promise<void> => {
		if (
			!tool ||
			tool.status !== "INITIAL" ||
			tool.json._meta.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO
		) {
			return;
		}

		if (this.isPaused) {
			await this.saveToolExecution(
				tool,
				"",
				"paused",
				tool.parameters,
				false,
			);
			return;
		}

		tool.status = "LOADING";

		try {
			let output = "";
			let toolError = false;

			try {
				const response = await this.room.runRoomPixel<[unknown]>(
					`RunMCPTool(project = [ "${tool.json._meta.SMSS_ENGINE_ID || tool.json._meta.SMSS_PROJECT_ID}" ], roomId=${JSON.stringify(this.room.roomId)}, function=[ "${tool.json.name}" ], paramValues=[ ${JSON.stringify(tool.parameters)} ]);`,
					false,
					false,
				);

				const rawOutput = response.pixelReturn[0].output;
				output =
					typeof rawOutput === "string"
						? rawOutput
						: JSON.stringify(rawOutput);
			} catch (e) {
				output = (e as Error).message;
				toolError = true;
			}

			await this.saveToolExecution(
				tool,
				output,
				toolError ? "error" : "success",
				tool.parameters,
			);
		} catch {
			// Error handled by saveToolExecution
		}
	};

	saveToolExecution = async (
		tool: ToolStore,
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled" | "paused" = "success",
		executedParameters: Record<string, unknown>,
		errorDuringSaving: boolean = false,
	): Promise<void> => {
		const room = this.room;

		if (toolStatus === "error") {
			toolResponse = `${errorDuringSaving ? TOOL_OUTPUT_UNREADABLE_PROMPT : TOOL_ERROR_PROMPT}${toolResponse ? `\n\nError Details: ${toolResponse}` : ""}`;
		} else if (toolStatus === "cancelled") {
			toolResponse = `${TOOL_CANCELLATION_PROMPT}${toolResponse ? `\n\nCancellation Details: ${toolResponse}` : ""}`;
		} else if (toolStatus === "paused") {
			toolResponse = `${TOOL_PAUSE_PROMPT}${toolResponse ? `\n\nDetails: ${toolResponse}` : ""}`;
		}

		if (
			tool.status === "SUCCESS" ||
			tool.status === "CANCELLED" ||
			tool.status === "PAUSED" ||
			tool.status === "ERROR"
		) {
			return;
		}

		tool.response = toolResponse;
		tool.parameters = executedParameters;
		if (toolStatus === "success") {
			tool.status = "SUCCESS";
		} else if (toolStatus === "cancelled") {
			tool.status = "CANCELLED";
		} else if (toolStatus === "error") {
			tool.status = "ERROR";
		} else if (toolStatus === "paused") {
			tool.status = "PAUSED";
		}

		if (toolStatus === "success" || toolStatus === "cancelled") {
			await room.syncRoomOptions();
		}

		let responseMessage = this.toolResponseMessage;
		if (!responseMessage) {
			this.toolResponseMessage = new ResponseMessageStore(room, {
				io: "OUTPUT",
				messageId: STREAMING_PLACEHOLDER_ID,
				visible: true,
				platform_generated: true,
				modelId: this.room.model.app_id,
				dateCreated: new Date().toISOString(),
				parts: this.hasUnfinishedTools
					? []
					: [{ type: "THINKING", thinking: "" }],
				tokens: 0,
				ornaments: {
					modelName:
						room.model.engine_display_name || room.model.app_name,
				},
			} as ResponsePixelMessage);

			this.addChild(this.toolResponseMessage);
			responseMessage = this.toolResponseMessage;
		}

		type PartialResponse = { responseMessage: string };
		type TotalResponse = {
			responseMessage: ResponsePixelMessage;
			inputMessage: InputPixelMessage;
		};

		try {
			responseMessage.isThinking = true;

			const toolStreamIndexToId: Record<number, string> = {};

			const response = await room.runRoomPixelStreaming<
				[PartialResponse | TotalResponse]
			>(
				`AddPlaygroundToolExecution(
engine=["${room.model.app_id}"],
roomId = ["${room.roomId}"],
${this.id ? `parentMessageId=["${this.id}"],` : ""}
toolId = ["${tool.id}"],
toolName=["${tool.json.name}"],
toolExecutionResponse=["<encode>${toolResponse}</encode>"],
paramValues=[${JSON.stringify({})}],
mcpToolStatus=${JSON.stringify(toolStatus)},
toolParameterValues=[${JSON.stringify(executedParameters ?? {})}]
);`,
				(chunk) => {
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
				},
				true,
				toolStatus !== "success",
			);

			const { output } = response.results[0];

			if (
				typeof output === "string" ||
				typeof output.responseMessage === "string"
			) {
				this.continueToolExecution();
			} else {
				const inputMessage = (output as TotalResponse).inputMessage;
				responseMessage.sync(output.responseMessage);

				this._zustand.setState({ tokens: inputMessage.tokens });

				if (this.isPaused) {
					responseMessage.isPaused = true;
				}

				responseMessage.continueToolExecution();
				this.toolResponseMessage = null;
			}
		} catch (e) {
			if (toolStatus === "success") {
				tool.status = "LOADING";
				await this.saveToolExecution(
					tool,
					`Failed to save tool response: ${e}`,
					"error",
					executedParameters,
					true,
				);
			} else {
				tool.status = "ERROR";
				this.removeChild(responseMessage);
				this.toolResponseMessage = null;
			}
			throw e;
		} finally {
			let hasOtherRunningTools = false;
			for (const part of this.getState().parts) {
				if (part.type === "TOOL_CALL") {
					const t = this.room.getTool(part.toolCall.id);
					if (t && t.status === "LOADING") {
						hasOtherRunningTools = true;
						break;
					}
				}
			}
			if (!hasOtherRunningTools) {
				responseMessage.isThinking = false;
			}
		}
	};
}
