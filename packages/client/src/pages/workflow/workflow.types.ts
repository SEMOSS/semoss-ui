// ─── node types ───────────────────────────────────────────────────────────────

export type WorkflowNodeType =
	| "trigger"
	| "database-engine"
	| "storage-engine"
	| "vector-engine"
	| "model-engine"
	| "function-engine"
	| "app"
	| "custom-pixel"
	| "fan-out"
	| "conditional"
	| "transform"
	| "sub-workflow";

// ─── node configs (one per node type) ────────────────────────────────────────

export interface TriggerConfig {
	mode: "schedule" | "manual";
	cronExpression: string;
}

export interface DatabaseEngineConfig {
	engineId: string;
	operation: "query" | "write";
	expression: string;
	limit: number; // default 50, only for query
	commit: boolean; // only for write
}

export interface StorageEngineConfig {
	engineId: string;
	operation: "list" | "download" | "upload" | "delete" | "read-base64";
	storagePath: string;
	filePath: string; // local path — download dest or upload source
	metadata: string; // optional JSON string, for upload
}

export interface VectorEngineConfig {
	engineId: string;
	operation:
		| "search"
		| "add-file"
		| "add-csv"
		| "list"
		| "delete"
		| "download";
	// search
	command: string;
	limit: number;
	filters: string;
	metaFilters: string;
	// add-file
	filePath: string;
	source: string;
	space: string;
	// add-csv
	filePaths: string;
	paramValues: string;
	// delete / download
	fileNames: string;
}

export interface ModelEngineConfig {
	engineId: string;
	operation: "llm" | "embeddings" | "vision" | "ner";
	// llm
	command: string;
	context: string;
	paramValues: string; // JSON string e.g. {"temperature":0.7,"maxTokens":1000}
	// embeddings
	values: string;
	// vision
	image: string;
	// ner
	prompt: string;
	entities: string;
}

export interface FunctionEngineConfig {
	engineId: string;
	operation: "execute" | "streaming";
	params: string; // JSON string for the map parameter
}

export interface AppNodeConfig {
	appId: string;
	pixel: string; // renamed from pixelExpression for consistency
}

/**
 * Sub-workflow node — calls another project's saved workflow.json to completion and
 * returns its final run result. `inputMapping` is stored as a JSON string (same convention
 * as `paramValues`/`metaFilters`): keys become variables in the target workflow's scope,
 * values are `${var}` templates resolved against this workflow's scope before the call.
 */
export interface SubWorkflowNodeConfig {
	targetProjectId: string;
	inputMapping: string; // JSON string, e.g. {"childVar": "${parentOutputVar}"}
}

export interface CustomPixelConfig {
	pixel: string;
}

export interface FanOutConfig {
	inputVar: string;
	itemAlias: string;
	parallelism: string;
	subGraph: WorkflowGraph;
}

export interface ConditionalConfig {
	condition: string;
	trueGraph: WorkflowGraph;
	falseGraph: WorkflowGraph;
}

export interface TransformConfig {
	operation:
		| "convert-to-objects"
		| "extract-field"
		| "filter"
		| "map"
		| "flatten";
	inputVar: string;
	expression: string; // JSONPath for extract, JS expression for filter/map
}

export type NodeConfig =
	| TriggerConfig
	| DatabaseEngineConfig
	| StorageEngineConfig
	| VectorEngineConfig
	| ModelEngineConfig
	| FunctionEngineConfig
	| AppNodeConfig
	| SubWorkflowNodeConfig
	| CustomPixelConfig
	| FanOutConfig
	| ConditionalConfig
	| TransformConfig;

// ─── graph primitives ─────────────────────────────────────────────────────────

export interface OutputTransform {
	mode: "raw" | "rows-as-objects" | "first-row" | "column" | "jsonpath";
	column?: string; // mode=column: which column to extract
	path?: string; // mode=jsonpath: dot-notation path e.g. "$.data.headers"
}

export interface WorkflowNode {
	id: string;
	type: WorkflowNodeType;
	position: { x: number; y: number };
	label: string;
	outputVar: string;
	config: NodeConfig;
	outputTransform?: OutputTransform;
	builtPixel?: string;
}

