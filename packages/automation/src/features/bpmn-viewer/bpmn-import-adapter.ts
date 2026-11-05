import { BpmnModdle, type ModdleElement } from "bpmn-moddle";
import type {
	AutomationEdge,
	AutomationNode,
} from "../../domain/automation.types";
import { getAutomationNodeDefinition } from "../../domain/automation-node-catalog";
import type {
	AutomationBranchClause,
	AutomationWorkflowDocument,
} from "../../domain/automation-workflow.types";
import {
	canvasDocumentToWorkflow,
	createCanvasWorkflowNode,
	getCanvasNodeSources,
} from "../../domain/automation-workflow-adapter";
import {
	type DataStoreEngine,
	matchDataStoreEngine,
} from "./bpmn-engine-match";
import {
	isoDurationToSeconds,
	NUMBER_HELPER_SOURCE,
	translateFeel,
} from "./bpmn-feel";
import {
	BPMN_STRUCTURAL_TYPES,
	DATA_STORE_NODE_TYPES,
	SEMOSS_BPMN_NAMESPACE,
} from "./bpmn-node-mapping";
import { sequentializeFanOut } from "./bpmn-sequentialize";

export interface BpmnImportResult {
	document: AutomationWorkflowDocument;
	nodeSources: Record<string, string>;
	warnings: string[];
}

/** Options for {@link bpmnXmlToAutomationDocument}. */
export interface BpmnImportOptions {
	/**
	 * Engines the user can access. Data stores are matched against these by
	 * name; without them, data-store tasks still import but need their engine
	 * picked in the inspector.
	 */
	engines?: readonly DataStoreEngine[];
}

/** A task's link to a data store: reads from it or writes to it. */
interface DataStoreLink {
	storeName: string;
	mode: "read" | "write";
}

/** BPMN activities that can be wired to a data store. */
const DATA_STORE_TASK_TYPES = new Set([
	"bpmn:Task",
	"bpmn:ServiceTask",
	"bpmn:ScriptTask",
	"bpmn:SendTask",
	"bpmn:ReceiveTask",
	"bpmn:UserTask",
	"bpmn:ManualTask",
	"bpmn:BusinessRuleTask",
]);

interface BpmnBounds {
	x: number;
	y: number;
}

interface GatewayPlan {
	clauses: AutomationBranchClause[];
	clauseFlowIds: Map<string, string>;
	fallbackFlowId: string;
}

const NOT_IMPLEMENTED_SOURCE = (label: string, notes: string[] = []) =>
	[
		...notes.map((note) => `# ${note}`),
		"def run(scope):",
		`    raise NotImplementedError(${JSON.stringify(`Imported BPMN task "${label}" requires an Automation node mapping`)})`,
		"",
	].join("\n");

/**
 * Like NOT_IMPLEMENTED_SOURCE but wraps the body in try/except so the task
 * returns True on success and False on error, which the injected boundary-event
 * decision node reads to choose the happy or error path.
 */
const BOUNDARY_PLACEHOLDER_SOURCE = (label: string, notes: string[] = []) =>
	[
		...notes.map((note) => `# ${note}`),
		"# Return True on success; return False (or raise) to follow the error path.",
		"def run(scope):",
		"    try:",
		`        raise NotImplementedError(${JSON.stringify(`Imported BPMN task "${label}" requires an Automation node mapping`)})`,
		"    except Exception:",
		"        return False",
		"    return True",
		"",
	].join("\n");

function elements(value: unknown): ModdleElement[] {
	return Array.isArray(value)
		? value.filter(
				(item): item is ModdleElement =>
					!!item && typeof item === "object" && "$type" in item,
			)
		: [];
}

function elementId(value: unknown): string | undefined {
	if (typeof value === "string") return value;
	if (value && typeof value === "object" && "get" in value) {
		const id = (value as ModdleElement).get("id");
		return typeof id === "string" ? id : undefined;
	}
	return undefined;
}

function textValue(value: unknown): string | undefined {
	if (typeof value === "string") return value;
	if (value && typeof value === "object" && "get" in value) {
		const body = (value as ModdleElement).get("body");
		return typeof body === "string" ? body : undefined;
	}
	return undefined;
}

function safeId(value: string, usedIds: Set<string>): string {
	const base = `bpmn-${value.replace(/[^A-Za-z0-9_.-]/g, "_") || "node"}`;
	let candidate = base;
	let suffix = 2;
	while (usedIds.has(candidate)) candidate = `${base}-${suffix++}`;
	usedIds.add(candidate);
	return candidate;
}

