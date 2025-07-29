import { makeAutoObservable, runInAction } from "mobx";
import { download, runPixel, upload } from "@semoss/sdk/react";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import { Knowledge, PixelMessage, Tool } from "@/types";
import { ChatMessage } from "./chat.message";

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
	 *  Log of messages
	 */
	history: ChatMessage[];

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
		history: [],
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
	 * Get the history of the room
	 */
	get history() {
		return this._store.history;
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

			// wait for the pixel to run
			const response = await this.runPixel<[PixelMessage[]]>(
				`GetPlaygroundMessages(roomId=["${this._store.roomId}"]);`,
			);

			const { output, operationType } = response.pixelReturn[0];

			// throw errors
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(output as unknown as string);
			}

			const history: ChatMessage[] = [];
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
				let isNew = false;

				// check if the message exists and create a new one if it doesn't
				let message = messages[pixelMessage.messageId];
				if (!message) {
					message = new ChatMessage();

					// mark as new
					isNew = true;
				}

				if (pixelMessage.type === "INPUT_TEXT") {
					activeModelId = pixelMessage.modelId;
					activeOptions = {
						...activeOptions,
						temperature: pixelMessage.paramMap.temperature,
						tokenLength: pixelMessage.paramMap.max_new_tokens,
					};
				}

				// process it
				this.processPixelMessage(message, pixelMessage);

				// store it
				messages[message.messageId] = message;

				// only add if it is visible and new
				if (pixelMessage.visible && isNew) {
					history.push(message);
				}
			}

			runInAction(() => {
				// set the model + options based on the history
				this.setModel(activeModelId);
				this.setOptions(activeOptions);

				// update the history
				this._store.history = history;

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

			// create a new message
			const inputMessage = new ChatMessage();

			// temp message
			inputMessage.saveId(`TEMP`);
			inputMessage.updateType("USER");
			inputMessage.updateContent({
				type: "TEXT",
				text: prompt,
			});
			// add it to the log
			this._store.history.push(inputMessage);

			// upload the files
			const uploaded = await this.upload(files, "");

			// build the context if it is there
			let context = "";
			if (this._store.options?.instructions) {
				context = this._store.options?.instructions;
			}

			const _engines: string[] = this._store.options.tools.reduce(
				(acc, val) => {
					if (val.type === "FUNCTION" || val.type === "DATABASE") {
						acc.push(val.id);
					}
					return acc;
				},
				[],
			);
			// get a list of app ids
			const _apps: string[] = this._store.options.tools.reduce(
				(acc, val) => {
					if (val.type === "APP") {
						acc.push(val.id);
					}
					return acc;
				},
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

			// update the input
			this.processPixelMessage(inputMessage, output.inputMessage);

			// create the response, process it, and add to the history
			const responseMessage = new ChatMessage();
			this.processPixelMessage(responseMessage, output.responseMessage);

			runInAction(() => {
				// update the history
				this._store.history.push(responseMessage);
			});
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Process a App response
	 */
	processAppResponse = async () => {
		//         // TODO: Or do we want to pass these outputs to the model for verification
		//         // TODO: Do you want me to just fill in the tool params And call AddToolResponse?
		//         messageResponse.content = JSON.stringify(appOutputs);
		//     };
		//     /**
		//      * Process a tool response
		//      * @param question - user message
		//      */
		//     processToolResponse = async (
		//         messageResponse: MessageAppResponse | MessageFunctionResponse,
		//         updatedParameters: MessageParameters,
		//     ): Promise<void> => {
		//         try {
		//             // turn on the loading screen
		//             this.setIsLoading(true);
		//             // update the parameters
		//             const parameters: Record<string, unknown> =
		//                 updatedParameters.reduce((acc, val) => {
		//                     acc[val.name] = val.value;
		//                     return acc;
		//                 }, {});
		//             // wait for the pixel to run
		//             const response = await this.runPixel<[{ response: string }]>(
		//                 `AddToolResponse(
		// engine=["${this._store.modelId}"],
		// tool_name=["${messageResponse.tool_name}"],
		// tool_id=["${messageResponse.id}"],
		// tool_call_id=["${messageResponse.tool_id}"],
		// tool_execution_response=["<encode>${JSON.stringify(parameters)}</encode>"]
		// );`,
		//             );
		//             const { output, operationType } = response.pixelReturn[0];
		//             // throw errors
		//             if (operationType.indexOf('ERROR') > -1) {
		//                 throw new Error(output as unknown as string);
		//             }
		//             // update the content>
		//             messageResponse.content = output.response;
		//         } finally {
		//             // turn off the loading screen
		//             this.setIsLoading(false);
		//         }
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
				`SubmitLlmFeedback(messageId = ["${message.messageId}"], feedbackText=["${comment}"], rating=[${rating}]);`,
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
			const html = this._store.history
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
	 * Update a ChatMessage from a pixelMessage
	 * @param message - ChatMessage that will be updated
	 * @param pixelMessage - message from backend that needs to be converted
	 */
	private processPixelMessage = async (
		message: ChatMessage,
		pixelMessage: PixelMessage,
	) => {
		// update the id
		message.saveId(pixelMessage.messageId);

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
