import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
	readThreadActionRequest,
	type ThreadActionRequest,
} from "./thread-action-request";
import type { WorkComposerSession } from "./work-composer-session";

/** Consume the request before execution so history, remounts, and retries cannot submit twice. */
export function useThreadActionRequest(
	threadId: string,
	composer: WorkComposerSession,
	isReady: boolean,
	onAction: (request: ThreadActionRequest) => void,
	isAssistantReady = isReady,
): void {
	const location = useLocation();
	const navigate = useNavigate();
	useEffect(() => {
		const request = readThreadActionRequest(location.state, threadId);
		if (
			!request ||
			!isReady ||
			(request.action === "draft" && !isAssistantReady)
		)
			return;
		const state = { ...location.state };
		delete state.threadAction;
		void navigate(
			{
				pathname: location.pathname,
				search: location.search,
				hash: location.hash,
			},
			{ replace: true, state },
		);
		if (composer.claimAction(request.id)) onAction(request);
	}, [
		composer,
		isReady,
		isAssistantReady,
		location,
		navigate,
		onAction,
		threadId,
	]);
}
