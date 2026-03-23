import { makeAutoObservable, runInAction } from "mobx";
import { type Insight, runPixel } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { MODEL_KEY } from "@/constants";
import type { Engine, MCPConfig, Workspace } from "@/types";
import { RoomStore } from "../room";

const DEFAUlT_MODEL_ID = import.meta.env.VITE_DEFAUlT_MODEL_ID || "";
const DEFAUlT_MODEL_NAME = import.meta.env.VITE_DEFAUlT_MODEL_NAME || "";
const ENABLE_MODEL_SELECT = import.meta.env.VITE_ENABLE_MODEL_SELECT === "true";

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
		selected: Engine | null;

		/** The current context window */
		contextWindow?: number;
	};

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
	 * Current user info
	 */
	user: {
		id: string;
		name: string;
	};
}

/**
 * Manage the chat
 */
export class ChatStore {
	private _theme: ThemeMap["playground"];
	private _actions: Insight["actions"];
	private _error: Insight["error"];
	private _store: ChatStoreInterface = {
		isInitialized: false,
		models: {
			selected: null,
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
	};

	constructor(
		theme: ThemeMap["playground"],
		actions: Insight["actions"],
		user?: {
			id: string;
			name: string;
		},
	) {
		this._theme = theme;
		this._actions = actions;
		if (user) {
			this._store.user = user;
		}

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
	 * Initialize the store
	 */
	initialize = async (): Promise<void> => {
		try {
			// set as initialized
			Promise.all([
				// get the default model info
				this.getDefaultModel(),
			]).finally(() => {
				runInAction(() => {
					this._store.isInitialized = true;
				});
			});
		} catch (e) {
			console.error(e);
		}
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

		// throw errors
		if (this._error) {
			throw new Error(this._error.message);
		}

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

		// If the room has no messages or just the placeholder, it means it is a valid room but it is empty, so we can consider it as not found and throw an error
		// This happens if CreateRoom succeeds but the first AskPlayground call fails
		if (!room.tail || room.tail.id === "ROOT_PLACEHOLDER_ID") {
			throw new Error("Room not found");
		}

		runInAction(() => {
			// save it to the cache
			this._store.rooms[roomId] = room;

			// increment the roomCounter to force re-render of the nav
			this._store.keys.roomCounter++;
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

		// save to local storage
		if (localStorage) {
			localStorage.setItem(
				MODEL_KEY,
				JSON.stringify(this.models.selected),
			);
		}

		this.loadEngineContextWindow(model.app_id);
	};

	private loadEngineContextWindow = async (engineId: string) => {
		runInAction(() => {
			this._store.models.contextWindow = undefined;
		});

		const { pixelReturn } = await this._actions.run<[number | undefined]>(
			`GetContextWindow(${JSON.stringify(engineId)});`,
		);

		// throw errors
		if (this._error) {
			throw new Error(this._error.message);
		}

		if (this.models.selected?.app_id === engineId) {
			runInAction(() => {
				this._store.models.contextWindow = pixelReturn[0].output;
			});
		}
	};

	/**
	 * Add a new workspace
	 */
	addWorkspace = async (
		data: Pick<
			Workspace,
			| "name"
			| "system_prompt"
			| "description"
			| "mcp"
			| "prompt_library_tag"
		>,
	): Promise<string> => {
		try {
			const mcp = data.mcp.map(
				({ name, id, type }): MCPConfig => ({ name, id, type }),
			);

			const pixel = `AddWorkspace(name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.system_prompt)}, mcp=${JSON.stringify(mcp)}, promptLibraryTag=${JSON.stringify(data.prompt_library_tag)})`;
			const { pixelReturn } = await this._actions.run<[string]>(pixel);

			// throw errors
			if (this._error) {
				throw new Error(this._error.message);
			}

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
			| "name"
			| "system_prompt"
			| "description"
			| "mcp"
			| "prompt_library_tag"
		>,
	): Promise<string> => {
		try {
			const mcp = data.mcp.map(
				({ name, id, type }): MCPConfig => ({ name, id, type }),
			);

			const pixel = `EditWorkspace(workspaceId=${JSON.stringify(workspaceId)},name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.system_prompt)}, mcp=${JSON.stringify(mcp)}, promptLibraryTag=${JSON.stringify(data.prompt_library_tag)})`;
			const { pixelReturn } = await this._actions.run<[string]>(pixel);

			// throw errors
			if (this._error || !pixelReturn[0].output) {
				throw new Error(this._error.message);
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
			// throw errors
			if (this._error) {
				throw new Error(this._error.message);
			}

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
			this._theme.defaultRoomSettings.model?.app_id || DEFAUlT_MODEL_ID;
		const defaultModelName =
			this._theme.defaultRoomSettings.model?.app_name ||
			DEFAUlT_MODEL_NAME;
		// model selection is not enabled, set it to the default
		if (!ENABLE_MODEL_SELECT) {
			this.setSelectedModel({
				app_id: defaultModelId,
				app_name: defaultModelName,
				app_type: "MODEL",
			});
			return;
		}

		// initially limit to 10 models
		const { pixelReturn } = await this._actions.run<[Engine[]]>(
			` MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "text-generation" }] , engineTypes = [ 'MODEL' ] )`,
		);

		// throw errors
		if (this._error) {
			throw new Error(this._error.message);
		}

		runInAction(() => {
			// get the output
			const { output } = pixelReturn[0];

			// track if it was set from one of the options
			let isSelected = false;

			// set to default if it is an option
			if (defaultModelId) {
				for (const m of output) {
					if (m.app_id === defaultModelId) {
						this.setSelectedModel(m);
						isSelected = true;
						break;
					}
				}
			}

			// check with local storage and try to set if it is one of them
			try {
				if (!isSelected) {
					if (localStorage) {
						const storedItem = localStorage.getItem(MODEL_KEY);
						if (storedItem) {
							const storedModel = JSON.parse(storedItem);
							for (const m of output) {
								if (storedModel === m.app_id) {
									this.setSelectedModel(m);
									isSelected = true;
									break;
								}
							}
						}
					}
				}
			} catch {}

			if (!isSelected && output.length > 0) {
				this.setSelectedModel(output[0]);
				isSelected = true;
			}
		});
	};
}
