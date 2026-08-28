import { createStore, type StoreApi } from "zustand";
import { uploadInsight } from "@semoss/sdk/react";
import type { BuiltinToolSelection, ModelBuiltinTools } from "@/api/engines";
import { getModelBuiltinTools, getModelInputSupport } from "@/api/engines";
import type {
	AskRoomRequest,
	PlaygroundMessagePart,
	RoomStreamChunk,
} from "@/api/rooms";
import {
	askRoom,
	commitCancelledTurn,
	createRoom,
	getPlaygroundMessages,
	getRoomOptions,
	isAskRoomAborted,
	removeUserRoom,
	renameRoom as renameRoomPixel,
	setRoomForInsight,
	stopPixelJob,
	updateRoomOptions,
} from "@/api/rooms";
import type { WorkbenchState } from "../workbench.store";
import type {
	ModelChatAttachment,
	ModelChatConfig,
	ModelChatMessage,
	ModelChatToolCall,
} from "./model-chat.types";
import {
	deriveRoomName,
	findParentMessageId,
	toModelChatMessage,
	toModelChatTranscript,
} from "./model-chat-format";

/** Most files that can ride along on a single turn. */
export const MAX_ATTACHMENTS = 5;

/** Largest single attachment, in bytes. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Note appended for the model when the user stops a turn mid-stream. */
const TURN_CANCELLATION_NOTE =
	"The previous response was stopped by the user before it finished. Do not assume it completed.";

/**
 * Marker persisted onto every model-chat room's options and used as the
 * conversation-history search term. Namespaced by engine so a room only ever
 * surfaces in the workbench it belongs to, and prefixed so it cannot collide
 * with the bare engine id the workbench assistant stores.
 *
 * @name roomScopeToken
 * @param engineId - Model engine the conversation belongs to.
 * @return The scope token.
 */
export const roomScopeToken = (engineId: string): string =>
	`model-chat:${engineId}`;

/** The partial assistant turn currently streaming in. */
interface ModelChatStream {
	/** Pixel job backing the turn, used to stop it. */
	jobId: string | null;
	/** Text streamed so far. */
	text: string;
	/** Extended-thinking content streamed so far. */
	thinking: string;
	/** Tool calls the provider reported, keyed by their stream index. */
	toolCalls: Record<number, ModelChatToolCall>;
}

/** State and actions owned by one model workbench's chat store. */
export interface ModelChatStoreInterface {
	/** Insight every room pixel is scoped to, once initialized. */
	insightId: string | null;
	/** Model engine every turn runs against. */
	engineId: string;
	/** Room the conversation is bound to. */
	roomId: string | null;
	/** Display name of the current room, when known. */
	roomName: string | null;
	/** True while the room and tool catalog are being prepared. */
	isInitializing: boolean;
	/** Failure message when initialization did not complete. */
	initError: string | null;

	/** The rendered transcript, oldest first. */
	messages: ModelChatMessage[];
	/** True from submit until the turn settles. */
	isSending: boolean;
	/** True from the moment a stop is requested until it settles. */
	isStopping: boolean;
	/** Transient failure surfaced above the composer. */
	error: string | null;
	/** Unsent composer draft, preserved across view switches. */
	draft: string;
	/**
	 * Files queued on the composer, preserved across view switches like the
	 * draft. Uploaded when the turn is sent, not when they are dropped.
	 */
	pendingFiles: File[];

	/** Per-conversation model configuration. */
	config: ModelChatConfig;
	/** Built-in tools this engine's providers offer, plus its saved selection. */
	builtinTools: ModelBuiltinTools;
	/**
	 * Whether the composer offers attachments. Permissive by design: the
	 * engine has to say `attachment: false` to turn them off, because a
	 * missing flag means the provider never reported one rather than "no".
	 */
	supportsAttachments: boolean;

