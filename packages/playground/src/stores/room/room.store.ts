import { makeAutoObservable, runInAction } from "mobx";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
	uploadInsight,
} from "@semoss/sdk/react";
import { FlexLayout, type ThemeMap } from "@semoss/shared";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";
import {
	type AbstractMessageStore,
	createMessageStore,
	InputMessageStore,
	PlanMessageStore,
	ResponseMessageStore,
	ToolStore,
} from "@/stores";
import type {
	Engine,
	MCPConfig,
	PixelMessage,
	PixelMessageMediaPart,
	PixelMessageTextPart,
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
	ResponsePixelMessage,
	Workspace,
} from "@/types";

interface RoomStoreInterface {
	/**
	 * ID of the room
	 */
	roomId: string;

	/**
	 * insightId of the room
	 * Set during the constructor and never changes
	 */
	insightId: string;

	/**
	 *  Track if the room is loading
	 */
	isLoading: boolean;

	/**
	 *  Track if the room has errored
	 */
	error?: Error | null;

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

	/**
	 * Root message
	 */
	root: ResponseMessageStore | PlanMessageStore | null;

	/**
	 * Active tools
	 */
	tools: Record<string, ToolStore>;

	/*
	 * Model that is being chatted against
	 */
	model: Engine | null;

	/*
	 * Options that is passed to the model
	 */
	options: {
		/*
		 * Context that is passed to the model
		 */
		instructions: string;

		/*
		 * MCPs loaded into the room (includes both room and workspace MCPs, distinguished by fromWorkspace flag)
		 */
		mcp: MCPConfig[];

		/*
		 * Length of the token
		 */
		tokenLength: number;

		/*
		 * Temperature of the model
		 */
		temperature: number;

		/*
		 * Workspace associated with the room
		 */
		workspace?: {
			workspace_id: string;
			name?: string;
		};
	};

	/**
	 *  Sidebar information
	 */
	sidebar: {
		/** Track if the sidebar is open */
		isOpen: boolean;

		/**
		 * FlexLayout model
		 */
		model: FlexLayout.Model;

		/**
		 * Count of the model;
		 */
		counter: number;
	};
}

/**
 * Manage the room
 */
export class RoomStore {
	private _theme: ThemeMap["playground"];
	private _store: RoomStoreInterface = {
		roomId: "",
		insightId: "new",
		isLoading: false,
		mode: "chat",
		metadata: {
			name: "",
			dateCreated: "",
		},
		model: null,
		root: null,
		tools: {},
		options: {
			instructions: "",
			mcp: [],
			tokenLength: TOKEN_LENGTH,
			temperature: TEMPERATURE,
		},
		sidebar: {
			isOpen: false,
			model: FlexLayout.Model.fromJson({
				global: {},
				borders: [],
				layout: {
					type: "row",
					weight: 0,
					children: [],
				},
			}),
			counter: 0,
		},
	};

