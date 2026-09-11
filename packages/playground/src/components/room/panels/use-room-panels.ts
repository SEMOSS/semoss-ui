import { useLayoutEffect } from "react";
import type { RoomStore } from "@/stores";
import { ROOM_PANEL_COMPONENTS } from "./room-panel.components";

/**
 * Register the sidebar's blueprints on a room's dock.
 *
 * The dock is created with the room, but the blueprints cannot be: they reach
 * into `@/components`, which imports `@/stores`, so the store registering them
 * itself would close a module cycle. They are registered from React instead —
 * from a component that is mounted for as long as the room is, **not** from the
 * sidebar, which unmounts every time it closes.
 *
 * That matters because the blueprints carry `matches`: without them the dock
 * falls back to a shallow compare of config, and opening the same tool twice
 * would give two tabs instead of one.
 *
 * @param room - The room whose dock to register on. Null is a no-op, so a page
 * can call this before its room exists.
 */
export const useRoomPanels = (room: RoomStore | null | undefined): void => {
	useLayoutEffect(() => {
		room?.workbench
			.getState()
			.layout.actions.registerComponents(ROOM_PANEL_COMPONENTS);
	}, [room]);
};
