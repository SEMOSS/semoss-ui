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
	| "for-each"
	| "conditional"
	| "sub-workflow"
	| "while-loop"
	| "try-catch"
	| "wait"
	| "set-variable"
	| "email"
	| "http-request"
	| "notification"
	| "switch"
	| "retry"
	| "parallel"
	| "transform";

// ─── node configs (one per node type) ────────────────────────────────────────

export type TriggerMode =
	| "manual"
	| "schedule"
	| "webhook"
	| "storage-poll"
	| "db-poll";

export interface TriggerConfig {
	mode: TriggerMode;
	// schedule
	cronExpression: string;
	quartzJobId?: string; // returned by Quartz on registration, stored here
	cronTimezone?: string;
	// webhook
	webhookSecret?: string; // stored in workflow-config.json, shown once at generation
	// storage poll
	storagePollEngineId?: string;
	storagePollPath?: string;
	storagePollIntervalCron?: string; // Quartz cron for poll frequency
	storagePollJobId?: string;
	// db poll
	dbPollEngineId?: string;
	dbPollQuery?: string; // SQL whose result hash is compared each tick
	dbPollIntervalCron?: string;
	dbPollJobId?: string;
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
	appId?: string; // optional — when set, pixel runs inside this app's insight context
}

export interface ForEachConfig {
	sourceVar: string; // array variable from upstream (backend: config.sourceVar)
	iteratorVar: string; // per-item variable name (backend: config.iteratorVar, default "row")
	subGraph: WorkflowGraph; // inner pipeline; backend reads config.nodes from subGraph.nodes on save
}

export interface ConditionalConfig {
	condition: string;
	trueGraph: WorkflowGraph;
	falseGraph: WorkflowGraph;
}

export interface WhileLoopConfig {
	condition: string; // JS expression evaluated each iteration; supports ${var}
	maxIterations: number; // safety cap, default 100
	subGraph: WorkflowGraph;
}

export interface TryCatchConfig {
	errorVar: string; // variable name injected into catch branch scope on failure
	tryGraph: WorkflowGraph;
	catchGraph: WorkflowGraph;
}

export interface WaitConfig {
	seconds: string; // supports ${var} templates, resolved at runtime
}

export interface SetVariableConfig {
	variables: Record<string, string>; // varName → value template (${...} supported)
}

export interface EmailConfig {
	to: string; // comma-separated; supports ${var}
	cc?: string;
	bcc?: string;
	subject: string; // supports ${var}
	body: string; // supports ${var}
	isHtml?: boolean;
}

export interface HttpRequestConfig {
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	url: string; // supports ${var}
	headers?: string; // JSON object string, e.g. {"Content-Type":"application/json"}
	body?: string; // raw body string; supports ${var}
	username?: string; // basic auth
	password?: string;
}

export interface NotificationConfig {
	recipientId: string; // SEMOSS user ID; supports ${var}
	title: string; // supports ${var}
	message: string; // supports ${var}
	priority?: "HIGH" | "MEDIUM" | "LOW";
}

export interface SwitchConfig {
	switchVar: string; // scope variable name to match on
	cases: Array<{ value: string; label: string }>;
	// per-case sub-graphs stored as subGraphs[index]; defaultSubGraph for no-match
}

export interface RetryConfig {
	maxAttempts: number; // default 3
	backoffSeconds: number; // wait between attempts, default 5
	exponential?: boolean; // multiply backoff by attempt number
	// subGraph: inner nodes to retry
}

export interface ParallelConfig {
	branches: Array<{ label: string; outputVar: string }>;
	// each branch's subGraph stored on the branch object
}

