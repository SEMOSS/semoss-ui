import { makeAutoObservable, runInAction } from "mobx";
import { type Insight, runPixel } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import type { Engine, MCPConfig, Workspace } from "@/types";
import { RoomStore } from "../room";

const DEFAUlT_MODEL_ID = import.meta.env.VITE_DEFAUlT_MODEL_ID || "";
const DEFAUlT_MODEL_NAME = import.meta.env.VITE_DEFAUlT_MODEL_NAME || "";

const SESSION_MODEL_KEY = "smss-playground-session-model";

interface ChatStoreInterface {
	/**
	 *  Track if the chat is initialized
	 */
	isInitialized: boolean;

	/**
	 * List of the models available
	 */
	models: {
		/** The current model */
		selected: Engine;

		/** The current context window */
		contextWindow?: number;
	};

	/**
	 * Engine ID of the model set as default in the user's profile (Settings > My Profile).
	 * Empty string if no profile default is set.
	 */
	profileDefaultModelId: string;

	/**
	 * Cached rooms
	 */
	rooms: Record<string, RoomStore>;

	/**
	 * Options related to the navbar
	 */
	keys: {
		/**
		 * Counter to force re-render of the nav when the rooms change
		 */
		roomCounter: number;
	};

	/**
	 * Preloaded embedded paths
	 * path -> url
	 */
	embeddedPageMap: Record<
		string,
		| ThemeMap["playground"]["sidebar"]["headerItems"][number]
		| ThemeMap["playground"]["sidebar"]["footerItems"][number]
	>;

	/**
	 * Current user info
	 */
	user: {
		id: string;
		name: string;
		lastLogin?: string;
	};
}

/**
 * Manage the chat
 */
export class ChatStore {
	private _theme: ThemeMap["playground"];
	private _actions: Insight["actions"];
	private _store: ChatStoreInterface = {
		isInitialized: false,
		models: {
			selected: null as unknown as Engine,
			contextWindow: undefined,
		},
		rooms: {},
		keys: {
			roomCounter: 0,
		},
		user: {
			id: "",
			name: "",
		},
		embeddedPageMap: {},
		profileDefaultModelId: "",
	};