function positionByElementId(
	diagrams: ModdleElement[],
): Map<string, BpmnBounds> {
	const positions = new Map<string, BpmnBounds>();
	for (const diagram of diagrams) {
		const plane = diagram.get("plane");
		if (!plane || typeof plane !== "object" || !("get" in plane)) continue;
		for (const shape of elements(
			(plane as ModdleElement).get("planeElement"),
		)) {
			if (shape.$type !== "bpmndi:BPMNShape") continue;
			const bpmnElementId = elementId(shape.get("bpmnElement"));
			const bounds = shape.get("bounds");
			if (!bpmnElementId || !bounds || typeof bounds !== "object")
				continue;
			const x = (bounds as ModdleElement).get("x");
			const y = (bounds as ModdleElement).get("y");
			if (typeof x === "number" && typeof y === "number") {
				positions.set(bpmnElementId, { x, y });
			}
		}
	}
	return positions;
}

function translateFeelComparison(expression: string): {
	condition: string;
	warning?: string;
} {
	const feel = expression.trim().replace(/^=/, "").trim();
	const operand = String.raw`(?:[A-Za-z_][A-Za-z0-9_.]*|-?\d+(?:\.\d+)?|true|false|null|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')`;
	const match = feel.match(
		new RegExp(`^(${operand})\\s*(>=|<=|!=|=|>|<)\\s*(${operand})$`, "i"),
	);
	if (!match) {
		return {
			condition: expression,
			warning: `FEEL expression "${expression}" was preserved as text; verify or rewrite it before running the imported workflow.`,
		};
	}
	const convertOperand = (raw: string): string => {
		const value = raw.trim();
		if (
			/^-?\d+(?:\.\d+)?$/.test(value) ||
			/^(true|false|null)$/i.test(value)
		) {
			return value.toLowerCase();
		}
		if (value.startsWith('"') || value.startsWith("'")) {
			return JSON.stringify(value.slice(1, -1));
		}
		return `\${${value}}`;
	};
	const operator = match[2] === "=" ? "==" : match[2];
	return {
		condition: `${convertOperand(match[1])} ${operator} ${convertOperand(match[3])}`,
	};
}

function gatewayPlans(
	gateways: ModdleElement[],
	flows: ModdleElement[],
	warnings: string[],
): Map<string, GatewayPlan> {
	const plans = new Map<string, GatewayPlan>();
	for (const gateway of gateways) {
		const gatewayId = elementId(gateway.get("id"));
		if (!gatewayId) continue;
		const outgoing = flows.filter(
			(flow) => elementId(flow.get("sourceRef")) === gatewayId,
		);
		if (outgoing.length < 2) continue;

		const explicitDefaultId = elementId(gateway.get("default"));
		const defaultFlow =
			outgoing.find(
				(flow) => elementId(flow.get("id")) === explicitDefaultId,
			) ??
			outgoing.find(
				(flow) => !textValue(flow.get("conditionExpression")),
			) ??
			outgoing[outgoing.length - 1];
		const fallbackFlowId = elementId(defaultFlow.get("id"));
		if (!fallbackFlowId) continue;
		if (!explicitDefaultId) {
			warnings.push(
				`Gateway "${String(gateway.get("name") || gatewayId)}" has no BPMN default flow; its last unconditional flow was used as Automation Else.`,
			);
		}

		const clauses: AutomationBranchClause[] = [];
		const clauseFlowIds = new Map<string, string>();
		for (const flow of outgoing) {
			const flowId = elementId(flow.get("id"));
			if (!flowId || flow === defaultFlow) continue;
			const rawCondition = textValue(flow.get("conditionExpression"));
			if (!rawCondition) {
				warnings.push(
					`Gateway flow "${String(flow.get("name") || flowId)}" has no condition; it was imported as an always-true route.`,
				);
			}
			const translated = translateFeelComparison(rawCondition || "true");
			if (translated.warning) warnings.push(translated.warning);
			const clauseId = safeId(flowId, new Set());
			clauses.push({ id: clauseId, condition: translated.condition });
			clauseFlowIds.set(flowId, clauseId);
		}
		if (clauses.length === 0) {
			warnings.push(
				`Gateway "${String(gateway.get("name") || gatewayId)}" could not be represented as a decision and was imported as a placeholder step.`,
			);
			continue;
		}
		plans.set(gatewayId, { clauses, clauseFlowIds, fallbackFlowId });
	}
	return plans;
}

/** The name a data-store reference shows: its own, else its data store's. */
function dataStoreName(reference: ModdleElement): string {
	const own = reference.get("name");
	if (typeof own === "string" && own.trim()) return own.trim();
	const store = reference.get("dataStoreRef");
	if (store && typeof store === "object" && "get" in store) {
		const name = (store as ModdleElement).get("name");
		if (typeof name === "string" && name.trim()) return name.trim();
	}
	return "";
}

