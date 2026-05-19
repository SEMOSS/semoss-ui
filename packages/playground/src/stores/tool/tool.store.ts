import { makeAutoObservable } from "mobx";
import { MCP_EXECUTION_ASK } from "@/constants";
import {
	InputMessageStore,
	ResponseMessageStore,
	type RoomStore,
} from "@/stores";
import type {
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
} from "@/types";

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
		// If the real part has arrived (has a title), use it. Otherwise (placeholder
		// pushed during streaming, or no part at all) synthesize from streamingName
		// so the pill renders the wire name until the final sync swaps it.
		if (part && part.title) {
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
	 * Tool result data
	 */
	private toolResult: {
		message: InputMessageStore | null;
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
			// set the display
			this.display =
				part.toolCall._meta.SMSS_MCP_UI?.displayLocation || "sidebar";

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
		} else if (
			part.type === "TOOL_RESULT" &&
			message instanceof InputMessageStore
		) {
			this.parameters = part.toolResult.toolParameterValues || {};
			this.response = part.toolResult.output;

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
