import type { StoreApi } from "zustand";
import { getI18n } from "@semoss/i18n";
import {
	FILE_PANEL_TYPES,
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
import { sleep } from "@semoss/utility/async";
import { stringifyJsonWithSortedKeys } from "@semoss/utility/json";
import { StoreState } from "@semoss/utility/store";
import {
	createWorkbenchStore,
	type WorkbenchPanelConfigAny,
	type WorkbenchPanelId,
	type WorkbenchPanelParams,
	type WorkbenchPanelType,
	type WorkbenchSnapshot,
	type WorkbenchState,
} from "@semoss/workbench";
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
} from "../../types";
import { ChatToolsStore } from "../chat-tools/chat-tools.store";
import { ConnectorsStore } from "../connectors/connectors.store";
import { CONNECTOR_SOURCES } from "../connectors/sources/connector-sources";
import { ContextItemsStore } from "../conversation/context-items.store";
import { STREAMING_PLACEHOLDER_ID } from "../mcp/mcp-constants";
import type { AbstractMessageStore } from "../messages/abstract-message.store";
import {
	reconnectAgentRun,
	reconstructAllSubagents,
} from "../messages/agent-harness";
import { InputMessageStore } from "../messages/input-message.store";
import { ResponseMessageStore } from "../messages/response-message.store";
import { ToolStore } from "../messages/tool.store";
import { createMessageStore } from "../messages/utility";
import {
	createRoomSidebarLayout,
	getPanelFileMode,
	getRoomFileMode,
	ROOM_PANEL_TYPES,
} from "./room-sidebar";
import {
	type StreamHandlers,
	StreamJobController,
	type StreamOptions,
} from "./stream-job-controller";

/**
 * The MCPs the backend stores for a room. Workspace MCPs and the room's own
 * toolbox, which is read from the room folder, are reported but not stored.
 *
 * @param mcp - Every MCP the room has loaded.
 * @returns The ones the backend keeps.
 */
const getStoredMcp = (mcp: MCPConfig[] = []): MCPConfig[] =>
	mcp.filter((item) => !item?.fromWorkspace && !item?.fromRoom);

/**
 * A comparable key for room options as the backend stores them, so a save
 * that would change nothing can be skipped.
 *
 * @param options - The room's options.
 * @returns The options as sorted JSON, without the MCPs it does not store.
 */
const getStoredOptionsKey = (options: { mcp?: MCPConfig[] }): string =>
	stringifyJsonWithSortedKeys({ ...options, mcp: getStoredMcp(options.mcp) });

/** What a room holds. Every field is readonly. */
export interface RoomSnapshot {
	/** The room's id. */
	readonly roomId: string;

	/**
	 * The insight the room runs its pixels in. A new room starts on "new";
	 * `initialize` binds it to the insight the backend gives the room.
	 */
	readonly insightId: string;

	/** Whether the room is running a pixel or a turn. */
	readonly isLoading: boolean;

	/** The room's last failure, or null once a later run succeeds. */
	readonly error?: Error | null;

	/**
	 * How the room sends its messages.
	 * - "chat": standard streaming chat (AskPlayground)
	 * - "agent": server-side agent harness (RunAgent)
	 */
	readonly mode: "agent" | "chat";

	/** What the room list shows about the room. */
	readonly metadata: {
		/** The room's name. */
		name: string;

		/** When the room was created. */
		dateCreated: string;
	};

	/** The hidden message every conversation in the room hangs from. */
	readonly root: ResponseMessageStore;

	/**
	 * The agent's scripted opening message, rendered as the first bubble in
	 * the transcript. Re-read from the workspace on every initialize() — not
	 * a message, never sent to the model. Empty when there is none.
	 */
	readonly agentGreeting: string;

	/** Every tool call the room has seen, by id. */
	readonly tools: Record<string, ToolStore>;

	/** The model the room chats with. */
	readonly model: Engine;

	/** The room's settings, sent with each message and saved on the backend. */
	readonly options: {
		/** The instructions passed to the model. */
		instructions: string;

		/**
		 * MCPs loaded into the room: the room's own and its agent's, the
		 * latter marked `fromWorkspace`.
		 */
		mcp: MCPConfig[];

		/** The agent (workspace) the room was started from. */
		workspace?: {
			/** The agent's id, as the backend names it. */
			workspace_id: string;
			/** The agent's display name, read when the room loads. */
			name?: string;
		};

		/** Prompts the room offers in its slash menu. */
		predefinedPrompts: Prompt[];

		/**
		 * Agent harness to run messages through (e.g. "semoss"). When set, the
		 * room runs in agent mode and messages are sent via RunAgent instead of
		 * AskPlayground. Persisted so the mode survives a reload.
		 */
		harnessType?: string;

		/**
		 * Temperature of the model (0–1). Only used when enableTemperature is true.
		 */
		temperature?: number;

		/**
		 * How this chat runs each default tool: `auto`, `ask`, or `disabled`,
		 * by tool name, for the tools set apart from their usual way. The
		 * browser sends the tools that are not disabled with every chat
		 * message; the backend only stores the setting.
		 */
		defaultTools?: Record<string, "auto" | "ask" | "disabled">;
	};

