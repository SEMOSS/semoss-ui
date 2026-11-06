import type {
	WorkbenchLayout,
	WorkbenchPanelParams,
	WorkbenchPanelType,
	WorkbenchState,
} from "@semoss/workbench";

/**
 * The room's own panel type ids. A host's panels (files, connector viewers)
 * bring their own.
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
} as const;

/**
 * The file scope a room's file panels read: the room's insight. File panels
 * accept other scopes too, which this module never opens.
 */
export interface RoomFileMode {
	type: "INSIGHT";
	insightId: string;
}

/** The width the Workspace's left rail opens to, in px. */
export const ROOM_SIDEBAR_RAIL_SIZE = 450;

/** The room's own panels, docked collapsed on the Workspace's left rail. */
const ROOM_RAIL_PANEL_IDS = {
	FILES: "room-rail-files",
	SETTINGS: "room-rail-settings",
} as const;

/**
 * The room sidebar's starting arrangement: an empty dock, with Files and
 * Settings collapsed on the left rail.
 *
 * The tabset has to survive its last close, or the dock would prune its only
 * container and have nowhere to put the next panel. The rail's panels cannot
 * be closed; `RoomStore._syncSidebarRail` adds the connector viewers beside
 * them, and Files once a draft has a room to read.
 *
 * @param options.fileMode - The scope Files reads, or null to leave Files out
 * (a new chat has no insight to read until it prepares its room, and a host
 * without file panels has no Files).
 * @param options.explorerType - The host's file explorer panel type.
 * @param options.filesName - Files' tab label.
 * @param options.settingsName - Settings' tab label.
 * @return A fresh arrangement; each room keeps its own reference.
 */
export const createRoomSidebarLayout = ({
	fileMode,
	explorerType,
	filesName,
	settingsName,
}: {
	fileMode: RoomFileMode | null;
	explorerType: string;
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
			type: explorerType,
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
 * the file panels dedupe by — so it has to be the room's *live* insight. A
 * room binds to a fresh insight on every load, and `RoomStore` updates any
 * panels opened before that binding completes.
 *
 * @param insightId - The room's current insight.
 * @return The mode every file panel in that sidebar is opened with.
 */
export const getRoomFileMode = (insightId: string): RoomFileMode => ({
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

/**
 * Whether any tab is open in the Workspace's main area, outside its rail.
 *
 * @param layout - The Workspace's dock layout state.
 * @return True when a tabset holds a panel.
 */
export const hasMainAreaTabs = (layout: WorkbenchState["layout"]): boolean =>
	layout.tabsets.some((tabset) => tabset.panelIds.length > 0);

/**
 * The file scope a docked panel was opened with, if it is a file panel.
 *
 * @param record - The panel.
 * @return Its `mode`, or undefined.
 */
export const getPanelFileMode = (record: {
	config?: unknown;
}): { type: string; insightId?: string } | undefined =>
	(
		record.config as
			| { mode?: { type: string; insightId?: string } }
			| undefined
	)?.mode;
