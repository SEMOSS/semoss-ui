import { runInAction } from "mobx";
import { STREAMING_PLACEHOLDER_ID } from "@/constants";
import type { ResponsePixelMessage } from "@/types";
import type { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";
import { applyToolStreamChunk } from "./tool-stream";

/**
 * Agent harness type sent to the backend RunAgent reactor.
 */
export const AGENT_HARNESS_TYPE = "semoss";

/**
 * Final result of the RunAgent reactor (the async job's `getPixelAsyncResult`
 * payload).
 *
 * Unlike AskPlayground — which returns a paired `{ inputMessage, responseMessage }`
 * of full pixel messages — RunAgent runs the full agentic loop server-side and
 * returns a single flat summary. The live token/tool stream arrives over the
 * same job-streaming channel (polled by jobId), while this summary gives us the
 * persisted message ids and terminal status to reconcile against once the run
 * finishes.
 */
interface RunAgentOutput {
	/** Whether the run exceeded the server wait window before finishing. */
	waitTimedOut: boolean;
	/** Terminal run status, e.g. "COMPLETED". */
	status: string;
	/** The user's input text, echoed back. */
	input: string;
	/** Server message id for the persisted input message. */
	inputMessageId: string;
	/** The agent's final assistant text. */
	finalText: string;
	/** Server message id for the persisted final response message. */
	finalOutputMessageId: string;
	/** Engine/model id the agent ran against. */
	modelId: string;
	/** Harness type that produced this run. */
	harnessType: string;
	roomId: string;
	runId: string;
	jobId: string;
	userId: string;
	startedAt: string;
	completedAt: string;
	dateCreated: string;
	/** Files / outputs produced by the run (e.g. generated documents). */
	artifacts: unknown[];
}

/**
 * Run a user message through the server-side agent harness (RunAgent).
 *
 * Mirrors the standard chat flow: it wires an input bubble + a thinking response
 * placeholder, then drives the response through the SAME async streaming pixel
 * endpoint AskPlayground uses (runRoomPixelStreaming → runPixelAsync + jobId
 * polling). Content / thinking / tool chunks stream into the response in real
 * time. RunAgent's final async result is a flat summary, so once the stream
 * completes we use it only to adopt the server's canonical message ids and to
 * fall back to its `finalText` if no text streamed.
 *
 * Kept in its own module because RunAgent's return structure differs from the
 * normal chat reactor and is owned entirely here.
 *
 * @param message - The response message store initiating the turn. Its room is
 *   used and the new messages are wired beneath it.
 * @param inputMessage - The user input message to send to the agent.
 * @param existingResponse - Optional pre-created response placeholder already
 *   wired into the message tree. When provided, skips creating a new
 *   ResponseMessageStore and the addChild setup.
 */
export const runAgentMessage = async (
	message: ResponseMessageStore,
	inputMessage: InputMessageStore,
	existingResponse?: ResponseMessageStore,
) => {
	const room = message.room;

	const modelName =
		room.model.engine_display_name || room.model.engine_name || "";

	// Create a placeholder response message to stream content into
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
				modelName,
			},
		} as ResponsePixelMessage);

	try {
		if (!existingResponse) {
			// connect to the parent
			message.addChild(inputMessage);

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

		// per-stream map from tool delta `index` → wire `id`, used to associate
		// arguments/name deltas with the ToolStore created on the opening chunk
		const toolStreamIndexToId: Record<number, string> = {};

		// run RunAgent through the async streaming endpoint (runPixelAsync +
		// jobId polling), streaming chunks just like AskPlayground does
		await room.runRoomPixelStreaming<[RunAgentOutput]>(
			`RunAgent(
roomId=["${room.roomId}"],
engine=["${room.model.engine_id}"],
command=["<encode>${text}</encode>"],
harnessType="${AGENT_HARNESS_TYPE}",
wait=true
);`,
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

					// surface incomplete runs as errors so the catch removes the
					// optimistic input and the room reports the failure
					if (output.waitTimedOut) {
						throw new Error(
							"The agent run timed out before completing.",
						);
					}
					if (output.status !== "COMPLETED") {
						throw new Error(
							`The agent run did not complete: ${output.status}`,
						);
					}

					runInAction(() => {
						// adopt the server's canonical ids now that the run is persisted
						inputMessage.id = output.inputMessageId;
						responseMessage.id = output.finalOutputMessageId;

						// if nothing streamed as visible text (e.g. only thinking/tools came
						// over the wire), fall back to the summary's final text
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
					});
				},
			},
		);
	} catch (e) {
		// remove message if we failed
		message.removeChild(inputMessage);

		throw e;
	} finally {
		runInAction(() => {
			// turn off thinking
			responseMessage.isThinking = false;
		});
	}
};
