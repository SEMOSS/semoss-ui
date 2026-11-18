import { observer } from "mobx-react-lite";
import { useContext, useEffect } from "react";
import { NavigationButton } from "@/features/navigation/navigation-button";
import { PageHeaderContext } from "@/features/navigation/page-header.context";
import type { NewRoomWorkbenchPanels } from "@/features/workbench/use-workbench-panels";
import { WorkbenchToggleButton } from "@/features/workbench/workbench-toggle-button";
import type { RoomStore } from "@/stores/room/room.store";
import { RoomTitle } from "./room-title";

interface RoomHeaderProps {
	/** The room whose Workbench the header opens. */
	room: RoomStore;
	/** A new chat's own panel actions, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
}

/**
 * One narrow row above a room's conversation and Workbench: the room's name
 * (inside a `RoomActionsProvider`; a new chat has none), then the Workbench
 * toggle. The Workbench's panels sit on its own rail. Inside that
 * layout it starts with the button that opens the hidden navigation, in place
 * of the layout's floating one; the open navigation keeps its own toggle.
 */
export const RoomHeader = observer(
	({ room, newRoomPanels }: RoomHeaderProps) => {
		const registerPageHeader = useContext(PageHeaderContext);

		useEffect(() => registerPageHeader?.(), [registerPageHeader]);

		return (
			<header className="flex h-14 min-w-0 items-center gap-1 px-2 md:h-11">
				{/* only a layout that takes the header's place for it has navigation */}
				{registerPageHeader && <NavigationButton placement="inline" />}
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
		);
	},
);
