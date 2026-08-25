import type {
	AgentRunItemEvent,
	AgentRunSnapshot,
	AgentRunSubscription,
} from "@semoss/sdk/react";
import {
	decideAgentRunAction,
	getAgentRun,
	getSubagentRuns,
	runAgent,
	stopAgentRun,
	subscribeRunAgent,
	uploadInsight,
} from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import type {
	ConversationRoom,
	PlaygroundMessage,
	RoomMcpEntry,
} from "@/api/rooms";
import {
	compactRoomMessages,
	createWorkbenchRoom,
	getDefaultWorkbenchAssistantModel,
	getPlaygroundMessages,
	getRoomOptions,
	getUserConversationRooms,
	renameRoom as renameRoomPixel,
	resolveWorkbenchAssistantModel,
	setRoomForInsight,
	updateRoomOptions,
} from "@/api/rooms";
import type { WorkbenchSlice } from "../workbench.types";
import type {
	BuildAttachment,
	BuildRun,
	RunStore,
	WorkbenchRunRecord,
} from "./workbench-assistant.runs";
import {
	applyStreamBatch,
	attachDurableMessages,
	createBuildRunFromRecord,
	createEmptyRunStore,
	isTerminalAgentRunStatus,
	mergeDurableRun,
	projectDurableRoom,
	setRoomRuns,
	startRun,
	subagentSummaryToRecord,
} from "./workbench-assistant.runs";
import type { RoomUsageStats } from "./workbench-assistant.usage";
import {
	calculateRoomUsage,
	findLatestCompactableResponseId,
} from "./workbench-assistant.usage";
import { parseSlashCommands } from "./workbench-assistant-commands";

/** Turn budget used when none is configured. */
const DEFAULT_MAX_TURNS = 30;

/** Character budget for the client-derived room name on the first turn. */
const AUTO_NAME_MAX_LENGTH = 60;

/** Delay between streaming polls while a run is in flight. */
const POLL_INTERVAL_MS = 300;

/**
 * Agent (workspace) every workbench assistant run executes under — the backend's
 * app-builder agent record. Sent as the RunAgent pixel's workspaceId.
 */
const WORKBENCH_AGENT_ID = "app-builder";

/** Permission mode forwarded to the agent harness for each run. */
export type WorkbenchAssistantPermissionMode =
	| "default"
	| "acceptEdits"
	| "plan"
	| "bypassPermissions";

/** Reasoning-effort level forwarded to the model provider for each run. */
export type WorkbenchAssistantEffort = "low" | "medium" | "high" | "max";

/**
 * The pixel value for a reasoning-effort level — the harness names the top
 * tier "xhigh" while the UI calls it "max".
 *
 * @name effortParamValue
 * @param effort - The user-facing effort level.
 * @return The value the harness expects.
 */
const effortParamValue = (effort: WorkbenchAssistantEffort): string =>
	effort === "max" ? "xhigh" : effort;

/** Configuration each workbench injects for its ASSISTANT panel. */
export interface WorkbenchAssistantConfig {
	/** System prompt sent to the assistant. */
	systemPrompt?: string;
	/** Prepare the bound room's tools before an agent run starts. */
	prepareRoom?: (insightId: string) => Promise<void>;
	/**
	 * MCP servers persisted onto the room's options before each run (e.g. a
	 * project workbench exposing the project's own tools). An alternative to
	 * prepareRoom — a workbench must provide at least one of the two.
	 */
	mcp?: RoomMcpEntry[];
	/**
	 * Harness parameters merged into every run's paramValues — e.g.
	 * { project: projectId } so the semoss harness scopes file tools and the
	 * git-commit hook to the project.
	 */
	runParams?: Record<string, unknown>;
	/** Default permission mode for runs; the user can change it in settings. */
	permissionMode?: WorkbenchAssistantPermissionMode | null;
	/**
	 * Called after a root run reaches a terminal status and its durable
	 * reconcile lands, with the run and the full run map (so the workbench can
	 * scan subagent activity too — e.g. to refresh a preview after a publish).
	 */
	onRunCompleted?: (run: BuildRun, runs: Record<string, BuildRun>) => void;
	/**
	 * Manually rebuild the artifact this workbench previews (e.g. compile and
	 * publish the app). When set, the assistant header shows a rebuild button;
	 * failures it throws surface as an error toast.
	 */
	onRebuild?: () => Promise<void>;
}

/** Transient system feedback rendered inline on the Build tab timeline. */
export interface WorkbenchAssistantNotice {
	/** Store-unique id used for dismissal. */
	id: string;
	/** Notice text shown to the user. */
	text: string;
	/** Visual tone of the notice. */
	tone: "info" | "error";
	/** When the notice was raised. */
	timestamp: string;
}

