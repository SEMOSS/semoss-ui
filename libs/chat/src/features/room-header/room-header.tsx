import {
	EllipsisIcon,
	PanelRightCloseIcon,
	PanelsTopLeftIcon,
} from "lucide-react";
import { type ReactNode, useId } from "react";
import { useTranslation } from "@semoss/i18n";
import { useRoomSelector } from "@semoss/sdk/react";
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
import { useChat } from "../../host/chat.context";
import { useRoomActionsContext } from "../room-actions/room-actions.context";
import { useOpenSettings } from "../settings/use-open-settings";
import type { RoomUiStore } from "../workbench/room-ui.store";
import type { NewRoomWorkbenchPanels } from "../workbench/use-workbench-panels";
import { WorkbenchPanelMenuItems } from "../workbench/workbench-panel-menu-items";
import { WorkbenchToggleButton } from "../workbench/workbench-toggle-button";
import { HeaderIconButton } from "./header-icon-button";
import {
	HEADER_MENU_ITEM_CLASS_NAME,
	HEADER_MENU_LABEL_CLASS_NAME,
} from "./header-menu.constants";
import { RoomActionMenuItems } from "./room-action-menu-items";
import { RoomTitle } from "./room-title";

/** Props for {@link RoomHeader}. */
export interface RoomHeaderProps {
	/** The room whose Workbench the header opens and whose actions it lists. */
	room: RoomUiStore;
	/** A new chat's own panel actions, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
	/** What the host puts before the room's name, such as its navigation. */
	leading?: ReactNode;
}

/**
 * One narrow row above a room's conversation and Workbench: the room's name
 * (inside a `RoomActionsProvider`; a new chat has none), then the More actions
 * menu and the Workbench toggle. The host's `leading` content, such as its
 * mobile navigation button, comes first.
 */
export const RoomHeader = ({
	room,
	newRoomPanels,
	leading,
}: RoomHeaderProps) => {
	const { t } = useTranslation(["room", "sidebar"]);
	const workspaceLabelId = useId();
	const settingsLabelId = useId();
	const openSettings = useOpenSettings();
	const roomActions = useRoomActionsContext();
	const isWorkbenchOpen = useRoomSelector(room, (r) => r.sidebar.isOpen);
	const { config } = useChat();
	// a host without Workspace panels has no Workspace to open
	const hasWorkspace = Boolean(config.panelComponents);
	// the integrations' settings pages, such as Connectors
	const settingsPages = room.integrations.flatMap((integration) =>
		integration.settingsPage ? [integration.settingsPage] : [],
	);

	return (
		<header className="flex h-14 min-w-0 items-center gap-1 px-2 md:h-11">
			{leading}
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
						onCloseAutoFocus={roomActions?.handleMenuCloseAutoFocus}
					>
						{hasWorkspace && (
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
								{isWorkbenchOpen && (
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
						)}
						<RoomActionMenuItems />
						{openSettings && settingsPages.length > 0 && (
							<>
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
									{settingsPages.map((page) => (
										<DropdownMenuItem
											key={page.id}
											className={
												HEADER_MENU_ITEM_CLASS_NAME
											}
											onSelect={() =>
												openSettings(page.id)
											}
										>
											<page.icon aria-hidden />
											{t(page.titleKey)}
										</DropdownMenuItem>
									))}
								</DropdownMenuGroup>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
				{hasWorkspace && (
					<WorkbenchToggleButton
						room={room}
						newRoomPanels={newRoomPanels}
					/>
				)}
			</div>
		</header>
	);
};
