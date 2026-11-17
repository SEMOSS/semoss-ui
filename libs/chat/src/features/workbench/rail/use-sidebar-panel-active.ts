import { useStore } from "zustand";
import type {
	WorkbenchPanelParams,
	WorkbenchPanelType,
} from "@semoss/workbench";
import type { RoomStore } from "../../room/store/room.store";
import { isActiveSidebarPanel } from "../../room/store/room-sidebar";
import { useRoomSelector } from "../../room/store/use-room-selector";

/**
 * Whether the room's sidebar is showing the panel `type`/`config` names.
 *
 * The menu items and cards that toggle a panel live outside the sidebar, so
 * they cannot use `useWorkbench` — they subscribe to the room's dock directly.
 * Reading the dock's selection, rather than a counter of every layout change,
 * renders each of them only when its own answer changes.
 *
 * **Both halves of the question matter.** Closing the sidebar only flips
 * `isOpen`; the dock keeps its panels and its selection, so a panel can be
 * "selected" while nothing is on screen. Without the `isOpen` half, the file
 * explorer's menu item offers to *close* a panel the user cannot see instead of
 * reopening the sidebar. The `isOpen` half is the room's, the rest the dock's.
 *
 * @param room - The room whose sidebar to watch.
 * @param type - Which blueprint.
 * @param config - The instance's parameters, matched as `selectPanel` matches.
 * @returns True while the sidebar is open and a matching panel is its selection.
 */
export const useSidebarPanelActive = (
	room: RoomStore,
	type: WorkbenchPanelType,
	config?: WorkbenchPanelParams,
): boolean => {
	const isSelected = useStore(room.workbench, (state) =>
		isActiveSidebarPanel(state, type, config),
	);

	const isOpen = useRoomSelector(room, (current) => current.sidebar.isOpen);

	return isOpen && isSelected;
};
