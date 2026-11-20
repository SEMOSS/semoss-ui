import { useEffect, useSyncExternalStore } from "react";
import { useWorkbenchPanel, type WorkbenchPanelProps } from "@semoss/workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { useRunDetail } from "../api/use-run-detail";
import { RunDetails } from "./run-details";

/** Workbench shell for durable run details; renames the panel tab to the real agent name. */
export function RunInspector({ id }: WorkbenchPanelProps) {
	const { config, rename } = useWorkbenchPanel<{ runId: string }>(id);
	const { isOpen, store, insightId } = useToolWorkbench();
	const isSelected = useSyncExternalStore(
		store.subscribe,
		() => store.getState().layout.selection.panel === id,
		() => false,
	);
	const isActive = isOpen && isSelected;
	const runId = config?.runId ?? "";
	const { run } = useRunDetail(insightId, runId, isActive);

	useEffect(() => {
		const name = run?.workspaceName || run?.executorLabel;
		if (name) rename(name);
	}, [run?.workspaceName, run?.executorLabel, rename]);

	return <RunDetails runId={runId} isActive={isActive} />;
}
