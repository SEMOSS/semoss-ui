import { getI18n } from "@semoss/i18n";
import {
	createPlaygroundRoom,
	dropInsight,
	exportMarkdownDocument,
	getModel,
	getModelContextWindow,
	getPlaygroundMessages,
	listModels,
	pinUserRoom,
	removeUserRoom,
	renameUserRoom,
} from "@semoss/sdk";
import { download, Session } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { StoreState } from "@semoss/utility/store";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import type { AbstractPixelMessage, ChatMode, Engine } from "../../../types";
import { RoomStore } from "../../room/store/room.store";
import type { ToolsHost } from "../../tools/chat-tools/tools-host";
import {
	NEW_INSIGHT_ID,
	ROOT_PLACEHOLDER_ID,
} from "../../tools/mcp/mcp-constants";
import {
	type NewChatBuildDefaults,
	readDeploymentNewChatDefaults,
	readNewChatPreferences,
	resolveNewChatModel,
} from "../config/new-chat-preferences";
import { formatConversationMarkdown } from "./conversation-markdown";

/**
 * Shape of a room row as rendered in the nav list. Matches the columns
 * returned by GetPlaygroundRooms so optimistic rooms can be merged into the
 * fetched list seamlessly.
 */
interface OptimisticRoom {
	/** The room's id. */
	ROOM_ID: string;
	/** The name the nav shows: the start of the first prompt. */
	ROOM_NAME: string;
	/** When the room was created, as an ISO string. */
	DATE_CREATED: string;
	/** The agent the room runs, if any. */
	WORKSPACE_ID?: string;
	/** Whether the room is pinned. */
	PINNED?: boolean;
}

/** A room `ChatStore.createRoom` made, and its first message. */
interface CreatedRoom {
	/** The new room, cached and shown in the nav. */
	readonly room: RoomStore;
	/**
	 * Settles once the first message has sent, with null, or failed, with its
	 * error (an `UploadError` when a file could not be uploaded). The chat has
	 * already tidied its nav by then; showing the failure is the caller's.
	 * Never rejects.
	 */
	readonly firstMessage: Promise<Error | null>;
}

/** What the chat holds. Every field is readonly. */
export interface ChatSnapshot {
	/** Whether `initialize` has finished, whether or not it succeeded. */
	readonly isInitialized: boolean;

	/** The session's selected model and the models the user can pick from. */
	readonly models: {
		/** The current model */
		selected: Engine;

		/** The current context window */
		contextWindow?: number;

		/** All available models fetched from the backend */
		available: Engine[];
	};

	/** The rooms opened this session, by id. The chat owns each one. */
	readonly rooms: Record<string, RoomStore>;

	/**
	 * Rooms shown in the nav before their first message has persisted.
	 * GetPlaygroundRooms only returns rooms that already have a message with
	 * data, so a freshly created room is invisible to the refetch until its
	 * first response lands. These bridge that gap and are removed once the
	 * real room shows up in the fetched list. Keyed by room id.
	 */
	readonly optimisticRooms: Record<string, OptimisticRoom>;

	/** Keys that room lists watch to know when to refetch. */
	readonly keys: {
		/** Goes up whenever a room is created, renamed, pinned, or removed. */
		roomCounter: number;
	};

	/** The theme's sidebar items that embed a page, by their path. */
	readonly embeddedPageMap: Record<
		string,
		| ThemeMap["playground"]["sidebar"]["headerItems"][number]
		| ThemeMap["playground"]["sidebar"]["footerItems"][number]
	>;
}

/** What a {@link ChatStore} is made with. */
export interface ChatStoreOptions {
	/** The deployment's theme, with every default filled in. */
	readonly theme: ThemeMap["playground"];
	/**
	 * The Workspace blueprints every room it creates is built with. Passed in
	 * rather than imported: they import the chat's components, which import
	 * its stores, so importing them here would close a module cycle.
	 */
	readonly panelComponents?: Record<string, WorkbenchPanelConfigAny>;
	/** The build's new-chat defaults, read from its env by the host. */
	readonly newChatDefaults?: NewChatBuildDefaults;
	/** The tools the host runs in the browser, which every room it creates gets. */
	readonly tools?: ToolsHost;
}

