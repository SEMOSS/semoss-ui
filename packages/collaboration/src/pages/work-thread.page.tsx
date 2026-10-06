import { useParams } from "react-router";
import { SavedRecordBoundary } from "@/features/collaboration/components/saved-record-boundary";
import { WorkThread } from "@/features/collaboration/components/work-thread";

/** Record identity isolates source-view drafts when navigating between threads. */
export function WorkThreadPage() {
	const { threadId } = useParams();
	return threadId ? (
		<SavedRecordBoundary kind="thread" id={threadId}>
			<WorkThread key={threadId} />
		</SavedRecordBoundary>
	) : null;
}
