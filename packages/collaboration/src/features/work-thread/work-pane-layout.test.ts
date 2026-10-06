import { FILE_PANEL_TYPES } from "@semoss/panels";
import { createWorkbenchStore } from "@semoss/workbench";
import {
	chatPanelTarget,
	collapseWorkPane,
	restoreWorkPane,
	workPanelTarget,
} from "./work-pane-layout";
import { WORK_PANEL_TYPES } from "./work-panel.constants";
import {
	CHAT_WORKBENCH,
	createWorkThreadLayout,
	WORK_THREAD_WORKBENCH,
} from "./work-thread-panels";

it("keeps chat workspace actions and explicit email tool views independent of the Emails pane", () => {
	const store = createWorkbenchStore({
		components: Object.fromEntries(
			[
				...Object.values(WORK_PANEL_TYPES),
				...Object.values(FILE_PANEL_TYPES),
			].map((type) => [type, { name: type, content: () => null }]),
		),
	});
	store
		.getState()
		.layout.actions.loadSnapshot(
			CHAT_WORKBENCH.createLayout("chat-insight"),
		);
	expect(CHAT_WORKBENCH.defaultOpen).toBe(false);
	expect(store.getState().layout.visiblePanelIds).toEqual([]);
	for (const type of [
		WORK_PANEL_TYPES.SETTINGS,
		WORK_PANEL_TYPES.CONTEXT,
		WORK_PANEL_TYPES.TOOLS,
		WORK_PANEL_TYPES.ACTIVITY,
		FILE_PANEL_TYPES.FILE_CODE_EDITOR,
		WORK_PANEL_TYPES.DRAFT,
		WORK_PANEL_TYPES.EMAIL,
	]) {
		const layout = store.getState().layout;
		const panelId = layout.actions.selectPanel(
			type,
			{},
			{ target: chatPanelTarget(layout) },
		);
		expect(store.getState().layout.visiblePanelIds).toContain(panelId);
		expect(
			Object.values(store.getState().layout.panels).some(
				(panel) => panel.type === WORK_PANEL_TYPES.EMAILS,
			),
		).toBe(false);
		store.getState().layout.actions.closePanel(panelId);
	}
	expect(chatPanelTarget(store.getState().layout)).toEqual({
		kind: "join",
		tabsetId: "tools",
	});
});

function setup() {
	const store = createWorkbenchStore({
		components: Object.fromEntries(
			Object.values(WORK_PANEL_TYPES).map((type) => [
				type,
				{
					name: type,
					content: () => null,
					mount: "keepAlive" as const,
				},
			]),
		),
	});
	store.getState().layout.actions.loadSnapshot(createWorkThreadLayout());
	return store;
}

it("seeds two visible panels at 75/25 and opens the Work host by default", () => {
	const store = setup();
	expect(WORK_THREAD_WORKBENCH.defaultOpen).toBe(true);
	expect(store.getState().layout.visiblePanelIds).toEqual(
		expect.arrayContaining([
			WORK_PANEL_TYPES.EMAILS,
			WORK_PANEL_TYPES.CONTEXT,
		]),
	);
	expect(store.getState().layout.tabsets.map((item) => item.size)).toEqual([
		75, 25,
	]);
});

it.each([WORK_PANEL_TYPES.EMAILS, WORK_PANEL_TYPES.CONTEXT])(
	"collapses and restores %s with its content identity and resized width",
	(type) => {
		const store = setup();
		store
			.getState()
			.layout.actions.resizeTreeChildren("work-columns", 0, 65, 35);
		store
			.getState()
			.layout.actions.setPanelValue(type, { query: "retained" });
		collapseWorkPane(store.getState().layout, type);
		const collapsed = store.getState().layout;
		expect(collapsed.visiblePanelIds).not.toContain(type);
		expect(collapsed.panelSlots[type]).toBeDefined();
		restoreWorkPane(collapsed, type);
		expect(store.getState().layout.visiblePanelIds).toContain(type);
		expect(store.getState().layout.values[type]).toEqual({
			query: "retained",
		});
		expect(
			store
				.getState()
				.layout.tabsets.map(
					(item) =>
						item.size /
						store
							.getState()
							.layout.tabsets.reduce(
								(total, dock) => total + dock.size,
								0,
							),
				),
		).toEqual([0.65, 0.35]);
	},
);

it("restores both collapsed panes and routes new working tabs away from Context", () => {
	const store = setup();
	collapseWorkPane(store.getState().layout, WORK_PANEL_TYPES.EMAILS);
	collapseWorkPane(store.getState().layout, WORK_PANEL_TYPES.CONTEXT);
	restoreWorkPane(store.getState().layout, WORK_PANEL_TYPES.CONTEXT);
	const target = workPanelTarget(store.getState().layout);
	const id = store
		.getState()
		.layout.actions.selectPanel(
			WORK_PANEL_TYPES.DRAFT,
			{ draftId: "one" },
			{ target },
		);
	const layout = store.getState().layout;
	expect(layout.visiblePanelIds).toEqual(
		expect.arrayContaining([id, WORK_PANEL_TYPES.CONTEXT]),
	);
	expect(
		layout.tabsets.find((dock) => dock.panelIds.includes(id))?.panelIds,
	).toContain(WORK_PANEL_TYPES.EMAILS);
});

it.each(["left", "bottom"] as const)(
	"restores a pane at its chosen %s placement and size",
	(direction) => {
		const store = setup();
		store.getState().layout.actions.movePanel(WORK_PANEL_TYPES.CONTEXT, {
			kind: "root",
			dir: direction,
		});
		const tree = store.getState().layout.tree;
		if (tree.type === "tabset") throw new Error("Expected split layout");
		store.getState().layout.actions.resizeTreeChildren(tree.id, 0, 40, 60);
		collapseWorkPane(store.getState().layout, WORK_PANEL_TYPES.CONTEXT);
		restoreWorkPane(store.getState().layout, WORK_PANEL_TYPES.CONTEXT);
		const docks = store.getState().layout.tabsets;
		expect(docks[direction === "left" ? 0 : 1].panelIds).toContain(
			WORK_PANEL_TYPES.CONTEXT,
		);
		expect(
			docks.map(
				(dock) =>
					dock.size /
					docks.reduce((total, item) => total + item.size, 0),
			),
		).toEqual([0.4, 0.6]);
	},
);
