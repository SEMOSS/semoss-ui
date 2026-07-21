import { runInAction } from "mobx";
import {
	STREAMING_PLACEHOLDER_ID,
	TOOL_CANCELLATION_PROMPT,
	TOOL_ERROR_PROMPT,
	TOOL_OUTPUT_UNREADABLE_PROMPT,
	TURN_CANCELLATION_PROMPT,
} from "@/constants";
import type { ToolStore } from "@/stores";
import type { InputPixelMessage, ResponsePixelMessage } from "@/types";
import { ResponseMessageStore } from "./response-message.store";
import { applyToolStreamChunk } from "./tool-stream";
import { type CancelCommitOutput, spliceHiddenMessages } from "./utility";

/** A tool result waiting to be written to room history via the save queue. */
interface ToolSaveEntry {
	tool: ToolStore;
	/** Already wrapped with the status guidance prompt. */
	toolResponse: string;
	toolStatus: "success" | "error" | "cancelled";
	executedParameters: Record<string, unknown>;
	resolve: () => void;
	reject: (error: unknown) => void;
}

/** The model reply an AddPlaygroundToolExecution returns once the set is done. */
interface ToolExecModelReply {
	responseMessage: ResponsePixelMessage;
	inputMessage: InputPixelMessage;
}

/**
 * Per-statement output of an AddPlaygroundToolExecution: a bare string or
 * `{ responseMessage: string }` while more tools are pending, or the model
 * reply once the last result completes the set.
 */
type ToolExecOutput = string | { responseMessage: string } | ToolExecModelReply;

/** Minimal per-statement result shape shared by runRoomPixel + streaming. */
interface StatementResult {
	operationType: string[];
	output: ToolExecOutput;
}

/**
 * Serializes and coalesces the tool-result writes for a single response.
 *
 * Tools run concurrently, but their `AddPlaygroundToolExecution` writes go out
 * one batch at a time so the FE controls the order the backend sees them — and
 * therefore always knows which write completes the tool set. That final write
 * is the one that invokes the model: only it streams and is cancellable; the
 * rest are fast, non-streaming persists. A stop takes the queue over and closes
 * the turn out with a single prebuilt (no-LLM) commit.
 *
 * This is really part of the response store's behavior, extracted for size —
 * it holds a reference back to the store rather than a narrow deps interface.
 */
export class ToolSaveController {
	/** Results waiting to be written. */
	private queue: ToolSaveEntry[] = [];
	/** True while a batch is being written; guards the drain loop. */
	private flushing: boolean = false;
	/** Once a stop takes over the queue, no more normal batches are sent. */
	private stopped: boolean = false;
	/** Settles when the in-flight batch (if any) finishes; awaited by stop. */
	private inFlight: Promise<void> = Promise.resolve();
	/** Guards the cancel commit so a stopped turn is only persisted once. */
	private cancelCommitted: boolean = false;

	constructor(private readonly message: ResponseMessageStore) {}

	/**
	 * Queue a tool result to be written to room history.
	 *
	 * The tool's status is marked up front so the UI and the finality check
	 * reflect it immediately. Resolves when the batch carrying this result
	 * settles.
	 */
	save = (
		tool: ToolStore,
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled" = "success",
		executedParameters: Record<string, unknown>,
		errorDuringSaving: boolean = false,
	): Promise<void> => {
		// skip if the tool is already completed — an outdated/duplicate call
		if (
			tool.status === "SUCCESS" ||
			tool.status === "CANCELLED" ||
			tool.status === "ERROR"
		) {
			return Promise.resolve();
		}

		// wrap the raw response with the guidance prompt for its status
		let wrapped = toolResponse;
		if (toolStatus === "error") {
			wrapped = `${errorDuringSaving ? TOOL_OUTPUT_UNREADABLE_PROMPT : TOOL_ERROR_PROMPT}${toolResponse ? `\n\nError Details: ${toolResponse}` : ""}`;
		} else if (toolStatus === "cancelled") {
			wrapped = `${TOOL_CANCELLATION_PROMPT}${toolResponse ? `\n\nCancellation Details: ${toolResponse}` : ""}`;
		}

		runInAction(() => {
			tool.response = wrapped;
			tool.parameters = executedParameters;
			tool.status =
				toolStatus === "success"
					? "SUCCESS"
					: toolStatus === "cancelled"
						? "CANCELLED"
						: "ERROR";
		});

		return new Promise<void>((resolve, reject) => {
			this.queue.push({
				tool,
				toolResponse: wrapped,
				toolStatus,
				executedParameters,
				resolve,
				reject,
			});
			this.flush();
		});
	};

