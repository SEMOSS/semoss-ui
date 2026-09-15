import type {
	WorkbenchPanel,
	WorkbenchPanelId,
	WorkbenchPanelMethods,
	WorkbenchPanelParams,
	WorkbenchPanelRecord,
	WorkbenchPanelStatus,
} from "../types";
import type {
	WorkbenchLayoutActions,
	WorkbenchLayoutSliceState,
} from "./slices/workbench-layout.slice";

/**
 * The config of a panel opened without one. Module scope so it is the same
 * object every time: a panel that lists `config` in an effect's dependencies
 * must not see a new `{}` on every unrelated write.
 */
export const EMPTY_PANEL_CONFIG: WorkbenchPanelParams = {};

/**
 * The methods half of a panel, bound to one id. Pure — `actions` is
 * already identity-stable, so callers control memoization.
 */
export const workbenchPanelMethods = (
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
 * Assemble one panel from parts already read. The single definition of what a
 * `WorkbenchPanel` is made of: `useWorkbenchPanel` calls this with values from
 * narrow selectors so React sees a stable identity, and `workbenchPanel` below
 * calls it with a whole layout. Neither owns the field list.
 */
export const buildWorkbenchPanel = (
	pid: WorkbenchPanelId,
	record: WorkbenchPanelRecord | undefined,
	value: unknown,
	isVisible: boolean,
	status: WorkbenchPanelStatus,
	methods: WorkbenchPanelMethods,
): WorkbenchPanel => ({
	...methods,
	id: pid,
	type: record?.type ?? "",
	name: record?.name,
	config: record?.config ?? EMPTY_PANEL_CONFIG,
	value,
	isVisible,
	status,
});

/**
 * One panel, read off a layout snapshot. Pure and unmemoized — the React-free
 * twin of `useWorkbenchPanel`, for the vanilla derivations (palette commands,
 * context menu) that rebuild and discard their result.
 */
export const workbenchPanel = (
	layout: WorkbenchLayoutSliceState,
	pid: WorkbenchPanelId,
): WorkbenchPanel => {
	const record = layout.panels[pid];
	return buildWorkbenchPanel(
		pid,
		record,
		layout.values[pid],
		layout.visiblePanelIds.includes(pid),
		layout.componentStatuses[record?.type ?? ""] ?? "pending",
		workbenchPanelMethods(layout.actions, pid),
	);
};
