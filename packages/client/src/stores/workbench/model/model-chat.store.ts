import { createStore, type StoreApi } from "zustand";
import {
	isRoomAskAborted,
	type RoomOptions,
	RoomStore,
	type RoomStreamChunk,
	uploadInsight,
} from "@semoss/sdk/react";
import type { BuiltinToolSelection, ModelBuiltinTools } from "@/api/engines";
import { getModelBuiltinTools, getModelInputSupport } from "@/api/engines";
import type { PlaygroundMessage } from "@/api/rooms";
import {
	getPlaygroundMessages,
	getRoomOptions,
	removeUserRoom,
	renameRoom as renameRoomPixel,
	setRoomForInsight,
} from "@/api/rooms";
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
const MAX_ATTACHMENTS = 5;

/** Largest single attachment, in bytes. */
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

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

/** The default configuration a brand-new RoomStore is seeded with. */
const defaultRoomOptions = (): RoomOptions => ({
	predefinedPrompts: [],
	instructions: "",
	mcp: [],
	modelId: "",
});

/** The partial assistant turn currently streaming in. */
interface ModelChatStream {
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
	/** Abandon any in-flight turn locally (panel unmount / insight change). */
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
 * @param chunk - The chunk to apply, in RoomStore's normalized shape.
 */
const applyStreamChunk = (
	stream: ModelChatStream,
	chunk: RoomStreamChunk,
): void => {
	if (chunk.type === "content") {
		stream.text += chunk.content ?? "";
		return;
	}

	if (chunk.type === "thinking") {
		stream.thinking += chunk.thinking ?? "";
		return;
	}

	const toolData = chunk.toolData as
		| { index?: number; id?: string; function?: { name?: string } }
		| undefined;
	const index = toolData?.index ?? 0;
	const existing = stream.toolCalls[index];
	stream.toolCalls[index] = {
		id: toolData?.id ?? existing?.id ?? `tool-${index}`,
		name: toolData?.function?.name ?? existing?.name ?? "Tool",
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
 * Creates the dedicated store for one model workbench's chat panel. Owns the
 * room lifecycle, the streaming turn, and the per-conversation model
 * configuration, so the transcript, composer, history, and settings views can
 * share them.
 *
 * The room lifecycle (create/bind, ask/stream, stop-and-commit) is delegated
 * to `@semoss/sdk`'s `RoomStore` rather than hand-rolled here — this store
 * owns only what is specific to the model-chat panel: the live stream
 * accumulator for rendering, the composer/attachment state, and persisting
 * this panel's own options shape onto the room.
 *
 * @name createModelChatStore
 * @return A vanilla zustand store provided by the model workbench.
 */
export const createModelChatStore = (): StoreApi<ModelChatStoreInterface> => {
	// Runtime owned by this store instance, deliberately outside reactive
	// state: the bound room, the live stream accumulator for rendering, and
	// the guard that makes initialize idempotent per insight.
	//
	// `turnStopped` is separate from the reactive `isStopping` flag on
	// purpose. `isStopping` describes the button, and clears as soon as the
	// stop finishes; this says "the turn in flight was abandoned" and
	// survives until the next turn starts, which is what stops a poll that
	// was already resolving when the user clicked from being reported (or
	// double-applied) as a successful result.
	let room: RoomStore | null = null;
	let stream = emptyStream();
	let turnStopped = false;
	let initialization: { insightId: string; promise: Promise<void> } | null =
		null;

	return createStore<ModelChatStoreInterface>()((set, get) => {
		/**
		 * Persist the current configuration onto the bound room. AskRoom takes
		 * no system-prompt input — it reads the room's `instructions` — so this
		 * has to land before the turn.
		 *
		 * @name persistRoomOptions
		 */
		const persistRoomOptions = async (): Promise<void> => {
			if (!room) return;
			const { config, engineId } = get();
			await room.updateOptions({
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
			room?.abandon();
			turnStopped = false;
			stream = emptyStream();
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
				room = null;
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
						const [createdRoom, builtinTools, inputSupport] =
							await Promise.all([
								RoomStore.create(insightId),
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
						room = createdRoom;
						set((state) => ({
							roomId: createdRoom.roomId,
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
				room?.abandon();
				stream = emptyStream();
			},

			send: async (prompt, attachments) => {
				const { insightId, isSending, isInitializing, pendingFiles } =
					get();
				const command = prompt.trim();
				if (
					!command ||
					!insightId ||
					!room ||
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
				turnStopped = false;
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

					const parentMessageId = findParentMessageId(get().messages);

					await persistRoomOptions();

					const result = await room.ask(command, {
						parentMessageId,
						media: media.length > 0 ? media : undefined,
						paramValues: buildParamValues(),
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
					});

					// The turn landed and the user stopped it in the same beat:
					// stop() is already committing what they saw, so applying
					// this result too would double the pair.
					if (turnStopped) {
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
								result.inputMessage as PlaygroundMessage,
								"pending-input",
							),
							toModelChatMessage(
								result.responseMessage as PlaygroundMessage,
								"pending-response",
							),
						],
					}));

					if (isFirstTurn) {
						const name = deriveRoomName(command);
						if (name) {
							void renameRoomPixel(insightId, room.roomId, name)
								.then(() => {
									set((state) => ({
										roomName:
											state.roomId === room?.roomId
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
					if (turnStopped || isRoomAskAborted(error)) {
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
				}
			},

			stop: async () => {
				const { isSending, isStopping } = get();
				if (!room || !isSending || isStopping) {
					return;
				}

				// Flag before any await, so send()'s poll unwinds on its next
				// tick instead of racing this commit, and so a poll already in
				// flight is not reported as a failure.
				turnStopped = true;
				set({ isStopping: true });

				try {
					const result = await room.stop(TURN_CANCELLATION_NOTE);

					// Nothing streamed before the stop, so there is no turn
					// worth persisting — drop the optimistic pair instead.
					if (!result) {
						set((state) => ({
							messages: state.messages.filter(
								(message) =>
									message.id !== "pending-input" &&
									message.id !== "pending-response",
							),
						}));
						return;
					}

					set((state) => ({
						messages: [
							...state.messages.filter(
								(message) =>
									message.id !== "pending-input" &&
									message.id !== "pending-response",
							),
							toModelChatMessage(
								result.inputMessage as PlaygroundMessage,
								"pending-input",
							),
							toModelChatMessage(
								result.responseMessage as PlaygroundMessage,
								"pending-response",
							),
						],
					}));
				} catch (error) {
					// The stream already unwound, so this is the only signal
					// the user gets that the stopped turn was not recorded.
					set({ error: toErrorMessage(error) });
				} finally {
					// `turnStopped` deliberately stays set: send()'s poll may
					// still be unwinding, and it reads the flag to know the
					// turn was abandoned rather than broken. The next send()
					// clears it.
					set({ isStopping: false, isSending: false });
					stream = emptyStream();
				}
			},

			newRoom: async () => {
				const { insightId } = get();
				if (!insightId) return;

				resetConversation();
				room = null;
				set({ roomId: null, roomName: null });

				try {
					room = await RoomStore.create(insightId);
					set({ roomId: room.roomId });
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
				room = null;
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
					room = new RoomStore(roomId, insightId, {
						...defaultRoomOptions(),
						...options,
					});

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
