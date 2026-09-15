import { useMemo } from "react";
import { buildWorkbenchPanel, workbenchPanelMethods } from "../stores";
import type {
	WorkbenchPanel,
	WorkbenchPanelId,
	WorkbenchPanelParams,
} from "../types";
import { useWorkbench } from "./use-workbench";

/**
 * Everything about one panel instance: its record, its live state, and the
 * methods bound to its id. Every panel renderer is handed only an id and calls
 * this — a body, a header, an icon, a control all read the same object.
 *
 * Name the panel's own types at the call site to get them back typed:
 * `useWorkbenchPanel<MyConfig, MyValue>(id)`. `P` and `V` describe what the
 * panel is opened with and what it publishes for its chrome; the store holds
 * both erased, so this is where they are declared and it is on the caller to
 * declare them the same way its blueprint does.
 *
 * **What is identity-stable.** The fields are read through individual selectors
 * rather than off the whole layout on purpose — memoizing on `s.layout` would
 * rebuild this on every unrelated commit, and a churning identity remounts
 * panel bodies. Within that:
 *
 * - the methods (`setValue`, `rename`, `close`, …) are built once per `pid`,
 *   because the store's actions are created once, so they are safe effect
 *   dependencies and stay put across every write;
 * - `config` and `value` are the store's own objects, so they change identity
 *   only when something actually writes them;
 * - the returned object itself changes when any of its fields do, which is
 *   what makes a renderer re-render. Destructure it; don't put the whole
 *   object in a dependency array.
 */
export function useWorkbenchPanel<P = WorkbenchPanelParams, V = unknown>(
	pid: WorkbenchPanelId,
): WorkbenchPanel<P, V> {
	const actions = useWorkbench((s) => s.layout.actions);
	const record = useWorkbench((s) => s.layout.panels[pid]);
	const value = useWorkbench((s) => s.layout.values[pid]);
	const isVisible = useWorkbench((s) =>
		s.layout.visiblePanelIds.includes(pid),
	);
	const status = useWorkbench(
		(s) =>
			s.layout.componentStatuses[s.layout.panels[pid]?.type ?? ""] ??
			"pending",
	);

	// Kept out of the memo below: these close over `actions`/`pid` only, so
	// this identity survives a `value` write and stays stable for the panel's life.
	const methods = useMemo(
		() => workbenchPanelMethods(actions, pid),
		[actions, pid],
	);

	return useMemo(
		() =>
			buildWorkbenchPanel(
				pid,
				record,
				value,
				isVisible,
				status,
				methods,
			) as WorkbenchPanel<P, V>,
		[methods, pid, record, value, isVisible, status],
	);
}
