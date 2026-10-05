import { useMemo } from "react";
import type { WorkbenchLayoutActions } from "../stores";
import type {
	WorkbenchPanel,
	WorkbenchPanelId,
	WorkbenchPanelMethods,
	WorkbenchPanelParams,
} from "../types";
import { useWorkbench } from "./use-workbench";

/**
 * The config of a panel opened without one. Module scope so it is the same
 * object every time: a panel that lists `config` in an effect's dependencies
 * must not see a new `{}` on every unrelated write.
 */
const EMPTY_CONFIG: WorkbenchPanelParams = {};

/**
 * The methods half of a panel, bound to one id. `actions` is already
 * identity-stable, so this is stable for as long as the pid is.
 */
const panelMethods = (
	actions: WorkbenchLayoutActions,
	pid: WorkbenchPanelId,
): WorkbenchPanelMethods => ({
	rename: (name) => actions.renamePanel(pid, name),
	close: () => actions.closePanel(pid),
	moveTo: (target) => actions.movePanel(pid, target),
	setConfig: (patch) => actions.updatePanel(pid, { config: patch }),
	setValue: (value) => actions.setPanelValue(pid, value),
	select: (type, config) => actions.selectPanel(type, config),
});

/**
 * Everything about one panel instance: its record, its live state, and the
 * methods bound to its id. Every panel renderer is handed only an id and calls
 * this — a body, a header, an icon, a control all read the same object. It is
 * the only place a `WorkbenchPanel` is assembled.
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
		() => panelMethods(actions, pid) as WorkbenchPanelMethods<P, V>,
		[actions, pid],
	);

	return useMemo(
		() => ({
			...methods,
			id: pid,
			type: record?.type ?? "",
			name: record?.name,
			config: (record?.config ?? EMPTY_CONFIG) as P,
			value: value as V | undefined,
			isVisible,
			status,
		}),
		[methods, pid, record, value, isVisible, status],
	);
}
