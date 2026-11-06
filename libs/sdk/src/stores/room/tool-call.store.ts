import type { PendingAgentAction } from "../../types";
import type { InputMessageStore } from "./message/input-message.store";
import { ResponseMessageStore } from "./message/response-message.store";
import { ObservableStore } from "./observable-store";
import { MCP_EXECUTION_ASK } from "./room.constants";
import type {
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
} from "./room.types";
import type { RoomEngine } from "./room-engine.store";
import { getToolAppId } from "./room-tool-meta";

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
 * One tool call in a room: its call and result, its status through the tool
 * loop, the arguments streaming in, an agent run's pending decision on it,
 * and where it shows (inline, in the side panel, or hidden).
 *
 * Its own observable store; a change also tells its room.
 */
export class ToolCallStore extends ObservableStore {
	/** The room the call belongs to. */
	room: RoomEngine;

	/**
	 * Id for the tool
	 */
	id: string;

	/**
	 * What identifies this tool's side panel: a host's panel blueprint
	 * matches on `toolId`.
	 */
	get panelConfig() {
		return {
			app: getToolAppId(this.json._meta),
			message: this.toolCall.message?.id,
			toolId: this.json.id,
		};
	}

	/**
	 * Status for the tool
	 */
	status: "INITIAL" | "LOADING" | "CANCELLED" | "SUCCESS" | "ERROR" =
		"INITIAL";

	/**
	 * Parameters for the tool
	 */
	parameters: Record<string, unknown> = {};

	/**
	 * Set while an agent run is paused on this tool call awaiting a human
	 * decision (approve/edit/reject). Synced from the run's durable snapshot
	 * — see message/agent-harness.ts. Null for every tool outside an agent run.
	 */
	pendingAction: PendingAgentAction | null = null;

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
	 * Whether the stored TOOL_CALL part is the placeholder pushed while the call
	 * streams in, rather than the final part synced from the response. The
	 * placeholder carries a stubbed `_meta`, so `json` must not hand it out.
	 */
	isStreamingPlaceholder: boolean = false;

	/** The message whose `parts` actually contains this tool's TOOL_CALL. */
	get message() {
		return this.toolCall.message;
	}

	/**
	 * The last `json` and what it was made from. A read that finds them
	 * unchanged returns the same object, so a component that selects `json`
	 * renders, and runs its effects, only when the call really changed —
	 * decorating a call makes a new object, and a view keyed on it would
	 * otherwise render forever.
	 */
	private jsonCache: {
		part: PixelMessageToolCallPart | null;
		isStreamingPlaceholder: boolean;
		streamingName: string;
		options: unknown;
		value: PixelMessageToolCallPart["toolCall"];
	} | null = null;

	/**
	 * Json for the tool. The same object until the call's part, its streaming
	 * state or the room's options (which decide a work folder call's Ask or
	 * Auto) change.
	 */
	get json(): PixelMessageToolCallPart["toolCall"] {
		const { part } = this.toolCall;
		const options = this.room.options;
		const cache = this.jsonCache;
		if (
			cache &&
			cache.part === part &&
			cache.isStreamingPlaceholder === this.isStreamingPlaceholder &&
			cache.streamingName === this.streamingName &&
			cache.options === options
		) {
			return cache.value;
		}
		const value = this.buildJson();
		this.jsonCache = {
			part: part,
			isStreamingPlaceholder: this.isStreamingPlaceholder,
			streamingName: this.streamingName,
			options: options,
			value: value,
		};
		return value;
	}

