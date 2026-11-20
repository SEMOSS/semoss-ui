import type { AgentRunStatusValue } from "@semoss/sdk";
import type { MCPConfig, SkillConfig } from "@semoss/shared";

/** An engine the user can see, as MyEngines returns it. Field names are the backend's. */
export interface Engine {
	/** The engine's id. */
	engine_id: string;
	/** The engine's name. */
	engine_name: string;
	/** The name to show, when it differs from `engine_name`. */
	engine_display_name?: string;
	/** What kind of engine it is; the chat's models are `MODEL`. */
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

/** A project (an app) the user can see, as the backend lists it. */
export interface App {
	/** The project's id. */
	project_id: string;
	/** The project's name. */
	project_name: string;
	/** The name to show, when it differs from `project_name`. */
	project_display_name?: string;
	/** The project's description. */
	description?: string;
	/** When the project was created. */
	project_date_created: string;
	/** The project's type. */
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

/** An agent, which the backend calls a workspace. Field names are the backend's. */
export interface Workspace {
	/** The agent's id. */
	workspace_id: string;
	/** The agent's name. */
	name: string;
	/** Catalog display name for user-facing labels, when available. */
	display_name?: string;
	/** When the agent was created, as an ISO string. */
	date_created: string;
	/** The agent's description. */
	description: string;
	/** The agent's system prompt. */
	system_prompt: string;
	/** The toolboxes the agent brings. */
	mcp: MCPConfig[];
	/** The skills the agent brings. */
	skills: SkillConfig[];
	/** The agent's suggested prompts. */
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

// Re-exported from shared so existing imports from this file keep working
export type {
	MCP,
	MCPConfig,
	Prompt,
	Skill,
	SkillConfig,
} from "@semoss/shared";

/** A message as the backend stores it: the user's input or a response. */
export type PixelMessage = InputPixelMessage | ResponsePixelMessage;

/** The agent run a message belongs to, and the subagent run it started, if any. */
export interface AgentRunMessageContext {
	/** The run the message belongs to. */
	runId: string;
	/** The run's role, as the backend names it. */
	role?: string;
	/** The run that started this one. */
	originatingRunId?: string;
	/** The subagent run this message started. */
	childRunId?: string;
	/** How the parent waits for the subagent run. */
	completionMode?: "WAIT" | "POST" | "POST_AND_CONTINUE" | string;
	/** The subagent run's status. */
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

/** The fields every stored message has, input or response. */
export interface AbstractPixelMessage {
	/** Whether the user sent it or the model returned it. */
	io: "INPUT" | "OUTPUT";
	/** The message's id. */
	messageId: string;
	/** The message it follows in the conversation tree. */
	parentMessageId?: string;
	summaryLeafMessageId?: string;
	/** Whether the conversation shows it. */
	visible: boolean;
	/** Whether the platform wrote it rather than the user or the model. */
	platform_generated: boolean;
	/** The model it was sent to. */
	modelId: string;
	/** The model's type. */
	modelType: string;
	/** When it was created. */
	dateCreated: string;
	/** Its content, in order. */
	parts: (
		| PixelMessageThinkingPart
		| PixelMessageTextPart
		| PixelMessageMediaPart
		| PixelMessageToolCallPart
		| PixelMessageToolResultPart
		| PixelMessageSubagentPart
	)[];
	/** The tokens it used. */
	tokens: number;
	/** The agent run it belongs to, in an agent room. */
	agentRun?: AgentRunMessageContext;
	/** Extra details shown with the message. */
	ornaments: {
		/** The model's name. */
		modelName?: string;
		/** Successful destination, separate from the selected router modelId. */
		routing?: ModelRouting;
		/** Legacy agent-run attribution; read-only fallback for existing rooms. */
		agentRunId?: string;
		agentRunRole?: string;
	};
	/** Whether the conversation above this message was compacted. */
	pruneToolsAbove: boolean;
}

/** A message the user sent, or a tool result sent back to the model. */
export interface InputPixelMessage extends AbstractPixelMessage {
	io: "INPUT";
	/** A typed message, or a tool execution's result. */
	type: "INPUT_TEXT" | "INPUT_TOOL_EXEC";
	parts: (
		| PixelMessageTextPart
		| PixelMessageMediaPart
		| PixelMessageToolResultPart
	)[];
}

/** A message the model returned. */
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
	/** The user's feedback on the response, once given. */
	feedback?: {
		/** True for a thumbs up, false for a thumbs down. */
		rating: boolean;
		/** What the user wrote. */
		feedbackText: string;
		/** The response it is about. */
		messageId: string;
		/** The kind of message it is about. */
		messageType: "RESPONSE_TEXT";
		/** When it was given, as `YYYY-MM-DD HH:MM:SS`. */
		feedbackDate: string;
	};
}

/** The model's reasoning, shown apart from its answer. */
export interface PixelMessageThinkingPart {
	type: "THINKING";
	/** The reasoning text. */
	thinking: string;
}

/** Text in a message. */
export interface PixelMessageTextPart {
	type: "TEXT";
	/** The text the model reads. */
	text: string;
	/** The text the conversation shows, when it differs. */
	uiText: string;
}

/** A file attached to a message. */
export interface PixelMessageMediaPart {
	type: "MEDIA";
	/** The file, inline or by location. */
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
	/** The call, with the tool's metadata. */
	toolCall: {
		/** The call's id, which its result names. */
		id: string;
		/** The call's type. */
		type: string;
		/** The tool's LLM-facing name. */
		name: string;
		/** The arguments the model passed. */
		arguments: Record<string, unknown>;
		/** Whether the backend found the tool the model named. */
		_tool_found: boolean;
		/** The tool's name before the backend rewrote it. */
		original_name: string;
		/**
		 * Optional in MCP: the backend only sets it when the tool declares one.
		 * Use ToolStore.displayName rather than reading this directly.
		 */
		title?: string;
		/** The tool's description. */
		description: string;
		/**
		 * Set by the backend when the model provider executed the tool itself
		 * (e.g. web_search). Server tools lack the MCP `_meta`
		 * block and their TOOL_RESULT lands in the same response message.
		 */
		server_tool?: boolean;
		/**
		 * Optional in practice, not just in MCP: platform-synthesized tools (e.g.
		 * SpawnSubAgent/CheckSubAgentStatus/WaitForSubAgent) don't get the usual
		 * MCP-project metadata enrichment, so their persisted TOOL_CALL omits it
		 * entirely. Always optional-chain reads of this field.
		 */
		_meta?: {
			SMSS_ENGINE_NAME: string;
			SMSS_ENGINE_ID: string;
			SMSS_ENGINE_TYPE: string;
			SMSS_PROJECT_NAME: string;
			SMSS_PROJECT_ID: string;
			/** Whether the call runs on its own, asks first, or is off. */
			SMSS_MCP_EXECUTION:
				| "auto"
				| "ask"
				| "disabled"
				| "agent-ask"
				| "agent-auto";
			/**
			 * The tool's declared name, before the backend rewrote it into the
			 * LLM-facing name. On length-limited providers that rewrite is not
			 * reversible (short engine-id prefix plus truncation), so this is the
			 * only way back to the real name.
			 */
			SMSS_ORIGINAL_TOOL_NAME?: string;
			/**
			 * The reactor a pixel tool runs, set by MakePixelMCP and
			 * MakeRoomPixelMCP. Identifies the connector tools in a room.
			 */
			SMSS_FUNCTION_NAME?: string;
			/**
			 * Set on the work folder tools, which the browser runs itself
			 * rather than the backend. See features/chat-tools.
			 */
			SMSS_CLIENT_TOOL?: boolean;
			/** How the call is shown. */
			SMSS_MCP_UI?: {
				/** Shown while the call runs. */
				loadingMessage?: string;
				/** Where the call's view goes. */
				displayLocation?: "inline" | "sidebar" | "hidden";
				/**
				 * The call's view: `component://<library>/<view>?<params>` for one
				 * the playground draws itself (features/tool-views),
				 * `system://<package>/<path>` for an app that ships with the web
				 * app, or a path in the project's portal.
				 */
				resourceURI?: string;
				/** Whether the view opens without the user asking. */
				autoOpen?: boolean;
			};
			/**
			 * Set only on platform-synthesized subagent tools (spawn/named/check/
			 * wait) — see SubAgentToolSynthesizer.
			 */
			SMSS_TOOL_KIND?:
				| "semoss_subagent_spawn"
				| "semoss_subagent_named"
				| "semoss_subagent_check"
				| "semoss_subagent_wait";
		};
	};
}

/**
 * How a room sends its messages.
 * - "chat": standard streaming chat (AskPlayground)
 * - "agent": server-side agent harness (RunAgent)
 */
export type ChatMode = "agent" | "chat";

/** How a tool call ended. */
export type ToolOutcome = "success" | "error" | "cancelled";

/** A tool call's result. */
export interface PixelMessageToolResultPart {
	type: "TOOL_RESULT";
	/** The result, and the call it answers. */
	toolResult: {
		/** The call it answers. */
		toolCallId: string;
		/** The tool's name. */
		toolName: string;
		/** What the tool returned. */
		output: string;
		/** The arguments the tool ran with. */
		toolParameterValues: Record<string, unknown>;
		/** How the call ended, or that it is paused for the user. */
		toolStatus: ToolOutcome | "paused";
	};
}

/**
 * A subagent spawned by an agent-run turn — see agent-turn-runner.ts. WIP: status
 * only, no alias/result/error rendering yet.
 */
export interface PixelMessageSubagentPart {
	type: "SUBAGENT";
	/** The subagent run. */
	subagent: {
		/** The subagent run's id. */
		id: string;
		/** The run's status. */
		status: AgentRunStatusValue;
		/** Named-subagent alias, when spawned via a named tool. Live only — never persisted, so absent after a reload. */
		alias?: string;
		/** Set once status is COMPLETED. */
		resultPreview?: string;
		/** Set once status is FAILED. */
		error?: string;
	};
}
