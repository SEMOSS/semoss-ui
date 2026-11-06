import { runPixel } from "../../api/base";
import { chatPixels } from "../../api/chat-pixels";
import { uploadInsight } from "../../api/insight";
import { ChatToolsStore } from "./chat-tools/chat-tools.store";
import { ContextItemsStore } from "./context-items.store";
import type { AbstractMessageStore } from "./message/abstract-message.store";
import {
	reconnectAgentRun,
	reconstructAllSubagents,
} from "./message/agent-harness";
import { InputMessageStore } from "./message/input-message.store";
import { linkMessageTree } from "./message/message-tree";
import { ResponseMessageStore } from "./message/response-message.store";
import { batchChanges, ObservableStore } from "./observable-store";
import {
	ROOT_PLACEHOLDER_ID,
	STREAMING_PLACEHOLDER_ID,
} from "./room.constants";
import type {
	InputPixelMessage,
	ModelEngine,
	PixelMessage,
	PixelMessageSubagentPart,
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
	ResponsePixelMessage,
	RoomEngineOptions,
	RoomWorkspaceInfo,
} from "./room.types";
import { compactRoom } from "./room-compaction";
import { runPixelWithConsole } from "./room-console";
import type { RoomEngineConfig } from "./room-engine-config";
import {
	getStoredMcp,
	getStoredOptionsKey,
	mergeWorkspaceMcp,
	withTurnContext,
} from "./room-options";
import { buildLoadRoomPixel } from "./room-session";
import {
	type StreamHandlers,
	StreamJobController,
	type StreamOptions,
} from "./stream-job-controller";
import { ToolCallStore } from "./tool-call.store";

/** What `runRoomPixel` resolves to: the response of `runPixel`. */
export type RoomPixelResponse<O extends unknown[] | []> = Awaited<
	ReturnType<typeof runPixel<O>>
>;

/** What a room is made from. */
export interface RoomEngineInit<O extends RoomEngineOptions> {
	/** The room's id. */
	roomId: string;
	/**
	 * The insight the room is bound to; `new` (the default) until it loads,
	 * which binds a fresh one.
	 */
	insightId?: string;
	/** How the host runs its rooms. */
	config?: RoomEngineConfig;
	/** The options a new room starts with, before it loads its own. */
	options?: Partial<O>;
}

/**
 * The options every room starts with.
 *
 * @param config - The host's room configuration.
 * @returns The options.
 */
const defaultOptions = (config: RoomEngineConfig): RoomEngineOptions => ({
	predefinedPrompts: [],
	instructions: config.instructions ?? "",
	mcp: [],
	temperature: undefined,
});

/**
 * One room: its conversation (a tree of messages whose active branch is the
 * history), its options and model, the tool calls of its turns, and the jobs
 * a turn runs — framework-free, so a browser, a webview, or Node can run it.
 *
 * - **1 room = 1 insight per load.** `initialize` reads the room and binds a
 *   fresh insight to it in one request; a room is closed through
 *   `RoomsClient.closeRoom`, which drops that insight.
 * - **Chat turns** go through `AskPlayground` as streaming jobs; the tool
 *   calls a response makes run in a loop (client tools here, the rest through
 *   RunMCPTool) and their results go back through
 *   `AddPlaygroundToolExecution`, the client tools riding along each time.
 * - **Agent turns** (`mode === "agent"`) go through RunAgent; reloading a room
 *   whose last turn is still running reconnects to its run.
 *
 * Observable: read it with `getSnapshot`/`subscribe`, or from React with
 * `useRoomSelector`. A change to any of its messages or tool calls is a
 * change to the room.
 *
 * Hosts with a user interface extend it to show tool views and files: see
 * the protected hooks {@link RoomEngine.onInsightBound},
 * {@link RoomEngine.refreshFiles}, {@link RoomEngine.showToolPanel} and
 * {@link RoomEngine.hideToolPanel}.
 */
