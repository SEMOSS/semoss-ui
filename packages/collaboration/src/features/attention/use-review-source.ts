import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import {
	loadSourceThread,
	type SourceThreadDocument,
} from "@/features/rooms/source-import/load-source-thread";

interface ReviewSource {
	document: SourceThreadDocument | null;
	error: string;
	isLoading: boolean;
	retry: () => void;
}

/** Read permitted source text only; no room creation, uploads, or agent requests. */
export function useReviewSource(
	threadId: string | null | undefined,
): ReviewSource {
	const { actions } = useInsight();
	const { state } = useCollaborationSession();
	const latest = useRef(state);
	latest.current = state;
	const [revision, setRevision] = useState(0);
	const [result, setResult] = useState<Omit<ReviewSource, "retry">>({
		document: null,
		error: "",
		isLoading: true,
	});
	useEffect(() => {
		void revision;
		if (!threadId) {
			setResult({ document: null, error: "", isLoading: false });
			return;
		}
		let active = true;
		setResult({ document: null, error: "", isLoading: true });
		void loadSourceThread(
			actions,
			() => latest.current,
			threadId,
			() => {
				if (!active) throw new Error("Review closed");
			},
		)
			.then((document) => {
				if (active)
					setResult({ document, error: "", isLoading: false });
			})
			.catch((cause: unknown) => {
				if (active)
					setResult({
						document: null,
						error:
							cause instanceof Error
								? cause.message
								: "Could not read this source.",
						isLoading: false,
					});
			});
		return () => {
			active = false;
		};
	}, [actions, threadId, revision]);
	return { ...result, retry: () => setRevision((value) => value + 1) };
}
