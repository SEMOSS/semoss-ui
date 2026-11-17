import {
	type AddPlaygroundToolExecutionParams,
	addPlaygroundToolExecutionPixel,
} from "@semoss/sdk";
import { toError } from "@semoss/utility/error";
import type {
	InputPixelMessage,
	ResponsePixelMessage,
	ToolOutcome,
} from "../../../types";
import {
	TOOL_CANCELLATION_PROMPT,
	TOOL_ERROR_PROMPT,
	TOOL_INTERRUPTED_PROMPT,
	TOOL_OUTPUT_UNREADABLE_PROMPT,
	TURN_CANCELLATION_PROMPT,
} from "../../tools/mcp/mcp-constants";
import type { CancelCommitOutput } from "../store/message-map";
import type { ResponseMessageStore } from "../store/response-message.store";
import { createResponsePlaceholder } from "../store/response-placeholder";
import type { ToolStore } from "../store/tool.store";
import { isToolSettled, toToolStatus } from "../store/tool-status";
import { applyResponseStreamChunk } from "./response-stream";

/** A tool result waiting to be written to room history via the save queue. */
interface ToolSaveEntry {
	/** The call the result is for. */
	tool: ToolStore;
	/** Already wrapped with the status guidance prompt. */
	toolResponse: string;
	/** How the call ended. */
	toolStatus: ToolOutcome;
	/** The arguments it ran with. */
	executedParameters: Record<string, unknown>;
	/** Settles the caller's `save` once the batch carrying it is written. */
	resolve: () => void;
	/** Fails the caller's `save` when that batch fails. */
	reject: (error: unknown) => void;
}

/** The model reply an AddPlaygroundToolExecution returns once the set is done. */
interface ToolExecModelReply {
	/** The model's reply to the set's results. */
	responseMessage: ResponsePixelMessage;
	/** The input message that carries the results. */
	inputMessage: InputPixelMessage;
}

/**
 * Per-statement output of an AddPlaygroundToolExecution: a bare string or
 * `{ responseMessage: string }` while more tools are pending, or the model
 * reply once the last result completes the set.
 */
type ToolExecOutput = string | { responseMessage: string } | ToolExecModelReply;

/**
 * Where the save queue stands: idle, writing one batch, or stopped, once a
 * stop took the queue over (`cancelPending`) and nothing more is sent.
 */
type ToolSavePhase =
	| { readonly status: "IDLE" }
	| {
			readonly status: "WRITING";
			/** Settles once the batch has been written and reconciled. */
			readonly batch: Promise<void>;
	  }
	| { readonly status: "STOPPED" };

/** The queue's phase when nothing is being written. */
const IDLE: ToolSavePhase = { status: "IDLE" };

/** Minimal per-statement result shape shared by runRoomPixel + streaming. */
interface StatementResult {
	/** The statement's operation types, such as `ERROR`. */
	operationType: string[];
	/** What the statement returned. */
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
	/** Whether a batch is being written, or the queue has stopped. */
	private phase: ToolSavePhase = IDLE;
	/**
	 * The model's reply to the results, while it streams: made by the final
	 * batch, reused by a retried one and by a stop, and cleared once the reply
	 * (or the stop) is committed, or given up on.
	 */
	private pendingReply: ResponseMessageStore | null = null;

	/** @param message - The response whose tool results this writes. */
	constructor(private readonly message: ResponseMessageStore) {}

	/** The model's reply to the results while it streams, or null. */
	get toolResponseMessage(): ResponseMessageStore | null {
		return this.pendingReply;
	}

