import { makeAutoObservable, runInAction } from "mobx";
import { type Insight, runPixel, upload } from "@semoss/sdk/react";
import { MODEL_KEY } from "@/constants";
import type { Engine, MCPConfig, Workspace } from "@/types";
import type { RoomStore } from "../room";

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
	};

	/**
	 * Options related to the navbar
	 */
	keys: {
		/**
		 * Counter to force re-render of the nav when the rooms change
		 */
		roomCounter: number;
	};
}

/**
 * Manage the chat
 */
export class ChatStore {
	private _actions: Insight["actions"];
	private _error: Insight["error"];
	private _store: ChatStoreInterface = {
		isInitialized: false,
		models: {
			selected: null,
		},
		keys: {
			roomCounter: 0,
		},
	};

	constructor(actions: Insight["actions"]) {
		this._actions = actions;

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
	 *
	 * @param modelId - modelId to open the room with
	 * @param name - name of the room
	 */
	createRoom = async (
		prompt: string,
		files: File[],
		mode: RoomStore["mode"],
		modelId: string,
		options: RoomStore["options"],
	): Promise<string> => {
		// create the room in a new insight
		const { errors, pixelReturn, insightId } = await runPixel<
			[
				{
					roomId: string;
				},
			]
		>(`CreatePlaygroundRoom();`, "new");

		// throw errors
		if (errors.length > 0) {
			throw new Error(errors.join(""));
		}

		// get the output
		const { output } = pixelReturn[0];

		// get the new roomId
		const roomId = output.roomId;

		// upload any files
		let uploaded = [];
		if (files.length > 0) {
			uploaded = await upload(files, insightId, "", "");
		}

		let pixel = ``;

		// Filter out workspace MCPs before saving (they shouldn't be persisted to the room)
		const optionsToSave = {
			...options,
			modelId: modelId,
			mcp: options.mcp.filter((mcp) => !mcp?.fromWorkspace),
		};

		// set the options
		pixel += `UpdateRoomOptions(roomId=${JSON.stringify(roomId)}, roomOptions=[${JSON.stringify(
			optionsToSave,
		)}]);`;

		// run the first message
		if (mode === "chat") {
			pixel += `AskPlayground(
engine=["${modelId}"],
roomId=["${roomId}"],
command=["<encode>${prompt}</encode>"],
${options.instructions ? `context=["<encode>${options.instructions}</encode>"],` : `context=[],`}
${uploaded.length ? `image=${JSON.stringify(uploaded.map((file) => file.fileLocation))},` : "image=[],"}
paramValues=[${JSON.stringify({
				max_new_tokens: options.tokenLength,
				temperature: options.temperature,
			})}]
);`;
		} else if (mode === "planning") {
			pixel += `AskCOTRoom(
engine=["${modelId}"],
roomId=["${roomId}"],
command=["<encode>${prompt}</encode>"],
${options.instructions ? `context=["<encode>${options.instructions}</encode>"],` : `context=[],`}
${uploaded.length ? `image=${JSON.stringify(uploaded.map((file) => file.fileLocation))},` : "image=[],"}
paramValues=[${JSON.stringify({
				max_new_tokens: options.tokenLength,
				temperature: options.temperature,
			})}]
);`;
		}

		// link the workspace if it is there
		if (options.workspace?.workspace_id) {
			pixel += `SetRoomWorkspace(roomId=${JSON.stringify(roomId)}, workspaceId=${JSON.stringify(options.workspace?.workspace_id)});`;
		}

		// clean up
		pixel += `DropInsight();`;

		const response = await runPixel<
			[
				{
					roomId: string;
				},
			]
		>(pixel, insightId);

		if (response.errors.length > 0) {
			throw new Error(response.errors.join(""));
		}

		// increment the roomCounter to force re-render of the nav
		runInAction(() => {
			this._store.keys.roomCounter++;
		});

		// return the room
		return roomId;
	};

	/**
	 * Remove an room from the remove and all of the related messages
	 * @param roomId - Room to remove
	 */
	closeRoom = async (roomId: string): Promise<void> => {
		// wait for the pixel to run
		await this._actions.run<[boolean]>(
			`RemoveUserRoom(roomId=["${roomId}"]);`,
		);

		// throw errors
		if (this._error) {
			throw new Error(this._error.message);
		}

		// increment the roomCounter to force re-render of the nav
		runInAction(() => {
			this._store.keys.roomCounter++;
		});
	};

	/**
	 * Set the selected model
	 */
	setSelectedModel = (model: Engine): void => {
		this.models.selected = model;

		// save to local storage
		if (localStorage) {
			localStorage.setItem(
				MODEL_KEY,
				JSON.stringify(this.models.selected),
			);
		}
	};

	/**
	 * Set the selected model by its id
	 */
	setSelectedModelById = async (modelId: string): Promise<void> => {
		if (!modelId || this.models.selected?.app_id === modelId) {
			return;
		}

		// get available models
		const { pixelReturn } = await this._actions.run<[Engine[]]>(
			` MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "text-generation" }] , engineTypes = [ 'MODEL' ], filterWord=${JSON.stringify(modelId)})`,
		);

		// throw errors
		if (this._error) {
			throw new Error(this._error.message);
		}

		// If not found, do nothing
		if (pixelReturn[0].output.length === 0) {
			throw new Error("Model not found");
		}

		this.setSelectedModel(pixelReturn[0].output[0]);
	};

	/**
	 * Add a new workspace
	 */
	addWorkspace = async (
		data: Pick<Workspace, "name" | "system_prompt" | "description" | "mcp">,
	): Promise<string> => {
		try {
			const mcp = data.mcp.map(
				({ name, id, type }): MCPConfig => ({ name, id, type }),
			);

			const pixel = `AddWorkspace(name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.system_prompt)}, mcp=${JSON.stringify(mcp)})`;
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
		data: Pick<Workspace, "name" | "system_prompt" | "description" | "mcp">,
	): Promise<string> => {
		try {
			const mcp = data.mcp.map(
				({ name, id, type }): MCPConfig => ({ name, id, type }),
			);

			const pixel = `EditWorkspace(workspaceId=${JSON.stringify(workspaceId)},name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.system_prompt)}, mcp=${JSON.stringify(mcp)})`;
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
		// model selection is not enabled, set it to the default
		if (!ENABLE_MODEL_SELECT) {
			this.setSelectedModel({
				app_id: DEFAUlT_MODEL_ID,
				app_name: DEFAUlT_MODEL_NAME,
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
			for (const m of output) {
				if (m.app_id === DEFAUlT_MODEL_ID) {
					this.setSelectedModel(m);
					isSelected = true;
					break;
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
