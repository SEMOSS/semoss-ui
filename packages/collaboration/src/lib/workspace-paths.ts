/** One topic workspace contains its actions, conversations, and context. */
export function topicPath(topicId: string): string {
	return `/topics/${encodeURIComponent(topicId)}`;
}

/** The full page for adding and removing a topic's emails, chats and files, opened on a place such as "chats". */
export function topicContentsPath(topicId: string, place?: string): string {
	const path = `${topicPath(topicId)}/contents`;
	return place ? `${path}?${new URLSearchParams({ in: place })}` : path;
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

/** Start a conversation from the overview before a backend room exists. */
export function newRoomPath(agentId?: string, modelId?: string) {
	const search = new URLSearchParams();
	if (agentId) search.set("agentId", agentId);
	if (modelId) search.set("model", modelId);

	const query = search.toString();
	return query ? `/?${query}` : "/";
}

/** The page that starts a chat with a Digital Twin, the signed-in person's own or one shared with them. */
export function twinChatPath(agentId: string): string {
	return `/twins/chat?${new URLSearchParams({ agentId })}`;
}

/** Manage a particular Digital Twin, optionally opening its People tab. */
export function twinSettingsPath(twinId: string, tab?: "people"): string {
	const search = new URLSearchParams({ twinId });
	if (tab) search.set("tab", tab);
	return `/twins/mine?${search}`;
}

/** What a Digital Twin knows. The optional id keeps older single-twin links working. */
export function twinContentsPath(place?: string, twinId?: string): string {
	const path = "/twins/mine/contents";
	const search = new URLSearchParams();
	if (twinId !== undefined) search.set("twinId", twinId);
	if (place) search.set("in", place);
	return search.size ? `${path}?${search}` : path;
}

/** Pages that open on the hero photo; the shell scrolls them together with its header so the photo runs behind it. */
export function isHeroPath(pathname: string): boolean {
	return ["/", "/work", "/work/review", "/work/topics"].includes(
		pathname.replace(/\/$/, "") || "/",
	);
}
