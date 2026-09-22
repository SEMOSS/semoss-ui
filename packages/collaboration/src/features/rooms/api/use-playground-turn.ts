import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";
import type { PixelStreamMessage, PixelStreamToolMessage } from "@semoss/sdk";
import { latestAssistantTail } from "@/features/messages/api/get-room-messages";
import type {
	PlaygroundTurnOutput,
	ValidatedRoomMessage,
} from "@/features/messages/api/message-schemas";
import { playgroundTurnOutputSchema } from "@/features/messages/api/message-schemas";
import type {
	ConversationMessage,
	ConversationMessagePart,
	ConversationTool,
	ConversationToolStates,
	PlaygroundTurnPhase,
} from "@/features/messages/types/message";
import {
	conversationMessageFromPersisted,
	optimisticUserMessage,
	parseMessageParts,
	threadFromMessages,
} from "@/features/messages/utils/thread-items";
import type {
	ComposerSubmission,
	PendingToolApproval,
} from "@/features/rooms/types/room";
import { resolveToolUiUrl } from "@/features/tools/utils/tool-metadata";
import { toError } from "@/lib/pixel";
import {
	type AddPlaygroundToolParams,
	buildAddPlaygroundToolExecutionStatement,
	buildAskPlaygroundStatement,
	getToolEngineId,
	type PlaygroundJob,
	runMcpTool,
	runPlaygroundStatements,
	startPlaygroundJob,
	stopPlaygroundJob,
	TOOL_INTERRUPTED_PROMPT,
	TURN_CANCELLATION_PROMPT,
} from "./playground-chat";
import { uploadRoomFiles } from "./upload-room-files";

const MAX_CONCURRENT_TOOLS = 5;
const ROOT_MESSAGE_ID = "ROOT_PLACEHOLDER_ID";

interface PlaygroundTurnSnapshot {
	messages: ConversationMessage[];
	toolStates: ConversationToolStates;
	pendingApprovals: PendingToolApproval[];
	phase: PlaygroundTurnPhase | null;
	isSubmitting: boolean;
	isCancelling: boolean;
	turnError: string | null;
	transportError: Error | null;
	settlementVersion: number;
}

interface ControllerConfig {
	insightId: string;
	roomId: string;
	engine: string;
	context: string;
}

interface ToolRecord {
	tool: ConversationTool;
	generation: number;
	resultReady: boolean;
}

interface StreamState {
	targetMessageId: string | null;
	indexToToolId: Map<number, string>;
	argumentBuffers: Map<string, string>;
}

interface ActiveJob {
	job: PlaygroundJob;
	kind: "ask" | "tool";
	stream: StreamState;
	askParams?: Parameters<typeof buildAskPlaygroundStatement>[0];
	toolParams?: AddPlaygroundToolParams;
	hasChunks: boolean;
}

const EMPTY_SNAPSHOT: PlaygroundTurnSnapshot = {
	messages: [],
	toolStates: {},
	pendingApprovals: [],
	phase: null,
	isSubmitting: false,
	isCancelling: false,
	turnError: null,
	transportError: null,
	settlementVersion: 0,
};

function responsePartsFromMessage(
	message: ConversationMessage | undefined,
): unknown[] {
	if (!message) return [];
	const responseParts: unknown[] = [];
	for (const part of message.parts) {
		switch (part.type) {
			case "text":
				responseParts.push({
					type: "TEXT",
					text: part.text,
					uiText: part.text,
				});
				break;
			case "thinking":
				responseParts.push({ type: "THINKING", thinking: part.text });
				break;
			default:
				break;
		}
	}
	return responseParts;
}

function toolExecutionMode(tool: ConversationTool): string {
	const value = tool.metadata?.SMSS_MCP_EXECUTION;
	return typeof value === "string" ? value : "";
}

function isTurnOutput(value: unknown): value is PlaygroundTurnOutput {
	return playgroundTurnOutputSchema.safeParse(value).success;
}