function refList(value: unknown): unknown[] {
	if (Array.isArray(value)) return value;
	return value ? [value] : [];
}

/**
 * Finds which tasks are wired to a data store and in which direction.
 *
 * A data input association (store to task) or an association drawn from the
 * store is a read; a data output association (task to store) or an association
 * drawn to the store is a write. A task that does both is treated as reading.
 */
function dataStoreLinks(
	flowNodes: ModdleElement[],
	artifacts: ModdleElement[],
): { links: Map<string, DataStoreLink>; linkedStoreIds: Set<string> } {
	const storeNames = new Map<string, string>();
	for (const element of flowNodes) {
		const id = elementId(element.get("id"));
		if (id && element.$type === "bpmn:DataStoreReference") {
			storeNames.set(id, dataStoreName(element));
		}
	}
	const links = new Map<string, DataStoreLink>();
	const linkedStoreIds = new Set<string>();
	const link = (
		taskId: string,
		storeId: string | undefined,
		mode: DataStoreLink["mode"],
	) => {
		if (!storeId || !storeNames.has(storeId)) return;
		linkedStoreIds.add(storeId);
		const existing = links.get(taskId);
		if (existing?.mode === "read" && mode === "write") return;
		links.set(taskId, {
			storeName: storeNames.get(storeId) ?? "",
			mode,
		});
	};

	for (const task of flowNodes) {
		const taskId = elementId(task.get("id"));
		if (!taskId || !DATA_STORE_TASK_TYPES.has(task.$type)) continue;
		for (const association of elements(
			task.get("dataOutputAssociations"),
		)) {
			link(taskId, elementId(association.get("targetRef")), "write");
		}
		for (const association of elements(task.get("dataInputAssociations"))) {
			for (const source of refList(association.get("sourceRef"))) {
				link(taskId, elementId(source), "read");
			}
		}
	}
	for (const association of artifacts) {
		if (association.$type !== "bpmn:Association") continue;
		const source = elementId(association.get("sourceRef"));
		const target = elementId(association.get("targetRef"));
		if (source && target && storeNames.has(source)) {
			link(target, source, "read");
		} else if (source && target && storeNames.has(target)) {
			link(source, target, "write");
		}
	}
	return { links, linkedStoreIds };
}

/**
 * Builds the automation node for a task wired to a data store. The node type
 * follows the matched engine's type and the link direction; the engine id is
 * set when the store's name matches an engine the user can access.
 */
function dataStoreNode(
	label: string,
	index: number,
	position: BpmnBounds,
	link: DataStoreLink,
	engines: readonly DataStoreEngine[],
	warnings: string[],
): AutomationNode | undefined {
	const engine = matchDataStoreEngine(engines, link.storeName);
	const type = DATA_STORE_NODE_TYPES[engine?.type ?? "DATABASE"][link.mode];
	if (!getAutomationNodeDefinition(type)) return undefined;
	const node = createCanvasWorkflowNode(type, index);
	node.label = label;
	node.position = position;
	if (engine) {
		node.config = { ...node.config, engineId: engine.id };
		node.workflowConfig = { ...node.workflowConfig, engineId: engine.id };
	} else {
		warnings.push(
			`Data store "${link.storeName || "(unnamed)"}" did not match an engine you can access; "${label}" was imported as ${type} and needs its engine selected in the inspector.`,
		);
	}
	return node;
}

/** What a Camunda task carries in its extension elements or attributes. */
interface CamundaTaskInfo {
	/** Script body, a FEEL expression for Camunda 8 (`zeebe:script`). */
	expression?: string;
	/** Variable the task's result is stored in. */
	resultVariable?: string;
	/** Id of the DMN decision a business rule task calls. */
	decisionId?: string;
	/** Job type an external worker picks up (`zeebe:taskDefinition`). */
	jobType?: string;
}

function nonEmptyString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value : undefined;
}

/** Reads the Camunda 8 (zeebe) and Camunda 7 settings a task needs. */
function camundaTaskInfo(element: ModdleElement): CamundaTaskInfo {
	const info: CamundaTaskInfo = {};
	const extensions = element.get("extensionElements");
	const values =
		extensions && typeof extensions === "object" && "get" in extensions
			? elements((extensions as ModdleElement).get("values"))
			: [];
	for (const value of values) {
		const record = value as unknown as Record<string, unknown>;
		if (value.$type.endsWith(":script")) {
			info.expression = nonEmptyString(record.expression);
			info.resultVariable ??= nonEmptyString(record.resultVariable);
		} else if (value.$type.endsWith(":taskDefinition")) {
			info.jobType = nonEmptyString(record.type);
		} else if (value.$type.endsWith(":calledDecision")) {
			info.decisionId = nonEmptyString(record.decisionId);
			info.resultVariable ??= nonEmptyString(record.resultVariable);
		}
	}
	const attributes = (
		element as unknown as { $attrs?: Record<string, unknown> }
	).$attrs;
	info.resultVariable ??= nonEmptyString(
		attributes?.["camunda:resultVariable"],
	);
	info.decisionId ??= nonEmptyString(attributes?.["camunda:decisionRef"]);
	return info;
}

