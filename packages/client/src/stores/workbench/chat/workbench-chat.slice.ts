import type {
	AgentRunRecord,
	AgentRunStreamSnapshot,
	ConversationRoom,
} from "@semoss/sdk/react";
import {
	compactRoomMessages,
	decideAgentAction,
	generateRoomName,
	getAgentRun,
	getAgentRunsForRoom,
	getPlaygroundMessages,
	getRoomOptions,
	getSubagentRuns,
	getUserConversationRooms,
	isTerminalAgentRunStatus,
	renameRoom as renameRoomPixel,
	respondToAgentUserInput,
	runAgent,
	setRoomForInsight,
	stopAgentRun,
	updateRoomOptions,
	uploadInsight,
} from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import {
	createWorkbenchRoom,
	getDefaultWorkbenchChatModel,
	resolveWorkbenchChatModel,
} from "@/api/rooms";
import type { WorkbenchSlice } from "../workbench.types";
import type {
	BuildAttachment,
	BuildRun,
	RunStore,
} from "./workbench-chat.runs";
import {
	applyStreamBatch,
	attachDurableMessages,
	createBuildRunFromRecord,
	createEmptyRunStore,
	mergeDurableRun,
	projectDurableRoom,
	setRoomRuns,
	startRun,
} from "./workbench-chat.runs";
import { REQUEST_USER_INPUT_TOOL } from "./workbench-chat.tools";
import type { RoomUsageStats } from "./workbench-chat.usage";
import {
	calculateRoomUsage,
	findLatestCompactableResponseId,
} from "./workbench-chat.usage";
import { watchAgentRun } from "./workbench-chat.watcher";

/** Turn budget used when none is configured. */
const DEFAULT_MAX_TURNS = 30;

/** Reasoning effort levels selectable in the chat settings. */
export type EffortLevel = "auto" | "low" | "medium" | "high" | "max";

/**
 * Map an effort level to the backend thinking-budget parameter.
 *
 * @name effortToThinkingBudget
 * @param level - Effort level selected in the chat settings.
 * @return The backend budget string ("max" becomes "xhigh"), or null for
 * "auto" so the backend picks its default.
 */
export const effortToThinkingBudget = (level: EffortLevel): string | null => {
	switch (level) {
		case "auto":
			return null;
		case "low":
			return "low";
		case "medium":
			return "medium";
		case "high":
			return "high";
		case "max":
			return "xhigh";
	}
};

/** Configuration each workbench injects for its CHAT panel. */
export interface WorkbenchChatConfig {
	/** System prompt sent to the assistant. */
	systemPrompt?: string;
	/** Prepare the bound room's tools before an agent run starts. */
	prepareRoom?: (insightId: string) => Promise<void>;
}

/** Transient system feedback rendered inline on the Build tab timeline. */
export interface WorkbenchChatNotice {
	/** Store-unique id used for dismissal. */
	id: string;
	/** Notice text shown to the user. */
	text: string;
	/** Visual tone of the notice. */
	tone: "info" | "error";
	/** When the notice was raised. */
	timestamp: string;
}

