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
 * @param room - The room whose sidebar to watch.
 * @param type - Which blueprint.
 * @param config - The instance's parameters, matched as `selectPanel` matches.
 * @return True while a matching panel is the selected one.
 */
export const useSidebarPanelActive = (
	room: RoomStore,
	type: WorkbenchPanelType,
	config?: WorkbenchPanelParams,
): boolean =>
	useStore(room.workbench, (state) =>
		isActiveSidebarPanel(state, type, config),
	);
