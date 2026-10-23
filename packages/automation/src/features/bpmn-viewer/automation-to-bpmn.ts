import { BpmnModdle, type ModdleElement } from "bpmn-moddle";
import type {
	AutomationEdge,
	AutomationNode,
	RoutingConfig,
} from "../../domain/automation.types";

interface DiagramBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface DiagramPoint {
	x: number;
	y: number;
}

interface DiagramConnection {
	element: ModdleElement;
	waypoints: DiagramPoint[];
}

interface BranchFlowDetails {
	name: string;
	documentation?: string;
}

function createBpmnId(
	prefix: string,
	value: string,
	usedIds: Set<string>,
): string {
	const sanitized = value.replace(/[^A-Za-z0-9_.-]/g, "_") || "item";
	const base = `${prefix}_${sanitized}`;
	let id = base;
	let suffix = 2;
	while (usedIds.has(id)) {
		id = `${base}_${suffix++}`;
	}
	usedIds.add(id);
	return id;
}

function collection(parent: ModdleElement, property: string): ModdleElement[] {
	const current = parent.get(property);
	if (Array.isArray(current)) return current as ModdleElement[];
	const created: ModdleElement[] = [];
	parent.set(property, created);
	return created;
}

function nodeDimensions(
	node: AutomationNode,
): Pick<DiagramBounds, "width" | "height"> {
	if (node.type === "trigger") return { width: 36, height: 36 };
	if (node.type === "branch") return { width: 52, height: 52 };
	if (node.type === "loop") return { width: 180, height: 100 };
	return { width: 156, height: 80 };
}

function nodeBpmnType(node: AutomationNode): string {
	if (node.type === "trigger") return "bpmn:StartEvent";
	if (node.type === "branch") return "bpmn:ExclusiveGateway";
	if (node.type === "loop") return "bpmn:SubProcess";
	return "bpmn:Task";
}

function branchClauses(node: AutomationNode): unknown[] {
	const clauses =
		node.workflowConfig?.clauses ?? (node.config as RoutingConfig).clauses;
	return Array.isArray(clauses) ? clauses : [];
}

function branchRouteIndex(
	node: AutomationNode,
	edge: AutomationEdge,
	clauses: unknown[],
): number {
	if (edge.sourceHandle?.startsWith("else-")) return clauses.length;
	return clauses.findIndex((item) => {
		if (!item || typeof item !== "object" || !("id" in item)) return false;
		return edge.sourceHandle === `case-${node.id}-${item.id}`;
	});
}

function branchFlowDetails(
	node: AutomationNode,
	edge: AutomationEdge,
): BranchFlowDetails | undefined {
	if (node.type !== "branch") return undefined;
	const clauses = branchClauses(node);
	if (edge.sourceHandle?.startsWith("else-")) {
		return {
			name: node.workflowType === "control.jev" ? "Fallback" : "Else",
		};
	}
	const clauseIndex = branchRouteIndex(node, edge, clauses);
	const clause = clauses[clauseIndex];
	if (!clause || typeof clause !== "object") return undefined;
	const description =
		"condition" in clause && typeof clause.condition === "string"
			? clause.condition
			: "description" in clause && typeof clause.description === "string"
				? clause.description
				: undefined;
	return {
		name:
			node.workflowType === "control.jev"
				? `Route ${clauseIndex + 1}`
				: `Condition ${clauseIndex + 1}`,
		...(description ? { documentation: description } : {}),
	};
}

function branchSourcePoint(
	node: AutomationNode,
	edge: AutomationEdge,
	bounds: DiagramBounds,
): DiagramPoint {
	const clauses = branchClauses(node);
	const routeCount = clauses.length + 1;
	const routeIndex = Math.max(0, branchRouteIndex(node, edge, clauses));
	const normalizedY = (routeIndex + 1) / (routeCount + 1);
	const offsetY = (normalizedY - 0.5) * bounds.height * 0.8;
	return {
		x: bounds.x + bounds.width - Math.abs(offsetY),
		y: bounds.y + bounds.height / 2 + offsetY,
	};
}

function branchFlowDocumentation(
	moddle: BpmnModdle,
	element: ModdleElement,
	documentation: string | undefined,
): void {
	if (!documentation) return;
	collection(element, "documentation").push(
		moddle.create("bpmn:Documentation", { text: documentation }),
	);
}

function directConnectionWaypoints(
	source: DiagramBounds,
	target: DiagramBounds,
): DiagramPoint[] {
	const sourceCenter = {
		x: source.x + source.width / 2,
		y: source.y + source.height / 2,
	};
	const targetCenter = {
		x: target.x + target.width / 2,
		y: target.y + target.height / 2,
	};
	const dx = targetCenter.x - sourceCenter.x;
	const dy = targetCenter.y - sourceCenter.y;
	const sourceScale =
		1 /
		Math.max(
			Math.abs(dx) / (source.width / 2),
			Math.abs(dy) / (source.height / 2),
			0.0001,
		);
	const targetScale =
		1 /
		Math.max(
			Math.abs(dx) / (target.width / 2),
			Math.abs(dy) / (target.height / 2),
			0.0001,
		);
	return [
		{
			x: sourceCenter.x + dx * sourceScale,
			y: sourceCenter.y + dy * sourceScale,
		},
		{
			x: targetCenter.x - dx * targetScale,
			y: targetCenter.y - dy * targetScale,
		},
	];
}

