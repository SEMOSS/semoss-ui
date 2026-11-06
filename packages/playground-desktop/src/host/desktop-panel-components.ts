import { ROOM_PANEL_COMPONENTS } from "@semoss/chat";
import { CONNECTOR_PANEL_COMPONENTS } from "@semoss/chat/connectors";
import { CHAT_FILE_PANEL_COMPONENTS } from "@semoss/chat/panels";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";

/**
 * Every panel the desktop app's room Workspace can open: the shared file
 * explorer and editors, the room's own, and the connector viewers.
 *
 * Module scope matters — blueprint identity churn remounts panels.
 */
export const DESKTOP_PANEL_COMPONENTS: Record<string, WorkbenchPanelConfigAny> =
	{
		...CHAT_FILE_PANEL_COMPONENTS,
		...ROOM_PANEL_COMPONENTS,
		...CONNECTOR_PANEL_COMPONENTS,
	};
