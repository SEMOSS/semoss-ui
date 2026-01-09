import { FolderTreeIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";

const ROOM_FILE_EXPLORER_ID = "FILE_EXPLORER";

interface RoomFileExplorerButtonProps {
	/** Room  */
	room: RoomStore;
}

export const RoomFileExplorerButton: React.FC<RoomFileExplorerButtonProps> =
	observer(({ room }) => {
		// this will render the component whenever the sidebar model changes
		room.sidebar.counter;

		// track if it is active
		const isActive =
			room.sidebar.isOpen &&
			!!room.sidebar.model.getNodeById(ROOM_FILE_EXPLORER_ID);

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						size="sm"
						className={`${isActive ? "text-primary" : ""}`}
						variant={"ghost"}
						type="button"
						aria-label="Open File Explorer"
						disabled={room.isLoading}
						onClick={() => {
							if (
								room.isSidebarNodeSelected(
									ROOM_FILE_EXPLORER_ID,
								)
							) {
								room.removeSidebarNode(ROOM_FILE_EXPLORER_ID);
							} else {
								// this will select if there or open if not
								room.addSidebarNode(ROOM_FILE_EXPLORER_ID, {
									type: "tab",
									name: "File Explorer",
									component: "room-file-explorer",
									config: {},
									enableClose: true,
								});
							}
						}}
					>
						<FolderTreeIcon />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Open File Explorer</TooltipContent>
			</Tooltip>
		);
	});
