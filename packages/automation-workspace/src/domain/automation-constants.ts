import type {
	AppConfig,
	DatabaseEngineConfig,
	FunctionEngineConfig,
	ModelEngineConfig,
	NodeTypeMeta,
	PythonStepConfig,
	StorageEngineConfig,
	TriggerConfig,
	VectorEngineConfig,
	WaitConfig,
} from "./automation.types";

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
		label: "Query Database",
		description: "Run a query or write against a connected database.",
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
		label: "File Storage",
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
		label: "Search Documents",
		description:
			"Find relevant documents using semantic search or manage a document store.",
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
		label: "Ask AI",
		description:
			"Send a prompt to an AI model, generate embeddings, or analyze images.",
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
		label: "Run Function",
		description:
			"Call a custom function or external API with a JSON payload.",
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
		label: "Run App",
		description:
			"Execute a script or pixel expression, optionally within an app context.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			'Execute any arbitrary SEMOSS Pixel. Supports ${variable} template substitution from upstream node outputs.\n\nOptionally set an App/Project ID to load that app\'s insight context before running — useful when your pixel calls reactors registered inside a specific app.\n\nExamples:\n• SyncFilesToStorage(path=["/data/"], extension=["txt"], storage=["<id>"], database=["<id>"])\n• RunCustomReport(project=["my-app-id"], params=["${db_out}"])\n• Any pixel you\'d run in the SEMOSS console',
		category: "engine",
		defaultConfig: { pixel: "", appId: "" } as AppConfig,
		defaultOutputVar: "pixel_out",
	},
	{
		type: "python-step",
		label: "Python Step",
		description:
			"Generate Python for a custom integration, transformation, or external API call.",
		tooltip:
			"Generates a project-owned Python file under automation/steps after you define its setup. The graph controls when it runs and maps inputs.",
		category: "logic",
		defaultConfig: {
			inputs: {},
			purpose: "",
			outputDescription: "",
		} as PythonStepConfig,
		defaultOutputVar: "python_out",
	},
	{
		type: "wait",
		label: "Wait / Pause",
		description:
			"Pause the automation for a fixed number of seconds before continuing.",
		tooltip: // biome-ignore lint/suspicious/noTemplateCurlyInString: ${} in tooltip shows example syntax for users
			"Sleeps for the specified number of seconds before continuing. The value supports ${var} template substitution so wait duration can be dynamic.\n\nExamples:\n• Wait 30 seconds between API polling attempts\n• Use ${config.POLL_INTERVAL} to make the delay configurable via SMSS settings\n• Cap: maximum 3600 seconds (1 hour) per node",
		category: "logic",
		defaultConfig: {
			seconds: "5",
		} as WaitConfig,
		defaultOutputVar: "wait_out",
	},
];
