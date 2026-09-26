import type {
	AutomationEdge,
	AutomationNode,
	AutomationNodeBody,
} from "../../domain/automation.types";

export interface LoopBodyInsertionPoint {
	sourceId: string;
	sourceHandle: string;
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
