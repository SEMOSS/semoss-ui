import { computed, createAtom } from "mobx";
import type { PendingAgentAction } from "@semoss/sdk";
import { StoreState } from "@semoss/utility/store";
import type {
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
} from "../../types";
import { MCP_EXECUTION_ASK } from "../mcp/mcp-constants";
import { getToolAppId } from "../mcp/mcp-utils";
import type { RoomStore } from "../room/room.store";
// direct, not through the barrel: these are plain constants, and the barrel
// re-enters this module
import { ROOM_PANEL_TYPES } from "../room/room-sidebar";
import type { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";

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

/** Where a tool call stands. */
export type ToolStatus =
	| "INITIAL"
	| "LOADING"
	| "CANCELLED"
	| "SUCCESS"
	| "ERROR";

/** Where a tool call shows: in the conversation, in the Workspace, or not at all. */
export type ToolDisplay = "inline" | "sidebar" | "hidden";

/** What a tool call holds. Every field is readonly. */
export interface ToolSnapshot {
	readonly status: ToolStatus;
	/** The call's arguments, as the model sent them or the user edited them. */
	readonly parameters: Readonly<Record<string, unknown>>;
	/**
	 * Set while an agent run is paused on this call awaiting a human decision
	 * (approve, edit, reject), synced from the run's durable snapshot (see
	 * agent-harness.ts). Null for every call outside an agent run.
	 */
	readonly pendingAction: PendingAgentAction | null;
	/**
	 * Whether the call is still streaming in (name and arguments arriving over
	 * SSE). Until the final part syncs it has no `_meta`, title, or parsed
	 * arguments and is not interactive.
	 */
	readonly argumentsStreaming: boolean;
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
	readonly response: string;
	readonly isOpen: boolean;
	/** Whether an inline call is expanded to fill the conversation. */
	readonly isExpanded: boolean;
	readonly display: ToolDisplay;
}

const INITIAL_TOOL: ToolSnapshot = {
	status: "INITIAL",
	parameters: {},
	pendingAction: null,
	argumentsStreaming: false,
	argumentsBuffer: "",
	streamingName: "",
	isStreamingPlaceholder: false,
	part: null,
	response: "",
	isOpen: false,
	isExpanded: false,
	display: "sidebar",
};

/**
 * One tool call in a room, from its first streamed chunk to its result.
 *
 * Its state is a `StoreState`; read it in React with `useTool`. Until the
 * room and message stores leave MobX, every read also reports to a MobX atom
 * and every change tells it, so their getters and `observer` components keep
 * tracking it.
 */
export class ToolStore {
	/** The room the call is in. */
	readonly room: RoomStore;

	/** The call's id. */
	readonly id: string;

	private readonly state = new StoreState<ToolSnapshot>(INITIAL_TOOL);

	/** The MobX adapter; goes with the last MobX reader. */
	private readonly atom = createAtom("ToolStore");

	/**
	 * `json`, cached while something observes it, as it was as a MobX
	 * computed: it reads the room's options, which are still MobX.
	 */
	private readonly jsonValue = computed(() =>
		this.toJson(this.getSnapshot()),
	);

	/** The message whose `parts` holds this call's TOOL_CALL. */
	private toolMessage: ResponseMessageStore | null = null;

	/**
	 * @param room - The room the call is in.
	 * @param toolId - The call's id.
	 */
	constructor(room: RoomStore, toolId: string) {
		this.room = room;
		this.id = toolId;
		this.state.subscribe(() => this.atom.reportChanged());
	}

	getSnapshot = (): ToolSnapshot => {
		this.atom.reportObserved();
		return this.state.getSnapshot();
	};

	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	get status(): ToolStatus {
		return this.getSnapshot().status;
	}

	get parameters(): Readonly<Record<string, unknown>> {
		return this.getSnapshot().parameters;
	}

	get pendingAction(): PendingAgentAction | null {
		return this.getSnapshot().pendingAction;
	}

	get argumentsStreaming(): boolean {
		return this.getSnapshot().argumentsStreaming;
	}

	get argumentsBuffer(): string {
		return this.getSnapshot().argumentsBuffer;
	}

	get streamingName(): string {
		return this.getSnapshot().streamingName;
	}

	/** Whether the part it holds is the stub pushed while it streams in. */
	get isStreamingPlaceholder(): boolean {
		return this.getSnapshot().isStreamingPlaceholder;
	}

	get response(): string {
		return this.getSnapshot().response;
	}

	get isOpen(): boolean {
		return this.getSnapshot().isOpen;
	}

	get isExpanded(): boolean {
		return this.getSnapshot().isExpanded;
	}

	get display(): ToolDisplay {
		return this.getSnapshot().display;
	}

	/** The message whose `parts` holds this call's TOOL_CALL. */
	get message(): ResponseMessageStore | null {
		// the message comes with the part, so reading the part tracks it
		this.getSnapshot();
		return this.toolMessage;
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
		return this.jsonValue.get();
	}

	/**
	 * Whether the server-resolved part has synced. Until then there is only
	 * wire data (id, raw name, partial arguments), so the call renders as a
	 * generic loading state rather than its raw wire name. Never keyed off a
	 * display field such as `title`: MCP tools need not declare one.
	 *
	 * Distinct from `argumentsStreaming`, which is true only while deltas
	 * arrive: a call stays unresolved through the gap between the last chunk
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
			this.toolMessage = message;
			this.state.update((current) => {
				const next = { ...current, isStreamingPlaceholder, part };
				return {
					isStreamingPlaceholder,
					part,
					parameters: part.toolCall.arguments || {},
					// the resolved json is where a work folder call gets its
					// metadata; server tools have no SMSS_MCP_UI, so sidebar
					display:
						this.toJson(next)._meta?.SMSS_MCP_UI?.displayLocation ||
						"sidebar",
					// the final part ends the streaming bookkeeping
					argumentsStreaming:
						isStreamingPlaceholder && current.argumentsStreaming,
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
			this.state.update((current) => ({
				// server tool results do not echo the arguments back; keep the
				// ones the TOOL_CALL brought
				parameters: toolParameterValues ?? current.parameters,
				response: output,
				// server tool results usually have no status and come only on
				// success; "paused" is a retired status, shown as cancelled
				status:
					toolStatus === "error"
						? "ERROR"
						: toolStatus === "cancelled" || toolStatus === "paused"
							? "CANCELLED"
							: "SUCCESS",
			}));
		}
	};

	/** The first streamed chunk arrived: the call is streaming in. */
	beginStreaming = (): void => {
		this.state.update({ argumentsStreaming: true, argumentsBuffer: "" });
	};

	/**
	 * Record the wire name from a streamed chunk.
	 *
	 * @param name - The name.
	 */
	setStreamingName = (name: string): void => {
		this.state.update({ streamingName: name });
	};

	/**
	 * Append a streamed `arguments` delta.
	 *
	 * @param delta - The next piece of the arguments' JSON.
	 */
	appendStreamingArguments = (delta: string): void => {
		this.state.update((current) => ({
			argumentsBuffer: current.argumentsBuffer + delta,
		}));
	};

	/** No more deltas are coming; the parsed `_meta` arrives with the final sync. */
	endStreaming = (): void => {
		this.state.update({ argumentsStreaming: false });
	};

	/**
	 * Set where the call stands.
	 *
	 * @param status - The status.
	 */
	setStatus = (status: ToolStatus): void => {
		this.state.update({ status });
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
		this.state.update((current) => ({
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
		this.state.update({ parameters });
	};

	/**
	 * Set the agent run's pending decision on this call.
	 *
	 * @param pendingAction - The decision it waits for, or null.
	 */
	setPendingAction = (pendingAction: PendingAgentAction | null): void => {
		this.state.update({ pendingAction });
	};

	/**
	 * Mark the call open or closed, without moving it.
	 *
	 * @param isOpen - Whether it is open.
	 */
	setIsOpen = (isOpen: boolean): void => {
		this.state.update({ isOpen });
	};

	/**
	 * Expand an inline call to fill the conversation, or shrink it back.
	 *
	 * @param isExpanded - Whether it is expanded.
	 */
	setIsExpanded = (isExpanded: boolean): void => {
		this.state.update({ isExpanded });
	};

	/**
	 * Open the call where it shows, or move it. An open call asked to show
	 * somewhere else closes where it was first.
	 *
	 * @param display - Where to show it; where it shows now when left out.
	 */
	openTool = (display?: ToolDisplay): void => {
		const current = this.state.getSnapshot();
		if (
			current.isOpen &&
			display !== undefined &&
			display !== current.display
		) {
			this.closeTool();
		}
		this.state.update({
			isOpen: true,
			display: display ?? current.display,
		});

		// an inline call is drawn by its component; a hidden one nowhere
		if (this.display === "sidebar") {
			this.room.openSidebarPanel(
				ROOM_PANEL_TYPES.TOOL,
				this.panelConfig,
				this.displayName,
			);
		}
	};

	/** Close the call where it shows. */
	closeTool = (): void => {
		this.state.update({ isOpen: false, isExpanded: false });
		if (this.state.getSnapshot().display === "sidebar") {
			this.room.closeSidebarPanel(
				ROOM_PANEL_TYPES.TOOL,
				this.panelConfig,
			);
		}
	};

	/**
	 * The call as the views read it, from a snapshot.
	 *
	 * @param snapshot - The call's state.
	 * @returns Its part's call, filled in by the room's chat tools, or one made
	 * from the wire name while it streams in.
	 */
	private toJson = ({
		part,
		isStreamingPlaceholder,
		streamingName,
	}: Pick<
		ToolSnapshot,
		"part" | "isStreamingPlaceholder" | "streamingName"
	>): PixelMessageToolCallPart["toolCall"] => {
		const call = part?.toolCall;
		// server tools (run by the model provider, e.g. web_search) have no MCP
		// _meta; make one so every reader sees the same shape
		if (call?.server_tool) {
			return buildServerToolJson(call);
		}
		// work folder and connector calls get their metadata from the room's
		// chat tools; every other final part comes back as it is
		if (call && !isStreamingPlaceholder) {
			return this.room.chatTools.decorateToolCall(call);
		}
		return {
			id: this.id,
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
}
