import { makeAutoObservable, runInAction } from "mobx";
import type { Insight } from "@semoss/sdk/react";
import { MODEL_KEY } from "@/constants";
import type { Engine } from "@/types";
import { ChatRoom } from "./chat.room";

const DEFAUlT_MODEL = import.meta.env.VITE_DEFAUlT_MODEL || "";
const ENABLE_MODEL_SELECT = import.meta.env.VITE_ENABLE_MODEL_SELECT === "true";

interface ChatStoreInterface {
	/**
	 *  Track if the chat is initialized
	 */
	isInitialized: boolean;

	/**
	 *  Track if the chat is loading
	 */
	isLoading: boolean;

	/**
	 * Map of id to channel
	 */
	rooms: Record<string, ChatRoom>;

	/**
	 * Order of the rooms
	 */
	order: string[];

	/**
	 * List of the models available
	 */
	models: {
		/** All of the models */
		options: Engine[];

		/** The current model */
		selected: string;
	};

	/**
	 * Today's chats
	 */
	today: string[];

	/**
	 * Previous chats
	 */
	previousChats: string[];
}

/**
 * Internal state management of the builder object
 */
export class ChatStore {
	private _actions: Insight["actions"];
	private _error: Insight["error"];
	private _store: ChatStoreInterface = {
		isInitialized: false,
		isLoading: false,
		rooms: {},
		order: [],
		models: {
			options: [],
			selected: "",
		},
		today: [],
		previousChats: [],
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
	 * Get an indicator if the chat is loading
	 */
	get isLoading() {
		return this._store.isLoading;
	}

	/**
	 * Get the rooms from the store
	 */
	get rooms() {
		return this._store.rooms;
	}

	/**
	 * Get the order of the rooms
	 */
	get order() {
		return this._store.order;
	}

	/**
	 * Get the room from the store
	 *
	 * @param roomId - message to get
	 */
	getRoom(roomId: string): ChatRoom | null {
		return this._store.rooms[roomId];
	}

	/**
	 * Get the active roomId
	 */
	get models() {
		return this._store.models;
	}

	/**
	 * Get available models from the backend
	 */

	/**
	 * Get Today's chats
	 */
	get todayRooms() {
		return this._store.today;
	}

	/**
	 * Get Previous chats
	 */
	get previousRooms() {
		return this._store.previousChats;
	}

	/**
	 * Initialize the store
	 */
	initialize = async (): Promise<void> => {
		try {
			// set as initialized
			Promise.all([
				// get the room info
				this.getRooms(),
				// get the model info
				this.getModels(),
			]).finally(() => {
				runInAction(() => {
					this._store.isInitialized = true;
				});
			});
		} catch (_e) {
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Create a new room instance
	 */
	newRoom = (roomId: string): ChatRoom => {
		// create a new room
		const room = new ChatRoom(roomId);

		// store the room
		this._store.rooms[roomId] = room;

		return room;
	};

	/**
	 * Open a room
	 *
	 * @param modelId - modelId to open the room with
	 * @param name - name of the room
	 */
	createRoom = async (modelId: string, name: string): Promise<ChatRoom> => {
		try {
			// turn on the loading screen
			this.setIsLoading(true);

			// wait for the pixel to run
			const { pixelReturn } =
				await this._actions.run<
					[
						{
							roomId: string;
						},
					]
				>(`CreateRoom();`);

			// throw errors
			if (this._error) {
				throw new Error(this._error.message);
			}

			// get the output
			const { output } = pixelReturn[0];

			// get the roomId
			const roomId = output.roomId;

			const today = new Date();

			// register the room
			const room = this.newRoom(roomId);

			// set the initial data
			room.setModel(modelId);
			room.setMetadata({
				name: name,
				dateCreated: today.toDateString(),
			});

			runInAction(() => {
				// add to the front
				this._store.order.unshift(roomId);

				// add to today's chats front
				this._store.today.unshift(roomId);
			});

			// return the room
			return room;
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Remove an room from the remove and all of the related messages
	 * @param roomId - Room to remove
	 */
	closeRoom = async (roomId: string): Promise<void> => {
		try {
			// remove from the order
			const idx = this._store.order.indexOf(roomId);
			if (idx > -1) {
				this._store.order.splice(idx, 1);
			}

			// remove from the today's chat room
			const tIdx = this._store.today.indexOf(roomId);
			if (this._store.today.indexOf(roomId) > -1) {
				this._store.today.splice(tIdx, 1);
			}

			// remove from the previous chat room
			const pIdx = this._store.previousChats.indexOf(roomId);
			if (pIdx > -1) {
				this._store.previousChats.splice(pIdx, 1);
			}

			// delete the room
			delete this._store.rooms[roomId];

			// wait for the pixel to run
			await this._actions.run<[boolean]>(
				`CloseRoom(roomId=["${roomId}"]);`,
			);

			// throw errors
			if (this._error) {
				throw new Error(this._error.message);
			}

			return;
		} catch (_e) {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Get available models from the backend
	 */
	setSelectedModel = async (modelIdArray: string): Promise<void> => {
		this.models.selected = modelIdArray;

		// save to local storage
		if (localStorage) {
			localStorage.setItem(
				MODEL_KEY,
				JSON.stringify(this.models.selected),
			);
		}
	};

	/**
	 * Helpers
	 */
	/**
	 * Get the current rooms
	 */
	private getRooms = async (): Promise<void> => {
		try {
			// turn on the loading screen
			this.setIsLoading(true);

			// clear the order info
			this._store.order = [];

			// wait for the pixel to run
			const { pixelReturn } = await this._actions.run<
				[
					{
						ROOM_ID: string;
						ROOM_NAME: string;
						DATE_CREATED: string;
					}[],
				]
			>(`GetUserConversationRooms();`);

			// throw errors
			if (this._error) {
				throw new Error(this._error.message);
			}
			// get the output
			const { output } = pixelReturn[0];

			// get the info
			const order = [];
			const previousRooms = [];
			const todayRooms = [];

			// create room objects for each one. This will not instantiate it.
			for (const r of output) {
				// check if it exists
				let room = this.getRoom(r.ROOM_ID);

				// create a new one if it doesn't
				if (!room) {
					room = this.newRoom(r.ROOM_ID);
				}

				room.setMetadata({
					name: r.ROOM_NAME,
					dateCreated: r.DATE_CREATED,
				});

				// parse current date
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				// parse room date
				const roomDate = new Date(r.DATE_CREATED);
				roomDate.setHours(0, 0, 0, 0);

				// decide where to push - today's chats or previous chats
				if (roomDate.getTime() === today.getTime()) {
					todayRooms.push(r.ROOM_ID);
				} else {
					previousRooms.push(r.ROOM_ID);
				}

				// store the order
				order.push(r.ROOM_ID);
			}

			runInAction(() => {
				// clear the room info
				this._store.order = order;
				this._store.previousChats = previousRooms;
				this._store.today = todayRooms;
			});
		} finally {
			this.setIsLoading(false);
		}
	};

	/**
	 * Get available models from the backend
	 */
	private getModels = async (): Promise<void> => {
		// model selection is not enabled, set it to the default
		if (!ENABLE_MODEL_SELECT) {
			this._store.models = {
				options: [],
				selected: DEFAUlT_MODEL,
			};

			return;
		}

		try {
			// turn on the loading screen
			this.setIsLoading(true);

			// clear the models
			this._store.models = {
				options: [],
				selected: "",
			};

			// wait for the pixel to run
			const { pixelReturn } = await this._actions.run<[Engine[]]>(
				` MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "text-generation" }] , engineTypes = [ 'MODEL' ] )`,
			);

			// throw errors
			// throw errors
			if (this._error) {
				throw new Error(this._error.message);
			}

			runInAction(() => {
				// get the output
				const { output } = pixelReturn[0];
				// store the models
				this._store.models.options = output.map((m) => ({
					...m,
					app_name: m.app_name ? m.app_name.replace(/_/g, " ") : "",
				}));

				// track if it was set from one of the options
				let isSelected = false;

				// set to default if it is an option
				for (const m of this._store.models.options) {
					if (m.app_id === DEFAUlT_MODEL) {
						this.setSelectedModel(m.app_id);
						isSelected = true;
						break;
					}
				}

				// pull from local storage
				try {
					if (!isSelected) {
						if (localStorage) {
							const storedItem = localStorage.getItem(MODEL_KEY);
							if (storedItem) {
								const storedModel = JSON.parse(storedItem);
								for (const m of this._store.models.options) {
									if (storedModel === m.app_id) {
										this.setSelectedModel(m.app_id);
										isSelected = true;
										break;
									}
								}
							}
						}
					}
				} catch {}

				if (!isSelected && this._store.models.options.length > 0) {
					this.setSelectedModel(this._store.models.options[0].app_id);
					isSelected = true;
				}
			});
		} finally {
			this.setIsLoading(false);
		}
	};

	/**
	 * Set the isLoading boolean
	 * @param isLoading - is it loading
	 */
	private setIsLoading = (isLoading: boolean): void => {
		this._store.isLoading = isLoading;
	};
}