	/**
	 * Create the room and load the built-in tool catalog for the given insight.
	 * Idempotent per insight: repeat calls return the same promise. Failures
	 * land in `initError`.
	 */
	initialize: (insightId: string, engineId: string) => Promise<void>;
	/** Abort any in-flight turn (panel unmount / insight change). */
	dispose: () => void;
	/**
	 * Send `prompt` as the next turn: uploads any queued files into the
	 * insight space, persists the room options, streams the response, then
	 * swaps the optimistic pair for the durable messages. Resolves true when a
	 * turn was sent.
	 *
	 * @param attachments - Already-uploaded files to re-send instead of the
	 * queued ones, which is how a re-ask keeps the originals.
	 */
	send: (
		prompt: string,
		attachments?: ModelChatAttachment[],
	) => Promise<boolean>;
	/**
	 * Stop the streaming turn and persist what the user saw, so the turn is not
	 * lost from the room's history.
	 */
	stop: () => Promise<void>;
	/** Abandon the current room and bind a fresh one. */
	newRoom: () => Promise<void>;
	/**
	 * Delete conversation `roomId`. When it is the room currently open, a fresh
	 * one is bound so the panel is never left pointing at a deleted room. The
	 * history list itself lives in the panel, which drops the row.
	 */
	deleteConversation: (roomId: string) => Promise<void>;
	/**
	 * Switch to room `roomId`: bind it to the insight, adopt its persisted
	 * configuration, and project its history. No-op when already on the room.
	 *
	 * @param roomName - Display name for the resumed room, from whichever list
	 * the user picked it out of.
	 */
	resumeRoom: (roomId: string, roomName?: string | null) => Promise<void>;
	/** Rename room `roomId` and update local state. */
	renameRoom: (roomId: string, name: string) => Promise<void>;
	/** Merge a patch into the per-conversation configuration. */
	setConfig: (patch: Partial<ModelChatConfig>) => void;
	/** Set the unsent composer draft. */
	setDraft: (draft: string) => void;
	/**
	 * Queue files on the composer, dropping any that are too large and any
	 * past the cap. Returns a message naming what was rejected, or null.
	 */
	addFiles: (files: File[]) => string | null;
	/** Remove the queued file at `index`. */
	removeFile: (index: number) => void;
	/** Clear the transient error. */
	dismissError: () => void;
}

/**
 * The model chat store a `ModelWorkbench` attached, for paths that can't use
 * `useModelChat` — a blueprint's `commands` factory runs outside React. This
 * cast and the hook's are the only two points where the untyped `domainStore`
 * attachment is narrowed back to its concrete shape.
 *
 * @name getModelChatStore
 * @param state - The scoped workbench store's state.
 * @return The attached store, or undefined outside a `ModelWorkbench`.
 */
export const getModelChatStore = (
	state: WorkbenchState,
): StoreApi<ModelChatStoreInterface> | undefined =>
	state.layout.domainStore as StoreApi<ModelChatStoreInterface> | undefined;

/**
 * Extract a display message from a thrown value.
 *
 * @name toErrorMessage
 * @param error - Thrown value of any shape.
 * @return The Error's message, or the value coerced to a string.
 */
const toErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

/** An empty stream accumulator. */
const emptyStream = (): ModelChatStream => ({
	jobId: null,
	text: "",
	thinking: "",
	toolCalls: {},
});

/**
 * Fold one streamed chunk into the accumulator. Tool deltas are keyed by their
 * stream `index`: the opening chunk carries the id and name, which is all a
 * streaming tool call renders. The argument fragments that follow are dropped
 * — they arrive as partial JSON that cannot be parsed until the turn settles,
 * and the durable message carries the parsed arguments anyway.
 *
 * @name applyStreamChunk
 * @param stream - The accumulator to fold into (mutated).
 * @param chunk - The chunk to apply.
 */
const applyStreamChunk = (
	stream: ModelChatStream,
	chunk: RoomStreamChunk,
): void => {
	if (chunk.stream_type === "content") {
		stream.text += chunk.data.content ?? "";
		return;
	}

	if (chunk.stream_type === "thinking") {
		stream.thinking += chunk.data.thinking ?? "";
		return;
	}

	const index = chunk.data.index ?? 0;
	const existing = stream.toolCalls[index];
	stream.toolCalls[index] = {
		id: chunk.data.id ?? existing?.id ?? `tool-${index}`,
		name: chunk.data.function?.name ?? existing?.name ?? "Tool",
	};
};

