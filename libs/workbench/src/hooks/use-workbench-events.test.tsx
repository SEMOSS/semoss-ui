import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { WorkbenchStoreContext } from "../contexts/workbench.context";
import { createWorkbenchStore } from "../stores";
import type { WorkbenchPanelConfigAny } from "../types";
import { useWorkbenchEvents } from "./use-workbench-events";

const EDITOR = "EDITOR";

const COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[EDITOR]: { name: "Editor", content: () => null },
};

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

/** The hook subscribed to a store with one panel open. */
const setup = () => {
	const store = createWorkbenchStore({ components: COMPONENTS });
	const { actions } = store.getState().layout;
	actions.loadSnapshot(EMPTY);
	const pid = actions.spawnPanel(EDITOR, { config: { path: "/a.py" } });

	const onChange = vi.fn();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<WorkbenchStoreContext.Provider value={store}>
			{children}
		</WorkbenchStoreContext.Provider>
	);
	renderHook(() => useWorkbenchEvents({ onChange }), { wrapper });

	return { actions, onChange, pid, store };
};

describe("onChange", () => {
	it("does not fire for the arrangement it subscribed to", () => {
		const { onChange } = setup();

		expect(onChange).not.toHaveBeenCalled();
	});

	it("fires when the arrangement moves", () => {
		const { actions, onChange, pid } = setup();

		actions.closePanel(pid);

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange.mock.calls[0][0].panels).toEqual({});
	});

	it("fires when the palette's recents move", () => {
		// recents ride in the snapshot but are written by the command slice,
		// outside the layout's commit path -- a gate keyed on commits alone
		// would let them lag until the next arrangement change
		const { onChange, store } = setup();
		const handler = vi.fn();
		store.getState().command.actions.registerCommand({
			id: "view.reset",
			label: "Reset",
			handler,
		});

		store.getState().command.actions.executeCommand("view.reset");

		expect(handler).toHaveBeenCalled();
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange.mock.calls[0][0].recentCommands).toEqual([
			"view.reset",
		]);
	});

	it("stays quiet for state a snapshot does not hold", () => {
		// None of this goes through `commit`, and none of it belongs in
		// storage. Routing one of them through `commit` to "tidy up" would
		// start persisting it -- 60 writes a second, for slot measuring.
		const { actions, onChange, pid } = setup();

		actions.setPanelValue(pid, { scrolled: 10 });
		actions.setDragging(pid);
		actions.setEditingPanel(pid);
		actions.measureSlots();
		actions.markComponentReady(EDITOR);

		expect(onChange).not.toHaveBeenCalled();
	});
});
