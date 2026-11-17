import type { PendingAgentAction } from "@semoss/sdk";
import type {
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
} from "../../../types";
import { MCP_EXECUTION_ASK } from "../../tools/mcp/mcp-constants";
import { getToolAppId } from "../../tools/mcp/mcp-utils";
import type { InputMessageStore } from "./input-message.store";
import type { MessageKey } from "./message-map";
import { ResponseMessageStore } from "./response-message.store";
import type { RoomStore } from "./room.store";
// direct, not through the barrel: these are plain constants, and the barrel
// re-enters this module
import { ROOM_PANEL_TYPES } from "./room-workbench-layout";
import { type ToolStatus, toToolStatus } from "./tool-status";

/**
 * Build a synthetic toolCall payload for server tools (e.g. provider-side
 * web_search) that the model provider executes itself. These calls arrive
 * without the MCP `_meta` block, so we fill in safe defaults — notably
 * `SMSS_MCP_EXECUTION: "disabled"` so the tool is never queued for client-side
 * execution.
 *
 * @param part - The provider's tool call.
 * @returns The call, with defaults for what it lacks.
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

/** Where a tool call shows: in the conversation, in the Workspace, or not at all. */
export type ToolDisplay = "inline" | "sidebar" | "hidden";

/** What a tool call holds. Every field is readonly. */
export interface ToolData {
	/** The call's id. */
	readonly id: string;
	/** Where the call stands. */
	readonly status: ToolStatus;
	/** The call's arguments, as the model sent them or the user edited them. */
	readonly parameters: Readonly<Record<string, unknown>>;
	/**
	 * Set while an agent run is paused on this call awaiting a human decision
	 * (approve, edit, reject), synced from the run's durable snapshot (see
	 * agent-turn-runner.ts). Null for every call outside an agent run.
	 */
	readonly pendingAction: PendingAgentAction | null;
	/** The partial JSON of `arguments` streamed so far; cleared by the final sync. */
	readonly argumentsBuffer: string;
	/** The wire name from the stream, shown until the final part brings the title. */
	readonly streamingName: string;
	/**
	 * Whether `part` is the placeholder pushed while the call streams in. It
	 * carries a stubbed `_meta`, so `json` does not hand it out.
	 */
	readonly isStreamingPlaceholder: boolean;
	/** The TOOL_CALL part, once one has synced. */
	readonly part: PixelMessageToolCallPart | null;
	/** The key of the message whose `parts` holds the TOOL_CALL, once one has synced. */
	readonly messageKey: MessageKey | null;
	/** The call's result, once it has one. */
	readonly response: string;
	/** Whether the call is open, in the conversation or the Workspace by `display`. */
	readonly isOpen: boolean;
	/** Whether an inline call is expanded to fill the conversation. */
	readonly isExpanded: boolean;
	/** Where the call shows when it is open. */
	readonly display: ToolDisplay;
	/**
	 * The call as the views read it (see {@link toToolJson}). Worked out again
	 * whenever its part or streamed name changes, and for every call when the
	 * room's options change.
	 */
	readonly json: PixelMessageToolCallPart["toolCall"];
}

/**
 * The call as the views read it.
 *
 * @param data - The call's id, part, and streamed name.
 * @param decorateToolCall - The room's chat tools, which fill in a work
 * folder or connector call's metadata from the room's options.
 * @returns Its part's call, filled in by the room's chat tools, or one made
 * from the wire name while it streams in.
 */
export const toToolJson = (
	{
		id,
		part,
		isStreamingPlaceholder,
		streamingName,
	}: Pick<
		ToolData,
		"id" | "part" | "isStreamingPlaceholder" | "streamingName"
	>,
	decorateToolCall: (
		call: PixelMessageToolCallPart["toolCall"],
	) => PixelMessageToolCallPart["toolCall"],
): PixelMessageToolCallPart["toolCall"] => {
	const call = part?.toolCall;
	// server tools (run by the model provider, e.g. web_search) have no MCP
	// _meta; make one so every reader sees the same shape
	if (call?.server_tool) {
		return buildServerToolJson(call);
	}
	// work folder and connector calls get their metadata from the room's
	// chat tools; every other final part comes back as it is
	if (call && !isStreamingPlaceholder) {
		return decorateToolCall(call);
	}
	return {
		id,
		title: streamingName,
		_meta: {
			SMSS_MCP_EXECUTION: MCP_EXECUTION_ASK,
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
		},
		name: streamingName,
		original_name: streamingName,
		description: "",
	} as PixelMessageToolCallPart["toolCall"];
};

/**
 * A call before anything has synced.
 *
 * @param id - The call's id.
 * @returns Its data.
 */
export const initialToolData = (id: string): ToolData => {
	const data = {
		id,
		status: "INITIAL",
		parameters: {},
		pendingAction: null,
		argumentsBuffer: "",
		streamingName: "",
		isStreamingPlaceholder: false,
		part: null,
		messageKey: null,
		response: "",
		isOpen: false,
		isExpanded: false,
		display: "sidebar",
	} as const;
	// with no part there is nothing to decorate
	return { ...data, json: toToolJson(data, (call) => call) };
};

