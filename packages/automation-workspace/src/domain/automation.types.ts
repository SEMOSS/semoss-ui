// ─── node types ───────────────────────────────────────────────────────────────

export type AutomationNodeType =
	| "trigger"
	| "database-engine"
	| "storage-engine"
	| "vector-engine"
	| "model-engine"
	| "function-engine"
	| "app"
	| "wait"
	| "python-step";

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

export type GeneratedSetupValue = string | number | boolean | null;

/**
 * Stable, generation-relevant setup values captured when Python source is
 * generated or applied. Runtime input mappings are intentionally excluded.
 */
export type GeneratedSetupSnapshot = Record<string, GeneratedSetupValue>;

export interface GeneratedStepMetadata {
	source?: string;
	actionId?: string;
	description?: string;
	usage?: string;
	/** Hash of the Python source last written by the generator. */
	sourceHash?: string;
	/** Backend fingerprint of the setup used for the last generation. */
	setupHash?: string;
	/** Backend generator template version used for the last generation. */
	templateVersion?: string;
	/** Client-side setup snapshot used to determine whether review is needed. */
	generatedSetup?: GeneratedSetupSnapshot;
}

export interface GeneratedStepConfig {
	/** Project-relative path to the generated Python step. */
	stepRef?: string;
	/** Details returned when this step was most recently generated. */
	generatedStep?: GeneratedStepMetadata;
	/** Runtime values resolved from upstream node outputs before the Python file runs. */
	inputs?: Record<string, string>;
}

export interface DatabaseEngineConfig extends GeneratedStepConfig {
	engineId: string;
	engineName?: string;
	operation: "query" | "write";
	expression: string;
	limit: number;
	commit: boolean;
	/** Natural-language description of what data is needed — drives AI SQL generation in business mode. */
	nlPrompt?: string;
}

export interface StorageEngineConfig extends GeneratedStepConfig {
	engineId: string;
	engineName?: string;
	operation: "list" | "download" | "upload" | "delete" | "read-base64";
	storagePath: string;
	filePath: string;
	metadata: string;
}

export interface VectorEngineConfig extends GeneratedStepConfig {
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

export interface ModelEngineConfig extends GeneratedStepConfig {
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

export interface FunctionEngineConfig extends GeneratedStepConfig {
	engineId: string;
	engineName?: string;
	operation: "execute" | "streaming";
	params: string;
}

export interface AppConfig extends GeneratedStepConfig {
	pixel: string;
	appId?: string;
	appName?: string;
}

export interface WaitConfig extends GeneratedStepConfig {
	seconds: string;
}

export interface PythonStepConfig extends GeneratedStepConfig {
	inputs: Record<string, string>;
	/** Plain-language action specification supplied before source is authored. */
	purpose: string;
	/** Plain-language description of the JSON-serializable value returned by run(). */
	outputDescription: string;
}

export type NodeConfig =
	| TriggerConfig
	| DatabaseEngineConfig
	| StorageEngineConfig
	| VectorEngineConfig
	| ModelEngineConfig
	| FunctionEngineConfig
	| AppConfig
	| WaitConfig
	| PythonStepConfig;

export type NodeConfigByType = {
	trigger: TriggerConfig;
	"database-engine": DatabaseEngineConfig;
	"storage-engine": StorageEngineConfig;
	"vector-engine": VectorEngineConfig;
	"model-engine": ModelEngineConfig;
	"function-engine": FunctionEngineConfig;
	app: AppConfig;
	wait: WaitConfig;
	"python-step": PythonStepConfig;
};

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
	playgroundFillable?: string[];
	/** Optional per-step notes for documentation purposes. */
	notes?: string;
}

export type AutomationNodeForType<T extends AutomationNodeType> = Omit<
	AutomationNode,
	"type" | "config"
> & {
	type: T;
	config: NodeConfigByType[T];
};

export function isAutomationNodeType<T extends AutomationNodeType>(
	node: AutomationNode,
	type: T,
): node is AutomationNodeForType<T> {
	return node.type === type;
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

/**
 * How a run was initiated.
 * - MANUAL: triggered by a user clicking Run in the editor.
 * - PLAYGROUND: triggered by the AI playground sidebar via the MCP TriggerAutomation tool.
 */
export type AutomationTriggerType = "MANUAL" | "PLAYGROUND";

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
