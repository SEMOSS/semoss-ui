import { EllipsisIcon, PanelsTopLeftIcon, PlugIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { HeaderIconButton } from "@/features/room-header/header-icon-button";
import {
	HEADER_MENU_ITEM_CLASS_NAME,
	HEADER_MENU_LABEL_CLASS_NAME,
} from "@/features/room-header/header-menu.constants";
import { RoomActionMenuItems } from "@/features/room-header/room-action-menu-items";
import { useSettingsDialog } from "@/features/settings/settings-dialog.context";
import type { RoomStore } from "@/stores/room/room.store";
import type { NewRoomWorkbenchPanels } from "./use-workbench-panels";
import { WorkbenchPanelMenuItems } from "./workbench-panel-menu-items";

interface RoomActionsMenuProps {
	/** The room whose Workspace the menu opens panels in and whose actions it lists. */
	room: RoomStore;
	/** A new chat's own panel actions, which prepare its room, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
	/** Whether it sits on a vertical rail, so its tooltip and menu open beside it. */
	isVertical: boolean;
}

/**
 * The More actions menu, first on the Workbench rail (above the mobile tabs on
 * a narrow screen). It runs in sections: Workspace (Open a Panel), Room (inside a `RoomActionsProvider`; a new chat
 * has none), and Settings (Connectors). A new chat's panels go through
 * `newRoomPanels`, which prepares its room first.
 */
export const RoomActionsMenu = observer(
	({ room, newRoomPanels, isVertical }: RoomActionsMenuProps) => {
		const { t } = useTranslation(["room", "sidebar"]);
		const workspaceLabelId = useId();
		const settingsLabelId = useId();
		const { openSettings } = useSettingsDialog();

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<HeaderIconButton
						label={t("studio.moreActions")}
						tooltipSide={isVertical ? "right" : "bottom"}
					>
						<EllipsisIcon aria-hidden="true" className="size-4" />
					</HeaderIconButton>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					side={isVertical ? "right" : "bottom"}
					align="start"
					className="w-60"
				>
					<DropdownMenuGroup aria-labelledby={workspaceLabelId}>
						<DropdownMenuLabel
							id={workspaceLabelId}
							className={HEADER_MENU_LABEL_CLASS_NAME}
						>
							{t("studio.workspace")}
						</DropdownMenuLabel>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger
								className={HEADER_MENU_ITEM_CLASS_NAME}
							>
								<PanelsTopLeftIcon aria-hidden="true" />
								{t("workspacePlaces.openPanel")}
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent className="w-56">
									<WorkbenchPanelMenuItems
										room={room}
										newRoomPanels={newRoomPanels}
									/>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					</DropdownMenuGroup>
					<RoomActionMenuItems />
					<DropdownMenuSeparator />
					<DropdownMenuGroup aria-labelledby={settingsLabelId}>
						<DropdownMenuLabel
							id={settingsLabelId}
							className={HEADER_MENU_LABEL_CLASS_NAME}
						>
							{t("sidebar:settings.title")}
						</DropdownMenuLabel>
						<DropdownMenuItem
							className={HEADER_MENU_ITEM_CLASS_NAME}
							onSelect={() => openSettings("connectors")}
						>
							<PlugIcon aria-hidden="true" />
							{t("sidebar:settings.sections.connectors")}
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	},
);
