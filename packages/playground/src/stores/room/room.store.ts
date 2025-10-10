import { makeAutoObservable, runInAction } from "mobx";
import { download, runPixel, upload } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import {
	type AbstractMessageStore,
	createMessageStore,
	InputMessageStore,
	type PlanMessageStore,
	type ResponseMessageStore,
	RootMessageStore,
} from "@/stores";
import type { PixelMessage, Toolbox } from "@/types";

interface RoomStoreInterface {
	/**
	 * ID of the room
	 */
	roomId: string;

	/**
	 *  Track if the room is initialized
	 */
	isInitialized: boolean;

	/**
	 *  Track if the room is loading
	 */
	isLoading: boolean;

	/**
	 *  Track the mode of the room.
	 */
	mode: "planning" | "executing" | "chat";

	/**
	 * Metadata associated with the room
	 */
	metadata: {
		/**
		 * Name of the room
		 */
		name: string;

		/**
		 * date the room was created
		 */
		dateCreated: string;
	};

	/*
	 * Model that is being chatted against
	 */
	modelId: string;

	/**
	 * Root message
	 */
	root: RootMessageStore;

	/*
	 * Options that is passed to the model
	 */
	options: {
		/*
		 * Context that is passed to the model
		 */
		instructions: string;

		/*
		 * Tools loaded into the room
		 */
		tools: Toolbox[];

		/*
		 * Length of the token
		 */
		tokenLength: number;

		/*
		 * Temperature of the model
		 */
		temperature: number;

		/*
		 * Agents associated with the room
		 */
		agent?: {
			agent_id: string;
		};
	};

	/**
	 *  Sidebar information
	 */
	sidebar: {
		/** Track if the sidebar is open */
		isOpen: boolean;

		/** type of sidebar to open */
		type: "CONFIGURATION" | "ARTIFACTS";
	};

	/**
	 * Artifact information
	 **/
	artifact: {
		/**
		 * FlexLayout model
		 */
		model: FlexLayout.Model | null;
	};
}

/**
 * Manage the room
 */
export class RoomStore {
	private _insightID = "new";
	private _store: RoomStoreInterface = {
		roomId: "",
		isInitialized: false,
		isLoading: false,
		mode: "chat",
		metadata: {
			name: "",
			dateCreated: "",
		},
		modelId: "",
		root: new RootMessageStore(this),
		options: {
			instructions: "",
			tools: [],
			tokenLength: TOKEN_LENGTH,
			temperature: TEMPERATURE,
		},
		sidebar: {
			isOpen: false,
			type: "CONFIGURATION",
		},
		artifact: {
			model: FlexLayout.Model.fromJson({
				global: {},
				borders: [],
				layout: {
					type: "row",
					weight: 0,
					children: [],
				},
			}),
		},
	};

	constructor(roomId: string) {
		// register the roomId and actions
		this._store.roomId = roomId;

		// make it observable
		makeAutoObservable(this);
	}

	/**
	 * Getters
	 */
	/**
	 * Get the id of the roomId
	 */
	get roomId() {
		return this._store.roomId;
	}

	/**
	 * Indicator to chack if it is ready for use
	 */
	get isInitialized() {
		return this._store.isInitialized;
	}

	/**
	 * Indicator to check if the room is loading
	 */
	get isLoading() {
		return this._store.isLoading;
	}

	/**
	 * Get the mode of the room
	 */
	get mode() {
		return this._store.mode;
	}

	/**
	 * Metadata associated with the room
	 */
	get metadata() {
		return this._store.metadata;
	}

	/**
	 * Models that the user is interacting with
	 */
	get modelId() {
		return this._store.modelId;
	}

	/**
	 * Get a message by id the model
	 * @param messageId - model to use in the room
	 */
	getMessage = (messageId: string) => {
		const queue: AbstractMessageStore[] = [this._store.root];
		while (queue.length > 0) {
			const current = queue.shift();

			if (current.id === messageId) {
				return current;
			}

			queue.push(...current.children);
		}

		return null;
	};

	/**
	 * Get the history of the room based on the active children
	 */
	get history(): (
		| InputMessageStore
		| ResponseMessageStore
		| PlanMessageStore
	)[] {
		return this._store.root.history || [];
	}

