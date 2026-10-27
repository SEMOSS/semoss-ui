import type { Node } from "@xyflow/react";

/** Grid size, in flow units, shared by the canvas dots and grid snapping. */
export const CANVAS_GRID_SIZE = 20;

/** Distance, in flow units, within which a dragged node snaps to a guide. */
export const HELPER_LINE_THRESHOLD = 6;

/** Visual-only group nodes are never alignment targets. */
const GROUP_NODE_ID_PREFIX = "node-group-";

/** A guide line along one axis, spanning the dragged node and its target. */
export interface HelperLine {
	/** Flow coordinate of the line on its fixed axis. */
	position: number;
	/** Flow coordinate where the line starts on its running axis. */
	start: number;
	/** Flow coordinate where the line ends on its running axis. */
	end: number;
}

/** Guides to draw and the snapped position of the dragged node. */
export interface HelperLinesResult {
	/** Vertical guide (fixed x) when the node aligns horizontally. */
	vertical?: HelperLine;
	/** Horizontal guide (fixed y) when the node aligns vertically. */
	horizontal?: HelperLine;
	/** Snapped x, when a vertical guide applies. */
	x?: number;
	/** Snapped y, when a horizontal guide applies. */
	y?: number;
}

interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface Match {
	distance: number;
	/** Delta that moves the dragged node onto the guide. */
	delta: number;
	target: Box;
}

function toBox(node: Node, position = node.position): Box | null {
	const width = node.measured?.width ?? node.width;
	const height = node.measured?.height ?? node.height;
	if (width === undefined || height === undefined) return null;
	return { x: position.x, y: position.y, width, height };
}

/** Left, center, and right (or top, middle, bottom) anchor coordinates. */
function anchors(start: number, size: number): number[] {
	return [start, start + size / 2, start + size];
}

function findBestMatch(
	dragged: Box,
	targets: Box[],
	axis: "x" | "y",
	threshold: number,
): Match | null {
	const size = axis === "x" ? "width" : "height";
	const draggedAnchors = anchors(dragged[axis], dragged[size]);
	let best: Match | null = null;
	for (const target of targets) {
		const targetAnchors = anchors(target[axis], target[size]);
		for (const draggedAnchor of draggedAnchors) {
			for (const targetAnchor of targetAnchors) {
				const distance = Math.abs(draggedAnchor - targetAnchor);
				if (distance > threshold) continue;
				if (best === null || distance < best.distance) {
					best = {
						distance,
						delta: targetAnchor - draggedAnchor,
						target,
					};
				}
			}
		}
	}
	return best;
}

/**
 * Finds the alignment guides for a node being dragged to `position`.
 *
 * Only nodes that share the dragged node's parent are alignment targets, so
 * positions are always compared in one coordinate space. Alignment wins over
 * the grid: callers apply the returned `x`/`y` after grid snapping.
 *
 * @param draggedId - Id of the node being dragged.
 * @param position - Dragged node position before alignment snapping.
 * @param nodes - Every node on the canvas.
 * @param threshold - Maximum distance at which a guide attracts the node.
 */
export function getHelperLines(
	draggedId: string,
	position: { x: number; y: number },
	nodes: Node[],
	threshold = HELPER_LINE_THRESHOLD,
): HelperLinesResult {
	const draggedNode = nodes.find((node) => node.id === draggedId);
	if (!draggedNode) return {};
	const dragged = toBox(draggedNode, position);
	if (!dragged) return {};

	const targets: Box[] = [];
	for (const node of nodes) {
		if (node.id === draggedId) continue;
		if (node.id.startsWith(GROUP_NODE_ID_PREFIX)) continue;
		if (node.parentId !== draggedNode.parentId) continue;
		const box = toBox(node);
		if (box) targets.push(box);
	}

	const xMatch = findBestMatch(dragged, targets, "x", threshold);
	const yMatch = findBestMatch(dragged, targets, "y", threshold);

	const snapped: Box = {
		...dragged,
		x: dragged.x + (xMatch?.delta ?? 0),
		y: dragged.y + (yMatch?.delta ?? 0),
	};
	const result: HelperLinesResult = {};

	if (xMatch) {
		const { target } = xMatch;
		const matchedAnchor = anchors(target.x, target.width).find((anchor) =>
			anchors(snapped.x, snapped.width).some(
				(own) => Math.abs(own - anchor) < 0.001,
			),
		);
		result.x = snapped.x;
		result.vertical = {
			position: matchedAnchor ?? target.x,
			start: Math.min(snapped.y, target.y),
			end: Math.max(snapped.y + snapped.height, target.y + target.height),
		};
	}
	if (yMatch) {
		const { target } = yMatch;
		const matchedAnchor = anchors(target.y, target.height).find((anchor) =>
			anchors(snapped.y, snapped.height).some(
				(own) => Math.abs(own - anchor) < 0.001,
			),
		);
		result.y = snapped.y;
		result.horizontal = {
			position: matchedAnchor ?? target.y,
			start: Math.min(snapped.x, target.x),
			end: Math.max(snapped.x + snapped.width, target.x + target.width),
		};
	}
	return result;
}
