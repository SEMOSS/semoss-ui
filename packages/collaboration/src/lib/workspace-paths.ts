export function agentPath(agentId?: string) {
	return agentId ? `/agents/${encodeURIComponent(agentId)}` : "/agents";
}

export function roomPath(agentId: string, roomId: string, itemId?: string) {
	const path = `${agentPath(agentId)}/${encodeURIComponent(roomId)}`;
	return itemId ? `${path}?${new URLSearchParams({ item: itemId })}` : path;
}

export function agentNewPath() {
	return "/agents/new";
}

export function agentSettingsPath(agentId: string) {
	return `${agentPath(agentId)}/settings`;
}
