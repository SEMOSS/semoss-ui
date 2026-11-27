import type { ReactNode } from "react";
import { useRoom } from "../scope/room.context";
import { useRoomSelector } from "../store/use-room-selector";
import { SplitLayout } from "./split-layout";

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
		(current) => current.workbenchPane.isOpen,
	);
	return (
		<SplitLayout
			isWorkbenchOpen={isWorkbenchOpen}
			onWorkbenchClose={() => room.closeWorkbench()}
			header={header}
			workbench={workbench}
		>
			{children}
		</SplitLayout>
	);
};