	/** The Workspace's on-screen state. */
	readonly sidebar: {
		/**
		 * Whether the Workspace is open.
		 *
		 * Only whether the panel is on screen. What is *in* it lives in the
		 * room's workbench store, which outlives every open/close.
		 */
		isOpen: boolean;
	};

	/** The arrangement the room's first sidebar mount starts from; see `sidebarSnapshot`. */
	readonly sidebarSnapshot: WorkbenchSnapshot;

	/** Whether a cancellable streaming job is in flight and not yet stopped. */
	readonly canCancelJob: boolean;

	/** Whether a stop of the streaming jobs is still unwinding. */
	readonly isCancellingJob: boolean;

	/**
	 * Whether a tool-phase stop is committing (cancelling the remaining tool
	 * calls), where there is no stream job to track.
	 */
	readonly isCancellingTools: boolean;

	/**
	 * Counts changes to the room's messages and tool calls, which are stores
	 * of their own, so that a reader of the room hears about them.
	 */
	readonly revision: number;
}

/** A room before it loads; the constructor adds its ids and arrangement. */
const INITIAL_ROOM: Omit<
	RoomSnapshot,
	"roomId" | "insightId" | "sidebarSnapshot"
> = {
	isLoading: false,
	mode: "chat",
	metadata: {
		name: "",
		dateCreated: "",
	},
	model: null as unknown as Engine,
	root: null as unknown as ResponseMessageStore,
	agentGreeting: "",
	tools: {},
	options: {
		predefinedPrompts: [],
		instructions: "",
		mcp: [],
		temperature: undefined,
	},
	sidebar: {
		isOpen: false,
	},
	canCancelJob: false,
	isCancellingJob: false,
	isCancellingTools: false,
	revision: 0,
};

/**
 * One room: its messages, tool calls, settings, and Workspace, and the actions
 * that load it, send its messages, and run its pixels. Read it in React with
 * `useRoomSelector`.
 */
export class RoomStore {
	/** The playground theme, which limits the files sent to the model. */
	private _theme: ThemeMap["playground"];

	/** Runs the room's streaming jobs and owns their cancel state. */
	readonly streamJob = new StreamJobController({
		getInsightId: () => this.snapshot.insightId,
		setLoading: (isLoading) => this.setIsLoading(isLoading),
		setError: (error) => this.state.update({ error }),
		onChange: () =>
			this.state.update({
				canCancelJob: this.streamJob.canCancel,
				isCancellingJob: this.streamJob.isCancelling,
			}),
	});
	/** The room's snapshot; only the store's own actions write it. */
	private readonly state: StoreState<RoomSnapshot>;

	/**
	 * Key of the options the backend holds, as of the last read or save. A
	 * save that would not change them is skipped.
	 */
	private _storedOptionsKey: string | null = null;

	/**
	 * The dock backing the sidebar.
	 *
	 * Owned by the room rather than by `<Workbench>` for two reasons: panels are
	 * opened from outside React (a tool store hearing a stream) and while
	 * the sidebar is closed, and the arrangement has to survive the sidebar
	 * being closed and reopened, which unmounts the shell.
	 *
	 * Read it to drive the sidebar from React (`useStore(room.workbench, …)`);
	 * the `openSidebarPanel` family covers everything the room itself needs.
	 */
	readonly workbench: StoreApi<WorkbenchState>;

	/** Whether the Workspace's rail offers Files; a new chat's draft does not. */
	private readonly _includesFiles: boolean;

	/** Stops this room's own subscriptions; see {@link dispose}. */
	private _disposers: (() => void)[] = [];

	/**
	 * The default tools the room's chat sends and the user's decisions on the
	 * calls that wait for them. Its own store with its own subscribers, like
	 * the dock, and so are the two below.
	 */
	readonly chatTools: ChatToolsStore;

	/** The connectors switched on for the room and the accounts they sign in with. */
	readonly connectors: ConnectorsStore;

	/** The files queued for the room's next message. */
	readonly contextItems: ContextItemsStore;

