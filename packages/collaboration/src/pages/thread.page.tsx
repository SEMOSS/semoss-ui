import { useParams } from "react-router";
import { AgentLayout } from "@/components/layouts/agent-layout";
import { LegacyRoomLayout } from "@/features/collaboration/components/legacy-room-layout";
import { NotFoundPage } from "@/pages/not-found.page";
import { RoomPage } from "@/pages/room.page";
import { WorkThreadPage } from "@/pages/work-thread.page";

/** Opens Work threads and direct room conversations at one canonical route. */
export function ThreadPage() {
	const { threadId } = useParams();
	if (!threadId) return <NotFoundPage />;
	if (!threadId.startsWith("room:")) return <WorkThreadPage />;
	const roomId = threadId.slice("room:".length);
	if (!roomId) return <NotFoundPage />;
	return (
		<LegacyRoomLayout key={roomId}>
			<AgentLayout roomId={roomId}>
				<RoomPage roomId={roomId} />
			</AgentLayout>
		</LegacyRoomLayout>
	);
}