	/**
	 * Last active message
	 */
	get tail() {
		if (this.history[this.history.length - 1]) {
			return this.history[this.history.length - 1];
		}

		return this._store.root;
	}

	/**
	 * Get the most recent plan
	 */
	get plan(): PlanMessageStore | null {
		// Search through history in reverse order to find the most recent plan
		for (let i = this.history.length - 1; i >= 0; i--) {
			const message = this.history[i];
			if (message.type === "PLAN") {
				return message as PlanMessageStore;
			}
		}

		return null;
	}

	/**
	 * Get the options of the room
	 */
	get options() {
		return this._store.options;
	}

	/**
	 * Get the sidebar information
	 */
	get sidebar() {
		return this._store.sidebar;
	}

	/**
	 * Get the artifact information
	 */
	get artifact() {
		return this._store.artifact;
	}

	/** Setters */
	/**
	 * Set the mode
	 * @param mode - mode of the room
	 */
	setMode = (mode: "planning" | "executing" | "chat") => {
		this._store.mode = mode;
	};

	/**
	 * Set the model
	 * @param modelId - model to use in the room
	 */
	setModel = (modelId: string) => {
		this._store.modelId = modelId;
	};

	/**
	 * Set options
	 * @param options - options
	 */
	setOptions = (options: Partial<RoomStoreInterface["options"]>) => {
		this._store.options = {
			...this._store.options,
			...options,
		};
	};

	/**
	 * Set the mdetadata
	 * @param metadata - metadata
	 */
	setMetadata = (metadata: Partial<RoomStoreInterface["metadata"]>) => {
		this._store.metadata = {
			...this._store.metadata,
			...metadata,
		};
	};
	/** Actions */
	/**
	 * Initialize the room and load messages and options if they are there
	 */
	initialize = async () => {
		const loadMessages = async () => {
			// get all of the messages in historical order (sorted)
			const response = await this.runRoomPixel<[PixelMessage[]]>(
				`GetPlaygroundMessages(roomId=["${this._store.roomId}"]);`,
			);

			const { output } = response.pixelReturn[0];

			const root = new RootMessageStore(this);
			const messages: Record<
				string,
				{
					parentMessageId: string;
					message:
						| InputMessageStore
						| ResponseMessageStore
						| PlanMessageStore;
				}
			> = {};

			// store the last model
			let activeModelId = this._store.modelId;

			// This is done as seperate loops because of INPUT_TOOL_EXEC
			for (const pixelMessage of output) {
				if (pixelMessage.type === "INPUT_TEXT") {
					activeModelId = pixelMessage.modelId;
				}

				// create the message
				const message = createMessageStore(this, pixelMessage);

				// store it
				messages[message.id] = {
					parentMessageId: pixelMessage.parentMessageId || "",
					message: message,
				};
			}

			// link the messages
			for (const mId in messages) {
				const m = messages[mId];

				const parent = messages[m.parentMessageId];
				if (parent) {
					parent.message.addChild(m.message);
				} else {
					root.addChild(m.message);
				}
			}
			runInAction(() => {
				// set the model based on the history
				this.setModel(activeModelId);

				// store it
				this._store.root = root;
			});
		};

		const loadOptions = async () => {
			const response = await this.runRoomPixel<
				RoomStoreInterface["options"][]
			>(`GetRoomOptions(roomId=${JSON.stringify(this._store.roomId)});`);
			const { output } = response.pixelReturn[0];

			runInAction(() => {
				// set the options based on the history
				this.setOptions(output);

				// mark as initialized
				this._store.isInitialized = true;
			});
		};

		try {
			// only load messages once
			if (this._store.isInitialized) {
				return;
			}

			// turn on the loading screen
			this.setIsLoading(true);

			await Promise.all([loadMessages(), loadOptions()]);

			runInAction(() => {
				// mark as initialized
				this._store.isInitialized = true;
			});
		} finally {
			this.setIsLoading(false);
		}
	};

	/**
	 * Link Agent
	 * @param agentId - Agent id to link to the room
	 */
	legacyLinkAgent = async (agentId: string) => {
		try {
			const { errors } = await this.runRoomPixel<
				[
					{
						roomId: string;
					},
				]
			>(
				`SetRoomWorkspace(roomId=${JSON.stringify(this._store.roomId)}, workspaceId=${JSON.stringify(agentId)});`,
			);

			if (errors?.length > 0) {
				throw new Error(errors?.join(", ") || undefined);
			}
		} catch (e) {
			throw new Error(e.message || "Error linking agent");
		}
	};