/**
 * The session's chat: its models, the rooms it has opened, the rooms shown
 * before their first message persists, and the pixels that create, rename,
 * pin, download, and remove rooms. One per session, made by
 * `useCreateChatStore`; it owns every `RoomStore` it caches. It holds no
 * agents: Publish as Agent is `addAgent` in `room/actions/add-agent.ts`.
 */
export class ChatStore {
	/** The deployment's theme, with every default filled in. */
	private _theme: ThemeMap["playground"];
	/** The Workspace blueprints each room is built with. */
	private _panelComponents: Record<string, WorkbenchPanelConfigAny>;
	/** The build's new-chat defaults. */
	private _newChatDefaults: NewChatBuildDefaults;
	/** The tools the host runs in the browser, which every room it creates gets. */
	private _tools: ToolsHost | undefined;
	/** The chat's state. Only the store's own actions write it. */
	private readonly state: StoreState<ChatSnapshot>;

	/** The Workspace blueprints every room is built with, a new chat's draft included. */
	get panelComponents(): Record<string, WorkbenchPanelConfigAny> {
		return this._panelComponents;
	}

	/**
	 * @param options - The host's theme, new-chat defaults and tools,
	 * and the Workspace blueprints every room is built with.
	 */
	constructor({
		theme,
		panelComponents = {},
		newChatDefaults = {},
		tools,
	}: ChatStoreOptions) {
		this._theme = theme;
		this._newChatDefaults = newChatDefaults;
		this._tools = tools;
		this._panelComponents = panelComponents;
		// Only items that embed a page are kept, so a path lookup finds them.
		const embeddedPageMap = [
			...theme.sidebar.headerItems,
			...theme.sidebar.footerItems,
		]
			.filter((item) => item.embed && item.url)
			.reduce(
				(acc, item) => {
					acc[item.path] = item;
					return acc;
				},
				{} as Record<
					string,
					| ThemeMap["playground"]["sidebar"]["headerItems"][number]
					| ThemeMap["playground"]["sidebar"]["footerItems"][number]
				>,
			);

		this.state = new StoreState<ChatSnapshot>({
			isInitialized: false,
			models: {
				selected: null as unknown as Engine,
				contextWindow: undefined,
				available: [],
			},
			rooms: {},
			optimisticRooms: {},
			keys: { roomCounter: 0 },
			embeddedPageMap,
		});
	}

	/** @returns The current snapshot, for `useStoreSelector`. */
	getSnapshot = (): ChatSnapshot => this.snapshot;

	/**
	 * Listen for any change to the chat.
	 *
	 * @param listener - Called after each change.
	 * @returns A function that stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The current snapshot. */
	private get snapshot(): ChatSnapshot {
		return this.state.getSnapshot();
	}

	/**
	 * Cache a room, or drop it with null.
	 *
	 * @param roomId - The room's id.
	 * @param room - The room, or null.
	 */
	private setCachedRoom = (roomId: string, room: RoomStore | null): void => {
		this.state.update((current) => {
			const { [roomId]: _dropped, ...rest } = current.rooms;
			return { rooms: room ? { ...rest, [roomId]: room } : rest };
		});
	};

	/** Make every room list refetch, after a change the list cannot see. */
	refreshRoomLists = (): void => {
		this.state.update((current) => ({
			keys: { roomCounter: current.keys.roomCounter + 1 },
		}));
	};

	/**
	 * Change some of the models' fields.
	 *
	 * @param changes - The fields to change.
	 */
	private updateModels = (changes: Partial<ChatSnapshot["models"]>): void => {
		this.state.update((current) => ({
			models: { ...current.models, ...changes },
		}));
	};

