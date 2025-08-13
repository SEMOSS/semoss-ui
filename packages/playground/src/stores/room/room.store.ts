import { makeAutoObservable, runInAction } from "mobx";
import { download, runPixel, upload } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import type { Knowledge, PixelMessage, Tool } from "@/types";
import {
	type AbstractMessageStore,
	InputMessageStore,
	ResponseMessageStore,
	RootMessageStore,
} from "../message";

const TEMP_MESSAGE_ID = "TEMP";

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
	};

	/**
	 *  Sidebar information
	 */
	sidebar: {
		/** Track if the sidebar is open */
		isOpen: boolean;

		/** type of sidebar to open */
		type: "OPTIONS" | "ARTIFACTS";
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
		metadata: {
			name: "",
			dateCreated: "",
		},
		modelId: "",
		root: new RootMessageStore(),
		options: {
			instructions: "",
			knowledge: null,
			tools: [],
			tokenLength: TOKEN_LENGTH,
			temperature: TEMPERATURE,
			autoExecute: false,
		},
		sidebar: {
			isOpen: false,
			type: "OPTIONS",
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
	get history(): (InputMessageStore | ResponseMessageStore)[] {
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

			// throw errors
			if (response.errors.length > 0) {
				throw new Error(JSON.stringify(response.errors));
			}

			const { output } = response.pixelReturn[0];

			const root = new RootMessageStore();
			const messages: Record<
				string,
				{
					parentMessageId: string;
					message: InputMessageStore | ResponseMessageStore;
				}
			> = {};

			// store the last model
			let activeModelId = this._store.modelId;
			let activeOptions: Pick<
				RoomStoreInterface["options"],
				"tokenLength" | "temperature"
			> = {
				...this._store.options,
			};

			// This is done as seperate loops because of INPUT_TOOL_EXEC
			for (const pixelMessage of output) {
				if (pixelMessage.type === "INPUT_TEXT") {
					activeModelId = pixelMessage.modelId;
					activeOptions = {
						...activeOptions,
						temperature: pixelMessage.paramMap.temperature,
						tokenLength: pixelMessage.paramMap.max_new_tokens,
					};
				}

				// create the message
				const message = this.createMessage(pixelMessage);

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
		options?: Partial<RoomStoreInterface["options"]>,
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
			const inputMessage = this.createMessage({
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
${parentMessageId ? `parentMessageId=["${parentMessageId}"],` : ""}
paramValues=[${JSON.stringify({
					max_new_tokens: this._store.options.tokenLength,
					temperature: this._store.options.temperature,
				})}]
);`,
			);

			// throw errors
			if (response.errors.length > 0) {
				throw new Error(JSON.stringify(response.errors));
			}

			const { output } = response.pixelReturn[0];

			// update the input's id
			inputMessage.updateId(output.inputMessage.messageId);

			// create the response and link to the input
			const responseMessage = this.createMessage(output.responseMessage);
			inputMessage.addChild(responseMessage);

			// auto execute if enabled
			if (this._store.options.autoExecute) {
				if (!(responseMessage instanceof ResponseMessageStore)) {
					return;
				}

				// loop through the response and execute the tool
				// save the response
				for (const tool of responseMessage.tools) {
					await this.runTool(
						responseMessage,
						tool._meta.map.SMSS_PROJECT_ID,
						tool.id,
						tool.name,
						tool.arguments,
					);
				}
			}
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	// TODO: Optimize
	/**
	 * Rewrite a message and generate a new sibling
	 * @param message - the original agent message
	 */
	rewriteMessage = async (message: ResponseMessageStore): Promise<void> => {
		try {
			// turn on the loading screen
			this.setIsLoading(true);

			// get the parent message
			const parentMessage = message.parent;

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

${tools.length ? `mcpToolID=${JSON.stringify(tools)},` : "mcpToolID=[],"}
${parentMessage.id ? `parentMessageId=["${parentMessage.id}"],` : ""}
paramValues=[${JSON.stringify({
					max_new_tokens: this._store.options.tokenLength,
					temperature: this._store.options.temperature,
				})}]
);`,
			);

			// throw errors
			if (response.errors.length > 0) {
				throw new Error(JSON.stringify(response.errors));
			}

			const { output } = response.pixelReturn[0];

			// create the response and link to the input
			const responseMessage = this.createMessage(output.responseMessage);
			parentMessage.addChild(responseMessage);

			// auto execute if enabled
			if (this._store.options.autoExecute) {
				if (!(responseMessage instanceof ResponseMessageStore)) {
					return;
				}

				// loop through the response and execute the tool
				// save the response
				for (const tool of responseMessage.tools) {
					await this.runTool(
						responseMessage,
						tool._meta.map.SMSS_PROJECT_ID,
						tool.id,
						tool.name,
						tool.arguments,
					);
				}
			}
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Run a tool
	 * @param message - the original agent message
	 * @param appId - id of the app
`	 * @param toolId - id of the tool
	 * @param toolName - func of the tool to run
	 * @param toolArguments - arguments to pass in
	 */
	runTool = async (
		message: ResponseMessageStore,
		appId: string,
		toolId: string,
		toolName: string,
		toolArguments: Record<string, unknown>,
	): Promise<void> => {
		try {
			// turn on the loading screen
			this.setIsLoading(true);

			// wait for the pixel to run
			const response = await this.runPixel<[string]>(
				`RunMCPTool(project = [ "${appId}" ], function=[ "${toolName}" ], paramValues=[ ${JSON.stringify(toolArguments)} ]);`,
			);

			// throw errors
			if (response.errors.length > 0) {
				throw new Error(JSON.stringify(response.errors));
			}

			const { output } = response.pixelReturn[0];

			this.saveTool(message, toolId, toolName, output);
		} finally {
			// turn off the loading screen
			this.setIsLoading(false);
		}
	};

	/**
	 * Save a tool response
	 * @param message - the original agent message
`	 * @param toolId - id of the tool
	 * @param toolName - func of the tool to run
	 * @param response - response
	 */
	saveTool = async (
		message: ResponseMessageStore,
		toolId: string,
		toolName: string,
		executionResponse: string,
	): Promise<void> => {
		try {
			// turn on the loading screen
			this.setIsLoading(true);

			// wait for the pixel to run
			const response = await this.runPixel<
				[
					{
						responseMessage: PixelMessage | string;
					},
				]
			>(
				`AddPlaygroundToolExecution(
engine=["${this._store.modelId}"],
roomId = ["${this._store.roomId}"], 
toolId = ["${toolId}"],
toolName=["${toolName}"],
tool_execution_response=["${executionResponse}"]
);`,
			);

			// throw errors
			if (response.errors.length > 0) {
				throw new Error(JSON.stringify(response.errors));
			}

			const { output } = response.pixelReturn[0];

			// don't create a new message if it is a string. More tools need to be executed
			if (typeof output.responseMessage === "string") {
				return;
			}

			// create the response and link to the input
			const responseMessage = this.createMessage(output.responseMessage);

			message.addChild(responseMessage);
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
		message: ResponseMessageStore,
		rating: boolean,
		comment = "",
	): Promise<void> => {
		try {
			// wait for the pixel to run
			const response = await this.runPixel<[boolean]>(
				`SubmitLlmFeedback(messageId = ["${message.id}"], feedbackText=["${comment}"], rating=[${rating}]);`,
			);

			// throw errors
			if (response.errors.length > 0) {
				throw new Error(JSON.stringify(response.errors));
			}

			// save the feedback to the message's state
			message.rating = {
				positive: rating,
				comment: comment,
			};
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
	 * Create an AgentMessage or UserMessage from a pixelMessage
	 * @param pixelMessage - message from backend that needs to be converted
	 */
	private createMessage = (
		pixelMessage: PixelMessage,
	): ResponseMessageStore | InputMessageStore => {
		// set data based on type
		if (pixelMessage.type === "INPUT_TEXT") {
			return new InputMessageStore(
				pixelMessage.messageId,
				pixelMessage.inputUIPrompt,
			);
		} else if (pixelMessage.type === "INPUT_TOOL_EXEC") {
			return new ResponseMessageStore(
				pixelMessage.messageId,
				"",
				pixelMessage.tool_responses,
			);
		} else if (pixelMessage.type === "RESPONSE_TEXT") {
			return new ResponseMessageStore(
				pixelMessage.messageId,
				pixelMessage.content,
				[],
			);
		} else if (pixelMessage.type === "RESPONSE_TOOL") {
			return new ResponseMessageStore(
				pixelMessage.messageId,
				"",
				pixelMessage.tool_responses,
			);
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
}
