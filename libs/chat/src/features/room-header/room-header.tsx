import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import type { NewRoomWorkbenchPanels } from "@/features/workbench/use-workbench-panels";
import { WorkbenchToggleButton } from "@/features/workbench/workbench-toggle-button";
import type { RoomStore } from "@/stores/room/room.store";
import { RoomTitle } from "./room-title";

interface RoomHeaderProps {
	/** The room whose Workbench the header opens. */
	room: RoomStore;
	/** A new chat's own panel actions, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
	/** The host's controls before the name, such as a navigation button. */
	leading?: ReactNode;
}

/**
 * One narrow row above a room's conversation and Workbench: the host's leading
 * controls, the room's name (inside a `RoomActionsProvider`; a new chat has
 * none), then the Workbench toggle. The Workbench's panels sit on its own rail.
 */
export const RoomHeader = observer(
	({ room, newRoomPanels, leading }: RoomHeaderProps) => (
		<header className="flex h-14 min-w-0 items-center gap-1 px-2 md:h-11">
			{leading}
			<div className="flex min-w-0 flex-1 items-center">
				<RoomTitle />
			</div>
			<div className="flex shrink-0 items-center gap-0.5">
				<WorkbenchToggleButton
					room={room}
					newRoomPanels={newRoomPanels}
				/>
			</div>
		</header>
	),
);
