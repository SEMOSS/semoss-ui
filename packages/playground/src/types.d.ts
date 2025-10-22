export interface Engine {
	app_id: string;
	app_name: string;
	app_type: "STORAGE" | "DATABASE" | "FUNCTION";
	description?: string;
}

export interface App {
	project_id: string;
	project_name: string;
	description?: string;
	project_date_created: string;
}

export interface Workspace {
	workspace_id: string;
	name: string;
	date_created: string; // ISO string
	description: string;
	system_prompt: string;
	mcps: MCPConfig[];
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
	type: "PROJECT" | "STORAGE" | "DATABASE" | "FUNCTION";

	/** Id of the mcp */
	id: string;

	/** Name of the mcp */
	name: string;

	/** Description of the mcp */
	description: string;

	/** Tags of the mcp */
	tags: string[];
}

export type MCPConfig = Pick<MCP, "type" | "id" | "name">;

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
export type PixelMessage =
	| InputTextPixelMessage
	| InputToolExecPixelMessage
	| ResponseTextPixelMessage
	| ResponseToolPixelMessage;

interface AbstractPixelMessage {
	type: string;
	messageId: string;
	parentMessageId?: string;
	visible: boolean;
	dateCreated: string;
}

interface InputTextPixelMessage extends AbstractPixelMessage {
	type: "INPUT_TEXT";
	inputUIPrompt: string;
	files: {
		fileName: string;
		fileLocation: string;
	}[];
	modelId: string;
	paramMap: {
		max_new_tokens: number;
		temperature: number;
	};
}

interface InputToolExecPixelMessage extends AbstractPixelMessage {
	type: "INPUT_TOOL_EXEC";
	visible: false;
	tool_call_id: string;
	tool_name: string;
}

interface ResponseTextPixelMessage extends AbstractPixelMessage {
	type: "RESPONSE_TEXT";
	content: string;
	ornaments: {
		PLAYGROUND_MESSAGE_TYPE?: "COT";
	};
}

interface ResponseToolPixelMessage extends AbstractPixelMessage {
	type: "RESPONSE_TOOL";
	tool_responses: {
		/** tool execution id */
		id: string;

		/** meta data from the tool */
		_meta: {
			map: {
				SMSS_PROJECT_NAME: string;
				SMSS_PROJECT_ID: string;
			};
		};

		/**  Display of the tool **/
		title: string;

		/**  Name of function **/
		name: string;

		/** THIS IS A STRING, but ONLY in playground we parse as an app */
		/** THIS IS NOT USED IF THERE IS AN INPUT_TOOL_EXEC WITH THE SAME TOOL ID */
		arguments: Record<string, unknown>;
	}[];
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
					map: {
						SMSS_PROJECT_NAME: string;
						SMSS_PROJECT_ID: string;
					};
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
	};
	name: string;
	outputSchema?: {
		properties?: { [key: string]: object };
		required?: string[];
		type: "object";
	};
	title?: string;
}
