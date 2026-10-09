import { describe, expect, it } from "vitest";
import { createWorkbenchStore } from "../workbench.store";

/** A dock with four main tabs, pinned state, scratch data, and a side panel. */
function setup() {
	const store = createWorkbenchStore({
		components: { editor: { name: "Editor" } },
	});
	const { actions } = store.getState().layout;
	const ids = Array.from({ length: 4 }, (_, i) =>
		actions.spawnPanel("editor", {
			name: `File ${i}`,
			config: { path: `${i}.txt` },
		}),
	);
	const side = actions.spawnPanel("editor", {
		name: "Side",
		target: { kind: "border", side: "left" },
	});
	for (const pid of ids)
		actions.setPanelValue(pid, { draft: `Unsaved ${pid}` });
	actions.setPinned(ids[1], true);
	actions.navigatePanel(ids[2]);
	return { store, actions, ids, side };
}

describe("whole-area layout presets", () => {
	it("retains panel identity, configuration, scratch state, selection and borders in one commit", () => {
		const { store, actions, ids } = setup();
		const before = store.getState().layout;
		let commits = 0;
		const stop = store.subscribe(() => {
			commits++;
		});
		actions.arrangePanels("columns");
		const after = store.getState().layout;
		expect(commits).toBe(1);
		expect(after.tree.type).toBe("row");
		expect(after.tabsets).toHaveLength(2);
		expect(after.tabsets.map((tabset) => tabset.panelIds.length)).toEqual([
			2, 2,
		]);
		expect(after.panels).toBe(before.panels);
		expect(after.values).toBe(before.values);
		expect(after.borders).toBe(before.borders);
		expect(after.selection.panel).toBe(ids[2]);
		expect(after.visiblePanelIds).toContain(ids[2]);
		expect(new Set(after.openPanelIds)).toEqual(
			new Set(before.openPanelIds),
		);
		stop();
	});

	it("combines nested groups, clears maximization and keeps pinned tabs at the front", () => {
		const { store, actions, ids } = setup();
		actions.arrangePanels("rows");
		expect(store.getState().layout.tree.type).toBe("col");
		actions.toggleMaximize();
		actions.arrangePanels("single");
		const state = store.getState().layout;
		expect(state.tabsets).toHaveLength(1);
		expect(state.tabsets[0].panelIds).toHaveLength(4);
		expect(state.tabsets[0].panelIds[0]).toBe(ids[1]);
		expect(state.maximizedTabsetId).toBeUndefined();
	});

	it("guards empty, single-tab, mobile, locked-panel and no-drop layouts", () => {
		const { store, actions, ids } = setup();
		actions.updatePanel(ids[0], { canDrag: false });
		const original = store.getState().layout.tree;
		expect(actions.canArrangePanels("single")).toBe(false);
		actions.arrangePanels("columns");
		expect(store.getState().layout.tree).toBe(original);
		actions.updatePanel(ids[0], { canDrag: true });
		actions.setMobileLayout(true);
		actions.arrangePanels("rows");
		expect(store.getState().layout.tree).toBe(original);
		actions.setMobileLayout(false);
		for (const pid of ids.slice(1)) actions.closePanel(pid);
		expect(actions.canArrangePanels("columns")).toBe(false);
		expect(actions.canArrangePanels("single")).toBe(true);
		actions.closePanel(ids[0]);
		expect(actions.canArrangePanels("single")).toBe(false);
		actions.loadSnapshot({
			tree: {
				type: "tabset",
				id: "locked",
				size: 1,
				activeId: "a",
				panelIds: ["a", "b"],
				enableDrop: false,
			},
			panels: {
				a: { id: "a", type: "editor", name: "A" },
				b: { id: "b", type: "editor", name: "B" },
			},
		});
		expect(actions.canArrangePanels("columns")).toBe(false);
	});

	it("balances nested groups without moving tabs or changing side sizes", () => {
		const { store, actions } = setup();
		actions.arrangePanels("columns");
		const tree = store.getState().layout.tree;
		actions.resizeTreeChildren(tree.id, 0, 3, 1);
		const before = store.getState().layout;
		actions.balanceLayout();
		const after = store.getState().layout;
		expect(after.tabsets.map((tabset) => tabset.size)).toEqual([1, 1]);
		expect(after.tabsets.map((tabset) => tabset.panelIds)).toEqual(
			before.tabsets.map((tabset) => tabset.panelIds),
		);
		expect(after.borders).toBe(before.borders);
	});
});

describe("Workbench-wide navigation", () => {
	it("reveals a collapsed side panel and restores a group hiding the destination", () => {
		const { store, actions, side } = setup();
		actions.collapseBorder("left");
		actions.toggleMaximize();
		actions.navigatePanel(side);
		expect(store.getState().layout.borders.left.activeId).toBe(side);
		expect(store.getState().layout.maximizedTabsetId).toBeUndefined();
		expect(store.getState().layout.selection.panel).toBe(side);
	});

	it("wraps in visual order, honors mobile selection, and ignores removed panels", () => {
		const { store, actions, side } = setup();
		const first = store.getState().layout.openPanelIds[0];
		actions.navigatePanel(side);
		actions.navigateRelativePanel(1);
		expect(store.getState().layout.selection.panel).toBe(first);
		actions.setMobileLayout(true);
		actions.setMobileActivePanel(first);
		actions.navigateRelativePanel(-1);
		expect(store.getState().layout.mobileActivePanelId).toBe(side);
		actions.closePanel(side);
		const before = store.getState().layout;
		actions.navigatePanel(side);
		expect(store.getState().layout).toBe(before);
	});
});
