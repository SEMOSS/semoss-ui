import { makeAutoObservable, runInAction } from "mobx";
import type { StoreApi } from "zustand";
import {
	FILE_PANEL_TYPES,
	type FilePanelMode,
	type FilePanelValue,
	getFilePanelType,
	isFilePanelType,
} from "@semoss/panels";
import {
	getPixelAsyncResult,
	console as getPixelConsole,
	runPixel,
	runPixelAsync,
	uploadInsight,
} from "@semoss/sdk/react";
import type { FileExplorerApi, ThemeMap } from "@semoss/shared";
import {
	createWorkbenchStore,
	type WorkbenchPanelId,
	type WorkbenchPanelParams,
	type WorkbenchPanelType,
	type WorkbenchState,
} from "@semoss/workbench";
import { STREAMING_PLACEHOLDER_ID } from "@/constants";
import {
	type AbstractMessageStore,
	createMessageStore,
	InputMessageStore,
	ResponseMessageStore,
	ToolStore,
} from "@/stores";
import {
	reconnectAgentRun,
	reconstructAllSubagents,
} from "@/stores/message/agent-harness";
import type {
	Engine,
	InputPixelMessage,
	MCPConfig,
	PixelMessage,
	PixelMessageSubagentPart,
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
	Prompt,
	ResponsePixelMessage,
	Workspace,
} from "@/types";
import {
	getRoomFileMode,
	getRoomSidebarCacheKey,
	ROOM_PANEL_TYPES,
	ROOM_SIDEBAR_LAYOUT,
} from "./room-sidebar";
import {
	type StreamHandlers,
	StreamJobController,
	type StreamOptions,
} from "./stream-job-controller";

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
	 *  - "chat": standard streaming chat (AskPlayground)
	 *  - "agent": server-side agent harness (RunAgent)
	 */
	mode: "agent" | "chat";

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
	root: ResponseMessageStore;

	/**
	 * Active tools
	 */
	tools: Record<string, ToolStore>;

	/*
	 * Model that is being chatted against
	 */
	model: Engine;

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
		 * Workspace associated with the room
		 */
		workspace?: {
			workspace_id: string;
			name?: string;
		};

		/**
		 * Predefined prompts that can be used in the room
		 */
		predefinedPrompts: Prompt[];

		/*
		 * Agent harness to run messages through (e.g. "semoss"). When set, the
		 * room runs in agent mode and messages are sent via RunAgent instead of
		 * AskPlayground. Persisted so the mode survives a reload.
		 */
		harnessType?: string;

		/*
		 * Temperature of the model (0–1). Only used when enableTemperature is true.
		 */
		temperature?: number;
	};

	/**
	 *  Sidebar information
	 */
	sidebar: {
		/**
		 * Track if the sidebar is open.
		 *
		 * Only whether the panel is on screen. What is *in* it lives in the
		 * room's workbench store, which outlives every open/close.
		 */
		isOpen: boolean;

		/**
		 * Track if the sidebar is blown up over the page.
		 *
		 * Here rather than in the sidebar's own React state because a panel's
		 * chrome has to put it back — opening a tool inline while the sidebar
		 * covers the page would otherwise reveal nothing.
		 */
		isMaximized: boolean;
	};
}

/**
 * Manage the room
 */
export class RoomStore {
	private _theme: ThemeMap["playground"];
	readonly streamJob = new StreamJobController({
		getInsightId: () => this._store.insightId,
		setLoading: (isLoading) => this.setIsLoading(isLoading),
		setError: (error) =>
			runInAction(() => {
				this._store.error = error;
			}),
	});
	private _store: RoomStoreInterface = {
		roomId: "",
		insightId: "new",
		isLoading: false,
		mode: "chat",
		metadata: {
			name: "",
			dateCreated: "",
		},
		model: null as unknown as Engine,
		root: null as unknown as ResponseMessageStore,
		tools: {},
		options: {
			predefinedPrompts: [],
			instructions: "",
			mcp: [],
			temperature: undefined,
		},
		sidebar: {
			isOpen: false,
			isMaximized: false,
		},
	};

	/**
	 * The dock backing the sidebar.
	 *
	 * Owned by the room rather than by `<Workbench>` for two reasons: panels are
	 * opened from outside React (a tool store reacting to a stream) and while
	 * the sidebar is closed, and the arrangement has to survive the sidebar
	 * being closed and reopened, which unmounts the shell.
	 *
	 * Read it to drive the sidebar from React (`useStore(room.workbench, …)`);
	 * the `openSidebarPanel` family covers everything the room itself needs.
	 */
	readonly workbench: StoreApi<WorkbenchState>;

