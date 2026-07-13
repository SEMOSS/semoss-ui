import { makeAutoObservable } from "mobx";
import { MCP_EXECUTION_ASK } from "@/constants";
import {
	type InputMessageStore,
	ResponseMessageStore,
	type RoomStore,
} from "@/stores";
import type {
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
} from "@/types";

/**
 * Build a synthetic toolCall payload for server tools (e.g. provider-side
 * web_search) that the model provider executes itself. These calls arrive
 * without the MCP `_meta` block, so we fill in safe defaults — notably
 * `SMSS_MCP_EXECUTION: "disabled"` so the tool is never queued for client-side
 * execution.
 */
const buildServerToolJson = (
	part: PixelMessageToolCallPart["toolCall"],
): PixelMessageToolCallPart["toolCall"] => ({
	id: part.id,
	type: part.type,
	name: part.name,
	arguments: part.arguments || {},
	_tool_found: false,
	original_name: part.name,
	title: part.name,
	description: "",
	server_tool: true,
	_meta: {
		SMSS_ENGINE_NAME: "",
		SMSS_ENGINE_ID: "",
		SMSS_ENGINE_TYPE: "",
		SMSS_PROJECT_NAME: "",
		SMSS_PROJECT_ID: "",
		SMSS_MCP_EXECUTION: "disabled",
	},
});

/**
 * Tool
 */
export class ToolStore {
	/**
	 * Store the room
	 */
	room: RoomStore;

	/**
	 * Id for the tool
	 */
	id: string;

	/**
	 * Id of the node
	 */
	get nodeId() {
		return `tool--${this.id}`;
	}

	/**
	 * Status for the tool
	 */
	status:
		| "INITIAL"
		| "LOADING"
		| "CANCELLED"
		| "SUCCESS"
		| "ERROR"
		| "PAUSED" = "INITIAL";

	/**
	 * Parameters for the tool
	 */
	parameters: Record<string, unknown> = {};

	/**
	 * Whether the tool call is still streaming in (name/arguments arriving via SSE).
	 * While true, the tool does not have its final `_meta`, `title`, or parsed
	 * `arguments` yet and should not be interactive.
	 */
	argumentsStreaming: boolean = false;

	/**
	 * Raw partial JSON string for `arguments` accumulated from streaming chunks.
	 * Cleared once the final response sync replaces it with the parsed object.
	 */
	argumentsBuffer: string = "";

	/**
	 * Wire name received from the streaming chunk, used as a placeholder for
	 * `name`/`title` until the final synced part provides the friendly title.
	 */
	streamingName: string = "";

	/**
	 * Json for the tool
	 */
	get json() {
		const part = this.toolCall.part?.toolCall;
		// Server tools (provider-executed, e.g. web_search) skip the MCP _meta
		// block — synthesize one so downstream consumers see a consistent shape.
		if (part?.server_tool) {
			return buildServerToolJson(part);
		}
		// If the real part has arrived (has a title), use it. Otherwise (placeholder
		// pushed during streaming, or no part at all) synthesize from streamingName
		// so the pill renders the wire name until the final sync swaps it.
		if (part?.title) {
			return part;
		}
		const name = this.streamingName;
		return {
			id: this.id,
			title: name,
			_meta: {
				SMSS_MCP_EXECUTION: MCP_EXECUTION_ASK,
				SMSS_PROJECT_NAME: "",
				SMSS_PROJECT_ID: "",
			},
			name,
			original_name: name,
			description: "",
		} as PixelMessageToolCallPart["toolCall"];
	}

	/**
	 * Response for the tool
	 */
	response: string = "";

	/**
	 * Track if the tool is open
	 */
	isOpen: boolean = false;

	/**
	 * Track if the tool is expanded (fullscreen) in inline mode
	 */
	isExpanded: boolean = false;

	/**
	 * Display information for the tool
	 */
	display: "inline" | "sidebar" | "hidden" = "sidebar";

	/**
	 * Tool call data
	 */
	private toolCall: {
		message: ResponseMessageStore | null;
		part: PixelMessageToolCallPart | null;
	} = { message: null, part: null };

	/**
	 * Tool result data — MCP tools land in a follow-up InputMessage; server
	 * tools land in the same ResponseMessage as the call.
	 */
	private toolResult: {
		message: InputMessageStore | ResponseMessageStore | null;
		part: PixelMessageToolResultPart | null;
	} = { message: null, part: null };

