import type { AgentRunStatusValue } from "@semoss/sdk";
import type { Session } from "@/types/session";
import type { RoomRow } from "../api/room-schemas";

/** Map a durable agent-run status onto the status vocabulary the UI renders. */
export function sessionStatusFromRun(
	status: AgentRunStatusValue | null | undefined,
): Session["status"] {
	switch (status) {
		case "INPUT_REQUIRED":
			return "Your review";
		case "SUBMITTED":
		case "RUNNING":
			return "In progress";
		case "FAILED":
		case "CANCELLED":
			return "Stopped";
		default:
			return "Ready";
	}
}

/**
 * Map a `GetWorkspaceRooms` row onto the session shape the screens render.
 *
 * @param row - One room row.
 * @param agentId - Agent to attribute the room to when the row omits it.
 */
export function sessionFromRoom(row: RoomRow, agentId: string): Session {
	return {
		id: row.room_id,
		agentId: row.workspace_id ?? agentId,
		title: row.room_name?.trim() || "Untitled room",
		// TODO:: rooms carry no origin. Every room is attributed to the signed-in
		// user until the backend records how a room was started.
		origin: "You",
		// TODO:: GetWorkspaceRooms returns no run status, so a room reads as "Ready"
		// until it is opened - RoomPage corrects it from GetAgentRunsForRoom on
		// entry. Listing status for every room would need it on the room row, or a
		// per-room run call the list cannot afford.
		status: "Ready",
		updatedAt:
			row.date_updated ?? row.date_created ?? new Date().toISOString(),
		// TODO:: unread has no server field and is client-only, so it resets on
		// reload. Needs a per-user read marker on the backend.
		unread: false,
		// Older SEMOSS deployments omit this optional field from room rows.
		pinned: row.pinned ?? false,
		// TODO:: no message preview is returned with the room list. Would need the
		// latest message per room server-side rather than N extra calls.
		preview: "",
		thread: [],
	};
}

/**
 * A room created in this session, shaped for the UI before the server will list
 * it. `GetWorkspaceRooms` omits rooms with no messages, so a new room is only
 * visible locally until its first run writes one.
 *
 * @param roomId - The server-assigned room id.
 * @param agentId - The agent the room belongs to.
 * @param title - The room's title.
 */
export function pendingSession(
	roomId: string,
	agentId: string,
	title: string,
): Session {
	return {
		id: roomId,
		agentId,
		title,
		origin: "You",
		status: "Ready",
		updatedAt: new Date().toISOString(),
		unread: false,
		pinned: false,
		preview: "",
		thread: [],
	};
}
