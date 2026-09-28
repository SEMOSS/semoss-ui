/** Identity of the person or agent that sent the original message. */
export interface ActivitySender {
	id: string;
	name: string;
	type: "human" | "agent";
}

/** Display data for an activity item; absent message metadata stays unknown. */
export interface ActivityLogEntry {
	/** Stable UI identity, including for room summaries without an activity ID. */
	key: string;
	/** Message/action record ID, distinct from the linked room's ID. */
	id: string | null;
	topic: string;
	preview: string;
	source: "Room" | "Email" | "Scheduled" | "Calendar" | "Webhook";
	sender: ActivitySender | null;
	/** The processing agent, distinct from the original sender. */
	agent: { id: string; name: string } | null;
	receivedAt: string | null;
	updatedAt: string | null;
	threadId: string | null;
	processedAt: string | null;
	/** Unknown until a tracking service supplies this state. */
	isHibernating: boolean | null;
	isDeleted: boolean | null;
	/** May be absent for collected messages that have not been linked to a room. */
	roomId: string | null;
	status:
		| "needs-response"
		| "needs-review"
		| "needs-attention"
		| "in-progress"
		| "recorded"
		| "completed";
}