	// Getters

	/** Whether `initialize` has finished. */
	get isInitialized() {
		return this.snapshot.isInitialized;
	}

	/** The selected model, its context window, and the models available. */
	get models() {
		return this.snapshot.models;
	}

	/** Keys room lists watch to refetch, such as `roomCounter`. */
	get keys() {
		return this.snapshot.keys;
	}

	/** The theme's embedded pages, by path. */
	get embeddedPageMap() {
		return this.snapshot.embeddedPageMap;
	}

	/** The rooms shown in the nav before their first message persists. */
	get optimisticRooms() {
		return this.snapshot.optimisticRooms;
	}

	/**
	 * Read the session's models and select the one a new chat starts with.
	 * A failure is logged, and the chat still counts as initialized.
	 */
	initialize = async (): Promise<void> => {
		try {
			// the user, and their default model, come from the session
			await this.getDefaultModel();
		} catch (e) {
			console.error(e);
		} finally {
			this.state.update({ isInitialized: true });
		}
	};

	/**
	 * A room already held in the local cache, without loading it — so a page
	 * can show a room it was just handed without waiting a render.
	 *
	 * @param roomId - The room to look up.
	 * @returns The cached room, or null when it is not cached.
	 */
	getCachedRoom = (roomId: string): RoomStore | null =>
		this.snapshot.rooms[roomId] ?? null;

	/**
	 * Optimistically surface a room in the nav before its first message has
	 * persisted. Shown until the real room is returned by GetPlaygroundRooms
	 * (see {@link removeOptimisticRoom}).
	 *
	 * @param room - The row to show.
	 */
	addOptimisticRoom = (room: OptimisticRoom): void => {
		this.state.update((current) => ({
			optimisticRooms: {
				...current.optimisticRooms,
				[room.ROOM_ID]: room,
			},
		}));
	};

	/**
	 * Drop an optimistic room, once the real room has been fetched or its
	 * first message failed to send.
	 *
	 * @param roomId - The optimistic room's id.
	 */
	removeOptimisticRoom = (roomId: string): void => {
		this.state.update((current) => {
			const { [roomId]: _removed, ...optimisticRooms } =
				current.optimisticRooms;
			return { optimisticRooms };
		});
	};

	/**
	 * Create a room with CreatePlaygroundRoom, set its model, mode and name,
	 * load it and save its options, then run the caller's setup.
	 *
	 * Which comes first, loading or saving, is the one difference between the
	 * two ways a room starts, and the pixels each sends are tested in order:
	 *
	 * - `"initialize-first"`, a room with a first message: `initialize` reads
	 *   the new room's empty options, then its options are saved, so nothing
	 *   is read back and the first message waits on no agent lookup.
	 * - `"save-first"`, a room with no message: its options, and with them its
	 *   agent, are saved first, so `initialize` reads them back and finds the
	 *   agent's greeting.
	 *
	 * Either way the mode set here holds: `RoomStore.initialize` only promotes
	 * a room to agent mode from saved options, and never demotes it.
	 *
	 * @param room - The room's mode, name, options, agent, and setup, and
	 * which of loading and saving comes first.
	 * @returns The new room, not yet cached or shown anywhere.
	 * @throws When CreatePlaygroundRoom, loading, saving, or the setup fails.
	 */
	private createReadyRoom = async ({
		mode,
		name,
		options,
		workspaceId,
		prepareRoom,
		order,
	}: {
		mode: ChatMode;
		name: string;
		options: RoomStore["options"];
		workspaceId?: string;
		prepareRoom?: (room: RoomStore) => Promise<void>;
		order: "initialize-first" | "save-first";
	}): Promise<RoomStore> => {
		const { roomId, insightId } = await createPlaygroundRoom(
			NEW_INSIGHT_ID,
			workspaceId,
		);

		const room = new RoomStore({
			theme: this._theme,
			roomId,
			insightId,
			panelComponents: this._panelComponents,
			toolsHost: this._tools,
		});

		room.setModel(this.models.selected);
		room.setMode(mode);
		room.setMetadata({ name });

		if (order === "initialize-first") {
			await room.initialize({ isNew: true });
			await room.updateRoomOptions(options);
		} else {
			await room.updateRoomOptions(options);
			await room.initialize({ isNew: true });
		}
		await prepareRoom?.(room);
		return room;
	};

