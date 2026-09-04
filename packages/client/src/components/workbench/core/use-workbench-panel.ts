import { useMemo } from "react";
import { useWorkbench } from "@/hooks";
import type {
	WorkbenchChromeProps,
	WorkbenchHeaderLocation,
	WorkbenchPanelId,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { workbenchPanelMethods } from "@/stores/workbench";

/**
 * The flat props for one panel instance: the stable per-pid methods merged with
 * narrowly-subscribed data, so the object's identity changes only when the
 * panel's own inputs do. Pass a `location` to also get the two fields chrome
 * renderers need (`location`, `status`).
 *
 * The fields are read through individual selectors rather than off the whole
 * layout on purpose — memoizing on `s.layout` would rebuild these props on
 * every unrelated commit, and a churning identity remounts panel bodies.
 */
export function useWorkbenchPanel(pid: WorkbenchPanelId): WorkbenchPanelProps;
export function useWorkbenchPanel(
	pid: WorkbenchPanelId,
	location: WorkbenchHeaderLocation,
): WorkbenchChromeProps;
export function useWorkbenchPanel(
	pid: WorkbenchPanelId,
	location?: WorkbenchHeaderLocation,
): WorkbenchPanelProps | WorkbenchChromeProps {
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

	// Kept out of the props memo below: methods only close over `actions`/`pid`,
	// so this identity survives a `value` write and stays stable for the panel's life.
	const methods = useMemo(
		() => workbenchPanelMethods(actions, pid),
		[actions, pid],
	);

	return useMemo(
		() => ({
			...methods,
			id: pid,
			type: record?.type ?? "",
			name: record?.name,
			config: record?.config ?? {},
			value,
			isVisible,
			...(location ? { location, status } : {}),
		}),
		[methods, pid, record, value, isVisible, location, status],
	);
}
