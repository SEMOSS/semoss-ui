import { getI18n } from "@semoss/i18n";
import type { PixelMessageToolCallPart } from "../../../types";
import type { RoomStore } from "../../room/store/room.store";
import { ROOM_PANEL_TYPES } from "../../room/store/room-workbench-layout";
import type { ToolStore } from "../../room/store/tool.store";
import {
	MCP_EXECUTION_AGENT_ASK,
	MCP_EXECUTION_AGENT_AUTO,
	MCP_EXECUTION_ASK,
	MCP_EXECUTION_AUTO,
} from "../mcp/mcp-constants";
import { isAskExecutionMode } from "../mcp/mcp-utils";
import {
	getConnectorToolService,
	getFolderToolCallName,
	isFolderToolCall,
} from "./chat-tool-kind";
import {
	type DefaultToolMode,
	getDefaultToolMode as readDefaultToolMode,
} from "./default-tools";
import {
	getFolderToolTitle,
	summarizeFolderToolCall,
} from "./folder-tool-labels";
import {
	buildDesktopToolDefinitions,
	buildFolderToolDefinitions,
	type DesktopToolName,
	executeFolderTool,
	type FolderToolDefinition,
	type FolderToolExecution,
	type FolderToolName,
	type FolderToolOutcome,
	getMatchingFolderTool,
	isDesktopToolName,
	isFolderToolName,
} from "./folder-tools";
import { RoomFolder } from "./room-folder";

/** A tool call as a message part holds it. */
type ToolCall = PixelMessageToolCallPart["toolCall"];
/** The metadata a tool call carries. */
type ToolCallMeta = NonNullable<ToolCall["_meta"]>;

/** What the model reads back when the user declines a change. */
const DECLINED_RESULT = "The user declined this change, so it did not run.";

/** What the model reads back for a client tool call where its host is not. */
const CLIENT_TOOLS_UNAVAILABLE =
	"Desktop folders are only available in the desktop app where they were attached. Tell the user to open this chat there, or attach the folders again.";

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
 * @returns The outcome.
 */
