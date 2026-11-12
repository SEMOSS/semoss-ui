import { threadNeedsTopic } from "@/features/collaboration/state/collaboration.selectors";
import type { Thread } from "@/features/collaboration/state/collaboration.types";

/** A way to list the conversations Brain has read: the topic's own, the unfiled ones, Teams chats, or all. */
export type ThreadView = "topic" | "unfiled" | "teams" | "all";

/** Whether a thread is in the topic, by any link, an open suggestion included. */
export function isInTopic(thread: Thread, topicId: string): boolean {
	return thread.topicLinks.some((link) => link.topicId === topicId);
}

/** Whether a view lists the thread. Unfiled leaves out automated and ignored mail: it is not worth filing. */
export function isInThreadView(
	view: ThreadView,
	thread: Thread,
	topicId: string,
): boolean {
	if (view === "topic") return isInTopic(thread, topicId);
	if (view === "teams") return thread.channel === "teams";
	if (view === "unfiled")
		return (
			threadNeedsTopic(thread) &&
			!isInTopic(thread, topicId) &&
			!thread.muted &&
			!thread.automated
		);
	return true;
}
