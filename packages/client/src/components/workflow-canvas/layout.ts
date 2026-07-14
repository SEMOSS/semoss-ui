import type {
	WorkflowEdge,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";

const NODE_W = 240;
const NODE_H = 80;
const H_GAP = 100;
const V_GAP = 50;

export function needsLayout(nodes: WorkflowNode[]): boolean {
	return (
		nodes.length > 0 &&
		nodes.every((n) => n.position.x === 0 && n.position.y === 0)
	);
}

export function autoLayout(
	nodes: WorkflowNode[],
	edges: WorkflowEdge[],
): WorkflowNode[] {
	if (nodes.length === 0) return nodes;

	const outEdges = new Map<string, string[]>();
	const inDegree = new Map<string, number>();

	for (const n of nodes) {
		outEdges.set(n.id, []);
		inDegree.set(n.id, 0);
	}

	for (const e of edges) {
		outEdges.get(e.source)?.push(e.target);
		inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
	}

	// BFS to assign column depth (longest path from a root)
	const depth = new Map<string, number>();
	const queue: string[] = [];

	for (const n of nodes) {
		if ((inDegree.get(n.id) ?? 0) === 0) {
			depth.set(n.id, 0);
			queue.push(n.id);
		}
	}

	let head = 0;
	while (head < queue.length) {
		const curr = queue[head++];
		const currDepth = depth.get(curr) ?? 0;
		for (const next of outEdges.get(curr) ?? []) {
			const newDepth = currDepth + 1;
			if (!depth.has(next)) {
				depth.set(next, newDepth);
				queue.push(next);
			} else if (newDepth > (depth.get(next) ?? 0)) {
				depth.set(next, newDepth);
				queue.push(next);
			}
		}
	}

	// Disconnected nodes default to depth 0
	for (const n of nodes) {
		if (!depth.has(n.id)) depth.set(n.id, 0);
	}

	// Group by depth for vertical stacking
	const byDepth = new Map<number, string[]>();
	for (const n of nodes) {
		const d = depth.get(n.id) ?? 0;
		if (!byDepth.has(d)) byDepth.set(d, []);
		byDepth.get(d)?.push(n.id);
	}

	// Center each column vertically around y=300
	const CENTER_Y = 300;
	return nodes.map((n) => {
		const d = depth.get(n.id) ?? 0;
		const col = byDepth.get(d) ?? [];
		const idx = col.indexOf(n.id);
		const colCount = col.length;
		const totalHeight = colCount * (NODE_H + V_GAP) - V_GAP;
		return {
			...n,
			position: {
				x: d * (NODE_W + H_GAP),
				y: CENTER_Y - totalHeight / 2 + idx * (NODE_H + V_GAP),
			},
		};
	});
}
