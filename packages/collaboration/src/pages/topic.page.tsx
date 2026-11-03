import { useParams } from "react-router";
import { SavedRecordBoundary } from "@/features/collaboration/components/saved-record-boundary";
import { TopicDetail } from "@/features/collaboration/components/topic-detail";

/** Resets topic-local drafts when navigating to another topic. */
export function TopicPage() {
	const { topicId } = useParams();
	return topicId ? (
		<SavedRecordBoundary kind="topic" id={topicId}>
			<TopicDetail key={topicId} />
		</SavedRecordBoundary>
	) : null;
}
