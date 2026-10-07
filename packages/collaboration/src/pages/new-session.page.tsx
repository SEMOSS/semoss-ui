import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";

/** A source-free session starts locally; the first chat turn creates its saved room. */
export function NewSessionPage() {
	const [sessionId] = useState(() => `session:${crypto.randomUUID()}`);
	const { dispatch } = useCollaborationSession();
	const navigate = useNavigate();
	useEffect(() => {
		dispatch({ type: "session.create", sessionId });
		void navigate(`/work/thread/${encodeURIComponent(sessionId)}`, {
			replace: true,
		});
	}, [dispatch, navigate, sessionId]);
	return <output className="p-4">Opening new session…</output>;
}
