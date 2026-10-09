import type { AgentRunStatusValue } from "@semoss/sdk";

export interface Engine {
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

export interface App {
	project_id: string;
	project_name: string;
	project_display_name?: string;
	description?: string;
	project_date_created: string;
	project_type: string;
	/** The user's own grant; null when only a group grants access. */
	user_permission: number;
	/**
	 * The effective permission: the better of the user's own grant and their
	 * groups' grant. Null for a global project the user holds no grant on, and
	 * for discoverable projects the user cannot access yet.
	 */
	permission?: number | null;
	/** Whether everyone on the server can use the project. */
	project_global?: boolean;
	/** When the project was last edited. */
	project_date_last_edited?: string;
}

export interface Workspace {
	workspace_id: string;
	name: string;
	date_created: string; // ISO string
	description: string;
	system_prompt: string;
	mcp: MCPConfig[];
	skills: SkillConfig[];
	prompts: string[];

	/** Agent settings saved on the workspace by the agent editor. */
	config_json?: {
		/**
		 * The agent's default model. Absent or empty means the agent has no
		 * opinion and the room's own model is used.
		 */
		model_id?: string;
		/**
		 * The agent's scripted opening message. Shown only when
		 * `greeting_enabled` is true; never sent to the model as context.
		 */
		greeting?: string;
		/** Whether `greeting` is shown. Toggling this off keeps the authored text. */
		greeting_enabled?: boolean;
	};
}

/**
 * Instructions from the backend
 */
export interface Instructions {
	/** ID of the instructions */
	id: string;

	/** Description */
	description: string;

	/** Context info */
	context: string;
}

// Re-export types from shared to avoid breaking existing imports
export type {
	MCP,
	MCPConfig,
	Prompt,
	Skill,
	SkillConfig,
} from "@semoss/shared";

/**
 * Messages from the backend
 */
export type PixelMessage = InputPixelMessage | ResponsePixelMessage;

export interface AgentRunMessageContext {
	runId: string;
	role?: string;
	originatingRunId?: string;
	childRunId?: string;
	completionMode?: "WAIT" | "POST" | "POST_AND_CONTINUE" | string;
	childStatus?: string;
}

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
		/** Legacy agent-run attribution; read-only fallback for existing rooms. */
		agentRunId?: string;
		agentRunRole?: string;
	};
	pruneToolsAbove: boolean;
}

export interface InputPixelMessage extends AbstractPixelMessage {
	io: "INPUT";
	type: "INPUT_TEXT" | "INPUT_TOOL_EXEC";
	parts: (
		| PixelMessageTextPart
		| PixelMessageMediaPart
		| PixelMessageToolResultPart
	)[];
}

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

export interface PixelMessageThinkingPart {
	type: "THINKING";
	thinking: string;
}

export interface PixelMessageTextPart {
	type: "TEXT";
	text: string;
	uiText: string;
}

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
				| "yesno"
				| "agent-ask"
				| "agent-auto"
				| "agent-yesno";
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

export interface MCPTool {
	description?: string;
	inputSchema: {
		properties?: { [key: string]: object };
		required?: string[];
		type: "object";
		title: string;
	};
	name: string;
	outputSchema?: {
		properties?: { [key: string]: object };
		required?: string[];
		type: "object";
	};
	title?: string;
	original_name: string;
	description?: string;
	title?: string;
	_meta: {
		generated_on: string;
		SMSS_MCP_UI?: {
			loadingMessage?: string;
			// `component://`, `system://`, or a portal path, as on a tool call.
			resourceURI?: string;
			displayLocation?: "inline" | "sidebar" | "hidden";
			autoOpen?: boolean;
		};
	};
}

export interface ToolStructure {
	_meta: {
		SMSS_PROJECT_NAME: string;
		SMSS_PROJECT_ID: string;
		SMSS_ENGINE_NAME: string;
		SMSS_ENGINE_TYPE: string;
		SMSS_ENGINE_ID: string;
	};
	tools: MCPTool[];
}

export interface User {
	date_added: string;
	name: string;
	permission: string;
	id: string;
	type: string;
	email: string;
}

export interface ProjectDependency {
	engine_type:
		| "PROJECT"
		| "STORAGE"
		| "DATABASE"
		| "FUNCTION"
		| "MODEL"
		| "VECTOR";
	engine_id: string;
	engine_name: string;
	engine_subtype?: string;
	description?: string;
	engine_discoverable?: boolean;
	permission_name?: "READ_ONLY" | "EDIT" | "OWNER";
	engine_global?: boolean;
	access_permission?: number; // The permission level the user has requested, if any
	tags?: string; // comma separated tags
	can_view_dependencies?: boolean;
	engine_date_created?: string;
	dependencies?: string[]; // Array of dependency engine IDs
}
