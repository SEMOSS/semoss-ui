import type { ReactNode } from "react";
import { RoomLayout } from "../conversation/room-layout";
import { useRoom } from "./room.context";
import { useRoomSelector } from "./use-room-selector";

/** What `RoomFrame` lays out. */
interface RoomFrameProps {
	/** The row above the room, such as `RoomHeader`. */
	header?: ReactNode;
	/** The room's Workspace, such as `RoomWorkbench`; none leaves it out. */
	workbench?: ReactNode;
	/** The conversation, such as `RoomConversation`. */
	children: ReactNode;
}

/**
 * Lay out the open room: its conversation beside its Workspace, which opens,
 * closes, and collapses with the room. Render inside `RoomScope`.
 */
export const RoomFrame = ({ header, workbench, children }: RoomFrameProps) => {
	const room = useRoom();
	const isWorkbenchOpen = useRoomSelector(
		room,
		(current) => current.sidebar.isOpen,
	);
	return (
		<RoomLayout
			isWorkbenchOpen={isWorkbenchOpen}
			onWorkbenchCollapse={() => void room.closeSidebar()}
			header={header}
			workbench={workbench}
		>
			{children}
		</RoomLayout>
	);
};