/**
 * One tool call in a room, from its first streamed chunk to its result.
 *
 * A view over the room: its state is the entry under its id in the room's
 * `tools`, and its actions write there through the room. The room makes one
 * per call (`room.getOrCreateTool`); read it in React with `useTool`.
 */
export class ToolStore {
	/** The room the call is in. */
	readonly room: RoomStore;

	/** The call's id. */
	readonly id: string;

	/**
	 * @param room - The room the call is in, which already holds its data.
	 * @param toolId - The call's id.
	 */
	constructor(room: RoomStore, toolId: string) {
		this.room = room;
		this.id = toolId;
	}

	/** What the view reads once the room has deleted its call; made on first need. */
	private _empty: ToolData | undefined;

	/**
	 * The call's current data, from the room, or a call that has synced
	 * nothing once the room has deleted it, so a view held elsewhere never
	 * throws.
	 *
	 * @returns The data.
	 */
	getSnapshot = (): ToolData => {
		const data = this.room.getSnapshot().tools[this.id];
		if (data) {
			return data;
		}
		this._empty ??= initialToolData(this.id);
		return this._empty;
	};

	/**
	 * Listen for changes to the room, which holds the call.
	 *
	 * @param listener - Called after each change.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.room.subscribe(listener);

	/** Where the call stands. */
	get status(): ToolStatus {
		return this.getSnapshot().status;
	}

	/** The call's arguments, as the model sent them or the user edited them. */
	get parameters(): Readonly<Record<string, unknown>> {
		return this.getSnapshot().parameters;
	}

	/** The agent run's action paused on this call, or null. */
	get pendingAction(): PendingAgentAction | null {
		return this.getSnapshot().pendingAction;
	}

	/** The partial JSON of the arguments streamed so far. */
	get argumentsBuffer(): string {
		return this.getSnapshot().argumentsBuffer;
	}

	/** The wire name from the stream, until the final part brings the title. */
	get streamingName(): string {
		return this.getSnapshot().streamingName;
	}

	/** Whether the part it holds is the stub pushed while it streams in. */
	get isStreamingPlaceholder(): boolean {
		return this.getSnapshot().isStreamingPlaceholder;
	}

	/** The call's result, once it has one. */
	get response(): string {
		return this.getSnapshot().response;
	}

	/** Whether the call is open. */
	get isOpen(): boolean {
		return this.getSnapshot().isOpen;
	}

	/** Whether an inline call is expanded to fill the conversation. */
	get isExpanded(): boolean {
		return this.getSnapshot().isExpanded;
	}

	/** Where the call shows when it is open. */
	get display(): ToolDisplay {
		return this.getSnapshot().display;
	}

	/** The message whose `parts` holds this call's TOOL_CALL. */
	get message(): ResponseMessageStore | null {
		const { messageKey } = this.getSnapshot();
		const message =
			messageKey === null ? null : this.room.getMessageByKey(messageKey);
		return message instanceof ResponseMessageStore ? message : null;
	}

	/**
	 * What identifies this call's Workspace panel. The dock mints its own
	 * instance ids, so the panel's config is its identity, and the blueprint's
	 * `matches` compares `toolId`.
	 */
	get panelConfig() {
		return {
			app: getToolAppId(this.json._meta),
			message: this.message?.id,
			toolId: this.json.id,
		};
	}

	/** The call as the views read it. */
	get json(): PixelMessageToolCallPart["toolCall"] {
		return this.getSnapshot().json;
	}

	/**
	 * Whether the server-resolved part has synced. Until then there is only
	 * wire data (id, raw name, partial arguments), so the call renders as a
	 * generic loading state rather than its raw wire name. Never keyed off a
	 * display field such as `title`: MCP tools need not declare one.
	 * A call stays unresolved through the gap between the last streamed chunk
	 * and the final sync, which keeps it from flickering there.
	 */
	get isResolved(): boolean {
		const { part, isStreamingPlaceholder } = this.getSnapshot();
		return !!part && !isStreamingPlaceholder;
	}