/** Namespaced domain state contributed by the base assistant slice. */
export interface WorkbenchAssistantSliceState {
	assistant: {
		/** Insight the room and every agent pixel is scoped to. */
		insightId: string | null;
		/** Room the conversation is bound to, once created or resumed. */
		roomId: string | null;
		/** Display name of the current room, when known. */
		roomName: string | null;
		/** True while the room and default model are being created. */
		isInitializing: boolean;
		/** Failure message when initialization did not complete. */
		initError: string | null;

		/** System prompt sent to the assistant for this workbench's ASSISTANT panel. */
		systemPrompt: string;
		/** Prepare the bound room's tools before an agent run starts. */
		prepareRoom: ((insightId: string) => Promise<void>) | null;
		/** MCP servers persisted onto the room's options before each run. */
		mcp: RoomMcpEntry[];
		/** Harness parameters merged into every run's paramValues. */
		runParams: Record<string, unknown>;
		/** Called after a root run reaches a terminal status and reconciles. */
		onRunCompleted:
			| ((run: BuildRun, runs: Record<string, BuildRun>) => void)
			| null;
		/** Rebuild action surfaced as a assistant-header button when set. */
		onRebuild: (() => Promise<void>) | null;

		/** Model engine used for new runs. */
		model: Engine | null;
		/** Turn budget passed to RunAgent. */
		maxTurns: number;
		/** Permission mode for new runs; null defers to the harness default. */
		permissionMode: WorkbenchAssistantPermissionMode | null;
		/** Reasoning effort for new runs; null defers to the model default. */
		effort: WorkbenchAssistantEffort | null;
		/** Extended thinking for new runs; null defers to the model default. */
		thinking: boolean | null;

		/** Every known run (roots and subagents) keyed by run id. */
		runs: Record<string, BuildRun>;
		/** Ordered root run ids for the current room. */
		roomRunIds: string[];
		/** Root run currently streaming, or null when the room is idle. */
		activeRunId: string | null;
		/** True while submit() is uploading files and starting the run. */
		isSending: boolean;
		/** Transient notices rendered inline on the timeline. */
		notices: WorkbenchAssistantNotice[];
		/** Aggregated token usage for the room, when loaded. */
		usage: RoomUsageStats | null;
		/** True while refreshUsage() is loading messages. */
		isLoadingUsage: boolean;

		/** The user's conversation rooms for this workbench. */
		conversations: ConversationRoom[];
		/** True while loadConversations() is fetching. */
		isLoadingConversations: boolean;

		/**
		 * Create the mount-scoped room + default model for the given
		 * insightId (idempotent per insight: repeat calls return the same
		 * promise). Resets the runtime and run store first; failures land in
		 * `initError`. Resolves when initialization settles.
		 */
		initialize: (insightId: string) => Promise<void>;
		/** Abort every live watcher (view unmount / insight change). */
		dispose: () => void;
		/**
		 * Update one or more assistant config fields (systemPrompt, prepareRoom,
		 * mcp, runParams, permissionMode, onRunCompleted) for this workbench
		 * instance; omitted fields keep their values.
		 */
		configure: (config: WorkbenchAssistantConfig) => void;
		/**
		 * Send a prompt with optional image files: applies any leading slash
		 * commands (/effort, /thinking, /mode, /compact — see
		 * workbench-assistant-commands.ts), uploads the files, persists room
		 * options, starts the durable run, and drains its stream to
		 * completion. Failures surface as error notices. Resolves true when
		 * a run was started or commands were applied, false when nothing
		 * happened (so the composer restores the draft).
		 */
		submit: (prompt: string, files?: File[]) => Promise<boolean>;
		/**
		 * Approve or reject the pending action `actionId` on run `runId`,
		 * then reconcile the run so a resumed stream is re-watched. Resolves
		 * when the decision has been applied.
		 */
		decideAction: (
			runId: string,
			actionId: string,
			decision: "approve" | "reject",
		) => Promise<void>;
		/**
		 * Answer the pending RequestUserInput action `actionId` on run
		 * `runId` with answers keyed by question id, then reconcile the run.
		 * Resolves when the response has been applied.
		 */
		respondUserInput: (
			runId: string,
			actionId: string,
			answers: Record<string, string | string[] | boolean>,
		) => Promise<void>;
		/**
		 * Merge the durable record for run `runId` into the store (lazy
		 * subagent hydration). Failures are logged, not surfaced. Resolves
		 * when the fetch settles.
		 */
		fetchRun: (runId: string) => Promise<void>;
		/**
		 * Fetch + merge run `runId` and, when it resumed running, mark it
		 * active (root runs only) and re-attach its stream watcher. Resolves
		 * once the durable fetch settles; the watcher drains in the
		 * background.
		 */
		reconcileRun: (runId: string) => Promise<void>;
		/**
		 * Abandon the current room and create a fresh one, clearing runs,
		 * notices, and usage. Failures surface as error notices. Resolves
		 * when the new room exists.
		 */
		newRoom: () => Promise<void>;
		/**
		 * Load the user's conversation rooms for this workbench into
		 * `conversations`. Failures are logged, not surfaced. Resolves when
		 * the fetch settles.
		 */
		loadConversations: () => Promise<void>;
		/**
		 * Switch to room `roomId`: bind it to the insight, adopt its
		 * persisted model, project its durable runs + messages, and
		 * reconnect watchers for every nonterminal run. No-op when already
		 * on the room. Resolves when the room is projected.
		 */
		resumeRoom: (roomId: string) => Promise<void>;
		/**
		 * Rename room `roomId` to `name` (trimmed) and update local state.
		 * Throws when uninitialized or the name is blank. Resolves when the
		 * rename is persisted.
		 */
		renameRoom: (roomId: string, name: string) => Promise<void>;
		/** Set the model engine used for new runs. */
		setModel: (model: Engine) => void;
		/** Set the turn budget; invalid values fall back to the default. */
		setMaxTurns: (maxTurns: number) => void;
		/** Set the permission mode for new runs (null = harness default). */
		setPermissionMode: (
			permissionMode: WorkbenchAssistantPermissionMode | null,
		) => void;
		/** Set the reasoning effort for new runs (null = model default). */
		setEffort: (effort: WorkbenchAssistantEffort | null) => void;
		/** Set extended thinking for new runs (null = model default). */
		setThinking: (thinking: boolean | null) => void;
		/**
		 * Cancel the active run (StopAgentRun). The run's stream observes the
		 * CANCELLED status and reconciles; failures surface as error notices.
		 * Resolves when the stop request has been applied.
		 */
		stop: () => Promise<void>;
		/**
		 * Recompute `usage` from the room's durable messages. Failures are
		 * logged, not surfaced. Resolves when the refresh settles.
		 */
		refreshUsage: () => Promise<void>;
		/**
		 * Compact the room's history up to the latest compactable response
		 * and refresh usage; outcome is reported via notices. Resolves when
		 * compaction settles.
		 */
		compact: () => Promise<void>;
		/** Remove the notice with the given id from the timeline. */
		dismissNotice: (id: string) => void;
	};
}

