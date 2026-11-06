import type { MCPConfig, SkillConfig } from "@semoss/shared";

/** A model the user can pick, as the SDK lists it. */
export type { ModelEngine as Engine } from "@semoss/sdk";

/** A project (app) as the catalog lists it. */
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

/** An agent: the workspace that holds its instructions, tools and prompts. */
export interface Workspace {
	workspace_id: string;
	name: string;
	/** Catalog display name for user-facing labels, when available. */
	display_name?: string;
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

// The room engine's message types live in the SDK.
export type {
	AbstractPixelMessage,
	AgentRunMessageContext,
	InputPixelMessage,
	ModelRouting,
	PixelMessage,
	PixelMessageMediaPart,
	PixelMessageSubagentPart,
	PixelMessageTextPart,
	PixelMessageThinkingPart,
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
	ResponsePixelMessage,
	RoutingTrace,
} from "@semoss/sdk";
// Re-export types from shared to avoid breaking existing imports
export type {
	MCP,
	MCPConfig,
	Prompt,
	Skill,
	SkillConfig,
} from "@semoss/shared";

/** One tool of an MCP server, as its tool file defines it. */
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

/** An MCP server's tool file: its project and its tools. */
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
