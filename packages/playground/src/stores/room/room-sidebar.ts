import type { FilePanelMode } from "@semoss/panels";
import type {
	WorkbenchLayout,
	WorkbenchPanelParams,
	WorkbenchPanelType,
	WorkbenchState,
} from "@semoss/workbench";

/**
 * Panel type ids the room sidebar can dock.
 *
 * These strings are persisted into the room's cached layout, so a record whose
 * type no longer has a blueprint renders as "no component registered" rather
 * than disappearing — changing one is a visible break, not a silent one.
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
 * The room sidebar's starting arrangement: one dock, no panels.
 *
 * Every panel arrives from a call site, so the default is empty — but the
 * tabset itself has to survive its last close, or the dock would prune its only
 * container and have nowhere to put the next panel.
 *
 * Module scope is load-bearing twice over: `loadLayout` hydrates once per
 * layout identity, and both the store (at construction) and `<Workbench>` (on
 * mount) pass this same object, so the shell's mount does not re-read the cache
 * over panels opened while the sidebar was closed.
 */
export const ROOM_SIDEBAR_LAYOUT: WorkbenchLayout = {
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
		enableDeleteWhenEmpty: false,
	},
	panels: {},
};

/**
 * The file scope the room sidebar's panels are opened in.
 *
 * Every read, save and download a file panel makes runs against the insight
 * named here, and it is also the key renames are broadcast on and the config
 * the file panels dedupe by — so it has to be the room's *live* insight, not
 * whichever one was current when the sidebar was last cached. A room binds to a
 * fresh insight on every load, which is what `RoomStore` re-points restored
 * panels at.
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
 * The cache name for one room's sidebar arrangement.
 *
 * The name carries the version: bump the suffix whenever the shape of anything
 * inside a snapshot changes, a panel's `config` included. Entries are dropped
 * rather than migrated, so every user loses their arrangement once — the trade
 * for not carrying a repair path for every past shape.
 */
export const getRoomSidebarCacheName = (roomId: string): string =>
	`playground-room--${roomId}--1`;

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
