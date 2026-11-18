import { getI18n } from "@semoss/i18n";
import { getErrorMessage } from "@semoss/utility/error";
import { isRecord } from "@semoss/utility/object";
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
	findToolCallName,
	getConnectorToolService,
	getFolderToolCallName,
} from "./chat-tool-kind";
import {
	type DefaultToolMode,
	isDefaultToolMode,
	getDefaultToolMode as readDefaultToolMode,
} from "./default-tools";
import {
	getFolderToolTitle,
	summarizeFolderToolCall,
} from "./folder-tool-labels";
import {
	buildFolderToolDefinitions,
	executeFolderTool,
	type FolderToolDefinition,
	type FolderToolExecution,
	type FolderToolName,
	isFolderToolName,
} from "./folder-tools";
import { RoomFolder } from "./room-folder";
import type { ClientTool, ClientToolOutcome } from "./tools-host";

/** A tool call as a message part holds it. */
type ToolCall = PixelMessageToolCallPart["toolCall"];
/** The metadata a tool call carries. */
type ToolCallMeta = NonNullable<ToolCall["_meta"]>;

/** What the model reads back when the user declines a change. */
const DECLINED_RESULT = "The user declined this change, so it did not run.";

/** What the model reads back for a client tool call where no host runs it. */
const CLIENT_TOOLS_UNAVAILABLE =
	"This tool runs only in the app it was offered in. Tell the user to open this chat there.";

/**
 * What the model reads back for a call to a tool the room's settings disable.
 *
 * @param name - The tool.
 * @returns The message.
 */
