import { toError } from "@semoss/utility";
import type { ValidatedRoomMessage } from "@/features/messages/api/message-schemas";
import type {
	ConversationMessage,
	ConversationToolStates,
	PlaygroundTurnPhase,
} from "@/features/messages/types/message";
import {
	optimisticUserMessage,
	threadFromMessages,
} from "@/features/messages/utils/thread-items";
import type {
	ComposerSubmission,
	PendingToolApproval,
} from "@/features/rooms/types/room";
import {
	applyRunEvent,
	type RunItemState,
	runActionApproval,
	runItemPart,
	runItemTool,
} from "@/features/rooms/utils/agent-run-items";
import {
	type AgentAction,
	type AgentRun,
	cancelRun,
	decideRunAction,
	isTerminalRun,
	listChildRuns,
	listRoomRuns,
	pollRun,
	readRun,
	startAgentRun,
} from "./agent-run-api";
import { uploadRoomFiles } from "./upload-room-files";

export interface AgentTurnConfig {
	insightId: string;
	roomId: string;
	agentId: string;
	engine: string;
	maxTurns: number;
	maxReflections?: number;
}

export interface AgentTurnSnapshot {
	messages: ConversationMessage[];
	toolStates: ConversationToolStates;
	pendingApprovals: PendingToolApproval[];
	phase: PlaygroundTurnPhase | null;
	isSubmitting: boolean;
	isRestoring: boolean;
	isCancelling: boolean;
	isRunning: boolean;
	turnError: string | null;
	transportError: Error | null;
	settlementVersion: number;
}

/** One observer per room. Tools and durable cancellation are owned by RunAgent. */
export class AgentTurnController {
	private config: AgentTurnConfig;
	private snapshot: AgentTurnSnapshot = {
		messages: [],
		toolStates: {},
		pendingApprovals: [],
		phase: null,
		isSubmitting: false,
		isRestoring: true,
		isCancelling: false,
		isRunning: false,
		turnError: null,
		transportError: null,
		settlementVersion: 0,
	};
	private listeners = new Set<() => void>();
	private run: AgentRun | null = null;
	private items = new Map<string, RunItemState>();
	private seenEvents = new Set<string>();
	private archivedItems = new Set<string>();
	private actions = new Map<string, AgentAction>();
	private decidedActions = new Set<string>();
	private decidingActions = new Set<string>();
	private children = new Map<string, AgentRun>();
	private durable: ConversationMessage[] = [];
	private previous: ConversationMessage[] = [];
	private optimistic: ConversationMessage | null = null;
	private restored = false;
	private restoring: Promise<void> | null = null;
	private observing: Promise<void> | null = null;
	private cancelling: Promise<void> | null = null;
	private wake: (() => void) | null = null;
	private disposed = false;
	private settledRunId: string | null = null;
	private lastReconcileKey = "";
	private lastChildrenRead = 0;
	private cancelRequested = false;
	private terminalReconciled = false;