	constructor(theme: ThemeMap["playground"], actions: Insight["actions"]) {
		this._theme = theme;
		this._actions = actions;
		this._store.embeddedPageMap = [
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

		// make it observable
		makeAutoObservable(this);
	}

	/**
	 * Getters
	 */
	/**
	 * Track if the store is loaded
	 */
	get isInitialized() {
		return this._store.isInitialized;
	}

	/**
	 * Get the models from the store
	 */
	get models() {
		return this._store.models;
	}

	/**
	 * Get keys to refresh different objects
	 */
	get keys() {
		return this._store.keys;
	}

	/**
	 * Get the current user
	 */
	get user() {
		return this._store.user;
	}

	/**
	 * Get the map of preloaded embed paths
	 */
	get embeddedPageMap() {
		return this._store.embeddedPageMap;
	}

	/**
	 * Get the engine ID of the user's profile default model
	 */
	get profileDefaultModelId() {
		return this._store.profileDefaultModelId;
	}

	/**
	 * Initialize the store
	 */
	initialize = async (): Promise<void> => {
		try {
			// getUser must complete first so profileDefaultModelId is set
			// before getDefaultModel runs its model selection logic
			await this.getUser();
			await this.getDefaultModel();
		} catch (e) {
			console.error(e);
		} finally {
			runInAction(() => {
				this._store.isInitialized = true;
			});
		}
	};

	getUser = async (): Promise<void> => {
		try {
			const result = await this._actions.run<
				[
					Record<
						string,
						{
							id: string;
							name: string;
							lastLogin?: string;
							meta?: Record<string, unknown>;
						}
					>,
				]
			>(`META | GetUserInfo();`);

			if (!result) return;

			const providerData = Object.values(result.pixelReturn[0].output)[0];
			if (!providerData) return;

			runInAction(() => {
				this._store.user = {
					id: providerData.id,
					name: providerData.name,
					lastLogin: providerData.lastLogin,
				};
			});

			// extract the profile default text-generation model set via Settings > My Profile
			const metaValue = providerData.meta?.["text-generation-model"];
			const profileDefaultModelId = Array.isArray(metaValue)
				? (metaValue[0] as string) || ""
				: typeof metaValue === "string"
					? metaValue
					: "";

			runInAction(() => {
				this._store.profileDefaultModelId = profileDefaultModelId;
			});
		} catch (e) {
			console.error(e);
		}
	};

	/**
	 * Register a pre-created RoomStore in the local cache so it is
	 * discoverable by loadRoom after navigation.  Used by consumers that
	 * need a real insight before the first message is sent (e.g. the
	 * file-explorer on the new-room page).
	 */
	registerRoom = (room: RoomStore): void => {
		runInAction(() => {
			this._store.rooms[room.roomId] = room;
		});
	};

	/**
	 * Create a new room
	 */
	createRoom = async (
		mode: "planning" | "chat",
		prompt: string,
		files: File[],
		options: RoomStore["options"],
		workspaceId?: string,
	): Promise<RoomStore> => {
		// create the room in a new insight
		const { errors, pixelReturn, insightId } = await runPixel<
			[
				{
					roomId: string;
				},
			]
		>(
			`CreatePlaygroundRoom(${workspaceId ? `workspaceId=${JSON.stringify(workspaceId)}` : ""})`,
			"new",
		);

		// throw errors
		if (errors.length > 0) {
			throw new Error(errors.join(""));
		}

		// get the output
		const { output } = pixelReturn[0];

		// get the new roomId
		const roomId = output.roomId;

		// create the room store
		const room = new RoomStore(this._theme, roomId, insightId);

		// set the model
		room.setModel(this.models.selected);

		this.seedRoomContextWindowFromChat(room);

		// set the mode
		room.setMode(mode);

		// set default name
		room.setMetadata({ name: prompt.substring(0, 15) });

		// initialize the room
		await room.initialize();

		// set the options
		await room.updateRoomOptions(options);

		runInAction(() => {
			// save it to the cache
			this._store.rooms[roomId] = room;

			// increment the roomCounter to force re-render of the nav
			this._store.keys.roomCounter++;
		});

		// ask the room
		room.askMessage(prompt, files).then(() => {
			runInAction(() => {
				// increment the roomCounter to force re-render of the nav
				this._store.keys.roomCounter++;
			});
		});

		// return the room
		return room;
	};

	/**
	 * Remove an room from the remove and all of the related messages
	 * @param roomId - Room to remove
	 */
	closeRoom = async (roomId: string): Promise<void> => {
		const room = this._store.rooms[roomId];
		const insightId = room?.insightId;

		// wait for the pixel to run
		await this._actions.run<[boolean]>(
			`RemoveUserRoom(roomId=["${roomId}"]);`,
		);

		// only drop if the room was opened and has a real insightId
		if (insightId && insightId !== "new") {
			try {
				await runPixel<[Record<string, unknown>]>(
					"DropInsight()",
					insightId,
				);
			} catch (e) {
				console.warn(e);
			}
		}

		runInAction(() => {
			// delete it from the cache
			delete this._store.rooms[roomId];

			// increment the roomCounter to force re-render of the nav
			this._store.keys.roomCounter++;
		});
	};

	/**
	 * Rename a room. Runs the RenameRoom pixel, updates the cached
	 * room's metadata, and bumps the roomCounter so any room lists
	 * elsewhere in the app (sidebar, chats page, per-agent timeline)
	 * refetch and stay in sync.
	 */
	renameRoom = async (roomId: string, name: string): Promise<void> => {
		const trimmed = name.trim();
		if (!trimmed) {
			throw new Error("Room name cannot be empty");
		}
		await this._actions.run<[boolean]>(
			`META | RenameRoom(roomId=["${roomId}"], name=["<encode>${trimmed}</encode>"]);`,
		);
		runInAction(() => {
			const cached = this._store.rooms[roomId];
			if (cached) {
				cached.setMetadata({ name: trimmed });
			}
			this._store.keys.roomCounter++;
		});
	};

	/**
	 * Load a room from the store or create a new one
	 * @param roomId - Room to remove
	 */
	loadRoom = async (roomId: string): Promise<RoomStore> => {
		// if it exists in the store utilize it.
		if (this._store.rooms[roomId]) {
			return this._store.rooms[roomId];
		}

		// create the room store
		const room = new RoomStore(this._theme, roomId);

		// initialize the room
		await room.initialize();

		this.seedRoomContextWindowFromChat(room);

		// If the room has no messages or just the placeholder, it means it is a valid room but it is empty, so we can consider it as not found and throw an error
		// This happens if CreateRoom succeeds but the first AskPlayground call fails
		if (!room.tail || room.tail.id === "ROOT_PLACEHOLDER_ID") {
			throw new Error("Room not found");
		}

		runInAction(() => {
			// save it to the cache
			this._store.rooms[roomId] = room;
			// No roomCounter increment here — loading an existing room doesn't
			// change the list, so there's no reason to trigger a re-fetch.
		});

		// return the room
		return room;
	};

	/**
	 * Set the selected model
	 */
	setSelectedModel = (model: Engine): void => {
		runInAction(() => {
			this._store.models.selected = model;
		});

		sessionStorage.setItem(
			SESSION_MODEL_KEY,
			JSON.stringify({ model, lastLogin: this._store.user.lastLogin }),
		);

		this.loadEngineContextWindow(model.engine_id);
	};

	private loadEngineContextWindow = async (engineId: string) => {
		runInAction(() => {
			this._store.models.contextWindow = undefined;
		});

		const { pixelReturn } = await this._actions.run<[number | undefined]>(
			`META | GetContextWindow(${JSON.stringify(engineId)});`,
		);

		const value = pixelReturn[0].output;

		if (this.models.selected?.engine_id === engineId) {
			runInAction(() => {
				this._store.models.contextWindow = value;
			});
		}

		// Propagate to any cached room running this engine so each room can
		// predict backend auto-compaction (see response-message.store.ts ->
		// runMessage). Per-room because rooms can outlive a selected-model change.
		Object.values(this._store.rooms).forEach((room) => {
			if (room.model?.engine_id === engineId) {
				room.setContextWindow(value);
			}
		});
	};

	/**
	 * Seed a room's contextWindow from the chat's cached value when the room's
	 * model matches the chat's currently-selected model. Used at room creation
	 * and load time so the first user message can predict backend auto-compaction
	 * (see response-message.store.ts -> runMessage).
	 */
	private seedRoomContextWindowFromChat = (room: RoomStore): void => {
		const cached = this._store.models.contextWindow;
		if (
			cached !== undefined &&
			this._store.models.selected?.engine_id === room.model?.engine_id
		) {
			room.setContextWindow(cached);
		}
	};

	/**
	 * Add a new workspace
	 */
	addWorkspace = async (
		data: Pick<
			Workspace,
			"name" | "system_prompt" | "description" | "mcp" | "prompts"
		>,
	): Promise<string> => {
		try {
			const mcp = data.mcp.map(
				({ name, id, type }): MCPConfig => ({ name, id, type }),
			);

			const pixel = `AddWorkspace(name=${JSON.stringify(data.name)}, description="<encode>${data.description}</encode>", systemPrompt="<encode>${data.system_prompt}</encode>", mcp=${JSON.stringify(mcp)}, prompts=${JSON.stringify(data.prompts)})`;
			const { pixelReturn } = await this._actions.run<[string]>(pixel);

			return pixelReturn[0].output;
		} catch (e) {
			throw e instanceof Error ? e : new Error(String(e));
		}
	};

	/**
	 * Edit a workspace
	 */
	editWorkspace = async (
		workspaceId: string,
		data: Pick<
			Workspace,
			"name" | "system_prompt" | "description" | "mcp" | "prompts"
		>,
	): Promise<string> => {
		try {
			const mcp = data.mcp.map(
				({ name, id, type }): MCPConfig => ({ name, id, type }),
			);

			const pixel = `EditWorkspace(workspaceId=${JSON.stringify(workspaceId)}, name=${JSON.stringify(data.name)}, description="<encode>${data.description}</encode>", systemPrompt="<encode>${data.system_prompt}</encode>", mcp=${JSON.stringify(mcp)}, prompts=${JSON.stringify(data.prompts)})`;
			const { pixelReturn } = await this._actions.run<[string]>(pixel);

			// throw errors
			if (!pixelReturn[0].output) {
				throw new Error();
			}

			return workspaceId;
		} catch (e) {
			throw e instanceof Error ? e : new Error(String(e));
		}
	};

	deleteWorkspace = async (workspaceId: string) => {
		try {
			await this._actions.run(
				`DeleteWorkspace(workspaceId=['${workspaceId}'])`,
			);

			return;
		} catch (e) {
			console.error(e);
		}
	};

	/**
	 * Helpers
	 */
	/**
	 * Get available models from the backend
	 */
	private getDefaultModel = async (): Promise<void> => {
		const defaultModelId =
			this._theme.defaultRoomSettings?.model?.engine_id ||
			DEFAUlT_MODEL_ID;
		const defaultModelName =
			this._theme.defaultRoomSettings?.model?.engine_display_name ||
			this._theme.defaultRoomSettings?.model?.engine_name ||
			DEFAUlT_MODEL_NAME;
		// model selection is not enabled, set it to the default
		if (!this._theme.featureFlags?.enableModelSelect) {
			this.setSelectedModel({
				engine_id: defaultModelId,
				engine_name: defaultModelName,
				engine_type: "MODEL",
			});
			return;
		}

		const { pixelReturn } = await this._actions.run<[Engine[]]>(
			`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
		);

		runInAction(() => {
			const { output } = pixelReturn[0];
			// profileDefaultModelId is already set by getUser(), which runs before this
			const profileDefaultModelId = this._store.profileDefaultModelId;
			let isSelected = false;

			// 1. theme/admin-enforced default
			if (defaultModelId) {
				for (const m of output) {
					if (m.engine_id === defaultModelId) {
						this.setSelectedModel(m);
						isSelected = true;
						break;
					}
				}
			}

			// 2. last model selected in this login session (survives refresh, resets on new login)
			if (!isSelected) {
				try {
					const sessionItem =
						sessionStorage.getItem(SESSION_MODEL_KEY);
					if (sessionItem) {
						const { model: sessionModel, lastLogin: storedLogin } =
							JSON.parse(sessionItem) as {
								model: Engine;
								lastLogin?: string;
							};
						const currentLogin = this._store.user.lastLogin;
						if (
							storedLogin &&
							currentLogin &&
							storedLogin === currentLogin
						) {
							for (const m of output) {
								if (m.engine_id === sessionModel.engine_id) {
									this.setSelectedModel(m);
									isSelected = true;
									break;
								}
							}
						}
					}
				} catch {}
			}

			// 3. user's profile default — used on fresh login when no session model exists
			if (!isSelected && profileDefaultModelId) {
				for (const m of output) {
					if (m.engine_id === profileDefaultModelId) {
						this.setSelectedModel(m);
						isSelected = true;
						break;
					}
				}
			}

			// 4. first available model
			if (!isSelected && output.length > 0) {
				this.setSelectedModel(output[0]);
			}
		});
	};
}
