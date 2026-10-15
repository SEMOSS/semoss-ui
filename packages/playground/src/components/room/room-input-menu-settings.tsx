import { Settings2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";
import { useSidebarPanelActive } from "@/hooks";
import { ROOM_PANEL_TYPES, type RoomStore } from "@/stores";

/** Props for {@link RoomInputMenuSettings}. */
export interface RoomInputMenuSettingsProps {
	/** The room whose sidebar shows the settings. */
	room: RoomStore;
	/** Called after the item is chosen, to close the menu. */
	onSelect?: () => void;
}

/**
 * The plus menu item that shows or hides the room's settings as a tab in its
 * sidebar, beside Chat Files and the rest.
 */
export const RoomInputMenuSettings = observer(
	({ room, onSelect = () => null }: RoomInputMenuSettingsProps) => {
		const { t } = useTranslation("room");
		const isShown = useSidebarPanelActive(
			room,
			ROOM_PANEL_TYPES.CONFIGURATION,
			{},
		);

		return (
			<DropdownMenuItem
				onSelect={() => {
					if (isShown) {
						room.closeSidebarPanel(
							ROOM_PANEL_TYPES.CONFIGURATION,
							{},
						);
					} else {
						room.openSidebarPanel(ROOM_PANEL_TYPES.CONFIGURATION);
					}
					onSelect();
				}}
			>
				<Settings2Icon />
				<span className="flex-1">
					{isShown ? t("settings.close") : t("settings.open")}
				</span>
			</DropdownMenuItem>
		);
	},
);
