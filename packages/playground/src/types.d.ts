export interface Engine {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_type: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
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
	app_type?: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
}

export interface App {
	project_id: string;
	project_name: string;
	project_display_name?: string;
	description?: string;
	project_date_created: string;
	project_type: string;
	user_permission: number;
}

export interface Workspace {
	workspace_id: string;
	name: string;
	date_created: string; // ISO string
	description: string;
	system_prompt: string;
	mcp: MCPConfig[];
	prompts: string[];
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

export interface MCP {
	/** Type of the mcp */
	type: "PROJECT" | "STORAGE" | "DATABASE" | "FUNCTION" | "MODEL" | "VECTOR";

	/** Id of the mcp */
	id: string;

	/** Name of the mcp */
	name: string;

	/** Description of the mcp */
	description?: string;

	/** Tags of the mcp */
	tags: string[];

	permission: "READ_ONLY" | "EDIT" | "OWNER";
}

export type MCPConfig = Pick<MCP, "type" | "id" | "name"> & {
	/** Flag to indicate if this MCP comes from a workspace */
	fromWorkspace?: boolean;
};

/**
 * Item from the prompt library
 */
export interface Prompt {
	id: string;
	createdBy: string;
	dateCreated: string;
	version: number;
	intent: string;
	title: string;
	context: string;
	tags: string[];
	global: boolean;
}

/**
 * Messages from the backend
 */
export type PixelMessage = InputPixelMessage | ResponsePixelMessage;

export interface AbstractPixelMessage {
	io: "INPUT" | "OUTPUT";
	messageId: string;
	parentMessageId?: string;
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
	)[];
	tokens: number;
	ornaments: {
		modelName?: string;
	};
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
	)[];
	ornaments: {
		modelName?: string;
		PLAYGROUND_MESSAGE_TYPE?: "COT";
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
		title: string;
		description: string;
		// Set by the backend when the model provider executed the tool itself
		// (e.g. web_search). Server tools lack the MCP `_meta`
		// block and their TOOL_RESULT lands in the same response message.
		server_tool?: boolean;
		_meta: {
			SMSS_ENGINE_NAME: string;
			SMSS_ENGINE_ID: string;
			SMSS_ENGINE_TYPE: string;
			SMSS_PROJECT_NAME: string;
			SMSS_PROJECT_ID: string;
			SMSS_MCP_EXECUTION: "auto" | "ask" | "disabled";
			SMSS_MCP_UI?: {
				loadingMessage?: string;
				displayLocation?: "inline" | "sidebar" | "hidden";
				resourceURI?: string;
				autoOpen?: boolean;
			};
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
 * Plan
 */
export interface Plan {
	user_prompt: string;
	plan_id: string;
	steps: PlanStep[];
}

export interface PlanStep {
	step_number: number;
	step_name: string;
	description: string;
	type:
		| "tool_call"
		| "llm_reasoning"
		| "human_intervention"
		| "no_tool_available";
	status: "pending" | "in_progress" | "completed" | "failed";
	details:
		| {
				stepType: "tool_call";
				tool_name: string;
				parameters: Record<string, unknown>;
				rationaleForStep: string;
				title: string;
				_meta: {
					SMSS_PROJECT_NAME: string;
					SMSS_PROJECT_ID: string;
				};
		  }
		| {
				stepType: "llm_reasoning";
				prompt: string;
				rationaleForStep: string;
		  }
		| {
				stepType: "human_intervention";
				required_role: string;
				instructions: string;
				rationaleForStep: string;
		  }
		| {
				stepType: "no_tool_available";
				missing_capability: string;
				rationaleForStep: string;
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
