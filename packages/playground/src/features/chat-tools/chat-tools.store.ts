import { makeAutoObservable, runInAction } from "mobx";
import { getI18n } from "@semoss/i18n";
import { MCP_EXECUTION_ASK, MCP_EXECUTION_AUTO } from "@/constants";
import type { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import type { ToolStore } from "@/stores/tool/tool.store";
import type { PixelMessageToolCallPart } from "@/types";
import { isAskExecutionMode } from "@/utility/mcp-utils";
import { RoomFolderProvider } from "./folders/room-folder";
import {
	getConnectorToolService,
	isFolderToolCall,
} from "./tools/chat-tool-kind";
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
 * One room's chat tools: the default tools its chat sends, and the user's
 * decisions on the calls that wait for them.
 *
 * In chat, every message carries the default tools, the folder tools this
 * browser runs in Chat Files, except the ones the room's settings disable.
 * The settings (`defaultTools`) also say which run on their own and which
 * wait for the user's decision in the tool's card; by default reading runs on
 * its own and every change asks. The room's tool loop hands each call to
 * {@link ChatToolsStore.runChatTool}. An agent run brings its own file, shell,
 * and code tools and works in Chat Files, so no folder tools are sent with it.
 *
 * The settings live in the room's options, which the room saves before each
 * message. Owned by the room store, and so as long lived as the room.
 */
export class ChatToolsStore {
	private readonly room: RoomStore;

	/** The chat's own files, where the default tools read and write. */
	private readonly roomFiles: RoomFolderProvider;

	/**
	 * @param room - The room these tools belong to.
	 */
	constructor(room: RoomStore) {
		this.room = room;
		this.roomFiles = new RoomFolderProvider(this.runFolderPixel);

		makeAutoObservable<ChatToolsStore, "room" | "roomFiles">(this, {
			room: false,
			roomFiles: false,
		});
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
		await message.runMcpToolCall(tool);
	};

	/**
	 * Show "Chat Tools" in the room's sidebar: every tool the assistant has
	 * for the next message, including the ones this browser sends itself.
	 */
	openToolsPanel = (): void => {
		this.room.openSidebarPanel(
			ROOM_PANEL_TYPES.CHAT_TOOLS,
			{},
			getI18n().t("chatTools:panel.title"),
		);
	};

	/** Show the room's settings in its sidebar, where the default tools are. */
	openRoomSettings = (): void => {
		this.room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
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
