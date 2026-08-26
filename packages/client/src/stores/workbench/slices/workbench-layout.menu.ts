import type { WorkbenchState } from "../workbench.store";
import type { WorkbenchPanelId, WorkbenchSide } from "../workbench.types";
import { WORKBENCH_SIDES } from "../workbench.types";
import { workbenchPanelProps } from "../workbench-panel-props";
import { findTabsetOf } from "./workbench-layout.tree";

/** One row of the shared context menu. `separator` rows carry no label. */
export interface WorkbenchMenuEntry {
	key: string;
	label: string;
	run: () => void;
	separator?: boolean;
}

/**
 * The menu depends on where the panel lives. A rail icon has no tab strip
 * behind it, so pinning, tab splits, and "close others" are meaningless
 * there — it gets moves and collapse instead. Unavailable commands are
 * dropped entirely rather than rendered greyed out.
 *
 * @name buildWorkbenchMenuEntries
 * @param get - The scoped workbench store's getState.
 * @param pid - The panel the menu was opened for.
 * @return Menu rows in render order, separators included.
 */
export function buildWorkbenchMenuEntries(
	get: () => WorkbenchState,
	pid: WorkbenchPanelId,
): WorkbenchMenuEntry[] {
	const state = get();
	const { actions, readOnly } = state.layout;
	const record = state.layout.panels[pid];
	const entries: WorkbenchMenuEntry[] = [];
	const push = (
		key: string,
		label: string,
		run: () => void,
		enabled: boolean,
	) => {
		if (enabled) {
			entries.push({ key, label, run });
		}
	};

	const closable = actions.canClose(pid);
	const draggable = actions.canDrag(pid) && !readOnly;
	const renamable = actions.canRename(pid) && !readOnly;

	push("rename", "Rename", () => actions.setEditingPanel(pid), renamable);

	const side = WORKBENCH_SIDES.find((candidate) =>
		state.layout.borders[candidate].panelIds.includes(pid),
	);

	const pushBorderMoves = (skip?: WorkbenchSide) => {
		for (const target of WORKBENCH_SIDES) {
			if (target === skip) {
				continue;
			}
			push(
				`border:${target}`,
				`Move to ${target} border`,
				() => actions.movePanel(pid, { kind: "border", side: target }),
				draggable,
			);
		}
	};

	/** whatever the panel's own blueprint contributes, guarded so a broken
	 *  panel can't take the menu down with it */
	const pushContributed = () => {
		const make = record
			? state.layout.components[record.type]?.menuItems
			: undefined;
		if (typeof make !== "function") {
			return;
		}
		try {
			const items = (
				make(workbenchPanelProps(state.layout, pid), get) ?? []
			).filter((item) => !item.disabled);
			if (items.length && entries.length) {
				entries.push({
					key: "contributed:separator",
					label: "",
					run: () => {},
					separator: true,
				});
			}
			for (const item of items) {
				entries.push({
					key: `contributed:${item.id}`,
					label: item.label,
					run: item.run,
				});
			}
		} catch {
			// ignore a broken contributor
		}
	};

	if (side) {
		const open = state.layout.borders[side].activeId === pid;
		const main = state.layout.tabsets[0];
		push(
			"toggle",
			open ? "Collapse to rail" : "Open",
			() => actions.toggleBorderPanel(side, pid),
			true,
		);
		push(
			"to-main",
			"Move to the main area",
			() =>
				main &&
				actions.movePanel(pid, { kind: "join", tabsetId: main.id }),
			Boolean(main) && draggable,
		);
		pushBorderMoves(side);
		push("close", "Close", () => actions.closePanel(pid), closable);
		pushContributed();
		return entries;
	}

	const host = findTabsetOf(state.layout.tree, pid);
	const closableSibling = (candidate: WorkbenchPanelId) =>
		actions.canClose(candidate) && !state.layout.panels[candidate]?.pinned;
	const others = host
		? host.panelIds.filter((x) => x !== pid && closableSibling(x))
		: [];
	const rightOf = host
		? host.panelIds
				.slice(host.panelIds.indexOf(pid) + 1)
				.filter(closableSibling)
		: [];

	push(
		"pin",
		record?.pinned ? "Unpin" : "Pin",
		() => actions.setPinned(pid, !record?.pinned),
		!readOnly,
	);
	push("close", "Close", () => actions.closePanel(pid), closable);
	push(
		"close-others",
		"Close others",
		() => {
			for (const other of others) {
				actions.closePanel(other);
			}
		},
		others.length > 0,
	);
	push(
		"close-right",
		"Close to the right",
		() => {
			for (const other of rightOf) {
				actions.closePanel(other);
			}
		},
		rightOf.length > 0,
	);
	push(
		"split-tab-row",
		host?.split ? "Unsplit tab" : "Split tab right",
		() => host && actions.splitInTab(host.id, host.split ? "off" : "row"),
		Boolean(host) && !readOnly,
	);
	push(
		"split-tab-col",
		"Split tab down",
		() => host && actions.splitInTab(host.id, "col"),
		Boolean(host) && host?.split?.dir !== "col" && !readOnly,
	);
	push(
		"split-right",
		"Split right",
		() =>
			host &&
			actions.movePanel(pid, {
				kind: "split",
				tabsetId: host.id,
				dir: "right",
			}),
		Boolean(host) && draggable,
	);
	push(
		"split-down",
		"Split down",
		() =>
			host &&
			actions.movePanel(pid, {
				kind: "split",
				tabsetId: host.id,
				dir: "bottom",
			}),
		Boolean(host) && draggable,
	);
	pushBorderMoves();
	pushContributed();
	return entries;
}