export class RoomEngine<
	O extends RoomEngineOptions = RoomEngineOptions,
> extends ObservableStore {
	/** The room's id. */
	readonly roomId: string;

	/** The insight the room is bound to; `new` until it loads. */
	insightId: string;

	/** How the host runs its rooms. */
	readonly config: RoomEngineConfig;

	/** Whether a turn or a read is in flight. */
	isLoading = false;

	/** Why the last turn or read failed, or null. */
	error: Error | null = null;

	/** Chat turns (AskPlayground) or agent turns (RunAgent). */
	mode: "agent" | "chat" = "chat";

	/** The room's name and creation date. */
	metadata: { name: string; dateCreated: string } = {
		name: "",
		dateCreated: "",
	};

	/** The model the room's turns run on. */
	model: ModelEngine = null as unknown as ModelEngine;

	/** The room's options, as it shows them. */
	options: O;

	/** The conversation's root. */
	root: ResponseMessageStore;

	/**
	 * The agent's scripted opening message, shown as the first bubble. Read
	 * from the workspace on every load; never sent to the model.
	 */
	agentGreeting = "";

	/** Every tool call the room has seen, by id. */
	tools: Record<string, ToolCallStore> = {};

	/** A tool-phase stop is committing. */
	private cancellingTools = false;

	/**
	 * Key of the options the backend holds, as of the last read or save. A
	 * save that would not change them is skipped.
	 */
	private storedOptionsKey: string | null = null;

	/** The instructions the current turn runs with, turn context included. */
	private turnInstructions: string | null = null;

	/** The streaming jobs of the room's turns, and their cancel state. */
	readonly streamJob: StreamJobController;

	/** The client tools the room's chat turns offer, and decisions on them. */
	readonly chatTools: ChatToolsStore;

	/** The files queued for the room's next message. */
	readonly contextItems: ContextItemsStore;

	/**
	 * @param init - The room's id, insight, the host's configuration and the
	 * options it starts with.
	 */
	constructor(init: RoomEngineInit<O>) {
		super();
		this.roomId = init.roomId;
		this.insightId = init.insightId ?? "new";
		this.config = init.config ?? {};
		this.options = {
			...defaultOptions(this.config),
			...init.options,
		} as O;
		this.root = this.createRoot();

		this.streamJob = new StreamJobController({
			getInsightId: () => this.insightId,
			setLoading: (isLoading) => this.setIsLoading(isLoading),
			setError: (error) => this.setError(error),
			owner: this,
		});
		this.chatTools = new ChatToolsStore(
			this,
			this.config.clientTools ?? [],
		);
		this.contextItems = new ContextItemsStore();
		this.contextItems.subscribe(() => this.emit());

		ObservableStore.observeFields<RoomEngine<O>>(this, [
			"insightId",
			"isLoading",
			"error",
			"mode",
			"metadata",
			"model",
			"options",
			"root",
			"agentGreeting",
			"tools",
			"cancellingTools" as never,
		]);
	}

	/**
	 * Hooks a host with a user interface overrides. The engine calls them;
	 * by default they do nothing.
	 */

	/**
	 * The room was bound to its insight, as on every load: re-point anything
	 * reading the room's files at it.
	 *
	 * @param options.isNew - The room was only just created, so it has no
	 * tool file of its own yet.
	 */
	protected onInsightBound(_options: { isNew: boolean }): void {}

	/** The room's files changed outside any view of them: refresh the views. */
	refreshFiles(): void {}

	/**
	 * Show a tool call's view in the host's side panel.
	 *
	 * @param tool - The call.
	 */
	showToolPanel(_tool: ToolCallStore): void {}

	/**
	 * Close a tool call's view in the host's side panel.
	 *
	 * @param tool - The call.
	 */
	hideToolPanel(_tool: ToolCallStore): void {}

	/** Whether there is something to stop: a cancellable stream, or tool calls the turn waits on. */
	get canCancel(): boolean {
		return (
			this.streamJob.canCancel ||
			(!this.cancellingTools &&
				Boolean(this.latestResponseMessage?.hasUnfinishedTools))
		);
	}

	/** A stop has been issued and is still unwinding. */
	get isCancelling(): boolean {
		return this.streamJob.isCancelling || this.cancellingTools;
	}

	/**
	 * Show a failure on the room, or clear it with null.
	 *
	 * @param error - The failure.
	 */
	setError = (error: Error | null): void => {
		this.error = error;
	};

	/**
	 * Set the room's mode.
	 *
	 * @param mode - Chat or agent.
	 */
	setMode = (mode: "agent" | "chat"): void => {
		this.mode = mode;
	};

	/**
	 * Set the model the room's turns run on.
	 *
	 * @param model - The model.
	 */
	setModel = (model: ModelEngine): void => {
		this.model = model;
	};

	/**
	 * Change some options, locally.
	 *
	 * @param options - The options to change.
	 */
	setOptions = (options: Partial<O>): void => {
		this.options = { ...this.options, ...options };
	};

	/**
	 * Change the room's name or date, locally.
	 *
	 * @param metadata - The fields to change.
	 */
	setMetadata = (metadata: Partial<RoomEngine["metadata"]>): void => {
		this.metadata = { ...this.metadata, ...metadata };
	};

	/**
	 * Turn the room's loading state on or off.
	 *
	 * @param isLoading - Whether something is in flight.
	 */
	setIsLoading = (isLoading: boolean): void => {
		this.isLoading = isLoading;
	};

	/**
	 * Find a message anywhere in the tree.
	 *
	 * @param messageId - The message's id.
	 * @returns The message, or null.
	 */
	getMessage = (messageId: string): AbstractMessageStore | null => {
		const queue: AbstractMessageStore[] = [this.root];
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

	/** The conversation: the chain of active children from the root. */
	get history(): (InputMessageStore | ResponseMessageStore)[] {
		const history: (InputMessageStore | ResponseMessageStore)[] = [];
		let current: AbstractMessageStore | null = this.root;
		while (current) {
			const child: AbstractMessageStore | null = current.activeChild;
			if (
				child instanceof InputMessageStore ||
				child instanceof ResponseMessageStore
			) {
				history.push(child);
			}
			current = child;
		}
		return history;
	}

	/** The last message of the conversation, or the root. */
	get tail(): InputMessageStore | ResponseMessageStore {
		const history = this.history;
		return history[history.length - 1] ?? this.root;
	}

	/** How many tool calls the room has seen. */
	get numberOfTools(): number {
		return Object.keys(this.tools).length;
	}

	/**
	 * The last real response: placeholders and tool-result inputs are passed
	 * over.
	 */
	get latestResponseMessage(): ResponseMessageStore {
		let message: AbstractMessageStore | null = this.tail;
		while (message) {
			if (
				message instanceof ResponseMessageStore &&
				message.id !== STREAMING_PLACEHOLDER_ID
			) {
				return message;
			}
			message = message.parent;
		}
		return null as unknown as ResponseMessageStore;
	}

	/**
	 * The tokens the conversation's context holds now.
	 *
	 * Input messages carry a cumulative count; responses carry only their
	 * turn's. The total is the two most recent nonzero counts walking back
	 * from the tail: one incremental and one cumulative (an input, or a
	 * response stamped with the cumulative count by a tool save).
	 */
	get tokensUsed(): number {
		let message: AbstractMessageStore | null = this.tail;
		let tokensUsed = 0;
		while (message) {
			if (message.tokens) {
				if (tokensUsed) {
					tokensUsed += message.tokens;
					break;
				}
				tokensUsed += message.tokens;
			}
			message = message.parent;
		}
		return tokensUsed;
	}

	/** The tokens every message of the conversation used, summed. */
	get totalTokensConsumed(): number {
		return this.history.reduce(
			(total, message) => total + (message.tokens || 0),
			0,
		);
	}

	/**
	 * Read the room and bind a fresh insight to it, then build its
	 * conversation, restore its mode and options, merge its agent's tools,
	 * and pick the model its history ran on. A last turn still running
	 * reconnects (agent) or continues its tool calls (chat).
	 *
	 * @param options.isNew - The room was only just created.
	 * @throws When the room cannot be read.
	 */
	initialize = async ({
		isNew = false,
	}: {
		isNew?: boolean;
	} = {}): Promise<void> => {
		try {
			const response = await this.runRoomPixel<
				[PixelMessage[], { OPTIONS?: O; ROOM_NAME?: string }]
			>(buildLoadRoomPixel(this.roomId), false);

			const messageOutput = response.pixelReturn[0]
				.output as PixelMessage[];
			const optionsOutput = response.pixelReturn[1].output as {
				OPTIONS?: O;
				ROOM_NAME?: string;
			};
			// read before the workspace merge below edits the nested objects
			const storedOptionsKey = optionsOutput.OPTIONS
				? getStoredOptionsKey(optionsOutput.OPTIONS)
				: null;

			this.insightId = response.insightId;
			this.onInsightBound({ isNew: isNew });

			const root = this.createRoot();
			const activeModelId =
				linkMessageTree(this, root, messageOutput) ??
				this.model?.engine_id;

			const newOptions = { ...optionsOutput.OPTIONS } as O;

			// A persisted harness keeps a reloaded agent room in agent mode.
			// Only promoted, never demoted: a new room's mode is set before
			// its options are saved.
			if (newOptions.harnessType) {
				this.setMode("agent");
			}
			this.root = root;

			if (this.mode === "agent") {
				void reconstructAllSubagents(this);
			}
			const tail = this.tail;
			if (tail instanceof ResponseMessageStore) {
				if (this.mode === "agent") {
					// an agent turn is driven server-side; reconnect so a
					// reload does not leave it, or a paused decision, unwatched
					reconnectAgentRun(tail);
				} else {
					tail.continueToolExecution();
				}
			}

			// The agent's default model only stands in for a room that has
			// never named a model of its own.
			let agentDefaultModelId = "";
			let agentGreeting = "";

			if (!newOptions.workspace?.workspace_id) {
				delete newOptions.workspace;
			} else {
				const workspaceResponse = await this.runRoomPixel<
					[RoomWorkspaceInfo]
				>(
					`GetWorkspace('${newOptions.workspace.workspace_id}')`,
					false,
				);
				const workspace = workspaceResponse.pixelReturn[0]
					.output as RoomWorkspaceInfo;

				const workspaceName =
					workspace?.display_name || workspace?.name;
				if (workspaceName && newOptions.workspace) {
					newOptions.workspace = {
						...newOptions.workspace,
						name: workspaceName,
					};
				}

				agentDefaultModelId = workspace?.config_json?.model_id ?? "";
				agentGreeting = workspace?.config_json?.greeting_enabled
					? (workspace?.config_json?.greeting ?? "")
					: "";

				if (workspace && Array.isArray(workspace.mcp)) {
					newOptions.mcp = mergeWorkspaceMcp(
						newOptions.mcp,
						workspace,
					);
					// the agent's prompt stands in for empty room instructions
					if (workspace.system_prompt && !newOptions.instructions) {
						newOptions.instructions = workspace.system_prompt;
					}
				}
			}

			const modelIdToLoad = activeModelId || agentDefaultModelId;
			if (modelIdToLoad && modelIdToLoad !== this.model?.engine_id) {
				const { pixelReturn } = await this.runRoomPixel<
					[ModelEngine[]]
				>(
					`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=['MODEL'], filterWord=${JSON.stringify(modelIdToLoad)})`,
					false,
				);
				const model = pixelReturn[0].output[0];
				if (model) {
					this.setModel(model);
				}
			}

			batchChanges(() => {
				this.setOptions(newOptions);
				this.storedOptionsKey = storedOptionsKey;
				this.agentGreeting = agentGreeting;
				// GetPlaygroundMessages does not carry the name
				if (optionsOutput.ROOM_NAME) {
					this.setMetadata({ name: optionsOutput.ROOM_NAME });
				}
			});
		} catch (e) {
			console.error(e);
			this.setIsLoading(false);
			throw new Error((e as Error).message || "Error initializing room");
		}
	};

	/**
	 * Read the room's options again and keep the agent's toolboxes already
	 * shown. Failures are logged, not thrown: it runs between turns.
	 */
	syncRoomOptions = async (): Promise<void> => {
		try {
			const response = await this.runRoomPixel<[{ OPTIONS?: O }]>(
				chatPixels.getRoomOptions(this.roomId),
				false,
				false,
			);
			const fetched = response.pixelReturn[0].output as { OPTIONS?: O };
			if (!fetched?.OPTIONS) {
				return;
			}

			const workspaceMcp = this.options.mcp.filter(
				(mcp) => mcp?.fromWorkspace,
			);
			const roomMcp = (fetched.OPTIONS.mcp ?? []).filter(
				(mcp) => !mcp?.fromWorkspace,
			);
			const workspaceIds = new Set(workspaceMcp.map((m) => m.id));

			batchChanges(() => {
				this.setOptions({
					...fetched.OPTIONS,
					mcp: [
						...workspaceMcp,
						...roomMcp.filter((m) => !workspaceIds.has(m.id)),
					],
				} as Partial<O>);
				this.storedOptionsKey = getStoredOptionsKey(
					fetched.OPTIONS ?? {},
				);
			});
		} catch (e) {
			console.warn("Failed to sync room options:", e);
		}
	};

	/**
	 * Save the room's options, unless the backend already holds them, and
	 * leave the room's loading state alone, since it runs ahead of the turn
	 * that uses them. The agent's and folder's toolboxes are left out; the
	 * room's scope token and the turn's context go in.
	 *
	 * @param options - The full set of options.
	 * @throws When the save fails.
	 */
	updateRoomOptions = async (options: O): Promise<void> => {
		try {
			const optionsToSave: Record<string, unknown> = {
				...(options as RoomEngineOptions),
				instructions: this.turnInstructions ?? options.instructions,
				modelId: this.model.engine_id,
				mcp: getStoredMcp(options.mcp),
			};
			if (this.config.roomScope) {
				optionsToSave.roomScope = this.config.roomScope.token;
			}

			const optionsKey = getStoredOptionsKey(optionsToSave);
			if (optionsKey !== this.storedOptionsKey) {
				await this.runRoomPixel(
					chatPixels.updateRoomOptions(this.roomId, optionsToSave),
					false,
				);
				this.storedOptionsKey = optionsKey;
			}

			this.setOptions(options);
		} catch (e) {
			throw new Error(
				(e as Error).message || "Error updating room options",
			);
		}
	};

	/**
	 * Record a tool call or result from a message, making the call's store
	 * the first time it is seen.
	 *
	 * @param toolId - The call's id.
	 * @param message - The message holding the part.
	 * @param part - The call or its result.
	 * @param options.placeholder - The part is the stub added while the call
	 * streams in.
	 */
	syncTool = (
		toolId: string,
		message: InputMessageStore | ResponseMessageStore,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
		options?: { placeholder?: boolean },
	): void => {
		let tool = this.tools[toolId];
		if (!tool) {
			tool = new ToolCallStore(this, toolId);
			this.tools = { ...this.tools, [toolId]: tool };
		}
		tool.syncMessage(message, part, options);
	};

	/**
	 * A tool call by id.
	 *
	 * @param toolId - The call's id.
	 * @returns The call, or null.
	 */
	getTool = (toolId: string): ToolCallStore => this.tools[toolId] || null;

	/**
	 * A spawned subagent's part, wherever it falls in the history; read live
	 * so a view of it follows its updates.
	 *
	 * @param subagentId - The subagent's id.
	 * @returns The part's subagent, or undefined.
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
	 * Whether a file goes to the model with the message. The host may limit
	 * this to some extensions; other files stay in the room for tools.
	 *
	 * @param fileName - The file's name.
	 * @returns True when the file is sent to the model.
	 */
	shouldAttachToModel = (fileName: string): boolean => {
		const allowed = this.config.allowedFileTypes;
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
	 * What a chat turn adds to its `paramValues`: the room's temperature when
	 * the host sends it, and the client tools.
	 *
	 * @returns The values.
	 */
	turnParamValues = (): Record<string, unknown> => ({
		...(this.config.sendTemperature &&
		this.options.temperature !== undefined
			? { temperature: this.options.temperature }
			: {}),
		...this.chatTools.chatParamValues,
	});

	/** The instructions the current turn runs with, turn context included. */
	get instructionsForTurn(): string {
		return this.turnInstructions ?? this.options.instructions ?? "";
	}

	/**
	 * An empty response for a turn to stream into, on the room's model.
	 *
	 * @returns The placeholder.
	 */
	createResponsePlaceholder = (): ResponseMessageStore =>
		new ResponseMessageStore(this, {
			io: "OUTPUT",
			messageId: STREAMING_PLACEHOLDER_ID,
			visible: true,
			platform_generated: true,
			modelId: this.model?.engine_id ?? "",
			modelType: "",
			dateCreated: new Date().toISOString(),
			parts: [],
			tokens: 0,
			ornaments: {
				modelName:
					this.model?.engine_display_name ||
					this.model?.engine_name ||
					"",
			},
			pruneToolsAbove: false,
		} as ResponsePixelMessage);

	/**
	 * Send a message: the user's bubble and a thinking placeholder show at
	 * once, while the options are saved and the files uploaded; then the turn
	 * runs. Files queued for the next message (`contextItems`) go with it and
	 * are put back when it cannot be sent.
	 *
	 * @param prompt - The user's message.
	 * @param files - Files to upload with it.
	 * @param askOptions.visible - Whether the user's bubble shows (default
	 * true); a silent kickoff turn still shows its reply.
	 * @throws `UploadError` when a file could not be read; any failure of the
	 * turn itself.
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
		this.error = null;

		const inputMessage = new InputMessageStore(this, {
			io: "INPUT",
			type: "INPUT_TEXT",
			messageId: "ASK_PLACEHOLDER_ID",
			visible: visible,
			platform_generated: true,
			modelId: this.model.engine_id,
			modelType: this.model.engine_type,
			dateCreated: new Date().toISOString(),
			parts: [{ type: "TEXT", text: prompt, uiText: prompt }],
			tokens: 0,
			ornaments: {
				modelName:
					this.model.engine_display_name || this.model.engine_name,
			},
			pruneToolsAbove: false,
		});

		// anchor to the latest real response, past any placeholder left by a
		// turn that failed mid-stream
		const parentMessage = this.latestResponseMessage ?? this.tail;
		if (parentMessage instanceof InputMessageStore) {
			throw new Error("Cannot respond to input messages");
		}

		const uploadPlaceholder = this.createResponsePlaceholder();
		batchChanges(() => {
			parentMessage.addChild(inputMessage);
			inputMessage.addChild(uploadPlaceholder);
			uploadPlaceholder.isThinking = true;
		});

		// files queued from the room's files go as they are; a silent turn
		// leaves them queued
		const queuedFiles = visible ? this.contextItems.take() : [];

		let mediaInputs: { fileName: string; fileLocation: string }[] = [];

		try {
			// the host's context for this turn joins the instructions
			const turnContext = await this.config.turnContext?.();
			this.turnInstructions = turnContext
				? withTurnContext(this.options.instructions, turnContext)
				: null;

			// save the settings this turn runs with, when they changed
			await this.updateRoomOptions(this.options);

			if (files.length > 0) {
				const response = await uploadInsight(this.insightId, "", files);
				const uploaded = response.data;
				// files sent but nothing back: most likely locked by another
				// program, such as a document open in an editor
				if (uploaded.length === 0) {
					throw createUploadError();
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

			inputMessage.appendParts(
				mediaInputs
					.filter((file) => this.shouldAttachToModel(file.fileName))
					.map((file): InputPixelMessage["parts"][number] => ({
						type: "MEDIA",
						mediaInfo: {
							base64Data: "",
							fileFormat: "",
							fileName: file.fileName,
							fileLocation: file.fileLocation,
							mediaInputType: "FILE",
							mimeType: "",
						},
					})),
			);
		} catch (e) {
			this.contextItems.restore(queuedFiles);
			batchChanges(() => {
				uploadPlaceholder.isThinking = false;
				parentMessage.removeChild(inputMessage);
				this.setIsLoading(false);
			});
			this.turnInstructions = null;

			// a request the browser could not complete: most likely a file
			// locked at the OS level
			if (e instanceof TypeError) {
				throw createUploadError();
			}
			throw e;
		}

		try {
			await parentMessage.runMessage(inputMessage, uploadPlaceholder);
		} catch (e) {
			// the message is withdrawn, so its queued files wait with it
			this.contextItems.restore(queuedFiles);
			throw e;
		} finally {
			this.turnInstructions = null;
		}
	};

	/**
	 * Resolve once nothing runs: no stream, and no tool call loading. A tool
	 * call that waits for the user does not hold it.
	 *
	 * @returns When the room is idle.
	 */
	waitForIdle = (): Promise<void> =>
		new Promise<void>((resolve) => {
			const isIdle = () =>
				!this.isLoading &&
				!this.streamJob.canCancel &&
				!Object.values(this.tools).some(
					(tool) => tool.status === "LOADING",
				) &&
				!this.history.some(
					(message) =>
						message instanceof ResponseMessageStore &&
						message.isSavingTools,
				);
			if (isIdle()) {
				resolve();
				return;
			}
			const unsubscribe = this.subscribe(() => {
				if (isIdle()) {
					unsubscribe();
					resolve();
				}
			});
		});

	/**
	 * Send a message and wait for the whole turn — its stream and every tool
	 * call that runs on its own — for a host with no view, such as a terminal
	 * agent. Calls that wait for the user are left waiting.
	 *
	 * @param prompt - The message.
	 * @param files - Files to send with it.
	 * @returns The text of the turn's last response.
	 * @throws When the turn fails.
	 */
	send = async (prompt: string, files: File[] = []): Promise<string> => {
		await this.askMessage(prompt, files);
		await this.waitForIdle();
		if (this.error) {
			throw this.error;
		}
		return this.latestResponseMessage.parts
			.filter((part) => part.type === "TEXT")
			.map((part) => part.text)
			.join("");
	};

	/**
	 * Save a tool call's result, when it has not finished yet.
	 *
	 * @param messageId - The response holding the call.
	 * @param toolId - The call.
	 * @param toolResponse - What it returned.
	 * @param toolStatus - How it ended.
	 * @param executedParameters - The arguments it ran with.
	 */
	processTool = async (
		messageId: string,
		toolId: string,
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled" = "success",
		executedParameters: Record<string, unknown> = {},
	): Promise<void> => {
		try {
			const message = this.getMessage(messageId);
			if (!(message instanceof ResponseMessageStore)) {
				return;
			}
			const tool = this.tools[toolId];
			if (
				!tool ||
				tool.status === "SUCCESS" ||
				tool.status === "CANCELLED" ||
				tool.status === "ERROR"
			) {
				return;
			}
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
	 * Run a pixel in the room's insight.
	 *
	 * @param pixel - The pixel.
	 * @param showLoading - Toggle the room's loading state around the run.
	 * @param setErrorOnFail - Show a thrown failure on the room.
	 * @param throwOnError - Throw when any statement fails (default). Pass
	 * false to read each statement's outcome instead.
	 * @returns The response.
	 */
	runRoomPixel = async <O2 extends [] | unknown[]>(
		pixel: string,
		showLoading = true,
		setErrorOnFail = true,
		throwOnError = true,
	): Promise<RoomPixelResponse<O2>> => {
		try {
			if (showLoading) {
				this.setIsLoading(true);
			}
			const response = await runPixel<O2>(pixel, this.insightId);
			if (throwOnError && response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			this.error = null;
			return response;
		} catch (e) {
			if (setErrorOnFail) {
				this.error = e as Error;
			}
			throw e;
		} finally {
			if (showLoading) {
				this.setIsLoading(false);
			}
		}
	};

	/**
	 * Run a pixel as a job in the room's insight and collect its console
	 * output while it runs, as a code block's Execute action does.
	 *
	 * @param pixel - The pixel.
	 * @param onConsole - Called with the logs so far after each poll.
	 * @param maxLogChars - Stop collecting after this many characters; 0 or
	 * undefined for no cap.
	 * @returns The job's errors, results and logs.
	 */
	runRoomPixelWithConsole = (
		pixel: string,
		onConsole?: (logs: string[]) => void,
		maxLogChars?: number,
	) => runPixelWithConsole(this.insightId, pixel, onConsole, maxLogChars);

	/**
	 * Run a pixel as a streaming job. Pass `onCancel` to make it stoppable
	 * with {@link cancelActiveJob}.
	 *
	 * @param pixel - The pixel.
	 * @param handlers - What to do with chunks, the result, and a stop.
	 * @param options - Loading, error and per-statement handling.
	 */
	runRoomPixelStreaming = <O2 extends unknown[] | []>(
		pixel: string,
		handlers: StreamHandlers<O2>,
		options?: StreamOptions,
	): Promise<void> => this.streamJob.run<O2>(pixel, handlers, options);

	/**
	 * Stop whatever the current turn is doing: a live stream first;
	 * otherwise, tool calls it waits on. Safe to call when there is nothing to
	 * stop.
	 */
	cancelActiveJob = async (): Promise<void> => {
		if (this.streamJob.canCancel) {
			await this.streamJob.stop();
			return;
		}

		const message = this.latestResponseMessage;
		if (message?.hasUnfinishedTools && !this.cancellingTools) {
			this.cancellingTools = true;
			try {
				await message.cancelPendingTools();
			} finally {
				this.cancellingTools = false;
			}
		}
	};

	/**
	 * Compact the conversation into its last response.
	 *
	 * @param strategy - Summarize, prune tool calls, or let the backend choose.
	 * @returns Whether anything was compacted.
	 * @throws When the last response made tool calls, or compaction failed.
	 */
	compactMessages = (
		strategy?: "TOOL_PRUNE" | "SUMMARY" | "AUTO",
	): Promise<"compacted" | "skipped"> => compactRoom(this, strategy);

	/**
	 * The conversation's root: an empty, invisible response on the room's
	 * model.
	 *
	 * @returns The root.
	 */
	private createRoot = (): ResponseMessageStore =>
		new ResponseMessageStore(this, {
			io: "OUTPUT",
			messageId: ROOT_PLACEHOLDER_ID,
			visible: false,
			platform_generated: true,
			modelId: this.model?.engine_id || "",
			dateCreated: new Date().toISOString(),
			parts: [],
			tokens: 0,
			ornaments: {
				modelName:
					this.model?.engine_display_name ||
					this.model?.engine_name ||
					"",
			},
			modelType: "",
			pruneToolsAbove: false,
		} as ResponsePixelMessage);
}

/**
 * The failure a message's files could not be read with, most likely because
 * another program holds them.
 *
 * @returns An error named `UploadError`.
 */
const createUploadError = (): Error => {
	const error = new Error("File is in use");
	error.name = "UploadError";
	return error;
};
