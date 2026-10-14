import { FolderTreeIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem, toast } from "@semoss/ui/next";
import { useChat, useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import { createEarlyRoom } from "./create-early-room";

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
					const room = await createEarlyRoom({
						theme: root.theme,
						chat: chat,
						mode: mode,
						options: options,
					});

					// Open the file explorer sidebar tab.
					room.openSidebarFileExplorer(
						undefined,
						t("menuFileExplorer.name"),
					);

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