	constructor(
		theme: ThemeMap["playground"],
		roomId: string,
		insightId: string = "new",
	) {
		this._theme = theme;
		// register the roomId, insightId, and actions
		this._store.roomId = roomId;
		this._store.insightId = insightId;

		this.workbench = createWorkbenchStore(getRoomSidebarCacheKey(roomId));
		// Hydrate now, not when the shell mounts: a panel opened while the
		// sidebar is closed must land on the restored arrangement, not on an
		// empty one the shell would then overwrite from the cache.
		this.workbench
			.getState()
			.layout.actions.loadLayout(ROOM_SIDEBAR_LAYOUT);
		this._syncSidebarFileMode();

		// make it observable -- the dock is a zustand store with its own
		// subscription model, and deep-observing it would be nonsense
		makeAutoObservable(this, { workbench: false });

		this._watchSidebar();
	}

	/**
	 * Mirror the dock's two facts the rest of the room cares about: a tool whose
	 * panel was closed is no longer open, and a sidebar with nothing left in it
	 * closes itself.
	 *
	 * This is the replacement for the FlexLayout change listener, and the reason
	 * the room store holds the dock: both reactions have to fire whether the
	 * close came from the tab's × or from `closeTool`.
	 */
	private _watchSidebar = (): void => {
		let previous = this.workbench.getState().layout.panels;

		this.workbench.subscribe((state) => {
			const panels = state.layout.panels;
			if (panels === previous) {
				return;
			}

			const closed = Object.values(previous).filter(
				(record) => !(record.id in panels),
			);
			previous = panels;

			for (const record of closed) {
				if (record.type !== ROOM_PANEL_TYPES.TOOL) {
					continue;
				}
				const toolId = (record.config as { toolId?: string })?.toolId;
				const tool = toolId ? this.getTool(toolId) : null;
				tool?.setIsOpen(false);
			}

			if (
				this._store.sidebar.isOpen &&
				state.layout.openPanelIds.length === 0
			) {
				this.closeSidebar();
			}
		});
	};

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
	 * A tool-phase stop is committing (cancelling the remaining tool calls). The
	 * stream cancel state lives in the controller; this covers the tool phase,
	 * where there's no stream job to track.
	 */
	private cancellingTools = false;

	/**
	 * Whether there's something the user can still stop: a cancellable streaming
	 * call (e.g. AskPlayground / the post-tool response), or a turn parked on
	 * unfinished tool calls — and a stop isn't already underway.
	 */
	get canCancel() {
		return (
			this.streamJob.canCancel ||
			(!this.cancellingTools &&
				Boolean(this.latestResponseMessage?.hasUnfinishedTools))
		);
	}

	/** A stop has been issued and it's still unwinding. */
	get isCancelling() {
		return this.streamJob.isCancelling || this.cancellingTools;
	}

	/**
	 * Get the error of the room
	 */
	get error() {
		return this._store.error;
	}

