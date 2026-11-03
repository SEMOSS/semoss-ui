interface FlowLayoutEdge {
	source: string;
	target: string;
	kind?: string;
}

export const NODE_COLUMN_GAP = 100;
export const NODE_LANE_GAP = 40;

/** Stable graph order, retaining cyclic or disconnected nodes without inventing edges. */
export function getOrderedFlowNodes<Node extends { id: string }>(
	steps: Node[],
	edges: FlowLayoutEdge[],
): Node[] {
	const byId = new Map(steps.map((step) => [step.id, step]));
	const stepIds = new Set(steps.map((step) => step.id));
	const originalOrder = new Map(steps.map((step, index) => [step.id, index]));
	const incomingCounts = new Map(steps.map((step) => [step.id, 0]));
	const outgoing = new Map<string, string[]>(
		steps.map((step) => [step.id, []]),
	);

	for (const edge of edges) {
		if (!stepIds.has(edge.source) || !stepIds.has(edge.target)) continue;
		outgoing.get(edge.source)?.push(edge.target);
		incomingCounts.set(
			edge.target,
			(incomingCounts.get(edge.target) ?? 0) + 1,
		);
	}

	const queue = steps
		.filter((step) => incomingCounts.get(step.id) === 0)
		.map((step) => step.id);
	const orderedIds: string[] = [];

	while (queue.length > 0) {
		queue.sort(
			(left, right) =>
				(originalOrder.get(left) ?? 0) -
				(originalOrder.get(right) ?? 0),
		);
		const current = queue.shift();
		if (!current) continue;
		orderedIds.push(current);
		for (const target of outgoing.get(current) ?? []) {
			const remaining = (incomingCounts.get(target) ?? 0) - 1;
			incomingCounts.set(target, remaining);
			if (remaining === 0) queue.push(target);
		}
	}

	const ordered = orderedIds
		.map((id) => byId.get(id))
		.filter((step): step is Node => step !== undefined);
	const orderedIdSet = new Set(orderedIds);
	return [...ordered, ...steps.filter((step) => !orderedIdSet.has(step.id))];
}

/** Shared left-to-right canvas layout, with columns and aligned branch lanes. */
export function layoutFlowNodes<Node extends { id: string }>(
	nodes: Node[],
	edges: FlowLayoutEdge[],
	getDimensions: (node: Node) => { width: number; height: number },
	canvasHeight = 600,
): (Node & { position: { x: number; y: number } })[] {
	const stepIds = new Set(nodes.map((node) => node.id));
	const incoming = new Map<string, string[]>();
	for (const node of nodes) {
		incoming.set(node.id, []);
	}
	for (const edge of edges) {
		if (!stepIds.has(edge.source) || !stepIds.has(edge.target)) continue;
		if (edge.kind !== undefined && edge.kind !== "control") continue;
		incoming.get(edge.target)?.push(edge.source);
	}

	const depth = new Map<string, number>();
	const ordered = getOrderedFlowNodes(nodes, edges);
	for (const node of ordered) {
		const parents = incoming.get(node.id) ?? [];
		depth.set(
			node.id,
			parents.length === 0
				? 0
				: Math.max(...parents.map((parent) => depth.get(parent) ?? 0)) +
						1,
		);
	}

	const columns = new Map<number, Node[]>();
	for (const node of ordered) {
		const column = depth.get(node.id) ?? 0;
		columns.set(column, [...(columns.get(column) ?? []), node]);
	}

	const positions = new Map<string, { x: number; y: number }>();
	const orderedColumns = [...columns.entries()].sort(
		([left], [right]) => left - right,
	);
	const laneHeights: number[] = [];
	for (const columnNodes of columns.values()) {
		columnNodes.forEach((node, lane) => {
			laneHeights[lane] = Math.max(
				laneHeights[lane] ?? 0,
				getDimensions(node).height,
			);
		});
	}
	const totalHeight =
		laneHeights.reduce((total, height) => total + height, 0) +
		NODE_LANE_GAP * Math.max(0, laneHeights.length - 1);
	const firstLaneY = Math.max(0, (canvasHeight - totalHeight) / 2);
	const columnOffsets = new Map<number, number>();
	let nextColumnX = 0;
	for (const [column, columnNodes] of orderedColumns) {
		columnOffsets.set(column, nextColumnX);
		nextColumnX +=
			Math.max(...columnNodes.map((node) => getDimensions(node).width)) +
			NODE_COLUMN_GAP;
	}
	for (const [column, columnNodes] of orderedColumns) {
		let y = firstLaneY;
		for (const node of columnNodes) {
			const lane = columnNodes.indexOf(node);
			const nodeHeight = getDimensions(node).height;
			positions.set(node.id, {
				x: columnOffsets.get(column) ?? 0,
				y: y + ((laneHeights[lane] ?? nodeHeight) - nodeHeight) / 2,
			});
			y += (laneHeights[lane] ?? nodeHeight) + NODE_LANE_GAP;
		}
	}
	return nodes.map((node) => ({
		...node,
		position: positions.get(node.id) ?? { x: 0, y: 0 },
	}));
}
