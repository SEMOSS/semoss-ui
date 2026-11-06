import { useStore } from "zustand";
import { useRoomSelector } from "@semoss/sdk/react";
import type {
	WorkbenchPanelParams,
	WorkbenchPanelType,
} from "@semoss/workbench";
import { isActiveSidebarPanel } from "../features/workbench/room-sidebar";
import type { RoomUiStore } from "../features/workbench/room-ui.store";

/**
 * Whether the room's sidebar is showing the panel `type`/`config` names.
 *
 * The menu items and cards that toggle a panel live outside the sidebar, so
 * they cannot use `useWorkbench` — they subscribe to the room's dock directly.
 * Subscribing to the dock's selection rather than to every layout change
 * keeps them from re-rendering on each one.
 *
 * **Both halves of the question matter.** Closing the sidebar only flips
 * `isOpen`; the dock keeps its panels and its selection, so a panel can be
 * "selected" while nothing is on screen. Without the `isOpen` half, the file
 * explorer's menu item offers to *close* a panel the user cannot see instead of
 * reopening the sidebar. The `isOpen` half is read from the room, the rest
 * from its zustand dock.
 *
 * @param room - The room whose sidebar to watch.
 * @param type - Which blueprint.
 * @param config - The instance's parameters, matched as `selectPanel` matches.
 * @return True while the sidebar is open and a matching panel is its selection.
 */
export const useSidebarPanelActive = (
	room: RoomUiStore,
	type: WorkbenchPanelType,
	config?: WorkbenchPanelParams,
): boolean => {
	const isSelected = useStore(room.workbench, (state) =>
		isActiveSidebarPanel(state, type, config),
	);

	const isOpen = useRoomSelector(room, (r) => r.sidebar.isOpen);

	return isOpen && isSelected;
};
