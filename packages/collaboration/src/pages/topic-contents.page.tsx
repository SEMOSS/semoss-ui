import { useParams } from "react-router";
import { SavedRecordBoundary } from "@/features/collaboration/components/saved-record-boundary";
import { TopicContents } from "@/features/topic-contents/topic-contents";

/** The full-screen page for adding and removing a topic's emails and chats; fresh for each topic. */
export function TopicContentsPage() {
	const { topicId } = useParams();
	return topicId ? (
		<SavedRecordBoundary kind="topic" id={topicId}>
			<TopicContents key={topicId} />
		</SavedRecordBoundary>
	) : null;
}
