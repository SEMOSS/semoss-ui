import type { RoomToolCall } from "../room.types";
import type { RoomEngine } from "../room-engine.store";

/**
 * A tool the client offers the model in chat turns, as it goes in
 * `paramValues.tools`: the backend merges these with the room's own tools,
 * and the client runs the calls the model makes to them.
 */
export interface ClientToolDefinition {
	name: string;
	title?: string;
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<string, Record<string, unknown>>;
		required: string[];
	};
}

/** How a client tool runs: on its own, once the user approves, or not at all. */
export type ClientToolPolicy = "auto" | "ask" | "disabled";

/** What a client tool call returned. */
export interface ClientToolResult {
	/** The text the model reads back. */
	output: string;
	/** Whether the call failed; the output then says why. */
	isError?: boolean;
}

/**
 * Tools a host runs on the client — the room's files tools, a desktop's
 * local tools — with no backend change. The room sends every provider's
 * tools with **every** chat turn **and** every tool result (the model's
 * follow up only re-adds the room's own tools), runs the calls a provider
 * can handle with its `execute` instead of RunMCPTool, and asks the user
 * first when the provider's policy says so.
 *
 * Agent runs bring their own tools, so client tools are not sent with them;
 * a host answers an agent-run tool through `RoomEngineConfig.onPendingAction`.
 */
export interface ClientToolProvider {
	/** Names the provider, such as `chat-files` or `desktop`. */
	id: string;
	/**
	 * The tools to offer in a room's chat turns. Read before every turn and
	 * every tool result; leave out disabled tools.
	 */
	getTools(room: RoomEngine): ClientToolDefinition[];
	/** Whether the provider runs this call. */
	canHandle(call: RoomToolCall): boolean;
	/** Run a call. Should not throw: a failure is a result with `isError`. */
	execute(call: RoomToolCall, room: RoomEngine): Promise<ClientToolResult>;
	/**
	 * Fill in what the model does not send back with a call — the model's
	 * calls come back with no `_meta` — so it renders and runs like any
	 * other: its title, and whether it runs on its own (`SMSS_MCP_EXECUTION`).
	 * Also called for calls the provider does not run, to decorate them.
	 */
	decorateToolCall?(call: RoomToolCall, room: RoomEngine): RoomToolCall;
	/** How a tool runs in this room; `auto` when the provider says nothing. */
	policy?(toolName: string, room: RoomEngine): ClientToolPolicy;
}
