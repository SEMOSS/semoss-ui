import { type ReactNode, useCallback, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { MainProvider } from "@/app/main.context";
import { RoomProvider } from "@/app/room.context";
import { useSaveAgent } from "@/features/agents/api/use-save-agent";
import { pinRoom } from "@/features/rooms/api/pin-room";
import { useRooms } from "@/features/rooms/api/use-rooms";
import { roomPath } from "@/lib/workspace-paths";

interface LegacyRoomLayoutProps {
	/** Direct room content, or the nested route when omitted. */
	children?: ReactNode;
}

/** Supplies existing room behavior inside the shared conversation route. */
export function LegacyRoomLayout({ children }: LegacyRoomLayoutProps = {}) {
	const { actions } = useInsight();
	const navigate = useNavigate();
	const [keys, setKeys] = useState<Record<string, number>>({});
	const rooms = useRooms([]);
	const refresh = useCallback(
		(key: string) =>
			setKeys((current) => ({
				...current,
				[key]: (current[key] ?? 0) + 1,
			})),
		[],
	);
	const saveAgent = useSaveAgent({
		actions,
		agents: [],
		onSaved: rooms.refresh,
	});
	const openRoomsList = useCallback(() => navigate("/work"), [navigate]);
	return (
		<MainProvider
			value={{
				keys,
				refresh,
				agents: [],
				sessions: rooms.sessions,
				setSessions: rooms.setSessions,
				addPendingRoom: rooms.addPendingRoom,
				updateRoom: rooms.updateRoom,
				trackGeneratedRoomName: rooms.refresh,
				pinRoom: async (id, pinned) => {
					const saved = await pinRoom(actions, id, pinned);
					if (!saved)
						throw new Error("The room pin could not be saved.");
					rooms.updateRoom(id, { pinned });
				},
				saveAgent,
				openRoom: (id) => navigate(roomPath(id)),
				newRoom: () => navigate("/work"),
			}}
		>
			<RoomProvider value={{ openRoomsList }}>
				<div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/15">
					{children ?? <Outlet />}
				</div>
			</RoomProvider>
		</MainProvider>
	);
}
