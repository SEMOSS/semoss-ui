import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { ROOM_PANEL_TYPES } from "../room-sidebar";
import { ROOM_AUDIT_LOG_PANEL } from "./room-audit-log-panel";
import { ROOM_CONFIGURATION_PANEL } from "./room-configuration-panel";
import { ROOM_SUBAGENT_PANEL } from "./room-subagent-panel";
import { ROOM_TOOL_PANEL } from "./room-tool-panel";

/**
 * The room's own Workspace panels: its tool views, subagents, settings and
 * activity log. A host spreads them into its `panelComponents` beside its
 * own, such as file panels and connector viewers.
 *
 * Module scope matters — blueprint identity churn remounts panels.
 */
export const ROOM_PANEL_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[ROOM_PANEL_TYPES.TOOL]: ROOM_TOOL_PANEL,
	[ROOM_PANEL_TYPES.SUBAGENT]: ROOM_SUBAGENT_PANEL,
	[ROOM_PANEL_TYPES.CONFIGURATION]: ROOM_CONFIGURATION_PANEL,
	[ROOM_PANEL_TYPES.AUDIT_LOG]: ROOM_AUDIT_LOG_PANEL,
};
