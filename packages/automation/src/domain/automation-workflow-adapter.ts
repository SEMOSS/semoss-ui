import type {
	AutomationEdge,
	AutomationNode,
	AutomationNodeType,
	NodeConfig,
} from "./automation.types";
import { getAutomationNodeDefinition } from "./automation-node-catalog";
import type {
	AutomationBranchClause,
	AutomationJevRoute,
	AutomationJsonValue,
	AutomationNodeDefinition,
	AutomationWorkflowDocument,
	AutomationWorkflowEdge,
	AutomationWorkflowNode,
	AutomationWorkflowNodeConfig,
	AutomationWorkflowNodeType,
	TriggerBinding,
} from "./automation-workflow.types";

export interface CanvasWorkflowDocument {
	description: string;
	triggerBindings: TriggerBinding[];
	steps: AutomationNode[];
	edges: AutomationEdge[];
}

export type AutomationNodeSources = Record<string, string>;

const MANUAL_TRIGGER: TriggerBinding = { id: "manual", type: "manual" };
const PYTHON_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** DatabaseEngine method per write node. Reads go through execQuery instead. */
const DATABASE_WRITE_METHODS: Record<string, string | undefined> = {
	"database.insert": "insertData",
	"database.update": "updateData",
	"database.delete": "removeData",
};

// Drops unfinished "Add input" rows so a blank name never reaches the backend save validator.
function sanitizeTriggerGlobals(value: unknown): AutomationJsonValue {
	if (!Array.isArray(value)) return value as AutomationJsonValue;
	return value.filter(
		(entry) =>
			entry !== null &&
			typeof entry === "object" &&
			typeof (entry as { name?: unknown }).name === "string" &&
			(entry as { name: string }).name.trim() !== "",
	) as AutomationJsonValue;
}
const PYTHON_KEYWORDS = new Set(
	"False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(
		" ",
	),
);
const RESERVED_OUTPUT_VARIABLES = new Set([
	"date",
	"triggered_at",
	"run_id",
	"_automation_room_id",
]);

/** Returns the user-facing validation error for a node output variable. */
export function validateAutomationOutputVariable(value: string): string | null {
	if (!PYTHON_IDENTIFIER_PATTERN.test(value) || PYTHON_KEYWORDS.has(value)) {
		return "Use a valid Python variable name";
	}
	if (RESERVED_OUTPUT_VARIABLES.has(value)) {
		return "This name is reserved by the automation runtime";
	}
	return null;
}

function stringValue(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function jsonObjectValue(value: unknown): string {
	if (typeof value === "string") return value;
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return JSON.stringify(value);
	}
	return "";
}

function jsonArrayValue(value: unknown): string {
	if (typeof value === "string") return value;
	return Array.isArray(value) ? JSON.stringify(value) : "";
}

function isAutomationJsonValue(value: unknown): value is AutomationJsonValue {
	if (
		value === null ||
		typeof value === "boolean" ||
		typeof value === "number" ||
		typeof value === "string"
	) {
		return true;
	}
	if (Array.isArray(value)) return value.every(isAutomationJsonValue);
	return (
		typeof value === "object" &&
		value !== null &&
		Object.values(value).every(isAutomationJsonValue)
	);
}

function parsedJsonValue(value: string): AutomationJsonValue | undefined {
	try {
		const parsed: unknown = JSON.parse(value);
		return isAutomationJsonValue(parsed) ? parsed : undefined;
	} catch {
		return undefined;
	}
}

function numberValue(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: fallback;
}

function pythonLiteral(value: unknown): string {
	return JSON.stringify(value ?? "");
}

function branchClauses(value: unknown): AutomationBranchClause[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((clause) => {
		if (!clause || typeof clause !== "object") return [];
		const candidate = clause as Partial<AutomationBranchClause>;
		return typeof candidate.id === "string" &&
			typeof candidate.condition === "string"
			? [{ id: candidate.id, condition: candidate.condition }]
			: [];
	});
}

function jevRoutes(value: unknown): AutomationJevRoute[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((route) => {
		if (!route || typeof route !== "object") return [];
		const candidate = route as Partial<AutomationJevRoute>;
		return typeof candidate.id === "string" &&
			typeof candidate.description === "string"
			? [
					{
						id: candidate.id,
						description: candidate.description,
						...(typeof candidate.answer === "boolean"
							? { answer: candidate.answer }
							: {}),
					},
				]
			: [];
	});
}

