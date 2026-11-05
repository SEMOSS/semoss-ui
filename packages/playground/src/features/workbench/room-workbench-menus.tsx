import { useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import { WorkbenchMenus } from "@semoss/workbench";
import { useRoom } from "@/contexts/room.context";
import { ConversationWorkspaceRailContext } from "@/features/conversation/conversation-workspace-rail.context";
import type { DraftWorkspacePlaces } from "./use-workspace-places";
import { WorkspaceMenuItems } from "./workspace-menu-items";

interface RoomWorkbenchMenusProps {
	/** Dismiss the Workbench's mobile drawer after navigation. */
	onNavigate?: () => void;
	/** A new chat's own actions, until its first message. */
	draft?: DraftWorkspacePlaces;
}

/**
 * Supply Playground translations to the domain-independent Workbench menus.
 * The View menu lists the Workspace's places only when the rail is not on
 * screen to list them.
 */
export function RoomWorkbenchMenus({
	onNavigate,
	draft,
}: RoomWorkbenchMenusProps) {
	const { t } = useTranslation("sidebar");
	const room = useRoom();
	const hasRail = useContext(ConversationWorkspaceRailContext);
	return (
		<WorkbenchMenus
			translate={(key) => t(`workbench.${key}`)}
			textSize="xs"
			onNavigate={onNavigate}
			showNavigation={false}
			viewItems={
				hasRail ? undefined : (
					<WorkspaceMenuItems
						room={room}
						draft={draft}
						onNavigate={onNavigate}
					/>
				)
			}
		/>
	);
}