/** Seconds of a timer event that waits a fixed duration, else undefined. */
function timerDurationSeconds(element: ModdleElement): number | undefined {
	for (const definition of elements(element.get("eventDefinitions"))) {
		if (definition.$type !== "bpmn:TimerEventDefinition") continue;
		const duration = textValue(definition.get("timeDuration"));
		return duration ? isoDurationToSeconds(duration) : undefined;
	}
	return undefined;
}

/**
 * Explains a boundary event that was skipped: what it watched, and where its
 * flow led. Automation has no boundary events, so a node made from one would
 * have no incoming connection and nothing to do.
 */
function boundaryEventWarning(
	event: ModdleElement,
	flows: ModdleElement[],
	flowNodes: ModdleElement[],
): string {
	const eventId = elementId(event.get("id")) ?? "";
	const attached = event.get("attachedToRef");
	const attachedName =
		attached && typeof attached === "object" && "get" in attached
			? String(
					(attached as ModdleElement).get("name") ||
						elementId(attached),
				)
			: "a task";
	const kind =
		elements(event.get("eventDefinitions"))[0]
			?.$type.replace("bpmn:", "")
			.replace("EventDefinition", "")
			.toLowerCase() ?? "";
	const leaving = flows.filter(
		(flow) => elementId(flow.get("sourceRef")) === eventId,
	);
	const name =
		String(event.get("name") || "") ||
		String(leaving[0]?.get("name") || "") ||
		eventId;
	const targets = leaving
		.map((flow) => {
			const target = flowNodes.find(
				(node) =>
					elementId(node.get("id")) ===
					elementId(flow.get("targetRef")),
			);
			return target
				? `"${String(target.get("name") || elementId(target))}"`
				: "";
		})
		.filter(Boolean);
	return `BPMN ${kind ? `${kind} ` : ""}boundary event "${name}" on "${attachedName}" has no Automation equivalent and was skipped${targets.length > 0 ? `; the path it started (to ${targets.join(", ")}) was not imported` : ""}.`;
}