	constructor(room: RoomStore, toolId: string) {
		this.room = room;

		// set the id based on the json
		this.id = toolId;

		makeAutoObservable(this);
	}

	/**
	 * Update the tool with the new message information
	 * @param message - the message that contains the tool call information
	 * @param part - the part of the message that contains the tool call or result information
	 */
	syncMessage = (
		message: InputMessageStore | ResponseMessageStore,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
	) => {
		if (
			part.type === "TOOL_CALL" &&
			message instanceof ResponseMessageStore
		) {
			// set the display — server tools default to sidebar since they have
			// no SMSS_MCP_UI block
			this.display =
				part.toolCall._meta?.SMSS_MCP_UI?.displayLocation || "sidebar";

			//set the parameters based on the json
			this.parameters = part.toolCall.arguments || {};

			// update the tool call information
			this.toolCall = {
				message: message,
				part,
			};

			// the final part has arrived — clear streaming bookkeeping
			this.argumentsStreaming = false;
			this.argumentsBuffer = "";
			this.streamingName = "";
		} else if (part.type === "TOOL_RESULT") {
			// Server tool results don't echo back toolParameterValues — keep the
			// args we already captured from the matching TOOL_CALL sync.
			if (part.toolResult.toolParameterValues) {
				this.parameters = part.toolResult.toolParameterValues;
			}
			this.response = part.toolResult.output;

			// Server tool results also typically omit toolStatus — they're only
			// emitted on success, so default to SUCCESS in that case.
			if (part.toolResult.toolStatus === "error") {
				this.status = "ERROR";
			} else if (part.toolResult.toolStatus === "cancelled") {
				this.status = "CANCELLED";
			} else if (part.toolResult.toolStatus === "paused") {
				this.status = "PAUSED";
			} else {
				this.status = "SUCCESS";
			}

			// update the tool result information
			this.toolResult = {
				message: message,
				part,
			};
		}
	};

	/**
	 * Mark the tool as actively streaming and seed its wire identity.
	 * Called when the first streaming chunk for this tool arrives (carries `id`).
	 */
	beginStreaming = () => {
		this.argumentsStreaming = true;
		this.argumentsBuffer = "";
	};

	/**
	 * Record the wire name from a streaming chunk.
	 */
	setStreamingName = (name: string) => {
		this.streamingName = name;
	};

	/**
	 * Append an `arguments` delta from a streaming chunk.
	 */
	appendStreamingArguments = (delta: string) => {
		this.argumentsBuffer += delta;
	};

	/**
	 * Streaming finished; we still don't have the parsed meta (that arrives in
	 * the final sync), but no further deltas are coming.
	 */
	endStreaming = () => {
		this.argumentsStreaming = false;
	};

	/**
	 * Set the isOpen state
	 */
	setIsOpen = (isOpen: boolean) => {
		// set as open
		this.isOpen = isOpen;
	};

	/**
	 * Set the isExpanded state
	 */
	setIsExpanded = (isExpanded: boolean) => {
		this.isExpanded = isExpanded;
	};

	/**
	 * Update the parameters of the tool
	 */
	openTool = (display?: "inline" | "sidebar" | "hidden") => {
		if (this.isOpen) {
			// Tool is already open. If the new display is the same or undefined, move to front
			// if the new display is different, close and reopen in the new location
			if (display !== undefined && display !== this.display) {
				this.closeTool();
			}
		}

		// set as open
		this.isOpen = true;

		// update the display if it is defined
		if (display) {
			this.display = display;
		}

		if (this.display === "inline") {
			// noop. processed by component
		} else if (this.display === "sidebar") {
			// Default to sidebar
			this.room.addSidebarNode(this.nodeId, {
				type: "tab",
				name: this.json.title,
				component: "room-tool",
				config: {
					app: this.json._meta.SMSS_PROJECT_ID,
					message: this.toolCall.message?.id,
					toolId: this.json.id,
				},
				enableClose: true,
			});
		} else if (this.display === "hidden") {
			// noop
		}
	};

	/**
	 * Close the tool
	 */
	closeTool = () => {
		// close it
		this.isOpen = false;
		this.isExpanded = false;

		// close the previous location
		if (this.display === "inline") {
			// noop. processed by component
		} else if (this.display === "sidebar") {
			this.room.removeSidebarNode(this.nodeId);
		} else if (this.display === "hidden") {
			// noop
		}
	};
}