const failure = (message: string): FolderToolOutcome => ({
	isError: true,
	payload: { error: message },
	hasChanges: false,
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
 * @returns The text to save.
 */
const toToolResponseText = (outcome: FolderToolOutcome): string =>
	(outcome.isError
		? String(outcome.payload.error)
		: JSON.stringify(outcome.payload)
	).replace(/<\/encode>/gi, "<\\/encode>");

/**
 * One room's chat tools: the default tools its chat sends, and the user's
 * decisions on the calls that wait for them.
 *
 * In chat, every message carries the default tools, the folder tools this
 * browser runs in Room Files, except the ones the room's settings disable.
 * The settings (`defaultTools`) also say which run on their own and which
 * wait for the user's decision in the tool's card; by default reading runs on
 * its own and every change asks. The room's tool loop hands each call to
 * {@link ChatTools.runChatTool}. An agent run brings its own file, shell,
 * and code tools and works in Room Files, so no folder tools are sent with it.
 *
 * The settings live in the room's options, which the room saves before each
 * message. Owned by the room store, and so as long lived as the room.
 */
export class ChatTools {
	/** The room these tools belong to. */
	private readonly room: RoomStore;

	/** The chat's own files, where the default tools read and write. */
	private readonly roomFiles: RoomFolder;

	/**
	 * An agent run's paused client tool calls this browser has answered or is
	 * answering, by action id. A call stays paused in the run's snapshots
	 * until the server takes the answer, so it is never answered twice.
	 */
	private readonly answeredActions = new Set<string>();

	/** Paused client tool calls whose automatic answer failed, which wait for the user instead. */
	private readonly failedActions = new Set<string>();

	/**
	 * @param room - The room these tools belong to.
	 */
	constructor(room: RoomStore) {
		this.room = room;
		this.roomFiles = new RoomFolder(this.runFolderPixel);
	}

	/** Whether the room runs its messages through the agent harness. */
	get isAgentMode(): boolean {
		return this.room.mode === "agent";
	}

	/**
	 * How the chat runs a default tool, from the room's settings.
	 *
	 * @param name - The tool.
	 * @returns `auto`, `ask`, or `disabled`.
	 */
	getDefaultToolMode = (
		name: FolderToolName | DesktopToolName,
	): DefaultToolMode =>
		readDefaultToolMode(
			this.room.options.defaultTools,
			getMatchingFolderTool(name),
		);

	/**
	 * How a tool is offered to the model, from the room's settings.
	 *
	 * @param name - The tool.
	 * @returns Its execution, or null to leave a disabled tool out.
	 */
	private executionOf = (
		name: FolderToolName | DesktopToolName,
	): FolderToolExecution | null => {
		const mode = this.getDefaultToolMode(name);
		return mode === "disabled" ? null : mode;
	};

	/**
	 * The tools to offer the model in a chat turn: the default tools and the
	 * client tools the room's settings do not disable, each described the way
	 * it runs. None for an agent room, whose runs bring their own file tools
	 * and read the client tools from the room's toolbox.
	 */
	get chatToolDefinitions(): FolderToolDefinition[] {
		if (this.isAgentMode) {
			return [];
		}
		return [
			...buildFolderToolDefinitions({ executionOf: this.executionOf }),
			...this.clientToolDefinitions,
		];
	}

	/**
	 * The client tools: the ones a host runs in this browser, today the
	 * desktop app's `desktop_*` tools over the folders attached from the
	 * user's machine. Each follows the room's setting for the Room Files tool
	 * that does the same. None where the host has none or nothing is
	 * attached. A chat turn sends them; an agent room keeps them in its own
	 * toolbox (`RoomStore.syncClientTools`).
	 */
	get clientToolDefinitions(): FolderToolDefinition[] {
		const localFolders = this.room.localFolders;
		if (!localFolders) {
			return [];
		}
		return buildDesktopToolDefinitions({
			folderNames: localFolders.toolFolder.folderNames,
			executionOf: this.executionOf,
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
	 * their approval card, rather than in the Workbench.
	 *
	 * @param call - The tool call as the room received it.
	 * @param defaultTools - The room's `defaultTools` setting to follow; the
	 * room's own by default, or the next one while the room changes it.
	 * @returns The call to render and run. Other tools come back unchanged.
	 */
	decorateToolCall = (
		call: ToolCall,
		defaultTools: unknown = this.room.options.defaultTools,
	): ToolCall => {
		const name = getFolderToolCallName(call);
		if (isFolderToolCall(call) && name) {
			const shouldAskUser =
				readDefaultToolMode(
					defaultTools,
					getMatchingFolderTool(name),
				) !== "auto";
			// an agent run's call keeps the run's own execution, which the
			// chat's tool loop never runs, and only says whether it asks
			const executionMode = call._meta?.SMSS_MCP_EXECUTION;
			const isAgentCall =
				executionMode === MCP_EXECUTION_AGENT_ASK ||
				executionMode === MCP_EXECUTION_AGENT_AUTO;
			const [ask, auto] = isAgentCall
				? ([MCP_EXECUTION_AGENT_ASK, MCP_EXECUTION_AGENT_AUTO] as const)
				: ([MCP_EXECUTION_ASK, MCP_EXECUTION_AUTO] as const);

			return {
				...call,
				title: getFolderToolTitle(name),
				description: summarizeFolderToolCall(
					name,
					call.arguments ?? {},
				),
				_meta: {
					...EMPTY_ENGINE_META,
					...call._meta,
					SMSS_MCP_EXECUTION: shouldAskUser ? ask : auto,
					SMSS_CLIENT_TOOL: true,
					SMSS_MCP_UI: shouldAskUser
						? { displayLocation: "inline", autoOpen: true }
						: { displayLocation: "sidebar" },
				},
			};
		}

		// a connector call keeps its metadata, and only says where it opens
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
	 * Run a folder call against its folder: the chat's own files for a Room
	 * Files tool, the attached desktop folders for a client tool. Never
	 * throws.
	 *
	 * @param name - The tool the model called.
	 * @param args - The call's arguments.
	 * @returns The outcome, in the shape the model reads back.
	 */
	runFolderCall = async (
		name: string,
		args: Record<string, unknown>,
	): Promise<FolderToolOutcome> => {
		const isClientTool = isDesktopToolName(name);
		if (!isFolderToolName(name) && !isClientTool) {
			return failure(`Unknown tool ${name}.`);
		}
		if (this.getDefaultToolMode(name) === "disabled") {
			return failure(
				`${name} is disabled in this chat's settings. Ask the user to allow it in Settings if they want this done.`,
			);
		}
		if (!isClientTool) {
			const outcome = await executeFolderTool(this.roomFiles, name, args);
			if (outcome.hasChanges) {
				this.room.refreshWorkbenchFileExplorer();
			}
			return outcome;
		}
		const localFolders = this.room.localFolders;
		if (!localFolders || localFolders.folders.length === 0) {
			return failure(CLIENT_TOOLS_UNAVAILABLE);
		}
		const outcome = await executeFolderTool(
			localFolders.toolFolder,
			name,
			args,
		);
		if (outcome.hasChanges) {
			this.room.refreshLocalFolderPanels();
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
		// an agent run's client tool call is paused on the server, which takes
		// its result as the user's response
		if (tool.pendingAction) {
			await this.answerAgentClientCall(tool);
			return;
		}

		const message = tool.message;
		if (!message || tool.status !== "INITIAL") {
			return;
		}

		tool.setStatus("LOADING");
		const outcome = await this.runFolderCall(
			getFolderToolCallName(tool.json) ?? tool.json.name,
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
	 * Answer the client tool calls an agent run paused on that the room's
	 * settings let run on their own, and every one where its host is not here,
	 * so a run never waits on a browser that cannot answer it. The rest wait
	 * in their cards for the user. Each call is answered once.
	 *
	 * @param tools - The run's calls whose pending action just changed.
	 */
	answerAgentClientCalls = (tools: readonly ToolStore[]): void => {
		const isHere = (this.room.localFolders?.folders.length ?? 0) > 0;
		for (const tool of tools) {
			const action = tool.pendingAction;
			const name = getFolderToolCallName(tool.json);
			if (
				!action ||
				!name ||
				!isDesktopToolName(name) ||
				this.failedActions.has(action.actionId)
			) {
				continue;
			}
			if (!isHere || this.getDefaultToolMode(name) === "auto") {
				this.answerAgentClientCall(tool).catch((error: unknown) => {
					this.failedActions.add(action.actionId);
					console.error(
						"Could not answer the client tool call",
						error,
					);
				});
			}
		}
	};

	/**
	 * Run an agent run's paused client tool call here, and resume the run with
	 * its result.
	 *
	 * @param tool - The paused call.
	 */
	private answerAgentClientCall = async (tool: ToolStore): Promise<void> => {
		const action = tool.pendingAction;
		if (!action || this.answeredActions.has(action.actionId)) {
			return;
		}
		this.answeredActions.add(action.actionId);
		try {
			const outcome = await this.runFolderCall(
				getFolderToolCallName(tool.json) ?? tool.json.name,
				action.editedArgs ?? action.toolArgs ?? tool.parameters,
			);
			// the room's live store for the run, which wakes its poller
			await tool.room.agentTurns
				.getOrCreateAgent(action.runId)
				.decide(action, "respond", outcome.payload);
		} catch (error) {
			// not answered, so the user can try again from the call's card
			this.answeredActions.delete(action.actionId);
			throw error;
		}
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
		await message.runMcpToolCall(tool);
	};

	/** Show the room's settings in its Workbench, where the default tools are. */
	openRoomSettings = (): void => {
		this.room.openWorkbenchPanel(
			ROOM_PANEL_TYPES.CONFIGURATION,
			{},
			getI18n().t("room:workspacePlaces.settings"),
		);
	};

	/**
	 * Runs one pixel against this room's insight and resolves to its first
	 * statement's output.
	 *
	 * @param pixel - The pixel.
	 * @returns The output.
	 */
	private runFolderPixel = async (pixel: string): Promise<unknown> => {
		const response = await this.room.runRoomPixel<[unknown]>(pixel, {
			showLoading: false,
			setErrorOnFail: false,
		});
		return response.pixelReturn[0]?.output;
	};
}
