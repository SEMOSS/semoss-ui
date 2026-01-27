import { FolderTreeIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { DropdownMenuItem } from "@semoss/ui/next";
import type { RoomStore } from "@/stores";

const ROOM_FILE_EXPLORER_ID = "FILE_EXPLORER";

interface RoomInputMenuFileExplorerProps {
	/** Room  */
	room: RoomStore;

	/** Callback when the item is selected */
	onSelect?: () => void;
}

export const RoomInputMenuFileExplorer: React.FC<RoomInputMenuFileExplorerProps> =
	observer(({ room, onSelect = () => null }) => {
		// this will render the component whenever the sidebar model changes
		room.sidebar.counter;

		// track if selected
		const isSelected = room.isSidebarNodeSelected(ROOM_FILE_EXPLORER_ID);

		return (
			<DropdownMenuItem
				onSelect={() => {
					if (room.isSidebarNodeSelected(ROOM_FILE_EXPLORER_ID)) {
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

					onSelect();
				}}
			>
				<FolderTreeIcon />
				<span className="flex-1">
					{isSelected ? "Close" : "Open"} File Explorer
				</span>
			</DropdownMenuItem>
		);
	});
