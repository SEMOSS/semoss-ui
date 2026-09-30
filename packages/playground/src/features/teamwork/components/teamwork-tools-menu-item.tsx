import { WrenchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";
import { useSidebarPanelActive } from "@/hooks";
import type { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";

/** Props for {@link TeamworkToolsMenuItem}. */
export interface TeamworkToolsMenuItemProps {
	/** The room whose sidebar shows the tools. */
	room: RoomStore;
	/** Called after the item is chosen, to close the menu. */
	onSelect?: () => void;
}

/**
 * The plus menu's item that shows or hides "Chat Tools" in the sidebar: every
 * tool the assistant has for the next message, including the ones this
 * browser sends itself.
 */
export const TeamworkToolsMenuItem = observer(
	({ room, onSelect = () => null }: TeamworkToolsMenuItemProps) => {
		const { t } = useTranslation("teamwork");
		const isShown = useSidebarPanelActive(
			room,
			ROOM_PANEL_TYPES.TEAMWORK_TOOLS,
			{},
		);

		return (
			<DropdownMenuItem
				onSelect={() => {
					if (isShown) {
						room.teamwork.closeToolsPanel();
					} else {
						room.teamwork.openToolsPanel();
					}
					onSelect();
				}}
			>
				<WrenchIcon aria-hidden />
				<span className="flex-1">
					{isShown ? t("menu.hideTools") : t("menu.showTools")}
				</span>
			</DropdownMenuItem>
		);
	},
);