function controlConnectionWaypoints(
	sourceNode: AutomationNode,
	source: DiagramBounds,
	target: DiagramBounds,
	edge: AutomationEdge,
	laneIndex: number,
	laneCount: number,
): DiagramPoint[] {
	const sourcePoint =
		sourceNode.type === "branch"
			? branchSourcePoint(sourceNode, edge, source)
			: { x: source.x + source.width, y: source.y + source.height / 2 };
	const targetPoint = {
		x: target.x,
		y: target.y + target.height / 2,
	};
	if (Math.abs(sourcePoint.y - targetPoint.y) < 2) {
		return [sourcePoint, targetPoint];
	}
	const horizontalGap = targetPoint.x - sourcePoint.x;
	const baseLaneX = sourcePoint.x + Math.max(40, horizontalGap / 2);
	const spread =
		laneCount > 1
			? Math.min(36, Math.max(12, Math.abs(horizontalGap) / laneCount))
			: 0;
	const laneX = baseLaneX + (laneIndex - (laneCount - 1) / 2) * spread;
	return [
		sourcePoint,
		{ x: laneX, y: sourcePoint.y },
		{ x: laneX, y: targetPoint.y },
		targetPoint,
	];
}

function nodeBounds(node: AutomationNode): DiagramBounds {
	const { width, height } = nodeDimensions(node);
	return {
		x: node.position.x + (280 - width) / 2,
		y: node.position.y + (120 - height) / 2,
		width,
		height,
	};
}

function addShape(
	moddle: BpmnModdle,
	plane: ModdleElement,
	element: ModdleElement,
	bounds: DiagramBounds,
	usedIds: Set<string>,
): void {
	const shape = moddle.create("bpmndi:BPMNShape", {
		id: createBpmnId("Shape", String(element.get("id")), usedIds),
		bpmnElement: element,
		...(element.$type === "bpmn:SubProcess" ? { isExpanded: false } : {}),
	});
	shape.set(
		"bounds",
		moddle.create("dc:Bounds", {
			x: bounds.x,
			y: bounds.y,
			width: bounds.width,
			height: bounds.height,
		}),
	);
	collection(plane, "planeElement").push(shape);
}

function addEdge(
	moddle: BpmnModdle,
	plane: ModdleElement,
	connection: DiagramConnection,
	usedIds: Set<string>,
): void {
	const edge = moddle.create("bpmndi:BPMNEdge", {
		id: createBpmnId("Edge", String(connection.element.get("id")), usedIds),
		bpmnElement: connection.element,
	});
	edge.set(
		"waypoint",
		connection.waypoints.map((point) =>
			moddle.create("dc:Point", { x: point.x, y: point.y }),
		),
	);
	collection(plane, "planeElement").push(edge);
}