export interface WorkflowEdge {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

export interface WorkflowGraph {
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
}

// ─── full workflow document (saved to app storage) ────────────────────────────

export interface WorkflowDocument {
	version: 1;
	graph: WorkflowGraph;
}

// ─── step run status (live, FE-side during a manual run) ─────────────────────

export type StepRunStatus = "idle" | "running" | "success" | "error";

// ─── run history ──────────────────────────────────────────────────────────────

export type RunStatus =
	| "RUNNING"
	| "SUCCESS"
	| "FAILED"
	| "INTERRUPTED"
	| "CANCELLED";

export type NodeStatus =
	| "PENDING"
	| "RUNNING"
	| "SUCCESS"
	| "FAILED"
	| "SKIPPED";

export interface WorkflowRunSummary {
	RUN_ID: string;
	PROJECT_ID: string;
	WORKFLOW_ID?: string;
	STARTED_AT: string;
	COMPLETED_AT: string | null;
	STATUS: RunStatus;
	TRIGGER_TYPE?: string;
	TOTAL_NODES?: number;
	COMPLETED_NODES?: number;
	FAILED_NODE_ID?: string;
	ERROR_MESSAGE?: string | null;
}

export interface WorkflowNodeResult {
	NODE_ID: string;
	NODE_LABEL: string;
	STATUS: NodeStatus;
	DURATION_MS: number;
	OUTPUT_PREVIEW: string | null;
	ERROR_MESSAGE: string | null;
	ROW_COUNT?: number;
	forEachProgress?: {
		total: number;
		succeeded: number;
		failed: number;
	};
}

export interface WorkflowRunDetail extends WorkflowRunSummary {
	nodeResults: WorkflowNodeResult[];
}

// ─── config (SMSS key-value) ──────────────────────────────────────────────────

export interface WorkflowConfigEntry {
	key: string;
	value: string;
	sensitive: boolean;
}

// ─── engine option (from MyEngines pixel) ────────────────────────────────────

export interface EngineOption {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_type?: string;
}

// ─── project option (from MyProjects pixel) ──────────────────────────────────

export interface ProjectOption {
	project_id: string;
	project_name: string;
	project_display_name?: string;
	project_type?: string;
}

// ─── node type metadata (for palette) ────────────────────────────────────────

export interface NodeTypeMeta {
	type: WorkflowNodeType;
	label: string;
	description: string;
	category: "trigger" | "engine" | "logic" | "utility";
	defaultConfig: NodeConfig;
	defaultOutputVar: string;
}

export const NODE_TYPE_META: NodeTypeMeta[] = [
	{
		type: "trigger",
		label: "Trigger",
		description: "Starts the workflow on a schedule or manually.",
		category: "trigger",
		defaultConfig: {
			mode: "manual",
			cronExpression: "0 0 6 * * ?",
		} as TriggerConfig,
		defaultOutputVar: "trigger_out",
	},
	{
		type: "database-engine",
		label: "Database Engine",
		description: "Run queries or writes against a RDBMS engine.",
		category: "engine",
		defaultConfig: {
			engineId: "",
			operation: "query",
			expression: "",
			limit: 50,
			commit: false,
		} as DatabaseEngineConfig,
		defaultOutputVar: "db_out",
	},
	{
		type: "storage-engine",
		label: "Storage Engine",
		description: "List, get, or put files from a storage connector.",
		category: "engine",
		defaultConfig: {
			engineId: "",
			operation: "list",
			storagePath: "/",
			filePath: "",
			metadata: "",
		} as StorageEngineConfig,
		defaultOutputVar: "storage_out",
	},
	{
		type: "vector-engine",
		label: "Vector Engine",
		description: "Add documents or query a vector engine.",
		category: "engine",
		defaultConfig: {
			engineId: "",
			operation: "search",
			command: "",
			limit: 5,
			filters: "",
			metaFilters: "",
			filePath: "",
			source: "",
			space: "",
			filePaths: "",
			paramValues: "",
			fileNames: "",
		} as VectorEngineConfig,
		defaultOutputVar: "vector_out",
	},
	{
		type: "model-engine",
		label: "Model Engine",
		description: "Call an LLM with a prompt template.",
		category: "engine",
		defaultConfig: {
			engineId: "",
			operation: "llm",
			command: "",
			context: "",
			paramValues: "",
			values: "",
			image: "",
			prompt: "",
			entities: "",
		} as ModelEngineConfig,
		defaultOutputVar: "model_out",
	},
	{
		type: "function-engine",
		label: "Function Engine",
		description: "Invoke a serverless function engine.",
		category: "engine",
		defaultConfig: {
			engineId: "",
			operation: "execute",
			params: "",
		} as FunctionEngineConfig,
		defaultOutputVar: "fn_out",
	},
	{
		type: "app",
		label: "App / Project",
		description: "Run a Pixel expression in an app's insight context.",
		category: "engine",
		defaultConfig: { appId: "", pixel: "" } as AppNodeConfig,
		defaultOutputVar: "app_out",
	},
	{
		type: "sub-workflow",
		label: "Sub-Workflow",
		description:
			"Run another project's saved workflow and wait for its result.",
		category: "logic",
		defaultConfig: {
			targetProjectId: "",
			inputMapping: "{}",
		} as SubWorkflowNodeConfig,
		defaultOutputVar: "sub_workflow_out",
	},
	{
		type: "custom-pixel",
		label: "Custom Pixel",
		description: "Freeform Pixel with variable template support.",
		category: "utility",
		defaultConfig: { pixel: "" } as CustomPixelConfig,
		defaultOutputVar: "pixel_out",
	},
	{
		type: "fan-out",
		label: "Fan-out",
		description:
			"Run a sub-pipeline for each item in an array in parallel.",
		category: "logic",
		defaultConfig: {
			inputVar: "",
			itemAlias: "item",
			parallelism: "8",
			subGraph: { nodes: [], edges: [] },
		} as FanOutConfig,
		defaultOutputVar: "fanout_results",
	},
	{
		type: "conditional",
		label: "Conditional",
		description: "Branch execution based on a condition expression.",
		category: "logic",
		defaultConfig: {
			condition: "",
			trueGraph: { nodes: [], edges: [] },
			falseGraph: { nodes: [], edges: [] },
		} as ConditionalConfig,
		defaultOutputVar: "branch_out",
	},
	{
		type: "transform",
		label: "Transform",
		description: "Map, filter, reduce, or flatten an array.",
		category: "logic",
		defaultConfig: {
			operation: "convert-to-objects",
			inputVar: "",
			expression: "",
		} as TransformConfig,
		defaultOutputVar: "transform_out",
	},
];
