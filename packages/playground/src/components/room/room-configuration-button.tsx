import { Settings2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";

const ROOM_CONFIGURATION_ID = "CONFIGURATION";

interface RoomConfigurationButtonProps {
	/** Room  */
	room: RoomStore;
}

export const RoomConfigurationButton: React.FC<RoomConfigurationButtonProps> =
	observer(({ room }) => {
		// this will render the component whenever the sidebar model changes
		room.sidebar.counter;

		// track if it is active
		const isActive =
			room.sidebar.isOpen &&
			!!room.sidebar.model.getNodeById(ROOM_CONFIGURATION_ID);

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						size="sm"
						className={`${isActive ? "text-primary" : ""}`}
						variant={"ghost"}
						type="button"
						aria-label="Open Configuration Menu"
						disabled={room.isLoading}
						onClick={() => {
							if (
								room.isSidebarNodeSelected(
									ROOM_CONFIGURATION_ID,
								)
							) {
								room.removeSidebarNode(ROOM_CONFIGURATION_ID);
							} else {
								// this will select if there or open if not
								room.addSidebarNode(ROOM_CONFIGURATION_ID, {
									type: "tab",
									name: "Configuration",
									component: "room-configuration",
									config: {},
									enableClose: true,
								});
							}
						}}
					>
						<Settings2Icon />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Open Configuration Menu</TooltipContent>
			</Tooltip>
		);
	});
