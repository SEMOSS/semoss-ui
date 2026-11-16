import { cn } from "@semoss/ui/next";
import { useFileDrop } from "../composer/file-drop.context";
import { RoomComposer } from "../composer/room-composer";
import { useRoomOrContext } from "../room/room.context";
import type { RoomStore } from "../room/room.store";
import { RoomMessages } from "./room-messages";

interface RoomConversationProps {
	/** Room to load */
	room?: RoomStore;
}

/**
 * A room's conversation and its composer, outlined while a file is dragged
 * over the page.
 */
export const RoomConversation = ({ room: roomProp }: RoomConversationProps) => {
	const room = useRoomOrContext(roomProp);
	const { isDragging } = useFileDrop();

	return (
		<div
			className={cn(
				"@container flex h-full w-full min-w-0 flex-col border-2 border-transparent bg-background",
				isDragging && "border-primary",
			)}
		>
			<RoomMessages room={room} />
			<RoomComposer room={room} />
		</div>
	);
};