	/**
	 * Make the call's json from its part.
	 *
	 * @returns The json.
	 */
	private buildJson = (): PixelMessageToolCallPart["toolCall"] => {
		const part = this.toolCall.part?.toolCall;
		// Server tools (provider-executed, e.g. web_search) skip the MCP _meta
		// block — synthesize one so downstream consumers see a consistent shape.
		if (part?.server_tool) {
			return buildServerToolJson(part);
		}
		// If the final part has arrived, use it. Otherwise (placeholder pushed
		// during streaming, or no part at all) synthesize from streamingName so
		// the pill renders the wire name until the final sync swaps it. Never key
		// this off a display field such as `title`: MCP tools are not required to
		// declare one, and a real part without a title would lose its `_meta`.
		// Work folder and connector calls get their metadata filled in by the
		// room's chat tools; every other part comes back as it is.
		if (part && !this.isStreamingPlaceholder) {
			return this.room.chatTools.decorateToolCall(part);
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
	};

	/**
	 * Whether the server-resolved tool part has synced. Until it has we only
	 * have wire-level data (id, raw name, partial args) from the SSE stream — no
	 * friendly title, description, or `_meta` — so the tool should render as a
	 * generic loading state rather than exposing the raw wire name. Mirrors the
	 * `json` getter's own resolved check — never key this off a display field
	 * such as `title`: MCP tools aren't required to declare one, and a titleless
	 * tool would otherwise never resolve.
	 *
	 * Distinct from `argumentsStreaming` (only true while deltas are still
	 * arriving): a tool stays unresolved through the gap between the terminal
	 * stream chunk and the final `sync()`, which is what prevents a flicker
	 * there.
	 */
	get isResolved(): boolean {
		return !!this.toolCall.part && !this.isStreamingPlaceholder;
	}

	/**
	 * Label to render for the tool. `title` is optional in MCP and the backend
	 * only stamps it on when the tool declares one, so fall back to the name.
	 * `_meta.SMSS_ORIGINAL_TOOL_NAME` is the name the tool declared before the
	 * backend rewrote it for the model, so it is preferred over `original_name`
	 * and `name`, which hold the rewritten wire name whenever the tool has no
	 * explicit function-name indirection. While streaming, all we have is the
	 * wire name.
	 */
	get displayName(): string {
		const json = this.json;
		return (
			json.title ||
			json._meta?.SMSS_ORIGINAL_TOOL_NAME ||
			json.original_name ||
			json.name ||
			""
		);
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
	 * @param room - The room the call belongs to.
	 * @param toolId - The call's id.
	 */
	constructor(room: RoomEngine, toolId: string) {
		super();
		this.room = room;
		this.id = toolId;
		// a call is part of its message, and so of its room
		this.propagateTo(() => this.toolCall.message ?? this.room);

		ObservableStore.observeFields<ToolCallStore>(this, [
			"status",
			"parameters",
			"pendingAction",
			"argumentsStreaming",
			"argumentsBuffer",
			"streamingName",
			"isStreamingPlaceholder",
			"response",
			"isOpen",
			"isExpanded",
			"display",
			// private, so outside the field names the type lists
			"toolCall" as never,
		]);
	}

	/**
	 * Update the tool with the new message information
	 * @param message - the message that contains the tool call information
	 * @param part - the part of the message that contains the tool call or result information
	 * @param options.placeholder - the part is the stub pushed while the call streams in
	 */
	syncMessage = (
		message: InputMessageStore | ResponseMessageStore,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
		options?: { placeholder?: boolean },
	) => {
		if (
			part.type === "TOOL_CALL" &&
			message instanceof ResponseMessageStore
		) {
			this.isStreamingPlaceholder = options?.placeholder === true;

			//set the parameters based on the json
			this.parameters = part.toolCall.arguments || {};

			// update the tool call information
			this.toolCall = {
				message: message,
				part,
			};

			// set the display from the resolved json, which is where a work
			// folder call gets its metadata. Server tools default to sidebar
			// since they have no SMSS_MCP_UI block
			this.display =
				this.json._meta?.SMSS_MCP_UI?.displayLocation || "sidebar";

			// once the final part has arrived, clear streaming bookkeeping
			if (!this.isStreamingPlaceholder) {
				this.argumentsStreaming = false;
				this.argumentsBuffer = "";
				this.streamingName = "";
			}
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
			} else if (
				part.toolResult.toolStatus === "cancelled" ||
				// "paused" is a legacy status, retired in favor of cancelled;
				// surface any persisted paused tools as cancelled.
				part.toolResult.toolStatus === "paused"
			) {
				this.status = "CANCELLED";
			} else {
				this.status = "SUCCESS";
			}
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
			// the room's host shows it in its side panel
			this.room.showToolPanel(this);
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
			this.room.hideToolPanel(this);
		} else if (this.display === "hidden") {
			// noop
		}
	};
}
