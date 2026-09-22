import { Plus } from "lucide-react";
import { Navigate, useParams } from "react-router";
import { Button } from "@semoss/ui/next";
import { useAgent } from "@/app/agent.context";
import { useMain } from "@/app/main.context";
import { EmptyView } from "@/components/common/empty-view";
import { selectMostRecentRoom } from "@/features/rooms/utils/select-most-recent-room";
import { roomPath } from "@/lib/workspace-paths";
import { NotFoundPage } from "@/pages/not-found.page";

export function AgentIndex() {
	const { agent } = useAgent();
	const { sessions, newRoom } = useMain();
	const { agentId } = useParams();

	if (!agentId) return <NotFoundPage title="Agent not found" />;

	const latestRoom = selectMostRecentRoom(sessions, agentId);

	if (latestRoom) {
		return <Navigate replace to={roomPath(agentId, latestRoom.id)} />;
	}

	return (
		<EmptyView
			title={`No rooms for ${agent.name}`}
			action={
				<Button onClick={() => newRoom(agentId)}>
					<Plus />
					New room
				</Button>
			}
		>
			Start a room to work with this agent.
		</EmptyView>
	);
}
