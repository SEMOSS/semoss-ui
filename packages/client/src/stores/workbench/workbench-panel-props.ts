import type {
	WorkbenchLayoutActions,
	WorkbenchLayoutSliceState,
} from "./slices/workbench-layout.slice";
import type {
	WorkbenchPanelId,
	WorkbenchPanelMethods,
	WorkbenchPanelProps,
} from "./workbench.types";

/**
 * The methods half of a panel's props, bound to one id. Pure — `actions` is
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
 * One panel's flat props, read off a layout snapshot. Pure and unmemoized:
 * `useWorkbenchPanel` wraps the same fields in narrow selectors so the object's
 * identity is stable for React, while the vanilla derivations (palette
 * commands, context menu) call this per rebuild and discard the result.
 */
export const workbenchPanelProps = (
	layout: WorkbenchLayoutSliceState,
	pid: WorkbenchPanelId,
): WorkbenchPanelProps => {
	const record = layout.panels[pid];
	return {
		...workbenchPanelMethods(layout.actions, pid),
		id: pid,
		type: record?.type ?? "",
		name: record?.name,
		config: record?.config ?? {},
		value: layout.values[pid],
		isVisible: layout.visiblePanelIds.includes(pid),
	};
};