	/**
	 * Hard-stop the tool phase: take over the queue and close the turn out with
	 * no model follow-up. Blocks further normal batches, waits for any in-flight
	 * write, then folds together the results already queued (completed tools we
	 * still want recorded) and the still-pending tools (now marked CANCELLED,
	 * which also trips save()'s completed-status guard so a late RunMCPTool
	 * result is dropped). Those go out as one pixel whose last statement carries
	 * responseParts=[] + hiddenMessage so the reactor takes the prebuilt/no-LLM
	 * branch and notes the stop for the next turn.
	 */
	cancelPending = async (): Promise<void> => {
		const message = this.message;
		const room = message.room;

		// Take over the queue: no more normal batches, and let the in-flight one
		// finish so we don't write concurrently with it.
		this.stopped = true;
		await this.inFlight;

		// Results that were queued but not yet sent still deserve to be recorded.
		const entries: ToolSaveEntry[] = this.queue.splice(
			0,
			this.queue.length,
		);

		// Mark the still-pending tools CANCELLED and add them to the commit.
		runInAction(() => {
			message.parts.forEach((part) => {
				if (part.type !== "TOOL_CALL") {
					return;
				}
				const tool = room.getTool(part.toolCall.id);
				if (
					tool &&
					(tool.status === "INITIAL" || tool.status === "LOADING")
				) {
					tool.response = TOOL_CANCELLATION_PROMPT;
					tool.status = "CANCELLED";
					entries.push({
						tool,
						toolResponse: TOOL_CANCELLATION_PROMPT,
						toolStatus: "cancelled",
						executedParameters: {},
						resolve: () => {},
						reject: () => {},
					});
				}
			});
		});

		if (entries.length === 0) {
			return;
		}

		const pixel = entries
			.map((entry, i) =>
				i === entries.length - 1
					? `AddPlaygroundToolExecution(${this.buildParams(entry)}, responseParts=[], hiddenMessage=["<encode>${TURN_CANCELLATION_PROMPT}</encode>"]);`
					: `AddPlaygroundToolExecution(${this.buildParams(entry)});`,
			)
			.join("\n");

		try {
			const response =
				await room.runRoomPixel<CancelCommitOutput[]>(pixel);
			const { output } =
				response.pixelReturn[response.pixelReturn.length - 1];

			// Represent the committed (empty) follow-up + hidden pair in the tree
			// so tail — and the next message's parent — stays aligned with the
			// backend's provider history.
			const followUp =
				message.toolResponseMessage ??
				new ResponseMessageStore(room, {
					io: "OUTPUT",
					messageId: STREAMING_PLACEHOLDER_ID,
					visible: true,
					platform_generated: true,
					modelId: room.model.engine_id,
					dateCreated: new Date().toISOString(),
					parts: [],
					tokens: 0,
					ornaments: {
						modelName:
							room.model.engine_display_name ||
							room.model.app_name,
					},
				} as ResponsePixelMessage);
			if (!message.toolResponseMessage) {
				message.addChild(followUp);
			}
			followUp.sync(output.responseMessage);
			runInAction(() => {
				followUp.isThinking = false;
			});
			spliceHiddenMessages(followUp, output.extraMessages);
			message.toolResponseMessage = null;

			entries.forEach((entry) => {
				entry.resolve();
			});
		} catch (e) {
			console.error("Failed to cancel pending tools", e);
			entries.forEach((entry) => {
				entry.reject(e);
			});
		}
	};

