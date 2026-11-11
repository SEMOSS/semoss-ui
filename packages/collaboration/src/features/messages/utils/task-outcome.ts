import type { ConversationMessage } from "../types/message";

/** Whether durable outcome evidence has useful information to display. */
export function hasVisibleTaskOutcome(
	outcome: ConversationMessage["taskOutcome"],
): boolean {
	return (
		!!outcome &&
		(outcome.status !== "UNKNOWN" ||
			!!outcome.summary?.trim() ||
			!!outcome.actionRequired?.trim() ||
			!!outcome.limitations?.some((text) => text.trim()))
	);
}
