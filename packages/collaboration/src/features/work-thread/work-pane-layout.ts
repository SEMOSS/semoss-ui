import type { WorkbenchState } from "@semoss/workbench";
import { WORK_PANEL_TYPES } from "./work-panel.constants";

type WorkbenchLayoutNode = WorkbenchState["layout"]["tree"];
type WorkbenchMoveTarget = Parameters<
	WorkbenchState["layout"]["actions"]["movePanel"]
>[1];
type WorkbenchTabset = Extract<WorkbenchLayoutNode, { type: "tabset" }>;

type Layout = WorkbenchState["layout"];
interface Placement {
	tabsetId: string;
	fraction: number;
	neighborId?: string;
	direction?: "left" | "right" | "top" | "bottom";
}
const placements = new WeakMap<Layout["actions"], Map<string, Placement>>();

/** Find the dock that currently owns an instance, including nested arrangements. */
function findDock(
	tree: WorkbenchLayoutNode,
	panelId: string,
): WorkbenchTabset | undefined {
	if (tree.type === "tabset")
		return tree.panelIds.includes(panelId) ? tree : undefined;
	for (const child of tree.children) {
		const dock = findDock(child, panelId);
		if (dock) return dock;
	}
}

function findParent(
	tree: WorkbenchLayoutNode,
	id: string,
): Exclude<WorkbenchLayoutNode, WorkbenchTabset> | undefined {
	if (tree.type === "tabset") return;
	if (tree.children.some((child) => child.id === id)) return tree;
	for (const child of tree.children) {
		const parent = findParent(child, id);
		if (parent) return parent;
	}
}

/** Collapse a singleton to a rail without unmounting its body. */
export function collapseWorkPane(layout: Layout, type: string): void {
	const panel = layout.actions.findPanels((item) => item.type === type)[0];
	if (!panel) return;
	const tree = layout.actions.getSnapshot().tree;
	const dock = findDock(tree, panel.id);
	if (dock) {
		const memory =
			placements.get(layout.actions) ?? new Map<string, Placement>();
		const parent = findParent(tree, dock.id);
		const index =
			parent?.children.findIndex((item) => item.id === dock.id) ?? 0;
		const neighbor = parent?.children[index > 0 ? index - 1 : index + 1];
		const direction =
			parent?.type === "col"
				? index > 0
					? "bottom"
					: "top"
				: index > 0
					? "right"
					: "left";
		memory.set(type, {
			tabsetId: dock.id,
			fraction: dock.size / (dock.size + (neighbor?.size ?? 0)),
			neighborId:
				neighbor?.type === "tabset" ? neighbor.panelIds[0] : undefined,
			direction: parent ? direction : undefined,
		});
		placements.set(layout.actions, memory);
	}
	const side = type === WORK_PANEL_TYPES.CONTEXT ? "right" : "left";
	layout.actions.movePanel(panel.id, { kind: "border", side });
	layout.actions.collapseBorder(side);
}

/** Restore an existing singleton to its dock, retaining user-selected column proportions. */
export function restoreWorkPane(layout: Layout, type: string): string {
	const panel = layout.actions.findPanels((item) => item.type === type)[0];
	const id = panel?.id ?? layout.actions.selectPanel(type);
	const tree = layout.actions.getSnapshot().tree;
	const dock = findDock(tree, id);
	if (dock) {
		layout.actions.selectPanel(type);
		return dock.id;
	}
	const remembered = placements.get(layout.actions)?.get(type);
	const findId = (node: WorkbenchLayoutNode): boolean =>
		node.id === remembered?.tabsetId ||
		(node.type !== "tabset" && node.children.some(findId));
	if (remembered && findId(tree))
		layout.actions.movePanel(id, {
			kind: "join",
			tabsetId: remembered.tabsetId,
		});
	else {
		const isContext = type === WORK_PANEL_TYPES.CONTEXT;
		const neighbor = remembered?.neighborId
			? findDock(tree, remembered.neighborId)
			: undefined;
		const direction =
			remembered?.direction ?? (isContext ? "right" : "left");
		layout.actions.movePanel(
			id,
			neighbor
				? { kind: "split", tabsetId: neighbor.id, dir: direction }
				: { kind: "root", dir: direction },
		);
		const next = layout.actions.getSnapshot().tree;
		const restored = findDock(next, id);
		const parent = restored && findParent(next, restored.id);
		if (parent && restored) {
			const index = parent.children.findIndex(
				(item) => item.id === restored.id,
			);
			const before = direction === "left" || direction === "top";
			const adjacentIndex = before ? index + 1 : index - 1;
			const adjacent = parent.children[adjacentIndex];
			if (!adjacent) return restored.id;
			const fraction =
				remembered?.fraction && remembered.fraction < 1
					? remembered.fraction
					: isContext
						? 0.25
						: 0.75;
			const total = restored.size + adjacent.size;
			const left = before ? fraction : 1 - fraction;
			layout.actions.resizeTreeChildren(
				parent.id,
				Math.min(index, adjacentIndex),
				left * total,
				(1 - left) * total,
			);
		}
	}
	return findDock(layout.actions.getSnapshot().tree, id)?.id ?? "work-main";
}

/** Work tools and file editors open beside Context, regardless of the last selected tab. */
export function workPanelTarget(layout: Layout): WorkbenchMoveTarget {
	return {
		kind: "join",
		tabsetId: restoreWorkPane(layout, WORK_PANEL_TYPES.EMAILS),
	};
}
