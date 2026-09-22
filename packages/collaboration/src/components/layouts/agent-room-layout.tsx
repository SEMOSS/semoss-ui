import { type CSSProperties, useCallback, useId } from "react";
import { Outlet, useNavigate, useParams, useSearchParams } from "react-router";
import {
	Sidebar,
	SidebarProvider,
	SidebarRail,
	useSidebar,
} from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { RoomProvider } from "@/app/room.context";
import { AgentRoomsList } from "@/features/agents/components/agent-rooms-list";
import { draftRoomPath } from "@/lib/workspace-paths";

function AgentRoomSidebar({
	agentId,
	roomId,
}: {
	agentId: string;
	roomId?: string;
}) {
	const workspace = useMain();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const sidebarId = useId();
	const { isMobile, setOpenMobile, state } = useSidebar();
	const collapsed = state === "collapsed";
	const selectRoom = useCallback(
		(selectedRoomId: string) => {
			workspace.openRoom(selectedRoomId);
			if (isMobile) setOpenMobile(false);
		},
		[isMobile, setOpenMobile, workspace],
	);
	const currentModelId = roomId
		? workspace.sessions.find((session) => session.id === roomId)?.modelId
		: searchParams.get("model") || undefined;
	const newRoom = useCallback(() => {
		navigate(draftRoomPath(agentId, crypto.randomUUID(), currentModelId));
		if (isMobile) setOpenMobile(false);
	}, [agentId, currentModelId, isMobile, navigate, setOpenMobile]);

	return (
		<Sidebar
			id={sidebarId}
			data-slot="room-sidebar"
			data-collapsed={collapsed}
			aria-label="Sessions"
			collapsible="icon"
			inline
			className="group/room-sidebar bg-muted/40"
		>
			<div data-slot="room-sidebar-content" className="size-full">
				<AgentRoomsList
					agentId={agentId}
					collapsed={collapsed}
					sessions={workspace.sessions}
					selectedRoomId={roomId}
					onSelectRoom={selectRoom}
					onNewRoom={newRoom}
				/>
			</div>
			<SidebarRail
				data-slot="room-sidebar-separator"
				aria-label={
					collapsed
						? "Expand sessions sidebar"
						: "Collapse sessions sidebar"
				}
				title={
					collapsed
						? "Expand sessions sidebar"
						: "Collapse sessions sidebar"
				}
				aria-controls={sidebarId}
			/>
		</Sidebar>
	);
}

function AgentRoomContent({
	agentId,
	roomId,
	draftId,
}: {
	agentId: string;
	roomId?: string;
	draftId?: string;
}) {
	const { toggleSidebar } = useSidebar();

	return (
		<>
			<AgentRoomSidebar agentId={agentId} roomId={roomId} />
			<RoomProvider value={{ openRoomsList: toggleSidebar }}>
				<Outlet key={roomId ?? draftId} />
			</RoomProvider>
		</>
	);
}

/**
 * Frames an agent's rooms: a collapsible room list beside the selected room, a
 * drawer on small screens, and the room context its descendants use to reopen
 * that drawer.
 */
export function AgentRoomLayout() {
	const { agentId = "", roomId, draftId } = useParams();

	return (
		<SidebarProvider
			className="h-full min-h-0 flex-1 overflow-hidden"
			style={
				{
					"--sidebar-width": "16.25rem",
					"--sidebar-width-icon": "4rem",
				} as CSSProperties
			}
		>
			<AgentRoomContent
				agentId={agentId}
				roomId={roomId}
				draftId={draftId}
			/>
		</SidebarProvider>
	);
}
