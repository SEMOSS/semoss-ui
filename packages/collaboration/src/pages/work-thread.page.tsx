import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button, P, Spinner } from "@semoss/ui/next";
import { useCollaborationResource } from "@/features/collaboration/live/work-updates.context";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { createSourceImportAttempt } from "@/features/rooms/source-import/source-import-attempt";
import { roomPath } from "@/lib/workspace-paths";

/** A source route imports its snapshot and hands the conversation to the room. */
export function WorkThreadPage() {
	const { threadId = "" } = useParams();
	const { actions, insightId } = useInsight();
	const { state } = useCollaborationSession();
	const related = state.items.find((item) => item.threadId === threadId);
	const topicId = related?.linkTopicId || related?.topicIds[0];
	const metadata = useCollaborationResource(
		topicId ? `topic-context:${topicId}` : "threads",
		!threadId.startsWith("connected:") &&
			!state.threads.some((thread) => thread.id === threadId),
	);
	const location = useLocation();
	const navigate = useNavigate();
	const currentState = useRef(state);
	currentState.current = state;
	const visitId = location.key;
	const attempt = useMemo(() => {
		// A new history entry is a new click, even when its source id is unchanged.
		void visitId;
		return createSourceImportAttempt(
			insightId,
			threadId,
			actions,
			() => currentState.current,
		);
	}, [insightId, threadId, actions, visitId]);
	const snapshot = useSyncExternalStore(
		attempt.subscribe,
		attempt.getSnapshot,
		attempt.getSnapshot,
	);
	const activeAttempt = useRef<typeof attempt | null>(null);
	const open = useCallback(async () => {
		const result = await attempt.start();
		if (result && activeAttempt.current === attempt) {
			activeAttempt.current = null;
			await navigate(roomPath(result.roomId), { replace: true });
		}
	}, [attempt, navigate]);
	useEffect(() => {
		if (metadata.isLoading || metadata.error) return;
		activeAttempt.current = attempt;
		const release = attempt.retain();
		void open();
		return () => {
			if (activeAttempt.current === attempt) activeAttempt.current = null;
			release();
		};
	}, [attempt, open, metadata.isLoading, metadata.error]);
	const progress =
		snapshot.phase === "loading-source"
			? "Loading thread…"
			: snapshot.phase === "creating-room"
				? "Opening room…"
				: "Saving thread to room files…";
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto p-6">
			{snapshot.error || metadata.error ? (
				<>
					<Alert variant="destructive">
						<AlertDescription>
							{snapshot.error || metadata.error}
						</AlertDescription>
					</Alert>
					<Button
						type="button"
						variant="outline"
						className="min-h-11 self-start"
						onClick={() => {
							if (metadata.error) metadata.refresh();
							else void open();
						}}
					>
						Retry opening thread
					</Button>
				</>
			) : (
				<P>
					<output className="flex items-center gap-2">
						<Spinner aria-hidden="true" />
						{progress}
					</output>
				</P>
			)}
		</div>
	);
}
