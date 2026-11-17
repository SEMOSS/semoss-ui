import type { StoreApi } from "zustand";
import { getI18n } from "@semoss/i18n";
import { FILE_PANEL_EVENTS, getFilePanelScope } from "@semoss/panels";
import {
	getWorkspace,
	listModels,
	loadPlaygroundRoom,
	runPixelWithConsole,
} from "@semoss/sdk";
import type { ThemeMap } from "@semoss/shared";
import { StoreState } from "@semoss/utility/store";
import type {
	WorkbenchPanelId,
	WorkbenchPanelParams,
	WorkbenchPanelType,
	WorkbenchSnapshot,
	WorkbenchState,
} from "@semoss/workbench";
import type {
	ChatMode,
	Engine,
	InputPixelMessage,
	MCPConfig,
	PixelMessage,
	PixelMessageSubagentPart,
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
	ResponsePixelMessage,
	ToolOutcome,
} from "../../../types";
import { ConnectorsStore } from "../../connectors/store/connectors.store";
import { ContextItemsStore } from "../../conversation/attachments/context-items.store";
import { RoomLocalFoldersStore } from "../../local-folders/store/room-local-folders.store";
import { ChatTools } from "../../tools/chat-tools/chat-tools";
import { mergeRoomClientTools } from "../../tools/chat-tools/room-client-tools";
import { NEW_INSIGHT_ID } from "../../tools/mcp/mcp-constants";
import {
	AgentTurnRunner,
	reconstructAllSubagents,
} from "../turns/agent-turn-runner";
import { ChatTurnRunner } from "../turns/chat-turn-runner";
import {
	type StreamHandlers,
	StreamJobController,
	type StreamOptions,
} from "../turns/stream-job-controller";
import type { TurnRunner } from "../turns/turn-runner";
import type { AbstractMessageStore } from "./abstract-message.store";
import { InputMessageStore } from "./input-message.store";
import type {
	CancelCommitOutput,
	MessageData,
	MessageKey,
} from "./message-map";
import type { ResponseMessageStore } from "./response-message.store";
import {
	createInputPlaceholder,
	createResponsePlaceholder,
} from "./response-placeholder";
import { RoomAgentTools } from "./room-agent-tools";
import {
	type CompactionStrategy,
	compactConversation,
} from "./room-compaction";
import { findActiveModelId, mergeAgentIntoRoom } from "./room-load";
import { RoomMessageTree, redecorateTools } from "./room-message-tree";
import { RoomRequests } from "./room-requests";
import {
	INITIAL_ROOM,
	type RoomOptions,
	type RoomSnapshot,
	type RoomStoreOptions,
} from "./room-snapshot";
import { RoomStoredOptions } from "./room-stored-options";
import { updateRoomToolFile } from "./room-tool-file";
import {
	createUploadError,
	isAttachedToModel,
	toMediaParts,
	uploadTurnFiles,
} from "./room-turn-files";
import {
	createRoomWorkbenchSnapshot,
	RoomWorkbenchController,
} from "./room-workbench-controller";
import type { ToolData, ToolStore } from "./tool.store";

export type { RoomSnapshot, RoomStoreOptions } from "./room-snapshot";

/**
 * One room: its messages, tool calls, settings, and Workspace, and the actions
 * that load it, send its messages, and run its pixels. Read it in React with
 * `useRoomSelector`. The room owns one snapshot and its collaborators, each
 * writing only its part through the room: the message tree and its views
 * (`RoomMessageTree`), the Workspace dock (`RoomWorkbenchController`), the options'
 * persistence (`RoomStoredOptions`), the agent's tools (`RoomAgentTools`),
 * and its requests (`RoomRequests`, `StreamJobController`). The room keeps
 * every public name, as a delegate where the work moved.
 */
export class RoomStore {
	/** The playground theme, which limits the files sent to the model. */
	private _theme: ThemeMap["playground"];

	/** The room's snapshot; only the store's own actions write it. */
	private readonly state: StoreState<RoomSnapshot>;

