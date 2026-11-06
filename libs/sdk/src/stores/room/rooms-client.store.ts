import { runPixel } from "../../api/base";
import { generateRoomName } from "../../api/chat";
import {
	chatPixels,
	type PlaygroundRoomRow,
	type PlaygroundRoomsQuery,
} from "../../api/chat-pixels";
import { runSessionPixel } from "../session/run-session-pixel";
import { Session } from "../session/session.store";
import { batchChanges, ObservableStore } from "./observable-store";
import type { ModelEngine, RoomEngineOptions } from "./room.types";
import { RoomEngine, type RoomEngineInit } from "./room-engine.store";
import type { RoomEngineConfig } from "./room-engine-config";
import { closeRoomSession } from "./room-session";

/** A room shown in a list before the backend lists it. */
export type OptimisticRoom = Pick<
	PlaygroundRoomRow,
	"ROOM_ID" | "ROOM_NAME" | "DATE_CREATED" | "WORKSPACE_ID" | "PINNED"
>;

/** The model the user last picked, with the login it was picked in. */
export interface SelectedModelPreference {
	model: ModelEngine;
	/** The login the pick belongs to; a new login starts over. */
	lastLogin?: string;
}

/**
 * Where the user's chat preferences are kept between page loads: the tab's
 * storage in a browser, a host's own store on desktop. Reads never throw: a
 * missing, corrupt or unavailable store reads as no preference.
 */
export interface ChatPreferencesAdapter {
	/** The model last picked, or null. */
	readSelectedModel(): SelectedModelPreference | null;
	/** Remember the model just picked. */
	writeSelectedModel(preference: SelectedModelPreference): void;
}

/**
 * A stored model preference, validated: what an adapter read from storage it
 * does not trust, such as JSON in the tab's storage or a preferences file.
 *
 * @param value - The stored value.
 * @returns The preference, or null when the value is not one.
 */
export const parseSelectedModelPreference = (
	value: unknown,
): SelectedModelPreference | null => {
	if (typeof value !== "object" || value === null) {
		return null;
	}
	const { model, lastLogin } = value as Record<string, unknown>;
	if (
		typeof model !== "object" ||
		model === null ||
		typeof (model as { engine_id?: unknown }).engine_id !== "string"
	) {
		return null;
	}
	return {
		model: model as ModelEngine,
		lastLogin: typeof lastLogin === "string" ? lastLogin : undefined,
	};
};

/** How a host runs its rooms list and the rooms it makes. */
export interface RoomsClientConfig<R extends RoomEngine> {
	/** How every room runs. */
	engine?: RoomEngineConfig;
	/** Whether the user picks the model; otherwise `defaultModel` is used. */
	enableModelSelect?: boolean;
	/** The model rooms run on when the user does not pick one. */
	defaultModel?: { id: string; name: string };
	/** Where the picked model is remembered; nowhere when unset. */
	preferences?: ChatPreferencesAdapter;
	/**
	 * Make a room's store — a host's subclass of {@link RoomEngine} that also
	 * shows its views. A plain `RoomEngine` when unset.
	 */
	createRoomStore?: (init: RoomEngineInit<RoomEngineOptions>) => R;
	/**
	 * Called when a new room's first message fails after the room was handed
	 * back, as when its files could not be read (`UploadError`).
	 */
	onFirstMessageError?: (room: R, error: Error) => void;
}

/**
 * The user's rooms: the ones opened on this page (a cache by id), creating,
 * loading, renaming, pinning and closing them, the model new rooms run on,
 * and the rooms shown before the backend lists them.
 *
 * Every room it makes shares the host's {@link RoomEngineConfig}. Rooms
 * always go through the playground reactors; a list reads them with
 * {@link RoomsClient.listRooms} (or a host's own query) and reads again
 * whenever {@link RoomsClient.roomsVersion} moves.
 *
 * Observable: read it with `getSnapshot`/`subscribe`, or from React with
 * `useRoomsClient`.
 */
export class RoomsClient<
	R extends RoomEngine = RoomEngine,
