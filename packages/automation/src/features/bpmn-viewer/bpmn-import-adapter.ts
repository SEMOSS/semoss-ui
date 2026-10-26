import { BpmnModdle, type ModdleElement } from "bpmn-moddle";
import type {
	AutomationEdge,
	AutomationNode,
} from "../../domain/automation.types";
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
	BPMN_STRUCTURAL_TYPES,
	SEMOSS_BPMN_NAMESPACE,
} from "./bpmn-node-mapping";

export interface BpmnImportResult {
	document: AutomationWorkflowDocument;
	nodeSources: Record<string, string>;
	warnings: string[];
}

interface BpmnBounds {
	x: number;
	y: number;
}

interface GatewayPlan {
	clauses: AutomationBranchClause[];
	clauseFlowIds: Map<string, string>;
	fallbackFlowId: string;
}

const NOT_IMPLEMENTED_SOURCE = (label: string) =>
	[
		"def run(scope):",
		`    raise NotImplementedError(${JSON.stringify(`Imported BPMN task "${label}" requires an Automation node mapping`)})`,
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

function placeholderNode(
	label: string,
	index: number,
	position: BpmnBounds,
): AutomationNode {
	const node = createCanvasWorkflowNode("developer.python", index);
	node.label = label;
	node.position = position;
	const pythonSource = NOT_IMPLEMENTED_SOURCE(label);
	node.workflowConfig = { ...node.workflowConfig, pythonSource };
	return node;
}

/** Converts a BPMN document into the Automation canonical workflow format. */
export async function bpmnXmlToAutomationDocument(
	xml: string,
	fileName: string,
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

	const structuralTypes = new Set<string>(BPMN_STRUCTURAL_TYPES);
	let nodeIndex = 0;
	for (const element of flowNodes) {
		const bpmnId = elementId(element.get("id"));
		if (!bpmnId) continue;
		// Skip structural BPMN elements (pools, lanes, data stores, data objects)
		// — they have no automation node equivalent and are noted in bpmn-node-mapping.ts.
		if (structuralTypes.has(element.$type)) {
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
		} else {
			node = placeholderNode(label, nodeIndex, position);
			if (element.$type !== "bpmn:ExclusiveGateway") {
				warnings.push(
					`BPMN ${element.$type.replace("bpmn:", "")} "${label}" has no Automation mapping and was imported as a Python placeholder.`,
				);
			} else if (plans.has(bpmnId)) {
				warnings.push(
					`Gateway "${label}" has no usable conditional routes and was imported as a placeholder step.`,
				);
			}
		}
		node.id = idFor(element);
		if (node.workflowType === "developer.python") {
			const source = node.workflowConfig?.pythonSource;
			if (typeof source === "string") nodeSources[node.id] = source;
		}
		automationNodeByBpmnId.set(bpmnId, node);
		steps.push(node);
		nodeIndex++;
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
		const source = automationNodeByBpmnId.get(sourceBpmnId);
		const target = automationNodeByBpmnId.get(targetBpmnId);
		if (!source || !target) continue;
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
