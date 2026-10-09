import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { WorkbenchLayout } from "@semoss/workbench";
import { createToolWorkbenchLayout } from "../tools/tool-workbench.constants";

export const EMAIL_BROWSER_PANEL = "collaboration-emails";
export const CALENDAR_BROWSER_PANEL = "collaboration-calendar";
export const MAIL_DETAIL_PANEL = "collaboration-mail-detail";
export const EVENT_DETAIL_PANEL = "collaboration-event-detail";
export const FULL_CALENDAR_PANEL = "collaboration-full-calendar";

/** Retain collapsed browsers, deferring draft file space until explicitly needed. */
export function createRoomConnectorLayout(
	insightId: string,
	includeFiles = true,
): WorkbenchLayout {
	const base = createToolWorkbenchLayout(insightId);
	const files = base.panels[FILE_PANEL_TYPES.FILE_EXPLORER];
	return {
		...base,
		panels: {
			...(includeFiles
				? {
						[files.id]: {
							...files,
							minWidth: 300,
							canDrag: false,
						},
					}
				: {}),
			[EMAIL_BROWSER_PANEL]: {
				id: EMAIL_BROWSER_PANEL,
				type: EMAIL_BROWSER_PANEL,
				name: "Emails",
				config: { provider: "microsoft" },
				minWidth: 300,
			},
			[CALENDAR_BROWSER_PANEL]: {
				id: CALENDAR_BROWSER_PANEL,
				type: CALENDAR_BROWSER_PANEL,
				name: "Calendar",
				config: { provider: "microsoft" },
				minWidth: 300,
			},
		},
		borders: {
			left: {
				panelIds: [
					...(includeFiles ? [files.id] : []),
					EMAIL_BROWSER_PANEL,
					CALENDAR_BROWSER_PANEL,
				],
				activeId: null,
				size: 300,
			},
		},
	};
}