/**
 * User-facing headline for a failed run. Max-turns (the common, user-fixable
 * case) gets actionable guidance; cancellation and anything else surface the
 * backend reason so the cause isn't hidden.
 *
 * @name buildRunFailureMessage
 * @param record - Final run status and backend error message.
 * @param maxTurns - Turn budget the run was started with, quoted in the
 * max-turns guidance.
 * @return The notice text to show the user.
 */
const buildRunFailureMessage = (
	record: Pick<WorkbenchRunRecord, "status" | "errorMessage">,
	maxTurns: number,
): string => {
	const detail = record.errorMessage?.trim() ?? "";
	if (/max turns/i.test(detail)) {
		return `The assistant stopped after reaching its limit of ${maxTurns} turns before completing your request. Send "continue" to keep going, or raise the limit in the assistant settings.`;
	}
	if (record.status?.trim().toUpperCase() === "CANCELLED") {
		return detail
			? `The assistant run was cancelled: ${detail}`
			: "The assistant run was cancelled.";
	}
	return detail
		? `The assistant didn't finish your request: ${detail}`
		: "The assistant didn't finish your request. Please try again.";
};

/**
 * Extract a display message from a thrown value.
 *
 * @name toErrorMessage
 * @param error - Thrown value of any shape.
 * @return The Error's message, or the value coerced to a string.
 */
const toErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

/**
 * Creates the base `assistant` slice merged into every workbench store: the
 * workbench-injected system prompt and room preparation plus the full RunAgent
 * runtime — durable run projections fed by the agentRunStreaming poll loop,
 * conversation history, and room usage.
 *
 * @name createWorkbenchAssistantSlice
 * @param workbenchId - Engine/workbench id persisted onto room options to scope conversation history.
 * @return Zustand state creator contributing the `assistant` key to the workbench store.
 */
