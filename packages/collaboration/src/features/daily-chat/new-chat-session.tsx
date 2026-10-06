import { useEffect, useState, useSyncExternalStore } from "react";
import { Navigate, useLocation } from "react-router";
import { WorkThread } from "@/features/collaboration/components/work-thread";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useWorkComposerSession } from "@/features/work-thread/work-composer-state.context";
import { threadPath } from "@/lib/workspace-paths";

interface NewChatSessionProps {
	/** Optional draft identity and prompt supplied by the Brief view. */
	navigationState: unknown;
}

/** Start one local chat and reuse the existing room transport on its first send. */
export function NewChatSession({ navigationState }: NewChatSessionProps) {
	const request =
		typeof navigationState === "object" && navigationState !== null
			? navigationState
			: {};
	const requestedId =
		"sessionId" in request && typeof request.sessionId === "string"
			? request.sessionId
			: "";
	const [sessionId] = useState(() =>
		/^session:[a-f0-9-]{36}$/.test(requestedId)
			? requestedId
			: `session:${crypto.randomUUID()}`,
	);
	const prompt =
		"prompt" in request && typeof request.prompt === "string"
			? request.prompt
			: "";
	const requestedTopicId =
		"topicId" in request && typeof request.topicId === "string"
			? request.topicId
			: "";
	const { state, dispatch } = useCollaborationSession();
	const topicId = state.topics.find(
		(topic) => topic.id === requestedTopicId && !topic.isSample,
	)?.id;
	const composer = useWorkComposerSession(sessionId);
	const { hasStartedChat } = useSyncExternalStore(
		composer.subscribe,
		composer.getSnapshot,
		composer.getSnapshot,
	);
	const location = useLocation();
	useEffect(() => {
		if (hasStartedChat) return;
		dispatch({ type: "session.create", sessionId });
		if (topicId)
			dispatch({
				type: "thread.link",
				threadId: sessionId,
				topicId,
				operation: "add",
			});
		if (prompt) composer.seedPrompt(prompt);
	}, [composer, dispatch, hasStartedChat, prompt, sessionId, topicId]);
	if (hasStartedChat)
		return (
			<Navigate
				to={{
					pathname: threadPath(sessionId),
					search: location.search,
					hash: location.hash,
				}}
				state={navigationState}
				replace
			/>
		);
	return (
		<WorkThread
			threadId={sessionId}
			isNewChat
			onSubmitStart={composer.startChat}
		/>
	);
}
