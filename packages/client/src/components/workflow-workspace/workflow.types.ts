/** All node types supported by the workflow builder */
export type WorkflowNodeType =
	| "trigger"
	| "database-engine"
	| "storage-engine"
	| "vector-engine"
	| "model-engine"
	| "function-engine"
	| "custom-pixel"
	| "transform"
	| "conditional"
	| "fan-out";

export interface TriggerConfig {
	mode: "manual" | "schedule";
	cronExpression?: string;
}

export interface DatabaseEngineConfig {
	engineId: string;
	operation: "query" | "update";
	expression: string;
}

export interface StorageEngineConfig {
	engineId: string;
	operation: "list" | "read" | "write";
	path?: string;
}

export interface VectorEngineConfig {
	engineId: string;
	operation: "query" | "embed";
	expression?: string;
}

export interface ModelEngineConfig {
	engineId: string;
	promptTemplate: string;
}

export interface FunctionEngineConfig {
	engineId: string;
	paramsExpression?: string;
}

export interface CustomPixelConfig {
	pixel: string;
}

export interface TransformConfig {
	operation: "map" | "filter" | "reduce" | "flatten";
	expression: string;
}

export interface ConditionalConfig {
	condition: string;
}

export interface FanOutConfig {
	inputVar: string;
	itemAlias: string;
	parallelism?: number;
}

export type WorkflowNodeConfig =
	| TriggerConfig
	| DatabaseEngineConfig
	| StorageEngineConfig
	| VectorEngineConfig
	| ModelEngineConfig
	| FunctionEngineConfig
	| CustomPixelConfig
	| TransformConfig
	| ConditionalConfig
	| FanOutConfig;

export interface WorkflowNode {
	id: string;
	type: WorkflowNodeType;
	label: string;
	config: WorkflowNodeConfig;
	position?: { x: number; y: number };
}

export interface WorkflowEdge {
	id: string;
	source: string;
	target: string;
}

export interface WorkflowDocument {
	version: string;
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
}

export interface EngineOption {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_type: string;
}

export interface WorkflowRunNodeResult {
	nodeId: string;
	nodeType: string;
	status: "success" | "error" | "skipped";
	output?: string;
	error?: string;
	elapsedMs: number;
}

export interface WorkflowRunSummary {
	runId: string;
	projectId: string;
	startedAt: string;
	status: "success" | "error";
	nodeCount: number;
}

export interface WorkflowRunDetail extends WorkflowRunSummary {
	nodeResults: WorkflowRunNodeResult[];
}

/** Palette entry — one card per node type in the left sidebar */
export interface NodePaletteMeta {
	type: WorkflowNodeType;
	label: string;
	description: string;
	color: string;
	defaultConfig: WorkflowNodeConfig;
}

export const NODE_PALETTE: NodePaletteMeta[] = [
	{
		type: "trigger",
		label: "Trigger",
		description: "Start the workflow manually or on a schedule",
		color: "#7c3aed",
		defaultConfig: { mode: "manual" } as TriggerConfig,
	},
	{
		type: "model-engine",
		label: "Model Engine",
		description: "Call an LLM with a prompt template",
		color: "#2563eb",
		defaultConfig: {
			engineId: "",
			promptTemplate: "",
		} as ModelEngineConfig,
	},
	{
		type: "database-engine",
		label: "Database Engine",
		description: "Query or update a database engine",
		color: "#059669",
		defaultConfig: {
			engineId: "",
			operation: "query",
			expression: "",
		} as DatabaseEngineConfig,
	},
	{
		type: "vector-engine",
		label: "Vector Engine",
		description: "Query a vector database or embed documents",
		color: "#d97706",
		defaultConfig: {
			engineId: "",
			operation: "query",
			expression: "",
		} as VectorEngineConfig,
	},
	{
		type: "storage-engine",
		label: "Storage Engine",
		description: "Read or write files in a storage engine",
		color: "#db2777",
		defaultConfig: {
			engineId: "",
			operation: "list",
			path: "",
		} as StorageEngineConfig,
	},
	{
		type: "function-engine",
		label: "Function Engine",
		description: "Call a function engine with parameters",
		color: "#0891b2",
		defaultConfig: {
			engineId: "",
			paramsExpression: "",
		} as FunctionEngineConfig,
	},
	{
		type: "custom-pixel",
		label: "Custom Pixel",
		description: "Execute any Pixel expression",
		color: "#475569",
		defaultConfig: { pixel: "" } as CustomPixelConfig,
	},
	{
		type: "transform",
		label: "Transform",
		description: "Map, filter, or reduce data between nodes",
		color: "#9333ea",
		defaultConfig: {
			operation: "map",
			expression: "",
		} as TransformConfig,
	},
];
