import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { WorkbenchLayout } from "@semoss/workbench";

export const RUN_PANEL_TYPE = "collaboration-run";

export const TOOL_PANEL_TYPE = "collaboration-tool";

/** Stable focus target when a docked tool moves back into the transcript. */
export function toolCardTriggerId(toolId: string): string {
	return `collaboration-tool-${encodeURIComponent(toolId)}-trigger`;
}

/**
 * Build the tool dock with the room's files on its collapsed left rail.
 *
 * Files selected in the explorer open in the main tabset beside tool panels.
 * The runtime insight id keeps reads, saves, and file-event scopes aligned
 * with the room's current agent run.
 */
export function createToolWorkbenchLayout(insightId: string): WorkbenchLayout {
	return {
		tree: {
			type: "tabset",
			id: "tools",
			size: 1,
			panelIds: [],
			activeId: null,
			enableDeleteWhenEmpty: false,
		},
		panels: {
			[FILE_PANEL_TYPES.FILE_EXPLORER]: {
				id: FILE_PANEL_TYPES.FILE_EXPLORER,
				type: FILE_PANEL_TYPES.FILE_EXPLORER,
				name: "Files",
				helpText: "File Explorer",
				canClose: false,
				config: {
					mode: { type: "INSIGHT", insightId },
				},
			},
		},
		borders: {
			left: {
				panelIds: [FILE_PANEL_TYPES.FILE_EXPLORER],
				activeId: null,
				size: 300,
			},
		},
	};
}