	/**
	 * Build a room and its Workspace. It holds no messages until `initialize`.
	 *
	 * @param options - The room's theme, ids, panel blueprints, and whether its
	 * Workspace offers Files.
	 */
	constructor(options: {
		/** The playground theme. */
		theme: ThemeMap["playground"];
		/** The room's id. */
		roomId: string;
		/** The insight to start on; "new" until the room loads. */
		insightId?: string;
		/**
		 * The sidebar's panel blueprints. Handed in rather than imported: they
		 * render the chat's components, which import this store, so importing
		 * them here would close a module cycle. The composition root passes
		 * them down.
		 */
		panelComponents: Record<string, WorkbenchPanelConfigAny>;
		/**
		 * Whether the Workspace's rail offers Files. A new chat's draft has no
		 * insight for Files to read, so it leaves Files out until it prepares
		 * the room that takes its arrangement.
		 */
		includeFiles?: boolean;
	}) {
		const {
			theme,
			roomId,
			insightId = "new",
			panelComponents,
			includeFiles = true,
		} = options;
		this._theme = theme;
		this._includesFiles = includeFiles;
		this.state = new StoreState<RoomSnapshot>({
			...INITIAL_ROOM,
			roomId,
			insightId,
			sidebarSnapshot: createRoomSidebarLayout({
				fileMode: includeFiles ? getRoomFileMode(insightId) : null,
				filesName: this._getDefaultPanelName("files", panelComponents),
				settingsName: this._getDefaultPanelName(
					"settings",
					panelComponents,
				),
			}),
		});
		this.workbench = createWorkbenchStore({ components: panelComponents });
		this.workbench
			.getState()
			.layout.actions.loadSnapshot(this.sidebarSnapshot);
		this._syncSidebarFileMode();

		this.chatTools = new ChatToolsStore(this);
		this.connectors = new ConnectorsStore(this);
		this.contextItems = new ContextItemsStore();

		this._watchSidebar();
		// a viewer closes when its connector can no longer be shown
		const availableServices = () =>
			this.connectors.availableSources
				.map((source) => source.service)
				.join();
		let shownServices = availableServices();
		this._closeHiddenConnectorPanels();
		this._disposers.push(
			this.connectors.subscribe(() => {
				const next = availableServices();
				if (next !== shownServices) {
					shownServices = next;
					this._closeHiddenConnectorPanels();
				}
			}),
		);
	}

	/**
	 * A default panel's tab label. There are no translations outside the app,
	 * as in tests, so it falls back to the blueprint's own name.
	 *
	 * @param panel - Which default panel.
	 * @param panelComponents - The blueprints, for their own names.
	 * @returns The tab label.
	 */
	private _getDefaultPanelName = (
		panel: "files" | "settings",
		panelComponents: Record<string, WorkbenchPanelConfigAny>,
	): string => {
		const type =
			panel === "files"
				? FILE_PANEL_TYPES.FILE_EXPLORER
				: ROOM_PANEL_TYPES.CONFIGURATION;
		return (
			getI18n()?.t(`room:workspacePlaces.${panel}`) ??
			panelComponents[type]?.name ??
			panel
		);
	};

