import { useParams } from "react-router";
import { WorkThread } from "@/features/collaboration/components/work-thread";

/** Record identity isolates source-view drafts when navigating between threads. */
export function WorkThreadPage() {
	const { threadId } = useParams();
	return <WorkThread key={threadId} />;
}