> extends ObservableStore {
	/** Whether the models have been read. */
	isInitialized = false;

	/** The model new rooms run on, and the ones the user may pick. */
	models: {
		/** The current model. */
		selected: ModelEngine;
		/** Its context window, once read. */
		contextWindow?: number;
		/** Every model the user may pick. */
		available: ModelEngine[];
	} = {
		selected: null as unknown as ModelEngine,
		contextWindow: undefined,
		available: [],
	};

	/** The rooms opened on this page, by id. */
	rooms: Record<string, R> = {};

	/**
	 * Rooms shown before their first message has persisted: the backend lists
	 * a room only once a message has data, so these bridge the gap until a
	 * list returns it. By id.
	 */
	optimisticRooms: Record<string, OptimisticRoom> = {};

	/**
	 * Moves whenever the user's rooms change (created, renamed, pinned,
	 * closed), so every list reads them again.
	 */
	roomsVersion = 0;

	/** The profile default model last applied. */
	private appliedProfileModelId = "";

	/**
	 * @param config - How the host runs its rooms.
	 */
	constructor(readonly config: RoomsClientConfig<R> = {}) {
		super();
		ObservableStore.observeFields<RoomsClient<R>>(this, [
			"isInitialized",
			"models",
			"rooms",
			"optimisticRooms",
			"roomsVersion",
		]);
	}

	/**
	 * Make a room's store.
	 *
	 * @param init - What the room is made from.
	 * @returns The store.
	 */
	private makeRoom = (
		init: Omit<RoomEngineInit<RoomEngineOptions>, "config">,
	): R => {
		const fullInit = { ...init, config: this.config.engine };
		return (
			this.config.createRoomStore?.(fullInit) ??
			(new RoomEngine(fullInit) as unknown as R)
		);
	};

	/** Read the models and pick the one new rooms run on. Never rejects. */
	initialize = async (): Promise<void> => {
		try {
			await this.loadDefaultModel();
		} catch (e) {
			console.error(e);
		} finally {
			this.isInitialized = true;
		}
	};

	/** Tell every rooms list the user's rooms changed. */
	bumpRoomsVersion = (): void => {
		this.roomsVersion += 1;
	};

	/**
	 * List the user's rooms through `GetPlaygroundRooms` in the session's
	 * insight, within the host's room scope.
	 *
	 * @param query - Search, paging, pinned filter and sort.
	 * @returns The rooms.
	 */
	listRooms = async (
		query: PlaygroundRoomsQuery = {},
	): Promise<PlaygroundRoomRow[]> => {
		const scope = this.config.engine?.roomScope?.token;
		const { pixelReturn } = await runSessionPixel<[PlaygroundRoomRow[]]>(
			chatPixels.getRooms(
				scope ? { roomOptionsSearch: scope, ...query } : query,
			),
		);
		return pixelReturn[0]?.output ?? [];
	};

	/**
	 * Keep a room made elsewhere, so {@link loadRoom} finds it.
	 *
	 * @param room - The room.
	 */
	registerRoom = (room: R): void => {
		this.rooms = { ...this.rooms, [room.roomId]: room };
	};

	/**
	 * A room opened on this page, without loading it.
	 *
	 * @param roomId - The room.
	 * @returns The room, or null.
	 */
	getCachedRoom = (roomId: string): R | null => this.rooms[roomId] ?? null;

	/**
	 * Show a room before the backend lists it.
	 *
	 * @param room - The room.
	 */
	addOptimisticRoom = (room: OptimisticRoom): void => {
		this.optimisticRooms = {
			...this.optimisticRooms,
			[room.ROOM_ID]: room,
		};
	};

	/**
	 * Stop showing a room early, once a list returns it or its first message
	 * failed.
	 *
	 * @param roomId - The room.
	 */
	removeOptimisticRoom = (roomId: string): void => {
		if (!(roomId in this.optimisticRooms)) {
			return;
		}
		const { [roomId]: _removed, ...rest } = this.optimisticRooms;
		this.optimisticRooms = rest;
	};

	/**
	 * Create a room through `CreatePlaygroundRoom` in a fresh insight and set
	 * its model, mode and name, without options, a message, or showing it
	 * anywhere.
	 *
	 * @param mode - Chat or agent.
	 * @param name - Its name, until it is renamed.
	 * @param workspaceId - The agent it starts from.
	 * @returns The room.
	 */
	createRoomShell = async (
		mode: "agent" | "chat",
		name: string,
		workspaceId?: string,
	): Promise<R> => {
		const { errors, pixelReturn, insightId } = await runPixel<
			[{ roomId: string }]
		>(chatPixels.createRoom({ workspaceId: workspaceId }), "new");
		if (errors.length > 0) {
			throw new Error(errors.join(""));
		}

		const room = this.makeRoom({
			roomId: pixelReturn[0].output.roomId,
			insightId: insightId,
		});
		batchChanges(() => {
			room.setModel(this.models.selected);
			room.setMode(mode);
			room.setMetadata({ name: name });
		});
		return room;
	};

	/**
	 * Create a room and send its first message. Resolves once the room exists;
	 * the message runs on, and the room shows in lists at once.
	 *
	 * @param mode - Chat or agent.
	 * @param prompt - The first message.
	 * @param files - Files to send with it.
	 * @param options - The room's options.
	 * @param workspaceId - The agent it starts from.
	 * @param askOptions - Whether the first message shows.
	 * @param prepareRoom - Runs once the room exists, before its first
	 * message, for setup the message depends on.
	 * @returns The room.
	 */
	createRoom = async (
		mode: "agent" | "chat",
		prompt: string,
		files: File[],
		options: R["options"],
		workspaceId?: string,
		askOptions?: { visible?: boolean },
		prepareRoom?: (room: R) => Promise<void>,
	): Promise<R> => {
		const room = await this.createRoomShell(
			mode,
			prompt.substring(0, 15),
			workspaceId,
		);
		// initialize before options: see the harness note in RoomEngine.initialize
		await room.initialize({ isNew: true });
		await room.updateRoomOptions(options);
		await prepareRoom?.(room);
		const roomId = room.roomId;

		batchChanges(() => {
			this.registerRoom(room);
			// lists will not return it until its first message has data
			this.addOptimisticRoom({
				ROOM_ID: roomId,
				ROOM_NAME: prompt.substring(0, 100),
				DATE_CREATED: new Date().toISOString(),
				WORKSPACE_ID: workspaceId,
			});
			this.bumpRoomsVersion();
		});

		// sent without waiting, so the caller can show the room at once
		void (async () => {
			try {
				await room.askMessage(prompt, files, askOptions);
				this.bumpRoomsVersion();
				await this.autoName(room);
			} catch (e) {
				const error = e instanceof Error ? e : new Error(String(e));
				// a room whose files were in use keeps its entry for a retry
				if (error.name !== "UploadError") {
					this.removeOptimisticRoom(roomId);
				}
				this.config.onFirstMessageError?.(room, error);
			}
		})();

		return room;
	};

	/**
	 * Create a room with no first message, such as one whose agent greets the
	 * user. Kept for {@link loadRoom}, but not listed until a message lands.
	 *
	 * @param mode - Chat or agent.
	 * @param name - Its name.
	 * @param options - The room's options.
	 * @param workspaceId - The agent it starts from.
	 * @param prepareRoom - Runs once the room exists.
	 * @returns The room.
	 */
	createEmptyRoom = async (
		mode: "agent" | "chat",
		name: string,
		options: R["options"],
		workspaceId?: string,
		prepareRoom?: (room: R) => Promise<void>,
	): Promise<R> => {
		const room = await this.createRoomShell(mode, name, workspaceId);
		// the workspace must be saved before initialize reads its greeting
		await room.updateRoomOptions(options);
		await room.initialize({ isNew: true });
		await prepareRoom?.(room);
		this.registerRoom(room);
		return room;
	};

	/**
	 * Name a room from its first exchange, when the host asks for it.
	 *
	 * @param room - A room whose first message landed.
	 */
	private autoName = async (room: R): Promise<void> => {
		if (!this.config.engine?.autoNameRooms) {
			return;
		}
		try {
			const name = await generateRoomName(room.insightId, {
				roomId: room.roomId,
				engine: room.model?.engine_id,
			});
			if (name) {
				room.setMetadata({ name: name });
				this.bumpRoomsVersion();
			}
		} catch (e) {
			console.warn("Failed to name room", e);
		}
	};

	/**
	 * Close a room: forget it for the user and drop its insight.
	 *
	 * @param roomId - The room.
	 */
	closeRoom = async (roomId: string): Promise<void> => {
		const room = this.rooms[roomId];
		await closeRoomSession(
			roomId,
			room?.insightId ?? null,
			runSessionPixel,
		);

		batchChanges(() => {
			if (roomId in this.rooms) {
				const { [roomId]: _closed, ...rest } = this.rooms;
				this.rooms = rest as Record<string, R>;
			}
			this.bumpRoomsVersion();
		});
	};

	/**
	 * Rename a room, here and in every list.
	 *
	 * @param roomId - The room.
	 * @param name - Its new name.
	 * @throws When the name is empty or the rename fails.
	 */
	renameRoom = async (roomId: string, name: string): Promise<void> => {
		const trimmed = name.trim();
		if (!trimmed) {
			throw new Error("Room name cannot be empty");
		}
		await runSessionPixel<[boolean]>(
			chatPixels.renameRoom(roomId, trimmed),
		);
		batchChanges(() => {
			this.rooms[roomId]?.setMetadata({ name: trimmed });
			this.bumpRoomsVersion();
		});
	};

	/**
	 * Pin or unpin a room, here and in every list.
	 *
	 * @param roomId - The room.
	 * @param pinned - Whether it is pinned.
	 */
	pinRoom = async (roomId: string, pinned: boolean): Promise<void> => {
		await runSessionPixel<[boolean]>(chatPixels.pinRoom(roomId, pinned));
		this.bumpRoomsVersion();
	};

	/**
	 * A room by id: the one opened on this page, or loaded — which binds a
	 * fresh insight to it.
	 *
	 * @param roomId - The room.
	 * @returns The room.
	 * @throws When the room cannot be read or has no messages.
	 */
	loadRoom = async (roomId: string): Promise<R> => {
		const cached = this.rooms[roomId];
		if (cached) {
			return cached;
		}

		const room = this.makeRoom({ roomId: roomId });
		await room.initialize();

		// a room whose first message never landed has nothing to show
		if (!room.tail || room.tail.id === "ROOT_PLACEHOLDER_ID") {
			throw new Error("Room not found");
		}

		this.registerRoom(room);
		return room;
	};

	/**
	 * Select the user's profile default model when it changed since it was
	 * last applied, as when another app set a new one.
	 *
	 * @param modelId - The profile default's engine id, empty for none.
	 */
	applyProfileDefaultModel = (modelId: string): void => {
		if (!modelId || modelId === this.appliedProfileModelId) {
			return;
		}
		this.appliedProfileModelId = modelId;
		const match = this.models.available.find(
			(m) => m.engine_id === modelId,
		);
		if (match) {
			this.setSelectedModel(match);
		}
	};

	/**
	 * Select the model new rooms run on, remember it, and read its context
	 * window.
	 *
	 * @param model - The model.
	 */
	setSelectedModel = (model: ModelEngine): void => {
		this.models = { ...this.models, selected: model };
		this.config.preferences?.writeSelectedModel({
			model: model,
			lastLogin: Session.getSnapshot().user?.lastLogin,
		});
		void this.loadEngineContextWindow(model.engine_id);
	};

	/**
	 * Select a model named by something other than the picker — an agent's
	 * default model, say — resolved against the models the user can see, so a
	 * stale or unshared id cannot leave rooms on a model that will not run.
	 *
	 * @param engineId - The model's id.
	 * @returns Whether the selection changed.
	 */
	selectModelById = async (engineId: string): Promise<boolean> => {
		const id = engineId?.trim();
		if (!id || this.models.selected?.engine_id === id) {
			return false;
		}
		try {
			const { pixelReturn } = await runSessionPixel<[ModelEngine[]]>(
				`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"], engine=[${JSON.stringify(id)}]);`,
			);
			const model = pixelReturn[0].output?.find(
				(m) => m.engine_id === id,
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
	 * Read a model's context window, keeping it only while that model is
	 * still selected.
	 *
	 * @param engineId - The model.
	 */
	private loadEngineContextWindow = async (
		engineId: string,
	): Promise<void> => {
		this.models = { ...this.models, contextWindow: undefined };
		try {
			const { pixelReturn } = await runSessionPixel<[number | undefined]>(
				`META | GetContextWindow(${JSON.stringify(engineId)});`,
			);
			if (this.models.selected?.engine_id === engineId) {
				this.models = {
					...this.models,
					contextWindow: pixelReturn[0].output,
				};
			}
		} catch (e) {
			console.error(e);
		}
	};

	/**
	 * Pick the model new rooms run on: the user's profile default, then the
	 * one last picked in this login, then the host's default, then the first
	 * available. Without model selection, the host's default.
	 */
	private loadDefaultModel = async (): Promise<void> => {
		const defaultModel = this.config.defaultModel;
		const defaultModelId =
			this.config.engine?.defaultRoomSettings?.model ||
			defaultModel?.id ||
			"";

		if (!this.config.enableModelSelect) {
			this.setSelectedModel({
				engine_id: defaultModelId,
				engine_name: defaultModel?.name ?? "",
				engine_type: "MODEL",
			});
			return;
		}

		const { pixelReturn } = await runSessionPixel<[ModelEngine[]]>(
			`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
		);
		const output = pixelReturn[0].output;
		this.models = { ...this.models, available: output };

		const user = Session.getSnapshot().user;
		const profileDefaultModelId = user?.defaultModels.textGeneration ?? "";
		this.appliedProfileModelId = profileDefaultModelId;

		const find = (id: string | undefined) =>
			id ? output.find((m) => m.engine_id === id) : undefined;

		const stored = this.config.preferences?.readSelectedModel();
		const storedThisLogin =
			stored?.lastLogin &&
			user?.lastLogin &&
			stored.lastLogin === user.lastLogin
				? find(stored.model.engine_id)
				: undefined;

		const model =
			find(profileDefaultModelId) ??
			storedThisLogin ??
			find(defaultModelId) ??
			output[0];
		if (model) {
			this.setSelectedModel(model);
		}
	};
}