	/**
	 * Create a room, cache it, show it in the nav, and send its first message
	 * without waiting for the reply.
	 *
	 * @param mode - Whether the room runs as an agent or a chat.
	 * @param prompt - The first message; its start names the room.
	 * @param files - Files sent with the first message.
	 * @param options - The room's options, saved before the first message.
	 * @param workspaceId - The agent the room runs, if any.
	 * @param askOptions - Options for the first message, such as whether it
	 * shows in the conversation.
	 * @param prepareRoom - Runs once the room exists and before its first
	 * message, for setup the message depends on, such as the connectors the
	 * new-chat page drafted.
	 * @returns The new room, once its first message has started, and that
	 * message.
	 */
	createRoom = async (
		mode: ChatMode,
		prompt: string,
		files: File[],
		options: RoomStore["options"],
		workspaceId?: string,
		askOptions?: { visible?: boolean },
		prepareRoom?: (room: RoomStore) => Promise<void>,
	): Promise<CreatedRoom> => {
		const room = await this.createReadyRoom({
			mode,
			name: prompt.substring(0, 15),
			options,
			workspaceId,
			prepareRoom,
			order: "initialize-first",
		});
		const roomId = room.roomId;

		this.setCachedRoom(roomId, room);

		// optimistically surface the room in the nav — GetPlaygroundRooms
		// won't return it until its first message has data
		this.addOptimisticRoom({
			ROOM_ID: roomId,
			ROOM_NAME: prompt.substring(0, 100),
			DATE_CREATED: new Date().toISOString(),
			WORKSPACE_ID: workspaceId,
		});

		this.refreshRoomLists();

		// ask the room without waiting, so the caller can navigate at once
		const firstMessage = (async (): Promise<Error | null> => {
			try {
				await room.askMessage(prompt, files, askOptions);
				// the room now has data, so the lists can fetch it
				this.refreshRoomLists();
				return null;
			} catch (e) {
				const error = e instanceof Error ? e : new Error(String(e));
				// A failed upload leaves the optimistic room, so the user can
				// retry with a new message; anything else means the room has
				// no data, so it is dropped.
				if (error.name !== "UploadError") {
					this.removeOptimisticRoom(roomId);
				}
				return error;
			}
		})();

		return { room, firstMessage };
	};

	/**
	 * Create a room with no first message — e.g. so an agent's scripted
	 * greeting can render immediately on selection. Registered in the local
	 * cache so loadRoom finds it after navigation, but not surfaced in the
	 * nav until a real message lands.
	 *
	 * @param mode - Whether the room runs as an agent or a chat.
	 * @param name - The room's name.
	 * @param options - The room's options.
	 * @param workspaceId - The agent the room runs, if any.
	 * @param prepareRoom - Runs once the room is initialized.
	 * @returns The new room.
	 */
	createEmptyRoom = async (
		mode: ChatMode,
		name: string,
		options: RoomStore["options"],
		workspaceId?: string,
		prepareRoom?: (room: RoomStore) => Promise<void>,
	): Promise<RoomStore> => {
		const room = await this.createReadyRoom({
			mode,
			name,
			options,
			workspaceId,
			prepareRoom,
			order: "save-first",
		});
		this.setCachedRoom(room.roomId, room);
		return room;
	};

