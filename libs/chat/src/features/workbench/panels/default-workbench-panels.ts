import { FILE_PANEL_COMPONENTS, FILE_PANEL_TYPES } from "@semoss/panels";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import {
	GMAIL_PANEL,
	GOOGLE_CALENDAR_PANEL,
	GOOGLE_DOCS_PANEL,
	GOOGLE_DRIVE_PANEL,
	ONEDRIVE_PANEL,
	OUTLOOK_CALENDAR_PANEL,
	OUTLOOK_MAIL_PANEL,
	TEAMS_CHANNELS_PANEL,
	TEAMS_CHATS_PANEL,
	TEAMS_FILES_PANEL,
} from "../../connectors/viewers/connector-viewer-panels";
import { ROOM_PANEL_TYPES } from "../../room/store/room-workbench-layout";
import { ROOM_SETTINGS_PANEL } from "../../room-settings/room-settings-panel";
import { ROOM_ACTIVITY_LOG_PANEL } from "./room-activity-log-panel";
import { ROOM_SUBAGENT_PANEL } from "./room-subagent-panel";
import { ROOM_TOOL_PANEL } from "./room-tool-panel";

/**
 * Every panel the room's Workspace can open, by panel type: the room's own,
 * the Microsoft 365 and Google Workspace viewers, plus the shared file
 * explorer and editors. `useCreateChatStore` passes it to each `RoomStore`
 * unless the host's `ChatConfig.workbenchPanelComponents` replaces it: a
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
		[ROOM_PANEL_TYPES.ONEDRIVE]: ONEDRIVE_PANEL,
		[ROOM_PANEL_TYPES.OUTLOOK_MAIL]: OUTLOOK_MAIL_PANEL,
		[ROOM_PANEL_TYPES.OUTLOOK_CALENDAR]: OUTLOOK_CALENDAR_PANEL,
		[ROOM_PANEL_TYPES.TEAMS_CHANNELS]: TEAMS_CHANNELS_PANEL,
		[ROOM_PANEL_TYPES.TEAMS_FILES]: TEAMS_FILES_PANEL,
		[ROOM_PANEL_TYPES.TEAMS_CHATS]: TEAMS_CHATS_PANEL,
		[ROOM_PANEL_TYPES.GOOGLE_DRIVE]: GOOGLE_DRIVE_PANEL,
		[ROOM_PANEL_TYPES.GMAIL]: GMAIL_PANEL,
		[ROOM_PANEL_TYPES.GOOGLE_CALENDAR]: GOOGLE_CALENDAR_PANEL,
		[ROOM_PANEL_TYPES.GOOGLE_DOCS]: GOOGLE_DOCS_PANEL,
	};
