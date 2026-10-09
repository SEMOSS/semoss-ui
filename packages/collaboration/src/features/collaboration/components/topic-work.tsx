import { TopicWorkspace } from "@/features/topics/topic-workspace";

/** Preserve existing task and work topic routes through the shared topic landing. */
export function TopicWork({ topicId }: { topicId: string }) {
	return <TopicWorkspace key={topicId} topicId={topicId} />;
}