	/** Runs the room's streaming jobs and owns their cancel state. */
	private readonly streamJob = new StreamJobController({
		getInsightId: () => this.snapshot.insightId,
		setLoading: (isLoading) => this.setIsLoading(isLoading),
		setError: (error) => this.setError(error),
		onChange: () =>
			this.state.update({
				canCancelJob: this.streamJob.canCancel,
				isCancellingJob: this.streamJob.isCancelling,
			}),
	});

	/** Runs the room's one-off pixels and requests, with its loading and error state. */
	private readonly requests = new RoomRequests({
		getInsightId: () => this.snapshot.insightId,
		setLoading: (isLoading) => this.setIsLoading(isLoading),
		setError: (error) => this.setError(error),
	});

	/** Keeps the room's options in step with what the backend holds. */
	private readonly storedOptions = new RoomStoredOptions({
		getRoomId: () => this.snapshot.roomId,
		getModelId: () => this.snapshot.model.engine_id,
		runRequest: (request, options) => this.runRoomRequest(request, options),
		setOptions: (options) => this.setOptions(options),
	});

	/** The room's Workspace dock and the panels it opens. */
	private readonly workbenchController: RoomWorkbenchController;

	/** Reads the tools the room's agent brings whenever its agent changes. */
	private readonly agentToolsSync = new RoomAgentTools({
		getInsightId: () => this.snapshot.insightId,
		getAgentId: () => this.snapshot.options.workspace?.workspace_id || null,
		write: (agentTools) => this.state.update({ agentTools }),
	});

	/**
	 * The conversation as plain data and the views over it. Its writes keep
	 * every field they leave out, so a change to nothing notifies no one.
	 */
	private readonly tree = new RoomMessageTree(this, (change) =>
		this.state.update((current) => ({
			messages: current.messages,
			rootKey: current.rootKey,
			tools: current.tools,
			...change(current),
		})),
	);

	/**
	 * The default tools the room's chat sends and the user's decisions on the
	 * calls that wait for them. Its own store with its own subscribers, like
	 * the dock, and so are the two below.
	 */
	readonly chatTools: ChatTools;

	/** The connectors switched on for the room and the accounts they sign in with. */
	readonly connectors: ConnectorsStore;

	/** The files queued for the room's next message. */
	readonly contextItems: ContextItemsStore;

	/**
	 * The folders from the user's machine attached to the room, where the host
	 * can reach them (the desktop app); null everywhere else.
	 */
	readonly localFolders: RoomLocalFoldersStore | null;

	/** Runs the room's chat turns and their tool calls. */
	readonly chatTurns: ChatTurnRunner = new ChatTurnRunner(this);

	/** Runs the room's agent turns, and keeps the one live watcher per run. */
	readonly agentTurns: AgentTurnRunner = new AgentTurnRunner(this);

	/**
	 * Build a room and its Workspace. It holds no messages until `initialize`.
	 *
	 * @param options - The room's theme, ids, panel blueprints, and whether its
	 * Workspace offers Files.
	 */
	constructor(options: RoomStoreOptions) {
		const {
			theme,
			roomId,
			insightId = NEW_INSIGHT_ID,
			panelComponents,
			includeFiles = true,
			localFolders,
		} = options;
		this._theme = theme;
		const workbenchSnapshot = createRoomWorkbenchSnapshot({
			insightId,
			includeFiles,
			panelComponents,
		});
		this.state = new StoreState<RoomSnapshot>({
			...INITIAL_ROOM,
			roomId,
			insightId,
			workbenchSnapshot,
		});
		this.chatTools = new ChatTools(this);
		this.connectors = new ConnectorsStore(this);
		this.contextItems = new ContextItemsStore();
		this.localFolders = localFolders
			? new RoomLocalFoldersStore({
					host: localFolders,
					getRoomId: () => this.snapshot.roomId,
					// an agent room keeps its client tools in its toolbox, so
					// they follow the folders there
					onFoldersChanged: () => {
						this.syncClientTools().catch((error: unknown) => {
							console.error(
								"Could not update the client tools",
								error,
							);
						});
					},
					onFilesChanged: this.handleLocalFilesChanged,
				})
			: null;
		this.workbenchController = new RoomWorkbenchController(
			{
				getInsightId: () => this.snapshot.insightId,
				getTools: () => this.snapshot.tools,
				getTool: (toolId) => this.getTool(toolId),
				setOpen: (isOpen) => this._setWorkbenchOpen(isOpen),
				setSnapshot: (snapshot) =>
					this.state.update({ workbenchSnapshot: snapshot }),
				connectors: this.connectors,
			},
			{ snapshot: workbenchSnapshot, panelComponents, includeFiles },
		);
	}

