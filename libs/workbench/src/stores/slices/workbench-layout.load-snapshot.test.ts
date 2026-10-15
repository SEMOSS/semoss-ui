import { describe, expect, it, vi } from "vitest";
import type { WorkbenchPanelConfigAny, WorkbenchSnapshot } from "../../types";
import { createWorkbenchStore } from "../workbench.store";

const EDITOR = "EDITOR";

const COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[EDITOR]: { name: "Editor", content: () => null },
};

const LAYOUT: WorkbenchSnapshot = {
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: ["a"],
		activeId: "a",
	},
	panels: { a: { id: "a", type: EDITOR, name: "a" } },
};

const store = () => createWorkbenchStore({ components: COMPONENTS });

/** Arrangements storage can hand back that never came from `getSnapshot`. */
const UNREADABLE: Record<string, unknown> = {
	"a truncated entry": { tree: { type: "tabset" } },
	"a tree that is not a node": { tree: "main", panels: {} },
	"a docked panel with no record": {
		tree: { type: "tabset", id: "main", size: 1, panelIds: ["gone"] },
		panels: {},
	},
	"a border with no size": {
		...LAYOUT,
		borders: { left: { panelIds: ["a"] } },
	},
};

describe("loadSnapshot", () => {
	it("applies an arrangement it can read", () => {
		const s = store();

		s.getState().layout.actions.loadSnapshot(LAYOUT);

		expect(Object.keys(s.getState().layout.panels)).toEqual(["a"]);
		expect(s.getState().layout.hydrated).toBe(true);
	});

	for (const [what, snapshot] of Object.entries(UNREADABLE)) {
		it(`drops ${what}`, () => {
			const s = store();
			const logged = vi
				.spyOn(console, "error")
				.mockImplementation(() => undefined);

			s.getState().layout.actions.loadSnapshot(
				snapshot as WorkbenchSnapshot,
			);

			// hydrated, so the shell renders its (empty) dock rather than
			// sitting on the loading state — the reset button is the way back
			expect(s.getState().layout.hydrated).toBe(true);
			expect(s.getState().layout.panels).toEqual({});
			expect(logged).toHaveBeenCalled();
			logged.mockRestore();
		});
	}

	it("leaves an arrangement already applied alone", () => {
		const s = store();
		const logged = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		s.getState().layout.actions.loadSnapshot(LAYOUT);
		s.getState().layout.actions.loadSnapshot({
			tree: "nope",
		} as unknown as WorkbenchSnapshot);

		expect(Object.keys(s.getState().layout.panels)).toEqual(["a"]);
		logged.mockRestore();
	});
});
