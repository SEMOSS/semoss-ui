import { useLocation, useParams } from "react-router";
import { TopicWork } from "@/features/collaboration/components/topic-work";
import { WorkFeed } from "@/features/collaboration/components/work-feed";
import { WorkTopics } from "@/features/collaboration/components/work-topics";

/** Separate topic discovery, focused topic work, and the complete action list. */
export function WorkPage() {
	const { topicId } = useParams();
	const { pathname } = useLocation();
	const path = pathname.replace(/\/$/, "");
	if (topicId) return <TopicWork key={topicId} topicId={topicId} />;
	if (path === "/work") return <WorkTopics />;
	const initialFilter = path.endsWith("/waiting")
		? "waiting"
		: path.endsWith("/done")
			? "done"
			: "needs_me";
	return <WorkFeed initialFilter={initialFilter} />;
}
