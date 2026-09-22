export function agentPath(agentId?: string) {
	return agentId ? `/agents/${encodeURIComponent(agentId)}` : "/agents";
}

export function roomPath(agentId: string, roomId: string, itemId?: string) {
	const path = `${agentPath(agentId)}/${encodeURIComponent(roomId)}`;
	return itemId ? `${path}?${new URLSearchParams({ item: itemId })}` : path;
}

/** A client-only room draft that has not created a backend room yet. */
export function draftRoomPath(
	agentId: string,
	draftId: string,
	modelId?: string,
) {
	const path = `${agentPath(agentId)}/new/${encodeURIComponent(draftId)}`;
	return modelId
		? `${path}?${new URLSearchParams({ model: modelId })}`
		: path;
}

export function agentNewPath() {
	return "/agents/new";
}

export function agentSettingsPath(agentId: string) {
	return `${agentPath(agentId)}/settings`;
}
