import { type AskPlaygroundParams, askPlaygroundPixel } from "@semoss/sdk";
import { runMcpTool } from "@semoss/sdk/react";
import { getErrorMessage } from "@semoss/utility/error";
import type { InputPixelMessage, ResponsePixelMessage } from "../../../types";
import { isBrowserToolCall } from "../../tools/chat-tools/chat-tool-kind";
import { MCP_EXECUTION_AUTO } from "../../tools/mcp/mcp-execution";
import { getToolEngineId } from "../../tools/mcp/mcp-utils";
import type { InputMessageStore } from "../store/input-message.store";
import type { CancelCommitOutput } from "../store/message-map";
import type { ResponseMessageStore } from "../store/response-message.store";
import { readInputPayload } from "../store/response-placeholder";
import type { RoomStore } from "../store/room.store";
import type { ToolStore } from "../store/tool.store";
import { applyResponseStreamChunk } from "./response-stream";
import { TURN_CANCELLATION_PROMPT } from "./turn-prompts";
import type { Turn, TurnRunner } from "./turn-runner";

/** How many auto tool calls run at once when the host sets no limit. */
const DEFAULT_TOOL_LIMIT = 5;

/**
 * Runs a chat room's turns: streams `AskPlayground` into the reply, commits a
 * stopped turn by replaying it, and runs the reply's auto tool calls, whose
 * results the response's save controller writes back.
 */
export class ChatTurnRunner implements TurnRunner {
	/** @param room - The room whose turns it runs. */
	constructor(private readonly room: RoomStore) {}

	/**
	 * Stream the turn's `AskPlayground` into its reply, then take the saved
	 * pair and start the reply's tools. A stop commits what streamed instead.
	 *
	 * @param turn - The turn.
	 * @returns Once the stream has finished, or unwound after a stop.
	 */
	async run({ parent, input, response }: Turn): Promise<void> {
		const room = this.room;
		const { text, media } = readInputPayload(input);
		// one params object for the live call and its stop commit, which must
		// replay exactly the same turn
		const params: AskPlaygroundParams = {
			engineId: room.model.engine_id,
			roomId: room.roomId,
			command: text,
			context: room.options?.instructions || "",
			media: media,
			parentMessageId: parent.id,
			// the work folder's tools ride along: the backend merges them with
			// the room's own and the browser runs them
			paramValues: {
				...(room.chatOptions.isTemperatureEditable &&
				room.options.temperature !== undefined
					? { temperature: room.options.temperature }
					: {}),
				...room.chatTools.chatParamValues,
			},
		};
		// a stream's tool delta `index` → its call's id
		const toolStreamIndexToId: Record<number, string> = {};

		await room.runRoomPixelStreaming<
			[
				{
					inputMessage: InputPixelMessage;
					responseMessage: ResponsePixelMessage;
				},
			]
		>(
			askPlaygroundPixel(params),
			{
				onEmit: (chunk) =>
					applyResponseStreamChunk(
						response,
						toolStreamIndexToId,
						chunk,
					),
				onResult: ({ results }) => {
					const { output } = results[0];
					input.sync(output.inputMessage);
					response.sync(output.responseMessage);
					this.continueToolExecution(response);
				},
				// the user stopped the stream: persist what they saw
				onCancel: () =>
					this.recordCancelledTurn(params, input, response),
			},
			// the turn's loading and failure are runTurn's
			{ showLoading: false, setErrorOnFail: false },
		);
	}

	/**
	 * Commit a stopped turn. A cancelled `AskPlayground` leaves nothing saved,
	 * so the same turn is sent again with what the user saw and a hidden note:
	 * the backend skips the model, saves the turn, and adds a hidden
	 * note-and-acknowledgement pair so the model knows next turn that its reply
	 * was cut short. The visible pair takes the result and the hidden pairs are
	 * spliced in, so the room's parent chain matches the backend's history.
	 *
	 * @param params - The live call's params.
	 * @param input - The user's message.
	 * @param response - The reply as it streamed.
	 * @throws When the commit fails; the stream job then shows it on the room,
	 * the user's only sign the stopped turn was not saved.
	 */
	private async recordCancelledTurn(
		params: AskPlaygroundParams,
		input: InputMessageStore,
		response: ResponseMessageStore,
	): Promise<void> {
		const room = this.room;
		try {
			const { pixelReturn } = await room.runRoomPixel<
				[CancelCommitOutput]
			>(
				askPlaygroundPixel(params, {
					responseParts: response.parts,
					hiddenMessage: TURN_CANCELLATION_PROMPT,
				}),
			);
			const { output } = pixelReturn[0];
			input.sync(output.inputMessage);
			response.sync(output.responseMessage);
			room.spliceHiddenMessages(response, output.extraMessages);
		} catch (e) {
			console.error("Failed to record cancelled turn", e);
			throw e;
		}
	}

	/**
	 * Run a response's auto tool calls that have not run, up to the host's
	 * limit on calls running at once. A stop halts the loop.
	 *
	 * @param response - The response that made the calls.
	 */
	continueToolExecution(response: ResponseMessageStore): void {
		const room = this.room;
		if (room.isCancelling) {
			return;
		}
		let running = 0;
		const waiting: ToolStore[] = [];
		for (const part of response.parts) {
			if (part.type !== "TOOL_CALL") {
				continue;
			}
			const tool = room.getTool(part.toolCall.id);
			if (tool?.json._meta?.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO) {
				continue;
			}
			if (tool.status === "INITIAL") {
				waiting.push(tool);
			} else if (tool.status === "LOADING") {
				running++;
			}
		}
		const limit =
			room.chatOptions.toolAutoExecutionLimit || DEFAULT_TOOL_LIMIT;
		for (const tool of waiting.slice(0, Math.max(0, limit - running))) {
			void this.runToolExecution(response, tool);
		}
	}

	/**
	 * Run one auto tool call: a work folder call in the browser, which records
	 * its own result, any other through the room's toolbox.
	 *
	 * @param response - The response that made the call.
	 * @param tool - The call; one that is not auto or already ran is skipped.
	 */
	private async runToolExecution(
		response: ResponseMessageStore,
		tool: ToolStore,
	): Promise<void> {
		if (
			tool.status !== "INITIAL" ||
			tool.json._meta?.SMSS_MCP_EXECUTION !== MCP_EXECUTION_AUTO
		) {
			return;
		}
		if (isBrowserToolCall(tool.json)) {
			await this.room.chatTools.runChatTool(tool);
			return;
		}
		try {
			await this.runMcpToolCall(response, tool);
		} catch {
			// the save controller already marked the call and kept the failure
		}
	}

	/**
	 * Run an MCP tool call against the room's insight and save what it
	 * returned as the call's response. A failed run saves its error instead,
	 * so the model reads why.
	 *
	 * @param response - The response that made the call.
	 * @param tool - A call that has not run yet.
	 * @throws When the response cannot be saved.
	 */
	async runMcpToolCall(
		response: ResponseMessageStore,
		tool: ToolStore,
	): Promise<void> {
		tool.setStatus("LOADING");
		let output: string;
		let isError = false;
		try {
			output = await runMcpTool(
				{
					project: getToolEngineId(tool.json._meta),
					roomId: this.room.roomId,
					name: tool.json.name,
					paramValues: tool.parameters,
				},
				this.room.insightId,
			);
		} catch (e) {
			output = getErrorMessage(e);
			isError = true;
		}
		await response.saveToolExecution(
			tool,
			output,
			isError ? "error" : "success",
			tool.parameters,
		);
	}
}
