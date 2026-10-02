import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { WorkbenchMenus } from "@semoss/workbench";
import { useRoom } from "@/contexts/room.context";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import {
	WorkspaceMenuItems,
	type WorkspaceMenuItemsProps,
} from "./workspace-menu-items";

interface RoomWorkbenchMenusProps {
	/** Dismiss the Workbench's mobile drawer after navigation. */
	onNavigate?: () => void;
	/** Draft chats keep settings in their temporary options store. */
	onOpenSettings?: () => void;
	/** Use draft actions until the first message is submitted. */
	workspaceActions?: Omit<WorkspaceMenuItemsProps, "onNavigate">;
}

/** Supply Playground translations to the domain-independent Workbench menus. */
export const RoomWorkbenchMenus = observer(function RoomWorkbenchMenus({
	onNavigate,
	onOpenSettings,
	workspaceActions,
}: RoomWorkbenchMenusProps) {
	const { t } = useTranslation("sidebar");
	const { t: tRoom } = useTranslation("room");
	const room = useRoom();
	return (
		<WorkbenchMenus
			translate={(key) => t(`workbench.${key === "view" ? "file" : key}`)}
			textSize="xs"
			onNavigate={onNavigate}
			showNavigation={false}
			viewItems={
				<WorkspaceMenuItems
					onNavigate={onNavigate}
					onOpenFiles={() =>
						room.openSidebarFileExplorer(
							undefined,
							tRoom("menuFileExplorer.name"),
						)
					}
					// a draft passes its own actions, and has no settled tools
					onOpenTools={
						workspaceActions
							? undefined
							: room.teamwork.openToolsPanel
					}
					onOpenSettings={
						onOpenSettings ??
						(() =>
							room.openSidebarPanel(
								ROOM_PANEL_TYPES.CONFIGURATION,
								{},
								tRoom("settings.panelTitle"),
							))
					}
					onOpenActivity={() =>
						room.openSidebarPanel(
							ROOM_PANEL_TYPES.AUDIT_LOG,
							{},
							tRoom("studio.activityLog"),
						)
					}
					showActivityLog={
						room.theme.featureFlags?.showActivityLog !== false
					}
					{...workspaceActions}
				/>
			}
		/>
	);
});