/** Builds a read-only BPMN diagram projection of the current Automation canvas. */
export async function automationToBpmnXml(
	nodes: AutomationNode[],
	edges: AutomationEdge[],
	processName: string,
): Promise<string> {
	const moddle = new BpmnModdle();
	const usedIds = new Set<string>();
	const name = processName.trim() || "Automation workflow";
	const definitions = moddle.create("bpmn:Definitions", {
		id: "Definitions_Automation",
		targetNamespace: "https://semoss.org/automation",
	});
	const process = moddle.create("bpmn:Process", {
		id: createBpmnId("Process", name, usedIds),
		name,
		isExecutable: false,
	});
	collection(definitions, "rootElements").push(process);

	const elementByNodeId = new Map<string, ModdleElement>();
	const boundsByElement = new Map<ModdleElement, DiagramBounds>();
	const diagramConnections: DiagramConnection[] = [];
	const endEventByNodeId = new Map<string, ModdleElement>();
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const rawBounds = new Map(nodes.map((node) => [node.id, nodeBounds(node)]));
	const minimumX = Math.min(
		0,
		...Array.from(rawBounds.values(), (bounds) => bounds.x),
	);
	const minimumY = Math.min(
		0,
		...Array.from(rawBounds.values(), (bounds) => bounds.y),
	);
	const offsetX = 80 - minimumX;
	const offsetY = 80 - minimumY;

	for (const node of nodes) {
		const element = moddle.create(nodeBpmnType(node), {
			id: createBpmnId("Node", node.id, usedIds),
			name: node.label || node.type,
			...(node.type === "branch"
				? { gatewayDirection: "Diverging" }
				: {}),
		});
		collection(process, "flowElements").push(element);
		elementByNodeId.set(node.id, element);
		const bounds = rawBounds.get(node.id);
		if (bounds) {
			boundsByElement.set(element, {
				...bounds,
				x: bounds.x + offsetX,
				y: bounds.y + offsetY,
			});
		}
	}

	for (const edge of edges) {
		const source = elementByNodeId.get(edge.source);
		const target = elementByNodeId.get(edge.target);
		const sourceNode = nodeById.get(edge.source);
		const sourceBounds = source ? boundsByElement.get(source) : undefined;
		const targetBounds = target ? boundsByElement.get(target) : undefined;
		if (!source || !target || !sourceNode || !sourceBounds || !targetBounds)
			continue;
		const id = createBpmnId(
			edge.kind === "data" ? "Association" : "Flow",
			edge.id,
			usedIds,
		);
		if (edge.kind === "data") {
			const association = moddle.create("bpmn:Association", {
				id,
				sourceRef: source,
				targetRef: target,
				associationDirection: "None",
			});
			collection(process, "artifacts").push(association);
			diagramConnections.push({
				element: association,
				waypoints: directConnectionWaypoints(
					sourceBounds,
					targetBounds,
				),
			});
			continue;
		}

		const sequenceFlow = moddle.create("bpmn:SequenceFlow", {
			id,
			sourceRef: source,
			targetRef: target,
		});
		const route = sourceNode
			? branchFlowDetails(sourceNode, edge)
			: undefined;
		if (route) {
			sequenceFlow.set("name", route.name);
			branchFlowDocumentation(moddle, sequenceFlow, route.documentation);
		}
		collection(process, "flowElements").push(sequenceFlow);
		const outgoingControlEdges = edges.filter(
			(candidate) =>
				candidate.source === edge.source && candidate.kind !== "data",
		);
		diagramConnections.push({
			element: sequenceFlow,
			waypoints: controlConnectionWaypoints(
				sourceNode,
				sourceBounds,
				targetBounds,
				edge,
				Math.max(
					0,
					outgoingControlEdges.findIndex(
						(item) => item.id === edge.id,
					),
				),
				Math.max(1, outgoingControlEdges.length),
			),
		});
		if (
			sourceNode?.type === "branch" &&
			edge.sourceHandle?.startsWith("else-")
		) {
			source.set("default", sequenceFlow);
		}
	}

	const controlEdges = edges.filter((edge) => edge.kind !== "data");
	const terminalNodes = nodes.filter(
		(node) => !controlEdges.some((edge) => edge.source === node.id),
	);
	for (const node of terminalNodes) {
		const source = elementByNodeId.get(node.id);
		const sourceBounds = source ? boundsByElement.get(source) : undefined;
		if (!source || !sourceBounds) continue;
		const endEvent = moddle.create("bpmn:EndEvent", {
			id: createBpmnId("End", node.id, usedIds),
			name: "End",
		});
		const endBounds = {
			x: sourceBounds.x + sourceBounds.width + 100,
			y: sourceBounds.y + (sourceBounds.height - 36) / 2,
			width: 36,
			height: 36,
		};
		collection(process, "flowElements").push(endEvent);
		boundsByElement.set(endEvent, endBounds);
		endEventByNodeId.set(node.id, endEvent);
		const flowId = createBpmnId("CompletionFlow", node.id, usedIds);
		const sequenceFlow = moddle.create("bpmn:SequenceFlow", {
			id: flowId,
			sourceRef: source,
			targetRef: endEvent,
		});
		collection(process, "flowElements").push(sequenceFlow);
		diagramConnections.push({
			element: sequenceFlow,
			waypoints: [
				{
					x: sourceBounds.x + sourceBounds.width,
					y: sourceBounds.y + sourceBounds.height / 2,
				},
				{ x: endBounds.x, y: endBounds.y + endBounds.height / 2 },
			],
		});
	}

	const diagram = moddle.create("bpmndi:BPMNDiagram", {
		id: "Diagram_Automation",
	});
	const plane = moddle.create("bpmndi:BPMNPlane", {
		id: "Plane_Automation",
		bpmnElement: process,
	});
	diagram.set("plane", plane);
	collection(definitions, "diagrams").push(diagram);

	for (const node of nodes) {
		const element = elementByNodeId.get(node.id);
		const bounds = element ? boundsByElement.get(element) : undefined;
		if (element && bounds)
			addShape(moddle, plane, element, bounds, usedIds);
	}
	for (const node of terminalNodes) {
		const endEvent = endEventByNodeId.get(node.id);
		const bounds = endEvent ? boundsByElement.get(endEvent) : undefined;
		if (endEvent && bounds)
			addShape(moddle, plane, endEvent, bounds, usedIds);
	}
	for (const connection of diagramConnections) {
		addEdge(moddle, plane, connection, usedIds);
	}

	const { xml } = await moddle.toXML(definitions, { format: true });
	return xml;
}
