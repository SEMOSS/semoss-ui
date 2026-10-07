/** Canonical conversation route; identity stays independent of its backend room. */
export function threadPath(threadId: string): string {
	return `/thread/${encodeURIComponent(threadId)}`;
}

/** Namespace direct rooms so they cannot be mistaken for Work thread identities. */
export function roomPath(roomId: string, itemId?: string): string {
	const path = threadPath(`room:${roomId}`);
	return itemId ? `${path}?${new URLSearchParams({ item: itemId })}` : path;
}

/** Start a conversation from the overview before a backend room exists. */
export function newRoomPath(agentId?: string, modelId?: string) {
	const search = new URLSearchParams();
	if (agentId) search.set("agentId", agentId);
	if (modelId) search.set("model", modelId);

	const query = search.toString();
	return query ? `/?${query}` : "/";
}

/** Lists all sessions, optionally filtered to one agent. */
export function sessionsPath(agentId?: string) {
	if (!agentId) return "/room";
	return `/room?${new URLSearchParams({ agentId })}`;
}
