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

/** Row from the ListTraces reactor (new OTel-style trace table). */
export interface TraceRow {
	TRACE_ID: string;
	ROOM_ID: string | null;
	USER_ID: string;
	PROJECT_ID: string | null;
	HARNESS_NAME: string;
	STATUS: string;
	STARTED_AT: string;
	ENDED_AT: string | null;
	DURATION_MS: number;
	ITERATIONS: number;
	TOOL_CALL_COUNT: number;
	TOTAL_INPUT_TOKENS: number;
	TOTAL_OUTPUT_TOKENS: number;
	TOTAL_COST_USD: number;
	PARENT_TRACE_ID: string | null;
	ERROR_MESSAGE: string | null;
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
	DURATION_MS?: number;
	ERROR_MESSAGE: string | null;
	TOOL_CALL_ID: string;
	ENGINE_ID: string | null;
	ENGINE_TYPE: string | null;
	IS_MCP: boolean;
	STATUS: string;
}

export interface SpanRow {
	SPAN_ID: string;
	TRACE_ID: string;
	PARENT_SPAN_ID: string | null;
	KIND: string;
	NAME: string;
	STARTED_AT: string;
	ENDED_AT: string;
	DURATION_MS: number;
	STATUS: string;
	INPUT_TOKENS: number;
	OUTPUT_TOKENS: number;
	COST_USD: number;
	ERROR_MESSAGE: string | null;
}
