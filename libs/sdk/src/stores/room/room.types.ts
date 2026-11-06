import type { AgentRunStatusValue, MCPToolConfig } from "../../types";

/**
 * A model engine, as `MyEngines` lists it. A room runs its turns on one.
 */
export interface ModelEngine {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_type:
		| "MODEL"
		| "STORAGE"
		| "DATABASE"
		| "FUNCTION"
		| "VECTOR"
		| "GUARDRAIL";
	engine_subtype?: string;
	engine_favorite?: number;
	engine_global?: boolean;
	engine_discoverable?: boolean;
	engine_user_permission?: number;
	engine_group_permission?: number;
	engine_date_created?: string;
	engine_cost?: string;
	low_engine_name?: string;
	description?: string;

	/** @deprecated legacy keys from MyEngines */
	app_id?: string;
	/** @deprecated legacy keys from MyEngines */
	app_name?: string;
	/** @deprecated legacy keys from MyEngines */
	app_type?:
		| "MODEL"
		| "STORAGE"
		| "DATABASE"
		| "FUNCTION"
		| "VECTOR"
		| "GUARDRAIL";
}

/** A predefined prompt a room offers, as the room's options keep it. */
export interface RoomPrompt {
	id: string;
	title: string;
	context: string;
	tags?: string[];
	version?: number;
	intent?: string;
}

/**
 * A room's options, as the room engine keeps them. A host may keep more
 * fields; `RoomEngine` is generic over its options type.
 */
export interface RoomEngineOptions {
	/** Instructions sent with every chat turn. */
	instructions: string;
	/**
	 * The room's toolboxes and knowledge: the user's own, and those its agent
	 * brings (`fromWorkspace`) or its own folder holds (`fromRoom`), which are
	 * shown but not stored.
	 */
	mcp: MCPToolConfig[];
	/** The agent the room started from. */
	workspace?: { workspace_id: string; name?: string };
	/** Prompts the composer offers. */
	predefinedPrompts: RoomPrompt[];
	/**
	 * The agent harness the room's messages run through (`semoss`). When
	 * set, the room is in agent mode and turns go through RunAgent.
	 */
	harnessType?: string;
	/** The model's temperature (0–1), sent when the host enables it. */
	temperature?: number;
	/**
	 * How the chat runs each default tool, by name, for the tools set apart
	 * from their usual way.
	 */
	defaultTools?: Record<string, "auto" | "ask" | "disabled">;
}

/** An agent (workspace) as `GetWorkspace` returns what a room reads of it. */
export interface RoomWorkspaceInfo {
	workspace_id: string;
	name: string;
	display_name?: string;
	system_prompt?: string;
	mcp?: MCPToolConfig[];
	config_json?: {
		model_id?: string;
		greeting?: string;
		greeting_enabled?: boolean;
	};
}

/**
 * A message as the backend stores it.
 */
export type PixelMessage = InputPixelMessage | ResponsePixelMessage;

/** Which agent run a message belongs to. */
export interface AgentRunMessageContext {
	runId: string;
	role?: string;
	originatingRunId?: string;
	childRunId?: string;
	completionMode?: "WAIT" | "POST" | "POST_AND_CONTINUE" | string;
	childStatus?: string;
}

/** Request-local routing evidence returned by the backend, without credentials. */
export interface RoutingTrace {
	trace_id?: string;
	routing_mode?: string;
	selection_source?: string;
	classifier_status?: string;
	classifier_engine_id?: string;
	classifier_engine_name?: string;
	classifier_kind?: string;
	classifier_model?: string;
	classifier_choice?: string;
	classifier_duration_ms?: number;
	classifier_error?: string;
	classifier_request?: unknown;
	classifier_response?: unknown;
	selected_engine_id?: string;
	selected_route_name?: string;
	fallback_used?: boolean;
	attempts?: { engine_id: string; engine_name?: string; status: string }[];
	downstream?: RoutingTrace;
}

/** Per-response attribution supplied by the model router after a successful call. */
export interface ModelRouting {
	router_engine_id?: string;
	routed_engine_id: string;
	routed_engine_name?: string;
	routed_route_name?: string;
	trace?: RoutingTrace;
}

/** What every stored message carries. */
export interface AbstractPixelMessage {
	io: "INPUT" | "OUTPUT";
	messageId: string;
	parentMessageId?: string;
	summaryLeafMessageId?: string;
	visible: boolean;
	platform_generated: boolean;
	modelId: string;
	modelType: string;
	dateCreated: string;
	parts: (
		| PixelMessageThinkingPart
		| PixelMessageTextPart
		| PixelMessageMediaPart
		| PixelMessageToolCallPart
		| PixelMessageToolResultPart
		| PixelMessageSubagentPart
	)[];
	tokens: number;
	agentRun?: AgentRunMessageContext;
	ornaments: {
		modelName?: string;
		/** Successful destination, separate from the selected router modelId. */
		routing?: ModelRouting;
		/** Legacy agent-run attribution; read-only fallback for existing rooms. */
		agentRunId?: string;
		agentRunRole?: string;
	};
	pruneToolsAbove: boolean;
}

/** A user turn, or the results of tool calls (`INPUT_TOOL_EXEC`). */
export interface InputPixelMessage extends AbstractPixelMessage {
	io: "INPUT";
	type: "INPUT_TEXT" | "INPUT_TOOL_EXEC";
	parts: (
		| PixelMessageTextPart
		| PixelMessageMediaPart
		| PixelMessageToolResultPart
	)[];
}