export const createWorkbenchAssistantSlice = (
	workbenchId: string,
): WorkbenchSlice<WorkbenchAssistantSliceState> => {
	// Runtime owned by this store instance, deliberately outside reactive
	// state. Each entry pairs the live SDK subscription (for pokeNow/stop)
	// with a promise that resolves at the run's first pause or terminal
	// status — what submit() awaits before reporting the outcome.
	const activeWatchers = new Map<
		string,
		{
			subscription: AgentRunSubscription;
			promise: Promise<AgentRunSnapshot>;
		}
	>();
	let abortController = new AbortController();
	let initialization: { insightId: string; promise: Promise<void> } | null =
		null;
	let noticeCounter = 0;

	return (set, get) => {
		/**
		 * Shallow-merge a partial update into the `assistant` slice state.
		 *
		 * @name setAssistant
		 * @param partial - Assistant state fields to overwrite.
		 */
		const setAssistant = (
			partial: Partial<WorkbenchAssistantSliceState["assistant"]>,
		): void => {
			set((state) => ({ assistant: { ...state.assistant, ...partial } }));
		};

		/**
		 * Apply a pure RunStore transition to the run fields (`runs`,
		 * `roomRunIds`, `activeRunId`) of the assistant state.
		 *
		 * @name updateRunStore
		 * @param transition - Pure function from the current RunStore to the
		 * next one.
		 */
		const updateRunStore = (transition: (store: RunStore) => RunStore) => {
			set((state) => {
				const next = transition({
					runs: state.assistant.runs,
					roomRunIds: state.assistant.roomRunIds,
					activeRunId: state.assistant.activeRunId,
				});
				return { assistant: { ...state.assistant, ...next } };
			});
		};

		/**
		 * Append a transient notice to the timeline.
		 *
		 * @name pushNotice
		 * @param text - Notice text shown to the user.
		 * @param tone - Visual tone; defaults to "info".
		 */
		const pushNotice = (text: string, tone: "info" | "error" = "info") => {
			noticeCounter += 1;
			const notice: WorkbenchAssistantNotice = {
				id: `notice-${noticeCounter}`,
				text,
				tone,
				timestamp: new Date().toISOString(),
			};
			set((state) => ({
				assistant: {
					...state.assistant,
					notices: [...state.assistant.notices, notice],
				},
			}));
		};

		/**
		 * Abort every live watcher and arm a fresh AbortController so new
		 * watchers can be attached (new room, resume, re-initialize).
		 *
		 * @name resetRuntime
		 */
		const resetRuntime = () => {
			abortController.abort();
			abortController = new AbortController();
			activeWatchers.clear();
		};

		/**
		 * Attach (or dedup onto) the SDK stream subscription for a run,
		 * wiring poll batches and durable reconciles into the run store and
		 * recursively subscribing to discovered subagent runs. The
		 * subscription keeps polling through INPUT_REQUIRED (at the SDK's
		 * slower pause interval), so a decision resumes the same stream — no
		 * re-attach needed. Rejects when the assistant is not initialized.
		 *
		 * @name attachWatcher
		 * @param runId - Durable id of the run to watch.
		 * @param knownChildRunIds - Child run ids to watch immediately.
		 * @return A promise resolving at the run's first pause
		 * (INPUT_REQUIRED) or terminal status with the snapshot observed
		 * there; polling continues past a pause resolution.
		 */
		const attachWatcher = (
			runId: string,
			knownChildRunIds?: string[],
		): Promise<AgentRunSnapshot> => {
			const existing = activeWatchers.get(runId);
			if (existing) return existing.promise;

			const insightId = get().assistant.insightId;
			if (!insightId) {
				return Promise.reject(
					new Error("Assistant is not initialized"),
				);
			}

			// Assigned synchronously by the Promise executor below.
			let resolvePause: (snapshot: AgentRunSnapshot) => void = () =>
				undefined;
			const pausePromise = new Promise<AgentRunSnapshot>((resolve) => {
				resolvePause = resolve;
			});

			/**
			 * Mount a watcher for a discovered subagent run unless one is
			 * live or the child is already terminal and reconciled.
			 *
			 * @name watchChild
			 * @param childRunId - Durable id of the child run to watch.
			 */
			const watchChild = (childRunId?: string) => {
				if (!childRunId || childRunId === runId) return;
				if (activeWatchers.has(childRunId)) return;
				const child = get().assistant.runs[childRunId];
				if (
					child &&
					isTerminalAgentRunStatus(child.status) &&
					child.reconciled
				) {
					return;
				}
				void attachWatcher(childRunId, child?.childRunIds).catch(
					(error) => {
						console.warn(
							`Unable to watch subagent run ${childRunId}:`,
							error,
						);
					},
				);
			};

			// Children already known (e.g. from a resumed room) drain
			// immediately rather than waiting to be rediscovered.
			(knownChildRunIds ?? []).forEach(watchChild);

			// Events buffered between polls; the SDK fires onEvent per event
			// and onSnapshot once per successful poll (after its events), so
			// flushing here reconstitutes the poll batch — one store update
			// per poll instead of one per event.
			let pendingEvents: AgentRunItemEvent[] = [];

			const subscription = subscribeRunAgent(
				runId,
				{
					onEvent: (event) => {
						pendingEvents.push(event);
					},
					onSnapshot: (snapshot, meta) => {
						const events = pendingEvents;
						pendingEvents = [];
						updateRunStore((store) =>
							applyStreamBatch(store, {
								runId,
								snapshot: {
									...snapshot,
									// The streaming snapshot omits the field
									// outside INPUT_REQUIRED — [] clears any
									// pending actions a decision resolved.
									pendingActions:
										snapshot.pendingActions ?? [],
								},
								events,
								droppedEvents: meta.droppedEvents,
							}),
						);
						for (const event of events) {
							if (
								event.type !== "item.updated" &&
								event.item.kind === "subagent"
							) {
								watchChild(event.item.childRunId);
							}
						}
						get().assistant.runs[runId]?.childRunIds.forEach(
							watchChild,
						);
						if (snapshot.status === "INPUT_REQUIRED") {
							resolvePause(snapshot);
						}
					},
					onReconcile: (record) => {
						const projected = createBuildRunFromRecord(record);
						attachDurableMessages(
							{ [runId]: projected },
							(record.messages ?? []) as PlaygroundMessage[],
						);
						updateRunStore((store) =>
							mergeDurableRun(store, {
								record,
								messages: projected.messages,
								tools: projected.tools,
								reconciled: true,
							}),
						);
						if (!isTerminalAgentRunStatus(record.status)) return;

						const assistant = get().assistant;
						const run = assistant.runs[runId];
						if (
							run &&
							!run.parentRunId &&
							assistant.onRunCompleted
						) {
							try {
								assistant.onRunCompleted(run, assistant.runs);
							} catch (error) {
								console.warn(
									"onRunCompleted handler failed:",
									error,
								);
							}
						}
					},
					onError: (error) => {
						console.warn(`Agent run stream ${runId}:`, error);
					},
				},
				{
					pollIntervalMs: POLL_INTERVAL_MS,
					signal: abortController.signal,
				},
			);

			// First pause or terminal, whichever lands first. done never
			// rejects; a null last-snapshot (stopped before any poll) falls
			// back to a synthetic SUBMITTED snapshot.
			const promise = Promise.race([
				pausePromise,
				subscription.done.then(
					(snapshot) =>
						snapshot ?? {
							runId,
							roomId: get().assistant.roomId ?? "",
							status: "SUBMITTED" as const,
							pendingActions: [],
						},
				),
			]);

			activeWatchers.set(runId, { subscription, promise });
			void subscription.done.finally(() => {
				if (activeWatchers.get(runId)?.subscription === subscription) {
					activeWatchers.delete(runId);
				}
			});

			return promise;
		};

		/**
		 * Fetch the durable record (with messages) for a run, project its
		 * activity, and merge it into the run store as reconciled.
		 *
		 * @name fetchDurableRun
		 * @param runId - Durable id of the run to fetch.
		 * @return The durable record, or null when the assistant is not
		 * initialized or the run does not exist.
		 */
		const fetchDurableRun = async (
			runId: string,
		): Promise<
			(AgentRunSnapshot & { messages?: PlaygroundMessage[] }) | null
		> => {
			const insightId = get().assistant.insightId;
			if (!insightId) return null;

			const record = await getAgentRun<PlaygroundMessage>(
				runId,
				{ includeMessages: true },
				insightId,
			);
			if (!record) return null;

			const projected = createBuildRunFromRecord(record);
			attachDurableMessages(
				{ [runId]: projected },
				record.messages ?? [],
			);
			updateRunStore((store) =>
				mergeDurableRun(store, {
					record,
					messages: projected.messages,
					tools: projected.tools,
					reconciled: true,
				}),
			);
			return record;
		};

		return {
			assistant: {
				insightId: null,
				roomId: null,
				roomName: null,
				isInitializing: false,
				initError: null,

				systemPrompt: "",
				prepareRoom: null,
				mcp: [],
				runParams: {},
				onRunCompleted: null,
				onRebuild: null,

				model: null,
				maxTurns: DEFAULT_MAX_TURNS,
				permissionMode: null,
				effort: null,
				thinking: null,

				runs: {},
				roomRunIds: [],
				activeRunId: null,
				isSending: false,
				notices: [],
				usage: null,
				isLoadingUsage: false,

				conversations: [],
				isLoadingConversations: false,

				initialize: (insightId) => {
					if (initialization?.insightId === insightId) {
						return initialization.promise;
					}

					resetRuntime();
					setAssistant({
						insightId,
						isInitializing: true,
						initError: null,
						...createEmptyRunStore(),
					});

					const promise = (async () => {
						try {
							const [roomId, model] = await Promise.all([
								createWorkbenchRoom(insightId),
								get().assistant.model
									? Promise.resolve(get().assistant.model)
									: getDefaultWorkbenchAssistantModel(
											insightId,
										),
							]);
							setAssistant({
								roomId,
								roomName: null,
								model: model ?? get().assistant.model,
								isInitializing: false,
							});
						} catch (error) {
							initialization = null;
							setAssistant({
								isInitializing: false,
								initError: toErrorMessage(error),
							});
						}
					})();

					initialization = { insightId, promise };
					return promise;
				},

				dispose: () => {
					abortController.abort();
					activeWatchers.clear();
				},

				configure: (config) => {
					set((state) => ({
						assistant: { ...state.assistant, ...config },
					}));
				},

				submit: async (prompt, files = []) => {
					const assistant = get().assistant;
					if (
						!assistant.insightId ||
						!assistant.roomId ||
						assistant.isSending ||
						assistant.isInitializing
					) {
						return false;
					}

					// Apply slash commands and strip them from the outgoing
					// message before any send-readiness checks — a
					// commands-only submission needs no model or tools.
					const parsed = parseSlashCommands(prompt);
					const settingsPatch: Partial<
						WorkbenchAssistantSliceState["assistant"]
					> = {};
					if (parsed.effort !== undefined) {
						settingsPatch.effort = parsed.effort;
					}
					if (parsed.thinking !== undefined) {
						settingsPatch.thinking = parsed.thinking;
					}
					if (parsed.permissionMode !== undefined) {
						settingsPatch.permissionMode = parsed.permissionMode;
					}
					if (Object.keys(settingsPatch).length > 0) {
						setAssistant(settingsPatch);
					}
					for (const message of parsed.feedback) {
						pushNotice(message);
					}
					for (const message of parsed.errors) {
						pushNotice(message, "error");
					}
					if (parsed.compact) {
						if (get().assistant.activeRunId) {
							pushNotice(
								"Wait for the current run to finish before compacting.",
								"error",
							);
						} else {
							await get().assistant.compact();
						}
					}

					const command = parsed.text.trim();
					if (!command && files.length === 0) {
						// Nothing left to send; true when commands were
						// handled so the composer clears the draft.
						return (
							parsed.compact ||
							parsed.feedback.length > 0 ||
							parsed.errors.length > 0
						);
					}

					if (!assistant.model) {
						pushNotice(
							"Select a model in the assistant settings before sending.",
							"error",
						);
						return false;
					}
					if (!assistant.prepareRoom && assistant.mcp.length === 0) {
						pushNotice(
							"Room tools are not ready yet. Please try again.",
							"error",
						);
						return false;
					}

					const insightId = assistant.insightId;
					const roomId = assistant.roomId;
					const model = assistant.model;
					setAssistant({ isSending: true });

					try {
						let attachments: BuildAttachment[] = [];
						if (files.length > 0) {
							const uploadResponse = await uploadInsight(
								insightId,
								"",
								files,
							);
							attachments = uploadResponse.data.map((upload) => ({
								fileName: upload.fileName,
								fileLocation: upload.fileLocation,
							}));
						}

						if (assistant.prepareRoom) {
							await assistant.prepareRoom(insightId);
						}

						await updateRoomOptions(insightId, roomId, {
							instructions: get().assistant.systemPrompt,
							// Engine workbenches load tools from the room's MCP
							// file (prepareRoom); project workbenches pass their
							// MCP entries directly.
							mcp: get().assistant.mcp,
							predefinedPrompts: [],
							modelId: model.engine_id,
							harnessType: "semoss",
							workbench: workbenchId,
						});

						// Harness/run parameters: the workbench's static params
						// plus the user's run controls, omitting anything unset
						// so harness/model defaults apply. "ultrathink" in the
						// message one-shots maximum reasoning without changing
						// the saved settings.
						const assistantNow = get().assistant;
						const effectiveEffort = parsed.ultrathink
							? "max"
							: assistantNow.effort;
						const effectiveThinking = parsed.ultrathink
							? true
							: assistantNow.thinking;
						if (parsed.ultrathink) {
							pushNotice(
								"Ultrathink: maximum reasoning for this run.",
							);
						}
						const paramValues: Record<string, unknown> = {
							...assistantNow.runParams,
						};
						if (assistantNow.permissionMode) {
							paramValues.permissionMode =
								assistantNow.permissionMode;
						}
						if (effectiveThinking != null) {
							paramValues.thinking = effectiveThinking;
						}
						if (effectiveEffort) {
							paramValues.effort =
								effortParamValue(effectiveEffort);
						}

						const record = await runAgent(
							{
								roomId,
								command,
								engine: model.engine_id,
								harnessType: "semoss",
								// The SDK forwards agentId as the pixel's
								// workspaceId.
								agentId: WORKBENCH_AGENT_ID,
								maxTurns: get().assistant.maxTurns,
								maxReflections: 0,
								media: attachments
									.map(
										(attachment) => attachment.fileLocation,
									)
									.filter((path): path is string =>
										Boolean(path),
									),
								paramValues:
									Object.keys(paramValues).length > 0
										? paramValues
										: undefined,
							},
							insightId,
						);

						updateRunStore((store) =>
							startRun(store, {
								runId: record.runId,
								roomId: record.roomId ?? roomId,
								input: command,
								attachments,
								modelId: model.engine_id,
								harnessType: "semoss",
								status: record.status ?? "SUBMITTED",
							}),
						);
						const isFirstTurn =
							get().assistant.roomRunIds.length === 1;

						// The signal active when this run attached — the outer
						// abortController is re-armed on room switches, so the
						// captured one tells us whether THIS run was abandoned.
						const runSignal = abortController.signal;
						const finalSnapshot = await attachWatcher(record.runId);

						const finalStatus = (finalSnapshot.status ?? "")
							.trim()
							.toUpperCase();
						if (
							finalStatus === "FAILED" ||
							finalStatus === "CANCELLED"
						) {
							pushNotice(
								buildRunFailureMessage(
									finalSnapshot,
									get().assistant.maxTurns,
								),
								"error",
							);
						} else if (
							(finalStatus === "SUBMITTED" ||
								finalStatus === "RUNNING") &&
							!runSignal.aborted
						) {
							// The stream ended without the run pausing or
							// finishing — the poll transport gave up.
							pushNotice(
								"Lost connection to the assistant run stream. The run may still be executing — resume this conversation to reconnect.",
								"error",
							);
						}

						if (isFirstTurn) {
							// Client-derived name (dev's pattern) — there is no
							// server-side name-generation reactor.
							const autoName = command
								.replace(/\s+/g, " ")
								.trim()
								.slice(0, AUTO_NAME_MAX_LENGTH);
							if (autoName) {
								void renameRoomPixel(
									insightId,
									roomId,
									autoName,
								)
									.then(() => {
										set((state) => ({
											assistant: {
												...state.assistant,
												roomName:
													state.assistant.roomId ===
													roomId
														? autoName
														: state.assistant
																.roomName,
												conversations:
													state.assistant.conversations.map(
														(room) =>
															room.roomId ===
															roomId
																? {
																		...room,
																		roomName:
																			autoName,
																	}
																: room,
													),
											},
										}));
									})
									.catch((error) => {
										console.warn(
											"RenameRoom failed:",
											error,
										);
									});
							}
						}

						void get().assistant.refreshUsage();
						return true;
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
						return false;
					} finally {
						setAssistant({ isSending: false });
					}
				},

				decideAction: async (runId, actionId, decision) => {
					const insightId = get().assistant.insightId;
					if (!insightId) return;

					await decideAgentRunAction(
						{ actionId, decision },
						insightId,
					);
					// The live subscription is still polling through the
					// pause — poke it to pick the resumed run up immediately.
					// Without one (stale pause from a resumed room), fall back
					// to a reconcile, which re-attaches the stream.
					const watcher = activeWatchers.get(runId);
					if (watcher) {
						watcher.subscription.pokeNow();
					} else {
						await get().assistant.reconcileRun(runId);
					}
				},

				respondUserInput: async (runId, actionId, answers) => {
					const insightId = get().assistant.insightId;
					if (!insightId) return;

					await decideAgentRunAction(
						{
							actionId,
							decision: "respond",
							mcpToolResult: JSON.stringify(answers),
						},
						insightId,
					);
					const watcher = activeWatchers.get(runId);
					if (watcher) {
						watcher.subscription.pokeNow();
					} else {
						await get().assistant.reconcileRun(runId);
					}
				},

				fetchRun: async (runId) => {
					try {
						await fetchDurableRun(runId);
					} catch (error) {
						console.warn(
							`Unable to fetch agent run ${runId}:`,
							error,
						);
					}
				},

				reconcileRun: async (runId) => {
					try {
						const record = await fetchDurableRun(runId);
						if (!record) return;
						if (isTerminalAgentRunStatus(record.status)) return;

						// Still live (running or paused) — make sure it is the
						// active run again (root runs only) and that a stream
						// subscription is attached; attachWatcher dedups onto
						// any existing one.
						const run = get().assistant.runs[runId];
						if (run && !run.parentRunId) {
							setAssistant({ activeRunId: runId });
						}
						void attachWatcher(runId, run?.childRunIds).catch(
							(error) => {
								console.warn(
									`Unable to reconnect agent run stream ${runId}:`,
									error,
								);
							},
						);
					} catch (error) {
						console.warn(
							`Unable to reconcile agent run ${runId}:`,
							error,
						);
					}
				},

				newRoom: async () => {
					const insightId = get().assistant.insightId;
					if (!insightId) return;

					resetRuntime();
					setAssistant({
						...createEmptyRunStore(),
						roomId: null,
						roomName: null,
						notices: [],
						usage: null,
						isSending: false,
					});

					try {
						const roomId = await createWorkbenchRoom(insightId);
						setAssistant({ roomId });
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
					}
				},

				loadConversations: async () => {
					const insightId = get().assistant.insightId;
					if (!insightId) return;

					setAssistant({ isLoadingConversations: true });
					try {
						const conversations = await getUserConversationRooms(
							insightId,
							workbenchId,
						);
						setAssistant({ conversations });
					} catch (error) {
						console.warn(
							"Failed to load conversation history:",
							error,
						);
					} finally {
						setAssistant({ isLoadingConversations: false });
					}
				},

				resumeRoom: async (roomId) => {
					const insightId = get().assistant.insightId;
					if (!insightId || get().assistant.roomId === roomId) return;

					resetRuntime();
					const roomName =
						get().assistant.conversations.find(
							(room) => room.roomId === roomId,
						)?.roomName ?? null;
					setAssistant({
						...createEmptyRunStore(),
						roomId,
						roomName,
						notices: [],
						usage: null,
						isSending: false,
					});

					try {
						await setRoomForInsight(insightId, roomId);

						// Adopt the room's persisted model when it differs and resolves.
						const options = await getRoomOptions(
							insightId,
							roomId,
						).catch(() => null);
						const persistedModelId =
							typeof options?.modelId === "string"
								? options.modelId
								: "";
						if (
							persistedModelId &&
							persistedModelId !==
								get().assistant.model?.engine_id
						) {
							const model = await resolveWorkbenchAssistantModel(
								insightId,
								persistedModelId,
							).catch(() => null);
							if (model) setAssistant({ model });
						}

						const messages = await getPlaygroundMessages(
							insightId,
							roomId,
						);

						// There is no list-runs-for-room API; root runs are
						// recovered from the agentRunId ornament the backend
						// stamps onto each run's persisted messages.
						const rootRunIds: string[] = [];
						for (const message of messages) {
							const runId = message.ornaments?.agentRunId;
							if (runId && !rootRunIds.includes(runId)) {
								rootRunIds.push(runId);
							}
						}

						const childrenByParent: Record<
							string,
							WorkbenchRunRecord[]
						> = {};
						const records = await Promise.all(
							rootRunIds.map(
								async (runId): Promise<WorkbenchRunRecord> => {
									const [snapshot, children] =
										await Promise.all([
											getAgentRun(
												runId,
												{ includeMessages: false },
												insightId,
											).catch(() => null),
											getSubagentRuns(
												runId,
												insightId,
											).catch(() => []),
										]);
									childrenByParent[runId] = children.map(
										subagentSummaryToRecord,
									);

									// The snapshot carries no input/creation
									// time; both come from the run's durable
									// INPUT message.
									const inputMessage =
										messages.find(
											(message) =>
												message.messageId &&
												message.messageId ===
													snapshot?.inputMessageId,
										) ??
										messages.find(
											(message) =>
												message.io === "INPUT" &&
												message.ornaments
													?.agentRunId === runId,
										);
									const inputText = inputMessage?.parts?.find(
										(part) =>
											part.type === "TEXT" && part.text,
									)?.text;

									return {
										...(snapshot ?? {}),
										runId,
										input: inputText ?? "",
										dateCreated: inputMessage?.dateCreated,
									};
								},
							),
						);

						const projected = projectDurableRoom({
							records,
							messages,
							childrenByParent,
						});
						updateRunStore((store) =>
							setRoomRuns(store, { roomId, ...projected }),
						);

						// Reconnect every nonterminal run. The watcher registry
						// guarantees one drain consumer per run even when a child is
						// also discovered through its parent's live stream.
						for (const run of projected.runs) {
							if (isTerminalAgentRunStatus(run.status)) continue;
							void attachWatcher(
								run.runId,
								run.childRunIds,
							).catch((error) => {
								console.warn(
									`Unable to reconnect agent run stream ${run.runId}:`,
									error,
								);
							});
						}

						void get().assistant.refreshUsage();
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
					}
				},

				renameRoom: async (roomId, name) => {
					const insightId = get().assistant.insightId;
					const trimmed = name.trim();
					if (!insightId || !trimmed) {
						throw new Error("Room name is required");
					}

					await renameRoomPixel(insightId, roomId, trimmed);
					set((state) => ({
						assistant: {
							...state.assistant,
							roomName:
								state.assistant.roomId === roomId
									? trimmed
									: state.assistant.roomName,
							conversations: state.assistant.conversations.map(
								(room) =>
									room.roomId === roomId
										? { ...room, roomName: trimmed }
										: room,
							),
						},
					}));
				},

				setModel: (model) => setAssistant({ model }),
				setMaxTurns: (maxTurns) =>
					setAssistant({
						maxTurns:
							Number.isFinite(maxTurns) && maxTurns > 0
								? Math.floor(maxTurns)
								: DEFAULT_MAX_TURNS,
					}),
				setPermissionMode: (permissionMode) =>
					setAssistant({ permissionMode }),
				setEffort: (effort) => setAssistant({ effort }),
				setThinking: (thinking) => setAssistant({ thinking }),

				stop: async () => {
					const { insightId, activeRunId } = get().assistant;
					if (!insightId || !activeRunId) return;

					try {
						await stopAgentRun(activeRunId, insightId);
						// The stream observes the CANCELLED snapshot on its
						// next poll — poke it so the UI settles immediately.
						activeWatchers.get(activeRunId)?.subscription.pokeNow();
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
					}
				},

				refreshUsage: async () => {
					const { insightId, roomId } = get().assistant;
					if (!insightId || !roomId) return;

					setAssistant({ isLoadingUsage: true });
					try {
						const messages = await getPlaygroundMessages(
							insightId,
							roomId,
						);
						setAssistant({ usage: calculateRoomUsage(messages) });
					} catch (error) {
						console.warn("Failed to refresh room usage:", error);
					} finally {
						setAssistant({ isLoadingUsage: false });
					}
				},

				compact: async () => {
					const { insightId, roomId } = get().assistant;
					if (!insightId || !roomId) return;

					try {
						const messages = await getPlaygroundMessages(
							insightId,
							roomId,
						);
						const parentMessageId =
							findLatestCompactableResponseId(messages);
						if (!parentMessageId) {
							pushNotice(
								"Nothing to compact yet — send a message first.",
							);
							return;
						}

						const results = await compactRoomMessages(
							insightId,
							roomId,
							parentMessageId,
						);
						const failed = results.filter(
							(result) => !result.success,
						);
						if (failed.length > 0) {
							pushNotice(
								`Compaction finished with issues: ${failed
									.map(
										(result) => result.error ?? result.type,
									)
									.join(", ")}`,
								"error",
							);
						} else {
							pushNotice("Room context compacted.");
						}
						void get().assistant.refreshUsage();
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
					}
				},

				dismissNotice: (id) => {
					set((state) => ({
						assistant: {
							...state.assistant,
							notices: state.assistant.notices.filter(
								(notice) => notice.id !== id,
							),
						},
					}));
				},
			},
		};
	};
};
