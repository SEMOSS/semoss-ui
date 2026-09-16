import { describe, expect, it } from "vitest";
import type { WorkbenchPanelConfigAny } from "../../types";
import { createWorkbenchStore } from "../workbench.store";

const EDITOR = "EDITOR";
const OTHER = "OTHER";
const PINNED = "PINNED";

/** File-style blueprints dedupe on their path, the way the real editors do. */
const COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[EDITOR]: {
		name: "Editor",
		content: () => null,
		matches: (a, b) => a.path === b.path,
	},
	[OTHER]: { name: "Other", content: () => null },
	[PINNED]: {
		name: "Pinned",
		content: () => null,
		canClose: false,
	},
};

/** The arrangement a store opens with when nothing was restored. */
const EMPTY_LAYOUT = {
	tree: {
		type: "tabset" as const,
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
	},
	panels: {},
};

/** A store built with the blueprints and nothing open. */
const setup = () => {
	const store = createWorkbenchStore({ components: COMPONENTS });
	return () => store.getState().layout;
};

/**
 * Closing a panel deletes the instance — there is no reopen history — so
 * `panels` always means exactly "what is open". Everything that looks a panel
 * up by config depends on that invariant.
 */
describe("closePanel", () => {
	it("deletes the record and its scratch value", () => {
		const layout = setup();
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
		const layout = setup();
		const { actions } = layout();

		const first = actions.spawnPanel(EDITOR, { config: { path: "/a.py" } });
		actions.closePanel(first);

		// a fresh instance, not the one that was closed
		const second = actions.selectPanel(EDITOR, { path: "/a.py" });
		expect(second).not.toBe(first);
		expect(Object.keys(layout().panels)).toEqual([second]);
	});

	it("honours canClose", () => {
		const layout = setup();

		const pid = layout().actions.spawnPanel(PINNED);
		layout().actions.closePanel(pid);

		expect(layout().panels[pid]).toBeDefined();
	});
});

describe("host-owned persistence", () => {
	it("opens with the arrangement the host hands it", () => {
		const store = createWorkbenchStore({
			components: COMPONENTS,
		});
		store.getState().layout.actions.loadSnapshot({
			tree: {
				type: "tabset",
				id: "main",
				size: 1,
				panelIds: ["restored-panel"],
				activeId: "restored-panel",
			},
			panels: {
				"restored-panel": {
					id: "restored-panel",
					type: EDITOR,
					name: "Restored",
				},
			},
			recentCommands: ["view.reset"],
		});

		expect(store.getState().layout.panels["restored-panel"]).toBeDefined();
		// recents ride in the snapshot rather than a cache entry of their own
		expect(store.getState().command.recentCommands).toEqual(["view.reset"]);
	});

	it("ignores recents that are not a list of ids", () => {
		// the value came from storage, which a user can edit by hand; a bad
		// one used to land in state and throw inside executeCommand
		const store = createWorkbenchStore({
			components: COMPONENTS,
		});
		store.getState().layout.actions.loadSnapshot({
			...EMPTY_LAYOUT,
			recentCommands: { nope: true } as unknown as string[],
		});

		expect(store.getState().command.recentCommands).toEqual([]);
	});

	it("hands back what it would persist", () => {
		const store = createWorkbenchStore({
			components: COMPONENTS,
		});
		const { actions } = store.getState().layout;
		actions.loadSnapshot(EMPTY_LAYOUT);
		const pid = actions.spawnPanel(EDITOR, { config: { path: "/a.py" } });

		const snapshot = store.getState().layout.actions.getSnapshot();

		expect(Object.keys(snapshot.panels)).toEqual([pid]);
		expect(Object.keys(snapshot).sort()).toEqual([
			"borders",
			"maximizedTabsetId",
			"panels",
			"recentCommands",
			"selectedPanelId",
			"tree",
		]);
	});
});

/**
 * `selectPanel` can face several matches, because blueprint `matches` does not
 * imply uniqueness — `spawnPanel` bypasses it, which is how dragging a file out
 * of the explorer creates a second view of it.
 */
describe("selectPanel with several matching instances", () => {
	it("reveals an open hidden match instead of spawning another", () => {
		const layout = setup();
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
		const layout = setup();
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
		const layout = setup();
		const { actions } = layout();

		actions.spawnPanel(EDITOR, { config: { path: "/a.py" } });
		const other = actions.selectPanel(EDITOR, { path: "/b.py" });

		expect(layout().panels[other].config).toEqual({ path: "/b.py" });
		expect(Object.keys(layout().panels)).toHaveLength(2);
	});
});

/**
/**
 * A host whose store outlives its shell — the playground's room sidebar closes
 * and reopens, and panels are opened while it is closed — re-runs `loadSnapshot`
 * on every mount. Re-applying there would drop whatever was opened in the
 * meantime, so the arrangement is read once per identity.
 */
describe("loadSnapshot", () => {
	it("applies an arrangement once per identity", () => {
		const store = createWorkbenchStore({
			components: COMPONENTS,
		});
		const { actions } = store.getState().layout;
		actions.loadSnapshot(EMPTY_LAYOUT);
		const pid = actions.spawnPanel(OTHER);

		// the same object the host passed the first time, as a shell remount
		// would hand it back
		actions.loadSnapshot(EMPTY_LAYOUT);

		expect(store.getState().layout.panels[pid]).toBeDefined();
	});

	it("re-applies when the host genuinely swaps arrangements", () => {
		const store = createWorkbenchStore({
			components: COMPONENTS,
		});
		const { actions } = store.getState().layout;
		actions.loadSnapshot(EMPTY_LAYOUT);
		const pid = actions.spawnPanel(OTHER);

		actions.loadSnapshot({ ...EMPTY_LAYOUT });

		expect(store.getState().layout.panels[pid]).toBeUndefined();
	});
});

/**
 * `matchPanels` is the identity rule `selectPanel` uses, exposed so a host can
 * act on "the panel this config names" without re-deriving it.
 */
describe("matchPanels", () => {
	it("returns matches without revealing one, visible first", () => {
		const layout = setup();
		const { actions } = layout();

		const inSide = actions.spawnPanel(EDITOR, {
			config: { path: "/a.py" },
		});
		actions.movePanel(inSide, { kind: "border", side: "right" });
		const sibling = actions.spawnPanel(OTHER);
		actions.movePanel(sibling, { kind: "border", side: "right" });
		const inDock = actions.spawnPanel(EDITOR, {
			config: { path: "/a.py" },
		});

		const matched = actions.matchPanels(EDITOR, { path: "/a.py" });

		expect(matched.map((record) => record.id)).toEqual([inDock, inSide]);
		// nothing was revealed
		expect(layout().borders.right.activeId).toBe(sibling);
	});

	it("is empty when nothing matches", () => {
		const layout = setup();
		layout().actions.spawnPanel(EDITOR, { config: { path: "/a.py" } });

		expect(layout().actions.matchPanels(EDITOR, { path: "/b.py" })).toEqual(
			[],
		);
	});
});