const disabledMessage = (name: string): string =>
	`${name} is disabled in this chat's settings. Ask the user to allow it in Settings if they want this done.`;

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
const failure = (message: string): ClientToolOutcome => ({
	isError: true,
	payload: { error: message },
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
const toToolResponseText = (outcome: ClientToolOutcome): string =>
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
	getDefaultToolMode = (name: FolderToolName): DefaultToolMode =>
		readDefaultToolMode(this.room.options.defaultTools, name);

	/**
	 * How the chat runs one of the host's client tools, from the room's
	 * settings: the setting it follows, or its usual way when none is stored.
	 *
	 * @param tool - The tool.
	 * @returns `auto`, `ask`, or `disabled`.
	 */
	getClientToolMode = (tool: ClientTool): DefaultToolMode => {
		const setting = this.room.options.defaultTools;
		const stored = isRecord(setting)
			? setting[tool.modeKey ?? tool.name]
			: undefined;
		return isDefaultToolMode(stored) ? stored : tool.usualMode;
	};

	/**
	 * How a tool is offered to the model, from the room's settings.
	 *
	 * @param name - The tool.
	 * @returns Its execution, or null to leave a disabled tool out.
	 */
	private executionOf = (
		name: FolderToolName,
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

	/** The client tools the host runs for this room now; none without a host. */
	get clientTools(): readonly ClientTool[] {
		return this.room.toolsHost?.list(this.room.roomId) ?? [];
	}

	/**
	 * The client tools the room's settings do not disable, each described the
	 * way it runs. A chat turn sends them; an agent room keeps them in its own
	 * toolbox (`RoomStore.syncClientTools`).
	 */
	get clientToolDefinitions(): FolderToolDefinition[] {
		return this.clientTools.flatMap((tool) => {
			const mode = this.getClientToolMode(tool);
			if (mode === "disabled") {
				return [];
			}
			return [
				{
					name: tool.name,
					title: tool.title,
					description:
						mode === "ask" && tool.approvalNote
							? `${tool.description} ${tool.approvalNote}`
							: tool.description,
					inputSchema: tool.inputSchema,
				},
			];
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
	 * The host's client tool a call is to, from its name, whether or not the
	 * room has it now.
	 *
	 * @param call - The tool call.
	 * @returns The tool's name, or undefined for a call that is not the host's.
	 */
	private getClientToolCallName = (call: ToolCall): string | undefined => {
		const host = this.room.toolsHost;
		return host
			? findToolCallName(call, (name) => host.owns(name))
			: undefined;
	};

	/**
	 * The client tool the room has now under a name.
	 *
	 * @param name - The tool's name.
	 * @returns The tool, or undefined when the room does not have it.
	 */
	private findClientTool = (name: string): ClientTool | undefined =>
		this.clientTools.find((tool) => tool.name === name);

	/**
	 * The tool a call the browser runs is to: a Room Files tool or a client tool.
	 *
	 * @param call - The tool call.
	 * @returns Its name, as the call has it when neither matches.
	 */
	private getBrowserToolCallName = (call: ToolCall): string =>
		getFolderToolCallName(call) ??
		this.getClientToolCallName(call) ??
		call._meta?.SMSS_FUNCTION_NAME ??
		call.name;

	/**
	 * Fill in what the model does not send back with a tool call, so the tool
	 * renders and runs like any other.
	 *
	 * A chat folder or client tool call arrives with no metadata, since the
	 * backend does not know the tool; it runs the way the room's settings say.
	 * Folder, client and connector calls that wait for the user open inline,
	 * in their approval card, rather than in the Workbench.
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
		const folderName = getFolderToolCallName(call);
		const clientName = folderName
			? undefined
			: this.getClientToolCallName(call);
		if (folderName || clientName) {
			const args = call.arguments ?? {};
			const clientTool = clientName
				? this.findClientTool(clientName)
				: undefined;
			const shouldAskUser = folderName
				? readDefaultToolMode(defaultTools, folderName) !== "auto"
				: !clientTool || this.getClientToolMode(clientTool) !== "auto";
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
				title: folderName
					? getFolderToolTitle(folderName)
					: (clientTool?.title ?? clientName),
				description: folderName
					? summarizeFolderToolCall(folderName, args)
					: (clientTool?.summarize?.(args) ?? ""),
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
	 * Run a call the browser runs: a Room Files tool in the chat's own files,
	 * or a client tool through its host. Never throws.
	 *
	 * @param name - The tool the model called.
	 * @param args - The call's arguments.
	 * @returns The outcome, in the shape the model reads back.
	 */
	runFolderCall = async (
		name: string,
		args: Record<string, unknown>,
	): Promise<ClientToolOutcome> => {
		if (isFolderToolName(name)) {
			if (this.getDefaultToolMode(name) === "disabled") {
				return failure(disabledMessage(name));
			}
			const outcome = await executeFolderTool(this.roomFiles, name, args);
			if (outcome.hasChanges) {
				this.room.refreshWorkbenchFileExplorer();
			}
			return outcome;
		}
		const tool = this.findClientTool(name);
		if (!tool) {
			return failure(
				this.room.toolsHost?.unavailableMessage ??
					CLIENT_TOOLS_UNAVAILABLE,
			);
		}
		if (this.getClientToolMode(tool) === "disabled") {
			return failure(disabledMessage(name));
		}
		try {
			return await tool.run(args);
		} catch (error) {
			return failure(
				getErrorMessage(error, "") || "The operation failed.",
			);
		}
	};

	/**
	 * Run a call the browser runs from the chat tool loop and record its
	 * result on the message that made it, which hands the result back to the
	 * model.
	 *
	 * @param tool - A call that has not run yet.
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
			this.getBrowserToolCallName(tool.json),
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
	 * settings let run on their own, and every one the room does not have
	 * here, so a run never waits on a browser that cannot answer it. The rest
	 * wait in their cards for the user. Each call is answered once.
	 *
	 * @param tools - The run's calls whose pending action just changed.
	 */
	answerAgentClientCalls = (tools: readonly ToolStore[]): void => {
		for (const tool of tools) {
			const action = tool.pendingAction;
			const name =
				this.getClientToolCallName(tool.json) ??
				(tool.json._meta?.SMSS_CLIENT_TOOL === true
					? this.getBrowserToolCallName(tool.json)
					: undefined);
			if (
				!action ||
				!name ||
				isFolderToolName(name) ||
				this.failedActions.has(action.actionId)
			) {
				continue;
			}
			const clientTool = this.findClientTool(name);
			if (!clientTool || this.getClientToolMode(clientTool) === "auto") {
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
				this.getBrowserToolCallName(tool.json),
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
