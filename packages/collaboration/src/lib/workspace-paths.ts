function agentPath(agentId?: string) {
	return agentId ? `/agents/${encodeURIComponent(agentId)}` : "/agents";
}

/** Canonical conversation route; identity stays independent of its backend room. */
export function threadPath(threadId: string): string {
	return `/thread/${encodeURIComponent(threadId)}`;
}

/** Namespace direct rooms so they cannot be mistaken for Work thread identities. */
export function roomPath(roomId: string, itemId?: string): string {
	const path = threadPath(`room:${roomId}`);
	return itemId ? `${path}?${new URLSearchParams({ item: itemId })}` : path;
}

/** Focused first-message route before a backend room exists. */
export function newRoomPath(agentId?: string, modelId?: string) {
	const search = new URLSearchParams();
	if (agentId) search.set("agentId", agentId);
	if (modelId) search.set("model", modelId);

	const query = search.toString();
	return query ? `/new?${query}` : "/new";
}

export function agentSettingsPath(agentId: string) {
	return `${agentPath(agentId)}/settings`;
}

/** Lists all sessions, optionally filtered to one agent. */
export function sessionsPath(agentId?: string) {
	if (!agentId) return "/room";
	return `/room?${new URLSearchParams({ agentId })}`;
}
