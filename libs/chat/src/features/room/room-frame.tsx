import type { ReactNode } from "react";
import { RoomLayout } from "../conversation/room-layout";
import { useRoom } from "./room.context";
import { useRoomSelector } from "./use-room-selector";

interface RoomFrameProps {
	/** The row above the room, such as `Chat.Header`. */
	header?: ReactNode;
	/** The room's Workspace, such as `Chat.Workbench`; none leaves it out. */
	workbench?: ReactNode;
	/** The conversation, such as `Chat.Conversation`. */
	children: ReactNode;
}

/**
 * Lay out the open room: its conversation beside its Workspace, which opens,
 * closes, and collapses with the room. Render inside `Chat.Room`.
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