function isActivePhase(phase: PlaygroundTurnPhase | null): boolean {
	return phase !== null && phase !== "completed" && phase !== "failed";
}

function parseTurnOutput(value: unknown): PlaygroundTurnOutput {
	const parsed = playgroundTurnOutputSchema.safeParse(value);
	if (!parsed.success) {
		throw new Error(
			`Playground returned an invalid settled turn: ${parsed.error.message}`,
		);
	}
	return parsed.data;
}

/** One persistent, room-scoped playground turn controller. */
export class PlaygroundTurnController {
	private snapshot: PlaygroundTurnSnapshot = EMPTY_SNAPSHOT;
	private readonly listeners = new Set<() => void>();
	private config: ControllerConfig;
	private generation = 0;
	private latestParentMessageId = ROOT_MESSAGE_ID;
	private activeJob: ActiveJob | null = null;
	private cancelRequested = false;
	private cancellationPromise: Promise<void> | null = null;
	private stopped = false;
	private toolQueue: ToolRecord[] = [];
	private runningTools = 0;
	private pendingSaves = 0;
	private saveChain: Promise<void> = Promise.resolve();
	private readonly unresolvedTools = new Map<string, ToolRecord>();
	private readonly restoredToolIds = new Set<string>();
	private streamSequence = 0;

	constructor(config: ControllerConfig) {
		this.config = config;
	}

	configure(config: ControllerConfig): void {
		this.config = config;
	}