/** A valid output variable name, from a BPMN result variable. */
function outputVariableName(value: string): string {
	const cleaned = value.trim().replace(/[^A-Za-z0-9_]+/g, "_");
	return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function placeholderNode(
	label: string,
	index: number,
	position: BpmnBounds,
	notes: string[] = [],
): AutomationNode {
	const node = createCanvasWorkflowNode("developer.python", index);
	node.label = label;
	node.position = position;
	const pythonSource = NOT_IMPLEMENTED_SOURCE(label, notes);
	node.workflowConfig = { ...node.workflowConfig, pythonSource };
	return node;
}

/** A Python step with working source, for a translated script task. */
function scriptNode(
	label: string,
	index: number,
	position: BpmnBounds,
	pythonSource: string,
): AutomationNode {
	const node = createCanvasWorkflowNode("developer.python", index);
	node.label = label;
	node.position = position;
	node.workflowConfig = { ...node.workflowConfig, pythonSource };
	return node;
}

/** A wait step for a timer that waits a fixed duration. */
function waitNode(
	label: string,
	index: number,
	position: BpmnBounds,
	seconds: number,
): AutomationNode {
	const node = createCanvasWorkflowNode("control.wait", index);
	node.label = label;
	node.position = position;
	node.config = { ...node.config, seconds: String(seconds) };
	node.workflowConfig = { ...node.workflowConfig, durationSeconds: seconds };
	return node;
}

/** Converts a BPMN document into the Automation canonical workflow format. */
export async function bpmnXmlToAutomationDocument(
	xml: string,
	fileName: string,
	options: BpmnImportOptions = {},
): Promise<BpmnImportResult> {
	const { rootElement, warnings: parserWarnings } =
		await new BpmnModdle().fromXML(xml, "bpmn:Definitions");
	const processes = elements(rootElement.get("rootElements")).filter(
		(element) => element.$type === "bpmn:Process",
	);
	if (processes.length === 0)
		throw new Error("BPMN file has no process to import.");
	const process = processes[0];
	const warnings = parserWarnings.map((warning) => warning.message);
	if (processes.length > 1) {
		warnings.push("Only the first BPMN process was imported.");
	}

	const flowElements = elements(process.get("flowElements"));
	const flows = flowElements.filter(
		(element) => element.$type === "bpmn:SequenceFlow",
	);
	const flowNodes = flowElements.filter(
		(element) => element.$type !== "bpmn:SequenceFlow",
	);
	const gateways = flowNodes.filter(
		(element) => element.$type === "bpmn:ExclusiveGateway",
	);
	const plans = gatewayPlans(gateways, flows, warnings);
	const { links: storeLinks, linkedStoreIds } = dataStoreLinks(
		flowNodes,
		elements(process.get("artifacts")),
	);
	const positions = positionByElementId(
		elements(rootElement.get("diagrams")),
	);
	// When the BPMN was generated by us, element IDs ARE the automation node
	// IDs — preserve them directly so round-trips keep stable node IDs.
	const isSemossGenerated =
		String(rootElement.get("targetNamespace")) === SEMOSS_BPMN_NAMESPACE;
	const usedIds = new Set<string>();
	const automationIdByBpmnId = new Map<string, string>();
	const automationNodeByBpmnId = new Map<string, AutomationNode>();
	const nodeSources: Record<string, string> = {};
	const steps: AutomationNode[] = [];
	const parallelGatewayIds = new Set<string>();
	const usedOutputVars = new Set<string>();
	const referencedVariables = new Set<string>();
	const idFor = (element: ModdleElement): string => {
		const id = elementId(element.get("id"));
		if (!id) throw new Error(`BPMN ${element.$type} is missing an id.`);
		const existing = automationIdByBpmnId.get(id);
		if (existing) return existing;
		const automationId = isSemossGenerated ? id : safeId(id, usedIds);
		if (isSemossGenerated) usedIds.add(id);
		automationIdByBpmnId.set(id, automationId);
		return automationId;
	};

	// Group interrupting boundary events by the task they're attached to so we
	// can inject an error-check decision node after each affected task.
	const boundaryEventsByTask = new Map<string, ModdleElement[]>();
	for (const element of flowNodes) {
		if (element.$type !== "bpmn:BoundaryEvent") continue;
		const attached = element.get("attachedToRef");
		const attachedId = elementId(attached);
		if (!attachedId) continue;
		// Non-interrupting boundary events (cancelActivity=false) have no
		// Automation equivalent; only collect interrupting ones.
		if (element.get("cancelActivity") === false) continue;
		const list = boundaryEventsByTask.get(attachedId) ?? [];
		boundaryEventsByTask.set(attachedId, [...list, element]);
	}

	/** Injected control.if plan for a task that has boundary events. */
	interface BoundaryPlan {
		ifNode: AutomationNode;
		clauseId: string;
		successVar: string;
	}
	const boundaryPlanByTaskBpmnId = new Map<string, BoundaryPlan>();
	const boundaryPlanByEventId = new Map<string, BoundaryPlan>();

	const structuralTypes = new Set<string>(BPMN_STRUCTURAL_TYPES);
	let nodeIndex = 0;
	for (const element of flowNodes) {
		const bpmnId = elementId(element.get("id"));
		if (!bpmnId) continue;
		if (element.$type === "bpmn:BoundaryEvent") {
			// Non-interrupting boundary events have no Automation equivalent and
			// are warned about here. Interrupting ones are handled by the parent
			// task below, which injects a decision node in their place.
			if (element.get("cancelActivity") === false) {
				warnings.push(boundaryEventWarning(element, flows, flowNodes));
			}
			continue;
		}
		// Skip structural BPMN elements (pools, lanes, data stores, data objects)
		// — they have no automation node equivalent and are noted in bpmn-node-mapping.ts.
		if (structuralTypes.has(element.$type)) {
			// A data store wired to a task is consumed by that task's node.
			if (linkedStoreIds.has(bpmnId)) continue;
			const label = String(element.get("name") || bpmnId);
			warnings.push(
				`"${label}" (${element.$type.replace("bpmn:", "")}) was skipped — data stores, pools, and lanes have no Automation node equivalent yet.`,
			);
			continue;
		}
		const label = String(element.get("name") || bpmnId);
		const position = positions.get(bpmnId) ?? {
			x: 0,
			y: nodeIndex * 160,
		};
		let node: AutomationNode;
		if (element.$type === "bpmn:EndEvent") continue;
		const dataStoreLink = storeLinks.get(bpmnId);
		const dataStoreTaskNode = dataStoreLink
			? dataStoreNode(
					label,
					nodeIndex,
					position,
					dataStoreLink,
					options.engines ?? [],
					warnings,
				)
			: undefined;
		if (element.$type === "bpmn:StartEvent") {
			node = createCanvasWorkflowNode("trigger.start", nodeIndex);
			node.label = label;
			node.position = position;
		} else if (
			element.$type === "bpmn:ExclusiveGateway" &&
			plans.has(bpmnId)
		) {
			node = createCanvasWorkflowNode("control.if", nodeIndex);
			node.label = label;
			node.position = position;
			const clauses = plans.get(bpmnId)?.clauses ?? [];
			node.config = { clauses };
			node.workflowConfig = { ...node.workflowConfig, clauses };
		} else if (dataStoreTaskNode) {
			node = dataStoreTaskNode;
		} else if (
			element.$type === "bpmn:IntermediateCatchEvent" &&
			timerDurationSeconds(element) !== undefined &&
			getAutomationNodeDefinition("control.wait")
		) {
			node = waitNode(
				label,
				nodeIndex,
				position,
				timerDurationSeconds(element) as number,
			);
		} else {
			const info = camundaTaskInfo(element);
			const translation =
				element.$type === "bpmn:ScriptTask" && info.expression
					? translateFeel(info.expression)
					: null;
			if (translation && info.expression) {
				for (const name of translation.variables) {
					referencedVariables.add(name);
				}
				node = scriptNode(
					label,
					nodeIndex,
					position,
					[
						`# Imported from BPMN script task "${label}".`,
						`# FEEL: ${info.expression.replace(/\s+/g, " ").trim()}`,
						...(translation.usesNumberHelper
							? [NUMBER_HELPER_SOURCE]
							: []),
						"def run(scope):",
						`    return ${translation.python}`,
						"",
					].join("\n"),
				);
			} else {
				const notes = [
					`Imported from BPMN ${element.$type.replace("bpmn:", "")} "${label}".`,
				];
				if (info.expression) {
					notes.push(
						`FEEL: ${info.expression.replace(/\s+/g, " ").trim()}`,
						"Translate this expression to Python.",
					);
				}
				if (info.jobType) {
					notes.push(
						`Camunda job type "${info.jobType}", handled by an external worker.`,
					);
				}
				if (info.decisionId) {
					notes.push(
						`Calls DMN decision "${info.decisionId}", which was not imported.`,
					);
				}
				node = placeholderNode(label, nodeIndex, position, notes);
			}
			if (info.expression && !translation) {
				warnings.push(
					`BPMN ScriptTask "${label}": its FEEL expression could not be translated; it is kept as a comment in the placeholder Python.`,
				);
			} else if (info.decisionId) {
				warnings.push(
					`BPMN BusinessRuleTask "${label}" calls decision table "${info.decisionId}", which was not imported; it became a Python placeholder.`,
				);
			} else if (
				!translation &&
				element.$type !== "bpmn:ExclusiveGateway" &&
				element.$type !== "bpmn:ParallelGateway"
			) {
				warnings.push(
					`BPMN ${element.$type.replace("bpmn:", "")} "${label}" has no Automation mapping and was imported as a Python placeholder${info.jobType ? ` (Camunda job type "${info.jobType}")` : ""}.`,
				);
			} else if (plans.has(bpmnId)) {
				warnings.push(
					`Gateway "${label}" has no usable conditional routes and was imported as a placeholder step.`,
				);
			}
		}
		node.id = idFor(element);
		const resultVariable = camundaTaskInfo(element).resultVariable;
		if (resultVariable && node.workflowType === "developer.python") {
			// The task's result is the value its step publishes, so later steps and
			// decisions can read it by this name.
			const base = outputVariableName(resultVariable);
			let candidate = base;
			let suffix = 2;
			while (usedOutputVars.has(candidate))
				candidate = `${base}_${suffix++}`;
			if (candidate !== base) {
				warnings.push(
					`"${label}" stores its result in "${base}", already used by another step; it was named "${candidate}".`,
				);
			}
			node.outputVar = candidate;
		}
		usedOutputVars.add(node.outputVar);
		if (element.$type === "bpmn:ParallelGateway") {
			parallelGatewayIds.add(node.id);
		}
		if (node.workflowType === "developer.python") {
			const source = node.workflowConfig?.pythonSource;
			if (typeof source === "string") nodeSources[node.id] = source;
		}
		automationNodeByBpmnId.set(bpmnId, node);
		steps.push(node);
		nodeIndex++;

		// Inject a control.if decision node for tasks that have interrupting
		// boundary events. The task's Python is replaced with a try/except that
		// returns True on success and False on error; the decision node routes
		// to the happy path (else) or the error path (case) accordingly.
		const taskBoundaryEvents = boundaryEventsByTask.get(bpmnId);
		if (
			taskBoundaryEvents &&
			taskBoundaryEvents.length > 0 &&
			node.workflowType === "developer.python" &&
			getAutomationNodeDefinition("control.if")
		) {
			const successVar = (() => {
				const base = outputVariableName(`${label}_ok`);
				let candidate = base;
				let suffix = 2;
				while (usedOutputVars.has(candidate))
					candidate = `${base}_${suffix++}`;
				return candidate;
			})();
			usedOutputVars.add(successVar);

			const info = camundaTaskInfo(element);
			const notes = [
				`Imported from BPMN ${element.$type.replace("bpmn:", "")} "${label}".`,
			];
			if (info.expression)
				notes.push(
					`FEEL: ${info.expression.replace(/\s+/g, " ").trim()}`,
					"Translate this expression to Python.",
				);
			if (info.jobType)
				notes.push(
					`Camunda job type "${info.jobType}", handled by an external worker.`,
				);
			if (info.decisionId)
				notes.push(
					`Calls DMN decision "${info.decisionId}", which was not imported.`,
				);
			const newSource = BOUNDARY_PLACEHOLDER_SOURCE(label, notes);
			node.outputVar = successVar;
			node.workflowConfig = {
				...node.workflowConfig,
				pythonSource: newSource,
			};
			nodeSources[node.id] = newSource;

			const ifNode = createCanvasWorkflowNode("control.if", nodeIndex);
			ifNode.id = safeId(`${bpmnId}-boundary-check`, usedIds);
			ifNode.label = `${label}: error check`;
			ifNode.position = { x: position.x + 160, y: position.y };
			const clauseId = safeId(`${bpmnId}-error`, usedIds);
			const clauses = [
				{ id: clauseId, condition: `\${${successVar}} == False` },
			];
			ifNode.config = { clauses };
			ifNode.workflowConfig = { ...ifNode.workflowConfig, clauses };
			steps.push(ifNode);
			nodeIndex++;

			const plan: BoundaryPlan = { ifNode, clauseId, successVar };
			boundaryPlanByTaskBpmnId.set(bpmnId, plan);

			const [primary, ...extras] = taskBoundaryEvents;
			const primaryId = elementId(primary.get("id"));
			if (primaryId) boundaryPlanByEventId.set(primaryId, plan);
			for (const extra of extras) {
				const extraId = elementId(extra.get("id"));
				if (extraId) boundaryPlanByEventId.set(extraId, plan);
				const extraName = String(extra.get("name") || extraId);
				const primaryName = String(primary.get("name") || primaryId);
				warnings.push(
					`"${label}" has multiple boundary events; only the "${primaryName}" error path was imported. "${extraName}" was skipped.`,
				);
			}

			const eventKind =
				elements(primary.get("eventDefinitions"))[0]
					?.$type.replace("bpmn:", "")
					.replace("EventDefinition", "")
					.toLowerCase() ?? "";
			warnings.push(
				`BPMN ${eventKind ? `${eventKind} ` : ""}boundary event on "${label}" was converted to an error-check decision; fill in the placeholder and return True on success or False to follow the error path.`,
			);
		} else if (
			taskBoundaryEvents &&
			taskBoundaryEvents.length > 0 &&
			node.workflowType !== "developer.python"
		) {
			// Non-placeholder nodes (data stores, wait, etc.) can't be wrapped.
			for (const event of taskBoundaryEvents) {
				warnings.push(boundaryEventWarning(event, flows, flowNodes));
			}
		}
	}

	if (!steps.some((step) => step.workflowType === "trigger.start")) {
		const trigger = createCanvasWorkflowNode("trigger.start", 0);
		trigger.id = safeId("start", usedIds);
		trigger.position = { x: 0, y: 0 };
		steps.unshift(trigger);
		warnings.push(
			"No BPMN start event was found; a manual Automation trigger was added.",
		);
	}

	const edges: AutomationEdge[] = [];
	for (const flow of flows) {
		const flowId = elementId(flow.get("id"));
		const sourceBpmnId = elementId(flow.get("sourceRef"));
		const targetBpmnId = elementId(flow.get("targetRef"));
		if (!flowId || !sourceBpmnId || !targetBpmnId) continue;

		// Boundary event flow: the source is the boundary event element itself,
		// not the task. Route it to the case handle of the injected decision node.
		const boundaryPlan = boundaryPlanByEventId.get(sourceBpmnId);
		if (boundaryPlan) {
			const { ifNode, clauseId } = boundaryPlan;
			let target = automationNodeByBpmnId.get(targetBpmnId);
			if (!target) {
				// Target is an end event not yet imported. Create a terminal
				// placeholder so the case branch has a named, visible endpoint on
				// the canvas. Two boundary events that share the same end event
				// both find it in automationNodeByBpmnId after the first creates it.
				const endElement = flowNodes.find(
					(e) => elementId(e.get("id")) === targetBpmnId,
				);
				if (endElement) {
					const endLabel = String(
						endElement.get("name") || targetBpmnId,
					);
					const endPosition = positions.get(targetBpmnId) ?? {
						x: ifNode.position.x + 200,
						y: ifNode.position.y + 120,
					};
					const endNode = placeholderNode(
						endLabel,
						nodeIndex,
						endPosition,
						[
							`Imported from BPMN end event "${endLabel}".`,
							"Terminal path — add any cleanup logic here.",
						],
					);
					endNode.id = safeId(targetBpmnId, usedIds);
					const endSource = endNode.workflowConfig?.pythonSource;
					if (typeof endSource === "string")
						nodeSources[endNode.id] = endSource;
					automationNodeByBpmnId.set(targetBpmnId, endNode);
					steps.push(endNode);
					nodeIndex++;
					target = endNode;
				}
			}
			if (!target) continue;
			edges.push({
				id: safeId(flowId, usedIds),
				source: ifNode.id,
				target: target.id,
				sourceHandle: `case-${ifNode.id}-${clauseId}`,
				targetHandle: `in-${target.id}`,
			});
			continue;
		}

		const source = automationNodeByBpmnId.get(sourceBpmnId);
		if (!source) continue;

		// Task flow where the task has an injected boundary-check decision node:
		// intercept it so the path runs task → if-node → target (else = success).
		// Check this before looking up target because target may be an end event
		// that was not imported — the task → if-node edge must still be emitted.
		const taskBoundaryPlan = boundaryPlanByTaskBpmnId.get(sourceBpmnId);
		if (taskBoundaryPlan) {
			const { ifNode } = taskBoundaryPlan;
			// Add the task → if-node edge only once (the task may have multiple
			// outgoing flows if drawn with parallel exits, unlikely but possible).
			if (
				!edges.some(
					(e) => e.source === source.id && e.target === ifNode.id,
				)
			) {
				edges.push({
					id: safeId(`${flowId}-gate`, usedIds),
					source: source.id,
					target: ifNode.id,
					sourceHandle: `out-${source.id}`,
					targetHandle: `in-${ifNode.id}`,
				});
			}
			const target = automationNodeByBpmnId.get(targetBpmnId);
			if (target) {
				edges.push({
					id: safeId(flowId, usedIds),
					source: ifNode.id,
					target: target.id,
					sourceHandle: `else-${ifNode.id}`,
					targetHandle: `in-${target.id}`,
				});
			}
			continue;
		}

		const target = automationNodeByBpmnId.get(targetBpmnId);
		if (!target) continue;

		let sourceHandle = `out-${source.id}`;
		const plan = plans.get(sourceBpmnId);
		if (plan) {
			if (flowId === plan.fallbackFlowId) {
				sourceHandle = `else-${source.id}`;
			} else {
				const clauseId = plan.clauseFlowIds.get(flowId);
				if (clauseId) sourceHandle = `case-${source.id}-${clauseId}`;
			}
		}
		edges.push({
			id: safeId(flowId, usedIds),
			source: source.id,
			target: target.id,
			sourceHandle,
			targetHandle: `in-${target.id}`,
		});
	}

	// Automation runs in sequence and only a decision node may branch, so
	// parallel paths are put in order and parallel gateways are dropped.
	const sequential = sequentializeFanOut(
		steps,
		edges,
		parallelGatewayIds,
		warnings,
	);
	steps.splice(0, steps.length, ...sequential.steps);
	edges.splice(0, edges.length, ...sequential.edges);
	for (const gatewayId of parallelGatewayIds) delete nodeSources[gatewayId];

	for (const plan of plans.values()) {
		for (const clause of plan.clauses) {
			for (const match of clause.condition.matchAll(
				/\$\{([A-Za-z_][A-Za-z0-9_]*)/g,
			)) {
				referencedVariables.add(match[1]);
			}
		}
	}
	const producedVariables = new Set(steps.map((step) => step.outputVar));
	const unproduced = [...referencedVariables].filter(
		(name) => !producedVariables.has(name),
	);
	if (unproduced.length > 0) {
		warnings.push(
			`Variables ${unproduced.map((name) => `"${name}"`).join(", ")} are used by imported steps but no step produces them; provide them as run inputs.`,
		);
	}

	const canvasDocument = {
		description: String(
			process.get("name") || fileName.replace(/\.[^.]+$/, ""),
		),
		triggerBindings: [{ id: "manual", type: "manual" as const }],
		steps,
		edges,
		nodeGroups: [],
	};
	return {
		document: canvasDocumentToWorkflow(canvasDocument),
		nodeSources: {
			...nodeSources,
			...getCanvasNodeSources(steps),
		},
		warnings,
	};
}