	/**
	 * Surface an error on the room. Public so callers outside this store — e.g.
	 * ToolSaveController, when a tool-phase stop fails to persist — can report a
	 * failure that isn't already caught by runRoomPixel/streamJob's own
	 * setErrorOnFail handling.
	 */
	setError = (error: Error): void => {
		runInAction(() => {
			this._store.error = error;
		});
	};

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
	 * Get a message by id
	 * @param messageId - the message id
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
	get history(): (InputMessageStore | ResponseMessageStore)[] {
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
	 * Number of tools in this room
	 */
	get numberOfTools() {
		return Object.keys(this._store.tools).length;
	}

	/**
	 * Last response message - avoids INPUT_TOOL_EXEC and STREAMING_PLACEHOLDER_ID messages
	 */
	get latestResponseMessage(): ResponseMessageStore {
		let responseMessage: AbstractMessageStore = this.tail;
		while (responseMessage) {
			// if it is a REAL response message, return it
			if (
				responseMessage instanceof ResponseMessageStore &&
				responseMessage.id !== STREAMING_PLACEHOLDER_ID
			) {
				return responseMessage;
			} else {
				// if it is not a response message, move to the parent message
				responseMessage = responseMessage.parent;
			}
		}
		// if there are no response messages, return null
		return null as unknown as ResponseMessageStore;
	}

	/**
	 * Total tokens used in the current conversation.
	 *
	 * How token counts work across message types:
	 * - INPUT messages have a cumulative count covering all prior exchanges.
	 * - RESPONSE messages have only the incremental count for that turn.
	 * - INPUT_TOOL_EXEC messages are also cumulative, but their count stays 0
	 *   until all tool results for the preceding response have come in.
	 *
	 * We never create INPUT_TOOL_EXEC messages, so mid-conversation the chain can look like:
	 *   INPUT → RESPONSE → RESPONSE(cumulative proxy) → RESPONSE(incremental) → ...
	 * saveToolExecution() in response-message.store stamps the server's cumulative input
	 * token count onto the parent RESPONSE so the math still works here. See that file.
	 *
	 * To get the total: walk back from tail and add up the two most-recent messages
	 * with non-zero tokens — one incremental, one cumulative (INPUT or proxy RESPONSE).
	 */
	get tokensUsed() {
		let currMessage = this.tail as AbstractMessageStore;
		let tokensUsed = 0;
		while (currMessage) {
			if (currMessage.tokens) {
				if (tokensUsed) {
					tokensUsed += currMessage.tokens;
					break;
				} else {
					tokensUsed += currMessage.tokens;
				}
			}
			currMessage = currMessage.parent;
		}

		return tokensUsed;
	}

	/**
	 * Get the total tokens consumed across ALL messages in the conversation
	 * (not context window - this is the actual sum of all input + output tokens)
	 */
	get totalTokensConsumed(): number {
		let total = 0;
		for (const message of this.history) {
			if (message.tokens) {
				total += message.tokens;
			}
		}
		return total;
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
	setMode = (mode: "agent" | "chat") => {
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
				ROOM_NAME?: string;
			};

			// sync the insight ID
			runInAction(() => {
				this._store.insightId = response.insightId;
			});
			this._syncSidebarFileMode();

			// create the root
			const root = new ResponseMessageStore(this, {
				io: "OUTPUT",
				messageId: "ROOT_PLACEHOLDER_ID",
				visible: false,
				platform_generated: true,
				modelId: this._store.model?.engine_id || "",
				dateCreated: new Date().toISOString(),
				parts: [],
				tokens: 0,
				ornaments: {
					modelName:
						this._store.model?.engine_display_name ||
						this._store.model?.engine_name ||
						"",
				},
				modelType: "",
				pruneToolsAbove: false,
			} as ResponsePixelMessage);

			const messages: Record<
				string,
				{
					parentMessageId: string;
					summaryLeafMessageId: string;
					message: InputMessageStore | ResponseMessageStore;
				}
			> = {};

			// store the last model
			let activeModelId = this._store.model?.engine_id;

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
					summaryLeafMessageId:
						pixelMessage.summaryLeafMessageId || "",
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
					// This could be a message that was compacted, check for summaryLeafMessageId
					const pseudoParent = messages[m.summaryLeafMessageId];
					if (pseudoParent) {
						pseudoParent.message.addChild(m.message);
						(
							pseudoParent.message as ResponseMessageStore
						).setConversationCompactedAbove?.(true);
					} else {
						root.addChild(m.message);
					}
				}
			}

			// options
			const newOptions = { ...optionsOutput.OPTIONS };

			runInAction(() => {
				// Restore agent-harness mode from the persisted options so a
				// reloaded agent room keeps sending messages via RunAgent. Only
				// promote to "agent" here — never demote — so that a freshly
				// created room whose mode was set via setMode() before its
				// options have been persisted (createRoom runs initialize()
				// before updateRoomOptions) keeps its explicitly-set mode.
				if (newOptions.harnessType) {
					this.setMode("agent");
				}

				// store it
				this._store.root = root;
			});

			// Fired here, before the workspace/model round trips below, since
			// neither depends on them — waiting on those was delaying subagent
			// boxes and live status for no reason.
			if (this.mode === "agent") {
				void reconstructAllSubagents(this);
			}
			if (this.tail.type === "OUTPUT") {
				if (this.mode === "agent") {
					// An agent-run turn is driven entirely server-side and
					// only ever gets a live AgentStore watching it from
					// runAgentMessage's own submit — reconnect here so a
					// reload doesn't leave it (and any paused tool decision)
					// unwatched. See reconnectAgentRun.
					reconnectAgentRun(this.tail);
				} else {
					this.tail.continueToolExecution();
				}
			}

