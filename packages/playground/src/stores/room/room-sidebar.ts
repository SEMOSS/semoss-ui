import { FILE_PANEL_TYPES, type FilePanelMode } from "@semoss/panels";
import type {
	WorkbenchLayout,
	WorkbenchPanelParams,
	WorkbenchPanelType,
	WorkbenchState,
} from "@semoss/workbench";

/**
 * Panel type ids the room sidebar can dock.
 *
 * These strings identify the panels the room sidebar can dock.
 *
 * They live beside the store rather than beside the blueprints because both
 * halves need them and the store must not import the blueprints: those reach
 * back into `@/components`, which imports `@/stores`.
 */
export const ROOM_PANEL_TYPES = {
	TOOL: "room-tool",
	SUBAGENT: "room-subagent",
	CONFIGURATION: "room-configuration",
	AUDIT_LOG: "room-audit-log",
	/** The user's OneDrive. */
	ONEDRIVE: "room-onedrive",
	/** The user's Outlook mail. */
	OUTLOOK_MAIL: "room-outlook-mail",
	/** The user's Outlook calendar. */
	OUTLOOK_CALENDAR: "room-outlook-calendar",
	/** The user's Teams channels and their threads. */
	TEAMS_CHANNELS: "room-teams-channels",
	/** The files shared in the user's Teams channels. */
	TEAMS_FILES: "room-teams-files",
	/** The user's Teams chats. */
	TEAMS_CHATS: "room-teams-chats",
	/** The user's Google Drive. */
	GOOGLE_DRIVE: "room-google-drive",
	/** The user's Gmail. */
	GMAIL: "room-gmail",
	/** The user's Google Calendar. */
	GOOGLE_CALENDAR: "room-google-calendar",
	/** The user's Google Docs. */
	GOOGLE_DOCS: "room-google-docs",
} as const;

/** The width the Workspace's left rail opens to, in px. */
export const ROOM_SIDEBAR_RAIL_SIZE = 450;

/** The room's own places, docked collapsed on the Workspace's left rail. */
export const ROOM_RAIL_PANEL_IDS = {
	FILES: "room-rail-files",
	SETTINGS: "room-rail-settings",
} as const;

/**
 * The room sidebar's starting arrangement: an empty dock, with Files and
 * Settings collapsed on the left rail.
 *
 * The tabset has to survive its last close, or the dock would prune its only
 * container and have nowhere to put the next panel. The rail's panels cannot
 * be closed; `RoomStore.syncSidebarRail` adds the connector viewers beside
 * them, and Files once a draft has a room to read.
 *
 * @param options.fileMode - The scope Files reads, or null to leave Files out
 * (a new chat has no insight to read until it prepares its room).
 * @param options.filesName - Files' tab label.
 * @param options.settingsName - Settings' tab label.
 * @return A fresh arrangement; each room keeps its own reference.
 */
export const createRoomSidebarLayout = ({
	fileMode,
	filesName,
	settingsName,
}: {
	fileMode: FilePanelMode | null;
	filesName: string;
	settingsName: string;
}): WorkbenchLayout => {
	const panels: WorkbenchLayout["panels"] = {
		[ROOM_RAIL_PANEL_IDS.SETTINGS]: {
			id: ROOM_RAIL_PANEL_IDS.SETTINGS,
			type: ROOM_PANEL_TYPES.CONFIGURATION,
			name: settingsName,
			config: {},
			canClose: false,
			minWidth: ROOM_SIDEBAR_RAIL_SIZE,
		},
	};
	if (fileMode) {
		panels[ROOM_RAIL_PANEL_IDS.FILES] = {
			id: ROOM_RAIL_PANEL_IDS.FILES,
			type: FILE_PANEL_TYPES.FILE_EXPLORER,
			name: filesName,
			config: { mode: fileMode },
			canClose: false,
			minWidth: ROOM_SIDEBAR_RAIL_SIZE,
		};
	}
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [],
			activeId: null,
			enableDeleteWhenEmpty: false,
		},
		panels: panels,
		borders: {
			left: {
				panelIds: [
					...(fileMode ? [ROOM_RAIL_PANEL_IDS.FILES] : []),
					ROOM_RAIL_PANEL_IDS.SETTINGS,
				],
				activeId: null,
				size: ROOM_SIDEBAR_RAIL_SIZE,
			},
		},
	};
};

/**
 * The file scope the room sidebar's panels are opened in.
 *
 * Every read, save and download a file panel makes runs against the insight
 * named here, and it is also the key renames are broadcast on and the config
 * the file panels dedupe by — so it has to be the room's *live* insight, not
 * A room binds to a fresh insight on every load, and `RoomStore` updates any
 * panels opened before that binding completes.
 *
 * @param insightId - The room's current insight.
 * @return The mode every file panel in that sidebar is opened with.
 */
export const getRoomFileMode = (
	insightId: string,
): Extract<FilePanelMode, { type: "INSIGHT" }> => ({
	type: "INSIGHT",
	insightId: insightId,
});

/**
 * Whether the panel `type`/`config` names is the one the sidebar is showing.
 *
 * Written against the dock state rather than the room so it can back both the
 * room's point-in-time read and a zustand selector — the menu items that toggle
 * a panel have to re-render when the front tab changes.
 *
 * @param state - The sidebar's dock state.
 * @param type - Which blueprint.
 * @param config - The instance's parameters, matched as `selectPanel` matches.
 * @return True when a matching panel is the selected one.
 */
export const isActiveSidebarPanel = (
	state: WorkbenchState,
	type: WorkbenchPanelType,
	config: WorkbenchPanelParams = {},
): boolean => {
	const selected = state.layout.selection.panel;
	if (!selected) {
		return false;
	}
	return state.layout.actions
		.matchPanels(type, config)
		.some((record) => record.id === selected);
};
