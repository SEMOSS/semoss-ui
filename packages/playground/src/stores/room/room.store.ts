import { createStore } from "zustand/vanilla";
import {
	getPixelAsyncResult,
	console as getPixelConsole,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
	uploadInsight,
} from "@semoss/sdk/react";
import { FlexLayout, type ThemeMap } from "@semoss/shared";
import { STREAMING_PLACEHOLDER_ID } from "@/constants";
import {
	type AbstractMessageStore,
	InputMessageStore,
	ResponseMessageStore,
	ToolStore,
} from "@/stores";
import type {
	Engine,
	InputPixelMessage,
	MCPConfig,
	PixelMessage,
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
	Prompt,
	ResponsePixelMessage,
	Workspace,
} from "@/types";

interface RoomOptions {
	instructions: string;
	mcp: MCPConfig[];
	workspace?: {
		workspace_id: string;
		name?: string;
	};
	predefinedPrompts: Prompt[];
	harnessType?: string;
}

export interface RoomStoreState {
	roomId: string;
	insightId: string;
	isLoading: boolean;
	error?: Error | null;
	mode: "agent" | "chat";
	metadata: { name: string; dateCreated: string };
	model: Engine;
	options: RoomOptions;
	sidebar: {
		isOpen: boolean;
		model: FlexLayout.Model;
		counter: number;
	};
	historyIds: string[];
}

const makeDefaultSidebar = () =>
	({
		isOpen: false,
		model: FlexLayout.Model.fromJson({
			global: {
				borderEnableTabScrollbar: true,
				tabSetEnableTabScrollbar: true,
			},
			borders: [],
			layout: { type: "row", weight: 0, children: [] },
		}),
		counter: 0,
	}) as RoomStoreState["sidebar"];

/**
 * Manage the room
 */
export class RoomStore {
	private _theme: ThemeMap["playground"];

	/** Non-reactive: message tree root */
	private _root: ResponseMessageStore | null = null;

	/** Non-reactive: tool instances keyed by tool id */
	private _tools: Record<string, ToolStore> = {};

	/** Fast message lookup by id */
	private _messageRegistry = new Map<string, AbstractMessageStore>();

	private _zustand = createStore<RoomStoreState>()(() => ({
		roomId: "",
		insightId: "new",
		isLoading: false,
		error: null,
		mode: "chat" as const,
		metadata: { name: "", dateCreated: "" },
		model: null as unknown as Engine,
		options: {
			instructions: "",
			mcp: [],
			predefinedPrompts: [],
		},
		sidebar: makeDefaultSidebar(),
		historyIds: [],
	}));

	/** Expose Zustand StoreApi for `useStore(room, selector)` */
	readonly getState = (): RoomStoreState => this._zustand.getState();
	readonly subscribe = (
		listener: (state: RoomStoreState, prev: RoomStoreState) => void,
	): (() => void) => this._zustand.subscribe(listener);
	readonly getInitialState = (): RoomStoreState =>
		this._zustand.getInitialState();

	private get _s() {
		return this._zustand.getState();
	}

	constructor(
		theme: ThemeMap["playground"],
		roomId: string,
		insightId: string = "new",
	) {
		this._theme = theme;
		this._zustand.setState({ roomId, insightId });

		this._s.sidebar.model.addChangeListener((action) => {
			this.tickSidebar(action);
		});
	}

	/** Getters */
	get roomId() {
		return this._s.roomId;
	}
	get insightId() {
		return this._s.insightId;
	}
	get theme() {
		return this._theme;
	}
	get isLoading() {
		return this._s.isLoading;
	}
	get error() {
		return this._s.error;
	}
	get mode() {
		return this._s.mode;
	}
	get metadata() {
		return this._s.metadata;
	}
	get model() {
		return this._s.model;
	}
	get options() {
		return this._s.options;
	}
	get sidebar() {
		return this._s.sidebar;
	}

	getMessage = (messageId: string): AbstractMessageStore | null => {
		const fromRegistry = this._messageRegistry.get(messageId);
		if (fromRegistry) return fromRegistry;
		// Fallback: BFS traversal
		if (!this._root) return null;
		const queue: AbstractMessageStore[] = [this._root];
		while (queue.length > 0) {
			const current = queue.shift();
			if (!current) continue;
			if (current.id === messageId) return current;
			queue.push(...current.children);
		}
		return null;
	};