	/**
	 * Stop the room's own subscriptions: the Workbench and connector watchers,
	 * and forget its agent runs. The owner calls it once it drops the room; a
	 * disposed room no longer reacts to its dock or its connectors. A running
	 * reply is not stopped.
	 */
	dispose = (): void => {
		this.workbenchController.dispose();
		this.agentTurns.dispose();
		this.localFolders?.dispose();
	};

	/**
	 * Bring an agent room's toolbox in line with its client tools, since its
	 * runs bring no tools from the browser, then refresh its options. A chat
	 * room sends them with each turn instead, so nothing is written for one.
	 * A new chat whose prepared room becomes an agent room as it sends calls
	 * this first, so the run starts with them.
	 *
	 * @throws Error when the room's tool file cannot be read or written.
	 */
	syncClientTools = async (): Promise<void> => {
		if (
			!this.localFolders ||
			this.mode !== "agent" ||
			this.snapshot.insightId === NEW_INSIGHT_ID
		) {
			return;
		}
		const definitions = this.chatTools.clientToolDefinitions;
		const isWritten = await updateRoomToolFile(this, (file) =>
			mergeRoomClientTools(file, definitions),
		);
		if (isWritten) {
			await this.syncRoomOptions();
		}
	};

	/**
	 * Tell every attached folder's explorer and panels that its files may
	 * have changed, such as after a client tool wrote one.
	 */
	refreshLocalFolderPanels = (): void => {
		for (const folder of this.localFolders?.folders ?? []) {
			this.handleLocalFilesChanged(folder.id);
		}
	};

