import { SidebarContent, SidebarRail, useSidebar } from "@semoss/ui/next";
import type { Session } from "@/types/session";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";
import { SidebarRoomsList } from "./sidebar-rooms-list";

interface WorkspaceSidebarNavigationProps {
	sessions: Session[];
	roomId?: string;
	isLoading: boolean;
	onRoomPin: (roomId: string, pinned: boolean) => Promise<void>;
	onRoomRename: (roomId: string, name: string) => Promise<void>;
	onRoomDelete: (roomId: string) => Promise<void>;
	onRoomVisited: (roomId: string) => void;
}

/** Workspace navigation content shared by expanded and collapsed sidebars. */
export function WorkspaceSidebarNavigation({
	sessions,
	roomId,
	isLoading,
	onRoomPin,
	onRoomRename,
	onRoomDelete,
	onRoomVisited,
}: WorkspaceSidebarNavigationProps) {
	const { isMobile, state } = useSidebar();
	const condensed = !isMobile && state === "collapsed";

	return (
		<>
			<SidebarHeader condensed={condensed} />
			<SidebarContent className="px-3">
				<SidebarRoomsList
					sessions={sessions}
					activeRoomId={roomId}
					isLoading={isLoading}
					onRoomPin={(selectedRoomId, pinned) => {
						void onRoomPin(selectedRoomId, pinned);
					}}
					onRoomRename={onRoomRename}
					onRoomDelete={onRoomDelete}
					onRoomVisited={onRoomVisited}
				/>
			</SidebarContent>
			<SidebarFooter condensed={condensed} />
			<SidebarRail />
		</>
	);
}
