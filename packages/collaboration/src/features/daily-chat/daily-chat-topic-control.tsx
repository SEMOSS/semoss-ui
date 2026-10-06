import type { Thread } from "@/features/collaboration/state/collaboration.types";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { BriefTopicFilter } from "@/features/dashboard/brief-topic-filter";

interface DailyChatTopicControlProps {
	/** Source-free conversation whose topic supplies the next turn's context. */
	thread: Thread;
	/** Scope cannot change while the current request is being submitted or restored. */
	disabled: boolean;
}

/** Apply the selected topic through the existing collaboration context commands. */
export function DailyChatTopicControl({
	thread,
	disabled,
}: DailyChatTopicControlProps) {
	const collaboration = useOptionalCollaborationSession();
	if (!collaboration) return null;
	const topicId = thread.topicLinks.find(
		(link) => link.primary && link.source !== "suggested",
	)?.topicId;
	return (
		<BriefTopicFilter
			value={topicId ?? ""}
			compact
			isSample={thread.isSample}
			disabled={disabled}
			onChange={(nextTopicId) => {
				const nextTopic = collaboration.state.topics.find(
					(topic) =>
						topic.id === nextTopicId &&
						topic.isSample === thread.isSample,
				);
				if (disabled || (nextTopicId && !nextTopic)) return;
				for (const link of thread.topicLinks) {
					if (link.topicId !== nextTopicId)
						collaboration.dispatch({
							type: "thread.link",
							threadId: thread.id,
							topicId: link.topicId,
							operation: "remove",
						});
				}
				if (nextTopic)
					collaboration.dispatch({
						type: "thread.link",
						threadId: thread.id,
						topicId: nextTopic.id,
						operation: "primary",
					});
			}}
		/>
	);
}