	/**
	 * Delete a room and its messages on the server, drop its insight, and
	 * remove it from the cache.
	 *
	 * @param roomId - The room to delete.
	 */
	closeRoom = async (roomId: string): Promise<void> => {
		const room = this.snapshot.rooms[roomId];
		const insightId = room?.insightId;

		await Session.insight.withInsight((id) => removeUserRoom(id, roomId));

		// only drop if the room was opened and has a real insightId
		if (insightId && insightId !== NEW_INSIGHT_ID) {
			try {
				await dropInsight(insightId);
			} catch (e) {
				console.warn(e);
			}
		}

		room?.dispose();
		this.setCachedRoom(roomId, null);
		this.refreshRoomLists();
	};

	/**
	 * Rename a room. Runs the RenameRoom pixel, updates the cached
	 * room's metadata, and bumps the roomCounter so any room lists
	 * elsewhere in the app (sidebar, chats page, per-agent timeline)
	 * refetch and stay in sync.
	 *
	 * @param roomId - The room to rename.
	 * @param name - The new name; it is trimmed.
	 * @throws When the trimmed name is empty, or the pixel fails.
	 */
	renameRoom = async (roomId: string, name: string): Promise<void> => {
		const trimmed = name.trim();
		if (!trimmed) {
			throw new Error(getI18n().t("sidebar:toasts.roomNameEmpty"));
		}
		await Session.insight.withInsight((id) =>
			renameUserRoom(id, roomId, trimmed),
		);
		const cached = this.snapshot.rooms[roomId];
		if (cached) {
			cached.setMetadata({ name: trimmed });
		}
		this.refreshRoomLists();
	};

	/**
	 * Pin or unpin a room. Runs the PinRoom pixel and bumps the
	 * roomCounter so any room lists elsewhere in the app (sidebar,
	 * chats page, per-agent timeline) refetch and stay in sync.
	 *
	 * @param roomId - The room to pin or unpin.
	 * @param pinned - Whether it should be pinned.
	 */
	pinRoom = async (roomId: string, pinned: boolean): Promise<void> => {
		await Session.insight.withInsight((id) =>
			pinUserRoom(id, roomId, pinned),
		);
		this.refreshRoomLists();
	};

	/**
	 * Download a room's conversation as a Word or PDF file: each message's
	 * text, its time, and the tools a reply used, as markdown the server
	 * converts.
	 *
	 * @param roomId - The room to download.
	 * @param format - The file's format.
	 * @throws When the messages cannot be read, there is nothing to download,
	 * or the server does not return a file.
	 */
	downloadConversation = async (
		roomId: string,
		format: "word" | "pdf",
	): Promise<void> => {
		const conversation = await getPlaygroundMessages<AbstractPixelMessage>(
			NEW_INSIGHT_ID,
			roomId,
		);

		const formattedMessages = formatConversationMarkdown(
			conversation.messages,
		);

		if (!formattedMessages) {
			throw new Error(getI18n().t("sidebar:download.noContent"));
		}

		const appName = this._theme.name || "Chat";
		const document = await exportMarkdownDocument(
			conversation.insightId,
			formattedMessages,
			`${appName} Room Export`,
			format,
		);

		if (document.operationType === null) {
			throw new Error(getI18n().t("sidebar:download.noResponse"));
		}

		if (document.fileKey === null) {
			throw new Error(
				getI18n().t("sidebar:download.generateFailedWithType", {
					format: format.toUpperCase(),
					operationType: document.operationType,
				}),
			);
		}

		download(document.insightId, document.fileKey);
	};

