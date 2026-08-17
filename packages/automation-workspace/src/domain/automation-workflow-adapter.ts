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
	source: string;
	triggerBindings: TriggerBinding[];
	steps: AutomationNode[];
	edges: AutomationEdge[];
}

const MANUAL_TRIGGER: TriggerBinding = { id: "manual", type: "manual" };

function stringValue(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: fallback;
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
			operation: type === "vector.search" ? "search" : "list",
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
	if (type === "control.wait") {
		return { seconds: String(numberValue(config.durationSeconds, 5)) };
	}
	return {
		pixel: stringValue(config.pixel) || stringValue(config.code),
		appId: stringValue(config.appId),
	};
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
	const workflowConfig = structuredClone(definition.defaultConfig);
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

function canvasNodeFromWorkflow(node: AutomationWorkflowNode): AutomationNode {
	return {
		id: node.id,
		type: canvasTypeForWorkflow(node.type),
		label: node.label,
		position: node.position,
		outputVar: `${node.type.replace(/\./g, "_")}_${node.id.slice(-6)}`,
		config: defaultCanvasConfig(node.type, node.config),
		workflowType: node.type,
		workflowConfig: structuredClone(node.config),
		workflowCodeMode: node.codeMode,
	};
}

export function createInitialCanvasWorkflowDocument(): CanvasWorkflowDocument {
	const trigger = createCanvasWorkflowNode("trigger.start", 0);
	return {
		description: "",
		source: `def run(inputs):
    return {"status": "ok"}
`,
		triggerBindings: [MANUAL_TRIGGER],
		steps: [trigger],
		edges: [],
	};
}

export function canvasDocumentFromWorkflow(
	document: AutomationWorkflowDocument,
	source: string,
): CanvasWorkflowDocument {
	const steps = document.graph.nodes.map(canvasNodeFromWorkflow);
	if (!steps.some((node) => node.workflowType === "trigger.start")) {
		steps.unshift(createCanvasWorkflowNode("trigger.start", 0));
	}
	return {
		description: document.description ?? "",
		source,
		triggerBindings:
			document.triggerBindings.length > 0
				? document.triggerBindings
				: [MANUAL_TRIGGER],
		steps,
		edges: document.graph.edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			sourceHandle: edge.sourcePort,
			targetHandle: edge.targetPort,
			kind: edge.kind,
			...(edge.kind === "data" ? { dataType: edge.dataType } : {}),
		})),
	};
}

export function canvasDocumentToWorkflow({
	description,
	triggerBindings,
	steps,
	edges,
}: Omit<CanvasWorkflowDocument, "source">): AutomationWorkflowDocument {
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
		return {
			id: step.id,
			type,
			label: step.label || definition.label,
			position: step.position,
			config,
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
						sourcePort: edge.sourceHandle ?? "result",
						target: edge.target,
						targetPort: edge.targetHandle ?? "in",
					}
				: {
						id: edge.id,
						kind: "control",
						source: edge.source,
						sourcePort: edge.sourceHandle ?? "out",
						target: edge.target,
						targetPort: edge.targetHandle ?? "in",
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
	return Object.entries(definition.configSchema).flatMap(([key, schema]) => {
		if (!schema.required) return [];
		const value = config[key];
		if (value === "" || value === undefined) {
			return [`${schema.label} is required`];
		}
		return [];
	});
}