	/**
	 * Drain the queue one batch at a time, coalescing everything queued since
	 * the last write started. The batch that leaves no unfinished tools is the
	 * final one — it invokes the model and streams the reply; earlier batches
	 * only persist results. Re-runs itself when a batch settles so results that
	 * arrived mid-write get sent next.
	 */
	private flush = (): void => {
		if (this.flushing || this.stopped || this.queue.length === 0) {
			return;
		}
		this.flushing = true;

		const batch = this.queue.splice(0, this.queue.length);
		// Writes are serialized, so if nothing is unfinished after this batch it
		// is the one that completes the set — the model-invoking write.
		const isFinal = !this.message.hasUnfinishedTools;

		// Assigned synchronously so cancelPending can await the in-flight batch.
		// sendBatch reconciles each statement's outcome itself; a throw here is a
		// whole-call failure (network / job error) with no per-statement detail,
		// so fall back to the coarse re-record.
		this.inFlight = (async () => {
			try {
				await this.sendBatch(batch, isFinal);
			} catch (error) {
				batch.forEach((entry) => {
					this.retryEntryAsError(entry, error);
				});
			} finally {
				this.flushing = false;
				this.flush();
			}
		})();
	};

	/**
	 * Send one batch as a single pixel. A non-final batch is a plain
	 * (non-streaming) write. The final batch's last statement completes the set
	 * and invokes the model, whose reply streams into the response placeholder
	 * and is the only write that carries an onCancel. Both paths read the
	 * per-statement results (throwOnError: false) and reconcile them, so a
	 * mid-batch commit failure retries only that tool.
	 */
	private sendBatch = async (
		batch: ToolSaveEntry[],
		isFinal: boolean,
	): Promise<void> => {
		const message = this.message;
		const room = message.room;
		const pixel = batch
			.map(
				(entry) =>
					`AddPlaygroundToolExecution(${this.buildParams(entry)});`,
			)
			.join("\n");

		if (!isFinal) {
			const response = await room.runRoomPixel<ToolExecOutput[]>(
				pixel,
				false,
				false,
				false,
			);
			this.reconcile(batch, response.pixelReturn);
			// keep RunMCPTool concurrency saturated for any still-queued auto tools
			message.continueToolExecution();
			return;
		}

		// Final batch — create the placeholder the model reply streams into.
		const responseMessage =
			message.toolResponseMessage ??
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
						room.model.engine_display_name || room.model.app_name,
				},
			} as ResponsePixelMessage);
		if (!message.toolResponseMessage) {
			message.toolResponseMessage = responseMessage;
			message.addChild(responseMessage);
		}
		runInAction(() => {
			responseMessage.isThinking = true;
		});

		// The finalizing (model-invoking) result is the last statement, and the
		// only one the backend leaves uncommitted when its stream is aborted; its
		// params drive the cancel-commit replay if the reply is stopped.
		const finalizerParams = this.buildParams(batch[batch.length - 1]);
		const toolStreamIndexToId: Record<number, string> = {};

		try {
			await room.runRoomPixelStreaming<ToolExecOutput[]>(
				pixel,
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
						const modelReply = this.reconcile(batch, results);
						if (modelReply) {
							responseMessage.sync(modelReply.responseMessage);
							// No INPUT_TOOL_EXEC store exists; stamp the server's
							// cumulative input token count as a proxy so tokensUsed()
							// finds a (cumulative, incremental) pair walking back.
							runInAction(() => {
								message.tokens = modelReply.inputMessage.tokens;
							});
							responseMessage.continueToolExecution();
							message.toolResponseMessage = null;
						}
						// The else case — a commit in this batch failed, so the
						// set never completed and no reply streamed — needs no
						// action: reconcile already re-queued the failed writes
						// via retryEntryAsError, and leaving toolResponseMessage
						// set lets the retried final batch reuse the placeholder.
					},
					// The user stopped the model reply mid-stream: persist what
					// streamed rather than treating it as a result or error.
					onCancel: () =>
						this.recordCancelledToolExecution(
							finalizerParams,
							responseMessage,
						),
				},
				{ setErrorOnFail: false, throwOnError: false },
			);
		} finally {
			// turn off thinking unless the reply spawned tools that are running
			const hasRunningTools = message.parts.some(
				(part) =>
					part.type === "TOOL_CALL" &&
					room.getTool(part.toolCall.id)?.status === "LOADING",
			);
			if (!hasRunningTools) {
				runInAction(() => {
					responseMessage.isThinking = false;
				});
			}
		}
	};

	/**
	 * Reconcile a settled batch against its per-statement results. A statement
	 * whose operationType contains "ERROR" failed to commit — retry that tool
	 * (see retryEntryAsError); successful ones resolve. Returns the model reply
	 * if the batch actually finalized (a committed statement whose output is the
	 * reply rather than a "more pending" string), otherwise null.
	 */
	private reconcile = (
		batch: ToolSaveEntry[],
		statements: readonly StatementResult[],
	): ToolExecModelReply | null => {
		let modelReply: ToolExecModelReply | null = null;
		batch.forEach((entry, i) => {
			const statement = statements[i];
			if (!statement || statement.operationType.includes("ERROR")) {
				this.retryEntryAsError(
					entry,
					statement ? String(statement.output) : "no result returned",
				);
				return;
			}
			entry.resolve();
			// The finalizing write's output is the model reply (has inputMessage);
			// "more pending" outputs are a string or { responseMessage: string }.
			const { output } = statement;
			if (typeof output === "object" && "inputMessage" in output) {
				modelReply = output;
			}
		});
		return modelReply;
	};

	/**
	 * Re-record a tool whose write failed as an error, so its tool call still
	 * gets answered (an unanswered call corrupts the next turn's provider
	 * history). A result that was already an error/cancelled attempt is given up
	 * on — which also stops a persistently-failing write from looping.
	 */
	private retryEntryAsError = (
		entry: ToolSaveEntry,
		detail: unknown,
	): void => {
		if (entry.toolStatus !== "success") {
			runInAction(() => {
				entry.tool.status = "ERROR";
			});
			entry.reject(detail);
			return;
		}
		// clear the terminal status so the re-save isn't skipped
		runInAction(() => {
			entry.tool.status = "LOADING";
		});
		(async () => {
			try {
				await this.save(
					entry.tool,
					`Failed to save tool response: ${detail}`,
					"error",
					entry.executedParameters,
					true,
				);
				entry.resolve();
			} catch (e) {
				entry.reject(e);
			}
		})();
	};

	/**
	 * Commit a stopped model reply. The backend commits every tool result in the
	 * final batch except the finalizer's, whose statement was aborted mid-stream,
	 * so this replays only that write plus responseParts (what streamed) and a
	 * hiddenMessage note; commits an empty response when the user stopped before
	 * anything streamed. The single-commit guard protects against duplicate stop
	 * delivery.
	 */
	private recordCancelledToolExecution = async (
		toolExecParams: string,
		responseMessage: ResponseMessageStore,
	): Promise<void> => {
		if (this.cancelCommitted) {
			return;
		}
		this.cancelCommitted = true;

		const message = this.message;
		const room = message.room;

		try {
			const response = await room.runRoomPixel<[CancelCommitOutput]>(
				`AddPlaygroundToolExecution(${toolExecParams}, responseParts=${JSON.stringify(responseMessage.parts)}, hiddenMessage=["<encode>${TURN_CANCELLATION_PROMPT}</encode>"]);`,
			);

			const { output } = response.pixelReturn[0];

			responseMessage.sync(output.responseMessage);
			runInAction(() => {
				message.tokens = output.inputMessage.tokens;
			});

			spliceHiddenMessages(responseMessage, output.extraMessages);

			message.toolResponseMessage = null;
		} catch (e) {
			console.error("Failed to record cancelled tool execution", e);
		}
	};

	/** Inner AddPlaygroundToolExecution params (no wrapper) for a save entry. */
	private buildParams = (entry: ToolSaveEntry): string =>
		`engine=["${this.message.room.model.engine_id}"],
roomId=["${this.message.room.roomId}"],
${this.message.id ? `parentMessageId=["${this.message.id}"],` : ""}
toolId=["${entry.tool.id}"],
toolName=["${entry.tool.json.name}"],
toolExecutionResponse=["<encode>${entry.toolResponse}</encode>"],
paramValues=[${JSON.stringify({})}],
mcpToolStatus=${JSON.stringify(entry.toolStatus)},
toolParameterValues=[${JSON.stringify(entry.executedParameters ?? {})}]`;
}
