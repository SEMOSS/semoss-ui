import {
	EllipsisIcon,
	PanelRightCloseIcon,
	PanelsTopLeftIcon,
	PlugIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useContext, useEffect, useId } from "react";
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
import { MobileNavigationButton } from "@/features/navigation/mobile-navigation-button";
import { PageHeaderContext } from "@/features/navigation/page-header.context";
import { useRoomActionsContext } from "@/features/room-actions/room-actions.context";
import { useSettingsDialog } from "@/features/settings/settings-dialog.context";
import type { NewRoomWorkbenchPanels } from "@/features/workbench/use-workbench-panels";
import { WorkbenchPanelMenuItems } from "@/features/workbench/workbench-panel-menu-items";
import { WorkbenchToggleButton } from "@/features/workbench/workbench-toggle-button";
import type { RoomStore } from "@/stores/room/room.store";
import { HeaderIconButton } from "./header-icon-button";
import {
	HEADER_MENU_ITEM_CLASS_NAME,
	HEADER_MENU_LABEL_CLASS_NAME,
} from "./header-menu.constants";
import { RoomActionMenuItems } from "./room-action-menu-items";
import { RoomTitle } from "./room-title";

export interface RoomHeaderProps {
	/** The room whose Workbench the header opens and whose actions it lists. */
	room: RoomStore;
	/** A new chat's own panel actions, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
}

/**
 * One narrow row above a room's conversation and Workbench: the room's name
 * (inside a `RoomActionsProvider`; a new chat has none), then the More actions
 * menu and the Workbench toggle. On mobile it also holds the navigation
 * button, in place of the layout's floating one, when it is inside that layout.
 */
export const RoomHeader = observer(
	({ room, newRoomPanels }: RoomHeaderProps) => {
		const { t } = useTranslation(["room", "sidebar"]);
		const workspaceLabelId = useId();
		const settingsLabelId = useId();
		const { openSettings } = useSettingsDialog();
		const roomActions = useRoomActionsContext();
		const registerPageHeader = useContext(PageHeaderContext);

		useEffect(() => registerPageHeader?.(), [registerPageHeader]);

		return (
			<header className="flex h-14 min-w-0 items-center gap-1 px-2 md:h-11">
				{/* only a layout that takes the header's place for it has navigation */}
				{registerPageHeader && (
					<MobileNavigationButton placement="inline" />
				)}
				<div className="flex min-w-0 flex-1 items-center">
					<RoomTitle />
				</div>
				<div className="flex shrink-0 items-center gap-0.5">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<HeaderIconButton label={t("studio.moreActions")}>
								<EllipsisIcon
									aria-hidden="true"
									className="size-4"
								/>
							</HeaderIconButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-60"
							onCloseAutoFocus={
								roomActions?.handleMenuCloseAutoFocus
							}
						>
							<DropdownMenuGroup
								aria-labelledby={workspaceLabelId}
							>
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
								{room.sidebar.isOpen && (
									<DropdownMenuItem
										className={HEADER_MENU_ITEM_CLASS_NAME}
										onSelect={() =>
											void room.closeSidebar()
										}
									>
										<PanelRightCloseIcon
											aria-hidden="true"
											className="rtl:-scale-x-100"
										/>
										{t("studio.closeWorkspace")}
									</DropdownMenuItem>
								)}
							</DropdownMenuGroup>
							<RoomActionMenuItems />
							<DropdownMenuSeparator />
							<DropdownMenuGroup
								aria-labelledby={settingsLabelId}
							>
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
					<WorkbenchToggleButton
						room={room}
						newRoomPanels={newRoomPanels}
					/>
				</div>
			</header>
		);
	},
);
