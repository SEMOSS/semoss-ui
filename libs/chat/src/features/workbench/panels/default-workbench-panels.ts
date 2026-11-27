import { FILE_PANEL_COMPONENTS, FILE_PANEL_TYPES } from "@semoss/panels";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { CONNECTOR_VIEWER_PANELS } from "../../connectors/viewers/connector-viewer-panels";
import { ROOM_PANEL_TYPES } from "../../room/store/room-workbench-layout";
import { ROOM_SETTINGS_PANEL } from "../../room-settings/room-settings-panel";
import { ROOM_ACTIVITY_LOG_PANEL } from "./room-activity-log-panel";
import { ROOM_SUBAGENT_PANEL } from "./room-subagent-panel";
import { ROOM_TOOL_PANEL } from "./room-tool-panel";

/**
 * Every panel the room's Workspace can open, by panel type: the room's own,
 * the Microsoft 365 and Google Workspace viewers, plus the shared file
 * explorer and editors. `useCreateChatStore` passes it to each `RoomStore`
 * unless the host's `ChatConfig.workbenchPanels` replaces it: a
 * host spreads this map and adds or removes entries.
 *
 * Module scope matters — blueprint identity churn remounts panels.
 */
export const DEFAULT_WORKBENCH_PANELS: Record<string, WorkbenchPanelConfigAny> =
	{
		...FILE_PANEL_COMPONENTS,
		// A workbench pins its explorer; the room's Files is one tab among the
		// rest, which closes like any other and reopens from the rail.
		[FILE_PANEL_TYPES.FILE_EXPLORER]: {
			...FILE_PANEL_COMPONENTS[FILE_PANEL_TYPES.FILE_EXPLORER],
			canClose: true,
		},
		[ROOM_PANEL_TYPES.TOOL]: ROOM_TOOL_PANEL,
		[ROOM_PANEL_TYPES.SUBAGENT]: ROOM_SUBAGENT_PANEL,
		[ROOM_PANEL_TYPES.SETTINGS]: ROOM_SETTINGS_PANEL,
		[ROOM_PANEL_TYPES.ACTIVITY_LOG]: ROOM_ACTIVITY_LOG_PANEL,
		...CONNECTOR_VIEWER_PANELS,
	};