	/**
	 * Return tools inline when their tabs close.
	 *
	 * This is one reason the room store holds the dock: the watch has to fire
	 * whether the close came from the tab's × or from `closeTool`. There is no "closed the last
	 * tab" rule any more — every tab closes, including Files and Settings, and
	 * an empty Workspace still shows its rail, which reopens any of them. It
	 * closes from the header toggle, the slash command, or dragging the divider
	 * to the edge.
	 */
	private _watchSidebar = (): void => {
		let previous = this.workbench.getState().layout.panels;

		const stopSidebarWatch = this.workbench.subscribe((state) => {
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
				if (tool?.isOpen && tool.display === "sidebar") {
					tool.openTool("inline");
				}
			}
		});
		this._disposers.push(stopSidebarWatch);
	};

	/**
	 * Stop the room's own subscriptions: the sidebar and connector watchers.
	 * The owner calls it once it drops the room; a disposed room no longer
	 * reacts to its dock or its connectors. A running reply is not stopped.
	 */
	dispose = (): void => {
		for (const stop of this._disposers) {
			stop();
		}
		this._disposers = [];
		this._stopRootWatch?.();
		this._stopRootWatch = null;
	};

	/**
	 * The room's current snapshot, for `useStoreSelector`.
	 *
	 * @returns The snapshot.
	 */
	getSnapshot = (): RoomSnapshot => this.snapshot;

	/**
	 * Hear about every change to the room, including its messages and tool
	 * calls (through `revision`).
	 *
	 * @param listener - Called after each change.
	 * @returns A function that stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The current snapshot. */
	private get snapshot(): RoomSnapshot {
		return this.state.getSnapshot();
	}

	/**
	 * The arrangement shared by the store and every sidebar mount: the shell
	 * must start from this same reference, so mounting it does not reset tabs
	 * opened since.
	 */
	get sidebarSnapshot(): WorkbenchSnapshot {
		return this.snapshot.sidebarSnapshot;
	}

	/** The room's id. */
	get roomId() {
		return this.snapshot.roomId;
	}

	/** The insight the room runs its pixels in. */
	get insightId() {
		return this.snapshot.insightId;
	}

	/** The playground theme the room was built with. */
	get theme() {
		return this._theme;
	}

	/** Whether the room is running a pixel or a turn. */
	get isLoading() {
		return this.snapshot.isLoading;
	}

	/**
	 * Whether there's something the user can still stop: a cancellable streaming
	 * call (e.g. AskPlayground / the post-tool response), or a turn parked on
	 * unfinished tool calls — and a stop isn't already underway.
	 */
	get canCancel() {
		return (
			this.snapshot.canCancelJob ||
			(!this.snapshot.isCancellingTools &&
				Boolean(this.latestResponseMessage?.hasUnfinishedTools))
		);
	}

	/** A stop has been issued and it's still unwinding. */
	get isCancelling() {
		return this.snapshot.isCancellingJob || this.snapshot.isCancellingTools;
	}

	/** The room's last failure, if any. */
	get error() {
		return this.snapshot.error;
	}

	/**
	 * Surface an error on the room, or clear it with null. Public so callers
	 * outside this store — e.g. ToolSaveController, when a tool-phase stop fails
	 * to persist — can report a failure that isn't already caught by
	 * runRoomPixel/streamJob's own setErrorOnFail handling, and so a rewrite
	 * starts its turn without the last one's error.
	 *
	 * @param error - The failure, or null to clear it.
	 */
	setError = (error: Error | null): void => {
		this.state.update({ error });
	};

	/** How the room sends its messages: chat or agent. */
	get mode() {
		return this.snapshot.mode;
	}

	/** The room's name and creation date. */
	get metadata() {
		return this.snapshot.metadata;
	}

	/** The model the room chats with. */
	get model() {
		return this.snapshot.model;
	}

	/** The agent's scripted opening message (see RoomSnapshot.agentGreeting). */
	get agentGreeting() {
		return this.snapshot.agentGreeting;
	}

	/**
	 * Find a message anywhere in the room's tree, on any branch.
	 *
	 * @param messageId - The message's id.
	 * @returns The message, or null when the room has none by that id.
	 */
	getMessage = (messageId: string) => {
		const queue: AbstractMessageStore[] = [this.snapshot.root];
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
	 * The conversation as shown: each message's active child, from the root
	 * down, without the root itself.
	 */
	get history(): (InputMessageStore | ResponseMessageStore)[] {
		let current: AbstractMessageStore = this.snapshot.root;

		const history = [];
		while (current) {
			if (current.activeChild) {
				if (current.activeChild instanceof InputMessageStore) {
					history.push(current.activeChild);
				} else if (
					current.activeChild instanceof ResponseMessageStore
				) {
					history.push(current.activeChild);
				}
			}

			current = current.activeChild;
		}

		return history;
	}

	/** The last message of the history, or the root when it is empty. */
	get tail() {
		if (this.history[this.history.length - 1]) {
			return this.history[this.history.length - 1];
		}

		return this.snapshot.root;
	}

	/** How many tool calls the room has seen. */
	get numberOfTools() {
		return Object.keys(this.snapshot.tools).length;
	}

	/**
	 * The last real response, walking up from the tail past input messages
	 * and the streaming placeholder. Null (typed as a store) when there is none.
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
	 * The total tokens consumed across ALL messages in the conversation
	 * (not context window - this is the actual sum of all input + output tokens)
	 */
	get totalTokensConsumed(): number {
		return this.history.reduce(
			(total, message) => total + (message.tokens || 0),
			0,
		);
	}

	/** The room's settings. */
	get options() {
		return this.snapshot.options;
	}

	/** The Workspace's on-screen state. */
	get sidebar() {
		return this.snapshot.sidebar;
	}

	// Setters

	/**
	 * Set how the room sends its messages. Not saved until the next options save.
	 *
	 * @param mode - Chat or agent.
	 */
	setMode = (mode: "agent" | "chat") => {
		this.state.update({ mode });
	};

	/**
	 * Set the model the room chats with.
	 *
	 * @param model - The model.
	 */
	setModel = (model: Engine) => {
		this.state.update({ model });
	};

	/**
	 * Merge new values into the room's settings, locally.
	 *
	 * @param options - The settings to change.
	 */
	setOptions = (options: Partial<RoomSnapshot["options"]>) => {
		this.state.update((current) => ({
			options: { ...current.options, ...options },
		}));
	};

	/**
	 * Merge new values into the room's name and date, locally.
	 *
	 * @param metadata - The fields to change.
	 */
	setMetadata = (metadata: Partial<RoomSnapshot["metadata"]>) => {
		this.state.update((current) => ({
			metadata: { ...current.metadata, ...metadata },
		}));
	};

	// Actions

	/**
	 * Load the room: bind it to its insight, build its message tree, restore
	 * its options, agent, and model, and pick up a turn still running.
	 *
	 * @param options - `isNew`: the room was just created, so it has no tool
	 * file for its connectors to be read from.
	 * @throws Error when the room cannot load.
	 */
	initialize = async ({ isNew = false }: { isNew?: boolean } = {}) => {
		try {
			// get all of the messages, get all the options
			const response = await this.runRoomPixel<
				[
					PixelMessage[],
					{ OPTIONS?: RoomSnapshot["options"] }, // partial because this doesn't work for old rooms
				]
			>(
				`GetPlaygroundMessages(roomId=["${this.snapshot.roomId}"]); GetRoomOptions(roomId=${JSON.stringify(this.snapshot.roomId)}); SetRoomForInsight(roomId=${JSON.stringify(this.snapshot.roomId)});`,
				false,
			);

			const messageOutput = response.pixelReturn[0]
				.output as PixelMessage[];
			const optionsOutput = response.pixelReturn[1].output as {
				OPTIONS?: RoomSnapshot["options"];
				ROOM_NAME?: string;
			};
			// read before the workspace merge below edits the nested objects
			const storedOptionsKey = optionsOutput.OPTIONS
				? getStoredOptionsKey(optionsOutput.OPTIONS)
				: null;

			// sync the insight ID
			this.state.update({ insightId: response.insightId });

			this._syncSidebarFileMode();

			// the insight is bound to the room now, so the room's tool file can
			// be read, unless the room was only just created
			void this.connectors.restore({ isNew: isNew });

			// create the root
			const root = new ResponseMessageStore(this, {
				io: "OUTPUT",
				messageId: "ROOT_PLACEHOLDER_ID",
				visible: false,
				platform_generated: true,
				modelId: this.snapshot.model?.engine_id || "",
				dateCreated: new Date().toISOString(),
				parts: [],
				tokens: 0,
				ornaments: {
					modelName:
						this.snapshot.model?.engine_display_name ||
						this.snapshot.model?.engine_name ||
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
			let activeModelId = this.snapshot.model?.engine_id;

			// build every message first, then link them, since a child can
			// come before its parent
			messageOutput.forEach((pixelMessage) => {
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
			});

			// link the messages
			Object.values(messages).forEach((m) => {
				const parent = messages[m.parentMessageId];
				if (parent) {
					parent.message.addChild(m.message);
				} else {
					// This could be a message that was compacted, check for summaryLeafMessageId
					const pseudoParent = messages[m.summaryLeafMessageId];
					if (pseudoParent) {
						pseudoParent.message.addChild(m.message);
						if (
							pseudoParent.message instanceof ResponseMessageStore
						) {
							pseudoParent.message.setConversationCompactedAbove(
								true,
							);
						}
					} else {
						root.addChild(m.message);
					}
				}
			});

			// options
			const newOptions = { ...optionsOutput.OPTIONS };

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
			this._watchRoot(root);
			this.state.update({ root });

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
			let agentGreeting = "";

			if (!newOptions.workspace?.workspace_id) {
				delete newOptions.workspace;
			} else {
				const workspaceResponse = await this.runRoomPixel<
					[
						PixelMessage[],
						{ OPTIONS?: Workspace }, // partial because this doesn't work for old rooms
					]
				>(
					`GetWorkspace('${newOptions.workspace?.workspace_id}')`,
					false,
				);

				const workspaceOutput = workspaceResponse.pixelReturn[0]
					.output as Workspace;

				// Store workspace name for display
				const workspaceName =
					workspaceOutput?.display_name || workspaceOutput?.name;
				if (workspaceName && newOptions.workspace) {
					newOptions.workspace.name = workspaceName;
				}

				agentDefaultModelId =
					workspaceOutput?.config_json?.model_id ?? "";
				agentGreeting = workspaceOutput?.config_json?.greeting_enabled
					? (workspaceOutput?.config_json?.greeting ?? "")
					: "";

				// Merge workspace MCPs into the mcp array with fromWorkspace flag
				if (
					workspaceOutput?.mcp &&
					Array.isArray(workspaceOutput.mcp)
				) {
					// Create a map of existing MCPs by composite key
					const existingMCPs = new Map<string, MCPConfig>();
					(newOptions.mcp || []).forEach((mcp) => {
						const key = `${mcp.id}-${mcp.type}`;
						existingMCPs.set(key, mcp);
					});

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
			// the room has never named one. A room that already holds that model,
			// as a new room does, has nothing to look up.
			const modelIdToLoad = activeModelId || agentDefaultModelId;
			if (
				modelIdToLoad &&
				modelIdToLoad !== this.snapshot.model?.engine_id
			) {
				const { pixelReturn } = await this.runRoomPixel<[Engine[]]>(
					`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=['MODEL'], filterWord=${JSON.stringify(modelIdToLoad)})`,
					false,
				);

				const model = pixelReturn[0].output[0];
				if (model) {
					this.setModel(model);
				}
			}

			// set the options based on the history
			this.setOptions(newOptions);
			this._storedOptionsKey = storedOptionsKey;

			this.state.update({ agentGreeting });

			// Restore the persisted room name so the breadcrumb shows it on
			// load/refresh (GetPlaygroundMessages doesn't carry the name).
			if (optionsOutput.ROOM_NAME) {
				this.setMetadata({ name: optionsOutput.ROOM_NAME });
			}
		} catch (e) {
			console.error(e);
			this.setIsLoading(false);

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
				[{ OPTIONS?: RoomSnapshot["options"] }]
			>(
				`GetRoomOptions(roomId=${JSON.stringify(this.snapshot.roomId)});`,
				false,
				false,
			);

			const fetched = response.pixelReturn[0].output as {
				OPTIONS?: RoomSnapshot["options"];
			};

			if (!fetched?.OPTIONS) {
				return;
			}

			// Preserve workspace MCPs that are already in local state
			const workspaceMCPs = this.snapshot.options.mcp.filter(
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

			this.setOptions({
				...fetched.OPTIONS,
				mcp: merged,
			});
			this._storedOptionsKey = getStoredOptionsKey(fetched.OPTIONS);
		} catch (e) {
			// non-critical — swallow errors so the chat isn't disrupted
			console.warn("Failed to sync room options:", e);
		}
	};

	/**
	 * Save the room's options (UpdateRoomOptions) and take them locally. Skips
	 * the save when the backend already holds these options, and leaves the
	 * room's loading state alone, since it runs ahead of the turn that uses them.
	 *
	 * @param options - The full set of new options.
	 * @throws Error when the backend refuses the save.
	 */
	updateRoomOptions = async (options: RoomStore["options"]) => {
		try {
			const optionsToSave = {
				...options,
				modelId: this.snapshot.model.engine_id,
				mcp: getStoredMcp(options.mcp),
			};

			const optionsKey = getStoredOptionsKey(optionsToSave);
			if (optionsKey !== this._storedOptionsKey) {
				await this.runRoomPixel(
					`UpdateRoomOptions(roomId=${JSON.stringify(this.snapshot.roomId)}, roomOptions=[${JSON.stringify(
						optionsToSave,
					)}]);`,
					false,
				);
				this._storedOptionsKey = optionsKey;
			}

			this.setOptions(options);
		} catch (e) {
			throw new Error(
				(e as Error).message || "Error updating room options",
			);
		}
	};

	// Tools

	/**
	 * Create or update a tool call from a message part, for both tool calls and
	 * tool results. A new call is followed so the room hears its changes.
	 *
	 * @param toolId - The tool call's id.
	 * @param message - The message holding the part.
	 * @param part - The tool call or result part.
	 * @param options - `placeholder`: the part is the stub pushed while the
	 * call streams in.
	 */
	syncTool = (
		toolId: string,
		message: InputMessageStore | ResponseMessageStore,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
		options?: { placeholder?: boolean },
	) => {
		let tool = this.state.getSnapshot().tools[toolId];
		if (!tool) {
			tool = new ToolStore(this, toolId);
			const created = tool;
			this.state.update((current) => ({
				tools: { ...current.tools, [created.id]: created },
			}));
			this._disposers.push(created.subscribe(this._bumpRevision));
		}

		tool.syncMessage(message, part, options);
	};

	/** Every tool this room has seen, by id. */
	get tools() {
		return this.snapshot.tools;
	}

	/**
	 * Find a tool call by id.
	 *
	 * @param toolId - The tool call's id.
	 * @returns The call, or null (typed as a store) when the room has not seen it.
	 */
	getTool = (toolId: string): ToolStore => {
		return this.snapshot.tools[toolId] || null;
	};

	/**
	 * Find a spawned subagent's part by id, wherever it falls in the room's
	 * history. Looked up live (not snapshotted) so a panel showing it stays in
	 * sync with status/result updates while open.
	 *
	 * @param subagentId - The subagent's id.
	 * @returns Its part, or undefined when no message in the history spawned it.
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

	// Sidebar

	/** The file scope every file panel in this sidebar is opened in. */
	get fileMode() {
		return getRoomFileMode(this.snapshot.insightId);
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
	 * @returns The revealed or created panel id.
	 */
	openSidebarPanel = (
		type: WorkbenchPanelType,
		config: WorkbenchPanelParams = {},
		name?: string,
	): WorkbenchPanelId => {
		this._setSidebarOpen(true);
		return this.workbench
			.getState()
			.layout.actions.selectPanel(type, config, name ? { name } : {});
	};

	/**
	 * Adopt a draft's arrangement before mounting this room's first sidebar.
	 *
	 * A draft is built without Files, having no insight for it to read, so the
	 * room it prepares gains it here — behind whatever tab the draft was on.
	 *
	 * @param snapshot - The draft's arrangement.
	 */
	restoreSidebarLayout = (snapshot: WorkbenchSnapshot): void => {
		this.state.update({ sidebarSnapshot: snapshot });
		const { actions } = this.workbench.getState().layout;
		actions.loadSnapshot(snapshot);
		this._syncSidebarFileMode();
		const hasFiles = actions.findPanels(
			(record) =>
				record.type === FILE_PANEL_TYPES.FILE_EXPLORER &&
				// a connector's work folder is another explorer, not Files
				getPanelFileMode(record)?.type === "INSIGHT",
		).length;
		if (!this._includesFiles || hasFiles) {
			return;
		}
		const selected = this.workbench.getState().layout.selection.panel;
		actions.spawnPanel(FILE_PANEL_TYPES.FILE_EXPLORER, {
			config: { mode: this.fileMode },
			name: this._getDefaultPanelName(
				"files",
				this.workbench.getState().layout.components,
			),
		});
		if (selected) {
			actions.navigatePanel(selected);
		}
	};

	/** Stops listening to the current root's conversation. */
	private _stopRootWatch: (() => void) | null = null;

	/**
	 * Follow a new root's whole conversation, and stop following the last.
	 *
	 * @param root - The room's root message.
	 */
	private _watchRoot = (root: ResponseMessageStore): void => {
		this._stopRootWatch?.();
		this._stopRootWatch = root.subscribeTree(this._bumpRevision);
	};

	/** A message or tool call in the room changed. */
	private _bumpRevision = (): void => {
		this.state.update((current) => ({ revision: current.revision + 1 }));
	};

	/**
	 * Show or hide the Workspace.
	 *
	 * @param isOpen - Whether it is on screen.
	 */
	private _setSidebarOpen = (isOpen: boolean): void => {
		this.state.update((current) => ({
			sidebar:
				current.sidebar.isOpen === isOpen
					? current.sidebar
					: { ...current.sidebar, isOpen },
		}));
	};

	/** Open the Workspace as it was left, its panel rail always beside it. */
	openSidebar = (): void => {
		this._setSidebarOpen(true);
	};

	/**
	 * Close any connector viewer the chat can no longer show, the panels
	 * having been opened on demand from the Workspace's rail.
	 */
	private _closeHiddenConnectorPanels = (): void => {
		const { actions } = this.workbench.getState().layout;
		const availableTypes = new Set(
			this.connectors.availableSources.map((source) => source.panelType),
		);
		for (const record of actions.findPanels(
			(candidate) =>
				!availableTypes.has(candidate.type) &&
				CONNECTOR_SOURCES.some(
					(source) => source.panelType === candidate.type,
				),
		)) {
			actions.updatePanel(record.id, { canClose: true });
			actions.closePanel(record.id);
		}
	};

	/**
	 * Reveal the sidebar's editor for a file, opening it if it is not there.
	 *
	 * Which editor depends on the extension — `getFilePanelType` picks between
	 * the code, markdown, notebook, image, PDF, pptx and download panels.
	 *
	 * @param path - The file's insight-relative path.
	 * @param name - Tab label; defaults to the file's own name.
	 * @param options - `refresh`: reload an editor already open on the file,
	 * after its file was overwritten.
	 * @returns The revealed or created panel id.
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
	 * A room binds to a fresh insight every time it loads. Panels opened before
	 * that binding completes need their mode updated before they mount so reads,
	 * saves, and dedupe all use the room's live insight.
	 */
	private _syncSidebarFileMode = (): void => {
		const { actions } = this.workbench.getState().layout;
		const mode = this.fileMode;

		for (const record of actions.findPanels((candidate) => {
			const panelMode = getPanelFileMode(candidate);
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
	 * @param name - Tab label for a newly created instance. Defaults to the
	 * chat files label, which keeps the room's own files apart from a
	 * connector work folder.
	 * @returns The revealed or created panel id.
	 */
	openSidebarFileExplorer = (
		initialPath?: string,
		name?: string,
	): WorkbenchPanelId => {
		const pid = this.openSidebarPanel(
			FILE_PANEL_TYPES.FILE_EXPLORER,
			{ mode: this.fileMode },
			// no translations outside the app, as in tests; the blueprint names it
			name ?? getI18n()?.t("room:workspacePlaces.files"),
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
	 * Reload the chat files explorer, if it is open, after a file was saved
	 * into the room's folder from outside it.
	 */
	refreshSidebarFileExplorer = (): void => {
		const { actions, values } = this.workbench.getState().layout;
		for (const record of actions.matchPanels(
			FILE_PANEL_TYPES.FILE_EXPLORER,
			{ mode: this.fileMode },
		)) {
			(
				values[record.id] as FileExplorerApi | undefined
			)?.commands.refresh();
		}
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
	 * Close the sidebar and return its open tools inline. Other panels retain
	 * their arrangement for the next time the workspace opens.
	 */
	closeSidebar = async (): Promise<void> => {
		this._setSidebarOpen(false);
		for (const tool of Object.values(this.tools)) {
			if (tool.isOpen && tool.display === "sidebar") {
				tool.openTool("inline");
			}
		}
	};

	// Helpers

	/**
	 * Set the room's loading state. Public so callers that don't go through
	 * streamJob.run() — e.g. the agent-run poll subscription — can still
	 * participate in the room's loading state.
	 *
	 * @param isLoading - Whether the room is loading.
	 */
	setIsLoading = (isLoading: boolean): void => {
		this.state.update({ isLoading });
	};

	/**
	 * Whether a file goes to the model with the message. The theme may limit
	 * this to some extensions; other files stay in the room for tools.
	 *
	 * @param fileName - The file's name.
	 * @returns True when the file is sent to the model.
	 */
	shouldAttachToModel = (fileName: string): boolean => {
		const allowed = this._theme.allowedFileTypes;
		if (!allowed || allowed.length === 0) {
			return true;
		}
		const normalize = (value: string) =>
			value.trim().toLowerCase().replace(/^\./, "");
		const extension = normalize(fileName.split(".").pop() ?? "");
		return (
			extension !== "" &&
			allowed.some((type) => normalize(type) === extension)
		);
	};

	/**
	 * Send the user's message: show it at once with a thinking reply, save the
	 * room's options, upload its files, add the queued context files, then run
	 * the turn. A failed upload withdraws the message and requeues its files.
	 *
	 * @param prompt - The user's message.
	 * @param files - Files to upload with it.
	 * @param askOptions.visible - whether the user's bubble renders (default
	 *   true); pass false for a silent kickoff turn — the reply still shows.
	 * @throws Error without a model or prompt; an `UploadError` when a file
	 * cannot be read; and whatever the turn throws.
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
		// a new turn starts without the last one's error
		this.state.update({ error: null });

		// Create the input message immediately so the user's bubble and the
		// thinking placeholder are visible while the options save and the
		// files upload
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
			parts: [],
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
		uploadPlaceholder.setIsThinking(true);

		// files queued from the sidebar are already in the room's folder, so
		// they go with the message as they are; a silent turn leaves them queued
		const queuedFiles = visible ? this.contextItems.take() : [];

		// upload the files
		let mediaInputs: {
			fileName: string;
			fileLocation: string;
		}[] = [];

		try {
			// save the settings this turn runs with, when they changed
			await this.updateRoomOptions(this.options);

			// upload the files if there are any
			if (files.length > 0) {
				const response = await uploadInsight(
					this.snapshot.insightId,
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

				mediaInputs = uploaded;
			}

			mediaInputs = [
				...mediaInputs,
				...queuedFiles.map((item) => ({
					fileName: item.name,
					fileLocation: item.path,
				})),
			];

			// Append media parts to the already-visible input message; files
			// outside the theme's list stay in the room for tools
			mediaInputs
				.filter((file) => this.shouldAttachToModel(file.fileName))
				.forEach((file) => {
					inputMessage.addPart({
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
				});
		} catch (e) {
			// the queued files were not sent, so they wait for the next try
			this.contextItems.restore(queuedFiles);

			// remove the placeholder messages and stop the room spinner
			uploadPlaceholder.setIsThinking(false);

			parentMessage.removeChild(inputMessage);
			this.setIsLoading(false);

			// Network-level failures (ERR_FAILED / Failed to fetch) mean the
			// browser couldn't complete the request — most likely the file is
			// locked at the OS level. Convert to UploadError so callers show
			// the "file in use" toast instead of a silent failure.
			if (e instanceof TypeError) {
				const uploadError = new Error("File is in use");
				uploadError.name = "UploadError";
				throw uploadError;
			}

			throw e;
		}

		// run the message, reusing the upload placeholder as the streaming response
		try {
			await parentMessage.runMessage(inputMessage, uploadPlaceholder);
		} catch (e) {
			// the message is withdrawn and its text restored, so its queued files
			// wait with it
			this.contextItems.restore(queuedFiles);
			throw e;
		}
	};

	/**
	 * Save a tool call's result on the response that made it. Ignores a call
	 * that has already settled, and logs rather than throws a failed save.
	 *
	 * @param messageId - The response message's id.
	 * @param toolId - The tool call's id.
	 * @param toolResponse - What the tool returned.
	 * @param toolStatus - How the call ended.
	 * @param executedParameters - The parameters the tool ran with.
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

			const tool = this.snapshot.tools[toolId];
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
	 * Run a pixel in the room's insight. A success clears the room's error.
	 *
	 * @param pixel - The pixel to run.
	 * @param showLoading - toggle the room's loading state around the run
	 * @param setErrorOnFail - surface a thrown failure on the room's error state
	 * @param throwOnError - when true (default), throw if any statement returns
	 *   an error. Pass false for multi-statement pixels where the caller wants to
	 *   inspect per-statement outcomes (each `pixelReturn` entry's `operationType`
	 *   contains "ERROR" on failure) rather than get an all-or-nothing throw.
	 * @returns The pixel's response.
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
			const response = await runPixel<O>(pixel, this.snapshot.insightId);

			if (throwOnError && response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}

			// a run that succeeds clears the last failure
			this.state.update({ error: null });

			return response;
		} catch (e) {
			if (setErrorOnFail) {
				this.state.update({ error: e as Error });
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
	 * @returns The job's errors, its per-statement results, and the logs.
	 */
	runRoomPixelWithConsole = async (
		pixel: string,
		onConsole?: (logs: string[]) => void,
		maxLogChars?: number,
	) => {
		// Launch the async job.
		const { jobId } = await runPixelAsync(pixel, this.snapshot.insightId);
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

		let isPolling = true;
		while (isPolling) {
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
					isPolling = false;
				} else {
					await sleep(1000);
				}
			} catch {
				isPolling = false;
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
	 *
	 * @param pixel - The pixel to run.
	 * @param handlers - Called with each chunk, the result, and on a stop.
	 * @param options - Loading, error, and throw behavior; see `StreamOptions`.
	 * @returns Once the job has finished or unwound.
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
		if (message?.hasUnfinishedTools && !this.snapshot.isCancellingTools) {
			this.state.update({ isCancellingTools: true });

			try {
				await message.cancelPendingTools();
			} finally {
				this.state.update({ isCancellingTools: false });
			}
		}
	};

	/**
	 * Compact the conversation into its last real response (CompactRoomMessages):
	 * each successful method adds its summary turn below that response.
	 *
	 * @param strategy - Which compaction to run; AUTO or none lets the backend pick.
	 * @returns "compacted", or "skipped" when the backend had nothing to compact.
	 * @throws Error when there is no response to compact, it holds tool calls,
	 * or every method failed.
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
