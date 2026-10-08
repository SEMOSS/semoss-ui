import type {
	AutomationEdge,
	AutomationNode,
	AutomationNodeBody,
	RoutingConfig,
} from "../../domain/automation.types";

export interface LoopBodyInsertionPoint {
	sourceId: string;
	sourceHandle: string;
}

const LOOP_BODY_COLUMN_GAP = 360;
const LOOP_BODY_LANE_GAP = 40;
const LOOP_BODY_DEFAULT_NODE_HEIGHT = 120;

function loopBodyNodeHeight(node: AutomationNode): number {
	if (node.type !== "branch") return LOOP_BODY_DEFAULT_NODE_HEIGHT;
	return 88 + ((node.config as RoutingConfig).clauses.length - 1) * 48;
}

/**
 * Produces a stable left-to-right view of the nested graph. The inspector is a
 * route editor, not a second free-form canvas, so persisted drag coordinates
 * must not be allowed to make steps overlap or become impossible to select.
 */
export function layoutLoopBodyNodes(
	body: AutomationNodeBody,
): AutomationNode[] {
	const nodeIds = new Set(body.nodes.map((node) => node.id));
	const depths = new Map(body.nodes.map((node) => [node.id, 0]));
	const controlEdges = body.edges.filter(
		(edge) =>
			edge.kind !== "data" &&
			nodeIds.has(edge.source) &&
			nodeIds.has(edge.target),
	);

	// Loop bodies are acyclic. Repeated relaxation keeps this independent of
	// storage order while remaining bounded by the number of nodes.
	for (let pass = 0; pass < body.nodes.length; pass += 1) {
		let changed = false;
		for (const edge of controlEdges) {
			const nextDepth = (depths.get(edge.source) ?? 0) + 1;
			if (nextDepth > (depths.get(edge.target) ?? 0)) {
				depths.set(edge.target, nextDepth);
				changed = true;
			}
		}
		if (!changed) break;
	}

	const columns = new Map<number, AutomationNode[]>();
	for (const node of body.nodes) {
		const depth = depths.get(node.id) ?? 0;
		columns.set(depth, [...(columns.get(depth) ?? []), node]);
	}
	const positions = new Map<string, { x: number; y: number }>();
	for (const [depth, nodes] of columns) {
		let y = 0;
		for (const node of nodes) {
			positions.set(node.id, {
				x: depth * LOOP_BODY_COLUMN_GAP,
				y,
			});
			y += loopBodyNodeHeight(node) + LOOP_BODY_LANE_GAP;
		}
	}

	return body.nodes.map((node) => ({
		...node,
		position: positions.get(node.id) ?? node.position,
	}));
}

/** Inserts a node on one loop-body route without rebuilding unrelated edges. */
export function insertLoopBodyNode(
	body: AutomationNodeBody,
	node: AutomationNode,
	insertionPoint?: LoopBodyInsertionPoint,
): AutomationNodeBody {
	if (!insertionPoint) {
		return { nodes: [...body.nodes, node], edges: body.edges };
	}

	const outgoingEdge = body.edges.find(
		(edge) =>
			edge.kind === "control" &&
			edge.source === insertionPoint.sourceId &&
			edge.sourceHandle === insertionPoint.sourceHandle,
	);
	const sourceNode = body.nodes.find(
		(candidate) => candidate.id === insertionPoint.sourceId,
	);
	const targetNode = outgoingEdge
		? body.nodes.find((candidate) => candidate.id === outgoingEdge.target)
		: undefined;
	const positionedNode = {
		...node,
		position:
			sourceNode && targetNode
				? {
						x: (sourceNode.position.x + targetNode.position.x) / 2,
						y: (sourceNode.position.y + targetNode.position.y) / 2,
					}
				: sourceNode
					? {
							x: sourceNode.position.x + 260,
							y: sourceNode.position.y,
						}
					: node.position,
	};
	const retainedEdges = outgoingEdge
		? body.edges.filter((edge) => edge.id !== outgoingEdge.id)
		: body.edges;
	const nextEdges: AutomationEdge[] = [
		...retainedEdges,
		{
			id: `loop-${insertionPoint.sourceId}-${positionedNode.id}`,
			kind: "control",
			source: insertionPoint.sourceId,
			target: positionedNode.id,
			sourceHandle: insertionPoint.sourceHandle,
			targetHandle: `in-${positionedNode.id}`,
		},
	];
	if (outgoingEdge) {
		nextEdges.push({
			id: `loop-${positionedNode.id}-${outgoingEdge.target}`,
			kind: "control",
			source: positionedNode.id,
			target: outgoingEdge.target,
			sourceHandle: `out-${positionedNode.id}`,
			targetHandle: outgoingEdge.targetHandle,
		});
	}
	return {
		nodes: [...body.nodes, positionedNode],
		edges: nextEdges,
	};
}

/** Removes a loop-body node and every edge incident to it. */
export function removeLoopBodyNode(
	body: AutomationNodeBody,
	nodeId: string,
): AutomationNodeBody {
	const incoming = body.edges.filter(
		(edge) => edge.kind === "control" && edge.target === nodeId,
	);
	const outgoing = body.edges.filter(
		(edge) => edge.kind === "control" && edge.source === nodeId,
	);
	const retainedEdges = body.edges.filter(
		(edge) => edge.source !== nodeId && edge.target !== nodeId,
	);
	if (incoming.length === 1 && outgoing.length === 1) {
		retainedEdges.push({
			id: `loop-${incoming[0].source}-${outgoing[0].target}`,
			kind: "control",
			source: incoming[0].source,
			target: outgoing[0].target,
			sourceHandle: incoming[0].sourceHandle,
			targetHandle: outgoing[0].targetHandle,
		});
	}
	return {
		nodes: body.nodes.filter((node) => node.id !== nodeId),
		edges: retainedEdges,
	};
}

/** Returns outputs that can reach a body node along any incoming control path. */
export function getLoopBodyUpstreamVariables(
	body: AutomationNodeBody,
	nodeId: string,
): string[] {
	const ancestors = new Set<string>();
	const pending = [nodeId];
	while (pending.length > 0) {
		const targetId = pending.pop();
		if (!targetId) continue;
		for (const edge of body.edges) {
			if (edge.kind !== "control" || edge.target !== targetId) continue;
			if (ancestors.has(edge.source)) continue;
			ancestors.add(edge.source);
			pending.push(edge.source);
		}
	}
	return body.nodes
		.filter((node) => ancestors.has(node.id))
		.map((node) => node.outputVar)
		.filter(Boolean);
}
