import type { ReactNode } from "react";
import { RoomWorkbenchToggle } from "../../workbench/rail/room-workbench-toggle";
import type { NewRoomWorkbenchPanels } from "../../workbench/rail/use-workbench-panels";
import { useRoomOrContext } from "../scope/room.context";
import type { RoomStore } from "../store/room.store";
import { RoomTitle } from "./room-title";

/** Props for {@link RoomHeader}. */
interface RoomHeaderProps {
	/** The room whose Workbench the header opens; the `RoomScope`'s room when left out. */
	room?: RoomStore;
	/** A new chat's own panel actions, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
	/** The host's controls before the name, such as a navigation button. */
	leading?: ReactNode;
	/** The host's controls after the name, before the Workbench toggle. */
	trailing?: ReactNode;
}

/**
 * One narrow row above a room's conversation and Workbench: the host's leading
 * controls, the room's name (inside a `RoomActionsProvider`; a new chat has
 * none), the host's trailing controls, then the Workbench toggle. The Workbench's panels sit on its own rail.
 */
export const RoomHeader = ({
	room: roomProp,
	newRoomPanels,
	leading,
	trailing,
}: RoomHeaderProps) => {
	const room = useRoomOrContext(roomProp);
	return (
		<header className="flex h-14 min-w-0 items-center gap-1 px-2 md:h-11">
			{leading}
			<div className="flex min-w-0 flex-1 items-center">
				<RoomTitle />
			</div>
			<div className="flex shrink-0 items-center gap-0.5">
				{trailing}
				<RoomWorkbenchToggle
					room={room}
					newRoomPanels={newRoomPanels}
				/>
			</div>
		</header>
	);
};
