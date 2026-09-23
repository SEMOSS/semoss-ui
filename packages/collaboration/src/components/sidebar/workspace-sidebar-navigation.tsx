import { SidebarContent, SidebarRail, useSidebar } from "@semoss/ui/next";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { SidebarAgentsList } from "./sidebar-agents-list";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";

interface WorkspaceSidebarNavigationProps {
	agents: Agent[];
	sessions: Session[];
	agentId?: string;
	roomId?: string;
	isLoading: boolean;
	onNewSession: (agentId?: string) => void;
	onRoomRename: (roomId: string, name: string) => Promise<void>;
	onRoomDelete: (roomId: string) => Promise<void>;
	onRoomVisited: (roomId: string) => void;
}

/** Workspace navigation content shared by expanded and collapsed sidebars. */
export function WorkspaceSidebarNavigation({
	agents,
	sessions,
	agentId,
	roomId,
	isLoading,
	onNewSession,
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
				<SidebarAgentsList
					agents={agents}
					sessions={sessions}
					activeAgentId={agentId}
					activeRoomId={roomId}
					isLoading={isLoading}
					onNewSession={onNewSession}
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