	getSnapshot = (): PlaygroundTurnSnapshot => this.snapshot;

	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	};

	private update(
		changes:
			| Partial<PlaygroundTurnSnapshot>
			| ((
					current: PlaygroundTurnSnapshot,
			  ) => Partial<PlaygroundTurnSnapshot>),
	): void {
		const patch =
			typeof changes === "function" ? changes(this.snapshot) : changes;
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}

	private setPhase(phase: PlaygroundTurnPhase): void {
		this.update((current) => ({
			phase,
			messages: current.messages.map((message) =>
				message.role === "assistant" && message.live
					? {
							...message,
							live: {
								phase,
								hasObservationIssue:
									message.live.hasObservationIssue,
							},
						}
					: message,
			),
		}));
	}

	private patchTool(
		toolId: string,
		changes: ConversationToolStates[string],
	): void {
		this.update((current) => ({
			toolStates: {
				...current.toolStates,
				[toolId]: { ...current.toolStates[toolId], ...changes },
			},
			messages: current.messages.map((message) => ({
				...message,
				parts: message.parts.map((part) =>
					part.type === "tool" && part.tool.id === toolId
						? {
								type: "tool" as const,
								tool: { ...part.tool, ...changes },
							}
						: part,
				),
			})),
		}));
	}

	/** Reconcile the controller with durable history and restore unresolved calls. */
	reconcileHistory(messages: ValidatedRoomMessage[]): void {
		this.latestParentMessageId = latestAssistantTail(messages);
		if (
			this.snapshot.phase === "completed" ||
			this.snapshot.phase === "failed"
		) {
			this.update({
				messages: [],
				toolStates: {},
				phase: null,
				turnError: null,
				transportError: null,
			});
		}
		this.restoreUnresolvedTools(messages);
	}

	private restoreUnresolvedTools(messages: ValidatedRoomMessage[]): void {
		const completed = new Set<string>();
		for (const message of messages) {
			for (const part of parseMessageParts(message)) {
				if (part.type === "TOOL_RESULT") {
					completed.add(part.toolResult.toolCallId);
				}
			}
		}

		let restored = false;
		for (const message of messages) {
			if (message.io?.toUpperCase() !== "OUTPUT") continue;
			const converted = conversationMessageFromPersisted(message);
			if (!converted) continue;
			for (const part of converted.parts) {
				if (
					part.type !== "tool" ||
					completed.has(part.tool.id) ||
					part.tool.serverTool ||
					this.restoredToolIds.has(part.tool.id) ||
					this.unresolvedTools.has(part.tool.id)
				) {
					continue;
				}
				this.restoredToolIds.add(part.tool.id);
				this.queueTool(part.tool);
				restored = true;
			}
		}
		if (restored) this.updateToolPhase();
	}

	/** Submit a new AskPlayground turn and return once its job is accepted. */
	async send(submission: ComposerSubmission): Promise<void> {
		const command = submission.text.trim();
		if (
			!command ||
			isActivePhase(this.snapshot.phase) ||
			this.snapshot.isSubmitting
		) {
			return;
		}
		if (!this.config.engine)
			throw new Error("Select a model before sending.");

		this.generation += 1;
		const generation = this.generation;
		this.stopped = false;
		this.cancelRequested = false;
		this.toolQueue = [];
		this.runningTools = 0;
		this.pendingSaves = 0;
		this.saveChain = Promise.resolve();
		this.unresolvedTools.clear();
		this.streamSequence += 1;
		const placeholderId = `streaming-response-${this.streamSequence}`;
		const stream: StreamState = {
			targetMessageId: placeholderId,
			indexToToolId: new Map(),
			argumentBuffers: new Map(),
		};
		this.update({
			messages: [
				optimisticUserMessage(command, submission.files),
				{
					id: placeholderId,
					role: "assistant",
					parts: [],
					createdAt: new Date().toISOString(),
					live: { phase: "streaming", hasObservationIssue: false },
				},
			],
			toolStates: {},
			pendingApprovals: [],
			phase: "streaming",
			isSubmitting: true,
			isCancelling: false,
			turnError: null,
			transportError: null,
		});

		try {
			const uploaded = await uploadRoomFiles(
				this.config.insightId,
				submission.files,
			);
			if (generation !== this.generation) return;
			const askParams = {
				engine: this.config.engine,
				roomId: this.config.roomId,
				command,
				context: this.config.context,
				media: uploaded.map((file) => file.fileLocation),
				parentMessageId: this.latestParentMessageId,
			};
			const job = await startPlaygroundJob(
				this.config.insightId,
				buildAskPlaygroundStatement(askParams),
				(chunk) => this.applyChunk(stream, chunk),
			);
			if (generation !== this.generation) {
				await stopPlaygroundJob(this.config.insightId, job.jobId);
				return;
			}
			const active: ActiveJob = {
				job,
				kind: "ask",
				stream,
				askParams,
				hasChunks: false,
			};
			this.activeJob = active;
			this.update({ isSubmitting: false });
			void this.consumeModelJob(active, generation, true);
			if (this.cancelRequested) void this.cancel();
		} catch (cause) {
			if (generation !== this.generation || this.cancelRequested) return;
			this.fail(cause);
			throw toError(cause);
		}
	}

	private async consumeModelJob(
		active: ActiveJob,
		generation: number,
		replaceTurn: boolean,
	): Promise<void> {
		try {
			const results = await active.job.result;
			if (generation !== this.generation || this.cancelRequested) return;
			if (this.activeJob?.job.jobId === active.job.jobId) {
				this.activeJob = null;
			}
			const result = results[results.length - 1];
			if (!result || result.operationType.includes("ERROR")) {
				throw new Error(
					String(result?.output ?? "Playground returned no result."),
				);
			}
			this.installTurnOutput(
				parseTurnOutput(result.output),
				replaceTurn,
				active.stream.targetMessageId,
			);
		} catch (cause) {
			if (generation !== this.generation || this.cancelRequested) return;
			this.fail(cause);
		}
	}

	private installTurnOutput(
		output: PlaygroundTurnOutput,
		replaceTurn: boolean,
		streamTargetId?: string | null,
		continueToolLoop = true,
	): void {
		const authoritative = threadFromMessages([
			output.inputMessage,
			output.responseMessage,
		]);
		const visibleIds = new Set(authoritative.map((message) => message.id));
		this.latestParentMessageId =
			output.extraMessages?.at(-1)?.responseMessage.messageId ??
			output.responseMessage.messageId;

		this.update((current) => {
			const retained = replaceTurn
				? []
				: current.messages.filter(
						(message) =>
							message.id !== streamTargetId &&
							!visibleIds.has(message.id),
					);
			return {
				messages: [
					...retained,
					...authoritative.map((message) =>
						message.role === "assistant"
							? {
									...message,
									live: {
										phase: "streaming" as const,
										hasObservationIssue: false,
									},
								}
							: message,
					),
				],
			};
		});
		if (continueToolLoop) this.processResponse(output.responseMessage);
	}

	private processResponse(response: ValidatedRoomMessage): void {
		const converted = threadFromMessages([response])[0];
		const tools =
			converted?.parts.flatMap((part) =>
				part.type === "tool" ? [part.tool] : [],
			) ?? [];

		let foundUnresolved = false;
		for (const tool of tools) {
			if (
				tool.status === "COMPLETED" ||
				tool.status === "FAILED" ||
				tool.status === "CANCELLED" ||
				tool.serverTool
			) {
				this.patchTool(tool.id, {
					status:
						tool.status === "QUEUED" ? "COMPLETED" : tool.status,
					output: tool.output,
					error: tool.error,
				});
				continue;
			}
			if (!this.unresolvedTools.has(tool.id)) {
				this.queueTool(tool);
			}
			foundUnresolved = true;
		}

		if (foundUnresolved || this.unresolvedTools.size > 0) {
			this.updateToolPhase();
			return;
		}
		this.complete();
	}

	private queueTool(tool: ConversationTool): void {
		const record: ToolRecord = {
			tool: { ...tool, uiUrl: resolveToolUiUrl(tool) },
			generation: this.generation,
			resultReady: false,
		};
		this.unresolvedTools.set(tool.id, record);
		const execution = toolExecutionMode(tool);
		if (execution === "auto") {
			this.patchTool(tool.id, {
				status: "QUEUED",
				uiUrl: record.tool.uiUrl,
			});
			this.toolQueue.push(record);
			this.pumpToolQueue();
			return;
		}
		if (execution === "ask") {
			const approval: PendingToolApproval = {
				toolId: tool.id,
				parentMessageId: tool.parentMessageId,
				toolName: tool.name,
				arguments: tool.arguments,
				metadata: tool.metadata,
				uiUrl: record.tool.uiUrl,
			};
			this.patchTool(tool.id, {
				status: "INPUT_REQUIRED",
				uiUrl: record.tool.uiUrl,
			});
			this.update((current) => ({
				pendingApprovals: current.pendingApprovals.some(
					(item) => item.toolId === approval.toolId,
				)
					? current.pendingApprovals
					: [...current.pendingApprovals, approval],
			}));
			return;
		}

		this.patchTool(tool.id, {
			status: "FAILED",
			error: "This tool is not enabled for client execution.",
		});
		record.resultReady = true;
		this.enqueueToolResult(
			record,
			"This tool is not enabled for client execution.",
			"error",
			tool.arguments,
		);
	}

	private pumpToolQueue(): void {
		while (
			!this.stopped &&
			this.runningTools < MAX_CONCURRENT_TOOLS &&
			this.toolQueue.length > 0
		) {
			const record = this.toolQueue.shift();
			if (!record) break;
			this.runningTools += 1;
			void this.executeTool(record, record.tool.arguments).finally(() => {
				if (record.generation !== this.generation) return;
				this.runningTools -= 1;
				this.pumpToolQueue();
				this.updateToolPhase();
			});
		}
	}

	private async executeTool(
		record: ToolRecord,
		argumentsValue: Record<string, unknown>,
	): Promise<void> {
		const startedAt = performance.now();
		this.patchTool(record.tool.id, {
			status: "RUNNING",
			arguments: argumentsValue,
		});
		try {
			const ownerId = getToolEngineId(record.tool.metadata);
			if (!ownerId) throw new Error("Tool owner metadata is missing.");
			const output = await runMcpTool(this.config.insightId, {
				ownerId,
				roomId: this.config.roomId,
				toolName: record.tool.name,
				argumentsValue,
			});
			if (this.stopped || record.generation !== this.generation) return;
			record.resultReady = true;
			this.patchTool(record.tool.id, {
				status: "COMPLETED",
				output,
				durationMs: performance.now() - startedAt,
			});
			this.enqueueToolResult(record, output, "success", argumentsValue);
		} catch (cause) {
			if (this.stopped || record.generation !== this.generation) return;
			const error = toError(cause);
			record.resultReady = true;
			this.patchTool(record.tool.id, {
				status: "FAILED",
				error: error.message,
				durationMs: performance.now() - startedAt,
			});
			this.enqueueToolResult(
				record,
				error.message,
				"error",
				argumentsValue,
			);
		}
	}

	private enqueueToolResult(
		record: ToolRecord,
		response: string,
		status: "success" | "error" | "cancelled",
		argumentsValue: Record<string, unknown>,
	): void {
		if (this.stopped) return;
		this.pendingSaves += 1;
		const generation = record.generation;
		const task = this.saveChain.then(() =>
			this.saveToolResultWithRetry(
				record,
				response,
				status,
				argumentsValue,
			),
		);
		this.saveChain = task
			.catch((cause: unknown) => {
				if (!this.cancelRequested) this.fail(cause);
			})
			.finally(() => {
				if (generation !== this.generation) return;
				this.pendingSaves -= 1;
				this.updateToolPhase();
			});
	}

	private async saveToolResultWithRetry(
		record: ToolRecord,
		response: string,
		status: "success" | "error" | "cancelled",
		argumentsValue: Record<string, unknown>,
	): Promise<void> {
		try {
			await this.saveToolResult(record, response, status, argumentsValue);
		} catch (cause) {
			if (this.stopped || status !== "success") throw cause;
			const detail = `Failed to save tool response: ${toError(cause).message}`;
			this.patchTool(record.tool.id, { status: "FAILED", error: detail });
			await this.saveToolResult(record, detail, "error", argumentsValue);
		}
	}

	private async saveToolResult(
		record: ToolRecord,
		response: string,
		status: "success" | "error" | "cancelled",
		argumentsValue: Record<string, unknown>,
	): Promise<void> {
		if (this.stopped) return;
		const params: AddPlaygroundToolParams = {
			engine: this.config.engine,
			roomId: this.config.roomId,
			parentMessageId: record.tool.parentMessageId,
			toolId: record.tool.id,
			toolName: record.tool.name,
			toolExecutionResponse: response,
			mcpToolStatus: status,
			toolParameterValues: argumentsValue,
		};
		const stream: StreamState = {
			targetMessageId: null,
			indexToToolId: new Map(),
			argumentBuffers: new Map(),
		};
		const job = await startPlaygroundJob(
			this.config.insightId,
			buildAddPlaygroundToolExecutionStatement(params),
			(chunk) => this.applyChunk(stream, chunk),
		);
		const active: ActiveJob = {
			job,
			kind: "tool",
			stream,
			toolParams: params,
			hasChunks: false,
		};
		this.activeJob = active;
		const results = await job.result;
		if (this.activeJob?.job.jobId === job.jobId) this.activeJob = null;
		if (this.stopped) return;
		const result = results[results.length - 1];
		if (!result || result.operationType.includes("ERROR")) {
			throw new Error(
				String(result?.output ?? "Tool result was not saved."),
			);
		}
		this.unresolvedTools.delete(record.tool.id);
		if (isTurnOutput(result.output)) {
			this.installTurnOutput(
				parseTurnOutput(result.output),
				false,
				stream.targetMessageId,
			);
		}
	}

	private applyChunk(stream: StreamState, chunk: PixelStreamMessage): void {
		if (this.stopped || this.cancelRequested) return;
		if (this.activeJob?.stream === stream) this.activeJob.hasChunks = true;
		if (!stream.targetMessageId) {
			this.streamSequence += 1;
			stream.targetMessageId = `streaming-response-${this.streamSequence}`;
			this.update((current) => ({
				messages: [
					...current.messages,
					{
						id: stream.targetMessageId ?? "streaming-response",
						role: "assistant" as const,
						parts: [],
						createdAt: new Date().toISOString(),
						live: {
							phase: "streaming" as const,
							hasObservationIssue: false,
						},
					},
				],
				phase: "streaming",
			}));
		}

		if (chunk.stream_type === "content" && chunk.data.content) {
			this.appendStreamingPart(stream, "text", chunk.data.content);
		} else if (chunk.stream_type === "thinking" && chunk.data.thinking) {
			this.appendStreamingPart(stream, "thinking", chunk.data.thinking);
		} else if (chunk.stream_type === "tool") {
			this.applyToolChunk(stream, chunk);
		}
	}

	private appendStreamingPart(
		stream: StreamState,
		type: "text" | "thinking",
		value: string,
	): void {
		this.update((current) => ({
			messages: current.messages.map((message) => {
				if (message.id !== stream.targetMessageId) return message;
				const parts = [...message.parts];
				const last = parts.at(-1);
				if (last?.type === type) {
					parts[parts.length - 1] = {
						...last,
						text: last.text + value,
						state: "active",
					};
				} else {
					parts.push({ type, text: value, state: "active" });
				}
				return { ...message, parts };
			}),
		}));
	}

	private applyToolChunk(
		stream: StreamState,
		chunk: PixelStreamToolMessage,
	): void {
		const data = chunk.data;
		if (data.finish_reason) {
			this.update((current) => ({
				messages: current.messages.map((message) =>
					message.id === stream.targetMessageId
						? {
								...message,
								parts: message.parts.map((part) =>
									part.type === "text" ||
									part.type === "thinking"
										? { ...part, state: "complete" }
										: part,
								),
							}
						: message,
				),
			}));
			return;
		}
		if (data.index === undefined) return;
		if (data.id) {
			stream.indexToToolId.set(data.index, data.id);
			const placeholder: ConversationMessagePart = {
				type: "tool",
				tool: {
					id: data.id,
					parentMessageId: stream.targetMessageId ?? "",
					name: data.function?.name ?? "",
					title: "Loading tool…",
					arguments: {},
					status: "QUEUED",
				},
			};
			this.update((current) => ({
				messages: current.messages.map((message) =>
					message.id === stream.targetMessageId
						? { ...message, parts: [...message.parts, placeholder] }
						: message,
				),
			}));
		}
		const toolId = stream.indexToToolId.get(data.index);
		if (!toolId) return;
		const currentBuffer = stream.argumentBuffers.get(toolId) ?? "";
		const nextBuffer = currentBuffer + (data.function?.arguments ?? "");
		stream.argumentBuffers.set(toolId, nextBuffer);
		let argumentsValue: Record<string, unknown> = {};
		try {
			const parsed: unknown = JSON.parse(nextBuffer || "{}");
			if (
				typeof parsed === "object" &&
				parsed !== null &&
				!Array.isArray(parsed)
			) {
				argumentsValue = parsed as Record<string, unknown>;
			}
		} catch {
			// Arguments are incremental and are expected to be invalid until settled.
		}
		this.update((current) => ({
			messages: current.messages.map((message) =>
				message.id === stream.targetMessageId
					? {
							...message,
							parts: message.parts.map((part) =>
								part.type === "tool" && part.tool.id === toolId
									? {
											type: "tool" as const,
											tool: {
												...part.tool,
												name:
													data.function?.name ??
													part.tool.name,
												arguments: argumentsValue,
											},
										}
									: part,
							),
						}
					: message,
			),
		}));
	}

	private updateToolPhase(): void {
		if (
			this.snapshot.phase === "cancelling" ||
			this.snapshot.phase === "failed" ||
			this.snapshot.phase === "completed"
		) {
			return;
		}
		if (
			this.unresolvedTools.size === 0 &&
			this.runningTools === 0 &&
			this.pendingSaves === 0
		) {
			if (this.snapshot.phase !== "streaming") this.complete();
			return;
		}
		this.setPhase(
			this.snapshot.pendingApprovals.length > 0 &&
				this.runningTools === 0 &&
				this.toolQueue.length === 0
				? "awaiting_approval"
				: "executing_tools",
		);
	}

	async approve(
		approval: PendingToolApproval,
		argumentsValue: Record<string, unknown>,
	): Promise<void> {
		const record = this.unresolvedTools.get(approval.toolId);
		if (!record || this.stopped) return;
		this.update((current) => ({
			pendingApprovals: current.pendingApprovals.filter(
				(item) => item.toolId !== approval.toolId,
			),
		}));
		record.tool = { ...record.tool, arguments: argumentsValue };
		this.toolQueue.push(record);
		this.patchTool(approval.toolId, {
			status: "QUEUED",
			arguments: argumentsValue,
		});
		this.pumpToolQueue();
		this.updateToolPhase();
	}

	async reject(approval: PendingToolApproval): Promise<void> {
		const record = this.unresolvedTools.get(approval.toolId);
		if (!record || this.stopped) return;
		this.update((current) => ({
			pendingApprovals: current.pendingApprovals.filter(
				(item) => item.toolId !== approval.toolId,
			),
		}));
		record.resultReady = true;
		this.patchTool(approval.toolId, { status: "REJECTED" });
		this.enqueueToolResult(
			record,
			"The user rejected this tool call.",
			"cancelled",
			approval.arguments,
		);
		this.updateToolPhase();
	}

	/** Stop an active model stream or cancel every unresolved tool call. */
	async cancel(): Promise<void> {
		if (this.cancellationPromise) return this.cancellationPromise;
		this.cancelRequested = true;
		this.update({ isCancelling: true });
		this.setPhase("cancelling");

		this.cancellationPromise = (async () => {
			const active = this.activeJob;
			if (active && (active.kind === "ask" || active.hasChunks)) {
				await this.cancelModelJob(active);
				return;
			}
			await this.cancelToolPhase(active);
		})()
			.catch((cause: unknown) => this.fail(cause))
			.finally(() => {
				this.cancellationPromise = null;
				this.cancelRequested = false;
				this.update({ isCancelling: false, isSubmitting: false });
			});
		return this.cancellationPromise;
	}

	private async cancelModelJob(active: ActiveJob): Promise<void> {
		await stopPlaygroundJob(this.config.insightId, active.job.jobId);
		this.stopped = true;
		const message = this.snapshot.messages.find(
			(candidate) => candidate.id === active.stream.targetMessageId,
		);
		const commit = {
			responseParts: responsePartsFromMessage(message),
			hiddenMessage: TURN_CANCELLATION_PROMPT,
		};
		const statement = active.askParams
			? buildAskPlaygroundStatement(active.askParams, commit)
			: active.toolParams
				? buildAddPlaygroundToolExecutionStatement(
						active.toolParams,
						commit,
					)
				: "";
		if (!statement) throw new Error("Cancellation context is unavailable.");
		const results = await runPlaygroundStatements(
			this.config.insightId,
			statement,
		);
		const output = results.at(-1)?.output;
		if (isTurnOutput(output)) {
			this.installTurnOutput(
				parseTurnOutput(output),
				false,
				active.stream.targetMessageId,
				false,
			);
		}
		this.toolQueue = [];
		this.unresolvedTools.clear();
		this.generation += 1;
		this.update({ pendingApprovals: [] });
		this.activeJob = null;
		this.complete();
	}

	private async cancelToolPhase(active: ActiveJob | null): Promise<void> {
		this.stopped = true;
		this.toolQueue = [];
		this.update({ pendingApprovals: [] });
		if (active) {
			await stopPlaygroundJob(
				this.config.insightId,
				active.job.jobId,
			).catch(() => undefined);
		}
		await this.saveChain;

		const records = [...this.unresolvedTools.values()];
		for (const record of records) {
			this.patchTool(record.tool.id, {
				status: "CANCELLED",
				output: TOOL_INTERRUPTED_PROMPT,
			});
		}
		if (records.length > 0) {
			const statement = records
				.map((record, index) => {
					const params: AddPlaygroundToolParams = {
						engine: this.config.engine,
						roomId: this.config.roomId,
						parentMessageId: record.tool.parentMessageId,
						toolId: record.tool.id,
						toolName: record.tool.name,
						toolExecutionResponse: TOOL_INTERRUPTED_PROMPT,
						mcpToolStatus: "cancelled",
						toolParameterValues: record.tool.arguments,
					};
					return buildAddPlaygroundToolExecutionStatement(
						params,
						index === records.length - 1
							? {
									responseParts: [],
									hiddenMessage: TURN_CANCELLATION_PROMPT,
								}
							: undefined,
					);
				})
				.join("\n");
			const results = await runPlaygroundStatements(
				this.config.insightId,
				statement,
			);
			const output = results.at(-1)?.output;
			if (isTurnOutput(output)) {
				this.installTurnOutput(
					parseTurnOutput(output),
					false,
					undefined,
					false,
				);
			}
		}
		this.unresolvedTools.clear();
		this.generation += 1;
		this.activeJob = null;
		this.complete();
	}

	private complete(): void {
		this.setPhase("completed");
		this.update((current) => ({
			isSubmitting: false,
			isCancelling: false,
			settlementVersion: current.settlementVersion + 1,
		}));
	}

	private fail(cause: unknown): void {
		const error = toError(cause);
		this.stopped = true;
		this.generation += 1;
		this.toolQueue = [];
		this.activeJob = null;
		this.setPhase("failed");
		this.update((current) => ({
			isSubmitting: false,
			isCancelling: false,
			pendingApprovals: [],
			turnError: error.message,
			transportError: error,
			settlementVersion: current.settlementVersion + 1,
		}));
	}
}

