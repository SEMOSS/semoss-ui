export interface AgentTrace {
	TRACE_ID: string;
	ROOM_ID: string;
	USER_ID: string;
	PROJECT_ID: string | null;
	MODEL_ENGINE_ID: string;
	HARNESS_TYPE: string;
	START_TIME: string;
	END_TIME: string;
	ITERATIONS: number;
	TOOL_CALL_COUNT: number;
	TERMINATION_REASON: string;
	METRICS_JSON: string | null;
	PARENT_TRACE_ID: string | null;
}

export interface AgentTraceStep {
	STEP_ID: string;
	TRACE_ID: string;
	STEP_NUMBER: number;
	STEP_TYPE: string;
	TOOL_NAME: string;
	OUTPUT_TEXT: string | null;
	TOOL_INPUT_JSON: string | null;
	START_TIME: string;
	END_TIME: string;
	ERROR_MESSAGE: string | null;
	TOOL_CALL_ID: string;
	ENGINE_ID: string | null;
	ENGINE_TYPE: string | null;
	IS_MCP: boolean;
	STATUS: string;
}