	/**
	 * Return a cached room, or load it from the server and cache it.
	 *
	 * @param roomId - The room to load.
	 * @returns The room.
	 * @throws When the room has no messages, as when its first message never
	 * saved.
	 */
	loadRoom = async (roomId: string): Promise<RoomStore> => {
		if (this.snapshot.rooms[roomId]) {
			return this.snapshot.rooms[roomId];
		}

		const room = new RoomStore({
			theme: this._theme,
			roomId,
			panelComponents: this._panelComponents,
			toolsHost: this._tools,
		});
		await room.initialize();

		// If the room has no messages or just the placeholder, it means it is a valid room but it is empty, so we can consider it as not found and throw an error
		// This happens if CreateRoom succeeds but the first AskPlayground call fails
		if (!room.tail || room.tail.id === ROOT_PLACEHOLDER_ID) {
			throw new Error(getI18n().t("room:errors.roomNotFound"));
		}

		this.setCachedRoom(roomId, room);
		// No roomCounter increment here — loading an existing room doesn't
		// change the list, so there's no reason to trigger a re-fetch.
		return room;
	};

	/**
	 * Select a model and read its context window.
	 *
	 * @param model - The model to select.
	 */
	setSelectedModel = (model: Engine): void => {
		this.updateModels({ selected: model });

		this.loadEngineContextWindow(model.engine_id);
	};

	/**
	 * Select a model named by something other than the picker - an agent's
	 * default model, say - resolving the id against the models the user can
	 * actually see so a stale or unshared id cannot leave the room pointed at a
	 * model that will not run.
	 *
	 * @param engineId - The model's id.
	 * @returns Whether the selection changed.
	 */
	selectModelById = async (engineId: string): Promise<boolean> => {
		const id = engineId?.trim();
		if (!id || this.snapshot.models.selected?.engine_id === id) {
			return false;
		}

		try {
			const model = await Session.insight.withInsight((insightId) =>
				getModel<Engine>(insightId, id),
			);
			if (!model) {
				return false;
			}

			this.setSelectedModel(model);
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	};

	/**
	 * Read a model's context window, and keep it only if the model is still
	 * selected when the read returns.
	 *
	 * @param engineId - The model's id.
	 */
	private loadEngineContextWindow = async (engineId: string) => {
		this.updateModels({ contextWindow: undefined });

		const contextWindow = await Session.insight.withInsight((id) =>
			getModelContextWindow(id, engineId),
		);

		if (this.models.selected?.engine_id === engineId) {
			this.updateModels({ contextWindow });
		}
	};

	/**
	 * Select the model a new chat starts with when nothing else names one,
	 * as when its agent is cleared: the user's default (Settings > General),
	 * then the deployment's, then the first the user can see. Does nothing
	 * while model selection is off, since the deployment's model is always
	 * used.
	 */
	selectNewChatDefaultModel = (): void => {
		if (!this._theme.featureFlags?.enableModelSelect) return;
		const model = resolveNewChatModel(
			null,
			readNewChatPreferences(Session.getSnapshot().user?.meta),
			readDeploymentNewChatDefaults(this._theme, this._newChatDefaults),
			this.snapshot.models.available,
		);
		if (
			model &&
			model.engine_id !== this.snapshot.models.selected?.engine_id
		) {
			this.setSelectedModel(model);
		}
	};

	/**
	 * Read the models the user can see and select the one the first new chat
	 * starts with: the user's default, then the deployment's, then the first.
	 * The selected model is the session's last: later new chats keep it.
	 */
	private getDefaultModel = async (): Promise<void> => {
		// with model selection off, every chat runs the deployment's model
		if (!this._theme.featureFlags?.enableModelSelect) {
			this.setSelectedModel({
				engine_id:
					readDeploymentNewChatDefaults(
						this._theme,
						this._newChatDefaults,
					).modelId ?? "",
				engine_name:
					this._theme.defaultRoomSettings?.model
						?.engine_display_name ||
					this._theme.defaultRoomSettings?.model?.engine_name ||
					this._newChatDefaults.modelName ||
					"",
				engine_type: "MODEL",
			});
			return;
		}

		const available = await Session.insight.withInsight((insightId) =>
			listModels<Engine>(insightId),
		);

		// kept so an id can be resolved to an Engine later
		this.updateModels({ available });
		// the session has read the user before any authenticated route mounts
		this.selectNewChatDefaultModel();
	};
}
