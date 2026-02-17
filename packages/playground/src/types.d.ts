export interface Engine {
	app_id: string;
	app_name: string;
	app_type: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
	description?: string;
}

export interface App {
	project_id: string;
	project_name: string;
	description?: string;
	project_date_created: string;
	project_type: string;
}

export interface Workspace {
	workspace_id: string;
	name: string;
	date_created: string; // ISO string
	description: string;
	system_prompt: string;
	mcp: MCPConfig[];
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
	description: string;

	/** Tags of the mcp */
	tags: string[];
}

export type MCPConfig = Pick<MCP, "type" | "id" | "name"> & {
	/** Flag to indicate if this MCP comes from a workspace */
	fromWorkspace?: boolean;
};

/**
 * Item from the prompt library
 */
export interface Prompt {
	ID: string;
	CREATED_BY: string;
	DATE_CREATED: string;
	VERSION: number;
	INTENT: string;
	TITLE: string;
	CONTEXT: string;
	tags: string[];
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
		base64Data: string;
		fileFormat: string;
		fileName: string;
		fileLocation: string;
		mediaInputType: "FILE";
		mimeType: string;
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
		toolStatus: "success" | "error" | "cancelled";
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
