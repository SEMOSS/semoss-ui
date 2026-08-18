export type AutomationWorkflowNodeType =
	| "trigger.start"
	| "database.query"
	| "database.insert"
	| "database.update"
	| "model.chat"
	| "model.embeddings"
	| "model.vision"
	| "model.ner"
	| "storage.list"
	| "storage.read"
	| "storage.upload"
	| "storage.download"
	| "storage.delete"
	| "vector.search"
	| "vector.add"
	| "vector.delete"
	| "function.execute"
	| "app.pixel"
	| "control.wait"
	| "developer.python";

export type AutomationPortKind = "control" | "data";
export type AutomationDataType =
	| "boolean"
	| "number"
	| "string"
	| "object"
	| "array"
	| "record"
	| "table"
	| "unknown";

export interface AutomationPort {
	id: string;
	label: string;
	kind: AutomationPortKind;
	direction: "input" | "output";
	dataType?: AutomationDataType;
	required?: boolean;
	multiple?: boolean;
}

export type AutomationNodeCodeMode = "generated" | "custom";
export type AutomationNodeCategory =
	| "trigger"
	| "database"
	| "model"
	| "storage"
	| "vector"
	| "function"
	| "app"
	| "control"
	| "developer";

export type TriggerBinding =
	| { id: string; type: "manual" }
	| { id: string; type: "schedule"; cron: string; timezone: string }
	| { id: string; type: "webhook"; path: string; secretId?: string }
	| { id: string; type: "event"; eventName: string; source?: string };

export interface PythonTemplateReference {
	id: string;
	version: string;
}

export interface PythonTemplateMetadata extends PythonTemplateReference {
	runtime: "python";
	entrypoint: string;
	description: string;
	inputs: readonly AutomationPort[];
	outputs: readonly AutomationPort[];
}

export interface AutomationWorkflowNodeConfig
	extends Record<
		string,
		| boolean
		| number
		| string
		| string[]
		| PythonTemplateReference
		| undefined
	> {
	/** Python artifact executed for this non-trigger node. */
	pythonSource?: string;
}

export interface AutomationWorkflowNode<
	T extends AutomationWorkflowNodeType = AutomationWorkflowNodeType,
> {
	id: string;
	type: T;
	label: string;
	outputVar?: string;
	position: { x: number; y: number };
	config: AutomationWorkflowNodeConfig;
	codeMode: AutomationNodeCodeMode;
}

export type AutomationWorkflowGraphNode = AutomationWorkflowNode;

export interface AutomationControlEdge {
	id: string;
	kind: "control";
	source: string;
	sourcePort: string;
	target: string;
	targetPort: string;
}

export interface AutomationDataEdge {
	id: string;
	kind: "data";
	dataType: AutomationDataType;
	source: string;
	sourcePort: string;
	target: string;
	targetPort: string;
}

export type AutomationWorkflowEdge = AutomationControlEdge | AutomationDataEdge;

export interface AutomationWorkflowGraph {
	nodes: AutomationWorkflowGraphNode[];
	edges: AutomationWorkflowEdge[];
}

export interface AutomationWorkflowDocument {
	formatVersion: 2;
	description?: string;
	triggerBindings: TriggerBinding[];
	graph: AutomationWorkflowGraph;
}

export type ConfigFieldType =
	| "boolean"
	| "number"
	| "string"
	| "string[]"
	| "textarea"
	| "code"
	| "python-template";

export interface ConfigFieldSchema {
	type: ConfigFieldType;
	label: string;
	description?: string;
	required?: boolean;
	minimum?: number;
	placeholder?: string;
}

export interface AutomationNodeDefinition {
	type: AutomationWorkflowNodeType;
	label: string;
	description: string;
	category: AutomationNodeCategory;
	defaultConfig: AutomationWorkflowNodeConfig;
	configSchema: Record<string, ConfigFieldSchema>;
	inputs: readonly AutomationPort[];
	outputs: readonly AutomationPort[];
	defaultCodeMode: AutomationNodeCodeMode;
}
