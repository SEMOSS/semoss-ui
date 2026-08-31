import { describe, expect, it } from "vitest";
import { createWorkbenchStore } from "../workbench.store";
import type { WorkbenchPanelConfigAny } from "../workbench.types";

const EDITOR = "EDITOR";
const OTHER = "OTHER";

/** File-style blueprints dedupe on their path, the way the real editors do. */
const COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[EDITOR]: {
		name: "Editor",
		content: () => null,
		matches: (a, b) => a.path === b.path,
	},
	[OTHER]: { name: "Other", content: () => null },
};

/** A store with the blueprints registered and nothing open. */
const setup = (id: string) => {
	const store = createWorkbenchStore(id);
	store.getState().layout.actions.registerComponents(COMPONENTS);
	return () => store.getState().layout;
};

/**
 * Closing a panel deletes the instance — there is no reopen history — so
 * `panels` always means exactly "what is open". Everything that looks a panel
 * up by config depends on that invariant.
 */
describe("closePanel", () => {
	it("deletes the record and its scratch value", () => {
		const layout = setup("close-panel-deletes");
		const { actions } = layout();

		const pid = actions.spawnPanel(EDITOR, { config: { path: "/a.py" } });
		actions.setPanelValue(pid, "scratch");
		expect(layout().panels[pid]).toBeDefined();
		expect(layout().values[pid]).toBe("scratch");

		actions.closePanel(pid);

		expect(layout().panels[pid]).toBeUndefined();
		expect(layout().values[pid]).toBeUndefined();
		expect(layout().openPanelIds).not.toContain(pid);
	});

	it("leaves nothing behind for a later lookup to find", () => {
		const layout = setup("close-panel-no-ghost");
		const { actions } = layout();

		const first = actions.spawnPanel(EDITOR, { config: { path: "/a.py" } });
		actions.closePanel(first);

		// a fresh instance, not the one that was closed
		const second = actions.selectPanel(EDITOR, { path: "/a.py" });
		expect(second).not.toBe(first);
		expect(Object.keys(layout().panels)).toEqual([second]);
	});

	it("honours canClose", () => {
		const store = createWorkbenchStore("close-panel-cannot");
		store.getState().layout.actions.registerComponents({
			PINNED: { name: "Pinned", content: () => null, canClose: false },
		});
		const layout = () => store.getState().layout;

		const pid = layout().actions.spawnPanel("PINNED");
		layout().actions.closePanel(pid);

		expect(layout().panels[pid]).toBeDefined();
	});
});

/**
 * `selectPanel` can face several matches, because blueprint `matches` does not
 * imply uniqueness — `spawnPanel` bypasses it, which is how dragging a file out
 * of the explorer creates a second view of it.
 */
describe("selectPanel with several matching instances", () => {
	it("reveals an open hidden match instead of spawning another", () => {
		const layout = setup("select-panel-hidden-wins");
		const { actions } = layout();

		// drag the file into the main dock, then into the side
		const inDock = actions.spawnPanel(EDITOR, {
			config: { path: "/a.py" },
		});
		const inSide = actions.spawnPanel(EDITOR, {
			config: { path: "/a.py" },
		});
		actions.movePanel(inSide, { kind: "border", side: "right" });

		// switch the side to a different panel, so the file's view is open but
		// no longer showing
		const sibling = actions.spawnPanel(OTHER);
		actions.movePanel(sibling, { kind: "border", side: "right" });
		expect(layout().borders.right.activeId).toBe(sibling);

		// close the one in the main dock
		actions.closePanel(inDock);
		expect(layout().panels[inDock]).toBeUndefined();

		const selected = actions.selectPanel(EDITOR, { path: "/a.py" });

		// the side's view is revealed, and no third panel is invented
		expect(selected).toBe(inSide);
		expect(layout().borders.right.activeId).toBe(inSide);
		expect(Object.keys(layout().panels)).toHaveLength(2);
	});

	it("prefers a match already on screen over an open hidden one", () => {
		const layout = setup("select-panel-visible-wins");
		const { actions } = layout();

		const inSide = actions.spawnPanel(EDITOR, {
			config: { path: "/a.py" },
		});
		actions.movePanel(inSide, { kind: "border", side: "right" });
		const sibling = actions.spawnPanel(OTHER);
		actions.movePanel(sibling, { kind: "border", side: "right" });

		// this one lands in the main dock and is its active tab
		const inDock = actions.spawnPanel(EDITOR, {
			config: { path: "/a.py" },
		});
		expect(layout().visiblePanelIds).toContain(inDock);

		expect(actions.selectPanel(EDITOR, { path: "/a.py" })).toBe(inDock);
		// revealing must not disturb the side
		expect(layout().borders.right.activeId).toBe(sibling);
	});

	it("spawns when nothing matches", () => {
		const layout = setup("select-panel-spawns");
		const { actions } = layout();

		actions.spawnPanel(EDITOR, { config: { path: "/a.py" } });
		const other = actions.selectPanel(EDITOR, { path: "/b.py" });

		expect(layout().panels[other].config).toEqual({ path: "/b.py" });
		expect(Object.keys(layout().panels)).toHaveLength(2);
	});
});
