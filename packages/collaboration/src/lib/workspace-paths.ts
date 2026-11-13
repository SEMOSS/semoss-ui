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

/** The full page of what the owner's Digital Twin knows, opened on a place such as "outlook". */
export function twinContentsPath(place?: string): string {
	const path = "/twins/mine/contents";
	return place ? `${path}?${new URLSearchParams({ in: place })}` : path;
}

/** Pages that open on the hero photo; the shell scrolls them together with its header so the photo runs behind it. */
export function isHeroPath(pathname: string): boolean {
	return ["/", "/work", "/work/review", "/work/topics"].includes(
		pathname.replace(/\/$/, "") || "/",
	);
}
