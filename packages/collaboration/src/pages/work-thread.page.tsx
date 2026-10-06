import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Button } from "@semoss/ui/next";
import { WorkThread } from "@/features/collaboration/components/work-thread";
import { importSourceCommand } from "@/features/collaboration/import-source";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { restoreSourceThread } from "@/features/dashboard/restore-source-thread";

/** Record identity isolates source-view drafts when navigating between threads. */
export function WorkThreadPage() {
	const { threadId } = useParams();
	const { actions } = useInsight();
	const { state, dispatch } = useCollaborationSession();
	const isMissingSource = Boolean(
		threadId?.startsWith("connected:") &&
			!state.threads.some((thread) => thread.id === threadId),
	);
	const [error, setError] = useState("");
	const [revision, setRevision] = useState(0);
	useEffect(() => {
		void revision;
		if (!threadId || !isMissingSource) return;
		let cancelled = false;
		setError("");
		void restoreSourceThread(actions, threadId)
			.then((source) => {
				if (!cancelled) {
					if (source) dispatch(importSourceCommand(source));
					else setError("This source cannot be restored.");
				}
			})
			.catch((cause: unknown) => {
				if (!cancelled)
					setError(
						cause instanceof Error
							? cause.message
							: "Could not restore the source.",
					);
			});
		return () => {
			cancelled = true;
		};
	}, [actions, threadId, isMissingSource, dispatch, revision]);
	if (isMissingSource)
		return (
			<div className="space-y-3 p-6 text-sm">
				<p>{error || "Restoring this conversation’s source…"}</p>
				{error && (
					<Button
						variant="outline"
						onClick={() => setRevision((value) => value + 1)}
					>
						Retry
					</Button>
				)}
			</div>
		);
	return <WorkThread key={threadId} />;
}
