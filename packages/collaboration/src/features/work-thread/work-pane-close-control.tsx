import { X } from "lucide-react";
import {
	useWorkbench,
	WorkbenchChromeButton,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { collapseWorkPane } from "./work-pane-layout";

/** Closing a source pane keeps its search, reading position, and body mounted. */
export function WorkPaneCloseControl({ id }: WorkbenchPanelProps) {
	const layout = useWorkbench((state) => state.layout);
	const panel = layout.panels[id];
	if (!panel) return null;
	return (
		<WorkbenchChromeButton
			icon={X}
			label={`Close ${panel.name}`}
			onClick={() => {
				collapseWorkPane(layout, panel.type);
				queueMicrotask(() =>
					document.getElementById(`tab-${id}`)?.focus(),
				);
			}}
		/>
	);
}
