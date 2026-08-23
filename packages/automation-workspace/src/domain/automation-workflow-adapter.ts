import type {
	AutomationEdge,
	AutomationNode,
	AutomationNodeType,
	NodeConfig,
} from "./automation.types";
import { AUTOMATION_WORKFLOW_NODE_REGISTRY } from "./automation-workflow.constants";
import type {
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
function stringValue(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: fallback;
}

function pythonLiteral(value: unknown): string {
	return JSON.stringify(value ?? "");
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
	if (type?.startsWith("database.")) {
		return `from ai_server import DatabaseEngine

ENGINE_ID = ${pythonLiteral(config.engineId)}
QUERY = ${pythonLiteral(config.query)}

def run(scope):
    database = DatabaseEngine(engine_id=resolve(ENGINE_ID, scope))
    return database.execQuery(query=resolve(QUERY, scope), return_pandas=False)
`;
	}
	if (type?.startsWith("model.")) {
		return `from ai_server import ModelEngine

ENGINE_ID = ${pythonLiteral(config.engineId)}
PROMPT = ${pythonLiteral(config.prompt ?? config.text)}

def run(scope):
    model = ModelEngine(engine_id=resolve(ENGINE_ID, scope))
    return model.ask(command=resolve(PROMPT, scope))
`;
	}
	if (type?.startsWith("storage.")) {
		return `from ai_server import StorageEngine

ENGINE_ID = ${pythonLiteral(config.engineId)}
STORAGE_PATH = ${pythonLiteral(config.path)}

def run(scope):
    storage = StorageEngine(engine_id=resolve(ENGINE_ID, scope))
    return storage.list(resolve(STORAGE_PATH, scope))
`;
	}
	if (type?.startsWith("vector.")) {
		return `from ai_server import VectorEngine

ENGINE_ID = ${pythonLiteral(config.engineId)}
QUERY = ${pythonLiteral(config.value)}

def run(scope):
    vector = VectorEngine(engine_id=resolve(ENGINE_ID, scope))
    return vector.nearestNeighbor(search_statement=resolve(QUERY, scope), limit=5)
`;
	}
	if (type === "function.execute") {
		return `from ai_server import FunctionEngine
import json

ENGINE_ID = ${pythonLiteral(config.engineId)}
ARGUMENTS = ${pythonLiteral(config.arguments)}

def run(scope):
    function = FunctionEngine(engine_id=resolve(ENGINE_ID, scope))
    return function.execute(parameterMap=json.loads(resolve(ARGUMENTS, scope)))
`;
	}
	if (type === "app.pixel") {
		return `from semoss import Insight

PIXEL = ${pythonLiteral(config.pixel)}

def run(scope):
    return Insight().run_pixel(resolve(PIXEL, scope))
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
	return `def run(scope):
    return {}
`;
}

function canvasTypeForWorkflow(
	type: AutomationWorkflowNodeType,
): AutomationNodeType {
	if (type === "trigger.start") return "trigger";
	if (type.startsWith("database.")) return "database-engine";
	if (type.startsWith("model.")) return "model-engine";
	if (type.startsWith("storage.")) return "storage-engine";
	if (type.startsWith("vector.")) return "vector-engine";
	if (type === "function.execute") return "function-engine";
	if (type === "control.wait") return "wait";
	return "app";
}

function defaultCanvasConfig(
	type: AutomationWorkflowNodeType,
	config: AutomationWorkflowNodeConfig,
): NodeConfig {
	const engineId = stringValue(config.engineId);
	if (type === "trigger.start") return { mode: "manual" };
	if (type.startsWith("database.")) {
		return {
			engineId,
			operation: type === "database.query" ? "query" : "write",
			expression:
				stringValue(config.query) ||
				stringValue(config.values) ||
				stringValue(config.table),
			limit: numberValue(config.limit, 50),
			commit: config.commit !== false,
		};
	}
	if (type.startsWith("model.")) {
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
			paramValues: "",
			values: stringValue(config.text),
			image: stringValue(config.image),
			prompt: stringValue(config.prompt),
			entities: "",
		};
	}
	if (type.startsWith("storage.")) {
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
	if (type.startsWith("vector.")) {
		return {
			engineId,
			operation:
				type === "vector.search"
					? "search"
					: type === "vector.add"
						? "add-file"
						: type === "vector.delete"
							? "delete"
							: "list",
			command: stringValue(config.value),
			limit: 5,
			filters: "",
			metaFilters: "",
			filePath: "",
			source: "",
			space: stringValue(config.collection),
			filePaths: "",
			paramValues: "",
			fileNames: "",
		};
	}
	if (type === "function.execute") {
		return {
			engineId,
			operation: "execute",
			params: stringValue(config.arguments),
		};
	}
	if (type === "agent.run") {
		return {
			workspaceId:
				stringValue(config.workspaceId) || stringValue(config.agentId),
			command: stringValue(config.command) || stringValue(config.prompt),
		};
	}
	if (type === "control.wait") {
		return { seconds: String(numberValue(config.durationSeconds, 5)) };
	}
	return {
		pixel: stringValue(config.pixel) || stringValue(config.code),
		appId: stringValue(config.appId),
	};
}

function withPythonSource(
	type: AutomationWorkflowNodeType,
	config: AutomationWorkflowNodeConfig,
): AutomationWorkflowNodeConfig {
	if (type === "trigger.start") return config;
	const pythonSource =
		stringValue(config.pythonSource) ||
		(type === "developer.python" ? stringValue(config.code) : "");
	return pythonSource ? { ...config, pythonSource } : config;
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
	const engineId = getConfigValue(config, "engineId");
	if (typeof engineId === "string") next.engineId = engineId;

	if (type.startsWith("database.")) {
		const expression = getConfigValue(config, "expression");
		const limit = getConfigValue(config, "limit");
		if (typeof expression === "string") next.query = expression;
		if (typeof limit === "number") next.limit = limit;
	}
	if (type.startsWith("model.")) {
		const command = getConfigValue(config, "command");
		const context = getConfigValue(config, "context");
		const values = getConfigValue(config, "values");
		const image = getConfigValue(config, "image");
		if (typeof command === "string") {
			if (type === "model.embeddings") next.text = command;
			else next.prompt = command;
		}
		if (typeof context === "string") next.systemPrompt = context;
		if (type === "model.embeddings" && typeof values === "string") {
			next.text = values;
		}
		if (typeof image === "string") next.image = image;
	}
	if (type.startsWith("storage.")) {
		const storagePath = getConfigValue(config, "storagePath");
		const filePath = getConfigValue(config, "filePath");
		if (typeof storagePath === "string") next.path = storagePath;
		if (typeof filePath === "string") next.destination = filePath;
	}
	if (type.startsWith("vector.")) {
		const command = getConfigValue(config, "command");
		const collection = getConfigValue(config, "space");
		if (typeof command === "string") next.value = command;
		if (typeof collection === "string") next.collection = collection;
	}
	if (type === "function.execute") {
		const params = getConfigValue(config, "params");
		if (typeof params === "string") next.arguments = params;
	}
	if (type === "agent.run") {
		const workspaceId = getConfigValue(config, "workspaceId");
		const command = getConfigValue(config, "command");
		if (typeof workspaceId === "string") next.workspaceId = workspaceId;
		if (typeof command === "string") next.command = command;
		next.wait = true;
		delete next.agentId;
		delete next.prompt;
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
	return next;
}

export function getWorkflowNodeDefinition(
	type: AutomationWorkflowNodeType,
): AutomationNodeDefinition | undefined {
	return AUTOMATION_WORKFLOW_NODE_REGISTRY.find((node) => node.type === type);
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
		structuredClone(node.config),
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
				edge.sourcePort === "out" || edge.sourcePort === "next"
					? `out-${edge.source}`
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
		const { pythonSource: _pythonSource, ...persistedConfig } = config;
		return {
			id: step.id,
			type,
			label: step.label || definition.label,
			...(type === "trigger.start" ? {} : { outputVar: step.outputVar }),
			position: step.position,
			config: persistedConfig,
			codeMode: step.workflowCodeMode ?? definition.defaultCodeMode,
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

export function validateCanvasWorkflowNode(node: AutomationNode): string[] {
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
			if (
				schema.required &&
				(value === undefined ||
					(typeof value === "string" && value.trim() === ""))
			) {
				return [`${schema.label} is required`];
			}
			if (
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
	if (type === "function.execute" && typeof config.arguments === "string") {
		try {
			JSON.parse(config.arguments);
		} catch {
			errors.push("JSON arguments must be valid JSON");
		}
	}
	return errors;
}
