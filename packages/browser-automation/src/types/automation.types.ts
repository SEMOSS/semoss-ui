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
	error?: string;
}
