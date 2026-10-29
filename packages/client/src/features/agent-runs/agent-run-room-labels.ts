import type { AgentRunRoom } from "@/api/agent-runs";
import type { AgentRoomExportDetail } from "@/features/agent-activity/agent-room-markdown";

/** What a room's agent is called, its id when the catalog has no name */
export const agentRunRoomAgentLabel = (room: AgentRunRoom): string =>
	room.agentName ?? room.agentId ?? "No agent";

/** What a room's user is called, their id when they have no name */
export const agentRunRoomUserLabel = (room: AgentRunRoom): string =>
	room.userName ?? room.userId;

/**
 * Who and what a room belongs to, for its export's header: its user by name,
 * id and login type, and its agent by name and id.
 *
 * @param room - The room.
 * @returns The header's lines.
 */
export const agentRunRoomExportDetails = (
	room: AgentRunRoom,
): AgentRoomExportDetail[] => {
	const user = [room.userId, room.userType].filter(Boolean).join(", ");
	return [
		{ label: "User", value: `${agentRunRoomUserLabel(room)} (${user})` },
		{
			label: "Agent",
			value: room.agentId
				? `${agentRunRoomAgentLabel(room)} (${room.agentId})`
				: agentRunRoomAgentLabel(room),
		},
	];
};