/**
 * The transcript message rendered for the turn currently streaming in.
 *
 * @name streamingMessage
 * @param stream - The live accumulator.
 * @return A transcript message flagged as streaming.
 */
const streamingMessage = (stream: ModelChatStream): ModelChatMessage => {
	const toolCalls = Object.values(stream.toolCalls);
	return {
		id: "pending-response",
		io: "OUTPUT",
		text: stream.text,
		thinking: stream.thinking || undefined,
		toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
		isStreaming: true,
	};
};

/**
 * The parts to persist for a turn the user stopped, in the order the backend
 * expects them (reasoning before the answer it produced).
 *
 * @name streamToResponseParts
 * @param stream - The accumulator at the moment of the stop.
 * @return The parts to commit, or an empty array when nothing streamed.
 */
const streamToResponseParts = (
	stream: ModelChatStream,
): PlaygroundMessagePart[] => {
	const parts: PlaygroundMessagePart[] = [];
	if (stream.thinking) {
		parts.push({ type: "THINKING", thinking: stream.thinking });
	}
	if (stream.text) {
		parts.push({ type: "TEXT", text: stream.text, uiText: stream.text });
	}
	return parts;
};

/**
 * Creates the dedicated store for one model workbench's chat panel. Owns the
 * room lifecycle, the streaming turn, and the per-conversation model
 * configuration, so the transcript, composer, history, and settings views can
 * share them.
 *
 * @name createModelChatStore
 * @return A vanilla zustand store attached via `actions.attachDomainStore`.
 */
