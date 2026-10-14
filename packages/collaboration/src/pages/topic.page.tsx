import { useParams } from "react-router";
import { TopicDetail } from "@/features/collaboration/components/topic-detail";

/** Resets topic-local drafts when navigating to another topic. */
export function TopicPage() {
	const { topicId } = useParams();
	return <TopicDetail key={topicId} />;
}
