import { makeAutoObservable, runInAction } from "mobx";
import { download, runPixel, upload } from "@semoss/sdk/react";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import type { Knowledge, PixelMessage, Tool } from "@/types";
import { ChatMessage } from "./chat.message";

const ROOT_MESSAGE_ID = "ROOT";
const TEMP_MESSAGE_ID = "TEMP";

interface ChatRoomInterface {
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
	root: ChatMessage;

	/*
	 * Options that is passed to the model
	 */
	options: {
		/*
		 * Context that is passed to the model
		 */
		instructions: string;

		/*
		 * Vector databases loaded into the room
		 */
		knowledge: Knowledge | null;

		/*
		 * Tools loaded into the room
		 */
		tools: Tool[];

		/*
		 * Length of the token
		 */
		tokenLength: number;

		/*
		 * Temperature of the model
		 */
		temperature: number;

		/*
		 * Whether to auto execute functions or not
		 */
		autoExecute: boolean;

		/*
		 * Whether to show UI artifacts or not
		 */
		showUi: boolean;

		/*
		 * Whether to tell LLM to show thought process in steps
		 */
		chainOfThought: boolean;
	};

	/**
	 *  Sidebar information
	 */
	sidebar: {
		/** Track if the sidebar is open */
		isOpen: boolean;

		/** Options to pass into the sidbear */
		options:
			| {
					type: "CONTROLS";
			  }
			| {
					type: "APP";
					messageId: string;
					toolName: string;
					toolId: string;
					toolParameters: Record<string, unknown>;
			  };
	};
}

/**
 * Internal state management of the builder object
 */