/** Namespaced domain state contributed by the base chat slice. */
export interface WorkbenchChatSliceState {
	chat: {
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

		/** System prompt sent to the assistant for this workbench's CHAT panel. */
		systemPrompt: string;
		/** Prepare the bound room's tools before an agent run starts. */
		prepareRoom: ((insightId: string) => Promise<void>) | null;

		/** Model engine used for new runs. */
		model: Engine | null;
		/** Turn budget passed to RunAgent. */
		maxTurns: number;
		/** Tool permission mode passed to RunAgent. */
		permissionMode: string;
		/** Reasoning effort level for new runs. */
		effort: EffortLevel;
		/** Whether extended thinking is enabled for new runs. */
		thinkingEnabled: boolean;

		/** Every known run (roots and subagents) keyed by run id. */
		runs: Record<string, BuildRun>;
		/** Ordered root run ids for the current room. */
		roomRunIds: string[];
		/** Root run currently streaming, or null when the room is idle. */
		activeRunId: string | null;
		/** True while submit() is uploading files and starting the run. */
		isSending: boolean;
		/** True while stop() is cancelling the active run. */
		isStoppingRun: boolean;
		/** Transient notices rendered inline on the timeline. */
		notices: WorkbenchChatNotice[];
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
		 * Update one or more chat config fields (systemPrompt, prepareRoom)
		 * for this workbench instance; omitted fields keep their values.
		 */
		configure: (config: WorkbenchChatConfig) => void;
		/**
		 * Send a prompt with optional image files: uploads the files,
		 * persists room options, starts the durable run, and drains its
		 * stream to completion. Failures surface as error notices. Resolves
		 * true when a run was started, false when nothing was sent.
		 */
		submit: (prompt: string, files?: File[]) => Promise<boolean>;
		/**
		 * Request cancellation of the active run. No-op when nothing is
		 * running; failures surface as error notices. Resolves when the
		 * cancellation request settles.
		 */
		stop: () => Promise<void>;
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
		/** Set the tool permission mode passed to RunAgent. */
		setPermissionMode: (permissionMode: string) => void;
		/** Set the reasoning effort level for new runs. */
		setEffort: (effort: EffortLevel) => void;
		/** Enable or disable extended thinking for new runs. */
		setThinking: (enabled: boolean) => void;
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
	record: Pick<AgentRunRecord, "status" | "errorMessage">,
	maxTurns: number,
): string => {
	const detail = record.errorMessage?.trim() ?? "";
	if (/max turns/i.test(detail)) {
		return `The agent stopped after reaching its limit of ${maxTurns} turns before completing your request. Send "continue" to keep going, or raise the limit in the Agent tab.`;
	}
	if (record.status?.trim().toUpperCase() === "CANCELLED") {
		return detail
			? `The agent run was cancelled: ${detail}`
			: "The agent run was cancelled.";
	}
	return detail
		? `The agent didn't finish your request: ${detail}`
		: "The agent didn't finish your request. Please try again.";
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
 * Creates the base `chat` slice merged into every workbench store: the
 * workbench-injected system prompt and room preparation plus the full RunAgent
 * runtime — durable run projections fed by the agentRunStreaming poll loop,
 * conversation history, and room usage.
 *
 * @name createWorkbenchChatSlice
 * @param workbenchId - Engine/workbench id persisted onto room options to scope conversation history.
 * @return Zustand state creator contributing the `chat` key to the workbench store.
 */
export const createWorkbenchChatSlice = (
	workbenchId: string,
): WorkbenchSlice<WorkbenchChatSliceState> => {
	// Runtime owned by this store instance, deliberately outside reactive state.
	const activeWatchers = new Map<string, Promise<AgentRunStreamSnapshot>>();
	let abortController = new AbortController();
	let initialization: { insightId: string; promise: Promise<void> } | null =
		null;
	let noticeCounter = 0;

	return (set, get) => {
		/**
		 * Shallow-merge a partial update into the `chat` slice state.
		 *
		 * @name setChat
		 * @param partial - Chat state fields to overwrite.
		 */
		const setChat = (
			partial: Partial<WorkbenchChatSliceState["chat"]>,
		): void => {
			set((state) => ({ chat: { ...state.chat, ...partial } }));
		};

		/**
		 * Apply a pure RunStore transition to the run fields (`runs`,
		 * `roomRunIds`, `activeRunId`) of the chat state.
		 *
		 * @name updateRunStore
		 * @param transition - Pure function from the current RunStore to the
		 * next one.
		 */
		const updateRunStore = (transition: (store: RunStore) => RunStore) => {
			set((state) => {
				const next = transition({
					runs: state.chat.runs,
					roomRunIds: state.chat.roomRunIds,
					activeRunId: state.chat.activeRunId,
				});
				return { chat: { ...state.chat, ...next } };
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
			const notice: WorkbenchChatNotice = {
				id: `notice-${noticeCounter}`,
				text,
				tone,
				timestamp: new Date().toISOString(),
			};
			set((state) => ({
				chat: {
					...state.chat,
					notices: [...state.chat.notices, notice],
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
		 * Attach (or dedup onto) the poll watcher for a run, wiring stream
		 * batches and durable reconciles into the run store. Rejects when
		 * the chat is not initialized.
		 *
		 * @name attachWatcher
		 * @param runId - Durable id of the run to watch.
		 * @param knownChildRunIds - Child run ids to watch immediately.
		 * @return The final run snapshot once the watcher drains.
		 */
		const attachWatcher = (
			runId: string,
			knownChildRunIds?: string[],
		): Promise<AgentRunStreamSnapshot> => {
			const insightId = get().chat.insightId;
			if (!insightId) {
				return Promise.reject(new Error("Chat is not initialized"));
			}
			return watchAgentRun({
				runId,
				insightId,
				signal: abortController.signal,
				activeWatchers,
				knownChildRunIds,
				applyBatch: (payload) => {
					updateRunStore((store) => applyStreamBatch(store, payload));
				},
				mergeDurable: (payload) => {
					updateRunStore((store) => mergeDurableRun(store, payload));
				},
				getRun: (id) => get().chat.runs[id],
			});
		};

		/**
		 * Fetch the durable record (with messages) for a run, project its
		 * activity, and merge it into the run store as reconciled.
		 *
		 * @name fetchDurableRun
		 * @param runId - Durable id of the run to fetch.
		 * @return The durable record, or null when the chat is not
		 * initialized or the run does not exist.
		 */
		const fetchDurableRun = async (
			runId: string,
		): Promise<AgentRunRecord | null> => {
			const insightId = get().chat.insightId;
			if (!insightId) return null;

			const record = await getAgentRun(insightId, runId, true);
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
			chat: {
				insightId: null,
				roomId: null,
				roomName: null,
				isInitializing: false,
				initError: null,

				systemPrompt: "",
				prepareRoom: null,

				model: null,
				maxTurns: DEFAULT_MAX_TURNS,
				permissionMode: "default",
				effort: "auto",
				thinkingEnabled: true,

				runs: {},
				roomRunIds: [],
				activeRunId: null,
				isSending: false,
				isStoppingRun: false,
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
					setChat({
						insightId,
						isInitializing: true,
						initError: null,
						...createEmptyRunStore(),
					});

					const promise = (async () => {
						try {
							const [roomId, model] = await Promise.all([
								createWorkbenchRoom(insightId),
								get().chat.model
									? Promise.resolve(get().chat.model)
									: getDefaultWorkbenchChatModel(insightId),
							]);
							setChat({
								roomId,
								roomName: null,
								model: model ?? get().chat.model,
								isInitializing: false,
							});
						} catch (error) {
							initialization = null;
							setChat({
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
					set((state) => ({ chat: { ...state.chat, ...config } }));
				},

				submit: async (prompt, files = []) => {
					const chat = get().chat;
					if (
						!chat.insightId ||
						!chat.roomId ||
						chat.isSending ||
						chat.isInitializing
					) {
						return false;
					}
					if (!chat.model) {
						pushNotice(
							"Select a model in the Agent tab before sending.",
							"error",
						);
						return false;
					}
					if (!chat.prepareRoom) {
						pushNotice(
							"Room tools are not ready yet. Please try again.",
							"error",
						);
						return false;
					}

					const command = prompt.trim();
					if (!command && files.length === 0) {
						return false;
					}

					const insightId = chat.insightId;
					const roomId = chat.roomId;
					const model = chat.model;
					setChat({ isSending: true });

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

						await chat.prepareRoom(insightId);

						await updateRoomOptions(insightId, roomId, {
							instructions: get().chat.systemPrompt,
							// Engine tools are loaded exclusively from the room's MCP file.
							mcp: [],
							predefinedPrompts: [],
							modelId: model.engine_id,
							harnessType: "semoss",
							workbench: workbenchId,
						});

						const thinking = get().chat.thinkingEnabled;
						const effortParam = thinking
							? effortToThinkingBudget(get().chat.effort)
							: null;

						const record = await runAgent(insightId, {
							roomId,
							engineId: model.engine_id,
							command,
							maxTurns: get().chat.maxTurns,
							paramValues: {
								permissionMode: get().chat.permissionMode,
								thinking,
								...(effortParam ? { effort: effortParam } : {}),
								// Platform control tool; engine tools come from the room MCP.
								tools: [REQUEST_USER_INPUT_TOOL],
							},
							image: attachments
								.map((attachment) => attachment.fileLocation)
								.filter((path): path is string =>
									Boolean(path),
								),
						});

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
						const isFirstTurn = get().chat.roomRunIds.length === 1;

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
									get().chat.maxTurns,
								),
								"error",
							);
						}

						if (isFirstTurn) {
							void generateRoomName(
								insightId,
								roomId,
								command,
								model.engine_id,
							)
								.then((name) => {
									if (!name) return;
									set((state) => ({
										chat: {
											...state.chat,
											roomName:
												state.chat.roomId === roomId
													? name
													: state.chat.roomName,
											conversations:
												state.chat.conversations.map(
													(room) =>
														room.roomId === roomId
															? {
																	...room,
																	roomName:
																		name,
																}
															: room,
												),
										},
									}));
								})
								.catch((error) => {
									console.warn(
										"GenerateRoomName failed:",
										error,
									);
								});
						}

						void get().chat.refreshUsage();
						return true;
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
						return false;
					} finally {
						setChat({ isSending: false });
					}
				},

				stop: async () => {
					const { insightId, activeRunId } = get().chat;
					if (!insightId || !activeRunId) return;

					setChat({ isStoppingRun: true });
					try {
						await stopAgentRun(insightId, activeRunId);
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
					} finally {
						setChat({ isStoppingRun: false });
					}
				},

				decideAction: async (runId, actionId, decision) => {
					const insightId = get().chat.insightId;
					if (!insightId) return;

					await decideAgentAction(insightId, actionId, decision);
					await get().chat.reconcileRun(runId);
				},

				respondUserInput: async (runId, actionId, answers) => {
					const insightId = get().chat.insightId;
					if (!insightId) return;

					await respondToAgentUserInput(insightId, actionId, answers);
					await get().chat.reconcileRun(runId);
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

						// The run resumed after a decision — make it active again
						// (root runs only) and re-attach its drain watcher.
						const run = get().chat.runs[runId];
						if (run && !run.parentRunId) {
							setChat({ activeRunId: runId });
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
					const insightId = get().chat.insightId;
					if (!insightId) return;

					resetRuntime();
					setChat({
						...createEmptyRunStore(),
						roomId: null,
						roomName: null,
						notices: [],
						usage: null,
						isSending: false,
						isStoppingRun: false,
					});

					try {
						const roomId = await createWorkbenchRoom(insightId);
						setChat({ roomId });
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
					}
				},

				loadConversations: async () => {
					const insightId = get().chat.insightId;
					if (!insightId) return;

					setChat({ isLoadingConversations: true });
					try {
						const conversations = await getUserConversationRooms(
							insightId,
							workbenchId,
						);
						setChat({ conversations });
					} catch (error) {
						console.warn(
							"Failed to load conversation history:",
							error,
						);
					} finally {
						setChat({ isLoadingConversations: false });
					}
				},

				resumeRoom: async (roomId) => {
					const insightId = get().chat.insightId;
					if (!insightId || get().chat.roomId === roomId) return;

					resetRuntime();
					const roomName =
						get().chat.conversations.find(
							(room) => room.roomId === roomId,
						)?.roomName ?? null;
					setChat({
						...createEmptyRunStore(),
						roomId,
						roomName,
						notices: [],
						usage: null,
						isSending: false,
						isStoppingRun: false,
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
							persistedModelId !== get().chat.model?.engine_id
						) {
							const model = await resolveWorkbenchChatModel(
								insightId,
								persistedModelId,
							).catch(() => null);
							if (model) setChat({ model });
						}

						const [records, messages] = await Promise.all([
							getAgentRunsForRoom(insightId, roomId, true),
							getPlaygroundMessages(insightId, roomId),
						]);
						const childrenByParent: Record<
							string,
							AgentRunRecord[]
						> = {};
						await Promise.all(
							records.map(async (record) => {
								childrenByParent[record.runId] =
									await getSubagentRuns(
										insightId,
										record.runId,
									).catch(() => []);
							}),
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

						void get().chat.refreshUsage();
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
					}
				},

				renameRoom: async (roomId, name) => {
					const insightId = get().chat.insightId;
					const trimmed = name.trim();
					if (!insightId || !trimmed) {
						throw new Error("Room name is required");
					}

					await renameRoomPixel(insightId, roomId, trimmed);
					set((state) => ({
						chat: {
							...state.chat,
							roomName:
								state.chat.roomId === roomId
									? trimmed
									: state.chat.roomName,
							conversations: state.chat.conversations.map(
								(room) =>
									room.roomId === roomId
										? { ...room, roomName: trimmed }
										: room,
							),
						},
					}));
				},

				setModel: (model) => setChat({ model }),
				setMaxTurns: (maxTurns) =>
					setChat({
						maxTurns:
							Number.isFinite(maxTurns) && maxTurns > 0
								? Math.floor(maxTurns)
								: DEFAULT_MAX_TURNS,
					}),
				setPermissionMode: (permissionMode) =>
					setChat({ permissionMode }),
				setEffort: (effort) => setChat({ effort }),
				setThinking: (enabled) => setChat({ thinkingEnabled: enabled }),

				refreshUsage: async () => {
					const { insightId, roomId } = get().chat;
					if (!insightId || !roomId) return;

					setChat({ isLoadingUsage: true });
					try {
						const messages = await getPlaygroundMessages(
							insightId,
							roomId,
						);
						setChat({ usage: calculateRoomUsage(messages) });
					} catch (error) {
						console.warn("Failed to refresh room usage:", error);
					} finally {
						setChat({ isLoadingUsage: false });
					}
				},

				compact: async () => {
					const { insightId, roomId } = get().chat;
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
						void get().chat.refreshUsage();
					} catch (error) {
						pushNotice(toErrorMessage(error), "error");
					}
				},

				dismissNotice: (id) => {
					set((state) => ({
						chat: {
							...state.chat,
							notices: state.chat.notices.filter(
								(notice) => notice.id !== id,
							),
						},
					}));
				},
			},
		};
	};
};
