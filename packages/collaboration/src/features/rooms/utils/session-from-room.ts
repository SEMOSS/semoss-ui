import type { Session } from "@/types/session";
import type { RoomRow } from "../api/room-schemas";

/** Map a playground turn phase onto the room-list vocabulary. */
export function sessionStatusFromPhase(
	phase:
		| "streaming"
		| "executing_tools"
		| "awaiting_approval"
		| "cancelling"
		| "completed"
		| "failed"
		| null
		| undefined,
): Session["status"] {
	switch (phase) {
		case "awaiting_approval":
			return "Your review";
		case "streaming":
		case "executing_tools":
		case "cancelling":
			return "In progress";
		case "failed":
			return "Stopped";
		default:
			return "Ready";
	}
}

/** Map one normalized `GetPlaygroundRooms` row onto a UI session. */
export function sessionFromRoom(row: RoomRow): Session {
	return {
		id: row.roomId,
		agentId: row.workspaceId ?? "",
		modelId: row.modelId,
		title: row.roomName?.trim() || "Untitled room",
		origin: "You",
		status: "Ready",
		updatedAt:
			row.dateUpdated ?? row.dateCreated ?? new Date().toISOString(),
		unread: false,
		pinned: row.pinned ?? false,
		preview: "",
	};
}

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
