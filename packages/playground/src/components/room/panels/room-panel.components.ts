import { FILE_PANEL_COMPONENTS, FILE_PANEL_TYPES } from "@semoss/panels";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { ROOM_PANEL_TYPES } from "@/stores";
import { ROOM_AUDIT_LOG_PANEL } from "./room-audit-log-panel";
import { ROOM_CONFIGURATION_PANEL } from "./room-configuration-panel";
import { ROOM_SUBAGENT_PANEL } from "./room-subagent-panel";
import { ROOM_TOOL_PANEL } from "./room-tool-panel";

/**
 * Every panel the room sidebar can open: the room's own four, plus the shared
 * file explorer and editors.
 *
 * Module scope matters — blueprint identity churn remounts panels.
 */
export const ROOM_PANEL_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	...FILE_PANEL_COMPONENTS,
	// A workbench pins its explorer; a sidebar's is one tab among the rest, and
	// closing the last one is how the sidebar itself closes.
	[FILE_PANEL_TYPES.FILE_EXPLORER]: {
		...FILE_PANEL_COMPONENTS[FILE_PANEL_TYPES.FILE_EXPLORER],
		canClose: true,
	},
	[ROOM_PANEL_TYPES.TOOL]: ROOM_TOOL_PANEL,
	[ROOM_PANEL_TYPES.SUBAGENT]: ROOM_SUBAGENT_PANEL,
	[ROOM_PANEL_TYPES.CONFIGURATION]: ROOM_CONFIGURATION_PANEL,
	[ROOM_PANEL_TYPES.AUDIT_LOG]: ROOM_AUDIT_LOG_PANEL,
};