	get history(): (InputMessageStore | ResponseMessageStore)[] {
		const historyIds = this._s.historyIds;
		return historyIds
			.map((id) => this.getMessage(id))
			.filter(
				(m): m is InputMessageStore | ResponseMessageStore =>
					m instanceof InputMessageStore ||
					m instanceof ResponseMessageStore,
			);
	}

	get tail() {
		const h = this.history;
		if (h.length > 0) return h[h.length - 1];
		return this._root as ResponseMessageStore;
	}

	get numberOfTools() {
		return Object.keys(this._tools).length;
	}

	get latestResponseMessage(): ResponseMessageStore {
		let msg: AbstractMessageStore | null = this.tail;
		while (msg) {
			if (
				msg instanceof ResponseMessageStore &&
				msg.id !== STREAMING_PLACEHOLDER_ID
			) {
				return msg;
			}
			msg = msg.parent;
		}
		return null as unknown as ResponseMessageStore;
	}

	get tokensUsed() {
		let currMessage: AbstractMessageStore | null = this.tail;
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

	get totalTokensConsumed(): number {
		let total = 0;
		for (const message of this.history) {
			if (message.tokens) total += message.tokens;
		}
		return total;
	}

	/** Setters */
	setMode = (mode: "agent" | "chat") => {
		this._zustand.setState({ mode });
	};

	setModel = (model: Engine) => {
		this._zustand.setState({ model });
	};

	setOptions = (options: Partial<RoomOptions>) => {
		this._zustand.setState((s) => ({
			options: { ...s.options, ...options },
		}));
	};

	setMetadata = (metadata: Partial<RoomStoreState["metadata"]>) => {
		this._zustand.setState((s) => ({
			metadata: { ...s.metadata, ...metadata },
		}));
	};

	/** Tree change notifications */
	notifyHistoryChange = () => {
		this._zustand.setState({ historyIds: this._computeHistoryIds() });
	};

	private _computeHistoryIds(): string[] {
		if (!this._root) return [];
		const ids: string[] = [];
		let current: AbstractMessageStore | null = this._root;
		while (current) {
			const activeChild = current.activeChild;
			if (activeChild) {
				if (
					activeChild instanceof InputMessageStore ||
					activeChild instanceof ResponseMessageStore
				) {
					ids.push(activeChild.id);
				}
			}
			current = activeChild;
		}
		return ids;
	}

	registerMessage = (message: AbstractMessageStore) => {
		this._messageRegistry.set(message.id, message);
	};

	updateMessageId = (
		oldId: string,
		newId: string,
		message: AbstractMessageStore,
	) => {
		this._messageRegistry.delete(oldId);
		this._messageRegistry.set(newId, message);
		// Recompute historyIds in case id was in there
		this._zustand.setState({ historyIds: this._computeHistoryIds() });
	};

	/** Actions */
	initialize = async () => {
		try {
			const response = await this.runRoomPixel<
				[PixelMessage[], { OPTIONS?: RoomOptions }]
			>(
				`GetPlaygroundMessages(roomId=["${this._s.roomId}"]); GetRoomOptions(roomId=${JSON.stringify(this._s.roomId)}); SetRoomForInsight(roomId=${JSON.stringify(this._s.roomId)});`,
				false,
			);

			const messageOutput = response.pixelReturn[0]
				.output as PixelMessage[];
			const optionsOutput = response.pixelReturn[1].output as {
				OPTIONS?: RoomOptions;
				ROOM_NAME?: string;
			};

			this._zustand.setState({ insightId: response.insightId });

			const root = new ResponseMessageStore(this, {
				io: "OUTPUT",
				messageId: "ROOT_PLACEHOLDER_ID",
				visible: false,
				platform_generated: true,
				modelId: this._s.model?.engine_id || "",
				dateCreated: new Date().toISOString(),
				parts: [],
				tokens: 0,
				ornaments: {
					modelName:
						this._s.model?.engine_display_name ||
						this._s.model?.engine_name ||
						"",
				},
				modelType: "",
				pruneToolsAbove: false,
			} as ResponsePixelMessage);
			this._messageRegistry.set(root.id, root);

			const messages: Record<
				string,
				{
					parentMessageId: string;
					summaryLeafMessageId: string;
					message: InputMessageStore | ResponseMessageStore;
				}
			> = {};

			let activeModelId = this._s.model?.engine_id;

			for (const pixelMessage of messageOutput) {
				if (pixelMessage.io === "INPUT") {
					activeModelId = pixelMessage.modelId;
				}
				const message = this._createMessage(pixelMessage);
				messages[message.id] = {
					parentMessageId: pixelMessage.parentMessageId || "",
					summaryLeafMessageId:
						pixelMessage.summaryLeafMessageId || "",
					message,
				};
				this._messageRegistry.set(message.id, message);
			}

			for (const mId in messages) {
				const m = messages[mId];
				const parent = messages[m.parentMessageId];
				if (parent) {
					parent.message.addChild(m.message);
				} else {
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

			const newOptions = { ...optionsOutput.OPTIONS };

			if (!newOptions.workspace?.workspace_id) {
				delete newOptions.workspace;
			} else {
				const workspaceResponse = await this.runRoomPixel<
					[Workspace[]]
				>(`GetWorkspace('${newOptions.workspace?.workspace_id}')`);

				const workspaceOutput = workspaceResponse.pixelReturn[0]
					.output as unknown as Workspace;

				if (workspaceOutput?.name && newOptions.workspace) {
					newOptions.workspace.name = workspaceOutput.name;
				}

				if (
					workspaceOutput?.mcp &&
					Array.isArray(workspaceOutput.mcp)
				) {
					const existingMCPs = new Map<string, MCPConfig>();
					for (const mcp of newOptions.mcp || []) {
						existingMCPs.set(`${mcp.id}-${mcp.type}`, mcp);
					}
					const workspaceMCPs = workspaceOutput.mcp.map((mcp) => ({
						...mcp,
						fromWorkspace: true,
					}));
					newOptions.mcp = [
						...workspaceMCPs,
						...Array.from(existingMCPs.values()).filter(
							(a) => !workspaceMCPs.some((b) => b.id === a.id),
						),
					];

					if (
						workspaceOutput.system_prompt &&
						!newOptions.instructions
					) {
						newOptions.instructions = workspaceOutput.system_prompt;
					}
				}
			}

			if (activeModelId) {
				const { pixelReturn } = await this.runRoomPixel<[Engine[]]>(
					`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=['MODEL'], filterWord=${JSON.stringify(activeModelId)})`,
				);
				this.setModel(pixelReturn[0].output[0]);
			}

			this.setOptions(newOptions as RoomOptions);

			if (optionsOutput.ROOM_NAME) {
				this.setMetadata({ name: optionsOutput.ROOM_NAME });
			}

			if (newOptions.harnessType) {
				this.setMode("agent");
			}

			this._root = root;
			this.notifyHistoryChange();

			if (this.tail.type === "OUTPUT") {
				(this.tail as ResponseMessageStore).continueToolExecution();
			}
		} catch (e) {
			console.error(e);
			this.setIsLoading(false);
			throw new Error((e as Error).message || "Error initializing room");
		}
	};

	private _createMessage(
		pixelMessage: PixelMessage,
	): InputMessageStore | ResponseMessageStore {
		if (pixelMessage.io === "INPUT") {
			return new InputMessageStore(
				this,
				pixelMessage as InputPixelMessage,
			);
		} else if (pixelMessage.io === "OUTPUT") {
			return new ResponseMessageStore(
				this,
				pixelMessage as ResponsePixelMessage,
			);
		}
		throw new Error(`Unknown message type: ${pixelMessage}`);
	}

	syncRoomOptions = async (): Promise<void> => {
		try {
			const response = await this.runRoomPixel<
				[{ OPTIONS?: RoomOptions }]
			>(
				`GetRoomOptions(roomId=${JSON.stringify(this._s.roomId)});`,
				false,
				false,
			);

			const fetched = response.pixelReturn[0].output as {
				OPTIONS?: RoomOptions;
			};

			if (!fetched?.OPTIONS) return;

			const workspaceMCPs = this._s.options.mcp.filter(
				(mcp) => mcp?.fromWorkspace,
			);
			const freshRoomMCPs = (fetched.OPTIONS.mcp ?? []).filter(
				(mcp) => !mcp?.fromWorkspace,
			);
			const workspaceIds = new Set(workspaceMCPs.map((m) => m.id));
			const merged = [
				...workspaceMCPs,
				...freshRoomMCPs.filter((m) => !workspaceIds.has(m.id)),
			];

			this.setOptions({ ...fetched.OPTIONS, mcp: merged });
		} catch (e) {
			console.warn("Failed to sync room options:", e);
		}
	};

	updateRoomOptions = async (options: RoomOptions) => {
		try {
			const optionsToSave = {
				...options,
				modelId: this._s.model.engine_id,
				mcp: options.mcp.filter(
					(mcp) => !mcp?.fromWorkspace && !mcp?.fromRoom,
				),
			};
			await this.runRoomPixel(
				`UpdateRoomOptions(roomId=${JSON.stringify(this._s.roomId)}, roomOptions=[${JSON.stringify(optionsToSave)}]);`,
			);
			this.setOptions(options);
		} catch (e) {
			throw new Error(
				(e as Error).message || "Error updating room options",
			);
		}
	};

	/** Tools */
	syncTool = (
		toolId: string,
		message: InputMessageStore | ResponseMessageStore,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
	) => {
		let tool = this._tools[toolId];
		if (!tool) {
			tool = new ToolStore(this, toolId);
			this._tools[tool.id] = tool;
		}
		tool.syncMessage(message, part);
	};

	getTool = (toolId: string): ToolStore => {
		return this._tools[toolId] || null;
	};

	getToolByNodeId = (nodeId: string): ToolStore => {
		if (!nodeId.startsWith("tool--")) return null as unknown as ToolStore;
		const toolId = nodeId.replace("tool--", "");
		return this._tools[toolId] || null;
	};

	/** Sidebar */
	isSidebarNodeSelected = (nodeId: string): boolean => {
		const { sidebar } = this._s;
		if (!sidebar.isOpen) return false;
		let isSelected = false;
		sidebar.model.visitNodes((node) => {
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

	addSidebarNode = (
		nodeId: string,
		options: Record<string, unknown>,
	): void => {
		this._zustand.setState((s) => ({
			sidebar: { ...s.sidebar, isOpen: true },
		}));

		const { sidebar } = this._s;
		const selectedNode = sidebar.model.getNodeById(nodeId);
		if (selectedNode) {
			sidebar.model.doAction(
				FlexLayout.Actions.selectTab(selectedNode.getId()),
			);
			return;
		}

		const addId =
			sidebar.model.getActiveTabset()?.getId() ||
			sidebar.model.getRoot().getChildren()[0]?.getId() ||
			"";

		sidebar.model.doAction(
			FlexLayout.Actions.addNode(
				{ ...options, id: nodeId },
				addId,
				FlexLayout.DockLocation.CENTER,
				-1,
				true,
			),
		);
	};

	removeSidebarNode = (nodeId: string): void => {
		this._s.sidebar.model.doAction(FlexLayout.Actions.deleteTab(nodeId));
	};

	closeSidebar = async (): Promise<void> => {
		this._zustand.setState((s) => ({
			sidebar: { ...s.sidebar, isOpen: false },
		}));
	};

	tickSidebar = async (action: FlexLayout.Action): Promise<void> => {
		this._zustand.setState((s) => ({
			sidebar: { ...s.sidebar, counter: s.sidebar.counter + 1 },
		}));

		if (action.type === FlexLayout.Actions.DELETE_TAB) {
			const tool = this.getToolByNodeId(action.data.node);
			if (tool) tool.setIsOpen(false);
		}

		let hasTabs = false;
		this._s.sidebar.model.visitNodes((node) => {
			if (node.getType() === "tab") hasTabs = true;
		});

		if (!hasTabs) this.closeSidebar();
	};

	/** Helpers */
	private setIsLoading = (isLoading: boolean): void => {
		this._zustand.setState({ isLoading });
	};

	askMessage = async (prompt: string, files: File[] = []): Promise<void> => {
		if (!this.model) throw new Error("Model is required");
		if (!prompt) throw new Error("Prompt is required");

		this.setIsLoading(true);

		const inputMessage = new InputMessageStore(this, {
			io: "INPUT",
			type: "INPUT_TEXT",
			messageId: "ASK_PLACEHOLDER_ID",
			visible: true,
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
		uploadPlaceholder.isThinking = true;

		let mediaInputs: { fileName: string; fileLocation: string }[] = [];

		try {
			if (files.length > 0) {
				const response = await uploadInsight(
					this._s.insightId,
					"",
					files,
				);
				const uploaded = response.data;

				const normalizeExt = (value: string) =>
					value.trim().toLowerCase().replace(/^\./, "");

				mediaInputs = uploaded.filter((f) => {
					const allowed = this._theme.allowedFileTypes;
					if (!allowed || allowed.length === 0) return true;
					const allowedSet = new Set(allowed.map(normalizeExt));
					const rawExt = f.fileName.split(".").pop() ?? "";
					const ext = normalizeExt(rawExt);
					if (!ext) return false;
					return allowedSet.has(ext);
				});

				const currentParts = inputMessage.parts;
				inputMessage._setState({
					parts: [
						...currentParts,
						...mediaInputs.map((file) => ({
							type: "MEDIA" as const,
							mediaInfo: {
								base64Data: "",
								fileFormat: "",
								fileName: file.fileName,
								fileLocation: file.fileLocation,
								mediaInputType: "FILE" as const,
								mimeType: "",
							},
						})),
					],
				});
			}
		} catch (e) {
			uploadPlaceholder.isThinking = false;
			parentMessage.removeChild(inputMessage);
			throw e;
		}

		await parentMessage.runMessage(inputMessage, uploadPlaceholder);
	};

	processTool = async (
		messageId: string,
		toolId: string,
		toolResponse: string,
		toolStatus: "success" | "error" | "cancelled" | "paused" = "success",
		executedParameters: Record<string, unknown>,
	): Promise<void> => {
		try {
			const message = this.getMessage(messageId);
			if (!message || !(message instanceof ResponseMessageStore)) return;

			const tool = this._tools[toolId];
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
			if (showLoading) this.setIsLoading(true);
			const response = await runPixel<O>(pixel, this._s.insightId);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			this._zustand.setState({ error: null });
			return response;
		} catch (e) {
			if (setErrorOnFail) {
				this._zustand.setState({ error: e as Error });
			}
			throw e;
		} finally {
			if (showLoading) this.setIsLoading(false);
		}
	};

	runRoomPixelWithConsole = async (
		pixel: string,
		onConsole?: (logs: string[]) => void,
		maxLogChars?: number,
	) => {
		const { jobId } = await runPixelAsync(pixel, this._s.insightId);
		if (!jobId) throw new Error("No job id returned for pixel execution");

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

		try {
			const { message } = await getPixelConsole(jobId);
			if (message?.length) {
				appendLogs(message);
				onConsole?.(logs.slice());
			}
		} catch {
			/* ignore */
		}

		const { errors, results } = await getPixelAsyncResult(jobId);
		return { errors, results, logs };
	};

	runRoomPixelStreaming = async <O extends unknown[] | []>(
		pixel: string,
		onPoll: (
			message: Awaited<
				ReturnType<typeof getPixelJobStreaming>
			>["message"][number],
		) => void,
		showLoading: boolean = true,
		setErrorOnFail: boolean = true,
	) => {
		try {
			if (showLoading) this.setIsLoading(true);

			const { jobId } = await runPixelAsync(pixel, this._s.insightId);
			if (!jobId)
				throw new Error("No job ID returned from pixel execution");

			let isPolling = true;
			const pollingInterval = 500;

			while (isPolling) {
				try {
					const response = await getPixelJobStreaming(jobId);
					if (response?.message.length > 0) {
						for (const message of response.message) {
							onPoll(message);
						}
					}
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

			const result = await getPixelAsyncResult<O>(jobId);
			if (result.errors.length > 0)
				throw new Error(result.errors.join(""));
			return result;
		} catch (e) {
			console.error(e);
			if (setErrorOnFail) this._zustand.setState({ error: e as Error });
			throw e;
		} finally {
			if (showLoading) this.setIsLoading(false);
		}
	};

	compactMessages = async () => {
		let cur: AbstractMessageStore | null = this.tail;
		while (cur !== null) {
			if (cur instanceof ResponseMessageStore) break;
			cur = cur.parent;
		}
		if (!cur) throw new Error();

		const curResponse = cur as ResponseMessageStore;
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
			const response = await this.runRoomPixel<
				(SummaryResponse | ToolPruneResponse)[][]
			>(
				`CompactRoomMessages(roomId=${JSON.stringify(this.roomId)}, parentMessageId=${JSON.stringify(cur.id)});`,
				true,
			);

			const { output } = response.pixelReturn[0];
			if (!response || response.errors.length || !output)
				throw new Error();
			if (output.length === 0) return "skipped" as const;

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

			if (!success) throw new Error();
			return "compacted" as const;
		} finally {
			curResponse.setIsCompacting(false);
		}
	};
}
