import { PersonIdentity } from "@semoss/shared";
import { AgentRoomDetailLine } from "@/features/agent-activity/agent-room-detail-line";
import type { AgentRoomColumn } from "@/features/agent-activity/agent-room-table";
import {
	agentRunRoomAgentLabel,
	agentRunRoomUserLabel,
} from "./agent-run-room-labels";

/**
 * The admin list's columns after the room: its agent, with its id under its
 * name, and its user with the shared `PersonIdentity`.
 */
export const AGENT_RUN_ROOM_COLUMNS: AgentRoomColumn[] = [
	{
		header: "Agent",
		className: "max-w-56",
		cell: (room) => {
			const agentLabel = agentRunRoomAgentLabel(room);
			return (
				<span className="flex min-w-0 flex-col">
					<span className="truncate text-sm" title={agentLabel}>
						{agentLabel}
					</span>
					{room.agentId ? (
						<AgentRoomDetailLine title={`id: ${room.agentId}`}>
							id: {room.agentId}
						</AgentRoomDetailLine>
					) : null}
				</span>
			);
		},
	},
	{
		header: "User",
		className: "max-w-64",
		cell: (room) => (
			<PersonIdentity
				name={agentRunRoomUserLabel(room)}
				type={room.userType ?? ""}
				id={room.userId}
				email={room.userEmail}
				isCompact
			/>
		),
	},
];