function isRoutingWorkflowType(type: AutomationWorkflowNodeType): boolean {
	return type === "control.if" || type === "control.jev";
}

/**
 * Shows the direct SDK implementation before the server has persisted its canonical copy.
 * Saving a generated node always replaces this preview with the authoritative backend renderer.
 */
export function getGeneratedPythonPreview(step: AutomationNode): string {
	const type = step.workflowType;
	const config = type
		? mergeCanvasConfig(type, step.config, step.workflowConfig ?? {})
		: {};
	const category = type
		? getWorkflowNodeDefinition(type)?.category
		: undefined;
	// Byte-for-byte the server's AutomationSourceRenderer.triggerSource. The save path
	// compares the persisted trigger source against that template to decide whether the
	// node is still generated, so drift here would mark every untouched trigger custom.
	if (type === "trigger.start") {
		return `# Declare globals in trigger.start config.globals.
# Define optional setup here; return a map only for additional runtime values.
def run(scope):
    return {}
`;
	}
	if (category === "database") {
		// execQuery only runs reads. Each write operation has its own method, the same
		// mapping AutomationSourceRenderer.databaseWriteSource applies server side.
		const writeMethod = DATABASE_WRITE_METHODS[type ?? ""];
		if (writeMethod) {
			return `from ai_server import DatabaseEngine

ENGINE_ID = ${pythonLiteral(config.engineId)}
QUERY = ${pythonLiteral(config.query)}

def run(scope):
    database = DatabaseEngine(engine_id=scope.resolve(ENGINE_ID))
    return database.${writeMethod}(query=scope.resolve(QUERY))
`;
		}
		return `from ai_server import DatabaseEngine

ENGINE_ID = ${pythonLiteral(config.engineId)}
QUERY = ${pythonLiteral(config.query)}

def run(scope):
    database = DatabaseEngine(engine_id=scope.resolve(ENGINE_ID))
    return database.execQuery(query=scope.resolve(QUERY), return_pandas=False)
`;
	}
	if (category === "model") {
		return `from ai_server import ModelEngine

ENGINE_ID = ${pythonLiteral(config.engineId)}
PROMPT = ${pythonLiteral(config.prompt ?? config.text)}

def run(scope):
    model = ModelEngine(engine_id=scope.resolve(ENGINE_ID))
    return model.ask(command=scope.resolve(PROMPT))
`;
	}
	if (category === "storage") {
		return `from ai_server import StorageEngine

ENGINE_ID = ${pythonLiteral(config.engineId)}
STORAGE_PATH = ${pythonLiteral(config.path)}

def run(scope):
    storage = StorageEngine(engine_id=scope.resolve(ENGINE_ID))
    return storage.list(scope.resolve(STORAGE_PATH))
`;
	}
	if (category === "vector") {
		return `from ai_server import VectorEngine

ENGINE_ID = ${pythonLiteral(config.engineId)}
QUERY = ${pythonLiteral(config.value)}

def run(scope):
    vector = VectorEngine(engine_id=scope.resolve(ENGINE_ID))
    return vector.nearestNeighbor(search_statement=scope.resolve(QUERY), limit=5)
`;
	}
	if (type === "function.execute") {
		return `from ai_server import FunctionEngine
import json

ENGINE_ID = ${pythonLiteral(config.engineId)}
ARGUMENTS = ${pythonLiteral(config.arguments)}

def run(scope):
    function = FunctionEngine(engine_id=scope.resolve(ENGINE_ID))
    return function.execute(parameterMap=json.loads(scope.resolve(ARGUMENTS)))
`;
	}
	if (type === "app.pixel") {
		return `from semoss import Insight
import json

APP_ID = ${pythonLiteral(config.appId)}
PIXEL = ${pythonLiteral(config.pixel)}

def run(scope):
    app_id = scope.resolve(APP_ID)
    pixel = scope.resolve(PIXEL)
    if app_id:
        pixel = "LoadApp(project=" + json.dumps(app_id) + "); " + pixel
    return Insight().run_pixel(pixel, raw=False)
`;
	}
	if (type === "control.wait") {
		return `import time

SECONDS = ${pythonLiteral(config.durationSeconds)}

def run(scope):
    seconds = float(SECONDS)
    time.sleep(seconds)
    return {"waitedSeconds": seconds}
`;
	}
	if (type === "control.if") {
		const clauses = branchClauses(config.clauses);
		return `CLAUSES = ${pythonLiteral(clauses)}

def run(scope):
	for clause in CLAUSES:
		if bool(eval(scope.resolve(clause["condition"]))):
			return {"branch": "case:" + clause["id"], "value": True}
	return {"branch": "else", "value": False}
`;
	}
	if (type === "control.jev") {
		return "# Jev decisions execute through the server-owned TypeSafe engine.\n";
	}
	return `# Write arbitrary Python for this automation node here.
# scope is a read-only, run-local mapping: inputs, globals, metadata, and prior outputs by outputVar.
# Read required values with scope["outputVar"] and optional values with scope.get("outputVar").
# Return a JSON-shaped value to pass data to the next node.
def run(scope):
    return {}
`;
}

