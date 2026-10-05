import type {
	WorkbenchLayoutNode,
	WorkbenchLayoutPreset,
	WorkbenchPanelRecord,
	WorkbenchTabset,
} from "../../types";
import { createNodeId, flatten } from "./workbench-layout.tree";

/**
 * Rearrange the main tabs without replacing records, scratch values, or borders.
 * Stable tab order is retained, with pinned tabs leading within each new group.
 */
export function arrangeWorkbenchTree(
	tree: WorkbenchLayoutNode,
	panels: Record<string, WorkbenchPanelRecord>,
	selected: string | undefined,
	preset: WorkbenchLayoutPreset,
): WorkbenchLayoutNode {
	const tabsets = flatten(tree);
	const ids = tabsets.flatMap((tabset) => tabset.panelIds);
	const count = preset === "single" ? 1 : 2;
	const midpoint = Math.ceil(ids.length / count);
	const groups: WorkbenchTabset[] = Array.from(
		{ length: count },
		(_, index) => {
			const source = tabsets[index] ?? tabsets[0];
			const chunk = ids.slice(index * midpoint, (index + 1) * midpoint);
			const panelIds = [
				...chunk.filter((pid) => panels[pid]?.pinned),
				...chunk.filter((pid) => !panels[pid]?.pinned),
			];
			const previousActive = tabsets.find(
				(tabset) =>
					tabset.activeId && panelIds.includes(tabset.activeId),
			)?.activeId;
			return {
				...source,
				type: "tabset",
				id: tabsets[index]?.id ?? createNodeId("ts"),
				size: 1,
				panelIds,
				activeId:
					selected && panelIds.includes(selected)
						? selected
						: (previousActive ?? panelIds[0] ?? null),
				split: undefined,
			};
		},
	);
	return preset === "single"
		? groups[0]
		: {
				type: preset === "columns" ? "row" : "col",
				id: createNodeId("layout"),
				size: 1,
				children: groups,
			};
}

/** Equalize sibling groups and split viewports without moving any tabs. */
export function balanceWorkbenchTree(
	tree: WorkbenchLayoutNode,
): WorkbenchLayoutNode {
	if (tree.type === "tabset") {
		return {
			...tree,
			size: 1,
			split: tree.split ? { ...tree.split, ratio: 0.5 } : undefined,
		};
	}
	return {
		...tree,
		size: 1,
		children: tree.children.map(balanceWorkbenchTree),
	};
}
