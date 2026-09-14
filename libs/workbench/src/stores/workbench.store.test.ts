import { describe, expect, it } from "vitest";
import { createWorkbenchStore } from "./workbench.store";

describe("createWorkbenchStore", () => {
	it("composes only the generic dock namespaces", () => {
		// Permissions moved to the session store and the assistant owns its
		// own, so anything domain-shaped reappearing here is a regression.
		expect(
			Object.keys(
				createWorkbenchStore({
					components: {},
				}).getState(),
			).sort(),
		).toEqual(["command", "control", "layout", "loading"]);
	});

	it("touches no storage of its own", () => {
		// Persistence belongs to the host: it passes an arrangement in and
		// takes snapshots back out. A key appearing here means the dock has
		// started deciding where a layout lives again.
		const before = localStorage.length;
		const store = createWorkbenchStore({
			components: {},
		});
		store.getState().layout.actions.loadSnapshot({
			tree: {
				type: "tabset",
				id: "main",
				size: 1,
				panelIds: [],
				activeId: null,
			},
			panels: {},
		});

		expect(localStorage.length).toBe(before);
	});
});
