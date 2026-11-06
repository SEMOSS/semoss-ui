import { ROOM_PANEL_COMPONENTS } from "@semoss/chat";
import { CONNECTOR_PANEL_COMPONENTS } from "@semoss/chat/connectors";
import { CHAT_FILE_PANEL_COMPONENTS } from "@semoss/chat/panels";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";

/**
 * Every panel the playground's room Workspace can open: the shared file
 * explorer and editors, the room's own, and the Microsoft 365 and Google
 * Workspace viewers.
 *
 * Module scope matters — blueprint identity churn remounts panels.
 */
export const PLAYGROUND_PANEL_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	...CHAT_FILE_PANEL_COMPONENTS,
	...ROOM_PANEL_COMPONENTS,
	...CONNECTOR_PANEL_COMPONENTS,
};
