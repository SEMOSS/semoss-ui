import { getI18n } from "@semoss/i18n";
import {
	getModelContextWindow,
	pinUserRoom,
	removeUserRoom,
	renameUserRoom,
	throwOnPixelErrors,
} from "@semoss/sdk";
import { download, runPixel, Session } from "@semoss/sdk/react";
import {
	type AgentFormValues,
	agentNeedsFollowUpEdit,
	buildAddWorkspacePixel,
	buildEditWorkspacePixel,
	getWorkspaceSaveWarning,
	type ThemeMap,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { StoreState } from "@semoss/utility/store";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import type {
	AbstractPixelMessage,
	Engine,
	MCPConfig,
	PixelMessageTextPart,
	PixelMessageToolCallPart,
	Workspace,
} from "../../types";
import {
	type NewChatBuildDefaults,
	readDeploymentNewChatDefaults,
	readNewChatPreferences,
	resolveNewChatModel,
} from "../new-chat-preferences/new-chat-preferences";
import { RoomStore } from "../room/room.store";

/**
 * Shape of a room row as rendered in the nav list. Matches the columns
 * returned by GetPlaygroundRooms so optimistic rooms can be merged into the
 * fetched list seamlessly.
 */
interface OptimisticRoom {
	/** The room's id. */
	ROOM_ID: string;
	/** The name the nav shows: the start of the first prompt. */
	ROOM_NAME: string;
	/** When the room was created, as an ISO string. */
	DATE_CREATED: string;
	/** The agent the room runs, if any. */
	WORKSPACE_ID?: string;
	/** Whether the room is pinned. */
	PINNED?: boolean;
}

/** What the chat holds. Every field is readonly. */
export interface ChatSnapshot {
	/** Whether `initialize` has finished, whether or not it succeeded. */
	readonly isInitialized: boolean;

	/** The session's selected model and the models the user can pick from. */
	readonly models: {
		/** The current model */
		selected: Engine;

		/** The current context window */
		contextWindow?: number;

		/** All available models fetched from the backend */
		available: Engine[];
	};

	/** The rooms opened this session, by id. The chat owns each one. */
	readonly rooms: Record<string, RoomStore>;

	/**
	 * Rooms shown in the nav before their first message has persisted.
	 * GetPlaygroundRooms only returns rooms that already have a message with
	 * data, so a freshly created room is invisible to the refetch until its
	 * first response lands. These bridge that gap and are removed once the
	 * real room shows up in the fetched list. Keyed by room id.
	 */
	readonly optimisticRooms: Record<string, OptimisticRoom>;

	/** Keys that room lists watch to know when to refetch. */
	readonly keys: {
		/** Goes up whenever a room is created, renamed, pinned, or removed. */
		roomCounter: number;
	};

	/** The theme's sidebar items that embed a page, by their path. */
	readonly embeddedPageMap: Record<
		string,
		| ThemeMap["playground"]["sidebar"]["headerItems"][number]
		| ThemeMap["playground"]["sidebar"]["footerItems"][number]
	>;
}

/**
 * The session's chat: its models, the rooms it has opened, the rooms shown
 * before their first message persists, and the pixels that create, rename,
 * pin, download, and remove rooms and agents. One per session, made by
 * `useCreateChatStore`; it owns every `RoomStore` it caches.
 */
export class ChatStore {
	/** The deployment's theme, with every default filled in. */
	private _theme: ThemeMap["playground"];
	/** The Workspace blueprints each room is built with. */
	private _panelComponents: Record<string, WorkbenchPanelConfigAny>;
	/** The build's new-chat defaults. */
	private _build: NewChatBuildDefaults;
	/** The chat's state. Only the store's own actions write it. */
	private readonly state: StoreState<ChatSnapshot>;

	/**
	 * @param theme - The deployment's theme.
	 * @param panelComponents - The Workspace blueprints every room it creates
	 * is built with. Passed in rather than imported: they import the chat's
	 * components, which import its stores, so importing them here would close
	 * a module cycle.
	 * @param build - The build's new-chat defaults, read from its env by the
	 * host.
	 */
	constructor(
		theme: ThemeMap["playground"],
		panelComponents: Record<string, WorkbenchPanelConfigAny>,
		build: NewChatBuildDefaults = {},
	) {
		this._theme = theme;
		this._build = build;
		this._panelComponents = panelComponents;
		// Only items that embed a page are kept, so a path lookup finds them.
		const embeddedPageMap = [
			...theme.sidebar.headerItems,
			...theme.sidebar.footerItems,
		]
			.filter((item) => item.embed && item.url)
			.reduce(
				(acc, item) => {
					acc[item.path] = item;
					return acc;
				},
				{} as Record<
					string,
					| ThemeMap["playground"]["sidebar"]["headerItems"][number]
					| ThemeMap["playground"]["sidebar"]["footerItems"][number]
				>,
			);

		this.state = new StoreState<ChatSnapshot>({
			isInitialized: false,
			models: {
				selected: null as unknown as Engine,
				contextWindow: undefined,
				available: [],
			},
			rooms: {},
			optimisticRooms: {},
			keys: { roomCounter: 0 },
			embeddedPageMap,
		});
	}

	/** @returns The current snapshot, for `useStoreSelector`. */
	getSnapshot = (): ChatSnapshot => this.snapshot;

	/**
	 * Listen for any change to the chat.
	 *
	 * @param listener - Called after each change.
	 * @returns A function that stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The current snapshot. */
	private get snapshot(): ChatSnapshot {
		return this.state.getSnapshot();
	}

	/**
	 * Cache a room, or drop it with null.
	 *
	 * @param roomId - The room's id.
	 * @param room - The room, or null.
	 */
	private setCachedRoom = (roomId: string, room: RoomStore | null): void => {
		this.state.update((current) => {
			const { [roomId]: _dropped, ...rest } = current.rooms;
			return { rooms: room ? { ...rest, [roomId]: room } : rest };
		});
	};

	/** Make every room list refetch, after a change the list cannot see. */
	refreshRoomLists = (): void => {
		this.state.update((current) => ({
			keys: { roomCounter: current.keys.roomCounter + 1 },
		}));
	};

	/**
	 * Change some of the models' fields.
	 *
	 * @param changes - The fields to change.
	 */
	private updateModels = (changes: Partial<ChatSnapshot["models"]>): void => {
		this.state.update((current) => ({
			models: { ...current.models, ...changes },
		}));
	};

	// Getters

	/** Whether `initialize` has finished. */
	get isInitialized() {
		return this.snapshot.isInitialized;
	}

	/** The selected model, its context window, and the models available. */
	get models() {
		return this.snapshot.models;
	}

	/** Keys room lists watch to refetch, such as `roomCounter`. */
	get keys() {
		return this.snapshot.keys;
	}

	/** The theme's embedded pages, by path. */
	get embeddedPageMap() {
		return this.snapshot.embeddedPageMap;
	}

	/** The rooms shown in the nav before their first message persists. */
	get optimisticRooms() {
		return this.snapshot.optimisticRooms;
	}

	/**
	 * Read the session's models and select the one a new chat starts with.
	 * A failure is logged, and the chat still counts as initialized.
	 */
	initialize = async (): Promise<void> => {
		try {
			// the user, and their default model, come from the session
			await this.getDefaultModel();
		} catch (e) {
			console.error(e);
		} finally {
			this.state.update({ isInitialized: true });
		}
	};

	/**
	 * Register a pre-created RoomStore in the local cache so it is
	 * discoverable by loadRoom after navigation.  Used by consumers that
	 * need a real insight before the first message is sent (e.g. the
	 * file-explorer on the new-room page).
	 *
	 * @param room - The room to cache.
	 */
	registerRoom = (room: RoomStore): void => {
		this.setCachedRoom(room.roomId, room);
	};

	/**
	 * A room already held in the local cache, without loading it — so a page
	 * can show a room it was just handed without waiting a render.
	 *
	 * @param roomId - The room to look up.
	 * @returns The cached room, or null when it is not cached.
	 */
	getCachedRoom = (roomId: string): RoomStore | null =>
		this.snapshot.rooms[roomId] ?? null;

	/**
	 * Optimistically surface a room in the nav before its first message has
	 * persisted. Shown until the real room is returned by GetPlaygroundRooms
	 * (see {@link removeOptimisticRoom}).
	 *
	 * @param room - The row to show.
	 */
	addOptimisticRoom = (room: OptimisticRoom): void => {
		this.state.update((current) => ({
			optimisticRooms: {
				...current.optimisticRooms,
				[room.ROOM_ID]: room,
			},
		}));
	};

	/**
	 * Drop an optimistic room, once the real room has been fetched or its
	 * first message failed to send.
	 *
	 * @param roomId - The optimistic room's id.
	 */
	removeOptimisticRoom = (roomId: string): void => {
		this.state.update((current) => {
			const { [roomId]: _removed, ...optimisticRooms } =
				current.optimisticRooms;
			return { optimisticRooms };
		});
	};

	/**
	 * Creates a room via CreatePlaygroundRoom and brings it to model/mode/name
	 * ready state, without options, a message, or surfacing it anywhere.
	 * Callers sequence initialize()/updateRoomOptions() themselves.
	 *
	 * @param mode - Whether the room runs as an agent or a chat.
	 * @param name - The room's name.
	 * @param workspaceId - The agent the room runs, if any.
	 * @returns The new room's store.
	 * @throws When CreatePlaygroundRoom reports an error.
	 */
	private createRoomShell = async (
		mode: "agent" | "chat",
		name: string,
		workspaceId?: string,
	): Promise<RoomStore> => {
		const { errors, pixelReturn, insightId } = await runPixel<
			[
				{
					roomId: string;
				},
			]
		>(
			`CreatePlaygroundRoom(${workspaceId ? `workspaceId=${JSON.stringify(workspaceId)}` : ""})`,
			"new",
		);

		if (errors.length > 0) {
			throw new Error(errors.join(""));
		}

		const roomId = pixelReturn[0].output.roomId;

		const room = new RoomStore({
			theme: this._theme,
			roomId,
			insightId,
			panelComponents: this._panelComponents,
		});

		room.setModel(this.models.selected);
		room.setMode(mode);
		room.setMetadata({ name });

		return room;
	};

	/**
	 * Create a room, cache it, show it in the nav, and send its first message
	 * without waiting for the reply.
	 *
	 * @param mode - Whether the room runs as an agent or a chat.
	 * @param prompt - The first message; its start names the room.
	 * @param files - Files sent with the first message.
	 * @param options - The room's options, saved before the first message.
	 * @param workspaceId - The agent the room runs, if any.
	 * @param askOptions - Options for the first message, such as whether it
	 * shows in the conversation.
	 * @param prepareRoom - Runs once the room exists and before its first
	 * message, for setup the message depends on, such as the connectors the
	 * new-chat page drafted.
	 * @returns The new room, once its first message has started.
	 */
	createRoom = async (
		mode: "agent" | "chat",
		prompt: string,
		files: File[],
		options: RoomStore["options"],
		workspaceId?: string,
		askOptions?: { visible?: boolean },
		prepareRoom?: (room: RoomStore) => Promise<void>,
	): Promise<RoomStore> => {
		const room = await this.createRoomShell(
			mode,
			prompt.substring(0, 15),
			workspaceId,
		);
		// Order matters: see the harnessType comment in RoomStore.initialize().
		await room.initialize({ isNew: true });
		await room.updateRoomOptions(options);
		await prepareRoom?.(room);
		const roomId = room.roomId;

		this.setCachedRoom(roomId, room);

		// optimistically surface the room in the nav — GetPlaygroundRooms
		// won't return it until its first message has data
		this.addOptimisticRoom({
			ROOM_ID: roomId,
			ROOM_NAME: prompt.substring(0, 100),
			DATE_CREATED: new Date().toISOString(),
			WORKSPACE_ID: workspaceId,
		});

		this.refreshRoomLists();

		// ask the room — fire-and-forget so we return (and navigate) without
		// waiting on the response
		(async () => {
			try {
				await room.askMessage(prompt, files, askOptions);
				// the room now has data, so the lists can fetch it
				this.refreshRoomLists();
			} catch (e) {
				if ((e as Error)?.name === "UploadError") {
					// Leave the optimistic room so the user can retry with a new message.
					toast.error(getI18n().t("room:errors.fileInUse"));
				} else {
					// Any other error means the room has no data; drop it.
					this.removeOptimisticRoom(roomId);
				}
			}
		})();

		return room;
	};

	/**
	 * Create a room with no first message — e.g. so an agent's scripted
	 * greeting can render immediately on selection. Registered in the local
	 * cache so loadRoom finds it after navigation, but not surfaced in the
	 * nav until a real message lands.
	 *
	 * @param mode - Whether the room runs as an agent or a chat.
	 * @param name - The room's name.
	 * @param options - The room's options.
	 * @param workspaceId - The agent the room runs, if any.
	 * @param prepareRoom - Runs once the room is initialized.
	 * @returns The new room.
	 */
	createEmptyRoom = async (
		mode: "agent" | "chat",
		name: string,
		options: RoomStore["options"],
		workspaceId?: string,
		prepareRoom?: (room: RoomStore) => Promise<void>,
	): Promise<RoomStore> => {
		const room = await this.createRoomShell(mode, name, workspaceId);
		// Reversed vs createRoom: the workspace must be persisted before
		// initialize() reads it back to derive agentGreeting.
		await room.updateRoomOptions(options);
		await room.initialize({ isNew: true });
		await prepareRoom?.(room);
		this.registerRoom(room);
		return room;
	};

	/**
	 * Delete a room and its messages on the server, drop its insight, and
	 * remove it from the cache.
	 *
	 * @param roomId - The room to delete.
	 */
	closeRoom = async (roomId: string): Promise<void> => {
		const room = this.snapshot.rooms[roomId];
		const insightId = room?.insightId;

		await Session.insight.withInsight((id) => removeUserRoom(id, roomId));

		// only drop if the room was opened and has a real insightId
		if (insightId && insightId !== "new") {
			try {
				await runPixel<[Record<string, unknown>]>(
					"DropInsight()",
					insightId,
				);
			} catch (e) {
				console.warn(e);
			}
		}

		room?.dispose();
		this.setCachedRoom(roomId, null);
		this.refreshRoomLists();
	};

	/**
	 * Rename a room. Runs the RenameRoom pixel, updates the cached
	 * room's metadata, and bumps the roomCounter so any room lists
	 * elsewhere in the app (sidebar, chats page, per-agent timeline)
	 * refetch and stay in sync.
	 *
	 * @param roomId - The room to rename.
	 * @param name - The new name; it is trimmed.
	 * @throws When the trimmed name is empty, or the pixel fails.
	 */
	renameRoom = async (roomId: string, name: string): Promise<void> => {
		const trimmed = name.trim();
		if (!trimmed) {
			throw new Error(getI18n().t("sidebar:toasts.roomNameEmpty"));
		}
		await Session.insight.withInsight((id) =>
			renameUserRoom(id, roomId, trimmed),
		);
		const cached = this.snapshot.rooms[roomId];
		if (cached) {
			cached.setMetadata({ name: trimmed });
		}
		this.refreshRoomLists();
	};

	/**
	 * Pin or unpin a room. Runs the PinRoom pixel and bumps the
	 * roomCounter so any room lists elsewhere in the app (sidebar,
	 * chats page, per-agent timeline) refetch and stay in sync.
	 *
	 * @param roomId - The room to pin or unpin.
	 * @param pinned - Whether it should be pinned.
	 */
	pinRoom = async (roomId: string, pinned: boolean): Promise<void> => {
		await Session.insight.withInsight((id) =>
			pinUserRoom(id, roomId, pinned),
		);
		this.refreshRoomLists();
	};

	/**
	 * Download a room's conversation as a Word or PDF file: each message's
	 * text, its time, and the tools a reply used, as markdown the server
	 * converts.
	 *
	 * @param roomId - The room to download.
	 * @param format - The file's format.
	 * @throws When the messages cannot be read, there is nothing to download,
	 * or the server does not return a file.
	 */
	downloadConversation = async (
		roomId: string,
		format: "word" | "pdf",
	): Promise<void> => {
		const messagesResponse = await runPixel<[AbstractPixelMessage[]]>(
			`GetPlaygroundMessages(roomId=["${roomId}"]);`,
			"new",
		);

		if (!messagesResponse?.pixelReturn?.[0]?.output) {
			throw new Error("Failed to fetch conversation messages");
		}

		const messageOutput: AbstractPixelMessage[] =
			messagesResponse.pixelReturn[0].output;

		const formattedMessages = messageOutput
			.map((message: AbstractPixelMessage) => {
				const timestamp = message.dateCreated
					? parseTimestampWithUtcDefault(message.dateCreated).format(
							"MMM D, YYYY h:mm A",
						)
					: null;
				const ts = timestamp ? `\n*${timestamp}*` : "";

				if (message.io === "INPUT") {
					const text = message.parts
						?.filter(
							(p): p is PixelMessageTextPart =>
								p?.type === "TEXT",
						)
						.map((p) => p.text)
						.join("");
					return text ? `**You:**${ts}\n\n${text}` : null;
				}
				if (message.io === "OUTPUT") {
					const text = message.parts
						?.filter(
							(p): p is PixelMessageTextPart =>
								p?.type === "TEXT",
						)
						.map((p) => p.text)
						.join("");
					const tools: string[] =
						message.parts
							?.filter(
								(p): p is PixelMessageToolCallPart =>
									p?.type === "TOOL_CALL",
							)
							.map((p) => p.toolCall.title || p.toolCall.name)
							.filter(Boolean) ?? [];
					const toolLine =
						tools.length > 0
							? `\n\n*Tools used: ${tools.join(", ")}*`
							: "";
					return text || tools.length > 0
						? `**Assistant:**${ts}\n\n${text}${toolLine}`
						: null;
				}
				return null;
			})
			.filter(Boolean)
			.join("\n\n---\n\n");

		if (!formattedMessages) {
			throw new Error(getI18n().t("sidebar:download.noContent"));
		}

		const appName = this._theme.name || "Chat";
		const pixelCommand =
			format === "word"
				? `ToDocx(markdown=["<encode>${formattedMessages}</encode>"], fileName="${appName} Room Export");`
				: `ToPdf(markdown=["<encode>${formattedMessages}</encode>"], fileName="${appName} Room Export");`;

		const downloadResponse = await runPixel<[string]>(
			pixelCommand,
			messagesResponse.insightId,
		);

		if (!downloadResponse?.pixelReturn?.[0]) {
			throw new Error(getI18n().t("sidebar:download.noResponse"));
		}

		const { operationType, output } = downloadResponse.pixelReturn[0];

		if (!operationType?.includes("FILE_DOWNLOAD")) {
			throw new Error(
				getI18n().t("sidebar:download.generateFailedWithType", {
					format: format.toUpperCase(),
					operationType,
				}),
			);
		}

		download(downloadResponse.insightId, output);
	};

	/**
	 * Return a cached room, or load it from the server and cache it.
	 *
	 * @param roomId - The room to load.
	 * @returns The room.
	 * @throws When the room has no messages, as when its first message never
	 * saved.
	 */
	loadRoom = async (roomId: string): Promise<RoomStore> => {
		if (this.snapshot.rooms[roomId]) {
			return this.snapshot.rooms[roomId];
		}

		const room = new RoomStore({
			theme: this._theme,
			roomId,
			panelComponents: this._panelComponents,
		});
		await room.initialize();

		// If the room has no messages or just the placeholder, it means it is a valid room but it is empty, so we can consider it as not found and throw an error
		// This happens if CreateRoom succeeds but the first AskPlayground call fails
		if (!room.tail || room.tail.id === "ROOT_PLACEHOLDER_ID") {
			throw new Error(getI18n().t("room:errors.roomNotFound"));
		}

		this.setCachedRoom(roomId, room);
		// No roomCounter increment here — loading an existing room doesn't
		// change the list, so there's no reason to trigger a re-fetch.
		return room;
	};

	/**
	 * Select a model and read its context window.
	 *
	 * @param model - The model to select.
	 */
	setSelectedModel = (model: Engine): void => {
		this.updateModels({ selected: model });

		this.loadEngineContextWindow(model.engine_id);
	};

	/**
	 * Select a model named by something other than the picker - an agent's
	 * default model, say - resolving the id against the models the user can
	 * actually see so a stale or unshared id cannot leave the room pointed at a
	 * model that will not run.
	 *
	 * @param engineId - The model's id.
	 * @returns Whether the selection changed.
	 */
	selectModelById = async (engineId: string): Promise<boolean> => {
		const id = engineId?.trim();
		if (!id || this.snapshot.models.selected?.engine_id === id) {
			return false;
		}

		try {
			const { pixelReturn } = await this.run<[Engine[]]>(
				`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"], engine=[${JSON.stringify(id)}]);`,
			);

			const model = pixelReturn[0].output?.find(
				(m) => m.engine_id === id,
			);
			if (!model) {
				return false;
			}

			this.setSelectedModel(model);
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	};

	/**
	 * Read a model's context window, and keep it only if the model is still
	 * selected when the read returns.
	 *
	 * @param engineId - The model's id.
	 */
	private loadEngineContextWindow = async (engineId: string) => {
		this.updateModels({ contextWindow: undefined });

		const contextWindow = await Session.insight.withInsight((id) =>
			getModelContextWindow(id, engineId),
		);

		if (this.models.selected?.engine_id === engineId) {
			this.updateModels({ contextWindow });
		}
	};

	/**
	 * Create an agent from its basics with AddWorkspace.
	 *
	 * @param data - The agent's name, prompt, description, tools, skills,
	 * and prompts.
	 * @returns The new agent's id.
	 * @throws When the pixel fails.
	 */
	addWorkspace = async (
		data: Pick<
			Workspace,
			| "name"
			| "system_prompt"
			| "description"
			| "mcp"
			| "skills"
			| "prompts"
		>,
	): Promise<string> => {
		try {
			const mcp = data.mcp.map(
				({ name, id, type }): MCPConfig => ({ name, id, type }),
			);
			const skills = data.skills.map((s) => s.id);

			const pixel = `AddWorkspace(name=${JSON.stringify(data.name)}, description="<encode>${data.description}</encode>", systemPrompt="<encode>${data.system_prompt}</encode>", mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)})`;
			const { pixelReturn } = await this.run<[string]>(pixel);

			return pixelReturn[0].output;
		} catch (e) {
			throw e instanceof Error ? e : new Error(String(e));
		}
	};

	/**
	 * Creates an agent from the shared agent form. AddWorkspace only takes the
	 * basics, so everything else is saved with a follow-up EditWorkspace when
	 * the form sets any of it.
	 *
	 * Resolves with the new agent's id, EditWorkspace's partial-save warning
	 * (when there is one), and whether the follow-up save failed - the agent
	 * exists either way.
	 *
	 * @param values - The agent form's values.
	 * @returns The agent's id, and how its follow-up save went.
	 * @throws When AddWorkspace returns no id.
	 */
	createAgent = async (
		values: AgentFormValues,
	): Promise<{
		workspaceId: string;
		warning?: string;
		settingsFailed?: boolean;
	}> => {
		const { pixelReturn } = await this.run<[string]>(
			buildAddWorkspacePixel(values),
		);
		const workspaceId = pixelReturn[0]?.output;
		if (!workspaceId) {
			throw new Error();
		}
		if (!agentNeedsFollowUpEdit(values)) {
			return { workspaceId };
		}
		try {
			const warning = await this.editWorkspace(workspaceId, values);
			return { workspaceId, warning };
		} catch (e) {
			console.error(e);
			return { workspaceId, settingsFailed: true };
		}
	};

	/**
	 * Saves an agent's full configuration from the shared agent form.
	 *
	 * @param workspaceId - The agent to save.
	 * @param values - The agent form's values.
	 * @returns EditWorkspace's partial-save warning, when there is one.
	 * @throws When the pixel returns nothing.
	 */
	editWorkspace = async (
		workspaceId: string,
		values: AgentFormValues,
	): Promise<string | undefined> => {
		const { pixelReturn } = await this.run<[unknown]>(
			buildEditWorkspacePixel(workspaceId, values),
		);
		const output = pixelReturn[0]?.output;
		if (!output) {
			throw new Error();
		}
		return getWorkspaceSaveWarning(output);
	};

	/**
	 * Delete an agent. A failure is logged, not thrown.
	 *
	 * @param workspaceId - The agent to delete.
	 */
	deleteWorkspace = async (workspaceId: string) => {
		try {
			await this.run(`DeleteWorkspace(workspaceId=['${workspaceId}'])`);

			return;
		} catch (e) {
			console.error(e);
		}
	};

	// Helpers

	/**
	 * Run a pixel that belongs to no room in the session's own insight.
	 *
	 * @param pixel - The pixel to run.
	 * @returns The pixel's returns.
	 * @throws When any pixel reports an error.
	 */
	private run = async <O extends unknown[] | []>(pixel: string) =>
		throwOnPixelErrors(await Session.insight.run<O>(pixel));

	/** The deployment's default model id: the theme's, then the env's. */
	private get deploymentDefaultModelId(): string {
		return (
			readDeploymentNewChatDefaults(this._theme, this._build).modelId ??
			""
		);
	}

	/**
	 * The model a new chat starts with when the session has none: the user's
	 * default (Settings > General), then the deployment's, then the first
	 * the user can see.
	 *
	 * @returns The model, or undefined when the user can see none.
	 */
	private findNewChatDefaultModel = (): Engine | undefined =>
		resolveNewChatModel(
			null,
			readNewChatPreferences(Session.getSnapshot().user?.meta),
			readDeploymentNewChatDefaults(this._theme, this._build),
			this.snapshot.models.available,
		);

	/**
	 * Select the model a new chat starts with when nothing else names one,
	 * as when its agent is cleared: the user's default, then the
	 * deployment's, then the first the user can see. Does nothing while
	 * model selection is off, since the deployment's model is always used.
	 */
	selectNewChatDefaultModel = (): void => {
		if (!this._theme.featureFlags?.enableModelSelect) return;
		const model = this.findNewChatDefaultModel();
		if (
			model &&
			model.engine_id !== this.snapshot.models.selected?.engine_id
		) {
			this.setSelectedModel(model);
		}
	};

	/**
	 * Read the models the user can see and select the one the first new chat
	 * starts with: the user's default, then the deployment's, then the first.
	 * The selected model is the session's last: later new chats keep it.
	 */
	private getDefaultModel = async (): Promise<void> => {
		// with model selection off, every chat runs the deployment's model
		if (!this._theme.featureFlags?.enableModelSelect) {
			this.setSelectedModel({
				engine_id: this.deploymentDefaultModelId,
				engine_name:
					this._theme.defaultRoomSettings?.model
						?.engine_display_name ||
					this._theme.defaultRoomSettings?.model?.engine_name ||
					this._build.modelName ||
					"",
				engine_type: "MODEL",
			});
			return;
		}

		const { pixelReturn } = await this.run<[Engine[]]>(
			`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
		);

		// kept so an id can be resolved to an Engine later
		this.updateModels({ available: pixelReturn[0].output });
		// the session has read the user before any authenticated route mounts
		const model = this.findNewChatDefaultModel();
		if (model) {
			this.setSelectedModel(model);
		}
	};
}
