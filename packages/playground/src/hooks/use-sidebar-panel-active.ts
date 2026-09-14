import { useStore } from "zustand";
import type {
	WorkbenchPanelParams,
	WorkbenchPanelType,
} from "@semoss/workbench";
import { isActiveSidebarPanel, type RoomStore } from "@/stores";

/**
 * Whether the room's sidebar is showing the panel `type`/`config` names.
 *
 * The menu items and cards that toggle a panel live outside the sidebar, so
 * they cannot use `useWorkbench` — they subscribe to the room's dock directly.
 * This replaces reading `room.sidebar.counter` for its MobX side effect, which
 * re-rendered every one of them on every layout change.
 *
 * **Both halves of the question matter.** Closing the sidebar only flips
 * `isOpen`; the dock keeps its panels and its selection, so a panel can be
 * "selected" while nothing is on screen. Without the `isOpen` half, the file
 * explorer's menu item offers to *close* a panel the user cannot see instead of
 * reopening the sidebar. Call this from an `observer()` component — the
 * `isOpen` read is MobX, the rest is zustand.
 *
 * @param room - The room whose sidebar to watch.
 * @param type - Which blueprint.
 * @param config - The instance's parameters, matched as `selectPanel` matches.
 * @return True while the sidebar is open and a matching panel is its selection.
 */
export const useSidebarPanelActive = (
	room: RoomStore,
	type: WorkbenchPanelType,
	config?: WorkbenchPanelParams,
): boolean => {
	const isSelected = useStore(room.workbench, (state) =>
		isActiveSidebarPanel(state, type, config),
	);

	return room.sidebar.isOpen && isSelected;
};
