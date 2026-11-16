import { observer } from "mobx-react-lite";
import { cn } from "@semoss/ui/next";
import { useFileDrag } from "../composer/file-drag.context";
import { RoomComposer } from "../composer/room-composer";
import { useRoomOrContext } from "../room/room.context";
import type { RoomStore } from "../room/room.store";
import { RoomMessages } from "./room-messages";

interface RoomContentProps {
	/** Room to load */
	room?: RoomStore;
}

/**
 * A room's conversation and its composer, outlined while a file is dragged
 * over the page.
 */
export const RoomContent = observer(({ room: roomProp }: RoomContentProps) => {
	const room = useRoomOrContext(roomProp);
	const { isDragging } = useFileDrag();

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
});
