import type { WorkbenchLayout } from "@semoss/workbench";

export const TOOL_PANEL_TYPE = "collaboration-tool";

/** Stable focus target when a docked tool moves back into the transcript. */
export function toolCardTriggerId(toolId: string): string {
	return `collaboration-tool-${encodeURIComponent(toolId)}-trigger`;
}

/** Empty dock populated when a message tool is selected. */
export const TOOL_WORKBENCH_LAYOUT: WorkbenchLayout = {
	tree: {
		type: "tabset",
		id: "tools",
		size: 1,
		panelIds: [],
		activeId: null,
		enableDeleteWhenEmpty: false,
	},
	panels: {},
};