	/**
	 * UpdateRoomOptions
	 * @param options - full set of new options
	 */
	updateRoomOptions = async (options: RoomStore["options"]) => {
		try {
			const { errors } = await this.runRoomPixel(
				`UpdateRoomOptions(roomId=${JSON.stringify(this._store.roomId)}, roomOptions=[${JSON.stringify(
					options,
				)}]);`,
			);

			if (errors?.length > 0) {
				throw new Error(errors?.join(", ") || undefined);
			}
			this._store.options = options;
		} catch (e) {
			throw new Error(e.message || "Error updating room options");
		}
	};

	/**
	 * Download the history of the room as a PDF
	 */
	downloadHistory = async (): Promise<void> => {
		try {
			// turn on the loading screen
			this.setIsLoading(true);

			// convert the content to html
			const html = this.history
				.map((message) => {
					if (message.type === "RESPONSE") {
						return `<div>Response: ${message.text}</div>`;
					}

					if (message.type === "INPUT") {
						return `<div>Input: ${message.text}</div>`;
					}

					return "";
				})
				.join("\n");

			// wait for the pixel to run
			const { pixelReturn } = await this.runRoomPixel<[string]>(
				`ToPdf( html=["<encode>${html}</encode>"]);`,
			);

			// get the response
			await this.downloadRoomFiles(pixelReturn[0].output);
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Sidebar
	 */
	/**
	 * Open the sidebar
	 * @param options - options to pass in
	 */
	openSidebar = async (
		type: RoomStoreInterface["sidebar"]["type"],
	): Promise<void> => {
		this._store.sidebar.isOpen = true;
		this._store.sidebar.type = type;
	};

	/**
	 * Close the sidebar
	 */
	closeSidebar = async (): Promise<void> => {
		this._store.sidebar.isOpen = false;
	};

	/**
	 * Helpers
	 */
	/**
	 * Set the isLoading boolean
	 * @param isLoading - is it loading
	 */
	private setIsLoading = (isLoading: boolean): void => {
		this._store.isLoading = isLoading;
	};

	/**
	 * Ask a message to the room
	 * @param prompt - user message
	 * @param files - files
	 */
	askMessage = async (prompt: string, files: File[] = []): Promise<void> => {
		if (!this.modelId) {
			throw new Error("Model is required");
		}

		if (!prompt) {
			throw new Error("Prompt is required");
		}

		// upload the files
		let uploaded = [];
		if (files.length > 0) {
			uploaded = await this.uploadRoomFiles(files, "");
		}

		// create the input message
		const inputMessage = new InputMessageStore(this, {
			messageId: "TEMP",
			type: "INPUT_TEXT",
			visible: true,
			inputUIPrompt: prompt,
			files: uploaded,
			modelId: this.modelId,
			paramMap: {
				max_new_tokens: this.options.tokenLength,
				temperature: this.options.temperature,
			},
			dateCreated: "",
		});

		// get the parent message
		const parentMessage = this.tail;
		if (parentMessage instanceof InputMessageStore) {
			throw new Error("Cannot respond to input messages");
		}

		// run the message
		await parentMessage.runMessage(inputMessage);

		// go next if we want
	};

	/**
	 * Run a pixel
	 * @param pixel - pixel
	 */
	runRoomPixel = async <O extends [] | unknown[]>(
		pixel: string,
		showLoading: boolean = true,
	) => {
		try {
			if (showLoading) {
				this.setIsLoading(true);
			}

			// get the response
			const response = await runPixel<O>(pixel, this._insightID);

			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}

			// store the new insight id
			runInAction(() => {
				this._insightID = response.insightId;
			});

			return response;
		} finally {
			if (showLoading) {
				this.setIsLoading(false);
			}
		}
	};

	/**
	 * Download a file from the room
	 * @param fileKey - key
	 */
	downloadRoomFiles = async (fileKey: string) => {
		// get the response
		await download(this._insightID, fileKey);
	};

	/**
	 * Upload a file to the room
	 * @param fileKey - key
	 */
	uploadRoomFiles = async (files: File[], path: string = "") => {
		// get the response
		return await upload(files, this._insightID, "", path);
	};
}
