import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";
import { HEADER_MENU_ITEM_CLASS_NAME } from "../room-header/header-menu.constants";
import type { RoomUiStore } from "./room-ui.store";
import {
	type NewRoomWorkbenchPanels,
	useWorkbenchPanels,
} from "./use-workbench-panels";
import { WorkbenchPanelIcon } from "./workbench-panel-icon";

export interface WorkbenchPanelMenuItemsProps {
	/** The room whose Workspace the panels open in. */
	room: RoomUiStore;
	/** A new chat's own actions, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
}

/** The Workspace's panels as menu items, for the More actions menu's Open a Panel. */
export const WorkbenchPanelMenuItems = ({
	room,
	newRoomPanels,
}: WorkbenchPanelMenuItemsProps) => {
	const { t } = useTranslation("room");
	const panels = useWorkbenchPanels(room, newRoomPanels);
	return panels.map((panel) => (
		<DropdownMenuItem
			key={panel.id}
			className={HEADER_MENU_ITEM_CLASS_NAME}
			disabled={panel.isDisabled}
			onSelect={() => panel.onOpen()}
		>
			<WorkbenchPanelIcon place={panel} className="size-4 shrink-0" />
			{panel.isLoading ? t("studio.preparingWorkspace") : panel.label}
		</DropdownMenuItem>
	));
};
