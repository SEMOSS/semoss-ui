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
// export interface Prompt {
// 	ID: string;
// 	CREATED_BY: string;
// 	DATE_CREATED: string;
// 	VERSION: number;
// 	INTENT: string;
// 	TITLE: string;
// 	CONTEXT: string;
// 	tags: string[];
// }

/**
 * Messages from the backend
 */
export type PixelMessage =
	| InputTextPixelMessage
	| InputMediaPixelMessage
	| InputToolExecPixelMessage
	| ResponseTextPixelMessage
	| ResponseToolPixelMessage;

export interface AbstractPixelMessage {
	type: string;
	messageId: string;
	parentMessageId?: string;
	visible: boolean;
	dateCreated: string;
	tokens: number;
}

export interface InputTextPixelMessage extends AbstractPixelMessage {
	type: "INPUT_TEXT";
	inputUIPrompt: string;
	modelId: string;
	mediaInputs: {
		fileName: string;
		fileLocation?: string;
		base64Data?: string;
		mimeType?: string;
		imageType?: "FILE";
	}[];
	paramMap: {
		max_new_tokens: number;
		temperature: number;
	};
}

export interface InputMediaPixelMessage extends AbstractPixelMessage {
	type: "INPUT_MEDIA";
	inputUIPrompt: string;
	modelId: string;
	mediaInputs: {
		fileName: string;
		fileLocation?: string;
		base64Data?: string;
		mimeType?: string;
		imageType?: "FILE";
	}[];
	paramMap: {
		max_new_tokens: number;
		temperature: number;
	};
}

export interface InputToolExecPixelMessage extends AbstractPixelMessage {
	type: "INPUT_TOOL_EXEC";
	visible: false;
	tool_call_id: string;
	tool_name: string;
	tool_status: "error" | "cancelled" | "success";
	modelId: string;
	inputPrompt: string;
	ornaments: {
		modelName?: string;
	};
	tool_parameter_values?: Record<string, unknown>;
}

export interface ResponseTextPixelMessage extends AbstractPixelMessage {
	type: "RESPONSE_TEXT";
	content: string;
	modelId: string;
	thinking?: string;
	ornaments: {
		PLAYGROUND_MESSAGE_TYPE?: "COT";
		modelName?: string;
	};
	feedback?: {
		rating: boolean;
		feedbackText: string;
		messageId: string;
		messageType: "RESPONSE_TEXT";
		feedbackDate: string; // YYYY-MM-DD HH:MM:SS
	};
}

export type McpExecution = "auto" | "ask" | "disabled";

export type McpDisplay = "inline" | "sidebar" | "hidden";

interface ResponseToolPixelMessage extends AbstractPixelMessage {
	type: "RESPONSE_TOOL";
	thinking?: string;
	tool_responses: {
		/** tool execution id */
		id: string;

		/** meta data from the tool */
		_meta: {
			SMSS_PROJECT_NAME: string;
			SMSS_PROJECT_ID: string;
			SMSS_MCP_EXECUTION: McpExecution;
			SMSS_MCP_UI?: {
				loadingMessage?: string;
				displayLocation?: McpDisplay;
				resourceURI?: string;
			};
		};

		/**  Display of the tool **/
		title: string;

		/**  Name of function with app_id **/
		name: string;

		/**  Name of function in mcp json **/
		original_name: string;

		/** THIS IS A STRING, but ONLY in playground we parse as an app */
		/** THIS IS NOT USED IF THERE IS AN INPUT_TOOL_EXEC WITH THE SAME TOOL ID */
		arguments: Record<string, unknown>;

		/**  description of tool **/
		description: string;
	}[];
	modelId: string;
	ornaments: {
		modelName?: string;
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
			displayLocation?: McpDisplay;
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
