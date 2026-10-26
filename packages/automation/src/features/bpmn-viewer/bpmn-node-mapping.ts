import type { AutomationWorkflowNodeType } from "../../domain/automation-workflow.types";

/**
 * BPMN targetNamespace written by our generator.
 * The import adapter uses this to detect semoss-generated BPMN and preserve
 * automation node IDs on round-trips.
 */
export const SEMOSS_BPMN_NAMESPACE = "https://semoss.org/automation";

/**
 * Canonical BPMN element type for each automation node type.
 * Used both when generating BPMN from automation and when mapping imported
 * BPMN elements back to automation node types.
 */
export const BPMN_ELEMENT_TYPE: Record<AutomationWorkflowNodeType, string> = {
	"trigger.start": "bpmn:StartEvent",
	"control.if": "bpmn:ExclusiveGateway",
	"control.jev": "bpmn:ExclusiveGateway",
	"control.loop": "bpmn:SubProcess",
	"control.wait": "bpmn:IntermediateCatchEvent",
	"developer.python": "bpmn:ScriptTask",
	"agent.run": "bpmn:CallActivity",
	"model.chat": "bpmn:ServiceTask",
	"model.embeddings": "bpmn:ServiceTask",
	"model.vision": "bpmn:ServiceTask",
	"model.ner": "bpmn:ServiceTask",
	"database.query": "bpmn:ServiceTask",
	"database.insert": "bpmn:ServiceTask",
	"database.update": "bpmn:ServiceTask",
	"database.delete": "bpmn:ServiceTask",
	"storage.list": "bpmn:ServiceTask",
	"storage.read": "bpmn:ServiceTask",
	"storage.upload": "bpmn:ServiceTask",
	"storage.download": "bpmn:ServiceTask",
	"storage.delete": "bpmn:ServiceTask",
	"data.extract": "bpmn:ServiceTask",
	"vector.search": "bpmn:ServiceTask",
	"vector.add": "bpmn:ServiceTask",
	"vector.delete": "bpmn:ServiceTask",
	"function.execute": "bpmn:ServiceTask",
	"app.pixel": "bpmn:ServiceTask",
};

/**
 * Reverse map: BPMN element type → automation node type used when the live
 * event bridge converts a newly-added BPMN shape into an automation node.
 *
 * ExclusiveGateway defaults to control.if (the more common decision node).
 * ServiceTask defaults to model.chat (the most common service call).
 * Generic Task defaults to developer.python.
 *
 * The import adapter uses a separate, stricter mapping and may override these.
 */
export const AUTOMATION_NODE_TYPE_BY_BPMN: Partial<
	Record<string, AutomationWorkflowNodeType>
> = {
	"bpmn:StartEvent": "trigger.start",
	"bpmn:ExclusiveGateway": "control.if",
	"bpmn:ScriptTask": "developer.python",
	"bpmn:Task": "developer.python",
	"bpmn:ServiceTask": "model.chat",
	"bpmn:CallActivity": "agent.run",
	"bpmn:SubProcess": "control.loop",
};

/**
 * BPMN structural / annotation elements and their automation equivalents.
 *
 * These are NOT flow nodes — they don't appear in process.flowElements as
 * executable steps. They are either skipped or used to enrich the import.
 *
 * Lane (bpmn:Lane)
 *   → Automation node group. A Pool is the whole process; Lanes subdivide it
 *     by role/system and map 1-to-1 with node groups.
 *   → On export: wrap each node group in a Lane inside the root Pool.
 *
 * DataObjectReference (bpmn:DataObjectReference) + associations
 *   → Step output variables. A DataOutputAssociation from a task to a
 *     DataObjectReference represents that step's outputVar. A
 *     DataInputAssociation from a DataObjectReference into a task means that
 *     task consumes a previous step's output by variable reference.
 *   → On export: generate a DataObjectReference per step outputVar, connected
 *     with DataOutputAssociation / DataInputAssociation edges.
 *
 * DataStoreReference (bpmn:DataStoreReference) + associations
 *   → The DataStoreReference NAME is the database engine parameter on the
 *     task. The cylinder represents the store itself; the connected task is
 *     the operation against it.
 *   → On import: read the DataStoreReference name → set config.engineName on
 *     the connected node (config.engineId stays empty; user confirms in the
 *     inspector since we don't have the system ID from the BPMN file).
 *       DataInputAssociation  (store → task) → read op  (database.query, storage.read, …)
 *       DataOutputAssociation (task → store) → write op (database.insert, storage.upload, …)
 *   → On export: use config.engineName ?? config.engineId as the
 *     DataStoreReference name. Nodes sharing the same engine value reuse
 *     one DataStoreReference shape (dedup by engine value before generating).
 *
 * Participant (bpmn:Participant) / Pool
 *   → The outer process boundary. Only one process is supported; skip
 *     multi-pool collaboration diagrams with a warning.
 */
export const BPMN_STRUCTURAL_TYPES = [
	"bpmn:DataStoreReference",
	"bpmn:DataObjectReference",
	"bpmn:DataObject",
	"bpmn:Participant",
	"bpmn:Lane",
	"bpmn:LaneSet",
] as const;

export type BpmnStructuralType = (typeof BPMN_STRUCTURAL_TYPES)[number];

/** node types that READ from a DataStoreReference (DataInputAssociation: store → task). */
export const DATA_STORE_READ_TYPES: AutomationWorkflowNodeType[] = [
	"database.query",
	"storage.read",
	"storage.list",
	"storage.download",
	"vector.search",
];

/** Node types that WRITE to a DataStoreReference (DataOutputAssociation: task → store). */
export const DATA_STORE_WRITE_TYPES: AutomationWorkflowNodeType[] = [
	"database.insert",
	"database.update",
	"database.delete",
	"storage.upload",
	"storage.delete",
	"vector.add",
	"vector.delete",
];