	constructor(config: AgentTurnConfig) {
		this.config = config;
	}
	configure(config: AgentTurnConfig): void {
		this.config = config;
	}
	getSnapshot = (): AgentTurnSnapshot => this.snapshot;
	canEvict(): boolean {
		return (
			!this.listeners.size &&
			!this.observing &&
			!this.restoring &&
			!this.snapshot.isSubmitting
		);
	}
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	};

	private update(patch: Partial<AgentTurnSnapshot>): void {
		if (this.disposed) return;
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}

	/** Reconnect from server-owned run records, never from old tool-call history. */
	reconnect = async (): Promise<void> => {
		if (this.restoring) return this.restoring;
		if (this.observing) {
			this.wake?.();
			return;
		}
		this.restoring = this.restore();
		try {
			await this.restoring;
		} finally {
			this.restoring = null;
		}
	};

	private async restore(): Promise<void> {
		this.restored = false;
		this.update({ isRestoring: true, transportError: null });
		try {
			const runs = await listRoomRuns(
				this.config.insightId,
				this.config.roomId,
			);
			if (this.disposed) return;
			const active = [...runs]
				.reverse()
				.find((run) => !isTerminalRun(run));
			const latest = active ?? runs.at(-1);
			if (latest) {
				if (latest.runId !== this.run?.runId) {
					this.items.clear();
					this.archivedItems.clear();
					this.seenEvents.clear();
					this.decidedActions.clear();
					this.children.clear();
					this.optimistic = null;
				}
				this.lastChildrenRead = 0;
				this.terminalReconciled = false;
				this.run = latest;
				await this.reconcileRun();
				await this.refreshChildren();
			}
			this.restored = true;
			this.update({ isRestoring: false });
			if (this.run && this.snapshot.isRunning) this.observe();
		} catch (cause) {
			this.update({ isRestoring: false, transportError: toError(cause) });
		}
	}

	/** Submit once; subsequent progress uses run polling rather than pixel jobs. */
	send = async (submission: ComposerSubmission): Promise<void> => {
		if (!this.restored) await this.reconnect();
		if (!this.restored)
			throw new Error(
				"Reconnect to this conversation before sending a message.",
			);
		if (this.snapshot.isRunning || this.snapshot.isSubmitting)
			throw new Error(
				"Wait for this run to finish before sending another message.",
			);
		if (this.observing) await this.observing;
		if (this.snapshot.isSubmitting)
			throw new Error("A message is already being submitted.");
		const config = { ...this.config };
		if (!config.engine) throw new Error("Select a model before sending.");
		const command =
			submission.text.trim() ||
			(submission.files.length
				? "Please review the attached files."
				: "");
		if (!command) return;
		this.previous = this.snapshot.messages;
		this.durable = [];
		this.items.clear();
		this.archivedItems.clear();
		this.seenEvents.clear();
		this.actions.clear();
		this.decidedActions.clear();
		this.children.clear();
		this.run = null;
		this.lastReconcileKey = "";
		this.lastChildrenRead = 0;
		this.cancelRequested = false;
		this.terminalReconciled = false;
		this.optimistic = optimisticUserMessage(command, submission.files);
		this.update({
			messages: [...this.previous, this.optimistic],
			toolStates: {},
			pendingApprovals: [],
			isSubmitting: true,
			isRunning: true,
			phase: "streaming",
			turnError: null,
			transportError: null,
		});
		try {
			const files = await uploadRoomFiles(
				config.insightId,
				submission.files,
			);
			if (this.disposed) return;
			if (this.cancelRequested) {
				this.optimistic = null;
				this.update({
					messages: this.previous,
					phase: "completed",
					isRunning: false,
				});
				return;
			}
			this.run = await startAgentRun(config.insightId, {
				roomId: config.roomId,
				agentId: config.agentId,
				engine: config.engine,
				command,
				media: files.map((file) => file.fileLocation),
				maxTurns: config.maxTurns,
				maxReflections: config.maxReflections,
			});
			if (this.disposed) return;
			this.observe();
			if (this.cancelRequested) {
				try {
					await this.cancel();
				} catch {
					/* Cancellation errors are surfaced separately from successful submission. */
				}
			}
		} catch (cause) {
			// A transport failure may follow a successful submission. Require a
			// durable lookup before retrying so the same message is not run twice.
			this.restored = false;
			this.optimistic = null;
			this.update({
				messages: this.previous,
				phase: "failed",
				isRunning: false,
				turnError: toError(cause).message,
			});
			throw toError(cause);
		} finally {
			this.update({ isSubmitting: false, isCancelling: false });
		}
	};

	private observe(): void {
		if (this.observing || !this.run || this.disposed) return;
		this.observing = this.observeLoop().finally(() => {
			this.observing = null;
		});
	}

	private async observeLoop(): Promise<void> {
		let failures = 0;
		while (!this.disposed && this.run) {
			let delay = 500;
			try {
				const result = await pollRun(this.run.runId);
				if (this.disposed) return;
				if (
					result.run.runId !== this.run.runId ||
					result.run.roomId !== this.config.roomId
				)
					throw new Error(
						"Received progress for a different conversation.",
					);
				this.run = result.run;
				let received = 0;
				for (const event of [...result.events].sort(
					(a, b) => a.sequence - b.sequence,
				)) {
					if (
						event.runId !== this.run.runId ||
						this.seenEvents.has(event.eventId)
					)
						continue;
					this.seenEvents.add(event.eventId);
					applyRunEvent(this.items, event);
					received++;
				}
				const key = JSON.stringify([
					this.run.status,
					this.run.pendingActions.map((action) => action.actionId),
				]);
				const terminal = isTerminalRun(this.run);
				if (terminal) this.lastChildrenRead = 0;
				if (
					result.droppedEvents > 0 ||
					(this.run.status === "INPUT_REQUIRED" &&
						key !== this.lastReconcileKey) ||
					(terminal && received === 0)
				) {
					await this.reconcileRun();
					this.lastReconcileKey = key;
				}
				if (Date.now() - this.lastChildrenRead >= 1500 || terminal)
					await this.refreshChildren();
				failures = 0;
				this.update({ transportError: null });
				this.render();
				if (terminal && received === 0 && !this.snapshot.isRunning)
					return;
				delay = terminal
					? received > 0
						? 100
						: 1500
					: this.run.status === "INPUT_REQUIRED"
						? 1500
						: 500;
			} catch (cause) {
				if (this.disposed) return;
				failures++;
				this.update({ transportError: toError(cause) });
				if (failures >= 5) {
					try {
						this.lastChildrenRead = 0;
						await this.reconcileRun();
						await this.refreshChildren();
					} catch {
						/* Keep the observed error and run identity for explicit reconnection. */
					}
					return;
				}
				delay = Math.min(500 * 2 ** failures, 8000);
			}
			await new Promise<void>((resolve) => {
				const timer = setTimeout(() => {
					this.wake = null;
					resolve();
				}, delay);
				this.wake = () => {
					clearTimeout(timer);
					this.wake = null;
					resolve();
				};
			});
		}
	}

	private async reconcileRun(): Promise<void> {
		if (!this.run) return;
		const run = await readRun(this.config.insightId, this.run.runId);
		if (this.disposed) return;
		if (run.roomId !== this.config.roomId)
			throw new Error(
				"The agent run belongs to a different conversation.",
			);
		this.run = run;
		this.terminalReconciled = isTerminalRun(run);
		this.durable = threadFromMessages(run.messages ?? []);
		const savedParts = this.durable.flatMap((message) =>
			message.role === "assistant" ? message.parts : [],
		);
		for (const [id, entry] of this.items) {
			const item = entry.item;
			if (
				item.kind === "message" &&
				this.durable.some((message) => message.id === item.messageId)
			)
				this.archivedItems.add(id);
			if (
				(item.kind === "message" || item.kind === "reasoning") &&
				(entry.complete ||
					isTerminalRun(run) ||
					run.status === "INPUT_REQUIRED") &&
				savedParts.some(
					(part) =>
						part.type ===
							(item.kind === "message" ? "text" : "thinking") &&
						"text" in part &&
						part.text.includes(
							(item.kind === "message"
								? item.text
								: item.summary
							).trim(),
						),
				)
			)
				this.archivedItems.add(id);
			if (item.kind === "tool") {
				const saved = savedParts.find(
					(part) => part.type === "tool" && part.tool.id === id,
				);
				if (saved?.type === "tool" && saved.tool.status !== "QUEUED") {
					this.items.set(id, {
						...entry,
						item: {
							...item,
							status: saved.tool.status,
							output: saved.tool.output,
							error: saved.tool.error,
						},
					});
				} else if (
					isTerminalRun(run) &&
					["RUNNING", "QUEUED", "INPUT_REQUIRED"].includes(
						item.status,
					)
				) {
					this.items.set(id, {
						...entry,
						item: {
							...item,
							status:
								run.status === "CANCELLED"
									? "CANCELLED"
									: "FAILED",
							error: "The run ended before this tool returned a result.",
						},
					});
				}
			}
		}
		this.render();
	}

	/** Read descendants durably; never create a second destructive stream reader. */
	private async refreshChildren(): Promise<void> {
		if (!this.run) return;
		const pending = [this.run.runId];
		const visited = new Set<string>();
		const children = new Map<string, AgentRun>();
		while (pending.length && !this.disposed) {
			const parent = pending.shift();
			if (!parent || visited.has(parent)) continue;
			visited.add(parent);
			for (const child of await listChildRuns(
				this.config.insightId,
				parent,
			)) {
				// A person's task has no tool approvals to load, and the full read
				// would drop its executor fields.
				const full =
					child.status === "INPUT_REQUIRED" &&
					child.executorType !== "HUMAN"
						? await readRun(
								this.config.insightId,
								child.runId,
								false,
							)
						: child;
				children.set(child.runId, full);
				pending.push(child.runId);
			}
		}
		this.children = children;
		this.lastChildrenRead = Date.now();
		this.render();
	}

	private render(): void {
		if (!this.run || this.disposed) return;
		const run = this.run;
		const terminal = isTerminalRun(run);
		const finished =
			terminal &&
			this.terminalReconciled &&
			this.lastChildrenRead > 0 &&
			// A person may take days; the turn itself is done.
			[...this.children.values()].every(
				(child) => isTerminalRun(child) || isWaitingOnPerson(child),
			);
		this.actions.clear();
		for (const owner of [run, ...this.children.values()]) {
			if (isTerminalRun(owner)) continue;
			for (const action of owner.pendingActions) {
				if (
					action.runId === owner.runId &&
					!this.decidedActions.has(action.actionId)
				)
					this.actions.set(action.actionId, action);
			}
		}
		const approvals = [...this.actions.values()].map((action) => ({
			...runActionApproval(action),
			roomId:
				action.runId === run.runId
					? run.roomId
					: this.children.get(action.runId)?.roomId,
		}));
		const phase: PlaygroundTurnPhase = this.snapshot.isCancelling
			? "cancelling"
			: approvals.length
				? "awaiting_approval"
				: finished
					? run.status === "COMPLETED"
						? "completed"
						: "failed"
					: run.status === "INPUT_REQUIRED"
						? "awaiting_approval"
						: terminal || run.progress?.activity === "tool"
							? "executing_tools"
							: "streaming";
		const persistedTools = new Set(
			this.durable.flatMap((message) =>
				message.parts.flatMap((part) =>
					part.type === "tool" ? [part.tool.id] : [],
				),
			),
		);
		const persistedIds = new Set(this.durable.map((message) => message.id));
		const toolStates: ConversationToolStates = {};
		const parts = [...this.items.entries()].flatMap(([id, entry]) => {
			if (entry.item.kind === "tool") {
				const tool = runItemTool(entry.item);
				toolStates[id] = {
					arguments: tool.arguments,
					status: tool.status,
					output: tool.output,
					error: tool.error,
					durationMs: tool.durationMs,
					uiUrl: tool.uiUrl,
				};
			}
			if (
				this.archivedItems.has(id) ||
				(entry.item.kind === "tool" && persistedTools.has(id)) ||
				(entry.item.kind === "message" &&
					entry.item.messageId &&
					persistedIds.has(entry.item.messageId))
			)
				return [];
			const part = runItemPart(entry);
			return part ? [part] : [];
		});
		for (const child of this.children.values()) {
			// Delegations show on their DelegateToPerson tool card instead.
			if (child.executorType === "HUMAN") continue;
			parts.push({
				type: "tool",
				tool: {
					id: `subagent:${child.runId}`,
					parentMessageId: "",
					name: "Subagent",
					title: child.workspaceName || "Subagent",
					arguments: {},
					status:
						child.status === "SUBMITTED" ? "QUEUED" : child.status,
					output: child.finalText ?? undefined,
					error: child.errorMessage ?? undefined,
				},
			});
		}
		const messages = [...this.previous, ...this.durable];
		if (
			this.optimistic &&
			!this.durable.some((message) => message.role === "user")
		) {
			messages.push({
				...this.optimistic,
				id: run.inputMessageId || this.optimistic.id,
			});
		}
		if (parts.length)
			messages.push({
				id: `agent-run:${run.runId}`,
				role: "assistant",
				parts,
				live: {
					phase,
					hasObservationIssue: !!this.snapshot.transportError,
				},
			});
		if (
			terminal &&
			!this.durable.some(
				(message) => message.id === run.finalOutputMessageId,
			) &&
			run.finalText &&
			!parts.some(
				(part) => part.type === "text" && part.text === run.finalText,
			)
		) {
			messages.push({
				id: run.finalOutputMessageId || `agent-final:${run.runId}`,
				role: "assistant",
				parts: [{ type: "text", text: run.finalText }],
			});
		}
		const settled = finished && this.settledRunId !== run.runId;
		if (settled) this.settledRunId = run.runId;
		this.update({
			messages,
			toolStates,
			pendingApprovals: approvals,
			phase,
			isRunning: !finished,
			turnError:
				run.status === "FAILED"
					? run.errorMessage || "The agent run failed."
					: null,
			settlementVersion:
				this.snapshot.settlementVersion + (settled ? 1 : 0),
		});
	}

	/** Refresh persisted rows without treating old tool calls as executable work. */
	reconcileHistory = (messages: ValidatedRoomMessage[]): void => {
		const persisted = new Map(
			threadFromMessages(messages).map((message) => [
				message.id,
				message,
			]),
		);
		this.previous = this.previous.map(
			(message) => persisted.get(message.id) ?? message,
		);
		this.render();
	};

	approve = async (
		approval: PendingToolApproval,
		parameters: Record<string, unknown>,
	): Promise<void> => {
		await this.decide(
			approval,
			approval.requiresResponse ? "respond" : "submit",
			parameters,
		);
	};
	reject = async (approval: PendingToolApproval): Promise<void> => {
		await this.decide(approval, "reject");
	};

	private async decide(
		approval: PendingToolApproval,
		decision: "submit" | "reject" | "respond",
		parameters?: Record<string, unknown>,
	): Promise<void> {
		const action = approval.actionId
			? this.actions.get(approval.actionId)
			: undefined;
		if (!action || action.runId !== approval.runId)
			throw new Error(
				"This approval is no longer pending. Reconnect to refresh the run.",
			);
		if (this.decidingActions.has(action.actionId)) return;
		this.decidingActions.add(action.actionId);
		try {
			await decideRunAction(
				this.config.insightId,
				action,
				decision,
				parameters,
			);
			this.decidedActions.add(action.actionId);
			this.lastReconcileKey = "";
			this.lastChildrenRead = 0;
			this.render();
			this.wake?.();
			this.observe();
		} finally {
			this.decidingActions.delete(action.actionId);
		}
	}

	cancel = async (): Promise<void> => {
		this.cancelRequested = true;
		if (this.cancelling) return this.cancelling;
		if (!this.run) {
			this.update({ isCancelling: true });
			return;
		}
		this.cancelling = this.stopRuns();
		try {
			await this.cancelling;
		} finally {
			this.cancelling = null;
		}
	};

	private async stopRuns(): Promise<void> {
		if (!this.run) return;
		this.update({ isCancelling: true });
		try {
			await cancelRun(this.config.insightId, this.run.runId);
			await this.refreshChildren();
			for (const child of this.children.values()) {
				if (!isTerminalRun(child))
					await cancelRun(this.config.insightId, child.runId);
			}
			this.lastChildrenRead = 0;
			this.wake?.();
			this.observe();
		} catch (cause) {
			this.update({ transportError: toError(cause) });
			throw toError(cause);
		} finally {
			this.update({ isCancelling: false });
		}
	}

	/** Stop local observation on eviction; backend cancellation is always explicit. */
	dispose(): void {
		this.disposed = true;
		this.wake?.();
		this.listeners.clear();
	}
}

function isWaitingOnPerson(run: AgentRun): boolean {
	return run.executorType === "HUMAN" && run.status === "INPUT_REQUIRED";
}
