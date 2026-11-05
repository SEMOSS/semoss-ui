import { BpmnModdle, type ModdleElement } from "bpmn-moddle";
import type {
	AutomationEdge,
	AutomationNode,
	RoutingConfig,
} from "../../domain/automation.types";
import { BPMN_ELEMENT_TYPE, SEMOSS_BPMN_NAMESPACE } from "./bpmn-node-mapping";

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
	if (node.type === "wait") return { width: 36, height: 36 };
	if (node.type === "branch") return { width: 52, height: 52 };
	if (node.type === "loop") return { width: 180, height: 100 };
	return { width: 156, height: 80 };
}

function nodeBpmnType(node: AutomationNode): string {
	if (node.workflowType && node.workflowType in BPMN_ELEMENT_TYPE) {
		return BPMN_ELEMENT_TYPE[node.workflowType];
	}
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
	expanded?: boolean,
): void {
	const shape = moddle.create("bpmndi:BPMNShape", {
		id: createBpmnId("Shape", String(element.get("id")), usedIds),
		bpmnElement: element,
		...(element.$type === "bpmn:SubProcess"
			? { isExpanded: expanded ?? false }
			: {}),
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

const BPMN_CONTAINER_W = 280;
const BPMN_CONTAINER_H = 120;

/**
 * Returns the x/y offset applied when generating BPMN from automation nodes.
 * Used by the viewer to reverse-convert BPMN shape positions back to
 * automation node positions after a move.
 */
export function computeBpmnOffsets(nodes: AutomationNode[]): {
	offsetX: number;
	offsetY: number;
} {
	if (nodes.length === 0) return { offsetX: 80, offsetY: 80 };
	const xs = nodes.map((n) => {
		const { width } = nodeDimensions(n);
		return n.position.x + (BPMN_CONTAINER_W - width) / 2;
	});
	const ys = nodes.map((n) => {
		const { height } = nodeDimensions(n);
		return n.position.y + (BPMN_CONTAINER_H - height) / 2;
	});
	return {
		offsetX: 80 - Math.min(0, ...xs),
		offsetY: 80 - Math.min(0, ...ys),
	};
}

/** Builds a BPMN diagram projection of the current Automation canvas. */
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
		targetNamespace: SEMOSS_BPMN_NAMESPACE,
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

	const SUBPROCESS_PADDING = 50;

	for (const node of nodes) {
		// Use the automation node ID directly as the BPMN element ID.
		// Automation IDs (step-<uuid>) are valid XML NCNames, and the import
		// adapter uses the SEMOSS_BPMN_NAMESPACE to detect our BPMN and
		// preserve these IDs on round-trips.
		usedIds.add(node.id);
		const element = moddle.create(nodeBpmnType(node), {
			id: node.id,
			name: node.label || node.type,
			...(node.type === "branch"
				? { gatewayDirection: "Diverging" }
				: {}),
		});

		const rawBound = rawBounds.get(node.id);
		let nodeBoundsAbsolute: DiagramBounds = rawBound
			? {
					x: rawBound.x + offsetX,
					y: rawBound.y + offsetY,
					width: rawBound.width,
					height: rawBound.height,
				}
			: { x: offsetX, y: offsetY, width: 100, height: 80 };

		// Serialize loop body nodes as SubProcess flowElements.
		// Body node positions are relative to the loop canvas, so we translate
		// them to absolute BPMN coordinates inside the (expanded) SubProcess.
		if (node.type === "loop" && node.body?.nodes?.length) {
			const bodyNodeData = node.body.nodes.map((bodyNode) => ({
				bodyNode,
				rawB: nodeBounds(bodyNode),
			}));
			const minBodyX = Math.min(...bodyNodeData.map((d) => d.rawB.x));
			const minBodyY = Math.min(...bodyNodeData.map((d) => d.rawB.y));
			const maxBodyRight = Math.max(
				...bodyNodeData.map((d) => d.rawB.x + d.rawB.width),
			);
			const maxBodyBottom = Math.max(
				...bodyNodeData.map((d) => d.rawB.y + d.rawB.height),
			);

			// Expand the SubProcess to contain its children.
			nodeBoundsAbsolute = {
				...nodeBoundsAbsolute,
				width: Math.max(
					nodeBoundsAbsolute.width,
					maxBodyRight - minBodyX + 2 * SUBPROCESS_PADDING,
				),
				height: Math.max(
					nodeBoundsAbsolute.height,
					maxBodyBottom - minBodyY + 2 * SUBPROCESS_PADDING,
				),
			};

			for (const { bodyNode, rawB } of bodyNodeData) {
				usedIds.add(bodyNode.id);
				const bodyElement = moddle.create(nodeBpmnType(bodyNode), {
					id: bodyNode.id,
					name: bodyNode.label || bodyNode.type,
					...(bodyNode.type === "branch"
						? { gatewayDirection: "Diverging" }
						: {}),
				});
				collection(element, "flowElements").push(bodyElement);
				elementByNodeId.set(bodyNode.id, bodyElement);
				// Place body node at an absolute position inside the SubProcess.
				boundsByElement.set(bodyElement, {
					x:
						nodeBoundsAbsolute.x +
						SUBPROCESS_PADDING +
						(rawB.x - minBodyX),
					y:
						nodeBoundsAbsolute.y +
						SUBPROCESS_PADDING +
						(rawB.y - minBodyY),
					width: rawB.width,
					height: rawB.height,
				});
			}
			for (const bodyEdge of node.body.edges ?? []) {
				const bodySrc = elementByNodeId.get(bodyEdge.source);
				const bodyTgt = elementByNodeId.get(bodyEdge.target);
				if (!bodySrc || !bodyTgt) continue;
				usedIds.add(bodyEdge.id);
				const bodyFlow = moddle.create("bpmn:SequenceFlow", {
					id: bodyEdge.id,
					sourceRef: bodySrc,
					targetRef: bodyTgt,
				});
				collection(element, "flowElements").push(bodyFlow);
				const srcBounds = boundsByElement.get(bodySrc);
				const tgtBounds = boundsByElement.get(bodyTgt);
				if (srcBounds && tgtBounds) {
					diagramConnections.push({
						element: bodyFlow,
						waypoints: directConnectionWaypoints(
							srcBounds,
							tgtBounds,
						),
					});
				}
			}
		}

		collection(process, "flowElements").push(element);
		elementByNodeId.set(node.id, element);
		boundsByElement.set(element, nodeBoundsAbsolute);
	}

	for (const edge of edges) {
		const source = elementByNodeId.get(edge.source);
		const target = elementByNodeId.get(edge.target);
		const sourceNode = nodeById.get(edge.source);
		const sourceBounds = source ? boundsByElement.get(source) : undefined;
		const targetBounds = target ? boundsByElement.get(target) : undefined;
		if (!source || !target || !sourceNode || !sourceBounds || !targetBounds)
			continue;
		// Use automation edge ID directly so connection.removed in the live bridge
		// can match it back without a lookup table.
		usedIds.add(edge.id);
		const id =
			edge.kind === "data"
				? createBpmnId("Association", edge.id, usedIds)
				: edge.id;
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
		if (element && bounds) {
			const hasBody =
				node.type === "loop" && (node.body?.nodes?.length ?? 0) > 0;
			addShape(moddle, plane, element, bounds, usedIds, hasBody);
		}
		// Emit diagram shapes for body nodes (SubProcess children).
		if (node.type === "loop" && node.body?.nodes?.length) {
			for (const bodyNode of node.body.nodes) {
				const bodyElement = elementByNodeId.get(bodyNode.id);
				const bodyBounds = bodyElement
					? boundsByElement.get(bodyElement)
					: undefined;
				if (bodyElement && bodyBounds)
					addShape(moddle, plane, bodyElement, bodyBounds, usedIds);
			}
		}
	}
	for (const connection of diagramConnections) {
		addEdge(moddle, plane, connection, usedIds);
	}

	const { xml } = await moddle.toXML(definitions, { format: true });
	return xml;
}