export const createModelChatStore = (): StoreApi<ModelChatStoreInterface> => {
	// Runtime owned by this store instance, deliberately outside reactive
	// state: the live stream accumulator, the request it belongs to (replayed
	// verbatim by a cancel-commit), the controller that ends its poll loop, and
	// the guard that makes initialize idempotent per insight.
	//
	// `turnAborted` is separate from the reactive `isStopping` flag on purpose.
	// `isStopping` describes the button, and clears as soon as the stop
	// finishes; this says "the turn in flight was abandoned" and survives until
	// the next turn starts, which is what stops a poll that was already in
	// flight when the user clicked from being reported as a failure.
	let stream = emptyStream();
	let activeRequest: AskRoomRequest | null = null;
	let turnController: AbortController | null = null;
	let turnAborted = false;
	let initialization: { insightId: string; promise: Promise<void> } | null =
		null;

	return createStore<ModelChatStoreInterface>()((set, get) => {
		/**
		 * Persist the current configuration onto the bound room. AskRoom takes
		 * no system-prompt input — it reads the room's `instructions` — so this
		 * has to land before the turn.
		 *
		 * @name persistRoomOptions
		 * @param insightId - Insight the pixel executes against.
		 * @param roomId - Room to write to.
		 */
		const persistRoomOptions = async (
			insightId: string,
			roomId: string,
		): Promise<void> => {
			const { config, engineId } = get();
			await updateRoomOptions(insightId, roomId, {
				instructions: config.instructions,
				// Deliberately empty: MCP tools would make AskRoom return turns
				// that need a client-side execution loop this panel does not run.
				mcp: [],
				predefinedPrompts: [],
				modelId: engineId,
				builtinTools: config.builtinTools,
				workbench: roomScopeToken(engineId),
			});
		};

		/**
		 * The model kwargs for a turn. `built_in_tools` is always sent — the
		 * engine only falls back to its own saved selection when the key is
		 * absent, so sending `{}` is how the user turns every tool off.
		 *
		 * @name buildParamValues
		 * @return The `paramValues` map for AskRoom.
		 */
		const buildParamValues = (): Record<string, unknown> => {
			const { config } = get();
			return {
				built_in_tools: config.builtinTools,
			};
		};

		/**
		 * Reset everything scoped to a single conversation. Used when binding a
		 * new room and when resuming a different one.
		 *
		 * @name resetConversation
		 */
		const resetConversation = (): void => {
			turnController?.abort();
			turnController = null;
			turnAborted = false;
			stream = emptyStream();
			activeRequest = null;
			set({
				messages: [],
				isSending: false,
				isStopping: false,
				error: null,
			});
		};

		return {
			insightId: null,
			engineId: "",
			roomId: null,
			roomName: null,
			isInitializing: false,
			initError: null,

			messages: [],
			isSending: false,
			isStopping: false,
			error: null,
			draft: "",
			pendingFiles: [],

			config: {
				instructions: "",
				builtinTools: {},
			},
			builtinTools: {},
			supportsAttachments: true,

			initialize: (insightId, engineId) => {
				if (initialization?.insightId === insightId) {
					return initialization.promise;
				}

				resetConversation();
				set({
					insightId,
					engineId,
					isInitializing: true,
					initError: null,
					roomId: null,
					roomName: null,
				});

				const promise = (async () => {
					try {
						// Both lookups are optional: an install without a catalog,
						// or a provider it does not know, simply offers no tools,
						// and unreadable metadata leaves attachments on. Only the
						// room is load-bearing.
						const [roomId, builtinTools, inputSupport] =
							await Promise.all([
								createRoom(insightId),
								getModelBuiltinTools(insightId, engineId).catch(
									(error): ModelBuiltinTools => {
										console.warn(
											"Unable to load built-in tools:",
											error,
										);
										return {};
									},
								),
								getModelInputSupport(insightId, engineId).catch(
									(
										error,
									): Awaited<
										ReturnType<typeof getModelInputSupport>
									> => {
										console.warn(
											"Unable to load model metadata:",
											error,
										);
										return {};
									},
								),
							]);
						set((state) => ({
							roomId,
							builtinTools,
							supportsAttachments:
								inputSupport.attachment !== false,
							config: {
								...state.config,
								builtinTools: builtinTools.selected ?? {},
							},
							isInitializing: false,
						}));
					} catch (error) {
						initialization = null;
						set({
							isInitializing: false,
							initError: toErrorMessage(error),
						});
					}
				})();

				initialization = { insightId, promise };
				return promise;
			},

			// The initialize guard is deliberately left alone: it is keyed by
			// insight, so a genuine insight change re-initializes anyway, while
			// a remount against the same insight reuses the room it already
			// created instead of orphaning it and making another.
			dispose: () => {
				turnController?.abort();
				turnController = null;
				stream = emptyStream();
				activeRequest = null;
			},

			send: async (prompt, attachments) => {
				const {
					insightId,
					roomId,
					engineId,
					isSending,
					isInitializing,
					pendingFiles,
				} = get();
				const command = prompt.trim();
				if (
					!command ||
					!insightId ||
					!roomId ||
					isSending ||
					isInitializing
				) {
					return false;
				}

				// A re-ask supplies its original attachments, already uploaded;
				// anything else sends what the composer has queued.
				const files = attachments ? [] : pendingFiles;
				const optimisticAttachments =
					attachments ??
					files.map((file) => ({
						fileName: file.name,
						mimeType: file.type || undefined,
					}));

				const isFirstTurn = get().messages.length === 0;
				stream = emptyStream();
				turnController = new AbortController();
				turnAborted = false;
				set((state) => ({
					isSending: true,
					error: null,
					draft: "",
					pendingFiles: [],
					messages: [
						...state.messages,
						{
							id: "pending-input",
							io: "INPUT" as const,
							text: command,
							attachments:
								optimisticAttachments.length > 0
									? optimisticAttachments
									: undefined,
						},
						streamingMessage(stream),
					],
				}));

				try {
					// Uploaded per turn rather than on drop, so a file the user
					// queues and then removes never costs a request. A re-ask
					// has its locations already and uploads nothing.
					let media: string[] = [];
					if (attachments) {
						media = attachments
							.map((attachment) => attachment.fileLocation)
							.filter((location): location is string =>
								Boolean(location),
							);
					} else if (files.length > 0) {
						const uploaded = await uploadInsight(
							insightId,
							"",
							files,
						);
						media = uploaded.data.map(
							(upload) => upload.fileLocation,
						);
					}

					const request: AskRoomRequest = {
						engineId,
						roomId,
						command,
						parentMessageId: findParentMessageId(get().messages),
						media: media.length > 0 ? media : undefined,
						paramValues: buildParamValues(),
					};
					activeRequest = request;

					await persistRoomOptions(insightId, roomId);

					const result = await askRoom(insightId, request, {
						onJobStarted: (jobId) => {
							stream.jobId = jobId;
						},
						onChunk: (chunk) => {
							applyStreamChunk(stream, chunk);
							set((state) => ({
								messages: state.messages.map((message) =>
									message.id === "pending-response"
										? streamingMessage(stream)
										: message,
								),
							}));
						},
						signal: turnController.signal,
					});

					// The turn landed and the user stopped it in the same beat:
					// stop() is already committing what they saw, so applying
					// this result too would double the pair.
					if (turnAborted) {
						return false;
					}

					// Swap the optimistic pair for the durable messages: their
					// ids are what feedback and the next turn's parent branch
					// off, and only they carry token counts.
					set((state) => ({
						messages: [
							...state.messages.filter(
								(message) =>
									message.id !== "pending-input" &&
									message.id !== "pending-response",
							),
							toModelChatMessage(
								result.inputMessage,
								"pending-input",
							),
							toModelChatMessage(
								result.responseMessage,
								"pending-response",
							),
						],
					}));

					if (isFirstTurn) {
						const name = deriveRoomName(command);
						if (name) {
							void renameRoomPixel(insightId, roomId, name)
								.then(() => {
									set((state) => ({
										roomName:
											state.roomId === roomId
												? name
												: state.roomName,
									}));
								})
								.catch((error) => {
									console.warn("RenameRoom failed:", error);
								});
						}
					}

					return true;
				} catch (error) {
					// A stop unwinds through here — either as the abort itself
					// or as whatever request was in flight when the job died.
					// stop() owns persisting that turn, so say nothing.
					if (turnAborted || isAskRoomAborted(error)) {
						return false;
					}

					// Drop the whole optimistic pair — leaving the prompt behind
					// would collide with the next turn's `pending-input` id — and
					// hand the text back to the composer so the user can retry,
					// unless they have already started typing something else.
					// The files come back on the same terms; a re-ask has none
					// of its own to restore.
					set((state) => ({
						error: toErrorMessage(error),
						draft: state.draft === "" ? command : state.draft,
						pendingFiles:
							state.pendingFiles.length === 0
								? files
								: state.pendingFiles,
						messages: state.messages.filter(
							(message) =>
								message.id !== "pending-input" &&
								message.id !== "pending-response",
						),
					}));
					return false;
				} finally {
					set({ isSending: false });
					turnController = null;
					activeRequest = null;
				}
			},

			stop: async () => {
				const { insightId, isSending, isStopping } = get();
				const jobId = stream.jobId;
				const request = activeRequest;
				if (
					!insightId ||
					!isSending ||
					isStopping ||
					!jobId ||
					!request
				) {
					return;
				}

				// Flag and abort before any await, so send()'s poll loop
				// unwinds on its next tick instead of racing this commit, and
				// so a poll already in flight is not reported as a failure.
				turnAborted = true;
				turnController?.abort();
				set({ isStopping: true });

				const parts = streamToResponseParts(stream);
				try {
					await stopPixelJob(insightId, jobId);

					// Nothing streamed before the stop, so there is no turn
					// worth persisting — drop the optimistic pair instead.
					if (parts.length === 0) {
						set((state) => ({
							messages: state.messages.filter(
								(message) =>
									message.id !== "pending-input" &&
									message.id !== "pending-response",
							),
						}));
						return;
					}

					const result = await commitCancelledTurn(
						insightId,
						request,
						parts,
						TURN_CANCELLATION_NOTE,
					);
					set((state) => ({
						messages: [
							...state.messages.filter(
								(message) =>
									message.id !== "pending-input" &&
									message.id !== "pending-response",
							),
							toModelChatMessage(
								result.inputMessage,
								"pending-input",
							),
							toModelChatMessage(
								result.responseMessage,
								"pending-response",
							),
						],
					}));
				} catch (error) {
					// The stream already unwound, so this is the only signal
					// the user gets that the stopped turn was not recorded.
					set({ error: toErrorMessage(error) });
				} finally {
					// `turnAborted` deliberately stays set: send()'s poll may
					// still be unwinding, and it reads the flag to know the
					// turn was abandoned rather than broken. The next send()
					// clears it.
					set({ isStopping: false, isSending: false });
					turnController = null;
					stream = emptyStream();
					activeRequest = null;
				}
			},

			newRoom: async () => {
				const { insightId } = get();
				if (!insightId) return;

				resetConversation();
				set({ roomId: null, roomName: null });

				try {
					const roomId = await createRoom(insightId);
					set({ roomId });
				} catch (error) {
					set({ error: toErrorMessage(error) });
				}
			},

			deleteConversation: async (roomId) => {
				const { insightId } = get();
				if (!insightId) return;

				await removeUserRoom(insightId, roomId);

				// The open room just went away — bind a fresh one rather than
				// leaving the transcript pointed at a deleted room.
				if (get().roomId === roomId) {
					await get().newRoom();
				}
			},

			resumeRoom: async (roomId, roomName = null) => {
				const { insightId } = get();
				if (!insightId || get().roomId === roomId) return;

				resetConversation();
				// The name comes from the caller (the history row that was
				// clicked); the store does not hold the conversation list.
				set({ roomId, roomName });

				try {
					await setRoomForInsight(insightId, roomId);

					// The saved configuration is best-effort: a room written by
					// an older build simply keeps the current settings.
					const options = await getRoomOptions(
						insightId,
						roomId,
					).catch(() => null);
					if (options) {
						set((state) => ({
							config: {
								instructions:
									typeof options.instructions === "string"
										? options.instructions
										: state.config.instructions,
								builtinTools:
									(options.builtinTools as
										| Record<string, BuiltinToolSelection>
										| undefined) ??
									state.config.builtinTools,
							},
						}));
					}

					const messages = await getPlaygroundMessages(
						insightId,
						roomId,
					);
					set({ messages: toModelChatTranscript(messages) });
				} catch (error) {
					set({ error: toErrorMessage(error) });
				}
			},

			renameRoom: async (roomId, name) => {
				const { insightId } = get();
				const trimmed = name.trim();
				if (!insightId || !trimmed) {
					throw new Error("Conversation name is required");
				}

				await renameRoomPixel(insightId, roomId, trimmed);
				set((state) => ({
					roomName:
						state.roomId === roomId ? trimmed : state.roomName,
				}));
			},

			setConfig: (patch) =>
				set((state) => ({ config: { ...state.config, ...patch } })),
			setDraft: (draft) => set({ draft }),

			addFiles: (files) => {
				const rejected: string[] = [];
				const accepted: File[] = [];
				for (const file of files) {
					if (file.size > MAX_ATTACHMENT_BYTES) {
						rejected.push(file.name);
					} else {
						accepted.push(file);
					}
				}

				let overflowed = false;
				set((state) => {
					const room = MAX_ATTACHMENTS - state.pendingFiles.length;
					overflowed = accepted.length > room;
					return {
						pendingFiles: [
							...state.pendingFiles,
							...accepted.slice(0, Math.max(room, 0)),
						],
					};
				});

				if (rejected.length > 0) {
					return `${rejected.join(", ")} exceeds the ${
						MAX_ATTACHMENT_BYTES / (1024 * 1024)
					} MB limit.`;
				}
				return overflowed
					? `Up to ${MAX_ATTACHMENTS} files can be attached to a turn.`
					: null;
			},

			removeFile: (index) =>
				set((state) => ({
					pendingFiles: state.pendingFiles.filter(
						(_, position) => position !== index,
					),
				})),
			dismissError: () => set({ error: null }),
		};
	});
};
