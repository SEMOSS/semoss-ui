import { useStore } from "zustand";
import type { WorkbenchState } from "@semoss/workbench";
import type { RoomStore } from "@/stores/room/room.store";

/**
 * The dock's own chrome around a left rail, in px: the shell's padding on both
 * sides (`p-2`), its gap before the main area (`gap-2`), and the rail itself
 * (`WORKBENCH_STYLES.railThickness`, `w-10`).
 */
const RAIL_CHROME_WIDTH = 8 + 8 + 8 + 40;

/**
 * How wide the Workspace's content is, in px, while nothing is open in its
 * main area: its left rail, and the rail panel open beside it at the width
 * the dock gives it. Null once a tab is open in the main area, which fills
 * whatever room it is given.
 *
 * @param state - The Workspace's dock state.
 * @return The content's width, or null when it should fill.
 */
export const getWorkspaceFitWidth = (state: WorkbenchState): number | null => {
	const { tabsets, borders } = state.layout;
	if (tabsets.some((tabset) => tabset.panelIds.length > 0)) return null;
	const rail = borders.left;
	if (rail.panelIds.length === 0) return null;
	return RAIL_CHROME_WIDTH + (rail.activeId ? rail.size : 0);
};

/**
 * The width a room's Workspace opens to while the user has not sized it
 * themselves: its content's, or null to fill. See `getWorkspaceFitWidth`.
 *
 * @param room - The room whose Workspace it measures.
 * @return The content's width in px, or null.
 */
export const useWorkspaceFitWidth = (room: RoomStore): number | null =>
	useStore(room.workbench, getWorkspaceFitWidth);
