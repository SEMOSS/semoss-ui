import { AppCatalogAvatar, PersonIdentity } from "@semoss/shared";
import type { AgentRunRoom } from "@/api/agent-runs";
import { AgentRoomDetailLine } from "@/features/agent-activity/agent-room-detail-line";
import type { AgentRoomSummaryItem } from "@/features/agent-activity/agent-room-summary";
import {
	agentRunRoomAgentLabel,
	agentRunRoomUserLabel,
} from "./agent-run-room-labels";

/**
 * Who a room on the admin page belongs to, for its summary: its user with the
 * shared `PersonIdentity`, and its agent with its image and id.
 *
 * @param room - The room.
 * @returns The summary's User and Agent.
 */
export const agentRunRoomSummaryItems = (
	room: AgentRunRoom,
): AgentRoomSummaryItem[] => {
	const agentLabel = agentRunRoomAgentLabel(room);
	return [
		{
			label: "User",
			value: (
				<PersonIdentity
					name={agentRunRoomUserLabel(room)}
					type={room.userType ?? ""}
					id={room.userId}
					email={room.userEmail}
				/>
			),
		},
		{
			label: "Agent",
			value: (
				<span className="flex min-w-0 items-center gap-2.5">
					<AppCatalogAvatar
						projectId={room.agentId ?? undefined}
						name={agentLabel}
						className="size-8 shrink-0 rounded-md text-xs"
					/>
					<span className="flex min-w-0 flex-col">
						<span
							className="truncate font-medium text-sm"
							title={agentLabel}
						>
							{agentLabel}
						</span>
						{room.agentId ? (
							<AgentRoomDetailLine title={`id: ${room.agentId}`}>
								id: {room.agentId}
							</AgentRoomDetailLine>
						) : null}
					</span>
				</span>
			),
		},
	];
};
