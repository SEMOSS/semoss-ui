import { WorkspaceQuickActions } from "@/features/workbench/workspace-quick-actions";
import type { RoomStore } from "@/stores/room/room.store";
import { RoomActionMenuItems } from "./room-action-menu-items";
import { useRoomTitle } from "./room-title.context";

export interface RoomHeaderActionsProps {
	/** The room whose Workspace and actions the header offers. */
	room: RoomStore;
}

/**
 * The end of a room's header: the Workspace's places, with the room's own
 * actions at the bottom of the Other menu. Renders inside a
 * `RoomTitleProvider`, which it shares with the room's name.
 */
export function RoomHeaderActions({ room }: RoomHeaderActionsProps) {
	const title = useRoomTitle();
	return (
		<WorkspaceQuickActions
			room={room}
			menuItems={<RoomActionMenuItems showLabel />}
			onMenuCloseAutoFocus={title?.handleMenuCloseAutoFocus}
		/>
	);
}
