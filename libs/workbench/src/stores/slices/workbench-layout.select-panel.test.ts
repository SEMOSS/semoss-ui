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
		const layout = setup("close-panel-cannot");

		const pid = layout().actions.spawnPanel(PINNED);
		layout().actions.closePanel(pid);

		expect(layout().panels[pid]).toBeDefined();
	});
});

describe("layout cache keys", () => {
	it("isolates persisted layouts by cache key", () => {
		localStorage.setItem(
			"smss-workbench--layout--cache-variant",
			JSON.stringify({
				tree: {
					type: "tabset",
					id: "main",
					size: 1,
					panelIds: ["editable-only"],
					activeId: "editable-only",
				},
				panels: {
					"editable-only": {
						id: "editable-only",
						type: EDITOR,
						name: "Editable only",
					},
				},
				borders: {},
			}),
		);
		const store = createWorkbenchStore("cache-variant--read-only");
		store.getState().layout.actions.loadLayout({
			tree: {
				type: "tabset",
				id: "main",
				size: 1,
				panelIds: [],
				activeId: null,
			},
			panels: {},
		});

		expect(store.getState().layout.panels).toEqual({});
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

/**
 * A host whose store outlives its shell — the playground's room sidebar closes
 * and reopens, and panels are opened while it is closed — re-runs `loadLayout`
 * on every mount. Re-reading the cache there would drop whatever was opened in
 * the meantime, because the write is debounced.
 */
describe("loadLayout", () => {
	const EMPTY = {
		tree: {
			type: "tabset" as const,
			id: "main",
			size: 1,
			panelIds: [],
			activeId: null,
		},
		panels: {},
	};

	/** Plant a cache entry the next hydration would pick up. */
	const writeCache = (cacheKey: string, pid: string) => {
		localStorage.setItem(
			`smss-workbench--layout--${cacheKey}--2`,
			JSON.stringify({
				tree: {
					type: "tabset",
					id: "main",
					size: 1,
					panelIds: [pid],
					activeId: pid,
				},
				panels: {
					[pid]: { id: pid, type: OTHER, name: "From the cache" },
				},
				borders: {},
			}),
		);
	};

	it("hydrates once per layout identity", () => {
		const store = createWorkbenchStore("hydrate-once");
		const { actions } = store.getState().layout;
		actions.loadLayout(EMPTY);

		writeCache("hydrate-once", "cached");
		// the same object the host passed the first time, as a shell remount
		// would hand it back
		actions.loadLayout(EMPTY);

		expect(store.getState().layout.panels.cached).toBeUndefined();
	});

	it("re-hydrates when the host genuinely swaps arrangements", () => {
		const store = createWorkbenchStore("hydrate-swap");
		const { actions } = store.getState().layout;
		actions.loadLayout(EMPTY);

		writeCache("hydrate-swap", "cached");
		actions.loadLayout({ ...EMPTY });

		expect(store.getState().layout.panels.cached).toBeDefined();
	});
});

/**
 * `matchPanels` is the identity rule `selectPanel` uses, exposed so a host can
 * act on "the panel this config names" without re-deriving it.
 */
describe("matchPanels", () => {
	it("returns matches without revealing one, visible first", () => {
		const layout = setup("match-panels");
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
		const layout = setup("match-panels-empty");
		layout().actions.spawnPanel(EDITOR, { config: { path: "/a.py" } });

		expect(layout().actions.matchPanels(EDITOR, { path: "/b.py" })).toEqual(
			[],
		);
	});
});
