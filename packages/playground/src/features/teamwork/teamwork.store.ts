import { makeAutoObservable, observable, runInAction } from "mobx";
import type {
	ConnectorSavedFile,
	ConnectorViewerService,
} from "@semoss/connectors";
import { getI18n } from "@semoss/i18n";
import { MCP_EXECUTION_ASK, MCP_EXECUTION_AUTO } from "@/constants";
import type { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import type { ToolStore } from "@/stores/tool/tool.store";
import type { PixelMessageToolCallPart } from "@/types";
import { isAskExecutionMode, ROOM_MCP_ID } from "@/utility/mcp-utils";
import {
	CONNECTOR_PROVIDERS,
	type ConnectorProviderId,
	type ConnectorServiceId,
	getConnectorProvider,
	getConnectorServices,
	isProviderOffered as isOfferedByServer,
	type McpTool,
} from "./connectors/connector.catalog";
import { isServiceCovered as isCoveredByServer } from "./connectors/connector-access";
import {
	connectProvider,
	getSessionLogins,
	loadRoomTools,
	readSessionLoginConfig,
	readUserConnectorTools,
	syncRoomConnectorTools,
} from "./connectors/connectors.api";
import { RoomFolderProvider } from "./folders/room-folder.provider";
import {
	CONNECTOR_SOURCES,
	type ConnectorSource,
	getConnectorSource,
} from "./sources/connector-sources";
import type { TeamworkContextItem } from "./teamwork.types";
import {
	type DefaultToolMode,
	getDefaultToolMode as readDefaultToolMode,
} from "./tools/default-tools";
import {
	getFolderToolTitle,
	summarizeFolderToolCall,
} from "./tools/folder-tool-labels";
import {
	buildFolderToolDefinitions,
	executeFolderTool,
	type FolderToolDefinition,
	type FolderToolName,
	type FolderToolOutcome,
	isFolderToolName,
	ROOM_FILES_NAME,
} from "./tools/folder-tools";
import {
	getConnectorToolService,
	isFolderToolCall,
} from "./tools/teamwork-tool-kind";

type ToolCall = PixelMessageToolCallPart["toolCall"];
type ToolCallMeta = NonNullable<ToolCall["_meta"]>;

/** What the model reads back when the user declines a change. */
const DECLINED_RESULT = "The user declined this change, so it did not run.";

/** The engine fields a folder tool's metadata leaves empty. */
const EMPTY_ENGINE_META: Omit<ToolCallMeta, "SMSS_MCP_EXECUTION"> = {
	SMSS_ENGINE_NAME: "",
	SMSS_ENGINE_ID: "",
	SMSS_ENGINE_TYPE: "",
	SMSS_PROJECT_NAME: "",
	SMSS_PROJECT_ID: "",
};

/**
 * A failed tool call, in the shape the model reads back.
 *
 * @param message - Why it failed.
 * @return The outcome.
 */
const failure = (message: string): FolderToolOutcome => ({
	isError: true,
	payload: { error: message },
	changes: [],
});

/**
 * The text a chat tool result is saved as.
 *
 * Results travel inside a pixel `<encode>` block, which a file containing the
 * literal closing marker would end early. JSON may escape `/` as `\/`, so the
 * marker is escaped in the successful, JSON, form; an error is plain text and
 * has the marker broken up the same way.
 *
 * @param outcome - The tool call's outcome.
 * @return The text to save.
 */
const toToolResponseText = (outcome: FolderToolOutcome): string =>
	(outcome.isError
		? String(outcome.payload.error)
		: JSON.stringify(outcome.payload)
	).replace(/<\/encode>/gi, "<\\/encode>");

/**
 * One room's teamwork state: the default tools its chat sends, the connectors
 * switched on, and the accounts they sign in with.
 *
 * In chat, every message carries the default tools, the folder tools this
 * browser runs in Chat Files, except the ones the room's settings disable.
 * The settings (`defaultTools`) also say which run on their own and which
 * wait for the user's decision in the tool's card; by default reading runs on
 * its own and every change asks. The room's tool loop hands each call to
 * {@link TeamworkStore.runChatTool}. An agent run brings its own file, shell,
 * and code tools and works in Chat Files, so no folder tools are sent with it.
 *
 * The settings live in the room's options, which the room saves before each
 * message. The connectors are the user's, not the room's: they live in the
 * user's own folder (`mcp/playground_connector_mcp.json`), stamped
 * `SMSS_MCP_GENERATOR: PlaygroundConnectors`, and each room holds a copy in
 * its tool file, made before its first message and brought up to date
 * whenever it loads.
 *
 * Owned by the room store, and so as long lived as the room. The new-chat page
 * drafts one on its temporary room; the room it creates takes the draft's
 * options, and the user's connectors through {@link TeamworkStore.adopt}.
 */
export class TeamworkStore {
	/** The connector services switched on for the user, in every chat. */
	connectors: ConnectorServiceId[] = [];

	/** Whether the connectors are being written to the room. */
	isSavingConnectors = false;

	/**
	 * Files already in the chat's own files, such as an email a Microsoft 365
	 * viewer saved there, waiting to go with the next message.
	 */
	contextItems: TeamworkContextItem[] = [];

	/**
	 * The providers the session holds a login for, or null until they have
	 * been read.
	 */
	connectedProviders: ConnectorProviderId[] | null = null;

	/** Accounts whose sign in prompt the user put away until the page reloads. */
	dismissedSignIns: ConnectorProviderId[] = [];

	/**
	 * Which connector apps each OAuth sign in lets the connectors use, as
	 * `connectorAccess` in `/api/config` reports it, or null until read or when
	 * the backend does not say. The server judges it from the scopes the sign
	 * in asks for; the scopes themselves are never sent.
	 */
	connectorAccess: unknown = null;

	/** The providers this server offers signing in with, or null until read. */
	offeredProviders: ConnectorProviderId[] | null = null;

	/**
	 * Accounts whose missing permissions notice the user put away until the
	 * page reloads.
	 */
	dismissedScopeNotices: ConnectorProviderId[] = [];

	private readonly room: RoomStore;

	/** The chat's own files, where the default tools read and write. */
	private readonly roomFiles: RoomFolderProvider;

	/**
	 * Bumped by every change the user makes, so a restore that finishes late
	 * does not overwrite connectors chosen while it ran.
	 */
	private stateVersion = 0;

	/**
	 * @param room - The room this state belongs to.
	 */
	constructor(room: RoomStore) {
		this.room = room;
		this.roomFiles = new RoomFolderProvider(this.runFolderPixel);

		makeAutoObservable<
			TeamworkStore,
			"room" | "roomFiles" | "stateVersion"
		>(this, {
			room: false,
			roomFiles: false,
			stateVersion: false,
			connectors: observable.ref,
			contextItems: observable.ref,
			connectedProviders: observable.ref,
			dismissedSignIns: observable.ref,
			connectorAccess: observable.ref,
			offeredProviders: observable.ref,
			dismissedScopeNotices: observable.ref,
		});
	}

	/**
	 * Whether this is the new-chat page's draft rather than a real room. A
	 * draft has no insight, so nothing is persisted or written for it.
	 */
	get isDraft(): boolean {
		return this.room.insightId === "new";
	}

	/**
	 * The viewers the plus menu offers: each needs its connector switched on
	 * for the chat, its account signed in, and the permission it reads with in
	 * the account's sign in, so the viewers show what the assistant can reach.
	 * Until the logins have been read, a switched on connector is enough, since
	 * one can only be switched on while signed in.
	 */
	get availableSources(): ConnectorSource[] {
		const connected = this.connectedProviders;
		return CONNECTOR_SOURCES.filter(
			(source) =>
				this.connectors.includes(source.requires) &&
				this.isProviderOffered(source.provider) &&
				(connected === null || connected.includes(source.provider)) &&
				this.isServiceCovered(source.requires),
		);
	}

	/**
	 * The chat's switched on connectors whose account's sign in lacks the
	 * permission they read with, by account, so no sign in can make them work
	 * until an administrator adds it. Without the notices the user put away.
	 */
	get uncoveredConnectors(): {
		providerId: ConnectorProviderId;
		services: ConnectorServiceId[];
	}[] {
		return CONNECTOR_PROVIDERS.map((provider) => ({
			providerId: provider.id,
			services: provider.services.filter(
				(service) =>
					this.connectors.includes(service) &&
					!this.isServiceCovered(service),
			),
		})).filter(
			(entry) =>
				entry.services.length > 0 &&
				!this.dismissedScopeNotices.includes(entry.providerId),
		);
	}

	/**
	 * The accounts this chat's connectors act with that the session is not
	 * signed in to, so the tools the assistant is offered for them would fail.
	 * Empty until the logins have been read, and without the prompts the user
	 * put away.
	 */
	get missingSignIns(): ConnectorProviderId[] {
		const connected = this.connectedProviders;
		if (connected === null) {
			return [];
		}
		return CONNECTOR_PROVIDERS.filter(
			(provider) =>
				this.isProviderOffered(provider.id) &&
				!connected.includes(provider.id) &&
				!this.dismissedSignIns.includes(provider.id) &&
				provider.services.some((service) =>
					this.connectors.includes(service),
				),
		).map((provider) => provider.id);
	}

	/**
	 * The accounts this chat's connectors act with that this server does not
	 * offer signing in with at all, so no sign in can make them work. Without
	 * the notices the user put away.
	 */
	get unofferedProviders(): ConnectorProviderId[] {
		return CONNECTOR_PROVIDERS.filter(
			(provider) =>
				!this.isProviderOffered(provider.id) &&
				!this.dismissedSignIns.includes(provider.id) &&
				provider.services.some((service) =>
					this.connectors.includes(service),
				),
		).map((provider) => provider.id);
	}

	/** Whether the room runs its messages through the agent harness. */
	get isAgentMode(): boolean {
		return this.room.mode === "agent";
	}

	/**
	 * How the chat runs a default tool, from the room's settings.
	 *
	 * @param name - The tool.
	 * @return `auto`, `ask`, or `disabled`.
	 */
	getDefaultToolMode = (name: FolderToolName): DefaultToolMode =>
		readDefaultToolMode(this.room.options.defaultTools, name);

	/**
	 * The folder tools to offer the model in a chat turn: the default tools
	 * the room's settings do not disable, each described the way it runs.
	 * None for an agent room, whose runs bring their own file tools.
	 */
	get chatToolDefinitions(): FolderToolDefinition[] {
		if (this.isAgentMode) {
			return [];
		}
		return buildFolderToolDefinitions({
			executionOf: (name) => {
				const mode = this.getDefaultToolMode(name);
				return mode === "disabled" ? null : mode;
			},
		});
	}

	/**
	 * What a chat turn adds to its `paramValues`. The room sends its own tools
	 * too; these are merged in by the backend, and have to be sent again with
	 * every tool result, since the follow up call only adds the room's own.
	 */
	get chatParamValues(): Record<string, unknown> {
		const tools = this.chatToolDefinitions;
		return tools.length > 0 ? { tools: tools } : {};
	}

	/**
	 * Fill in what the model does not send back with a tool call, so the tool
	 * renders and runs like any other.
	 *
	 * A chat folder call arrives with no metadata, since the backend does not
	 * know the tool; it runs the way the room's settings say.
	 * Folder calls and connector calls that wait for the user open inline, in
	 * their approval card, rather than in the sidebar.
	 *
	 * @param call - The tool call as the room received it.
	 * @return The call to render and run. Other tools come back unchanged.
	 */
	decorateToolCall = (call: ToolCall): ToolCall => {
		if (isFolderToolCall(call) && isFolderToolName(call.name)) {
			const holdsForUser = this.getDefaultToolMode(call.name) !== "auto";

			return {
				...call,
				title: getFolderToolTitle(call.name),
				description: summarizeFolderToolCall(
					call.name,
					call.arguments ?? {},
				),
				_meta: {
					...EMPTY_ENGINE_META,
					...call._meta,
					SMSS_MCP_EXECUTION: holdsForUser
						? MCP_EXECUTION_ASK
						: MCP_EXECUTION_AUTO,
					SMSS_CLIENT_TOOL: true,
					SMSS_MCP_UI: holdsForUser
						? { displayLocation: "inline", autoOpen: true }
						: { displayLocation: "sidebar" },
				},
			};
		}

		if (call._meta && getConnectorToolService(call)) {
			const isAsk = isAskExecutionMode(call._meta.SMSS_MCP_EXECUTION);
			return {
				...call,
				_meta: {
					...call._meta,
					SMSS_MCP_UI: {
						...call._meta.SMSS_MCP_UI,
						displayLocation: isAsk ? "inline" : "sidebar",
						autoOpen: isAsk,
					},
				},
			};
		}

		return call;
	};

	/**
	 * Run a folder call against the chat's own files. Never throws.
	 *
	 * @param name - The tool the model called.
	 * @param args - The call's arguments.
	 * @return The outcome, in the shape the model reads back.
	 */
	runFolderCall = async (
		name: string,
		args: Record<string, unknown>,
	): Promise<FolderToolOutcome> => {
		if (!isFolderToolName(name)) {
			return failure(`Unknown tool ${name}.`);
		}
		if (this.getDefaultToolMode(name) === "disabled") {
			return failure(
				`${name} is disabled in this chat's settings. Ask the user to allow it in Room Settings if they want this done.`,
			);
		}

		const outcome = await executeFolderTool(
			this.roomFiles,
			name,
			args,
			ROOM_FILES_NAME,
		);
		if (!outcome.isError && outcome.changes.length > 0) {
			this.room.refreshSidebarFileExplorer();
		}
		return outcome;
	};

	/**
	 * Run a folder call from the chat tool loop and record its result on the
	 * message that made it, which hands the result back to the model.
	 *
	 * @param tool - A folder call that has not run yet.
	 */
	runChatTool = async (tool: ToolStore): Promise<void> => {
		const message = tool.message;
		if (!message || tool.status !== "INITIAL") {
			return;
		}

		runInAction(() => {
			tool.status = "LOADING";
		});
		const outcome = await this.runFolderCall(
			tool.json.name,
			tool.parameters,
		);
		await message.saveToolExecution(
			tool,
			toToolResponseText(outcome),
			outcome.isError ? "error" : "success",
			tool.parameters,
		);
	};

	/**
	 * Allow a chat folder call that waited for the user, then run it.
	 *
	 * @param tool - The waiting folder call.
	 */
	approveChatTool = async (tool: ToolStore): Promise<void> => {
		await this.runChatTool(tool);
	};

	/**
	 * Decline a chat call that waited for the user. The model reads that the
	 * user declined it.
	 *
	 * @param tool - The waiting call.
	 */
	declineChatTool = async (tool: ToolStore): Promise<void> => {
		const message = tool.message;
		if (!message || tool.status !== "INITIAL") {
			return;
		}
		await message.saveToolExecution(
			tool,
			DECLINED_RESULT,
			"cancelled",
			tool.parameters,
		);
	};

	/**
	 * Allow a chat connector call that waited for the user, then run it through
	 * the room's toolbox with the user's own account.
	 *
	 * @param tool - The waiting connector call.
	 */
	approveConnectorChatTool = async (tool: ToolStore): Promise<void> => {
		const message = tool.message;
		if (!message || tool.status !== "INITIAL") {
			return;
		}

		runInAction(() => {
			tool.status = "LOADING";
		});

		let output = "";
		let isError = false;
		try {
			const response = await this.room.runRoomPixel<[unknown]>(
				`RunMCPTool(project=[${JSON.stringify(ROOM_MCP_ID)}], roomId=${JSON.stringify(this.room.roomId)}, function=[${JSON.stringify(tool.json.name)}], paramValues=[${JSON.stringify(tool.parameters)}]);`,
				false,
				false,
			);
			const raw = response.pixelReturn[0]?.output;
			output = typeof raw === "string" ? raw : JSON.stringify(raw);
		} catch (error) {
			output = error instanceof Error ? error.message : String(error);
			isError = true;
		}

		await message.saveToolExecution(
			tool,
			output,
			isError ? "error" : "success",
			tool.parameters,
		);
	};

	/**
	 * Take the user's connector tools, just saved, such as on the settings
	 * page. They are the user's rather than one chat's, so every chat of
	 * theirs takes the change: this one straight away, the others when they
	 * open.
	 *
	 * @param userTools - The connector tools the user's file now holds.
	 * @throws Error when the room's copy cannot be written.
	 */
	applyUserConnectorTools = async (
		userTools: readonly McpTool[],
	): Promise<void> => {
		runInAction(() => {
			this.stateVersion++;
			this.connectors = getConnectorServices(userTools);
			this.isSavingConnectors = !this.isDraft;
		});
		if (this.isDraft) {
			return;
		}
		try {
			await syncRoomConnectorTools(this.room, userTools);
		} finally {
			runInAction(() => {
				this.isSavingConnectors = false;
			});
		}
	};

	/**
	 * Take over the files a draft queued for the first message once the real
	 * room exists, and copy the user's connectors into it. Called before the
	 * room's first message, so that message already has the tools and the
	 * files. The draft's default tools come along with the options the room is
	 * created with.
	 *
	 * @param draft - The new-chat page's teamwork state.
	 * @throws Error when the connectors cannot be copied; the files are taken
	 * over first.
	 */
	adopt = async (draft: TeamworkStore): Promise<void> => {
		const queued = draft.takeContextItems();
		runInAction(() => {
			this.stateVersion++;
			this.connectors = [...draft.connectors];
			this.restoreContextItems(queued);
		});
		const userTools = await readUserConnectorTools();
		if (userTools !== null) {
			await syncRoomConnectorTools(this.room, userTools);
		}
	};

	/**
	 * Read the user's connectors and the session's logins, and bring this
	 * room's copy of the connectors up to date. Called when the room loads, so
	 * a chat opened after the user changed their connectors has the change.
	 *
	 * @param options - `isNew`: the room was just created, so it has no copy
	 * yet; {@link TeamworkStore.adopt} makes it before the first message.
	 * @return Settles when all is in place. Never rejects.
	 */
	restore = async ({
		isNew = false,
	}: {
		isNew?: boolean;
	} = {}): Promise<void> => {
		if (this.isDraft) {
			return;
		}
		try {
			await Promise.all([
				this.restoreConnectors(isNew),
				this.refreshConnectedProviders(),
				this.refreshLoginConfig(),
			]);
		} catch (error) {
			console.warn("Could not restore the room's teamwork state", error);
		}
	};

	/**
	 * Read the user's connectors for the new-chat page's draft, which has no
	 * room to copy them into yet.
	 *
	 * @return Settles once they are read. Never rejects.
	 */
	loadUserConnectors = async (): Promise<void> => {
		const version = this.stateVersion;
		try {
			const userTools = await readUserConnectorTools();
			runInAction(() => {
				if (this.stateVersion === version) {
					this.connectors =
						userTools === null
							? []
							: getConnectorServices(userTools);
				}
			});
		} catch (error) {
			console.warn("Could not read the user's connectors", error);
		}
	};

	/**
	 * Show "Chat Tools" in the room's sidebar: every tool the assistant has
	 * for the next message, including the ones this browser sends itself.
	 */
	openToolsPanel = (): void => {
		this.room.openSidebarPanel(
			ROOM_PANEL_TYPES.TEAMWORK_TOOLS,
			{},
			getI18n().t("teamwork:chatTools.panelTitle"),
		);
	};

	/** Show the room's settings in its sidebar, where the default tools are. */
	openRoomSettings = (): void => {
		this.room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
	};

	/**
	 * Queue a file from the chat's own files for the next message. A file
	 * already queued is not added twice.
	 *
	 * @param file - The file, as a viewer saved it, or as Chat Files lists it
	 * (with no `service`), its path relative to the chat's folder.
	 */
	addContextItem = (
		file: Pick<ConnectorSavedFile, "path" | "name"> &
			Partial<Pick<ConnectorSavedFile, "service">>,
	): void => {
		if (this.contextItems.some((item) => item.path === file.path)) {
			return;
		}
		this.contextItems = [
			...this.contextItems,
			{
				id: file.path,
				name: file.name,
				path: file.path,
				service: file.service,
			},
		];
	};

	/**
	 * Take a file off the queue for the next message. It stays in the chat's
	 * files.
	 *
	 * @param id - The queued item.
	 */
	removeContextItem = (id: string): void => {
		this.contextItems = this.contextItems.filter((item) => item.id !== id);
	};

	/**
	 * Hand over the files queued for the next message and clear the queue.
	 *
	 * @return The queued files.
	 */
	takeContextItems = (): TeamworkContextItem[] => {
		const items = this.contextItems;
		this.contextItems = [];
		return items;
	};

	/**
	 * Put files back on the queue after the message they were taken for could
	 * not be sent, ahead of anything queued since.
	 *
	 * @param items - The files taken for the message.
	 */
	restoreContextItems = (items: TeamworkContextItem[]): void => {
		const restored = new Set(items.map((item) => item.id));
		this.contextItems = [
			...items,
			...this.contextItems.filter((item) => !restored.has(item.id)),
		];
	};

	/** Show the chat's own files in the room's sidebar, at their top. */
	openChatFiles = (): void => {
		this.room.openSidebarFileExplorer("/");
	};

	/**
	 * Read which providers the session is signed in to. The read is shared
	 * with the rest of the page and reused for a short while, so views can ask
	 * whenever they show sign in state. A failed read keeps what was known.
	 *
	 * @param options - `force`: read again rather than reuse a recent read.
	 * @return Settles once the logins are read. Never rejects.
	 */
	refreshConnectedProviders = async ({
		force = false,
	}: {
		force?: boolean;
	} = {}): Promise<void> => {
		try {
			const logins = await getSessionLogins(
				force ? { maxAgeMs: 0 } : undefined,
			);
			const next = CONNECTOR_PROVIDERS.filter(
				(provider) => provider.loginKey in logins,
			).map((provider) => provider.id);
			runInAction(() => {
				const current = this.connectedProviders;
				// an unchanged answer leaves the views that show it alone
				if (
					current === null ||
					current.length !== next.length ||
					current.some((id, index) => id !== next[index])
				) {
					this.connectedProviders = next;
				}
			});
		} catch (error) {
			console.warn("Could not read the session's logins", error);
		}
	};

	/**
	 * Sign the session in to a provider, then read the logins again so the
	 * prompts and viewers follow.
	 *
	 * Must be called straight from a click: the sign in window opens before
	 * anything is awaited.
	 *
	 * @param providerId - The provider.
	 * @return Whether the session holds the provider's login afterwards.
	 * @throws PopupBlockedError when the browser blocks the sign in window.
	 */
	signIn = (providerId: ConnectorProviderId): Promise<boolean> =>
		connectProvider(getConnectorProvider(providerId)).then(
			async (isConnected) => {
				await this.refreshConnectedProviders();
				return isConnected;
			},
		);

	/**
	 * Put a sign in prompt away until the page reloads.
	 *
	 * @param providerId - The provider whose prompt to hide.
	 */
	dismissSignIn = (providerId: ConnectorProviderId): void => {
		if (!this.dismissedSignIns.includes(providerId)) {
			this.dismissedSignIns = [...this.dismissedSignIns, providerId];
		}
	};

	/**
	 * Put a missing permissions notice away until the page reloads.
	 *
	 * @param providerId - The provider whose notice to hide.
	 */
	dismissScopeNotice = (providerId: ConnectorProviderId): void => {
		if (!this.dismissedScopeNotices.includes(providerId)) {
			this.dismissedScopeNotices = [
				...this.dismissedScopeNotices,
				providerId,
			];
		}
	};

	/**
	 * Read which logins this server offers and which connector apps their
	 * sign ins allow. The page reads them once. A failed read keeps what was
	 * known.
	 *
	 * @return Settles once the config is read. Never rejects.
	 */
	refreshLoginConfig = async (): Promise<void> => {
		const { connectorAccess, availableProviders } =
			await readSessionLoginConfig();
		runInAction(() => {
			if (connectorAccess !== null) {
				this.connectorAccess = connectorAccess;
			}
			if (availableProviders !== null) {
				this.offeredProviders = CONNECTOR_PROVIDERS.filter((provider) =>
					isOfferedByServer(availableProviders, provider),
				).map((provider) => provider.id);
			}
		});
	};

	/**
	 * Whether this server offers signing in with a provider. True while that
	 * is not known.
	 *
	 * @param providerId - The provider.
	 * @return False only when the server is known not to offer it.
	 */
	isProviderOffered = (providerId: ConnectorProviderId): boolean =>
		this.offeredProviders === null ||
		this.offeredProviders.includes(providerId);

	/**
	 * Whether this server's sign in lets a service's account use it, as the
	 * server judges from the permissions the sign in asks for. True while that
	 * is not known.
	 *
	 * @param serviceId - The service.
	 * @return False only when the server says the sign in cannot cover it.
	 */
	isServiceCovered = (serviceId: ConnectorServiceId): boolean =>
		isCoveredByServer(serviceId, this.connectorAccess);

	/**
	 * Show a Microsoft 365 viewer in the room's sidebar.
	 *
	 * @param service - The viewer to show.
	 */
	openSourcePanel = (service: ConnectorViewerService): void => {
		const source = getConnectorSource(service);
		this.room.openSidebarPanel(
			source.panelType,
			{},
			getI18n().t(source.nameKey),
		);
	};

	/**
	 * Read the user's connectors and bring this room's copy up to date. A user
	 * who has not chosen connectors yet has no file, and their rooms keep the
	 * connectors they have.
	 *
	 * @param isNew - Whether the room was just created and has no copy yet.
	 * @throws Error when a file cannot be read or written.
	 */
	private restoreConnectors = async (isNew: boolean): Promise<void> => {
		const version = this.stateVersion;
		const userTools = await readUserConnectorTools();
		const services =
			userTools === null
				? getConnectorServices(
						isNew ? [] : await loadRoomTools(this.room),
					)
				: getConnectorServices(userTools);
		// a change the user made meanwhile is newer than what was read
		if (this.stateVersion !== version) {
			return;
		}
		runInAction(() => {
			this.connectors = services;
		});
		if (userTools !== null && !isNew) {
			await syncRoomConnectorTools(this.room, userTools);
		}
	};

	/**
	 * Runs one pixel against this room's insight and resolves to its first
	 * statement's output.
	 *
	 * @param pixel - The pixel.
	 * @return The output.
	 */
	private runFolderPixel = async (pixel: string): Promise<unknown> => {
		const response = await this.room.runRoomPixel<[unknown]>(
			pixel,
			false,
			false,
		);
		return response.pixelReturn[0]?.output;
	};
}