/**
 * Reports whether Python source binds a module-level `run`, the entry point the automation
 * runtime calls. Only an unindented definition or assignment counts, matching the server's
 * save-time check.
 */
export function definesRunEntryPoint(source: string): boolean {
	return source
		.split(/\r?\n/)
		.some(
			(line) =>
				/^(?:async\s+)?def\s+run\s*\(/.test(line) ||
				/^run\s*=/.test(line),
		);
}

function canvasTypeForWorkflow(
	type: AutomationWorkflowNodeType,
): AutomationNodeType {
	const category = getWorkflowNodeDefinition(type)?.category;
	if (type === "trigger.start") return "trigger";
	if (category === "database") return "database-engine";
	if (category === "model") return "model-engine";
	if (category === "storage") return "storage-engine";
	if (category === "vector") return "vector-engine";
	if (type === "function.execute") return "function-engine";
	if (type === "control.wait") return "wait";
	if (isRoutingWorkflowType(type)) return "branch";
	return "app";
}

function defaultCanvasConfig(
	type: AutomationWorkflowNodeType,
	config: AutomationWorkflowNodeConfig,
): NodeConfig {
	const engineId = stringValue(config.engineId);
	const category = getWorkflowNodeDefinition(type)?.category;
	if (type === "trigger.start") return { mode: "manual" };
	if (category === "database") {
		return {
			engineId,
			operation: type === "database.query" ? "query" : "write",
			expression: stringValue(config.query),
			limit: numberValue(config.limit, 50),
			commit: config.commit !== false,
		};
	}
	if (category === "model") {
		const operation =
			type === "model.embeddings"
				? "embeddings"
				: type === "model.vision"
					? "vision"
					: type === "model.ner"
						? "ner"
						: "llm";
		return {
			engineId,
			operation,
			command: stringValue(config.prompt) || stringValue(config.text),
			context: stringValue(config.systemPrompt),
			paramValues: jsonObjectValue(config.paramValues),
			values: stringValue(config.text),
			image: stringValue(config.image),
			prompt: stringValue(config.prompt),
			entities: jsonArrayValue(config.entities),
		};
	}
	if (category === "storage") {
		const operation =
			type === "storage.read"
				? "read-base64"
				: type === "storage.download"
					? "download"
					: type === "storage.upload"
						? "upload"
						: type === "storage.delete"
							? "delete"
							: "list";
		return {
			engineId,
			operation,
			storagePath: stringValue(config.path),
			filePath: stringValue(config.destination),
			metadata: "",
		};
	}
	if (category === "vector") {
		const operation =
			type === "vector.search"
				? "search"
				: type === "vector.add"
					? "add-file"
					: type === "vector.delete"
						? "delete"
						: "list";
		// The persisted `value` is shown in whichever field this operation's form renders.
		const value = stringValue(config.value);
		return {
			engineId,
			operation,
			command: operation === "search" ? value : "",
			limit: numberValue(config.limit, 5),
			filters: stringValue(config.filters),
			metaFilters: "",
			filePath: operation === "add-file" ? value : "",
			source: stringValue(config.source),
			space: stringValue(config.collection),
			filePaths: "",
			paramValues: stringValue(config.paramValues),
			fileNames: operation === "delete" ? value : "",
		};
	}
	if (type === "function.execute") {
		return {
			engineId,
			operation: "execute",
			params: jsonObjectValue(config.arguments),
		};
	}
	if (type === "agent.run") {
		return {
			workspaceId: stringValue(config.workspaceId),
			engineId,
			command: stringValue(config.command),
		};
	}
	if (type === "control.wait") {
		return { seconds: String(numberValue(config.durationSeconds, 5)) };
	}
	if (type === "control.if") {
		return { clauses: branchClauses(config.clauses) };
	}
	if (type === "control.jev") {
		return {
			engineId,
			state: stringValue(config.state),
			question: stringValue(config.question),
			questionType: config.questionType === "noul" ? "noul" : "choice",
			clauses: jevRoutes(config.clauses),
			confidenceThreshold: numberValue(config.confidenceThreshold, 0),
			paramValues: jsonObjectValue(config.paramValues),
		};
	}
	return {
		pixel: stringValue(config.pixel),
		appId: stringValue(config.appId),
	};
}

function withPythonSource(
	type: AutomationWorkflowNodeType,
	config: AutomationWorkflowNodeConfig,
): AutomationWorkflowNodeConfig {
	if (type === "trigger.start") return config;
	const pythonSource = stringValue(config.pythonSource);
	return pythonSource ? { ...config, pythonSource } : config;
}

function normalizeWorkflowConfig(
	config: unknown,
): AutomationWorkflowNodeConfig {
	return config && typeof config === "object" && !Array.isArray(config)
		? (config as AutomationWorkflowNodeConfig)
		: {};
}

function canvasTypeToWorkflow(
	type: AutomationNodeType,
): AutomationWorkflowNodeType {
	switch (type) {
		case "trigger":
			return "trigger.start";
		case "database-engine":
			return "database.query";
		case "storage-engine":
			return "storage.list";
		case "vector-engine":
			return "vector.search";
		case "model-engine":
			return "model.chat";
		case "function-engine":
			return "function.execute";
		case "wait":
			return "control.wait";
		case "branch":
			return "control.if";
		case "app":
			return "app.pixel";
	}
}

function getConfigValue(
	config: NodeConfig,
	key: string,
): string | number | boolean | undefined {
	const value = (config as unknown as Record<string, unknown>)[key];
	return typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
		? value
		: undefined;
}

function mergeCanvasConfig(
	type: AutomationWorkflowNodeType,
	config: NodeConfig,
	workflowConfig: AutomationWorkflowNodeConfig,
): AutomationWorkflowNodeConfig {
	const next = { ...workflowConfig };
	const category = getWorkflowNodeDefinition(type)?.category;
	const engineId = getConfigValue(config, "engineId");
	if (typeof engineId === "string") next.engineId = engineId;

	if (category === "database") {
		const expression = getConfigValue(config, "expression");
		const limit = getConfigValue(config, "limit");
		if (typeof expression === "string") next.query = expression;
		if (typeof limit === "number") next.limit = limit;
	}
	if (category === "model") {
		const command = getConfigValue(config, "command");
		const context = getConfigValue(config, "context");
		const values = getConfigValue(config, "values");
		const image = getConfigValue(config, "image");
		const paramValues = getConfigValue(config, "paramValues");
		const entities = getConfigValue(config, "entities");
		if (typeof command === "string") {
			if (type === "model.embeddings") next.text = command;
			else next.prompt = command;
		}
		if (typeof context === "string") next.systemPrompt = context;
		if (type === "model.embeddings" && typeof values === "string") {
			next.text = values;
		}
		if (typeof image === "string") next.image = image;
		if (type === "model.chat" && typeof paramValues === "string") {
			if (paramValues.trim()) {
				next.paramValues = parsedJsonValue(paramValues) ?? paramValues;
			} else {
				delete next.paramValues;
			}
		}
		if (type === "model.ner" && typeof entities === "string") {
			next.entities = parsedJsonValue(entities) ?? entities;
		}
	}
	if (category === "storage") {
		const storagePath = getConfigValue(config, "storagePath");
		const filePath = getConfigValue(config, "filePath");
		if (typeof storagePath === "string") next.path = storagePath;
		if (typeof filePath === "string") next.destination = filePath;
	}
	if (category === "vector") {
		const operation = getConfigValue(config, "operation");
		const command = getConfigValue(config, "command");
		const filePath = getConfigValue(config, "filePath");
		const filePaths = getConfigValue(config, "filePaths");
		const fileNames = getConfigValue(config, "fileNames");
		const collection = getConfigValue(config, "space");
		const source = getConfigValue(config, "source");
		const filters = getConfigValue(config, "filters");
		const paramValues = getConfigValue(config, "paramValues");
		const limit = getConfigValue(config, "limit");
		// Every vector node carries one `value`: the search text, the comma-separated paths to
		// add, or the comma-separated names to remove. The form asks for it under a different
		// label per operation, so map whichever field that operation shows.
		const value =
			operation === "add-file"
				? filePath
				: operation === "add-csv"
					? filePaths
					: operation === "delete" || operation === "download"
						? fileNames
						: command;
		if (typeof value === "string") next.value = value;
		if (typeof collection === "string") next.collection = collection;
		if (typeof source === "string") next.source = source;
		if (typeof filters === "string") next.filters = filters;
		if (typeof paramValues === "string") next.paramValues = paramValues;
		if (typeof limit === "number") next.limit = limit;
	}
	if (type === "function.execute") {
		const params = getConfigValue(config, "params");
		if (typeof params === "string") {
			next.arguments = parsedJsonValue(params) ?? params;
		}
	}
	if (type === "agent.run") {
		const workspaceId = getConfigValue(config, "workspaceId");
		const command = getConfigValue(config, "command");
		if (typeof workspaceId === "string") next.workspaceId = workspaceId;
		if (typeof command === "string") next.command = command;
		next.wait = true;
	}
	if (type === "app.pixel") {
		const pixel = getConfigValue(config, "pixel");
		const appId = getConfigValue(config, "appId");
		if (typeof pixel === "string") next.pixel = pixel;
		if (typeof appId === "string") next.appId = appId;
	}
	if (type === "control.wait") {
		const seconds = getConfigValue(config, "seconds");
		if (typeof seconds === "string" && seconds) {
			const duration = Number(seconds);
			if (Number.isFinite(duration)) next.durationSeconds = duration;
		}
	}
	if (type === "control.if") {
		next.clauses = (
			config as Extract<NodeConfig, { clauses: unknown }>
		).clauses;
	}
	if (type === "control.jev") {
		const state = getConfigValue(config, "state");
		const question = getConfigValue(config, "question");
		const questionType = getConfigValue(config, "questionType");
		const confidenceThreshold = getConfigValue(
			config,
			"confidenceThreshold",
		);
		const paramValues = getConfigValue(config, "paramValues");
		if (typeof state === "string") next.state = state;
		if (typeof question === "string") next.question = question;
		if (questionType === "choice" || questionType === "noul") {
			next.questionType = questionType;
		}
		if (typeof confidenceThreshold === "number") {
			next.confidenceThreshold = confidenceThreshold;
		}
		if (typeof paramValues === "string") {
			next.paramValues = paramValues.trim()
				? (parsedJsonValue(paramValues) ?? paramValues)
				: {};
		}
		next.clauses = (
			config as Extract<NodeConfig, { clauses: unknown }>
		).clauses;
	}
	return next;
}

export function getWorkflowNodeDefinition(
	type: AutomationWorkflowNodeType,
): AutomationNodeDefinition | undefined {
	return getAutomationNodeDefinition(type);
}

export function createCanvasWorkflowNode(
	type: AutomationWorkflowNodeType,
	index: number,
): AutomationNode {
	const definition = getWorkflowNodeDefinition(type);
	if (!definition) throw new Error(`Unknown automation node type: ${type}`);
	const workflowConfig = withPythonSource(
		type,
		structuredClone(definition.defaultConfig),
	);
	return {
		id: `${type.replace(".", "-")}-${crypto.randomUUID()}`,
		type: canvasTypeForWorkflow(type),
		label: definition.label,
		position: { x: 0, y: index * 160 },
		outputVar: `${type.replace(/\./g, "_")}_${index + 1}`,
		config: defaultCanvasConfig(type, workflowConfig),
		workflowType: type,
		workflowConfig,
		workflowCodeMode: definition.defaultCodeMode,
	};
}

function canvasNodeFromWorkflow(
	node: AutomationWorkflowNode,
	nodeSources: AutomationNodeSources,
): AutomationNode {
	const persistedConfig = withPythonSource(
		node.type,
		structuredClone(normalizeWorkflowConfig(node.config)),
	);
	const workflowConfig =
		node.type === "trigger.start" ||
		typeof nodeSources[node.id] !== "string"
			? persistedConfig
			: { ...persistedConfig, pythonSource: nodeSources[node.id] };
	return {
		id: node.id,
		type: canvasTypeForWorkflow(node.type),
		label: node.label,
		position: node.position,
		outputVar:
			node.outputVar ??
			`${node.type.replace(/\./g, "_")}_${node.id.slice(-6)}`,
		config: defaultCanvasConfig(node.type, workflowConfig),
		workflowType: node.type,
		workflowConfig,
		workflowCodeMode: node.codeMode,
	};
}

export function createInitialCanvasWorkflowDocument(): CanvasWorkflowDocument {
	const trigger = createCanvasWorkflowNode("trigger.start", 0);
	return {
		description: "",
		triggerBindings: [MANUAL_TRIGGER],
		steps: [trigger],
		edges: [],
	};
}

export function canvasDocumentFromWorkflow(
	document: AutomationWorkflowDocument,
	nodeSources: AutomationNodeSources = {},
): CanvasWorkflowDocument {
	const steps = document.graph.nodes.map((node) =>
		canvasNodeFromWorkflow(node, nodeSources),
	);
	if (!steps.some((node) => node.workflowType === "trigger.start")) {
		steps.unshift(createCanvasWorkflowNode("trigger.start", 0));
	}
	return {
		description: document.description ?? "",
		triggerBindings:
			document.triggerBindings.length > 0
				? document.triggerBindings
				: [MANUAL_TRIGGER],
		steps,
		edges: document.graph.edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			sourceHandle:
				edge.sourcePort === "out"
					? `out-${edge.source}`
					: edge.sourcePort.startsWith("case:")
						? `case-${edge.source}-${edge.sourcePort.slice(5)}`
						: edge.sourcePort === "else"
							? `else-${edge.source}`
							: edge.sourcePort,
			targetHandle:
				edge.targetPort === "in"
					? `in-${edge.target}`
					: edge.targetPort,
			kind: edge.kind,
			...(edge.kind === "data" ? { dataType: edge.dataType } : {}),
		})),
	};
}

