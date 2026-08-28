import type {
	AutomationDataType,
	AutomationNodeCodeMode,
	AutomationWorkflowNodeConfig,
	AutomationWorkflowNodeType,
} from "./automation-workflow.types";

// ─── node types ───────────────────────────────────────────────────────────────

export type AutomationNodeType =
	| "trigger"
	| "database-engine"
	| "storage-engine"
	| "vector-engine"
	| "model-engine"
	| "function-engine"
	| "app"
	| "branch"
	| "wait";

// ─── shared form types ────────────────────────────────────────────────────────

/** A single parameter in a reactor's signature, as returned by GetReactorSignature. */
export interface ReactorParam {
	name: string;
	type: string;
	required: boolean;
	description?: string;
}

// ─── node configs (one per node type) ────────────────────────────────────────

export interface TriggerConfig {
	/** Node-level config mode — lowercase by convention, distinct from the run-level AutomationTriggerType enum. */
	mode: "manual";
}

export interface DatabaseEngineConfig {
	engineId: string;
	engineName?: string;
	operation: "query" | "write";
	expression: string;
	limit: number;
	commit: boolean;
}

export interface StorageEngineConfig {
	engineId: string;
	engineName?: string;
	operation: "list" | "download" | "upload" | "delete" | "read-base64";
	storagePath: string;
	filePath: string;
	metadata: string;
}

export interface VectorEngineConfig {
	engineId: string;
	engineName?: string;
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
	engineName?: string;
	engineSubtype?: string;
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
	engineName?: string;
	operation: "execute" | "streaming";
	params: string;
}

export interface AppConfig {
	pixel: string;
	appId?: string;
	appName?: string;
}

export interface AgentRunConfig {
	workspaceId: string;
	workspaceName?: string;
	engineId: string;
	engineName?: string;
	command: string;
}

export interface WaitConfig {
	seconds: string;
}

export interface BranchConfig {
	condition: string;
}

export type NodeConfig =
	| TriggerConfig
	| DatabaseEngineConfig
	| StorageEngineConfig
	| VectorEngineConfig
	| ModelEngineConfig
	| FunctionEngineConfig
	| AppConfig
	| AgentRunConfig
	| BranchConfig
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
	/**
	 * The persisted workflow type and configuration. `type` and `config` remain the
	 * canvas compatibility projection used by the established business forms.
	 */
	workflowType?: AutomationWorkflowNodeType;
	workflowConfig?: AutomationWorkflowNodeConfig;
	workflowCodeMode?: AutomationNodeCodeMode;
	outputTransform?: OutputTransform;
	/** When set, this node branches: the Then path runs when the condition is truthy, otherwise Else. */
	branchCondition?: string;
}

export interface AutomationEdge {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
	kind?: "control" | "data";
	dataType?: AutomationDataType;
}

export interface AutomationGraph {
	nodes: AutomationNode[];
	edges: AutomationEdge[];
}

// ─── full automation document (saved to app storage) ─────────────────────────

export interface AutomationDocument {
	version: 1;
	/** Optional plain-text description shown in the editor header and used as the MCP tool description. */
	description?: string;
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

/** Durable references to the SEMOSS activity produced by one automation node. */
export interface AutomationNodeTrace {
	roomId?: string;
	modelMessageId?: string;
	agentRunId?: string;
}

/**
 * How a run was initiated.
 * - MANUAL: triggered by a user clicking Run in the editor.
 * - PLAYGROUND: triggered by the AI playground sidebar via the MCP TriggerAutomation tool.
 * - SCHEDULED: triggered by a scheduler job configured for the automation.
 */
export type AutomationTriggerType = "MANUAL" | "PLAYGROUND" | "SCHEDULED";

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
	RESULT_SUMMARY?: string | null;
	DEFINITION_VERSION?: number;
	DEFINITION_HASH?: string;
}

export interface AutomationNodeResult {
	NODE_ID: string;
	NODE_LABEL: string;
	STATUS: NodeStatus;
	DURATION_MS: number;
	OUTPUT_PREVIEW: string | null;
	ERROR_MESSAGE: string | null;
	trace?: AutomationNodeTrace;
}

export interface AutomationRunDetail extends AutomationRunSummary {
	DEFINITION_SNAPSHOT?: string;
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
	/** Model subtype (e.g. TEXT_EMBEDDINGS, NER, KSERVE_VISION, ANTHROPIC, OPEN_AI, etc.) */
	engine_subtype?: string;
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

export interface AutomationToolContext {
	id: string;
	name: string;
	message: string;
	roomId: string;
	projectId: string;
	parameters: Record<string, unknown>;
	toolResponse?: unknown;
}
