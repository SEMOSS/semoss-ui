export type AutomationWorkflowNodeType =
	| "trigger.start"
	| "database.query"
	| "database.insert"
	| "database.update"
	| "database.delete"
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
	| "agent.run"
	| "app.pixel"
	| "control.wait"
	| "control.if"
	| "control.jev"
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
	| "agent"
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

export interface AutomationWorkflowNodeConfig
	extends Record<
		string,
		| AutomationJsonValue
		| AutomationBranchClause[]
		| AutomationJevRoute[]
		| AutomationGlobalVariable[]
		| undefined
	> {
	/** Python artifact executed for this non-trigger node. */
	pythonSource?: string;
}

/** JSON-compatible configuration supplied by a backend node definition. */
export type AutomationJsonValue =
	| boolean
	| number
	| string
	| null
	| AutomationJsonValue[]
	| { [key: string]: AutomationJsonValue };

/** An ordered conditional route on a `control.if` node. */
export interface AutomationBranchClause {
	id: string;
	condition: string;
}

/** A named route exposed by a `control.jev` decision node. */
export interface AutomationJevRoute {
	id: string;
	description: string;
	/** Explicit outcome represented by this route for a Noul Yes/No question. */
	answer?: boolean;
}

/** A trigger-owned input available to every downstream node at runtime. */
export interface AutomationGlobalVariable {
	name: string;
	defaultValue: string;
	description?: string;
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
	| "branch-clauses"
	| "number"
	| "engine"
	| "globals"
	| "json"
	| "string"
	| "string[]"
	| "textarea"
	| "code";

export interface ConfigFieldSchema {
	type: ConfigFieldType;
	label: string;
	description?: string;
	required?: boolean;
	minimum?: number;
	maximum?: number;
	placeholder?: string;
	defaultValue?: AutomationJsonValue;
	engineType?: string;
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
	requiredPermission: string;
	supportsOutput: boolean;
	supportsCustomCode: boolean;
	engineType?: string;
}

/** Versioned node-definition catalog returned by SEMOSS. */
export interface AutomationNodeCatalog {
	schemaVersion: number;
	nodes: readonly AutomationNodeDefinition[];
}
