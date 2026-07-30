// ─── node types ───────────────────────────────────────────────────────────────

export type AutomationNodeType =
	| "trigger"
	| "database-engine"
	| "storage-engine"
	| "vector-engine"
	| "model-engine"
	| "function-engine"
	| "app"
	| "wait";

// ─── node configs (one per node type) ────────────────────────────────────────

export interface TriggerConfig {
	mode: "manual";
}

export interface DatabaseEngineConfig {
	engineId: string;
	operation: "query" | "write";
	expression: string;
	limit: number;
	commit: boolean;
}

export interface StorageEngineConfig {
	engineId: string;
	operation: "list" | "download" | "upload" | "delete" | "read-base64";
	storagePath: string;
	filePath: string;
	metadata: string;
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
	command: string;
	limit: number;
	filters: string;
	metaFilters: string;
	filePath: string;
	source: string;
	space: string;
	filePaths: string;
	paramValues: string;
	fileNames: string;
}

export interface ModelEngineConfig {
	engineId: string;
	operation: "llm" | "embeddings" | "vision" | "ner";
	command: string;
	context: string;
	paramValues: string;
	values: string;
	image: string;
	prompt: string;
	entities: string;
}

export interface FunctionEngineConfig {
	engineId: string;
	operation: "execute" | "streaming";
	params: string;
}

export interface AppConfig {
	pixel: string;
	appId?: string;
}

export interface WaitConfig {
	seconds: string;
}

export type NodeConfig =
	| TriggerConfig
	| DatabaseEngineConfig
	| StorageEngineConfig
	| VectorEngineConfig
	| ModelEngineConfig
	| FunctionEngineConfig
	| AppConfig
	| WaitConfig;

// ─── graph primitives ─────────────────────────────────────────────────────────

export interface OutputTransform {
	mode: "raw" | "rows-as-objects" | "first-row" | "column" | "jsonpath";
	column?: string;
	path?: string;
}

export interface AutomationNode {
	id: string;
	type: AutomationNodeType;
	position: { x: number; y: number };
	label: string;
	outputVar: string;
	config: NodeConfig;
	outputTransform?: OutputTransform;
}

export interface AutomationEdge {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

export interface AutomationGraph {
	nodes: AutomationNode[];
	edges: AutomationEdge[];
}

// ─── full automation document (saved to app storage) ─────────────────────────

export interface AutomationDocument {
	version: 1;
	graph: AutomationGraph;
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

export type AutomationTriggerType = "MANUAL";

export interface AutomationRunSummary {
	RUN_ID: string;
	PROJECT_ID: string;
	AUTOMATION_ID?: string;
	STARTED_AT: string;
	COMPLETED_AT: string | null;
	STATUS: RunStatus;
	TRIGGER_TYPE?: AutomationTriggerType;
	TOTAL_NODES?: number;
	COMPLETED_NODES?: number;
	FAILED_NODE_ID?: string;
	ERROR_MESSAGE?: string | null;
}

export interface AutomationNodeResult {
	NODE_ID: string;
	NODE_LABEL: string;
	STATUS: NodeStatus;
	DURATION_MS: number;
	OUTPUT_PREVIEW: string | null;
	ERROR_MESSAGE: string | null;
}

export interface AutomationRunDetail extends AutomationRunSummary {
	nodeResults: AutomationNodeResult[];
}

// ─── config (SMSS key-value) ──────────────────────────────────────────────────

export interface AutomationConfigEntry {
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
	type: AutomationNodeType;
	label: string;
	description: string;
	tooltip: string;
	category: "trigger" | "engine" | "logic";
	defaultConfig: NodeConfig;
	defaultOutputVar: string;
}
