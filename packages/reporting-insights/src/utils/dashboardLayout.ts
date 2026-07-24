/**
 * Shared flexlayout-react model builder used by both DashboardPage (view)
 * and NewDashboardPage (editor).
 */

import {
	Actions,
	type IJsonModel,
	type IJsonRowNode,
	type IJsonTabSetNode,
	Model,
} from "flexlayout-react";
import type { LayoutItem, Sheet } from "@/types/dashboard";

/**
 * True for flexlayout `onModelChange` actions that are pure VIEW state — selecting a
 * tab, changing the active tabset, or toggling maximize. These must NOT trigger a
 * persist: saving overwrites the dashboard asset (DeleteAsset + PublishAsset), so
 * simply clicking between tabs would needlessly re-write the project every time.
 */
export function isViewOnlyLayoutAction(
	action?: { type?: string } | null,
): boolean {
	const t = action?.type;
	return (
		t === Actions.SELECT_TAB ||
		t === Actions.SET_ACTIVE_TABSET ||
		t === Actions.MAXIMIZE_TOGGLE
	);
}

function groupIntoRows(
	sortedLayout: LayoutItem[],
	vizIds: Set<string>,
): LayoutItem[][] {
	const rows: LayoutItem[][] = [];
	let cur: LayoutItem[] = [];
	let wAcc = 0;
	for (const item of sortedLayout) {
		if (!vizIds.has(item.vizId)) continue;
		const iw = item.widthPct ?? (item.colSpan / 12) * 100;
		if (wAcc > 0 && wAcc + iw > 100) {
			rows.push(cur);
			cur = [item];
			wAcc = iw;
		} else {
			cur.push(item);
			wAcc += iw;
		}
	}
	if (cur.length) rows.push(cur);
	return rows;
}

const GLOBAL = {
	tabSetTabStripHeight: 26,
	tabSetMinWidth: 100,
	tabSetMinHeight: 80,
	// Prevent users from closing panels — tabs are driven by viz config, not freeform
	tabEnableClose: false,
	tabSetEnableDeleteWhenEmpty: true,
	// The tab name always mirrors the visualization's Title field (the single source
	// of truth). Disable flexlayout's native double-click rename so there is exactly
	// one place to rename a panel and the two can never drift.
	tabEnableRename: false,
};

/**
 * Walk a saved flexlayout JSON tree and re-point every tab's `name` at the current
 * title of the visualization it hosts (matched by `config.vizId`). Without this, a
 * title edited after the layout was first saved would never reach the panel header,
 * because the saved JSON is otherwise restored verbatim.
 */
function syncTabNames(node: unknown, titleByVizId: Map<string, string>): void {
	if (!node || typeof node !== "object") return;
	const n = node as Record<string, unknown>;
	if (n.type === "tab") {
		const vizId = (n.config as { vizId?: string } | undefined)?.vizId;
		if (vizId && titleByVizId.has(vizId))
			n.name = titleByVizId.get(vizId) || "Untitled";
	}
	const children = n.children as unknown[] | undefined;
	if (Array.isArray(children))
		for (const c of children) syncTabNames(c, titleByVizId);
}

/** Build a flexlayout-react Model for a Sheet. */
export function buildFlexModel(sheet: Sheet): Model {
	// Restore a previously saved model if present — always enforce disable-close
	// on the global settings so older saved models can't re-enable the X button.
	if (sheet.flexLayout) {
		try {
			const saved = sheet.flexLayout as unknown as IJsonModel;
			const enforced: IJsonModel = {
				...saved,
				global: {
					...((saved.global as Record<string, unknown>) ?? {}),
					tabEnableClose: false,
					tabSetEnableDeleteWhenEmpty: true,
					tabEnableRename: false,
				},
			};
			// Re-sync panel headers from the current viz titles so a rename made
			// after the layout was first saved is always reflected.
			const titleByVizId = new Map(
				sheet.visualizations.map((v) => [v.id, v.title || "Untitled"]),
			);
			syncTabNames(enforced.layout, titleByVizId);
			return Model.fromJson(enforced);
		} catch {
			/* fall through */
		}
	}

	const vizIds = new Set(sheet.visualizations.map((v) => v.id));
	const sorted = [...sheet.layout].sort((a, b) => a.order - b.order);
	const rows = groupIntoRows(sorted, vizIds);

	const makeTab = (item: LayoutItem) => {
		const viz = sheet.visualizations.find((v) => v.id === item.vizId);
		return {
			type: "tab" as const,
			id: `tab-${item.vizId}`,
			name: viz?.title || "Untitled",
			component: "viz",
			config: { vizId: item.vizId },
			enableClose: false, // never show the × close button
		};
	};

	const makeTabSet = (item: LayoutItem, weight: number): IJsonTabSetNode => ({
		type: "tabset",
		id: `ts-${item.vizId}`,
		weight,
		children: [makeTab(item)],
	});

	if (rows.length === 0) {
		return Model.fromJson({
			global: GLOBAL,
			layout: { type: "row", children: [] },
		});
	}

	// Single row → root (horizontal) → tabsets side by side
	if (rows.length === 1) {
		const row = rows[0];
		const totalW = row.reduce(
			(s, i) => s + (i.widthPct ?? 100 / row.length),
			0,
		);
		return Model.fromJson({
			global: GLOBAL,
			layout: {
				type: "row",
				children: row.map((item) =>
					makeTabSet(
						item,
						((item.widthPct ?? 100 / row.length) / totalW) * 100,
					),
				),
			},
		});
	}

	// Multiple rows:
	//   Root (horizontal)
	//   └── Wrapper row (vertical — flexlayout alternates direction each level)
	//       ├── single-col row  →  tabset
	//       └── multi-col row   →  inner row (horizontal, alternates back)
	const totalRowWeight = rows.reduce(
		(s, r) => s + (r[0]?.rowHeightPct ?? 100 / rows.length),
		0,
	);

	const buildRowNode = (
		row: LayoutItem[],
		rowWeight: number,
	): IJsonRowNode | IJsonTabSetNode => {
		if (row.length === 1) return makeTabSet(row[0], rowWeight);
		const totalW = row.reduce(
			(s, i) => s + (i.widthPct ?? 100 / row.length),
			0,
		);
		return {
			type: "row",
			id: `dashrow-${row[0].vizId}`,
			weight: rowWeight,
			children: row.map((item) =>
				makeTabSet(
					item,
					((item.widthPct ?? 100 / row.length) / totalW) * 100,
				),
			),
		};
	};

	return Model.fromJson({
		global: GLOBAL,
		layout: {
			type: "row",
			children: [
				{
					type: "row", // becomes vertical (alternating direction)
					weight: 100,
					children: rows.map((row) => {
						const rw =
							((row[0]?.rowHeightPct ?? 100 / rows.length) /
								totalRowWeight) *
							100;
						return buildRowNode(row, rw);
					}),
				},
			],
		},
	});
}
