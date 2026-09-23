export function agentPath(agentId?: string) {
	return agentId ? `/agents/${encodeURIComponent(agentId)}` : "/agents";
}

export function roomPath(agentId: string, roomId: string, itemId?: string) {
	const path = `${agentPath(agentId)}/${encodeURIComponent(roomId)}`;
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

export function agentNewPath() {
	return "/agents/new";
}

export function agentSettingsPath(agentId: string) {
	return `${agentPath(agentId)}/settings`;
}
