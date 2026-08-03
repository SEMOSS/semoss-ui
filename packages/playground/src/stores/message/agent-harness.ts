import { STREAMING_PLACEHOLDER_ID } from "@/constants";
import type { ResponsePixelMessage } from "@/types";
import type { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";
import { applyToolStreamChunk } from "./tool-stream";

export const AGENT_HARNESS_TYPE = "semoss";

interface RunAgentOutput {
	waitTimedOut: boolean;
	status: string;
	input: string;
	inputMessageId: string;
	finalText: string;
	finalOutputMessageId: string;
	modelId: string;
	harnessType: string;
	roomId: string;
	runId: string;
	jobId: string;
	userId: string;
	startedAt: string;
	completedAt: string;
	dateCreated: string;
	artifacts: unknown[];
}

/**
 * Run a user message through the server-side agent harness (RunAgent).
 */
export const runAgentMessage = async (
	message: ResponseMessageStore,
	inputMessage: InputMessageStore,
	existingResponse?: ResponseMessageStore,
) => {
	const room = message.room;
	const modelName =
		room.model.engine_display_name || room.model.engine_name || "";

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
			ornaments: { modelName },
		} as ResponsePixelMessage);

	try {
		if (!existingResponse) {
			message.addChild(inputMessage);
			inputMessage.addChild(responseMessage);
		}

		responseMessage.isThinking = true;

		const text = inputMessage.parts.reduce((acc, part) => {
			if (part.type === "TEXT") return acc + part.text;
			return acc;
		}, "");

		const toolStreamIndexToId: Record<number, string> = {};

		const response = await room.runRoomPixelStreaming<[RunAgentOutput]>(
			`RunAgent(
roomId=["${room.roomId}"],
engine=["${room.model.engine_id}"],
command=["<encode>${text}</encode>"],
harnessType="${AGENT_HARNESS_TYPE}",
wait=true
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

		if (output.waitTimedOut) {
			throw new Error("The agent run timed out before completing.");
		}
		if (output.status !== "COMPLETED") {
			throw new Error(`The agent run did not complete: ${output.status}`);
		}

		inputMessage.id = output.inputMessageId;
		responseMessage.id = output.finalOutputMessageId;

		const hasStreamedText = responseMessage.parts.some(
			(part) => part.type === "TEXT" && part.text,
		);
		if (!hasStreamedText && output.finalText) {
			responseMessage.savePart({
				type: "TEXT",
				text: output.finalText,
				uiText: output.finalText,
			});
		}

		return response;
	} catch (e) {
		message.removeChild(inputMessage);
		throw e;
	} finally {
		responseMessage.isThinking = false;
	}
};
