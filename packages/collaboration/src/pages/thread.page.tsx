import { useParams } from "react-router";
import { SavedRecordBoundary } from "@/features/collaboration/components/saved-record-boundary";
import { NotFoundPage } from "@/pages/not-found.page";
import { RoomPage } from "@/pages/room.page";
import { WorkThreadPage } from "@/pages/work-thread.page";

/** Opens Work threads and direct room conversations at one canonical route. */
export function ThreadPage() {
	const { threadId } = useParams();
	if (!threadId) return <NotFoundPage />;
	if (!threadId.startsWith("room:"))
		return (
			<SavedRecordBoundary kind="thread" id={threadId}>
				<WorkThreadPage />
			</SavedRecordBoundary>
		);
	const roomId = threadId.slice("room:".length);
	if (!roomId) return <NotFoundPage />;
	return <RoomPage key={roomId} roomId={roomId} />;
}
