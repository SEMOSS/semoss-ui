import { observer } from "mobx-react-lite";
import { useContext, useEffect } from "react";
import { MobileNavigationButton } from "@/features/navigation/mobile-navigation-button";
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
 * toggle. The More actions menu sits on the Workbench rail. On mobile it also
 * holds the navigation button, in place of the layout's floating one, when it
 * is inside that layout.
 */
export const RoomHeader = observer(
	({ room, newRoomPanels }: RoomHeaderProps) => {
		const registerPageHeader = useContext(PageHeaderContext);

		useEffect(() => registerPageHeader?.(), [registerPageHeader]);

		return (
			<header className="flex h-14 min-w-0 items-center gap-1 px-2 md:h-11">
				{/* only a layout that takes the header's place for it has navigation */}
				{registerPageHeader && (
					<MobileNavigationButton placement="inline" />
				)}
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
