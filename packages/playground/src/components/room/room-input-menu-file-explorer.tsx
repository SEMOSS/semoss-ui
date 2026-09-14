import { FolderTreeIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import { DropdownMenuItem } from "@semoss/ui/next";
import { useSidebarPanelActive } from "@/hooks";
import type { RoomStore } from "@/stores";

interface RoomInputMenuFileExplorerProps {
	/** Room  */
	room: RoomStore;

	/** Callback when the item is selected */
	onSelect?: () => void;
}

export const RoomInputMenuFileExplorer: React.FC<RoomInputMenuFileExplorerProps> =
	observer(({ room, onSelect = () => null }) => {
		const { t } = useTranslation("room");

		const explorerConfig = { mode: room.fileMode };
		const isSelected = useSidebarPanelActive(
			room,
			FILE_PANEL_TYPES.FILE_EXPLORER,
			explorerConfig,
		);

		return (
			<DropdownMenuItem
				onSelect={() => {
					if (isSelected) {
						room.closeSidebarPanel(
							FILE_PANEL_TYPES.FILE_EXPLORER,
							explorerConfig,
						);
					} else {
						room.openSidebarFileExplorer(
							undefined,
							t("menuFileExplorer.name"),
						);
					}

					onSelect();
				}}
			>
				<FolderTreeIcon />
				<span className="flex-1">
					{isSelected
						? t("menuFileExplorer.close")
						: t("menuFileExplorer.open")}
				</span>
			</DropdownMenuItem>
		);
	});