/** A model response. */
export interface ResponsePixelMessage extends AbstractPixelMessage {
	io: "OUTPUT";
	parts: (
		| PixelMessageTextPart
		| PixelMessageThinkingPart
		| PixelMessageMediaPart
		| PixelMessageToolCallPart
		| PixelMessageToolResultPart
		| PixelMessageSubagentPart
	)[];
	ornaments: {
		modelName?: string;
		/** Successful destination, separate from the selected router modelId. */
		routing?: ModelRouting;
		/** Legacy agent-run attribution; read-only fallback for existing rooms. */
		agentRunId?: string;
		agentRunRole?: string;
	};
	feedback?: {
		rating: boolean;
		feedbackText: string;
		messageId: string;
		messageType: "RESPONSE_TEXT";
		feedbackDate: string; // YYYY-MM-DD HH:MM:SS
	};
}

/** The model's reasoning, as it streamed. */
export interface PixelMessageThinkingPart {
	type: "THINKING";
	thinking: string;
}

/** Text, with the version the user saw (`uiText`). */
export interface PixelMessageTextPart {
	type: "TEXT";
	text: string;
	uiText: string;
}

/** A file sent with a message. */
export interface PixelMessageMediaPart {
	type: "MEDIA";
	mediaInfo: {
		base64Data?: string;
		fileFormat?: string;
		fileName: string;
		fileLocation?: string;
		mediaInputType: "FILE";
		mimeType?: string;
	};
}

/** A tool call the model made. */
export interface PixelMessageToolCallPart {
	type: "TOOL_CALL";
	toolCall: {
		id: string;
		type: string;
		name: string;
		arguments: Record<string, unknown>;
		_tool_found: boolean;
		original_name: string;
		// Optional in MCP: the backend only sets it when the tool declares one.
		// Use ToolStore.displayName rather than reading this directly.
		title?: string;
		description: string;
		// Set by the backend when the model provider executed the tool itself
		// (e.g. web_search). Server tools lack the MCP `_meta`
		// block and their TOOL_RESULT lands in the same response message.
		server_tool?: boolean;
		// Optional in practice, not just in MCP: platform-synthesized tools (e.g.
		// SpawnSubAgent/CheckSubAgentStatus/WaitForSubAgent) don't get the usual
		// MCP-project metadata enrichment, so their persisted TOOL_CALL omits it
		// entirely. Always optional-chain reads of this field.
		_meta?: {
			SMSS_ENGINE_NAME: string;
			SMSS_ENGINE_ID: string;
			SMSS_ENGINE_TYPE: string;
			SMSS_PROJECT_NAME: string;
			SMSS_PROJECT_ID: string;
			SMSS_MCP_EXECUTION:
				| "auto"
				| "ask"
				| "disabled"
				| "agent-ask"
				| "agent-auto";
			// The tool's declared name, before the backend rewrote it into the
			// LLM-facing name. On length-limited providers that rewrite is not
			// reversible (short engine-id prefix plus truncation), so this is the
			// only way back to the real name.
			SMSS_ORIGINAL_TOOL_NAME?: string;
			// The reactor a pixel tool runs, set by MakePixelMCP and
			// MakeRoomPixelMCP. Identifies the connector tools in a room.
			SMSS_FUNCTION_NAME?: string;
			// Set on the work folder tools, which the browser runs itself
			// rather than the backend. See features/chat-tools.
			SMSS_CLIENT_TOOL?: boolean;
			SMSS_MCP_UI?: {
				loadingMessage?: string;
				displayLocation?: "inline" | "sidebar" | "hidden";
				// The call's view: `component://<library>/<view>?<params>` for one
				// the playground draws itself (features/tool-views),
				// `system://<package>/<path>` for an app that ships with the web
				// app, or a path in the project's portal.
				resourceURI?: string;
				autoOpen?: boolean;
			};
			// Set only on platform-synthesized subagent tools (spawn/named/check/
			// wait) — see SubAgentToolSynthesizer.
			SMSS_TOOL_KIND?:
				| "semoss_subagent_spawn"
				| "semoss_subagent_named"
				| "semoss_subagent_check"
				| "semoss_subagent_wait";
		};
	};
}

/** A tool call's result. */
export interface PixelMessageToolResultPart {
	type: "TOOL_RESULT";
	toolResult: {
		toolCallId: string;
		toolName: string;
		output: string;
		toolParameterValues: Record<string, unknown>;
		toolStatus: "success" | "error" | "cancelled" | "paused";
	};
}

/**
 * A subagent spawned by an agent-run turn — see agent-harness.ts. WIP: status
 * only, no alias/result/error rendering yet.
 */
export interface PixelMessageSubagentPart {
	type: "SUBAGENT";
	subagent: {
		id: string;
		status: AgentRunStatusValue;
		/** Named-subagent alias, when spawned via a named tool. Live only — never persisted, so absent after a reload. */
		alias?: string;
		/** Set once status is COMPLETED. */
		resultPreview?: string;
		/** Set once status is FAILED. */
		error?: string;
	};
}

/** A tool call, as a TOOL_CALL part carries it. */
export type RoomToolCall = PixelMessageToolCallPart["toolCall"];
