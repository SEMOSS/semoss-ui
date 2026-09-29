import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { readThreadWorkbenchRequest } from "./thread-workbench-request";

/** Reveal a thread's existing dock once, then remove the request from history. */
export function useThreadWorkbenchRequest(
	threadId: string,
	onOpen: () => void,
): void {
	const location = useLocation();
	const navigate = useNavigate();
	const handled = useRef<string | null>(null);
	useEffect(() => {
		const state: unknown = location.state;
		const request = readThreadWorkbenchRequest(state, threadId);
		if (
			!request ||
			!state ||
			typeof state !== "object" ||
			handled.current === request.id
		)
			return;
		handled.current = request.id;
		onOpen();
		const next: Record<string, unknown> = { ...state };
		delete next.threadWorkbench;
		void navigate(
			{
				pathname: location.pathname,
				search: location.search,
				hash: location.hash,
			},
			{ replace: true, state: next },
		);
	}, [location, threadId, onOpen, navigate]);
}
