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
	ToolExecutionMessageStore,
	type ToolStore,
} from "@/stores";
import type {
	Engine,
	MCPConfig,
	PixelMessage,
	ResponseTextPixelMessage,
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
			for (const tool of this.tail.tools) {
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
					messageId: "ROOT_PLACEHOLDER_ID",
					type: "RESPONSE_TEXT",
					visible: false,
					content: "",
					modelId: this._store.model?.app_id || "",
					paramMap: {
						max_new_tokens: this._store.options.tokenLength,
						temperature: this._store.options.temperature,
					},
					ornaments: {
						modelName: this._store.model?.app_name || "",
					},
					dateCreated: new Date().toISOString(),
					tokens: 0,
				} as ResponseTextPixelMessage);
			} else if (this.mode === "planning") {
				root = new PlanMessageStore(this, {
					messageId: "ROOT_PLACEHOLDER_ID",
					type: "RESPONSE_TEXT",
					visible: false,
					content: "",
					modelId: this._store.model?.app_id || "",
					paramMap: {
						max_new_tokens: this._store.options.tokenLength,
						temperature: this._store.options.temperature,
					},
					ornaments: {
						PLAYGROUND_MESSAGE_TYPE: "COT",
						modelName: this._store.model?.app_name || "",
					},
					dateCreated: new Date().toISOString(),
					tokens: 0,
				} as ResponseTextPixelMessage);
			}

			const messages: Record<
				string,
				{
					parentMessageId: string;
					message:
						| InputMessageStore
						| ResponseMessageStore
						| PlanMessageStore
						| ToolExecutionMessageStore;
				}
			> = {};

			// store the last model
			let activeModelId = this._store.model?.app_id;

			// This is done as seperate loops because of linking
			for (const pixelMessage of messageOutput) {
				if (
					pixelMessage.type === "INPUT_TEXT" ||
					pixelMessage.type === "INPUT_MEDIA"
				) {
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

				// if its tool execution, update the corresponding tool
				const toolExecMessage = m.message;
				if (toolExecMessage instanceof ToolExecutionMessageStore) {
					// Run up the chain to find the message containing the tool
					// (because it can go reponse_tool -> input_tool_exec -> input_tool_exec)
					let toolExecMessageParent: AbstractMessageStore =
						toolExecMessage.parent;
					while (toolExecMessageParent) {
						if (
							toolExecMessageParent instanceof
							ResponseMessageStore
						) {
							// We've found the parent response message, now find the tool
							toolExecMessageParent.tools.forEach((tool) => {
								if (tool.id === toolExecMessage.callId) {
									// save the response
									runInAction(() => {
										tool.response =
											toolExecMessage.response;
										tool.status = toolExecMessage.status;
										tool.executedParameters =
											toolExecMessage.executedParameters;
									});
								}
							});
							// Break because we've found the right parent
							break;
						} else {
							// keep going up the chain
							toolExecMessageParent =
								toolExecMessageParent.parent;
						}
					}
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
			if (this.tail.type === "RESPONSE") {
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
	 * Get a tool by nodeId
	 * @param nodeId - node id to check
	 */
	getTool = (nodeId: string): ToolStore => {
		let current: AbstractMessageStore | null = this._store.root;

		const queue: AbstractMessageStore[] = [current];
		while (queue.length > 0) {
			current = queue.shift();

			if (current.type === "RESPONSE") {
				const responseMessage = current as ResponseMessageStore;

				for (const t of responseMessage.tools) {
					if (t.nodeId === nodeId) {
						return t;
					}
				}
			}

			queue.push(...current.children);
		}

		return null;
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
			const tool = this.getTool(action.data.node);
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

			// filter the uploaded files to only include allowed file types based on the theme configuration (if configured)
			mediaInputs = uploaded.filter((f) => {
				const allowed = this._theme.allowedFileTypes;

				// If not configured (or empty), allow all
				if (!allowed || allowed.length === 0) {
					return true;
				}

				// get the extension
				const ext = f.fileName.split(".").pop();
				if (allowed.indexOf(ext) > -1) {
					return true;
				}

				return false;
			});
		}

		// create the input message
		const inputMessage = new InputMessageStore(this, {
			messageId: "ASK_PLACEHOLDER_ID",
			type: "INPUT_TEXT",
			visible: true,
			inputUIPrompt: prompt,
			mediaInputs: mediaInputs,
			modelId: this.model?.app_id,
			paramMap: {
				max_new_tokens: this.options.tokenLength,
				temperature: this.options.temperature,
			},
			dateCreated: "",
			tokens: 0,
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
	 * @param toolName - name of the tool
	 * @param toolResponse - response from the tool
	 * @param toolStatus - status of the tool execution
	 * @param executedParameters - parameters used by the tool
	 */
	processTool = async (
		messageId: string,
		toolId: string,
		toolName: string,
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled",
		executedParameters: Record<string, unknown>,
	): Promise<void> => {
		try {
			const message = this.getMessage(messageId);
			if (!message || message instanceof ResponseMessageStore !== true) {
				return;
			}

			const tool = message.getTool(toolId, toolName);
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
			this._store.error = e;
		} finally {
			this.setIsLoading(false);
		}
	};
}
