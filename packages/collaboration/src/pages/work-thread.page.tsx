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
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { createSourceImportAttempt } from "@/features/rooms/source-import/source-import-attempt";
import { roomPath } from "@/lib/workspace-paths";

/** A source route imports its snapshot and hands the conversation to the room. */
export function WorkThreadPage() {
	const { threadId = "" } = useParams();
	const { actions, insightId } = useInsight();
	const { state } = useCollaborationSession();
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
		activeAttempt.current = attempt;
		const release = attempt.retain();
		void open();
		return () => {
			if (activeAttempt.current === attempt) activeAttempt.current = null;
			release();
		};
	}, [attempt, open]);
	const progress =
		snapshot.phase === "loading-source"
			? "Loading thread…"
			: snapshot.phase === "creating-room"
				? "Opening room…"
				: "Saving thread to room files…";
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-auto p-6">
			{snapshot.error ? (
				<>
					<Alert variant="destructive">
						<AlertDescription>{snapshot.error}</AlertDescription>
					</Alert>
					<Button
						type="button"
						variant="outline"
						className="min-h-11 self-start"
						onClick={() => void open()}
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
