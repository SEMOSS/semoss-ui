import type { Session } from "@/types/session";
/** Shape a just-created room before it has its first durable message. */
export function pendingSession(
	roomId: string,
	agentId: string,
	title: string,
	modelId?: string,
): Session {
	return {
		id: roomId,
		agentId,
		modelId,
		title,
		origin: "You",
		status: "Ready",
		updatedAt: new Date().toISOString(),
		unread: false,
		pinned: false,
		preview: "",
	};
}