	/**
	 * A folder changed outside the chat: tell its explorer and the panels
	 * showing its files.
	 *
	 * @param folderId - The attachment.
	 * @param paths - What changed, when the host can tell.
	 */
	private handleLocalFilesChanged = (
		folderId: string,
		paths?: string[],
	): void => {
		this.workbench
			.getState()
			.events.actions.emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
				scope: getFilePanelScope({ type: "MOUNT", mountId: folderId }),
				paths: paths,
			});
	};

	/**
	 * The room's current snapshot, for `useStoreSelector`.
	 *
	 * @returns The snapshot.
	 */
	getSnapshot = (): RoomSnapshot => this.snapshot;

	/**
	 * Hear about every change to the room, including its messages and tool
	 * calls, which it holds.
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
	 * The dock backing the Workbench, owned by the room so panels open from
	 * outside React and survive the Workbench closing. Read it to drive the
	 * Workbench from React (`useStore(room.workbench, …)`).
	 */
	get workbench(): StoreApi<WorkbenchState> {
		return this.workbenchController.workbench;
	}

	/**
	 * The arrangement shared by the store and every Workbench mount: the shell
	 * must start from this same reference, so mounting it does not reset tabs
	 * opened since.
	 */
	get workbenchSnapshot(): WorkbenchSnapshot {
		return this.snapshot.workbenchSnapshot;
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

	/** What runs the room's next turn, for its mode. */
	get turnRunner(): TurnRunner {
		return this.mode === "agent" ? this.agentTurns : this.chatTurns;
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

	/** The tools and knowledge the room's agent brings (see RoomSnapshot.agentTools). */
	get agentTools() {
		return this.snapshot.agentTools;
	}

	/**
	 * Find a message anywhere in the room's tree, on any branch.
	 *
	 * @param messageId - The message's id.
	 * @returns The message, or null when the room has none by that id.
	 */
	getMessage = (messageId: string) => this.tree.getMessage(messageId);

	/** The hidden message every conversation hangs from, or null until the room loads. */
	get root(): ResponseMessageStore | null {
		return this.tree.root;
	}

	/** The conversation as shown: each active child from the root down, without the root. */
	get history(): (InputMessageStore | ResponseMessageStore)[] {
		return this.tree.history;
	}

	/** The last message of the history, or the root when it is empty. */
	get tail(): InputMessageStore | ResponseMessageStore {
		return this.tree.tail;
	}

	/**
	 * The last real response, past input messages and the streaming
	 * placeholder. The root is no response, so an empty room has none: null
	 * (typed as a store).
	 */
	get latestResponseMessage(): ResponseMessageStore {
		return this.tree.latestResponseMessage as ResponseMessageStore;
	}

	/** Total tokens used in the current conversation; see `RoomMessageTree.tokensUsed`. */
	get tokensUsed(): number {
		return this.tree.tokensUsed;
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
	get workbenchPane() {
		return this.snapshot.workbenchPane;
	}

	// Setters

	/**
	 * Set how the room sends its messages. Not saved until the next options save.
	 *
	 * @param mode - Chat or agent.
	 */
	setMode = (mode: ChatMode) => {
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
	 * Merge new values into the room's settings, locally. Every tool call's
	 * `json` is worked out again in the same write, since a work folder
	 * call's metadata follows the options; a call whose `json` comes back the
	 * same keeps its entry.
	 *
	 * @param options - The settings to change.
	 */
	setOptions = (options: Partial<RoomOptions>) => {
		this.state.update((current) => {
			const next = { ...current.options, ...options };
			return {
				options: next,
				tools: redecorateTools(current.tools, (call) =>
					this.chatTools.decorateToolCall(call, next.defaultTools),
				),
			};
		});
		this.agentToolsSync.follow();
	};

	/**
	 * Take the tools an agent brings, read elsewhere, so the room does not
	 * read them again. A new chat hands its draft the agent it loaded.
	 *
	 * @param workspaceId - The agent, or null for none.
	 * @param agentTools - Its tools and knowledge.
	 */
	setAgentTools = (
		workspaceId: string | null,
		agentTools: readonly MCPConfig[],
	): void => this.agentToolsSync.set(workspaceId, agentTools);

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
	 * Load the room: bind it to its insight, build its message tree, pick up a
	 * turn still running, then lay its agent over its options and restore its
	 * model.
	 *
	 * @param options - `isNew`: the room was just created, so it has no tool
	 * file for its connectors to be read from.
	 * @throws Error when the room cannot load.
	 */
	initialize = async ({ isNew = false }: { isNew?: boolean } = {}) => {
		try {
			// the messages and the options (missing for old rooms), and bind
			// the room to its insight
			const loaded = await this.runRoomRequest(
				(insightId) =>
					loadPlaygroundRoom<PixelMessage, RoomOptions>(
						insightId,
						this.snapshot.roomId,
					),
				{ showLoading: false },
			);
			this.state.update({ insightId: loaded.insightId });
			this.workbenchController.syncFileMode();
			// the room's tool file can be read now, unless it was just created
			void this.connectors.restore({ isNew: isNew });

			this.tree.load(loaded.messages);
			// a stored harness promotes the room to agent mode, never demotes
			// it: a new room's mode is set before its options are saved
			if (loaded.options?.harnessType) {
				this.setMode("agent");
			}
			// once the mode is known, which decides where the desktop tools go
			void this.localFolders?.load();
			// before the agent and model round trips, which it does not need
			this._reconnectTurn();

			const workspaceId = loaded.options?.workspace?.workspace_id;
			const workspace = workspaceId
				? await getWorkspace(
						this.snapshot.insightId,
						workspaceId,
					).catch((e: Error) => {
						this.setError(e);
						throw e;
					})
				: null;
			const agent = mergeAgentIntoRoom({ ...loaded.options }, workspace);

			// the model of the last message sent, or the agent's for a room that
			// has never named one; a room already on it has nothing to look up
			const modelId =
				findActiveModelId(
					loaded.messages,
					this.snapshot.model?.engine_id,
				) || agent.defaultModelId;
			if (modelId && modelId !== this.snapshot.model?.engine_id) {
				const [model] = await this.runRoomRequest(
					(insightId) =>
						listModels<Engine>(insightId, { filterWord: modelId }),
					{ showLoading: false },
				);
				if (model) {
					this.setModel(model);
				}
			}

			this.setAgentTools(workspaceId ?? null, agent.agentTools);
			this.setOptions(agent.options);
			this.storedOptions.remember(loaded.options);
			this.state.update({ agentGreeting: agent.agentGreeting });
			// GetPlaygroundMessages doesn't carry the name
			if (loaded.name) {
				this.setMetadata({ name: loaded.name });
			}
		} catch (e) {
			console.error(e);
			throw new Error(
				(e as Error).message ||
					getI18n()?.t("room:errors.initializeFailed"),
			);
		}
	};

	/**
	 * Pick up the turn a reload left running. An agent run is driven entirely
	 * server-side and only gets a live AgentStore from its own submit, so it is
	 * reconnected here (see `AgentTurnRunner.reconnect`); a chat turn continues its tool
	 * calls. An empty room, whose tail is the root, has no turn.
	 */
	private _reconnectTurn = (): void => {
		if (this.mode === "agent") {
			void reconstructAllSubagents(this);
		}
		const { tail } = this;
		if (tail.key === this.snapshot.rootKey || tail.type !== "OUTPUT") {
			return;
		}
		if (this.mode === "agent") {
			this.agentTurns.reconnect(tail);
		} else {
			tail.continueToolExecution();
		}
	};

	/** Read the room's options from the backend, quietly; see `RoomStoredOptions.sync`. */
	syncRoomOptions = (): Promise<void> => this.storedOptions.sync();

	/** Save the room's options unless the backend holds them; see `RoomStoredOptions.save`. */
	updateRoomOptions = (options: RoomStore["options"]): Promise<void> =>
		this.storedOptions.save(options);

	// Tools and messages: the tree's (`RoomMessageTree`), for their views

	/** Create or update a tool call from a message part; see `RoomMessageTree.syncTool`. */
	syncTool = (
		toolId: string,
		message: InputMessageStore | ResponseMessageStore,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
		options?: { placeholder?: boolean },
	): void => this.tree.syncTool(toolId, message, part, options);

	/** Sync the tool calls and results a message holds, as it takes the backend's copy. */
	syncMessageTools = (message: AbstractMessageStore): void =>
		this.tree.syncMessageTools(message);

	/** Find a tool call by id, or start one that has not synced anything yet. */
	getOrCreateTool = (toolId: string): ToolStore =>
		this.tree.getOrCreateTool(toolId);

	/** Change a tool call, for its view; see `RoomMessageTree.updateToolData`. */
	updateToolData = (
		toolId: string,
		change: Partial<ToolData> | ((current: ToolData) => Partial<ToolData>),
	): void => this.tree.updateToolData(toolId, change);

	/** Every tool call this room has seen, by id, as data. */
	get tools() {
		return this.snapshot.tools;
	}

	/** Find a tool call by id, or null when the room has not seen it. */
	getTool = (toolId: string): ToolStore | null => this.tree.getTool(toolId);

	/**
	 * Make a message from a pixel message, detached from the tree, and sync
	 * the tool calls it holds. Hang it in the tree with `addChild`.
	 *
	 * @param pixelMessage - The backend's message, or a placeholder.
	 * @returns Its view.
	 */
	createMessage(pixelMessage: InputPixelMessage): InputMessageStore;
	createMessage(pixelMessage: ResponsePixelMessage): ResponseMessageStore;
	createMessage(
		pixelMessage: PixelMessage,
	): InputMessageStore | ResponseMessageStore;
	createMessage(
		pixelMessage: PixelMessage,
	): InputMessageStore | ResponseMessageStore {
		return this.tree.createMessage(pixelMessage);
	}

	/** The one view of a message the room holds, or null when it has no such message. */
	getMessageByKey = (
		key: MessageKey,
	): InputMessageStore | ResponseMessageStore | null =>
		this.tree.getMessageByKey(key);

	/** The views of some messages, the same array for the same keys array. */
	getMessagesByKey = (
		keys: readonly MessageKey[],
	): readonly AbstractMessageStore[] => this.tree.getMessagesByKey(keys);

	/** Replace one message's data, for its view. */
	updateMessageData = (
		key: MessageKey,
		change: (data: MessageData) => MessageData,
	): void => this.tree.updateMessageData(key, change);

	/** Replace one message's parts, for its view. */
	updateMessageParts = <P extends MessageData["parts"]>(
		key: MessageKey,
		change: (parts: P) => P,
	): void => this.tree.updateMessageParts(key, change);

	/** Hang a message under another, as its active child. */
	insertChildMessage = (parentKey: MessageKey, childKey: MessageKey): void =>
		this.tree.insertChildMessage(parentKey, childKey);

	/**
	 * Take a message from under its parent and delete it, everything below
	 * it, and the tool calls they made. Their views read as empty after.
	 */
	removeChildMessage = (parentKey: MessageKey, childKey: MessageKey): void =>
		this.tree.removeChildMessage(parentKey, childKey);

	/** Choose which child of a message continues the conversation. */
	setActiveChildMessage = (parentKey: MessageKey, index: number): void =>
		this.tree.setActiveChildMessage(parentKey, index);

	/**
	 * Splice the backend's hidden input/response pairs into the tree under
	 * `parent`, for the cancelled-turn and cancelled-tool-execution commits.
	 */
	spliceHiddenMessages = (
		parent: AbstractMessageStore,
		extraMessages: CancelCommitOutput["extraMessages"] | undefined,
	): void => this.tree.spliceHiddenMessages(parent, extraMessages);

	/** Find a spawned subagent's part by id, wherever it falls in the room's history. */
	getSubagentPart = (
		subagentId: string,
	): PixelMessageSubagentPart["subagent"] | undefined =>
		this.tree.getSubagentPart(subagentId);

	// Workbench: the dock is the Workbench controller's (`RoomWorkbenchController`)

	/** The file scope every file panel in this Workbench is opened in. */
	get fileMode() {
		return this.workbenchController.fileMode;
	}

	/** Reveal a Workbench panel, opening the Workbench; see `RoomWorkbenchController.openPanel`. */
	openWorkbenchPanel = (
		type: WorkbenchPanelType,
		config: WorkbenchPanelParams = {},
		name?: string,
	): WorkbenchPanelId =>
		this.workbenchController.openPanel(type, config, name);

	/** Adopt a draft's arrangement before the first mount; see `RoomWorkbenchController.restoreLayout`. */
	restoreWorkbenchLayout = (snapshot: WorkbenchSnapshot): void =>
		this.workbenchController.restoreLayout(snapshot);

	/** Open the Workspace as it was left, its panel rail always beside it. */
	openWorkbench = (): void => this._setWorkbenchOpen(true);

	/**
	 * Show or hide the Workspace.
	 *
	 * @param isOpen - Whether it is on screen.
	 */
	private _setWorkbenchOpen = (isOpen: boolean): void => {
		this.state.update((current) => ({
			workbenchPane:
				current.workbenchPane.isOpen === isOpen
					? current.workbenchPane
					: { ...current.workbenchPane, isOpen },
		}));
	};

	/** Reveal the Workbench's editor for a file; see `RoomWorkbenchController.openFilePanel`. */
	openWorkbenchFilePanel = (
		path: string,
		name?: string,
		options?: { refresh?: boolean },
	): WorkbenchPanelId =>
		this.workbenchController.openFilePanel(path, name, options);

	/** Reveal the Workbench's file explorer; see `RoomWorkbenchController.openFileExplorer`. */
	openWorkbenchFileExplorer = (
		initialPath?: string,
		name?: string,
	): WorkbenchPanelId =>
		this.workbenchController.openFileExplorer(initialPath, name);

	/** Reload the chat files explorer, if it is open. */
	refreshWorkbenchFileExplorer = (): void =>
		this.workbenchController.refreshFileExplorer();

	/** Close a Workbench panel matching `config`, if one is open. */
	closeWorkbenchPanel = (
		type: WorkbenchPanelType,
		config: WorkbenchPanelParams = {},
	): void => this.workbenchController.closePanel(type, config);

	/** Close the Workbench and return its open tools inline. */
	closeWorkbench = (): void => this.workbenchController.close();

	// Helpers

	/**
	 * Set the room's loading state. Public so a turn (`trackTurn`) keeps the
	 * room loading for as long as it runs, whichever way it runs.
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
	shouldAttachToModel = (fileName: string): boolean =>
		isAttachedToModel(fileName, this._theme.allowedFileTypes);

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
		this.setError(null);

		// Anchor to the latest REAL response. this.tail can be an un-synced
		// STREAMING_PLACEHOLDER_ID node left behind by a turn that errored
		// mid-stream; latestResponseMessage skips those, and an empty room
		// anchors to its root.
		const parentMessage = this.latestResponseMessage ?? this.tail;
		if (parentMessage instanceof InputMessageStore) {
			throw new Error("Cannot respond to input messages");
		}

		// the user's bubble and the thinking reply show while the options save
		// and the files upload
		const inputMessage = createInputPlaceholder(this, prompt, visible);
		const uploadPlaceholder = createResponsePlaceholder(this);
		parentMessage.addChild(inputMessage);
		inputMessage.addChild(uploadPlaceholder);
		uploadPlaceholder.setIsThinking(true);

		// files queued from the Workbench are already in the room's folder, so
		// they go with the message as they are; a silent turn leaves them queued
		const queuedFiles = visible ? this.contextItems.take() : [];
		try {
			// save the settings this turn runs with, when they changed
			await this.updateRoomOptions(this.options);
			const uploaded = await uploadTurnFiles(
				this.snapshot.insightId,
				files,
			);
			const media = [
				...uploaded,
				...queuedFiles.map((item) => ({
					fileName: item.name,
					fileLocation: item.path,
				})),
			];
			for (const part of toMediaParts(media, this.shouldAttachToModel)) {
				inputMessage.addPart(part);
			}
		} catch (e) {
			// the queued files were not sent, so they wait for the next try
			this.contextItems.restore(queuedFiles);
			uploadPlaceholder.setIsThinking(false);
			parentMessage.removeChild(inputMessage);
			this.setIsLoading(false);
			// a network-level failure (Failed to fetch) most likely means the
			// file is locked at the OS level
			throw e instanceof TypeError ? createUploadError() : e;
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

	/** Save a tool call's result on the response that made it; see `RoomMessageTree.processTool`. */
	processTool = (
		messageId: string,
		toolId: string,
		toolResponse: string,
		toolStatus: ToolOutcome = "success",
		executedParameters: Record<string, unknown>,
	): Promise<void> =>
		this.tree.processTool(
			messageId,
			toolId,
			toolResponse,
			toolStatus,
			executedParameters,
		);

	/** Run a pixel in the room's insight; see `RoomRequests.runPixel`. */
	runRoomPixel = <O extends [] | unknown[]>(
		pixel: string,
		options: StreamOptions = {},
	) => this.requests.runPixel<O>(pixel, options);

	/** Run a backend request in the room's insight; see `RoomRequests.runRequest`. */
	runRoomRequest = <T>(
		request: (insightId: string) => Promise<T>,
		options: Omit<StreamOptions, "throwOnError"> = {},
	): Promise<T> => this.requests.runRequest(request, options);

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
	runRoomPixelWithConsole = (
		pixel: string,
		onConsole?: (logs: string[]) => void,
		maxLogChars?: number,
	) =>
		runPixelWithConsole(this.snapshot.insightId, pixel, {
			onConsole: onConsole,
			maxLogChars: maxLogChars,
		});

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
	 * Compact the conversation into its last real response; see
	 * `compactConversation`.
	 *
	 * @param strategy - Which compaction to run; AUTO or none lets the backend pick.
	 * @returns "compacted", or "skipped" when the backend had nothing to compact.
	 */
	compactMessages = (strategy?: CompactionStrategy) =>
		compactConversation(this, this.tree.graftTurns, strategy);
}