	/**
	 * Queue a tool result to be written to room history.
	 *
	 * The tool's status is marked up front so the UI and the finality check
	 * reflect it immediately. Resolves when the batch carrying this result
	 * settles.
	 *
	 * @param tool - The call.
	 * @param toolResponse - What it returned, or its error.
	 * @param toolStatus - How it ended.
	 * @param executedParameters - The arguments it ran with.
	 * @param errorDuringSaving - Whether the call returned but its output could
	 * not be read, so the model is told that rather than that the call failed.
	 * @returns Settles with the batch that carries the result.
	 */
	save = (
		tool: ToolStore,
		toolResponse: string,
		toolStatus: ToolOutcome = "success",
		executedParameters: Record<string, unknown>,
		errorDuringSaving: boolean = false,
	): Promise<void> => {
		// skip if the tool is already completed — an outdated/duplicate call
		if (isToolSettled(tool.status)) {
			return Promise.resolve();
		}

		// wrap the raw response with the guidance prompt for its status
		let wrapped = toolResponse;
		if (toolStatus === "error") {
			wrapped = `${errorDuringSaving ? TOOL_OUTPUT_UNREADABLE_PROMPT : TOOL_ERROR_PROMPT}${toolResponse ? `\n\nError Details: ${toolResponse}` : ""}`;
		} else if (toolStatus === "cancelled") {
			wrapped = `${TOOL_CANCELLATION_PROMPT}${toolResponse ? `\n\nCancellation Details: ${toolResponse}` : ""}`;
		}

		tool.settle({
			status: toToolStatus(toolStatus),
			response: wrapped,
			parameters: executedParameters,
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
		// no more normal batches, and let the one in flight finish so we don't
		// write concurrently with it
		const writing =
			this.phase.status === "WRITING" ? this.phase.batch : undefined;
		this.phase = { status: "STOPPED" };
		await writing;

		// results that were queued but not yet sent still deserve recording
		const entries = [
			...this.queue.splice(0, this.queue.length),
			...this.cancelUnfinishedTools(),
		];
		if (entries.length > 0) {
			await this.commitStop(entries);
		}
	};

	/**
	 * Mark the response's unfinished calls CANCELLED, to be committed as
	 * interrupted.
	 *
	 * @returns Their entries; nobody waits on them.
	 */
	private cancelUnfinishedTools = (): ToolSaveEntry[] => {
		const room = this.message.room;
		const entries: ToolSaveEntry[] = [];
		for (const part of this.message.parts) {
			if (part.type !== "TOOL_CALL") {
				continue;
			}
			const tool = room.getTool(part.toolCall.id);
			if (!tool || isToolSettled(tool.status)) {
				continue;
			}
			tool.settle({
				status: "CANCELLED",
				response: TOOL_INTERRUPTED_PROMPT,
			});
			entries.push({
				tool,
				toolResponse: TOOL_INTERRUPTED_PROMPT,
				toolStatus: "cancelled",
				executedParameters: {},
				resolve: () => {},
				reject: () => {},
			});
		}
		return entries;
	};

	/**
	 * Commit a stopped tool phase in one pixel, its last statement saving an
	 * empty reply and the hidden note, and keep the tree where the backend's
	 * history ends.
	 *
	 * @param entries - The results to commit, in order.
	 */
	private commitStop = async (entries: ToolSaveEntry[]): Promise<void> => {
		const message = this.message;
		const room = message.room;
		const pixel = entries
			.map((entry, i) =>
				addPlaygroundToolExecutionPixel(
					this.toolExecutionParams(entry),
					i === entries.length - 1
						? {
								responseParts: [],
								hiddenMessage: TURN_CANCELLATION_PROMPT,
							}
						: undefined,
				),
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
				this.pendingReply ?? createResponsePlaceholder(room);
			if (!this.pendingReply) {
				message.addChild(followUp);
			}
			followUp.sync(output.responseMessage);
			followUp.setIsThinking(false);
			room.spliceHiddenMessages(followUp, output.extraMessages);
			this.pendingReply = null;

			for (const entry of entries) {
				entry.resolve();
			}
		} catch (e) {
			console.error("Failed to cancel pending tools", e);
			room.setError(toError(e));
			for (const entry of entries) {
				entry.reject(e);
			}
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
		if (this.phase.status !== "IDLE" || this.queue.length === 0) {
			return;
		}
		const batch = this.queue.splice(0, this.queue.length);
		// Writes are serialized, so if nothing is unfinished after this batch it
		// is the one that completes the set — the model-invoking write.
		const isFinal = !this.message.hasUnfinishedTools;
		// set at once, so cancelPending can wait for the batch in flight
		this.phase = {
			status: "WRITING",
			batch: this.writeBatch(batch, isFinal),
		};
	};

	/**
	 * Write one batch, then the next. sendBatch reconciles each statement's
	 * outcome itself; a throw is a whole-call failure (network / job error)
	 * with no per-statement detail, so every result is re-recorded. A reply
	 * that is left with nothing more to write, because its results were given
	 * up on, leaves the tree; a stopped one is the stop's to commit. The final
	 * batch, once nothing more is re-sent, refreshes the room's options.
	 *
	 * @param batch - The results to write, in order.
	 * @param isFinal - Whether the batch completes the tool set.
	 */
	private writeBatch = async (
		batch: ToolSaveEntry[],
		isFinal: boolean,
	): Promise<void> => {
		let wasStopped = false;
		try {
			wasStopped = await this.sendBatch(batch, isFinal);
		} catch (error) {
			for (const entry of batch) {
				this.retryEntryAsError(entry, error);
			}
		} finally {
			if (this.phase.status === "WRITING") {
				this.phase = IDLE;
			}
			this.flush();
			// idle with a reply still waiting: no write will fill it
			if (
				!wasStopped &&
				this.phase.status === "IDLE" &&
				this.pendingReply
			) {
				this.message.removeChild(this.pendingReply);
				this.pendingReply = null;
			}
			// the final batch, with nothing re-sent, ends the tool phase
			if (isFinal && this.phase.status === "IDLE") {
				this.refreshRoomOptions();
			}
		}
	};

	/**
	 * Refresh room options once the tool phase wraps up, so anything a tool
	 * changed (e.g. one that writes tool definitions into the room folder)
	 * shows up in the MCP indicator and is available to the next AskPlayground
	 * call, without a full page refresh. Run once the final batch is written
	 * and skipped if nothing could have changed, rather than firing per tool —
	 * a turn with several tools would otherwise send that many redundant
	 * GetRoomOptions calls.
	 */
	private refreshRoomOptions = (): void => {
		const room = this.message.room;
		const mayHaveChanged = this.message.parts.some((part) => {
			if (part.type !== "TOOL_CALL") return false;
			const status = room.getTool(part.toolCall.id)?.status;
			return status === "SUCCESS" || status === "CANCELLED";
		});
		// A successful sync clears the room's error state, so skip it if
		// something has already failed — a later cancel-commit failure on this
		// same batch shouldn't get wiped by this.
		if (!mayHaveChanged || room.error) {
			return;
		}
		room.syncRoomOptions().catch((e) => {
			console.error("Failed to sync room options", e);
		});
	};

	/**
	 * Send one batch as a single pixel: a plain write, or for the final batch
	 * the write that streams the model's reply. Both read the per-statement
	 * results and reconcile them, so a mid-batch commit failure retries only
	 * that tool.
	 *
	 * @param batch - The results to write, in order.
	 * @param isFinal - Whether the batch completes the tool set.
	 * @returns Whether the user stopped the reply.
	 */
	private sendBatch = async (
		batch: ToolSaveEntry[],
		isFinal: boolean,
	): Promise<boolean> => {
		const params = batch.map(this.toolExecutionParams);
		const pixel = params
			.map((entry) => addPlaygroundToolExecutionPixel(entry))
			.join("\n");
		if (isFinal) {
			return this.streamFinalBatch(
				batch,
				pixel,
				params[params.length - 1],
			);
		}
		const response = await this.message.room.runRoomPixel<ToolExecOutput[]>(
			pixel,
			{ showLoading: false, setErrorOnFail: false, throwOnError: false },
		);
		this.reconcile(batch, response.pixelReturn);
		// keep RunMCPTool concurrency saturated for any still-queued auto tools
		this.message.continueToolExecution();
		return false;
	};

	/**
	 * Send the final batch, streaming the model's reply into its placeholder.
	 * The finalizing (model-invoking) result is the last statement, and the
	 * only one the backend leaves uncommitted when its stream is aborted; its
	 * params drive the commit if the reply is stopped.
	 *
	 * @param batch - The results to write, in order.
	 * @param pixel - The batch's pixel.
	 * @param finalizer - The last result's params.
	 * @returns Whether the user stopped the reply: the stream ended with no
	 * result.
	 */
	private streamFinalBatch = async (
		batch: ToolSaveEntry[],
		pixel: string,
		finalizer: AddPlaygroundToolExecutionParams,
	): Promise<boolean> => {
		const message = this.message;
		const room = message.room;
		const reply = this.pendingReply ?? createResponsePlaceholder(room);
		if (!this.pendingReply) {
			this.pendingReply = reply;
			message.addChild(reply);
		}
		reply.setIsThinking(true);
		const toolStreamIndexToId: Record<number, string> = {};
		let hasResult = false;

		try {
			await room.runRoomPixelStreaming<ToolExecOutput[]>(
				pixel,
				{
					onEmit: (chunk) => {
						applyResponseStreamChunk(
							reply,
							toolStreamIndexToId,
							chunk,
						);
					},
					onResult: ({ results }) => {
						hasResult = true;
						const modelReply = this.reconcile(batch, results);
						// without one, a commit in this batch failed and the set
						// never completed: reconcile re-queued the failed writes,
						// and the retried final batch reuses the placeholder
						if (modelReply) {
							reply.sync(modelReply.responseMessage);
							// No INPUT_TOOL_EXEC store exists; stamp the server's
							// cumulative input token count as a proxy so tokensUsed()
							// finds a (cumulative, incremental) pair walking back.
							message.setTokens(modelReply.inputMessage.tokens);
							reply.continueToolExecution();
							this.pendingReply = null;
						}
					},
					// the user stopped the reply: persist what streamed
					onCancel: () =>
						this.recordCancelledToolExecution(
							finalizer,
							reply,
							batch,
						),
				},
				{ setErrorOnFail: false, throwOnError: false },
			);
			return !hasResult;
		} finally {
			// turn off thinking unless the reply spawned tools that are running
			const hasRunningTools = message.parts.some(
				(part) =>
					part.type === "TOOL_CALL" &&
					room.getTool(part.toolCall.id)?.status === "LOADING",
			);
			if (!hasRunningTools) {
				reply.setIsThinking(false);
			}
		}
	};

	/**
	 * Reconcile a settled batch against its per-statement results. A statement
	 * whose operationType contains "ERROR" failed to commit — retry that tool
	 * (see retryEntryAsError); successful ones resolve. Returns the model reply
	 * if the batch actually finalized (a committed statement whose output is the
	 * reply rather than a "more pending" string), otherwise null.
	 *
	 * @param batch - The batch's results, in order.
	 * @param statements - The pixel's per-statement results, in the same order.
	 * @returns The model reply, or null.
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
	 *
	 * @param entry - The result whose write failed.
	 * @param detail - Why it failed.
	 */
	private retryEntryAsError = (
		entry: ToolSaveEntry,
		detail: unknown,
	): void => {
		if (entry.toolStatus !== "success") {
			// given up: the model never hears of it, so the user must
			entry.tool.setStatus("ERROR");
			this.message.room.setError(toError(detail));
			entry.reject(detail);
			return;
		}
		// clear the terminal status so the re-save isn't skipped
		entry.tool.setStatus("LOADING");
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
	 * anything streamed. The batch's saves settle with the commit. A reply
	 * already committed, or already answered, is not committed again.
	 *
	 * @param finalizer - The finalizing write's params, to replay.
	 * @param reply - The reply that was streaming.
	 * @param batch - The final batch, whose saves wait on the commit.
	 * @throws When the commit fails; the stream job then shows it on the room,
	 * the user's only sign the stopped reply was not saved.
	 */
	private recordCancelledToolExecution = async (
		finalizer: AddPlaygroundToolExecutionParams,
		reply: ResponseMessageStore,
		batch: ToolSaveEntry[],
	): Promise<void> => {
		if (this.pendingReply !== reply) {
			return;
		}
		this.pendingReply = null;

		const message = this.message;
		const room = message.room;
		try {
			const response = await room.runRoomPixel<[CancelCommitOutput]>(
				addPlaygroundToolExecutionPixel(finalizer, {
					responseParts: reply.parts,
					hiddenMessage: TURN_CANCELLATION_PROMPT,
				}),
			);
			const { output } = response.pixelReturn[0];
			reply.sync(output.responseMessage);
			message.setTokens(output.inputMessage.tokens);
			room.spliceHiddenMessages(reply, output.extraMessages);
			for (const entry of batch) {
				entry.resolve();
			}
		} catch (e) {
			console.error("Failed to record cancelled tool execution", e);
			for (const entry of batch) {
				entry.reject(e);
			}
			throw e;
		}
	};

	/**
	 * What a save entry sends `AddPlaygroundToolExecution`. The work folder's
	 * tools go out again here: the model's follow up call only adds the room's
	 * own tools, so without them the folder would vanish from the model halfway
	 * through a task.
	 *
	 * @param entry - The result.
	 * @returns Its params.
	 */
	private toolExecutionParams = (
		entry: ToolSaveEntry,
	): AddPlaygroundToolExecutionParams => {
		const room = this.message.room;
		return {
			engineId: room.model.engine_id,
			roomId: room.roomId,
			parentMessageId: this.message.id,
			toolId: entry.tool.id,
			toolName: entry.tool.json.name,
			toolExecutionResponse: entry.toolResponse,
			paramValues: room.chatTools.chatParamValues,
			mcpToolStatus: entry.toolStatus,
			toolParameterValues: entry.executedParameters ?? {},
		};
	};
}
