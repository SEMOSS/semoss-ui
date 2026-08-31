export interface WebMcpTool {
	name: string;
	title: string;
	description: string;
	origin: string;
	inputSchema: Record<string, unknown>;
	annotations: Record<string, unknown>;
}

export interface WebMcpDiscovery {
	supported: boolean;
	tools: WebMcpTool[];
	message: string;
	isLoading: boolean;
	error: string;
}

export interface AutomationHistoryEntry {
	iteration: number;
	type: "webmcp" | "click" | "fill" | "select" | "scroll";
	label: string;
	value?: string;
	pageUrl: string;
	reason: string;
	status: "success" | "failed";
	toolName?: string;
	toolArguments?: Record<string, unknown>;
	/** Output the WebMCP tool returned, truncated for prompt reuse. */
	toolResult?: string;
	elapsedMs?: number;
	error?: string;
}

/** What the goal-automation loop is currently doing, for progress reporting. */
export type AutomationPhase = "idle" | "planning" | "acting";

export interface AutomationRunStatus {
	phase: AutomationPhase;
	iteration: number;
	maxIterations: number;
	/** Human-readable description of the in-flight step. */
	detail: string;
}