export function getCanvasNodeSources(
	steps: AutomationNode[],
): AutomationNodeSources {
	return Object.fromEntries(
		steps.flatMap((step) => {
			const type = step.workflowType ?? canvasTypeToWorkflow(step.type);
			if (
				type === "trigger.start" ||
				isRoutingWorkflowType(type) ||
				step.workflowCodeMode !== "custom"
			) {
				return [];
			}
			const source = step.workflowConfig?.pythonSource;
			if (typeof source !== "string" || source.trim() === "") {
				return [];
			}
			return [[step.id, source]];
		}),
	);
}

export function canvasDocumentToWorkflow({
	description,
	triggerBindings,
	steps,
	edges,
}: CanvasWorkflowDocument): AutomationWorkflowDocument {
	const nodes = steps.map((step): AutomationWorkflowNode => {
		const type = step.workflowType ?? canvasTypeToWorkflow(step.type);
		const definition = getWorkflowNodeDefinition(type);
		if (!definition)
			throw new Error(`Unknown automation node type: ${type}`);
		const config = mergeCanvasConfig(
			type,
			step.config,
			step.workflowConfig ?? structuredClone(definition.defaultConfig),
		);
		// Every other node's Python is persisted as its own file under automation-nodes/,
		// so carrying a copy in the config would duplicate it. The trigger has no such
		// file: AutomationRuntime.triggerSource reads its optional setup source straight
		// out of this config, making this the only place it can live.
		const { pythonSource, ...persistedConfig } = config;
		if (type === "trigger.start") {
			persistedConfig.globals = sanitizeTriggerGlobals(
				persistedConfig.globals,
			);
			if (
				typeof pythonSource === "string" &&
				pythonSource.trim() !== ""
			) {
				persistedConfig.pythonSource = pythonSource;
			}
		}
		return {
			id: step.id,
			type,
			label: step.label || definition.label,
			...(type === "trigger.start" || isRoutingWorkflowType(type)
				? {}
				: { outputVar: step.outputVar }),
			position: step.position,
			config: persistedConfig,
			codeMode: isRoutingWorkflowType(type)
				? "generated"
				: (step.workflowCodeMode ?? definition.defaultCodeMode),
		};
	});
	const nodeIds = new Set(nodes.map((node) => node.id));
	const graphEdges: AutomationWorkflowEdge[] = edges
		.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
		.map((edge) =>
			edge.kind === "data"
				? {
						id: edge.id,
						kind: "data",
						dataType: edge.dataType ?? "unknown",
						source: edge.source,
						sourcePort: edge.sourceHandle?.startsWith("out-")
							? "out"
							: (edge.sourceHandle ?? "result"),
						target: edge.target,
						targetPort: edge.targetHandle?.startsWith("in-")
							? "in"
							: (edge.targetHandle ?? "in"),
					}
				: {
						id: edge.id,
						kind: "control",
						source: edge.source,
						sourcePort: edge.sourceHandle?.startsWith("out-")
							? "out"
							: edge.sourceHandle?.startsWith("case-")
								? `case:${edge.sourceHandle.slice(
										`case-${edge.source}-`.length,
									)}`
								: edge.sourceHandle?.startsWith("else-")
									? "else"
									: (edge.sourceHandle ?? "out"),
						target: edge.target,
						targetPort: edge.targetHandle?.startsWith("in-")
							? "in"
							: (edge.targetHandle ?? "in"),
					},
		);
	return {
		formatVersion: 2,
		...(description.trim() ? { description: description.trim() } : {}),
		triggerBindings:
			triggerBindings.length > 0 ? triggerBindings : [MANUAL_TRIGGER],
		graph: { nodes, edges: graphEdges },
	};
}

