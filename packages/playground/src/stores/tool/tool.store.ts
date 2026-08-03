import { createStore } from "zustand/vanilla";
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

export interface ToolStoreState {
	status:
		| "INITIAL"
		| "LOADING"
		| "CANCELLED"
		| "SUCCESS"
		| "ERROR"
		| "PAUSED";
	parameters: Record<string, unknown>;
	argumentsStreaming: boolean;
	argumentsBuffer: string;
	streamingName: string;
	response: string;
	isOpen: boolean;
	isExpanded: boolean;
	display: "inline" | "sidebar" | "hidden";
	toolCall: {
		message: ResponseMessageStore | null;
		part: PixelMessageToolCallPart | null;
	};
	toolResult: {
		message: InputMessageStore | ResponseMessageStore | null;
		part: PixelMessageToolResultPart | null;
	};
}

/**
 * Tool
 */
export class ToolStore {
	readonly room: RoomStore;
	readonly id: string;

	private _zustand = createStore<ToolStoreState>()(() => ({
		status: "INITIAL" as const,
		parameters: {},
		argumentsStreaming: false,
		argumentsBuffer: "",
		streamingName: "",
		response: "",
		isOpen: false,
		isExpanded: false,
		display: "sidebar" as const,
		toolCall: { message: null, part: null },
		toolResult: { message: null, part: null },
	}));

	/** Expose Zustand StoreApi for `useStore(tool, selector)` in components */
	readonly getState = (): ToolStoreState => this._zustand.getState();
	readonly subscribe = (
		listener: (state: ToolStoreState, prev: ToolStoreState) => void,
	): (() => void) => this._zustand.subscribe(listener);
	readonly getInitialState = (): ToolStoreState =>
		this._zustand.getInitialState();

	private get _s() {
		return this._zustand.getState();
	}

	constructor(room: RoomStore, toolId: string) {
		this.room = room;
		this.id = toolId;
	}

	/** Getters */

	get nodeId() {
		return `tool--${this.id}`;
	}

	get status() {
		return this._s.status;
	}

	set status(value: ToolStoreState["status"]) {
		this._zustand.setState({ status: value });
	}

	get parameters() {
		return this._s.parameters;
	}

	set parameters(value: Record<string, unknown>) {
		this._zustand.setState({ parameters: value });
	}

	get argumentsStreaming() {
		return this._s.argumentsStreaming;
	}

	get argumentsBuffer() {
		return this._s.argumentsBuffer;
	}

	get streamingName() {
		return this._s.streamingName;
	}

	get response() {
		return this._s.response;
	}

	set response(value: string) {
		this._zustand.setState({ response: value });
	}

	get isOpen() {
		return this._s.isOpen;
	}

	set isOpen(value: boolean) {
		this._zustand.setState({ isOpen: value });
	}

	get isExpanded() {
		return this._s.isExpanded;
	}

	get display() {
		return this._s.display;
	}

	get json() {
		const part = this._s.toolCall.part?.toolCall;
		if (part?.server_tool) {
			return buildServerToolJson(part);
		}
		if (part?.title) {
			return part;
		}
		const name = this._s.streamingName;
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

	syncMessage = (
		message: InputMessageStore | ResponseMessageStore,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
	) => {
		if (
			part.type === "TOOL_CALL" &&
			message instanceof ResponseMessageStore
		) {
			this._zustand.setState({
				display:
					part.toolCall._meta?.SMSS_MCP_UI?.displayLocation ||
					"sidebar",
				parameters: part.toolCall.arguments || {},
				argumentsStreaming: false,
				argumentsBuffer: "",
				streamingName: "",
				toolCall: { message, part },
			});
		} else if (part.type === "TOOL_RESULT") {
			const updates: Partial<ToolStoreState> = {
				toolResult: { message, part },
			};
			if (part.toolResult.toolParameterValues) {
				updates.parameters = part.toolResult.toolParameterValues;
			}
			updates.response = part.toolResult.output;
			if (part.toolResult.toolStatus === "error") {
				updates.status = "ERROR";
			} else if (part.toolResult.toolStatus === "cancelled") {
				updates.status = "CANCELLED";
			} else if (part.toolResult.toolStatus === "paused") {
				updates.status = "PAUSED";
			} else {
				updates.status = "SUCCESS";
			}
			this._zustand.setState(updates);
		}
	};

	beginStreaming = () => {
		this._zustand.setState({
			argumentsStreaming: true,
			argumentsBuffer: "",
		});
	};

	setStreamingName = (name: string) => {
		this._zustand.setState({ streamingName: name });
	};

	appendStreamingArguments = (delta: string) => {
		this._zustand.setState((s) => ({
			argumentsBuffer: s.argumentsBuffer + delta,
		}));
	};

	endStreaming = () => {
		this._zustand.setState({ argumentsStreaming: false });
	};

	setIsOpen = (isOpen: boolean) => {
		this._zustand.setState({ isOpen });
	};

	setIsExpanded = (isExpanded: boolean) => {
		this._zustand.setState({ isExpanded });
	};

	openTool = (display?: "inline" | "sidebar" | "hidden") => {
		const current = this._s;
		if (current.isOpen) {
			if (display !== undefined && display !== current.display) {
				this.closeTool();
			}
		}

		const updates: Partial<ToolStoreState> = { isOpen: true };
		if (display) {
			updates.display = display;
		}
		this._zustand.setState(updates);

		const effectiveDisplay = display ?? current.display;
		if (effectiveDisplay === "sidebar") {
			this.room.addSidebarNode(this.nodeId, {
				type: "tab",
				name: this.json.title,
				component: "room-tool",
				config: {
					app: this.json._meta.SMSS_PROJECT_ID,
					message: this._s.toolCall.message?.id,
					toolId: this.json.id,
				},
				enableClose: true,
			});
		}
	};

	closeTool = () => {
		const { display } = this._s;
		this._zustand.setState({ isOpen: false, isExpanded: false });
		if (display === "sidebar") {
			this.room.removeSidebarNode(this.nodeId);
		}
	};
}
