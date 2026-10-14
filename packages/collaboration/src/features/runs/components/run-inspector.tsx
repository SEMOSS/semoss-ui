import { useSyncExternalStore } from "react";
import { useWorkbenchPanel, type WorkbenchPanelProps } from "@semoss/workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { RunDetails } from "./run-details";

/** Workbench shell for durable run details; child cards expand in their own context. */
export function RunInspector({ id }: WorkbenchPanelProps) {
	const { config } = useWorkbenchPanel<{ runId: string }>(id);
	const { isOpen, store } = useToolWorkbench();
	const isSelected = useSyncExternalStore(
		store.subscribe,
		() => store.getState().layout.selection.panel === id,
		() => false,
	);
	return (
		<RunDetails
			runId={config?.runId ?? ""}
			isActive={isOpen && isSelected}
		/>
	);
}
