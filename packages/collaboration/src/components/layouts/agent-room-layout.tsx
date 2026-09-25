import { useCallback } from "react";
import { Outlet, useParams } from "react-router";
import { useSidebar } from "@semoss/ui/next";
import { RoomProvider } from "@/app/room.context";

/** Connects room routes to the single workspace sidebar owned by MainLayout. */
export function AgentRoomLayout() {
	const { roomId, draftId } = useParams();
	const { isMobile, setOpen, setOpenMobile } = useSidebar();
	const openRoomsList = useCallback(() => {
		if (isMobile) setOpenMobile(true);
		else setOpen(true);
	}, [isMobile, setOpen, setOpenMobile]);

	return (
		<RoomProvider value={{ openRoomsList }}>
			<Outlet key={roomId ?? draftId} />
		</RoomProvider>
	);
}
