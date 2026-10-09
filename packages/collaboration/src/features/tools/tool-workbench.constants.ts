import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { WorkbenchLayout } from "@semoss/workbench";

export const RUN_PANEL_TYPE = "collaboration-run";

export const TOOL_PANEL_TYPE = "collaboration-tool";

export const EMAILS_PANEL_TYPE = "collaboration-emails";

export const CALENDAR_PANEL_TYPE = "collaboration-calendar";

export const EMAIL_DETAIL_PANEL_TYPE = "collaboration-email-detail";

export const CALENDAR_EVENT_PANEL_TYPE = "collaboration-calendar-event";

export const CALENDAR_FULL_PANEL_TYPE = "collaboration-calendar-full";

/** Stable focus target when a docked tool moves back into the transcript. */
export function toolCardTriggerId(toolId: string): string {
	return `collaboration-tool-${encodeURIComponent(toolId)}-trigger`;
}

/**
 * Build the tool dock with files, emails, and calendar on its collapsed left rail.
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
			[EMAILS_PANEL_TYPE]: {
				id: EMAILS_PANEL_TYPE,
				type: EMAILS_PANEL_TYPE,
				name: "Emails",
				canClose: false,
			},
			[CALENDAR_PANEL_TYPE]: {
				id: CALENDAR_PANEL_TYPE,
				type: CALENDAR_PANEL_TYPE,
				name: "Calendar",
				canClose: false,
			},
		},
		borders: {
			left: {
				panelIds: [
					FILE_PANEL_TYPES.FILE_EXPLORER,
					EMAILS_PANEL_TYPE,
					CALENDAR_PANEL_TYPE,
				],
				activeId: null,
				size: 300,
			},
		},
	};
}
