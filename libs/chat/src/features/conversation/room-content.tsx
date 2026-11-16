import { observer } from "mobx-react-lite";
import { cn } from "@semoss/ui/next";
import { useFileDrag } from "@/contexts/file-drag-context";
import type { RoomStore } from "@/stores/room/room.store";
import { RoomComposer } from "./room-composer";
import { RoomMessages } from "./room-messages";

interface RoomContentProps {
	/** Room to load */
	room: RoomStore;
}

/**
 * A room's conversation and its composer, outlined while a file is dragged
 * over the page.
 */
export const RoomContent = observer(({ room }: RoomContentProps) => {
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