export class ChatRoom {
	private _insightID = "new";
	private _store: ChatRoomInterface = {
		roomId: "",
		isInitialized: false,
		isLoading: false,
		metadata: {
			name: "",
			dateCreated: "",
		},
		modelId: "",
		root: new ChatMessage(ROOT_MESSAGE_ID),
		options: {
			instructions: "",
			knowledge: null,
			tools: [],
			tokenLength: TOKEN_LENGTH,
			temperature: TEMPERATURE,
			autoExecute: false,
			showUi: false,
			chainOfThought: false,
		},
		sidebar: {
			isOpen: false,
			options: { type: "CONTROLS" },
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
	 * Get the history of the room based on the active children
	 */
	get history() {
		let current = this._store.root;

		const history: ChatMessage[] = [];
		while (current) {
			if (current.activeChild) {
				// save it
				history.push(current.activeChild);
			}

			// move forward
			current = current.activeChild;
		}

		return history;
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
	 * Get the options of the room
	 */
	get options() {
		return this._store.options;
	}

	/**
	 * Get the sidbar information
	 */
	get sidebar() {
		return this._store.sidebar;
	}

	/** Setters */
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
	setOptions = (options: Partial<ChatRoomInterface["options"]>) => {
		this._store.options = {
			...this._store.options,
			...options,
		};
	};

	/**
	 * Set the mdetadata
	 * @param metadata - metadata
	 */
	setMetadata = (metadata: Partial<ChatRoomInterface["metadata"]>) => {
		this._store.metadata = {
			...this._store.metadata,
			...metadata,
		};
	};
	/** Actions */

	/**
	 * Initialize the room and load messages if they are there
	 */
	initialize = async () => {
		try {
			// only load messages once
			if (this._store.isInitialized) {
				return;
			}

			// turn on the loading screen
			this.setIsLoading(true);

			// get all of the messages in historical order (sorted)
			const response = await this.runPixel<[PixelMessage[]]>(
				`GetPlaygroundMessages(roomId=["${this._store.roomId}"]);`,
			);

			const { output, operationType } = response.pixelReturn[0];

			// throw errors
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(output as unknown as string);
			}

			const root = new ChatMessage(ROOT_MESSAGE_ID);
			const messages: Record<string, ChatMessage> = {};

			// store the last model
			let activeModelId = this._store.modelId;
			let activeOptions: Pick<
				ChatRoomInterface["options"],
				"tokenLength" | "temperature"
			> = {
				...this._store.options,
			};

			for (const pixelMessage of output) {
				if (pixelMessage.type === "INPUT_TEXT") {
					activeModelId = pixelMessage.modelId;
					activeOptions = {
						...activeOptions,
						temperature: pixelMessage.paramMap.temperature,
						tokenLength: pixelMessage.paramMap.max_new_tokens,
					};
				}

				// create a message
				const message = this.createChatMessage(pixelMessage);

				// store it
				messages[message.id] = message;

				// link to parent
				const parentMessage = messages[pixelMessage.parentMessageId];
				if (parentMessage) {
					parentMessage.addChild(message);
				} else {
					root.addChild(message);
				}
			}

			runInAction(() => {
				// set the model + options based on the history
				this.setModel(activeModelId);
				this.setOptions(activeOptions);

				// store it
				this._store.root = root;

				// mark as initialized
				this._store.isInitialized = true;
			});
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Send a new user message and recieve a response
	 * @param prompt - user message
	 */
	askModel = async (
		prompt: string,
		files: File[],
		options?: Partial<ChatRoomInterface["options"]>,
	): Promise<void> => {
		try {
			if (!this._store.modelId) {
				throw new Error("Model is required");
			}

			if (!prompt) {
				throw new Error("Prompt is required");
			}
			// turn on the loading screen
			this.setIsLoading(true);

			// options to use with the ask
			if (options) {
				this.setOptions(options);
			}

			// get the parentMessageId (the current tail)
			const parentMessageId = this.tail.id;

			// create the input message
			const inputMessage = this.createChatMessage({
				messageId: TEMP_MESSAGE_ID,
				type: "INPUT_TEXT",
				visible: true,
				inputUIPrompt: prompt,
				modelId: this._store.modelId,
				paramMap: {
					max_new_tokens: this._store.options.tokenLength,
					temperature: this._store.options.temperature,
				},
				dateCreated: "",
				ornaments: {
					chunks: [],
				},
			});

			// connect to the tail
			this.tail.addChild(inputMessage);

			// upload the files
			let uploaded = [];
			if (files.length > 0) {
				uploaded = await this.upload(files, "");
			}

			// build the context if it is there
			let context = "";
			if (this._store.options?.instructions) {
				context = this._store.options?.instructions;
			}

			// get a list of tool ids
			const tools: string[] = this._store.options.tools.map(
				(t) => t.id,
				[],
			);

			// wait for the pixel to run
			const response = await this.runPixel<
				[
					{
						inputMessage: PixelMessage;
						responseMessage: PixelMessage;
					},
				]
			>(
				`AskPlayground(
engine=["${this._store.modelId}"],
roomId=["${this._store.roomId}"],
command=["<encode>${prompt}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${files.length ? `images=${JSON.stringify(uploaded.map((file) => file.fileLocation))},` : "images=[],"}
${tools.length ? `mcpToolID=${JSON.stringify(tools)},` : "mcpToolID=[],"}
${parentMessageId !== ROOT_MESSAGE_ID ? `parentMessageId=["${parentMessageId}"],` : ""}
paramValues=[${JSON.stringify({
					max_new_tokens: this._store.options.tokenLength,
					temperature: this._store.options.temperature,
				})}]
);`,
			);
			const { output, operationType } = response.pixelReturn[0];
			// throw errors
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(output as unknown as string);
			}

			// update the input's id
			inputMessage.updateId(output.inputMessage.messageId);

			// create the response and link to the input
			const responseMessage = this.createChatMessage(
				output.responseMessage,
			);
			inputMessage.addChild(responseMessage);
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Run a tool response
	 * @param id - id of the tool
	 * @param func - func of the tool to run
	 * @param parameters - parameters to pass in
	 */
	runTool = async (
		id: string,
		func: string,
		parameters: Record<string, unknown>,
	): Promise<void> => {
		try {
			// turn on the loading screen
			this.setIsLoading(true);

			// wait for the pixel to run
			const response = await this.runPixel<[{ response: string }]>(
				`RunMCPTool(project = [ "${id}" ], function=[ "${func}" ], paramValues=[ ${JSON.stringify(parameters)} ]);`,
			);

			const { output, operationType } = response.pixelReturn[0];
			// throw errors
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(output as unknown as string);
			}

			console.log(output);
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Record Feedback
	 * @param messageId
	 * @param rating
	 * @param comment
	 */
	recordFeedback = async (
		message: ChatMessage,
		rating: boolean,
		comment = "",
	): Promise<void> => {
		try {
			// wait for the pixel to run
			const response = await this.runPixel<[boolean]>(
				`SubmitLlmFeedback(messageId = ["${message.id}"], feedbackText=["${comment}"], rating=[${rating}]);`,
			);

			// throw errors
			const { output, operationType } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(output as unknown as string);
			}

			// save the feedback to the message's state
			message.saveRating({
				positive: rating,
				comment: comment,
			});
		} finally {
			// noop
		}
	};

	/**
	 *
	 * @param messageId
	 */
	downloadHistory = async (): Promise<void> => {
		try {
			// turn on the loading screen
			this.setIsLoading(true);

			// convert the content to html
			const html = this.history
				.map((message) => {
					if (message.content.type === "TEXT") {
						return `<div>${message.content.text}</div>`;
					}

					return "";
				})
				.join("\n");

			// wait for the pixel to run
			const { pixelReturn } = await this.runPixel<[string]>(
				`ToPdf( html=["<encode>${html}</encode>"]);`,
			);

			// get the response
			await this.download(pixelReturn[0].output);
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
		options: ChatRoomInterface["sidebar"]["options"],
	): Promise<void> => {
		this._store.sidebar.isOpen = true;
		this._store.sidebar.options = options;
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
	 * Create a ChatMessage from a pixelMessage
	 * @param pixelMessage - message from backend that needs to be converted
	 */
	private createChatMessage = (pixelMessage: PixelMessage): ChatMessage => {
		// create a message
		const message = new ChatMessage(pixelMessage.messageId);

		// set data based on type
		if (pixelMessage.type === "INPUT_TEXT") {
			message.updateType("USER");
			message.updateContent({
				type: "TEXT",
				text: pixelMessage.inputUIPrompt,
			});
		} else if (pixelMessage.type === "INPUT_TOOL_EXEC") {
			message.updateType("AGENT");
			// message.updateContent({
			// 	type: "APP",
			// 	name: pixelMessage.toolResponse.name,
			// 	id: pixelMessage.toolResponse.arguments.id,
			// 	map: pixelMessage.toolResponse.arguments.map,
			// });
		} else if (pixelMessage.type === "RESPONSE_TEXT") {
			message.updateType("AGENT");
			message.updateContent({
				type: "TEXT",
				text: pixelMessage.content,
			});
		} else if (pixelMessage.type === "RESPONSE_TOOL") {
			message.updateType("AGENT");
			message.updateContent({
				type: "APP",
				name: pixelMessage.toolResponse.name,
				id: pixelMessage.toolResponse.arguments.id,
				map: pixelMessage.toolResponse.arguments.map,
			});
		}

		// update sources if it exists
		if (pixelMessage.ornaments && pixelMessage.ornaments.chunks) {
			message.updateSources(pixelMessage.ornaments.chunks as string[]);
		}

		return message;
	};

	/**
	 * Run a pixel
	 * @param pixel - pixel
	 */
	private runPixel = async <O extends [] | unknown[]>(pixel: string) => {
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
	};

	/**
	 * Download a file
	 * @param fileKey - key
	 */
	private download = async (fileKey: string) => {
		// get the response
		await download(this._insightID, fileKey);
	};

	/**
	 * Upload a file
	 * @param fileKey - key
	 */
	private upload = async (files: File[], path: string = "") => {
		// get the response
		return await upload(files, this._insightID, "", path);
	};

	// /**
	//  * Search the VectorDatabase and get results from it based on the question
	//  * @param id
	//  * @param question
	//  * @returns
	//  */
	// private askVectorCatalog = async (id: string, question: string) => {
	// 	const pixel = `VectorDatabaseQuery(engine=["${id}"] , command=["<encode>${question}</encode>"], limit=[5])`;

	// 	const response =
	// 		await this.runPixel<
	// 			[
	// 				{
	// 					Score: number;
	// 					Source: string;
	// 					Divider: string;
	// 					Part: string;
	// 					Content: string;
	// 				}[],
	// 			]
	// 		>(pixel);

	// 	const { output, operationType } = response.pixelReturn[0];

	// 	// throw the error
	// 	if (operationType.indexOf("ERROR") > -1) {
	// 		throw new Error(output as unknown as string);
	// 	}

	// 	const results: {
	// 		score: number;
	// 		percent: string;
	// 		source: string;
	// 		content: string;
	// 	}[] = [];

	// 	for (let i = 0; i < output.length; i++) {
	// 		if (!output[i].Content) {
	// 			continue;
	// 		}

	// 		results.push({
	// 			score: output[i].Score,
	// 			percent: `${Math.round(output[i].Score * 10000) / 100}%`,
	// 			source: output[i].Source,
	// 			content: output[i].Content,
	// 		});
	// 	}

	// 	return results;
	// };
}
