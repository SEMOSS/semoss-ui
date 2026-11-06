import { ROOM_PANEL_COMPONENTS } from "@semoss/chat";
import { CONNECTOR_PANEL_COMPONENTS } from "@semoss/chat/connectors";
import { CHAT_FILE_PANEL_COMPONENTS } from "@semoss/chat/panels";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { BROWSER_PANEL_COMPONENTS } from "../features/desktop-panels/desktop-panel.components";

/**
 * Every panel the desktop app's room Workspace can open: the shared file
 * explorer and editors, the room's own, the connector viewers, and the
 * desktop's own (the browser panel).
 *
 * Module scope matters — blueprint identity churn remounts panels.
 */
export const DESKTOP_PANEL_COMPONENTS: Record<string, WorkbenchPanelConfigAny> =
	{
		...CHAT_FILE_PANEL_COMPONENTS,
		...ROOM_PANEL_COMPONENTS,
		...CONNECTOR_PANEL_COMPONENTS,
		...BROWSER_PANEL_COMPONENTS,
	};