			// The agent's default model, read below off the workspace this room
			// was started from. It only stands in for a room that has never
			// named a model of its own - a room the user has already chatted in
			// keeps the model those messages ran on.
			let agentDefaultModelId = "";

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

				// Store workspace name for display
				if (workspaceOutput?.name && newOptions.workspace) {
					newOptions.workspace.name = workspaceOutput.name;
				}

				agentDefaultModelId =
					workspaceOutput?.config_json?.model_id ?? "";

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

			// set the model based on the history, or on the agent's default when
			// the room has never named one
			const modelIdToLoad = activeModelId || agentDefaultModelId;
			if (modelIdToLoad) {
				const { pixelReturn } = await this.runRoomPixel<[Engine[]]>(
					`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=['MODEL'], filterWord=${JSON.stringify(modelIdToLoad)})`,
				);

				const model = pixelReturn[0].output[0];
				if (model) {
					runInAction(() => {
						this.setModel(model);
					});
				}
			}

			runInAction(() => {
				// set the options based on the history
				this.setOptions(newOptions);

				// Restore the persisted room name so the breadcrumb shows it on
				// load/refresh (GetPlaygroundMessages doesn't carry the name).
				if (optionsOutput.ROOM_NAME) {
					this.setMetadata({ name: optionsOutput.ROOM_NAME });
				}
			});
		} catch (e) {
			console.error(e);
			runInAction(() => {
				this.setIsLoading(false);
			});
			throw new Error((e as Error).message || "Error initializing room");
		}
	};

	/**
	 * Fetch the latest room options from the backend and sync local state,
	 * preserving any workspace MCPs that are currently loaded in memory.
	 */
	syncRoomOptions = async (): Promise<void> => {
		try {
			const response = await this.runRoomPixel<
				[{ OPTIONS?: RoomStoreInterface["options"] }]
			>(
				`GetRoomOptions(roomId=${JSON.stringify(this._store.roomId)});`,
				false,
				false,
			);

			const fetched = response.pixelReturn[0].output as {
				OPTIONS?: RoomStoreInterface["options"];
			};

			if (!fetched?.OPTIONS) {
				return;
			}

			// Preserve workspace MCPs that are already in local state
			const workspaceMCPs = this._store.options.mcp.filter(
				(mcp) => mcp?.fromWorkspace,
			);

			const freshRoomMCPs = (fetched.OPTIONS.mcp ?? []).filter(
				(mcp) => !mcp?.fromWorkspace,
			);

			// Deduplicate: workspace MCPs take precedence
			const workspaceIds = new Set(workspaceMCPs.map((m) => m.id));
			const merged = [
				...workspaceMCPs,
				...freshRoomMCPs.filter((m) => !workspaceIds.has(m.id)),
			];

			runInAction(() => {
				this.setOptions({
					...fetched.OPTIONS,
					mcp: merged,
				});
			});
		} catch (e) {
			// non-critical — swallow errors so the chat isn't disrupted
			console.warn("Failed to sync room options:", e);
		}
	};

	/**
	 * UpdateRoomOptions
	 * @param options - full set of new options
	 */
	updateRoomOptions = async (options: RoomStore["options"]) => {
		try {
			// Filter out MCPs the backend reports but does not store: workspace MCPs
			// and the room's own toolbox, which is read from the room folder.
			const optionsToSave = {
				...options,
				modelId: this._store.model.engine_id,
				mcp: options.mcp.filter(
					(mcp) => !mcp?.fromWorkspace && !mcp?.fromRoom,
				),
			};

			await this.runRoomPixel(
				`UpdateRoomOptions(roomId=${JSON.stringify(this._store.roomId)}, roomOptions=[${JSON.stringify(
					optionsToSave,
				)}]);`,
			);

			this.setOptions(options);
		} catch (e) {
			throw new Error(
				(e as Error).message || "Error updating room options",
			);
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
		options?: { placeholder?: boolean },
	) => {
		let tool = this._store.tools[toolId];
		if (!tool) {
			tool = new ToolStore(this, toolId);
			this._store.tools[tool.id] = tool;
		}

		tool.syncMessage(message, part, options);
	};

	/** Every tool this room has seen, by id. */
	get tools() {
		return this._store.tools;
	}

	/**
	 * Get a tool
	 * @param toolId - the id of the tool
	 */
	getTool = (toolId: string): ToolStore => {
		return this._store.tools[toolId] || null;
	};

	/**
	 * Find a spawned subagent's part by id, wherever it falls in the room's
	 * history. Looked up live (not snapshotted) so a panel showing it stays in
	 * sync with status/result updates while open.
	 */
	getSubagentPart = (
		subagentId: string,
	): PixelMessageSubagentPart["subagent"] | undefined => {
		for (const message of this.history) {
			if (!(message instanceof ResponseMessageStore)) {
				continue;
			}
			const part = message.parts.find(
				(p): p is PixelMessageSubagentPart =>
					p.type === "SUBAGENT" && p.subagent.id === subagentId,
			);
			if (part) {
				return part.subagent;
			}
		}
		return undefined;
	};

	/**
	 * Sidebar
	 */
	/** The file scope every file panel in this sidebar is opened in. */
	get fileMode() {
		return getRoomFileMode(this._store.insightId);
	}

	/**
	 * Reveal a sidebar panel, opening the sidebar itself and creating the panel
	 * if it is not already there.
	 *
	 * Identity is the blueprint's `matches` over `config`, so the callers no
	 * longer mint node ids to dedupe by — a tool panel is "the same panel" when
	 * its `toolId` matches, whatever its instance id happens to be.
	 *
	 * @param type - Which blueprint to open.
	 * @param config - The instance's parameters, and what it dedupes on.
	 * @param name - Tab label for a newly created instance.
	 * @return The revealed or created panel id.
	 */
	openSidebarPanel = (
		type: WorkbenchPanelType,
		config: WorkbenchPanelParams = {},
		name?: string,
	): WorkbenchPanelId => {
		this._store.sidebar.isOpen = true;
		return this.workbench
			.getState()
			.layout.actions.selectPanel(type, config, name ? { name } : {});
	};

	/**
	 * Reveal the sidebar's editor for a file, opening it if it is not there.
	 *
	 * Which editor depends on the extension — `getFilePanelType` picks between
	 * the code, markdown, notebook, image, PDF, pptx and download panels.
	 *
	 * @param path - The file's insight-relative path.
	 * @param name - Tab label; defaults to the file's own name.
	 * @return The revealed or created panel id.
	 */
	openFileSidebarPanel = (
		path: string,
		name?: string,
		options?: { refresh?: boolean },
	): WorkbenchPanelId => {
		const fileName = name ?? path.split("/").filter(Boolean).pop() ?? path;
		const pid = this.openSidebarPanel(
			getFilePanelType(path),
			{ mode: this.fileMode, name: fileName, path: path },
			fileName,
		);

		if (options?.refresh) {
			// A panel this call just created reads on mount; one that was
			// already open is holding the copy that was just overwritten.
			(
				this.workbench.getState().layout.values[pid] as
					| FilePanelValue
					| undefined
			)?.refresh();
		}

		return pid;
	};

	/**
	 * Re-point the sidebar's restored file panels at the room's current insight.
	 *
	 * A room binds to a fresh insight every time it loads, but its sidebar
	 * arrangement is cached, so a restored panel carries the insight id of
	 * whichever session wrote it. That id is what its reads and saves run
	 * against — left alone, the panel talks to an insight that no longer
	 * exists — and what its dedupe compares, so reopening the same file would
	 * give a second tab. One pass, before anything mounts.
	 */
	private _syncSidebarFileMode = (): void => {
		const { actions } = this.workbench.getState().layout;
		const mode = this.fileMode;

		for (const record of actions.findPanels((candidate) => {
			const panelMode = (
				candidate.config as { mode?: FilePanelMode } | undefined
			)?.mode;
			return (
				isFilePanelType(candidate.type) &&
				panelMode?.type === "INSIGHT" &&
				panelMode.insightId !== mode.insightId
			);
		})) {
			actions.updatePanel(record.id, {
				config: { ...record.config, mode: mode },
			});
		}
	};

	/**
	 * Reveal the sidebar's file explorer, opening it if it is not there.
	 *
	 * There is one explorer per room — the blueprint dedupes on scope alone —
	 * so a link into a folder navigates the one that is already open rather
	 * than stacking up a tab per directory, the way the old node-id-per-path
	 * convention did.
	 *
	 * @param initialPath - Directory to show. Defaults to wherever it was.
	 * @param name - Tab label for a newly created instance.
	 * @return The revealed or created panel id.
	 */
	openSidebarFileExplorer = (
		initialPath?: string,
		name?: string,
	): WorkbenchPanelId => {
		const pid = this.openSidebarPanel(
			FILE_PANEL_TYPES.FILE_EXPLORER,
			{ mode: this.fileMode },
			name,
		);

		if (initialPath) {
			const { actions, values } = this.workbench.getState().layout;
			// `initialPath` is read once, on mount, so it covers the panel this
			// call just created; an explorer already on screen has to be told.
			actions.updatePanel(pid, {
				config: { mode: this.fileMode, initialPath: initialPath },
			});
			(values[pid] as FileExplorerApi | undefined)?.commands.navigateTo(
				initialPath,
			);
		}

		return pid;
	};

	/**
	 * Close a sidebar panel matching `config`, if one is open.
	 *
	 * @param type - Which blueprint to close.
	 * @param config - The instance's parameters, matched as `selectPanel` does.
	 */
	closeSidebarPanel = (
		type: WorkbenchPanelType,
		config: WorkbenchPanelParams = {},
	): void => {
		const { actions } = this.workbench.getState().layout;
		for (const record of actions.matchPanels(type, config)) {
			actions.closePanel(record.id);
		}
	};

	/**
	 * Blow the sidebar up over the page, or put it back.
	 */
	setSidebarMaximized = (isMaximized: boolean): void => {
		this._store.sidebar.isMaximized = isMaximized;
	};

	/**
	 * Close the sidebar
	 */
	closeSidebar = async (): Promise<void> => {
		this._store.sidebar.isOpen = false;
		this._store.sidebar.isMaximized = false;
	};

	/**
	 * Helpers
	 */
	/**
	 * Set the isLoading boolean. Public so callers that don't go through
	 * streamJob.run() — e.g. the agent-run poll subscription — can still
	 * participate in the room's loading state.
	 * @param isLoading - is it loading
	 */
	setIsLoading = (isLoading: boolean): void => {
		this._store.isLoading = isLoading;
	};

	/**
	 * Ask a message to the room
	 * @param prompt - user message
	 * @param files - files
	 * @param askOptions.visible - whether the user's bubble renders (default
	 *   true); pass false for a silent kickoff turn — the reply still shows.
	 */
	askMessage = async (
		prompt: string,
		files: File[] = [],
		askOptions: { visible?: boolean } = {},
	): Promise<void> => {
		const { visible = true } = askOptions;

		if (!this.model) {
			throw new Error("Model is required");
		}

		if (!prompt) {
			throw new Error("Prompt is required");
		}

		this.setIsLoading(true);

		// Create the input message immediately so the user's bubble and the
		// thinking placeholder are visible during the file upload wait
		const inputMessage = new InputMessageStore(this, {
			io: "INPUT",
			type: "INPUT_TEXT",
			messageId: "ASK_PLACEHOLDER_ID",
			visible,
			platform_generated: true,
			modelId: this.model?.engine_id,
			modelType: this.model?.engine_type,
			dateCreated: new Date().toISOString(),
			parts: [{ type: "TEXT", text: prompt, uiText: prompt }],
			tokens: 0,
			ornaments: {
				modelName:
					this.model.engine_display_name || this.model.engine_name,
			},
			pruneToolsAbove: false,
		});

		// Anchor to the latest REAL response. this.tail can be an un-synced
		// STREAMING_PLACEHOLDER_ID node left behind by a turn that errored mid-stream;
		// latestResponseMessage skips those (and INPUT_TOOL_EXEC nodes).
		const parentMessage = this.latestResponseMessage ?? this.tail;
		if (parentMessage instanceof InputMessageStore) {
			throw new Error("Cannot respond to input messages");
		}

		const uploadPlaceholder = new ResponseMessageStore(this, {
			io: "OUTPUT",
			messageId: STREAMING_PLACEHOLDER_ID,
			visible: true,
			platform_generated: true,
			modelId: this.model.engine_id,
			dateCreated: new Date().toISOString(),
			parts: [{ type: "THINKING", thinking: "" }],
			tokens: 0,
			ornaments: {
				modelName:
					this.model.engine_display_name ||
					this.model.engine_name ||
					"",
			},
		} as ResponsePixelMessage);

		parentMessage.addChild(inputMessage);
		inputMessage.addChild(uploadPlaceholder);
		runInAction(() => {
			uploadPlaceholder.isThinking = true;
		});

		// upload the files
		let mediaInputs: {
			fileName: string;
			fileLocation: string;
		}[] = [];

		try {
			// upload the files if there are any
			if (files.length > 0) {
				const response = await uploadInsight(
					this._store.insightId,
					"",
					files,
				);

				const uploaded = response.data;

				// If files were sent but the server returned nothing, the files
				// couldn't be read — most likely locked by another program (e.g.
				// a .docx open in Word). Surface this as an UploadError so the
				// caller can show a "file is in use" message instead of silently
				// proceeding with no attachment.
				if (uploaded.length === 0) {
					const uploadError = new Error("File is in use");
					uploadError.name = "UploadError";
					throw uploadError;
				}

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

				// Append media parts to the already-visible input message
				runInAction(() => {
					for (const file of mediaInputs) {
						inputMessage.parts.push({
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
				});
			}
		} catch (e) {
			// remove the placeholder messages if the upload fails
			runInAction(() => {
				uploadPlaceholder.isThinking = false;
			});
			parentMessage.removeChild(inputMessage);

			// Re-throw UploadErrors as-is (e.g. the uploaded.length === 0 case above)
			if ((e as Error)?.name === "UploadError") {
				throw e;
			}

			throw e;
		}

		// run the message, reusing the upload placeholder as the streaming response
		await parentMessage.runMessage(inputMessage, uploadPlaceholder);
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
			if (
				!tool ||
				tool.status === "SUCCESS" ||
				tool.status === "CANCELLED" ||
				tool.status === "ERROR"
			) {
				return;
			}

			// save the response with the tool
			await message.saveToolExecution(
				tool,
				toolResponse,
				toolStatus,
				executedParameters,
			);
		} catch (e) {
			console.error(e);
		}
	};

	/**
	 * Run a pixel
	 * @param pixel - pixel
	 * @param showLoading - toggle the room's loading state around the run
	 * @param setErrorOnFail - surface a thrown failure on the room's error state
	 * @param throwOnError - when true (default), throw if any statement returns
	 *   an error. Pass false for multi-statement pixels where the caller wants to
	 *   inspect per-statement outcomes (each `pixelReturn` entry's `operationType`
	 *   contains "ERROR" on failure) rather than get an all-or-nothing throw.
	 */
	runRoomPixel = async <O extends [] | unknown[]>(
		pixel: string,
		showLoading: boolean = true,
		setErrorOnFail: boolean = true,
		throwOnError: boolean = true,
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

			if (throwOnError && response.errors.length > 0) {
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
					this._store.error = e as Error;
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
	 * Run a pixel asynchronously and collect stdout/stderr console output while
	 * it runs — mirrors the terminal REPL (terminal-console.tsx) so callers get
	 * the same logs + raw pixel results to process and render. Used by the
	 * playground code-block "Execute" action.
	 * @param pixel - pixel to execute
	 * @param onConsole - called with the cumulative console logs after each poll
	 * @param maxLogChars - cap on total console chars; once exceeded we stop
	 *   accumulating and append a truncation marker so the UI can't be flooded
	 *   by a runaway / very chatty job. 0 or undefined disables the cap.
	 */
	runRoomPixelWithConsole = async (
		pixel: string,
		onConsole?: (logs: string[]) => void,
		maxLogChars?: number,
	) => {
		// Launch the async job.
		const { jobId } = await runPixelAsync(pixel, this._store.insightId);
		if (!jobId) {
			throw new Error("No job id returned for pixel execution");
		}

		// Poll the console for stdout/stderr emitted while the job runs. The
		// endpoint drains its buffer per call, so we accumulate the messages,
		// bounded by `maxLogChars` to keep memory and render size in check.
		const logs: string[] = [];
		let logChars = 0;
		let logsTruncated = false;
		const appendLogs = (incoming: string[]) => {
			if (logsTruncated) return;
			for (const line of incoming) {
				if (maxLogChars && logChars >= maxLogChars) {
					logs.push(
						`… logs truncated (exceeded ${maxLogChars.toLocaleString()} characters)`,
					);
					logsTruncated = true;
					break;
				}
				logs.push(line);
				logChars += line.length;
			}
		};

		let polling = true;
		while (polling) {
			try {
				const { message, status } = await getPixelConsole(jobId);
				if (message?.length) {
					appendLogs(message);
					onConsole?.(logs.slice());
				}
				if (
					status === "Complete" ||
					status === "ProgressComplete" ||
					status === "Streaming"
				) {
					polling = false;
				} else {
					await new Promise((r) => setTimeout(r, 1000));
				}
			} catch {
				polling = false;
			}
		}

		// Final flush for logs written between the last poll and completion.
		try {
			const { message } = await getPixelConsole(jobId);
			if (message?.length) {
				appendLogs(message);
				onConsole?.(logs.slice());
			}
		} catch {
			// ignore
		}

		const { errors, results } = await getPixelAsyncResult(jobId);
		return { errors, results, logs };
	};

	/**
	 * Run a pixel with streaming support for LLM responses. Pass `onCancel` in
	 * the handlers to make the job cancellable via {@link cancelActiveJob}
	 * (AskPlayground); omit it for fire-to-completion jobs (tool execution,
	 * agent harness).
	 */
	runRoomPixelStreaming = <O extends unknown[] | []>(
		pixel: string,
		handlers: StreamHandlers<O>,
		options?: StreamOptions,
	): Promise<void> => this.streamJob.run<O>(pixel, handlers, options);

	/**
	 * Stop whatever the current turn is doing. A live cancellable stream (e.g.
	 * AskPlayground / the post-tool response) takes priority; otherwise, if the
	 * turn is parked on unfinished tool calls, hard-stop the tool phase. No-op
	 * when nothing is cancellable, so it's safe to wire to an always-visible
	 * button.
	 */
	cancelActiveJob = async (): Promise<void> => {
		if (this.streamJob.canCancel) {
			await this.streamJob.stop();
			return;
		}

		const message = this.latestResponseMessage;
		if (message?.hasUnfinishedTools && !this.cancellingTools) {
			runInAction(() => {
				this.cancellingTools = true;
			});
			try {
				await message.cancelPendingTools();
			} finally {
				runInAction(() => {
					this.cancellingTools = false;
				});
			}
		}
	};

	/**
	 * Compact the messages in the room
	 */
	compactMessages = async (strategy?: "TOOL_PRUNE" | "SUMMARY" | "AUTO") => {
		// Compact into the last real response in the chain.
		const curResponse = this.latestResponseMessage;

		if (!curResponse) throw new Error("No response message to compact");

		if (curResponse.hasTools) {
			throw new Error(
				"Cannot compact a response that includes tool calls",
			);
		}

		curResponse.setIsCompacting(true);

		type SummaryResponse = {
			type: "SUMMARY";
			inputMessage: InputPixelMessage;
			responseMessage: ResponsePixelMessage;
			success: boolean;
			error?: string;
		};

		type ToolPruneResponse = {
			type: "TOOL_PRUNE";
			success: boolean;
			inputMessage: InputPixelMessage;
			responseMessage: ResponsePixelMessage;
			error?: string;
		};

		try {
			const compactionTypesParam =
				strategy && strategy !== "AUTO"
					? `, compactionTypes=${JSON.stringify([strategy])}`
					: "";
			const response = await this.runRoomPixel<
				(SummaryResponse | ToolPruneResponse)[][]
			>(
				`CompactRoomMessages(roomId=${JSON.stringify(this.roomId)}, parentMessageId=${JSON.stringify(curResponse.id)}${compactionTypesParam});`,
				true,
			);

			const { output } = response.pixelReturn[0];

			if (!response || response.errors.length || !output)
				throw new Error();

			if (output.length === 0) {
				return "skipped" as const;
			}

			curResponse.setConversationCompactedAbove(true);

			let success = false;

			output.forEach((compactionMethod) => {
				if (!compactionMethod.success) {
					console.warn(
						compactionMethod.error ||
							"Unknown error during compaction",
					);
					return;
				}
				success = true;
				if (
					compactionMethod.type === "SUMMARY" ||
					compactionMethod.type === "TOOL_PRUNE"
				) {
					const { inputMessage, responseMessage } = compactionMethod;
					const inputStore = new InputMessageStore(
						this,
						inputMessage,
					);
					const responseStore = new ResponseMessageStore(
						this,
						responseMessage,
					);
					inputStore.addChild(responseStore);
					curResponse.addChild(inputStore);
				}
			});

			if (!success) {
				throw new Error();
			}

			return "compacted" as const;
		} finally {
			curResponse.setIsCompacting(false);
		}
	};
}
