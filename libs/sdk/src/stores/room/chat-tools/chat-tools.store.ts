import type { RoomToolCall } from "../room.types";
import type { RoomEngine } from "../room-engine.store";
import type { ToolCallStore } from "../tool-call.store";
import {
	CHAT_FILES_PROVIDER_ID,
	runFolderCall,
} from "./chat-files-tool-provider";
import type {
	ClientToolDefinition,
	ClientToolProvider,
} from "./client-tool-provider";
import { type DefaultToolMode, getDefaultToolMode } from "./default-tools";
import type { FolderToolName, FolderToolOutcome } from "./folder-tools";

/** What the model reads back when the user declines a call. */
const DECLINED_RESULT = "The user declined this change, so it did not run.";

/**
 * One room's client tools: the tools its chat turns offer the model from every
 * {@link ClientToolProvider} the engine was configured with, and the user's
 * decisions on the calls that wait for them.
 *
 * Holds no state of its own: what it offers follows the room's mode and
 * options, so it reads them each time.
 */
export class ChatToolsStore {
	/**
	 * @param room - The room the tools belong to.
	 * @param providers - The client tool providers, in order.
	 */
	constructor(
		private readonly room: RoomEngine,
		private readonly providers: readonly ClientToolProvider[],
	) {}

	/** Whether the room runs its messages through the agent harness. */
	get isAgentMode(): boolean {
		return this.room.mode === "agent";
	}

	/** Whether the room offers the files tools at all. */
	get hasChatFiles(): boolean {
		return this.providers.some(
			(provider) => provider.id === CHAT_FILES_PROVIDER_ID,
		);
	}

	/**
	 * How the chat runs a files tool, from the room's settings.
	 *
	 * @param name - The tool.
	 * @returns `auto`, `ask`, or `disabled`.
	 */
	getDefaultToolMode = (name: FolderToolName): DefaultToolMode =>
		getDefaultToolMode(this.room.options.defaultTools, name);

	/**
	 * The client tools to offer the model in a chat turn: every provider's,
	 * none in an agent room, whose runs bring their own.
	 */
	get chatToolDefinitions(): ClientToolDefinition[] {
		if (this.isAgentMode) {
			return [];
		}
		return this.providers.flatMap((provider) =>
			provider.getTools(this.room),
		);
	}

	/**
	 * What a chat turn adds to its `paramValues`. Sent again with every tool
	 * result, since the follow up only adds the room's own tools.
	 */
	get chatParamValues(): Record<string, unknown> {
		const tools = this.chatToolDefinitions;
		return tools.length > 0 ? { tools: tools } : {};
	}

	/**
	 * Fill in what the model does not send back with a call, through every
	 * provider in turn.
	 *
	 * @param call - The call as the room received it.
	 * @returns The call to render and run.
	 */
	decorateToolCall = (call: RoomToolCall): RoomToolCall =>
		this.providers.reduce(
			(decorated, provider) =>
				provider.decorateToolCall?.(decorated, this.room) ?? decorated,
			call,
		);

	/**
	 * The provider that runs a call, when a client tool does.
	 *
	 * @param tool - The call.
	 * @returns The provider, or undefined for a call the backend runs.
	 */
	private providerFor = (
		tool: ToolCallStore,
	): ClientToolProvider | undefined =>
		this.providers.find((provider) => provider.canHandle(tool.json));

	/**
	 * Whether a client tool runs this call rather than RunMCPTool.
	 *
	 * @param tool - The call.
	 * @returns True for a client tool's call.
	 */
	canRun = (tool: ToolCallStore): boolean => Boolean(this.providerFor(tool));

	/**
	 * Run a files call against the room's folder. Never throws.
	 *
	 * @param name - The tool the model called.
	 * @param args - The call's arguments.
	 * @returns The outcome, in the shape the model reads back.
	 */
	runFolderCall = (
		name: string,
		args: Record<string, unknown>,
	): Promise<FolderToolOutcome> => runFolderCall(this.room, name, args);

	/**
	 * Run a client tool call and record its result on the message that made
	 * it, which hands the result back to the model.
	 *
	 * @param tool - A call that has not run yet.
	 */
	runChatTool = async (tool: ToolCallStore): Promise<void> => {
		const message = tool.message;
		const provider = this.providerFor(tool);
		if (!message || !provider || tool.status !== "INITIAL") {
			return;
		}

		tool.status = "LOADING";
		let result: { output: string; isError?: boolean };
		try {
			result = await provider.execute(
				{ ...tool.json, arguments: tool.parameters },
				this.room,
			);
		} catch (e) {
			result = {
				output: e instanceof Error ? e.message : String(e),
				isError: true,
			};
		}
		await message.saveToolExecution(
			tool,
			result.output,
			result.isError ? "error" : "success",
			tool.parameters,
		);
	};

	/**
	 * Allow a client call that waited for the user, then run it.
	 *
	 * @param tool - The waiting call.
	 */
	approveChatTool = (tool: ToolCallStore): Promise<void> =>
		this.runChatTool(tool);

	/**
	 * Decline a call that waited for the user. The model reads that the user
	 * declined it.
	 *
	 * @param tool - The waiting call.
	 */
	declineChatTool = async (tool: ToolCallStore): Promise<void> => {
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
	 * Allow a room toolbox call that waited for the user, such as a
	 * connector's, then run it through RunMCPTool with the user's account.
	 *
	 * @param tool - The waiting call.
	 */
	approveConnectorChatTool = async (tool: ToolCallStore): Promise<void> => {
		const message = tool.message;
		if (!message || tool.status !== "INITIAL") {
			return;
		}
		await message.runMcpToolCall(tool);
	};
}
