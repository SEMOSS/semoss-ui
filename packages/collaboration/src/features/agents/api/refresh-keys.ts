export const agentListKey = "agents";

export function roomsKey(agentId: string) {
	return `rooms:${agentId}`;
}
