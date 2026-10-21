import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useWorkbenchControl, useWorkbenchPanel } from "@semoss/workbench";
import type { ToolPanelConfig } from "../types/tool-workbench";
import { ToolContent } from "./tool-content";
import { ToolPanelInlineControl } from "./tool-panel-inline-control";

/** Workbench host for the shared tool details content. */
export function ToolPanel({ id }: WorkbenchPanelProps) {
	const { config } = useWorkbenchPanel<ToolPanelConfig>(id);
	useWorkbenchControl(id, ToolPanelInlineControl);

	if (!config?.toolId) return null;
	return <ToolContent toolId={config.toolId} />;
}