export interface TransformConfig {
	inputVar: string;
	operation:
		| "convert-to-objects"
		| "extract-field"
		| "filter"
		| "map"
		| "flatten";
	expression?: string;
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
	| ForEachConfig
	| ConditionalConfig
	| WhileLoopConfig
	| TryCatchConfig
	| WaitConfig
	| SetVariableConfig
	| EmailConfig
	| HttpRequestConfig
	| NotificationConfig
	| SwitchConfig
	| RetryConfig
	| ParallelConfig
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

export type WorkflowTriggerType =
	| "MANUAL"
	| "SCHEDULED"
	| "WEBHOOK"
	| "STORAGE_POLL"
	| "DB_POLL"
	| "SUB_WORKFLOW"
	| "RESUME"
	| string; // allow unknown future types

export interface WorkflowRunSummary {
	RUN_ID: string;
	PROJECT_ID: string;
	WORKFLOW_ID?: string;
	STARTED_AT: string;
	COMPLETED_AT: string | null;
	STATUS: RunStatus;
	TRIGGER_TYPE?: WorkflowTriggerType;
	TOTAL_NODES?: number;
	COMPLETED_NODES?: number;
	FAILED_NODE_ID?: string;
	ERROR_MESSAGE?: string | null;
}

export interface WhileIterationNode {
	label: string;
	status: NodeStatus;
	durationMs?: number;
	preview?: string;
}

export interface WhileIteration {
	iteration: number;
	nodes: WhileIterationNode[];
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
	iterationResults?: WhileIteration[];
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
	tooltip: string; // richer explanation + use case examples shown on hover
	category: "trigger" | "engine" | "logic";
	defaultConfig: NodeConfig;
	defaultOutputVar: string;
}

export const NODE_TYPE_META: NodeTypeMeta[] = [
	{
		type: "trigger",
		label: "Trigger",
		description: "Starts the workflow manually or on a schedule.",
		tooltip:
			"Every workflow begins with exactly one Trigger node. Choose Manual to run it on demand, or Schedule to use a Quartz cron expression.\n\nExamples:\n• Nightly report at 6 AM: 0 0 6 * * ?\n• Every weekday at 9 AM: 0 0 9 ? * MON-FRI",
		category: "trigger",
		defaultConfig: {
			mode: "manual",
			cronExpression: "0 0 6 * * ?",
			cronTimezone: "UTC",
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
		type: "sub-workflow",
		label: "Sub-Workflow",
		description:
			"Call another project's saved workflow and wait for its result.",
		tooltip:
			"Triggers a separate project's workflow as a child step and waits for it to complete before continuing. Use input mapping to pass data from this workflow into the child.\n\nExamples:\n• Reuse a shared 'data validation' workflow across multiple parent workflows\n• Chain a document-indexing workflow after a fetch step\n• Break large automation into smaller, independently testable workflows",
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
		description:
			"Write any SEMOSS pixel expression. Optionally run inside an app context.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			'Execute any arbitrary SEMOSS Pixel. Supports ${variable} template substitution from upstream node outputs.\n\nOptionally set an App/Project ID to load that app\'s insight context before running — useful when your pixel calls reactors registered inside a specific app.\n\nExamples:\n• SyncEsrMetadata(apiUrl="${config.MIRTH_API_URL}")\n• RunCustomReport(project=["my-app-id"], params=["${db_out}"])\n• Any pixel you\'d run in the SEMOSS console',
		category: "engine",
		defaultConfig: { pixel: "", appId: "" } as CustomPixelConfig,
		defaultOutputVar: "pixel_out",
	},
	{
		type: "for-each",
		label: "For Each",
		description:
			"Process each item in an array through a sub-pipeline in parallel.",
		tooltip:
			"Takes an array from an upstream variable and runs a sub-pipeline for each item concurrently. Results are collected into a new array.\n\nExamples:\n• Vector search returns 10 documents → for-each runs an LLM summary on each simultaneously\n• A database query returns 50 patient records → for-each enriches each via a function engine\n• Reduces wall-clock time from N×step_time to ~1×step_time for batch work",
		category: "logic",
		defaultConfig: {
			sourceVar: "",
			iteratorVar: "row",
			subGraph: { nodes: [], edges: [] },
		} as ForEachConfig,
		defaultOutputVar: "foreach_results",
	},
	{
		type: "conditional",
		label: "Conditional",
		description: "Branch the workflow based on a condition expression.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Evaluates a condition using data from upstream variables and routes execution down the TRUE or FALSE branch. Each branch is an independent sub-graph.\n\nExamples:\n• If ${model_out} contains 'urgent' → TRUE branch pages on-call, FALSE branch logs and continues\n• If ${row_count} > 0 → TRUE branch processes records, FALSE branch sends empty-result notification\n• Gate downstream steps behind a validation check",
		category: "logic",
		defaultConfig: {
			condition: "",
			trueGraph: { nodes: [], edges: [] },
			falseGraph: { nodes: [], edges: [] },
		} as ConditionalConfig,
		defaultOutputVar: "branch_out",
	},
	{
		type: "while-loop",
		label: "While Loop",
		description: "Repeat a sub-pipeline until a condition becomes false.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Evaluates a JS condition before each iteration. While true, runs the inner sub-pipeline then re-checks. Stops when the condition is false or the max-iterations cap is reached.\n\nExamples:\n• Poll a storage path until a file appears: '${file_count}' > 0\n• Keep enriching records while ${remaining} > 0\n• Always set a generous maxIterations cap to prevent runaway loops",
		category: "logic",
		defaultConfig: {
			condition: "",
			maxIterations: 100,
			subGraph: { nodes: [], edges: [] },
		} as WhileLoopConfig,
		defaultOutputVar: "loop_out",
	},
	{
		type: "try-catch",
		label: "Try / Catch",
		description: "Run a branch and fall back to a catch branch on failure.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Executes the Try branch. If any node in the Try branch throws an error, execution continues in the Catch branch instead. The error message is injected as a scope variable.\n\nExamples:\n• Try: call an external API. Catch: log the failure and send an alert\n• Try: parse and transform data. Catch: route to a fallback handler\n• Catch branch can reference ${error} to inspect the failure message",
		category: "logic",
		defaultConfig: {
			errorVar: "error",
			tryGraph: { nodes: [], edges: [] },
			catchGraph: { nodes: [], edges: [] },
		} as TryCatchConfig,
		defaultOutputVar: "try_catch_out",
	},
	{
		type: "wait",
		label: "Wait / Delay",
		description: "Pause workflow execution for a fixed number of seconds.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Sleeps for the specified number of seconds before continuing. The value supports ${var} template substitution so wait duration can be dynamic.\n\nExamples:\n• Wait 30 seconds between API polling attempts\n• Use ${config.POLL_INTERVAL} to make the delay configurable via SMSS settings\n• Cap: maximum 3600 seconds (1 hour) per node",
		category: "logic",
		defaultConfig: {
			seconds: "5",
		} as WaitConfig,
		defaultOutputVar: "wait_out",
	},
	{
		type: "set-variable",
		label: "Set Variable",
		description: "Inject named variables into the workflow scope.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			'Creates or overwrites scope variables without executing a pixel. Each value supports ${var} template substitution, so you can derive new variables from upstream outputs.\n\nExamples:\n• Set report_date = ${trigger_out} to alias a timestamp\n• Build a JSON summary: summary = {"count": "${row_count}", "model": "${model_out}"}\n• Inject constants like threshold = 0.85 for use in downstream conditions',
		category: "logic",
		defaultConfig: {
			variables: {},
		} as SetVariableConfig,
		defaultOutputVar: "vars_out",
	},
	{
		type: "email",
		label: "Send Email",
		description: "Send an email via the configured SMTP server.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Sends an email using SEMOSS's built-in SMTP configuration. Supports HTML, multiple recipients, and ${var} templates in subject and body.\n\nExamples:\n• Send a daily report: subject='Report for ${report_date}', body from ${model_out}\n• Alert on failure: to='team@company.com', subject='Workflow Failed'\n• CC a manager on high-priority results",
		category: "engine",
		defaultConfig: {
			to: "",
			subject: "",
			body: "",
			isHtml: false,
		} as EmailConfig,
		defaultOutputVar: "email_out",
	},
	{
		type: "http-request",
		label: "HTTP Request",
		description:
			"Make an outbound REST API call (GET, POST, PUT, PATCH, DELETE).",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Calls any external HTTP endpoint. Supports all standard methods, custom headers, and a raw body with ${var} template substitution.\n\nExamples:\n• POST results to a webhook: url='https://hooks.example.com/...', body='{\"data\": \"${db_out}\"}'\n• GET data from a REST API and pass it downstream\n• Call a Slack webhook to post a message when a run completes",
		category: "engine",
		defaultConfig: {
			method: "POST",
			url: "",
			headers: '{"Content-Type": "application/json"}',
			body: "",
		} as HttpRequestConfig,
		defaultOutputVar: "http_out",
	},
	{
		type: "notification",
		label: "Notification",
		description: "Send an in-app SEMOSS notification to a user.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Creates an in-app notification visible in the SEMOSS notification bell for the specified user. Supports ${var} templates in title and message.\n\nExamples:\n• Notify a data steward when new files are detected\n• Alert a manager when a workflow completes with ${row_count} records processed\n• Send a failure notice to an admin with ${error} details",
		category: "engine",
		defaultConfig: {
			recipientId: "",
			title: "",
			message: "",
			priority: "MEDIUM",
		} as NotificationConfig,
		defaultOutputVar: "notification_out",
	},
	{
		type: "switch",
		label: "Switch",
		description:
			"Route execution to one of N branches based on a variable's value.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Reads a scope variable and routes execution to the matching case branch. If no case matches, the default branch runs (if configured).\n\nExamples:\n• Route by document type: ${doc_type} → 'invoice' / 'contract' / 'report'\n• Route by priority: ${priority_level} → 'HIGH' / 'MEDIUM' / 'LOW'\n• Cleaner than chaining multiple conditionals",
		category: "logic",
		defaultConfig: {
			switchVar: "",
			cases: [],
		} as SwitchConfig,
		defaultOutputVar: "switch_out",
	},
	{
		type: "retry",
		label: "Retry",
		description: "Automatically retry a sub-pipeline on failure.",
		tooltip:
			"Wraps a sub-pipeline and re-runs it on failure up to N times with configurable backoff. Scope changes from failed attempts are discarded before each retry.\n\nExamples:\n• Retry an external API call 3 times with 10-second backoff\n• Retry a flaky database write with exponential backoff\n• Wrap any unstable node to make the overall workflow more resilient",
		category: "logic",
		defaultConfig: {
			maxAttempts: 3,
			backoffSeconds: 5,
			exponential: false,
		} as RetryConfig,
		defaultOutputVar: "retry_out",
	},
	{
		type: "parallel",
		label: "Parallel",
		description:
			"Run multiple independent sub-pipelines and collect their results.",
		tooltip:
			"Defines N named branches, each with its own sub-pipeline. Each branch writes to its own output variable. Branches currently execute sequentially and results are collected into an array.\n\nExamples:\n• Branch A: send an email. Branch B: create a notification. Branch C: log to a database.\n• Run the same data through two different model engines and compare results\n• Fan out to multiple storage destinations simultaneously",
		category: "logic",
		defaultConfig: {
			branches: [
				{ label: "Branch A", outputVar: "branch_a_out" },
				{ label: "Branch B", outputVar: "branch_b_out" },
			],
		} as ParallelConfig,
		defaultOutputVar: "parallel_out",
	},
	{
		type: "transform",
		label: "Transform Data",
		description:
			"Reshape or filter data from an upstream variable without extra substeps.",
		tooltip:
			"Applies a transformation to the output of an upstream node and writes the result into a new variable. Useful for reshaping database rows into objects, extracting a single field, mapping over arrays, or flattening nested structures.\n\nExamples:\n• Convert raw SQL rows to [{col: value}] objects before passing to a model\n• Extract a single column from a dataset\n• Flatten a nested array from a function engine result",
		category: "engine",
		defaultConfig: {
			inputVar: "",
			operation: "convert-to-objects",
		} as TransformConfig,
		defaultOutputVar: "transform_out",
	},
];
