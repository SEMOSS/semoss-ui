import { useMemo } from "react";
import type { RefreshKeys } from "@/app/refresh-keys";
import { useRooms } from "@/features/rooms/api/use-rooms";
import { agentListKey, roomsKey } from "./refresh-keys";
import { useAgents } from "./use-agents";

/** Loads the aggregate data needed by a single workspace-level view. */
export function useWorkspaceData(keys: RefreshKeys) {
	const agentsQuery = useAgents(keys[agentListKey] ?? 0);
	const agentIds = useMemo(
		() => agentsQuery.agents.map((agent) => agent.id),
		[agentsQuery.agents],
	);
	const roomVersions = useMemo(
		() =>
			Object.fromEntries(
				agentIds.map((agentId) => [
					agentId,
					keys[roomsKey(agentId)] ?? 0,
				]),
			),
		[agentIds, keys],
	);
	const roomsQuery = useRooms(agentIds, roomVersions);

	return {
		agents: agentsQuery.agents,
		sessions: roomsQuery.sessions,
		setSessions: roomsQuery.setSessions,
		addPendingRoom: roomsQuery.addPendingRoom,
		updateRoom: roomsQuery.updateRoom,
		removeRoom: roomsQuery.removeRoom,
		isLoading: agentsQuery.isLoading || roomsQuery.isLoading,
		error: agentsQuery.error ?? roomsQuery.error,
	};
}
