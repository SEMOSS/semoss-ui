import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { WorkbenchStoreContext } from "../../contexts/workbench.context";
import { createWorkbenchStore } from "../../stores";
import type { WorkbenchLayout, WorkbenchPanelConfigAny } from "../../types";
import { WorkbenchResetButton } from "./workbench-reset-button";

const EDITOR = "EDITOR";

const COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[EDITOR]: { name: "Editor", content: () => null },
};

/** A dock holding one panel, `pid`. */
const layout = (pid: string): WorkbenchLayout => ({
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [pid],
		activeId: pid,
	},
	panels: { [pid]: { id: pid, type: EDITOR, name: pid } },
});

const DEFAULT_LAYOUT = layout("a");

/** The button over a store that has drifted off `DEFAULT_LAYOUT`. */
const setup = () => {
	const store = createWorkbenchStore({ components: COMPONENTS });
	const { actions } = store.getState().layout;
	actions.loadSnapshot(DEFAULT_LAYOUT);
	const pid = actions.spawnPanel(EDITOR, { config: { path: "/b.py" } });

	render(
		<WorkbenchStoreContext.Provider value={store}>
			<WorkbenchResetButton snapshot={DEFAULT_LAYOUT} />
		</WorkbenchStoreContext.Provider>,
	);

	return { pid, store };
};

/** The panel ids across every tabset in the store's dock. */
const openIds = (store: ReturnType<typeof setup>["store"]): string[] =>
	Object.keys(store.getState().layout.panels);

const click = () =>
	act(() => {
		screen.getByTestId("workbench-reset-button").click();
	});

describe("WorkbenchResetButton", () => {
	it("puts the dock back to the snapshot it was given", () => {
		const { pid, store } = setup();
		expect(openIds(store)).toContain(pid);

		click();

		expect(openIds(store)).toEqual(["a"]);
	});

	it("resets again on a second press", () => {
		const { store } = setup();

		click();
		act(() => {
			store.getState().layout.actions.spawnPanel(EDITOR, {
				config: { path: "/c.py" },
			});
		});
		click();

		expect(openIds(store)).toEqual(["a"]);
	});

	it("does not hand the store the host's own object", () => {
		const { store } = setup();

		click();

		expect(store.getState().layout.tree).not.toBe(DEFAULT_LAYOUT.tree);
		expect(store.getState().layout.tree).toEqual(DEFAULT_LAYOUT.tree);
	});
});
