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
} from "@/features/teamwork/components/connector-viewer-panels";
import { TEAMWORK_TOOLS_PANEL } from "@/features/teamwork/components/teamwork-tools-panel";
import { ROOM_PANEL_TYPES } from "@/stores";
import { ROOM_AUDIT_LOG_PANEL } from "./room-audit-log-panel";
import { ROOM_CONFIGURATION_PANEL } from "./room-configuration-panel";
import { ROOM_SUBAGENT_PANEL } from "./room-subagent-panel";
import { ROOM_TOOL_PANEL } from "./room-tool-panel";

/**
 * Every panel the room sidebar can open: the room's own, "Chat Tools", the
 * Microsoft 365 and Google Workspace viewers, plus the shared file explorer
 * and editors.
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
	[ROOM_PANEL_TYPES.TEAMWORK_TOOLS]: TEAMWORK_TOOLS_PANEL,
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