	constructor(
		theme: ThemeMap["playground"],
		roomId: string,
		insightId: string = "new",
	) {
		this._theme = theme;
		// register the roomId, insightId, and actions
		this._store.roomId = roomId;
		this._store.insightId = insightId;

		// make it observable
		makeAutoObservable(this);

		// increment the counter whenever the model changes
		this._store.sidebar.model.addChangeListener((action) => {
			this.tickSidebar(action);
		});
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
	 * Get the insightId of the roomId
	 */
	get insightId() {
		return this._store.insightId;
	}

	/**
	 * Get the theme
	 */
	get theme() {
		return this._theme;
	}

	/**
	 * Indicator to check if the room is loading
	 */
	get isLoading() {
		return this._store.isLoading;
	}

	/**
	 * Get the error of the room
	 */
	get error() {
		return this._store.error;
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
	get model() {
		return this._store.model;
	}

	/**
	 * Get a message by id the model
	 * @param messageId - model to use in the room
	 */
	getMessage = (messageId: string) => {
		const queue: AbstractMessageStore[] = [this._store.root];
		while (queue.length > 0) {
			const current = queue.shift();

			if (!current) {
				continue;
			}

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
		let current: AbstractMessageStore = this._store.root;

		const history = [];
		while (current) {
			if (current.activeChild) {
				// save it
				if (current.activeChild instanceof InputMessageStore) {
					history.push(current.activeChild);
				} else if (
					current.activeChild instanceof ResponseMessageStore
				) {
					history.push(current.activeChild);
				} else if (current.activeChild instanceof PlanMessageStore) {
					history.push(current.activeChild);
				}
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
	 * Indicator to check if the room is ready for the next message
	 */
	get hasUnfinishedTools(): boolean {
		if (this.tail instanceof ResponseMessageStore) {
			for (const toolId in this._store.tools) {
				const tool = this._store.tools[toolId];
				if (tool.status === "INITIAL" || tool.status === "LOADING") {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Number of tokens used
	 */
	get tokensUsed() {
		let currMessage = this.tail as AbstractMessageStore;
		let tokensUsed = 0;
		while (currMessage) {
			tokensUsed += currMessage.tokens;
			if (currMessage.type === "INPUT") break;
			currMessage = currMessage.parent;
		}

		return tokensUsed;
	}

	/**
	 * Get the most recent plan
	 */
	get plan(): PlanMessageStore | null {
		if (this.mode !== "executing") {
			return null;
		}

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

	/** Setters */
	/**
	 * Set the mode
	 * @param mode - mode of the room
	 */
	setMode = (mode: "planning" | "executing" | "chat") => {
		this._store.mode = mode;
	};

	/**
	 * Set the model Id
	 * @param modelId - model to use in the room
	 */
	setModel = (model: Engine) => {
		this._store.model = model;
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
	 * Set the metadata
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
		try {
			// get all of the messages, get all the options
			const response = await this.runRoomPixel<
				[
					PixelMessage[],
					{ OPTIONS?: RoomStoreInterface["options"] }, // partial because this doesn't work for old rooms
				]
			>(
				`GetPlaygroundMessages(roomId=["${this._store.roomId}"]); GetRoomOptions(roomId=${JSON.stringify(this._store.roomId)}); SetRoomForInsight(roomId=${JSON.stringify(this._store.roomId)});`,
				false,
			);

			const messageOutput = response.pixelReturn[0]
				.output as PixelMessage[];
			const optionsOutput = response.pixelReturn[1].output as {
				OPTIONS?: RoomStoreInterface["options"];
			};

			// sync the insight ID
			runInAction(() => {
				this._store.insightId = response.insightId;
			});

			// create the root
			let root = null;
			if (this.mode === "chat") {
				root = new ResponseMessageStore(this, {
					io: "OUTPUT",
					messageId: "ROOT_PLACEHOLDER_ID",
					visible: false,
					platform_generated: true,
					modelId: this._store.model?.app_id || "",
					dateCreated: new Date().toISOString(),
					parts: [],
					tokens: 0,
					ornaments: {
						modelName: this._store.model?.app_name || "",
					},
				} as ResponsePixelMessage);
			} else if (this.mode === "planning") {
				root = new ResponseMessageStore(this, {
					io: "OUTPUT",
					messageId: "ROOT_PLACEHOLDER_ID",
					visible: false,
					platform_generated: true,
					modelId: this._store.model?.app_id || "",
					dateCreated: new Date().toISOString(),
					parts: [
						{
							type: "TEXT",
							text: "",
						},
					],
					tokens: 0,
					ornaments: {
						PLAYGROUND_MESSAGE_TYPE: "COT",
						modelName: this._store.model?.app_name || "",
					},
				} as ResponsePixelMessage);
			}

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
			let activeModelId = this._store.model?.app_id;

			// This is done as seperate loops because of linking
			for (const pixelMessage of messageOutput) {
				if (pixelMessage.io === "INPUT") {
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

			// options
			const newOptions = { ...optionsOutput.OPTIONS };

			if (!newOptions.workspace?.workspace_id) {
				delete newOptions.workspace;
			} else {
				const workspaceResponse = await this.runRoomPixel<
					[
						PixelMessage[],
						{ OPTIONS?: Workspace }, // partial because this doesn't work for old rooms
					]
				>(`GetWorkspace('${newOptions.workspace?.workspace_id}')`);

				const workspaceOutput = workspaceResponse.pixelReturn[0]
					.output as Workspace;

				// Merge workspace MCPs into the mcp array with fromWorkspace flag
				if (
					workspaceOutput?.mcp &&
					Array.isArray(workspaceOutput.mcp)
				) {
					// Create a map of existing MCPs by composite key
					const existingMCPs = new Map<string, MCPConfig>();
					for (const mcp of newOptions.mcp || []) {
						const key = `${mcp.id}-${mcp.type}`;
						existingMCPs.set(key, mcp);
					}

					// Add workspace MCPs with fromWorkspace flag
					const workspaceMCPs = workspaceOutput.mcp.map((mcp) => ({
						...mcp,
						fromWorkspace: true,
					}));

					// Merge, with workspace MCPs first
					newOptions.mcp = [
						...workspaceMCPs,
						...Array.from(existingMCPs.values()).filter(
							(a) => !workspaceMCPs.some((b) => b.id === a.id),
						),
					];

					// Merge workspace system_prompt if room instructions are empty
					if (
						workspaceOutput.system_prompt &&
						!newOptions.instructions
					) {
						newOptions.instructions = workspaceOutput.system_prompt;
					}
				}
			}

			// set the model based on the history
			if (activeModelId) {
				const { pixelReturn } = await this.runRoomPixel<[Engine[]]>(
					` MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "text-generation" }] , engineTypes = [ 'MODEL' ], filterWord=${JSON.stringify(activeModelId)})`,
				);

				runInAction(() => {
					this.setModel(pixelReturn[0].output[0]);
				});
			}

			runInAction(() => {
				// set the options based on the history
				this.setOptions(newOptions);

				// store it
				this._store.root = root;
			});

			// If the last message is a response and it has tool executions, start them (happens for new rooms and page reloads)
			if (this.tail.type === "OUTPUT") {
				this.tail.continueToolExecution();
			}
		} catch (e) {
			console.error(e);
			runInAction(() => {
				this.setIsLoading(false);
			});
			throw new Error(e.message || "Error initializing room");
		}
	};

	/**
	 * UpdateRoomOptions
	 * @param options - full set of new options
	 */
	updateRoomOptions = async (options: RoomStore["options"]) => {
		try {
			// Filter out workspace MCPs before saving (they shouldn't be persisted to the room)
			const optionsToSave = {
				...options,
				modelId: this._store.model.app_id,
				mcp: options.mcp.filter((mcp) => !mcp?.fromWorkspace),
			};

			await this.runRoomPixel(
				`UpdateRoomOptions(roomId=${JSON.stringify(this._store.roomId)}, roomOptions=[${JSON.stringify(
					optionsToSave,
				)}]);`,
			);

			this.setOptions(options);
		} catch (e) {
			throw new Error(e.message || "Error updating room options");
		}
	};

	/**
	 * Tools
	 */
	/**
	 * Sync a tool based on a message and part that contains tool information. This is used for both tool calls and tool results
	 * @param toolId - the id of the tool
	 * @param message - the message that contains the tool information
	 * @param part - the part of the message that contains the tool information
	 */
	syncTool = (
		toolId: string,
		message: InputMessageStore | ResponseMessageStore,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
	) => {
		let tool = this._store.tools[toolId];
		if (!tool) {
			tool = new ToolStore(this, toolId);
			this._store.tools[tool.id] = tool;
		}

		tool.syncMessage(message, part);
	};

	/**
	 * Get a tool
	 * @param toolId - the id of the tool
	 */
	getTool = (toolId: string): ToolStore => {
		return this._store.tools[toolId] || null;
	};

	/**
	 * Get a tool by nodeId
	 * @param nodeId - the id of the tool
	 */
	getToolByNodeId = (nodeId: string): ToolStore => {
		if (!nodeId.startsWith("tool--")) {
			return null;
		}

		// strip out the id from the nodeId
		const toolId = nodeId.replace("tool--", "");

		//get the tool based on the id
		return this._store.tools[toolId] || null;
	};

	/**
	 * Download a file
	 * @param fileKey - key
	 */
	download = async (fileKey: string) => {
		// get the response
		await download(this._insightID, fileKey);
	};

	/**
	 * Sidebar
	 */
	/**
	 * Check if a sidebar node is selected
	 * @param nodeId - node id to check
	 */
	isSidebarNodeSelected = (nodeId: string): boolean => {
		if (!this._store.sidebar.isOpen) {
			return false;
		}

		let isSelected = false;
		this._store.sidebar.model.visitNodes((node) => {
			if (node.getType() === "tabset") {
				const tabset = node as FlexLayout.TabSetNode;
				if (tabset.getSelectedNode()?.getId() === nodeId) {
					isSelected = true;
					return;
				}
			}
		});

		return isSelected;
	};

	/**
	 * Add a sidebar node and open it
	 * @param node - node to open. This will select and/or create the node
	 */
	addSidebarNode = (
		nodeId: string,
		options: {
			[key: string]: unknown;
		},
	): void => {
		// mark as open
		this._store.sidebar.isOpen = true;

		// select the node if there
		const selectedNode = this._store.sidebar.model.getNodeById(nodeId);
		if (selectedNode) {
			this._store.sidebar.model.doAction(
				FlexLayout.Actions.selectTab(selectedNode.getId()),
			);
			return;
		}

		// create the node if it is not there
		// where to add the node
		const addId =
			this._store.sidebar.model.getActiveTabset()?.getId() ||
			this._store.sidebar.model.getRoot().getChildren()[0]?.getId() ||
			"";

		// create and select the panel
		this._store.sidebar.model.doAction(
			FlexLayout.Actions.addNode(
				{
					...options,
					id: nodeId,
				},
				addId,
				FlexLayout.DockLocation.CENTER,
				-1,
				true,
			),
		);
	};

	/**
	 * Remove a sidebar node and close if last one
	 * @param node - node to remove
	 */
	removeSidebarNode = (nodeId: string): void => {
		// trigger the action to remove it
		this._store.sidebar.model.doAction(
			FlexLayout.Actions.deleteTab(nodeId),
		);
	};

	/**
	 * Close the sidebar
	 */
	closeSidebar = async (): Promise<void> => {
		this._store.sidebar.isOpen = false;
	};

	/**
	 * Increment the counter and close if there are no nodes
	 */
	tickSidebar = async (action: FlexLayout.Action): Promise<void> => {
		this._store.sidebar.counter += 1;

		// if it is a delete
		if (action.type === FlexLayout.Actions.DELETE_TAB) {
			const tool = this.getToolByNodeId(action.data.node);
			if (tool) {
				tool.setIsOpen(false);
			}
		}

		// check if there are any tabs left
		let hasTabs = false;
		this._store.sidebar.model.visitNodes((node) => {
			if (node.getType() === "tab") {
				hasTabs = true;
				return;
			}
		});

		if (!hasTabs) {
			this.closeSidebar();
		}
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
		if (!this.model) {
			throw new Error("Model is required");
		}

		if (!prompt) {
			throw new Error("Prompt is required");
		}

		// upload the files
		let uploaded: {
			fileName: string;
			fileLocation: string;
		}[] = [];

		let mediaInputs: {
			fileName: string;
			fileLocation: string;
		}[] = [];

		// upload the files if there are any
		if (files.length > 0) {
			const response = await uploadInsight(
				this._store.insightId,
				"",
				files,
			);

			// set the new files
			uploaded = response.data;

			const normalizeExt = (value: string) =>
				value.trim().toLowerCase().replace(/^\./, "");

			mediaInputs = uploaded.filter((f) => {
				const allowed = this._theme.allowedFileTypes;

				// If not configured (or empty), allow all
				if (!allowed || allowed.length === 0) return true;

				const allowedSet = new Set(allowed.map(normalizeExt));

				const rawExt = f.fileName.split(".").pop() ?? "";
				const ext = normalizeExt(rawExt);

				// If there's no extension, it's not allowed (when allow-list is configured)
				if (!ext) return false;

				return allowedSet.has(ext);
			});
		}

		const parts: (PixelMessageTextPart | PixelMessageMediaPart)[] = [
			{
				type: "TEXT",
				text: prompt,
				uiText: prompt,
			},
		];
		for (const file of mediaInputs) {
			parts.push({
				type: "MEDIA",
				mediaInfo: {
					base64Data: "",
					fileFormat: "",
					fileName: file.fileName,
					fileLocation: file.fileLocation,
					mediaInputType: "FILE",
					mimeType: "",
				},
			});
		}

		// create the input message
		const inputMessage = new InputMessageStore(this, {
			io: "INPUT",
			messageId: "ASK_PLACEHOLDER_ID",
			visible: true,
			platform_generated: true,
			modelId: this.model?.app_id,
			modelType: this.model?.app_type,
			dateCreated: new Date().toISOString(),
			parts: parts,
			tokens: 0,
			ornaments: {
				modelName: this.model.app_name,
			},
		});

		// get the parent message
		const parentMessage = this.tail;
		if (parentMessage instanceof InputMessageStore) {
			throw new Error("Cannot respond to input messages");
		}

		// run the message
		try {
			await parentMessage.runMessage(inputMessage);
		} catch (e) {
			this.plan?.failStepExecution();

			throw e;
		}
	};

	/**
	 * Process a tool call
	 * @param messageId - id of the message
	 * @param toolId - id of the tool
	 * @param toolResponse - response from the tool
	 * @param toolStatus - status of the tool execution
	 * @param executedParameters - parameters used by the tool
	 */
	processTool = async (
		messageId: string,
		toolId: string,
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled" = "success",
		executedParameters: Record<string, unknown>,
	): Promise<void> => {
		try {
			const message = this.getMessage(messageId);
			if (!message || message instanceof ResponseMessageStore !== true) {
				return;
			}

			const tool = this._store.tools[toolId];
			if (!tool || tool.response) {
				return;
			}

			if (this.mode === "executing") {
				// save the tool execution
				await this.plan?.saveToolExecution(
					message,
					tool,
					toolResponse,
					toolStatus,
					executedParameters,
				);
			} else {
				// save the response with the tool
				await message.saveToolExecution(
					tool,
					toolResponse,
					toolStatus,
					executedParameters,
				);
			}
		} catch (e) {
			console.error(e);
			this.plan?.failStepExecution();
		}
	};

	/**
	 * Run a pixel
	 * @param pixel - pixel
	 */
	runRoomPixel = async <O extends [] | unknown[]>(
		pixel: string,
		showLoading: boolean = true,
		setErrorOnFail: boolean = true,
	): Promise<{
		errors: string[];
		insightId: string;
		pixelReturn: {
			isMeta: boolean;
			operationType: string[];
			output: O[number];
			pixelExpression: string;
			pixelId: string;
			additionalOutput?: unknown;
			timeToRun: number;
		}[];
	}> => {
		try {
			if (showLoading) {
				this.setIsLoading(true);
			}

			// get the response
			const response = await runPixel<O>(pixel, this._store.insightId);

			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}

			// store the new insight id
			runInAction(() => {
				this._store.error = null;
			});
			return response;
		} catch (e) {
			if (setErrorOnFail) {
				runInAction(() => {
					this._store.error = e;
				});
			}
			throw e;
		} finally {
			if (showLoading) {
				this.setIsLoading(false);
			}
		}
	};

	/**
	 * Run a pixel with streaming support for LLM responses
	 * @param pixel - pixel to execute
	 * @param onPoll - callback for each streaming chunk
	 */
	runRoomPixelStreaming = async <O extends unknown[] | []>(
		pixel: string,
		onPoll: (
			message: Awaited<
				ReturnType<typeof getPixelJobStreaming>
			>["message"][number],
		) => void,
	) => {
		try {
			this.setIsLoading(true);

			// Start async execution to get job ID
			const { jobId } = await runPixelAsync(pixel, this._store.insightId);

			if (!jobId) {
				throw new Error("No job ID returned from pixel execution");
			}

			// Poll for streaming content
			let isPolling = true;

			const pollingInterval = 300; // 300ms for responsive streaming

			while (isPolling) {
				try {
					const response = await getPixelJobStreaming(jobId);

					if (response && response.message.length > 0) {
						for (const message of response.message) {
							onPoll(message);
						}
					}

					// Check status for completion
					if (
						response.status === "ProgressComplete" ||
						response.status === "Complete"
					) {
						isPolling = false;
					} else if (response.status === "Error") {
						throw new Error("Streaming job encountered an error");
					}

					if (isPolling) {
						await new Promise((resolve) =>
							setTimeout(resolve, pollingInterval),
						);
					}
				} catch (error) {
					isPolling = false;
					throw error;
				}
			}

			// get the final result
			const result = await getPixelAsyncResult<O>(jobId);

			if (result.errors.length > 0) {
				throw new Error(result.errors.join(""));
			}

			return result;
		} catch (e) {
			console.error(e);

			// show the error
			runInAction(() => {
				this._store.error = e;
			});

			throw e;
		} finally {
			this.setIsLoading(false);
		}
	};
}