export function validateCanvasWorkflowNode(
	node: AutomationNode,
	allNodes: AutomationNode[] = [node],
): string[] {
	const type = node.workflowType ?? canvasTypeToWorkflow(node.type);
	const definition = getWorkflowNodeDefinition(type);
	if (!definition) return ["This node type is not supported"];
	const config = mergeCanvasConfig(
		type,
		node.config,
		node.workflowConfig ?? definition.defaultConfig,
	);
	const errors = Object.entries(definition.configSchema).flatMap(
		([key, schema]) => {
			const value = config[key];
			const missing =
				value === undefined ||
				(typeof value === "string" && value.trim() === "");
			if (schema.required && missing) {
				return [`${schema.label} is required`];
			}
			if (
				!missing &&
				schema.minimum !== undefined &&
				(typeof value !== "number" ||
					!Number.isFinite(value) ||
					value < schema.minimum)
			) {
				return [`${schema.label} must be at least ${schema.minimum}`];
			}
			return [];
		},
	);
	if (type !== "trigger.start" && !isRoutingWorkflowType(type)) {
		const outputVariableError = validateAutomationOutputVariable(
			node.outputVar,
		);
		if (outputVariableError) {
			errors.push(outputVariableError);
		} else if (
			allNodes.some(
				(candidate) =>
					candidate.id !== node.id &&
					candidate.outputVar === node.outputVar,
			)
		) {
			errors.push("Output variable must be unique");
		}
	}
	if (type === "function.execute" && typeof config.arguments === "string") {
		try {
			JSON.parse(config.arguments);
		} catch {
			errors.push("JSON arguments must be valid JSON");
		}
	}
	// Source is only rejected once written: an untouched node saves with no source and the
	// server persists its generated scaffold instead.
	if (
		type !== "trigger.start" &&
		!isRoutingWorkflowType(type) &&
		node.workflowCodeMode === "custom"
	) {
		const source = stringValue(config.pythonSource);
		if (source.trim() !== "" && !definesRunEntryPoint(source)) {
			errors.push("a top-level run(scope) function");
		}
	}
	if (type === "control.if") {
		const clauses = branchClauses(config.clauses);
		if (clauses.length === 0) {
			errors.push("A condition is required");
		} else if (clauses.some((clause) => clause.condition.trim() === "")) {
			errors.push("Each condition is required");
		}
	}
	if (type === "control.jev") {
		const routes = jevRoutes(config.clauses);
		const questionType = config.questionType === "noul" ? "noul" : "choice";
		if (routes.length === 0) {
			errors.push("At least one route is required");
		} else if (routes.some((route) => route.description.trim() === "")) {
			errors.push("Each route description is required");
		}
		if (
			questionType === "noul" &&
			(routes.length !== 2 ||
				routes.filter((route) => route.answer === true).length !== 1 ||
				routes.filter((route) => route.answer === false).length !== 1)
		) {
			errors.push(
				"Yes / No decisions require one Yes path and one No path",
			);
		}
		const minimumConfidence = questionType === "noul" ? 0.5 : 0;
		if (
			typeof config.confidenceThreshold !== "number" ||
			config.confidenceThreshold < minimumConfidence ||
			config.confidenceThreshold > 1
		) {
			errors.push(
				`Minimum confidence must be from ${minimumConfidence} through 1`,
			);
		}
	}
	return errors;
}