	/**
	 * The label to show. `title` is optional in MCP, so it falls back to
	 * `_meta.SMSS_ORIGINAL_TOOL_NAME` (the name the tool declared before the
	 * backend rewrote it for the model), then `original_name` and `name`. While
	 * streaming, there is only the wire name.
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
	 * Take a call or result part from a message.
	 *
	 * @param message - The message that holds the part.
	 * @param part - The TOOL_CALL or TOOL_RESULT part.
	 * @param options.placeholder - The part is the stub pushed while the call
	 * streams in.
	 */
	syncMessage = (
		message: InputMessageStore | ResponseMessageStore,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
		options?: { placeholder?: boolean },
	): void => {
		if (
			part.type === "TOOL_CALL" &&
			message instanceof ResponseMessageStore
		) {
			const isStreamingPlaceholder = options?.placeholder === true;
			this.room.updateToolData(this.id, (current) => {
				const json = toToolJson(
					{ ...current, isStreamingPlaceholder, part },
					this.room.chatTools.decorateToolCall,
				);
				return {
					isStreamingPlaceholder,
					part,
					messageKey: message.key,
					json,
					parameters: part.toolCall.arguments || {},
					// the resolved json is where a work folder call gets its
					// metadata; server tools have no SMSS_MCP_UI, so sidebar
					display:
						json._meta?.SMSS_MCP_UI?.displayLocation || "sidebar",
					// the final part ends the streaming bookkeeping
					argumentsBuffer: isStreamingPlaceholder
						? current.argumentsBuffer
						: "",
					streamingName: isStreamingPlaceholder
						? current.streamingName
						: "",
				};
			});
		} else if (part.type === "TOOL_RESULT") {
			const { output, toolParameterValues, toolStatus } = part.toolResult;
			this.room.updateToolData(this.id, (current) => ({
				// server tool results do not echo the arguments back; keep the
				// ones the TOOL_CALL brought
				parameters: toolParameterValues ?? current.parameters,
				response: output,
				// server tool results usually have no status and come only on
				// success; "paused" is a retired status, shown as cancelled
				status: toToolStatus(
					toolStatus === "paused" ? "cancelled" : toolStatus,
				),
			}));
		}
	};

	/**
	 * Record the wire name from a streamed chunk.
	 *
	 * @param name - The name.
	 */
	setStreamingName = (name: string): void => {
		this.room.updateToolData(this.id, { streamingName: name });
	};

	/**
	 * Append a streamed `arguments` delta.
	 *
	 * @param delta - The next piece of the arguments' JSON.
	 */
	appendStreamingArguments = (delta: string): void => {
		this.room.updateToolData(this.id, (current) => ({
			argumentsBuffer: current.argumentsBuffer + delta,
		}));
	};

	/**
	 * Set where the call stands.
	 *
	 * @param status - The status.
	 */
	setStatus = (status: ToolStatus): void => {
		this.room.updateToolData(this.id, { status });
	};

	/**
	 * Record how the call ended.
	 *
	 * @param outcome.status - Its final status.
	 * @param outcome.response - What it returned, as the model reads it.
	 * @param outcome.parameters - The arguments it ran with, when they differ
	 * from the ones it has.
	 */
	settle = ({
		status,
		response,
		parameters,
	}: {
		status: ToolStatus;
		response: string;
		parameters?: Readonly<Record<string, unknown>>;
	}): void => {
		this.room.updateToolData(this.id, (current) => ({
			status,
			response,
			parameters: parameters ?? current.parameters,
		}));
	};

	/**
	 * Replace the call's arguments, as the user edited them.
	 *
	 * @param parameters - The arguments.
	 */
	setParameters = (parameters: Readonly<Record<string, unknown>>): void => {
		this.room.updateToolData(this.id, { parameters });
	};

	/**
	 * Set the agent run's pending decision on this call.
	 *
	 * @param pendingAction - The decision it waits for, or null.
	 */
	setPendingAction = (pendingAction: PendingAgentAction | null): void => {
		this.room.updateToolData(this.id, { pendingAction });
	};

	/**
	 * Mark the call open or closed, without moving it.
	 *
	 * @param isOpen - Whether it is open.
	 */
	setIsOpen = (isOpen: boolean): void => {
		this.room.updateToolData(this.id, { isOpen });
	};

	/**
	 * Expand an inline call to fill the conversation, or shrink it back.
	 *
	 * @param isExpanded - Whether it is expanded.
	 */
	setIsExpanded = (isExpanded: boolean): void => {
		this.room.updateToolData(this.id, { isExpanded });
	};

	/**
	 * Open the call where it shows, or move it. An open call asked to show
	 * somewhere else closes where it was first.
	 *
	 * @param display - Where to show it; where it shows now when left out.
	 */
	openTool = (display?: ToolDisplay): void => {
		const current = this.getSnapshot();
		if (
			current.isOpen &&
			display !== undefined &&
			display !== current.display
		) {
			this.closeTool();
		}
		this.room.updateToolData(this.id, {
			isOpen: true,
			display: display ?? current.display,
		});

		// an inline call is drawn by its component; a hidden one nowhere
		if (this.display === "sidebar") {
			this.room.openWorkbenchPanel(
				ROOM_PANEL_TYPES.TOOL,
				this.panelConfig,
				this.displayName,
			);
		}
	};

	/** Close the call where it shows. */
	closeTool = (): void => {
		this.room.updateToolData(this.id, { isOpen: false, isExpanded: false });
		if (this.getSnapshot().display === "sidebar") {
			this.room.closeWorkbenchPanel(
				ROOM_PANEL_TYPES.TOOL,
				this.panelConfig,
			);
		}
	};
}
