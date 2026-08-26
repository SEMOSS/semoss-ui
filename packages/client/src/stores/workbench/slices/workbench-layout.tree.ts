import type {
	WorkbenchBorders,
	WorkbenchContainer,
	WorkbenchLayoutNode,
	WorkbenchMoveTarget,
	WorkbenchPanelId,
	WorkbenchPanelRecord,
	WorkbenchSide,
	WorkbenchSnapshot,
	WorkbenchTabset,
} from "../workbench.types";
import { WORKBENCH_SIDES } from "../workbench.types";

let seq = 0;

/**
 * Mint a node/panel id that cannot collide with ids restored from a snapshot.
 * The random suffix protects against a fresh counter meeting persisted ids.
 *
 * @param prefix - Short kind marker (e.g. "p", "ts", "row").
 * @return A unique id.
 */
export const createNodeId = (prefix: string): string =>
	`${prefix}_${++seq}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Narrow a layout node to a tabset.
 *
 * @param node - Node to test.
 * @return True when the node is a tabset.
 */
export const isTabset = (node: WorkbenchLayoutNode): node is WorkbenchTabset =>
	node.type === "tabset";

/**
 * Create an empty tabset, used as the root fallback when a tree empties out.
 *
 * @return A fresh tabset with no panels.
 */
export const emptyTabset = (): WorkbenchTabset => ({
	type: "tabset",
	id: createNodeId("ts"),
	size: 1,
	panelIds: [],
	activeId: null,
});

/**
 * Find a tabset by id.
 *
 * @param node - Tree to search.
 * @param id - Tabset id.
 * @return The tabset, or null when absent.
 */
export function findTabset(
	node: WorkbenchLayoutNode,
	id: string,
): WorkbenchTabset | null {
	if (isTabset(node)) {
		return node.id === id ? node : null;
	}
	for (const child of node.children) {
		const hit = findTabset(child, id);
		if (hit) {
			return hit;
		}
	}
	return null;
}

/**
 * Find the tabset holding a panel.
 *
 * @param node - Tree to search.
 * @param pid - Panel id.
 * @return The holding tabset, or null when the panel is not docked.
 */
export function findTabsetOf(
	node: WorkbenchLayoutNode,
	pid: WorkbenchPanelId,
): WorkbenchTabset | null {
	if (isTabset(node)) {
		return node.panelIds.includes(pid) ? node : null;
	}
	for (const child of node.children) {
		const hit = findTabsetOf(child, pid);
		if (hit) {
			return hit;
		}
	}
	return null;
}

/**
 * Collect every tabset in visual order.
 *
 * @param node - Tree to flatten.
 * @param out - Accumulator used by the recursion.
 * @return The tabsets, depth-first.
 */
export function flatten(
	node: WorkbenchLayoutNode,
	out: WorkbenchTabset[] = [],
): WorkbenchTabset[] {
	if (isTabset(node)) {
		out.push(node);
	} else {
		for (const child of node.children) {
			flatten(child, out);
		}
	}
	return out;
}

/**
 * Collapse single-child containers and merge same-axis nesting.
 *
 * @param node - Node to normalize.
 * @return An equivalent node without redundant containers.
 */
export function normalize(node: WorkbenchLayoutNode): WorkbenchLayoutNode {
	if (isTabset(node)) {
		return node;
	}
	const children = node.children.flatMap((child) => {
		if (child.type !== node.type) {
			return [child];
		}
		const total =
			child.children.reduce((sum, grand) => sum + grand.size, 0) || 1;
		return child.children.map((grand) => ({
			...grand,
			size: (grand.size / total) * child.size,
		}));
	});
	const only = children[0];
	if (children.length === 1 && only) {
		return { ...only, size: node.size } as WorkbenchLayoutNode;
	}
	return { ...node, children };
}

/**
 * Normalize a whole tree bottom-up.
 *
 * @param node - Tree to normalize.
 * @return An equivalent tree without redundant containers.
 */
export function normalizeDeep(node: WorkbenchLayoutNode): WorkbenchLayoutNode {
	if (isTabset(node)) {
		return node;
	}
	return normalize({ ...node, children: node.children.map(normalizeDeep) });
}

/**
 * Remove a panel from the tree. A tabset emptied by the removal is pruned
 * unless it declares `enableDeleteWhenEmpty: false`, in which case it stays
 * behind as an empty dock.
 *
 * @param node - Tree to remove from.
 * @param pid - Panel id to remove.
 * @return The updated tree, or null when nothing remains.
 */
export function removePanel(
	node: WorkbenchLayoutNode,
	pid: WorkbenchPanelId,
): WorkbenchLayoutNode | null {
	if (isTabset(node)) {
		if (!node.panelIds.includes(pid)) {
			return node;
		}
		const index = node.panelIds.indexOf(pid);
		const rest = node.panelIds.filter((id) => id !== pid);
		if (!rest.length) {
			if (node.enableDeleteWhenEmpty === false) {
				return { ...node, panelIds: [], activeId: null };
			}
			return null;
		}
		const neighbour = rest[Math.max(0, index - 1)] ?? rest[0] ?? null;
		return {
			...node,
			panelIds: rest,
			activeId: node.activeId === pid ? neighbour : node.activeId,
		};
	}
	const children = node.children
		.map((child) => removePanel(child, pid))
		.filter((child): child is WorkbenchLayoutNode => child !== null);
	if (!children.length) {
		return null;
	}
	return normalize({ ...node, children });
}

/**
 * Where a dropped tab lands, and whether the drop changes its pinned state.
 * `ids` and `index` are in post-removal coordinates.
 *
 * Pinned tabs hold a block at the head of the strip and never interleave
 * with unpinned ones. Crossing the boundary is the gesture that pins or
 * unpins — but it takes a full tab of travel in either direction, so nudging
 * a tab to the far left to reorder it can't silently pin it.
 *
 * @param ids - Strip panel ids without the dragged panel.
 * @param index - Requested insertion index.
 * @param dragPinned - Whether the dragged panel is currently pinned.
 * @param isPinned - Lookup for the pinned flag of a strip panel.
 * @return The clamped landing index and resulting pinned flag.
 */
export function resolvePinDrop(
	ids: WorkbenchPanelId[],
	index: number,
	dragPinned: boolean,
	isPinned: (id: WorkbenchPanelId) => boolean,
): { index: number; pinned: boolean } {
	const boundary = ids.filter(isPinned).length;
	const pinned = dragPinned ? index <= boundary : index < boundary;
	const [lo, hi] = pinned ? [0, boundary] : [boundary, ids.length];
	return { index: Math.max(lo, Math.min(index, hi)), pinned };
}

/**
 * Insert a panel into a tabset's strip and activate it.
 *
 * @param node - Tree to update.
 * @param tabsetId - Destination tabset.
 * @param pid - Panel id to insert.
 * @param index - Insertion index; appends when omitted.
 * @return The updated tree.
 */
export function joinTabset(
	node: WorkbenchLayoutNode,
	tabsetId: string,
	pid: WorkbenchPanelId,
	index?: number,
): WorkbenchLayoutNode {
	if (isTabset(node)) {
		if (node.id !== tabsetId) {
			return node;
		}
		const ids = [...node.panelIds];
		ids.splice(
			index == null
				? ids.length
				: Math.max(0, Math.min(index, ids.length)),
			0,
			pid,
		);
		return { ...node, panelIds: ids, activeId: pid };
	}
	return {
		...node,
		children: node.children.map((child) =>
			joinTabset(child, tabsetId, pid, index),
		),
	};
}

/**
 * Split a tabset, docking the panel into a fresh sibling on the given side.
 *
 * @param node - Tree to update.
 * @param tabsetId - Tabset being split.
 * @param pid - Panel id landing in the fresh tabset.
 * @param dir - Which side of the split the panel lands on.
 * @return The updated tree.
 */
export function splitTabset(
	node: WorkbenchLayoutNode,
	tabsetId: string,
	pid: WorkbenchPanelId,
	dir: WorkbenchSide,
): WorkbenchLayoutNode {
	if (isTabset(node)) {
		if (node.id !== tabsetId) {
			return node;
		}
		const fresh: WorkbenchTabset = {
			type: "tabset",
			id: createNodeId("ts"),
			size: 1,
			panelIds: [pid],
			activeId: pid,
		};
		const keep: WorkbenchTabset = { ...node, size: 1 };
		const type: WorkbenchContainer["type"] =
			dir === "left" || dir === "right" ? "row" : "col";
		const children: WorkbenchLayoutNode[] =
			dir === "left" || dir === "top" ? [fresh, keep] : [keep, fresh];
		return { type, id: createNodeId(type), size: node.size, children };
	}
	return {
		...node,
		children: node.children.map((child) =>
			splitTabset(child, tabsetId, pid, dir),
		),
	};
}

/**
 * Dock a panel against a whole edge of the tree.
 *
 * @param node - Tree to update.
 * @param pid - Panel id to dock.
 * @param dir - Edge to dock against.
 * @return The updated tree.
 */
export function dockToRoot(
	node: WorkbenchLayoutNode,
	pid: WorkbenchPanelId,
	dir: WorkbenchSide,
): WorkbenchLayoutNode {
	const type: WorkbenchContainer["type"] =
		dir === "left" || dir === "right" ? "row" : "col";
	const fresh: WorkbenchTabset = {
		type: "tabset",
		id: createNodeId("ts"),
		size: 1,
		panelIds: [pid],
		activeId: pid,
	};
	if (node.type === type) {
		fresh.size =
			node.children.reduce((sum, child) => sum + child.size, 0) /
			node.children.length;
		const children: WorkbenchLayoutNode[] =
			dir === "left" || dir === "top"
				? [fresh, ...node.children]
				: [...node.children, fresh];
		return { ...node, children };
	}
	fresh.size = 0.4;
	const base: WorkbenchLayoutNode = { ...node, size: 1 };
	return {
		type,
		id: createNodeId(type),
		size: 1,
		children:
			dir === "left" || dir === "top" ? [fresh, base] : [base, fresh],
	};
}

/**
 * Move a panel to a dock target. Border targets leave the tree untouched —
 * borders are separate state.
 *
 * @param tree - Tree to update.
 * @param pid - Panel id being moved.
 * @param target - Where the panel is headed.
 * @return The updated tree.
 */
export function movePanelInTree(
	tree: WorkbenchLayoutNode,
	pid: WorkbenchPanelId,
	target: WorkbenchMoveTarget,
): WorkbenchLayoutNode {
	if (target.kind === "border") {
		return tree;
	}

	const src = findTabsetOf(tree, pid);
	const intoTabset =
		target.kind === "join" || target.kind === "split"
			? target.tabsetId
			: undefined;

	// dropping a lone panel back onto its own dock changes nothing
	if (
		src &&
		intoTabset &&
		src.id === intoTabset &&
		src.panelIds.length === 1
	) {
		return tree;
	}

	// the dragged tab still occupies a slot in the strip it came from, so an
	// insertion point to its right shifts left once it's pulled out
	let index = target.kind === "join" ? target.index : undefined;
	const preResolved = target.kind === "join" && target.resolved;
	if (
		!preResolved &&
		index != null &&
		src &&
		src.id === intoTabset &&
		src.panelIds.indexOf(pid) < index
	) {
		index -= 1;
	}

	const pruned: WorkbenchLayoutNode = removePanel(tree, pid) ?? emptyTabset();
	let next: WorkbenchLayoutNode;
	if (target.kind === "join") {
		next = findTabset(pruned, target.tabsetId)
			? joinTabset(pruned, target.tabsetId, pid, index)
			: dockToRoot(pruned, pid, "right");
	} else if (target.kind === "split") {
		next = findTabset(pruned, target.tabsetId)
			? splitTabset(pruned, target.tabsetId, pid, target.dir)
			: dockToRoot(pruned, pid, target.dir);
	} else {
		next = dockToRoot(pruned, pid, target.dir);
	}
	return normalizeDeep(next);
}

/** Px constraints along one axis. */
export interface WorkbenchExtent {
	min: number;
	max: number;
}

/**
 * Px constraints a node imposes along one axis, from the panels inside it.
 * Along the container's own axis constraints add up; across it they are the
 * strictest of the children.
 *
 * @param node - Node to measure.
 * @param axis - Axis to measure along.
 * @param panels - Panel records supplying per-panel constraints.
 * @return The node's min/max extent in px.
 */
export function measure(
	node: WorkbenchLayoutNode,
	axis: "x" | "y",
	panels: Record<WorkbenchPanelId, WorkbenchPanelRecord>,
): WorkbenchExtent {
	if (isTabset(node)) {
		let min = 0;
		let max = Number.POSITIVE_INFINITY;
		for (const pid of node.panelIds) {
			const record = panels[pid];
			if (!record) {
				continue;
			}
			min = Math.max(
				min,
				(axis === "x" ? record.minWidth : record.minHeight) ?? 0,
			);
			max = Math.min(
				max,
				(axis === "x" ? record.maxWidth : record.maxHeight) ??
					Number.POSITIVE_INFINITY,
			);
		}
		return { min, max: Math.max(min, max) };
	}
	const along = (node.type === "row") === (axis === "x");
	const parts = node.children.map((child) => measure(child, axis, panels));
	if (along) {
		return {
			min: parts.reduce((sum, part) => sum + part.min, 0),
			max: parts.reduce((sum, part) => sum + part.max, 0),
		};
	}
	const min = parts.reduce((acc, part) => Math.max(acc, part.min), 0);
	const max = parts.reduce(
		(acc, part) => Math.min(acc, part.max),
		Number.POSITIVE_INFINITY,
	);
	return { min, max: Math.max(min, max) };
}

/**
 * Apply an update to one tabset in the tree.
 *
 * @param node - Tree to update.
 * @param id - Tabset id.
 * @param fn - Update applied to the matching tabset.
 * @return The updated tree.
 */
export function updateTabset(
	node: WorkbenchLayoutNode,
	id: string,
	fn: (tabset: WorkbenchTabset) => WorkbenchTabset,
): WorkbenchLayoutNode {
	if (isTabset(node)) {
		return node.id === id ? fn(node) : node;
	}
	return {
		...node,
		children: node.children.map((child) => updateTabset(child, id, fn)),
	};
}

/**
 * Set the sizes of two adjacent children of a container.
 *
 * @param node - Tree to update.
 * @param containerId - Container being resized.
 * @param index - Index of the first of the two children.
 * @param a - New size of the first child.
 * @param b - New size of the second child.
 * @return The updated tree.
 */
export function resizeChildren(
	node: WorkbenchLayoutNode,
	containerId: string,
	index: number,
	a: number,
	b: number,
): WorkbenchLayoutNode {
	if (isTabset(node)) {
		return node;
	}
	if (node.id === containerId) {
		return {
			...node,
			children: node.children.map((child, i) =>
				i === index
					? { ...child, size: a }
					: i === index + 1
						? { ...child, size: b }
						: child,
			),
		};
	}
	return {
		...node,
		children: node.children.map((child) =>
			resizeChildren(child, containerId, index, a, b),
		),
	};
}

/**
 * Remove a panel from whichever border holds it.
 *
 * @param borders - Borders to update.
 * @param pid - Panel id to strip.
 * @return The updated borders.
 */
export const stripFromBorders = (
	borders: WorkbenchBorders,
	pid: WorkbenchPanelId,
): WorkbenchBorders =>
	Object.fromEntries(
		Object.entries(borders).map(([side, border]) => [
			side,
			border.panelIds.includes(pid)
				? {
						...border,
						panelIds: border.panelIds.filter((id) => id !== pid),
						activeId:
							border.activeId === pid ? null : border.activeId,
					}
				: border,
		]),
	) as WorkbenchBorders;

/**
 * Fill in missing borders so the shell never has to check for absent sides.
 *
 * @param borders - Partial borders from a layout or snapshot.
 * @return All four borders, defaulted where missing.
 */
export const withAllBorders = (
	borders: Partial<WorkbenchBorders> = {},
): WorkbenchBorders => ({
	left: borders.left ?? { panelIds: [], activeId: null, size: 260 },
	right: borders.right ?? { panelIds: [], activeId: null, size: 260 },
	top: borders.top ?? { panelIds: [], activeId: null, size: 180 },
	bottom: borders.bottom ?? { panelIds: [], activeId: null, size: 200 },
});

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isValidNode = (value: unknown): value is WorkbenchLayoutNode => {
	if (!isRecordObject(value)) {
		return false;
	}
	if (value.type === "tabset") {
		return (
			typeof value.id === "string" &&
			Array.isArray(value.panelIds) &&
			value.panelIds.every((id) => typeof id === "string")
		);
	}
	if (value.type === "row" || value.type === "col") {
		return (
			typeof value.id === "string" &&
			Array.isArray(value.children) &&
			value.children.every(isValidNode)
		);
	}
	return false;
};

/**
 * Structural guard for cached or host-supplied snapshots. Rejects payloads
 * that are not a v1 snapshot whose tree, panels, and borders are coherent —
 * every docked panel id must resolve to a panel record.
 *
 * @param raw - Unknown payload, typically parsed from localStorage.
 * @return The snapshot, or null when the payload is unusable.
 */
export function parseWorkbenchSnapshot(raw: unknown): WorkbenchSnapshot | null {
	if (!isRecordObject(raw)) {
		return null;
	}
	if (!isValidNode(raw.tree) || !isRecordObject(raw.panels)) {
		return null;
	}
	const panels = raw.panels as Record<string, unknown>;
	const knownPanel = (pid: string): boolean =>
		isRecordObject(panels[pid]) &&
		typeof (panels[pid] as Record<string, unknown>).type === "string";

	const docked = flatten(raw.tree).flatMap((tabset) => tabset.panelIds);
	if (!docked.every(knownPanel)) {
		return null;
	}

	if (raw.borders !== undefined) {
		if (!isRecordObject(raw.borders)) {
			return null;
		}
		for (const side of WORKBENCH_SIDES) {
			const border = (raw.borders as Record<string, unknown>)[side];
			if (border === undefined) {
				continue;
			}
			if (
				!isRecordObject(border) ||
				!Array.isArray(border.panelIds) ||
				typeof border.size !== "number" ||
				!border.panelIds.every(
					(pid) => typeof pid === "string" && knownPanel(pid),
				)
			) {
				return null;
			}
		}
	}

	if (
		raw.closed !== undefined &&
		(!Array.isArray(raw.closed) ||
			!raw.closed.every((pid) => typeof pid === "string"))
	) {
		return null;
	}

	return raw as unknown as WorkbenchSnapshot;
}
