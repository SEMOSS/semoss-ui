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

export type TriggerMode = "manual";

export interface TriggerConfig {
	mode: TriggerMode;
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
	builtPixel?: string;
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

export type AutomationTriggerType = "MANUAL" | string;

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

export const NODE_TYPE_META: NodeTypeMeta[] = [
	{
		type: "trigger",
		label: "Trigger",
		description: "Starts the automation manually via UI or pixel call.",
		tooltip:
			'Every automation begins with exactly one Trigger node. Run it on demand via the UI or call TriggerAutomation(project=["<appId>"]) from any pixel.',
		category: "trigger",
		defaultConfig: {
			mode: "manual",
		} as TriggerConfig,
		defaultOutputVar: "trigger_out",
	},
	{
		type: "database-engine",
		label: "Database Engine",
		description: "Run SQL queries or writes against a connected database.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Executes a SQL expression against a registered RDBMS engine (e.g. Postgres, MySQL, Snowflake).\n\nExamples:\n• Pull today's open cases: SELECT * FROM cases WHERE status='open'\n• Write enriched records: INSERT INTO enriched SELECT ...\n• Use upstream vars: SELECT * FROM patients WHERE id='${case_id}'",
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
		description:
			"List, download, upload, or delete files in a storage connector.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Interacts with a registered file storage engine (S3, SharePoint, GCS, etc.).\n\nExamples:\n• List files ready to process in a folder\n• Download a report from /reports/${date}.csv\n• Upload a generated output back to storage\n• Read an image as Base64 to pass to a Vision model",
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
		description:
			"Semantic search or document management in a vector store.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Queries or manages documents in a registered vector database.\n\nExamples:\n• Search: find the 5 most relevant policy docs for '${user_question}'\n• Add file: index a newly uploaded PDF into the knowledge base\n• Delete: remove outdated documents by name\n• Commonly used before a Model Engine to give the LLM relevant context (RAG pattern)",
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
		description:
			"Call an LLM, embeddings model, vision model, or NER model.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Invokes a registered AI model engine.\n\nExamples:\n• LLM: Summarize a support ticket — 'Summarize this case: ${case_text}'\n• LLM: Generate a draft report from structured data\n• Embeddings: Convert text chunks to vectors before storing in a vector engine\n• Vision: Describe an image pulled from storage\n• NER: Extract entities (names, dates, orgs) from raw text",
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
		description:
			"Invoke a registered serverless function with a JSON payload.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Calls a custom function engine — useful for arbitrary Python/Java logic packaged as a SEMOSS engine.\n\nExamples:\n• Run a custom scoring function on ${patient_data}\n• Call a validation routine before writing to a database\n• Trigger a microservice with parameters built from upstream outputs",
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
		label: "App Engine",
		description:
			"Write any SEMOSS pixel expression. Optionally run inside an app context.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			'Execute any arbitrary SEMOSS Pixel. Supports ${variable} template substitution from upstream node outputs.\n\nOptionally set an App/Project ID to load that app\'s insight context before running — useful when your pixel calls reactors registered inside a specific app.\n\nExamples:\n• SyncFilesToStorage(path=["/data/"], extension=["txt"], storage=["<id>"], database=["<id>"])\n• RunCustomReport(project=["my-app-id"], params=["${db_out}"])\n• Any pixel you\'d run in the SEMOSS console',
		category: "engine",
		defaultConfig: { pixel: "", appId: "" } as AppConfig,
		defaultOutputVar: "pixel_out",
	},
	{
		type: "wait",
		label: "Wait / Delay",
		description:
			"Pause automation execution for a fixed number of seconds.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Sleeps for the specified number of seconds before continuing. The value supports ${var} template substitution so wait duration can be dynamic.\n\nExamples:\n• Wait 30 seconds between API polling attempts\n• Use ${config.POLL_INTERVAL} to make the delay configurable via SMSS settings\n• Cap: maximum 3600 seconds (1 hour) per node",
		category: "logic",
		defaultConfig: {
			seconds: "5",
		} as WaitConfig,
		defaultOutputVar: "wait_out",
	},
];
