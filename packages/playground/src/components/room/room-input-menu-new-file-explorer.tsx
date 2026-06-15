import { FolderTreeIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { runPixel } from "@semoss/sdk/react";
import { DropdownMenuItem, toast } from "@semoss/ui/next";
import { useChat, useRoot } from "@/hooks";
import { RoomStore } from "@/stores";

const ROOM_FILE_EXPLORER_ID = "FILE_EXPLORER";

interface RoomInputMenuNewFileExplorerProps {
	/** Current room mode */
	mode: "chat" | "agent" | "workspace";

	/** Options from the temporary room store */
	options: RoomStore["options"];

	/** Callback when the room has been pre-created */
	onRoomCreated: (room: RoomStore) => void;

	/** Callback after the menu item is selected */
	onSelect?: () => void;
}

export const RoomInputMenuNewFileExplorer = ({
	mode,
	options,
	onRoomCreated,
	onSelect = () => null,
}: RoomInputMenuNewFileExplorerProps) => {
	const { t } = useTranslation("room");
	const { root } = useRoot();
	const { chat } = useChat();

	return (
		<DropdownMenuItem
			onSelect={async (e) => {
				e.preventDefault();
				onSelect();
				try {
					const { errors, pixelReturn, insightId } = await runPixel<
						[{ roomId: string }]
					>("CreatePlaygroundRoom()", "new");

					if (errors.length > 0) {
						throw new Error(errors.join(""));
					}

					const roomId = pixelReturn[0].output.roomId;
					const room = new RoomStore(root.theme, roomId, insightId);

					room.setModel(chat.models.selected);
					room.setMode(mode === "agent" ? "agent" : "chat");
					await room.initialize();
					await room.updateRoomOptions(options);

					// Register in the cache so loadRoom finds it after navigation.
					chat.registerRoom(room);

					// Open the file explorer sidebar tab.
					room.addSidebarNode(ROOM_FILE_EXPLORER_ID, {
						type: "tab",
						name: t("menuFileExplorer.name"),
						component: "room-file-explorer",
						config: {},
						enableClose: true,
					});

					onRoomCreated(room);
				} catch {
					toast.error(t("menuFileExplorer.open"));
				}
			}}
		>
			<FolderTreeIcon />
			<span className="flex-1">{t("menuFileExplorer.open")}</span>
		</DropdownMenuItem>
	);
};