const controllers = new Map<string, PlaygroundTurnController>();

function roomController(config: ControllerConfig): PlaygroundTurnController {
	const key = `${config.insightId}:${config.roomId}`;
	let controller = controllers.get(key);
	if (!controller) {
		controller = new PlaygroundTurnController(config);
		controllers.set(key, controller);
	}
	controller.configure(config);
	return controller;
}

export interface UsePlaygroundTurnOptions extends ControllerConfig {
	onSettled?: (roomId: string) => void;
}

/** Subscribe to the persistent controller for one playground room. */
export function usePlaygroundTurn(options: UsePlaygroundTurnOptions) {
	const { insightId, roomId, engine, context } = options;
	const controller = useMemo(
		() => roomController({ insightId, roomId, engine, context }),
		[context, engine, insightId, roomId],
	);
	controller.configure(options);
	const snapshot = useSyncExternalStore(
		controller.subscribe,
		controller.getSnapshot,
		controller.getSnapshot,
	);
	const onSettledRef = useRef(options.onSettled);
	onSettledRef.current = options.onSettled;
	const observedSettlement = useRef(snapshot.settlementVersion);

	useEffect(() => {
		if (snapshot.settlementVersion === observedSettlement.current) return;
		observedSettlement.current = snapshot.settlementVersion;
		onSettledRef.current?.(roomId);
	}, [roomId, snapshot.settlementVersion]);

	return {
		...snapshot,
		isRunning: isActivePhase(snapshot.phase),
		send: useCallback(
			(submission: ComposerSubmission) => controller.send(submission),
			[controller],
		),
		cancel: useCallback(() => controller.cancel(), [controller]),
		approve: useCallback(
			(
				approval: PendingToolApproval,
				argumentsValue: Record<string, unknown>,
			) => controller.approve(approval, argumentsValue),
			[controller],
		),
		reject: useCallback(
			(approval: PendingToolApproval) => controller.reject(approval),
			[controller],
		),
		reconcileHistory: useCallback(
			(messages: ValidatedRoomMessage[]) =>
				controller.reconcileHistory(messages),
			[controller],
		),
	};
}
