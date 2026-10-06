import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { P } from "@semoss/ui/next";
import { selectThreadContext } from "@/features/collaboration/state/collaboration.selectors";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import type { ConversationMessage } from "@/features/messages/types/message";
import { ThreadSession } from "@/features/thread-assistant/thread-session";
import { ToolWorkbenchProvider } from "@/features/tools/components/tool-workbench-provider";
import { UnifiedThread } from "@/features/work-thread/unified-thread";
import { useWorkComposerSession } from "@/features/work-thread/work-composer-state.context";
import { CHAT_WORKBENCH } from "@/features/work-thread/work-thread-panels";

const previewMessages: ConversationMessage[] = [
	{
		id: "preview-question",
		role: "user",
		parts: [
			{ type: "text", text: "Help me prepare for the renewal call." },
		],
	},
	{
		id: "preview-answer",
		role: "assistant",
		parts: [
			{
				type: "text",
				text: "Start with the customer’s priorities, then confirm the timeline and the decisions they need from us.\n\n- Review the open pricing questions with the account team.\n- Confirm who will own the architecture review.\n- Leave time to agree on next steps and follow-up dates.\n\nWould you like to work through the open questions?",
			},
		],
	},
];

/** Isolated visual fixture: renders the actual chat UI without initializing a backend room. */
export function DailyChatPreview() {
	const location = useLocation();
	const isNewChat = location.pathname === "/new";
	const visualState = new URLSearchParams(window.location.search).get(
		"chatState",
	);
	const navigationState: unknown = location.state;
	const requested =
		navigationState && typeof navigationState === "object"
			? navigationState
			: {};
	const sessionId =
		"sessionId" in requested &&
		typeof requested.sessionId === "string" &&
		requested.sessionId.startsWith("preview:")
			? requested.sessionId
			: `preview:${location.key}`;
	const prompt =
		"prompt" in requested && typeof requested.prompt === "string"
			? requested.prompt
			: "";
	const { state, dispatch } = useCollaborationSession();
	const composer = useWorkComposerSession(sessionId);
	const [hasRecovered, setHasRecovered] = useState(false);
	const session = useMemo(() => {
		const previewSession = new ThreadSession(sessionId);
		// Recovery in the fixture must not initialize an Insight or contact the backend.
		previewSession.reconnect = async () => {
			setHasRecovered(true);
		};
		return previewSession;
	}, [sessionId]);
	const snapshot = useMemo<ReturnType<ThreadSession["getSnapshot"]>>(() => {
		const initial = session.getSnapshot();
		const messages =
			visualState === "long"
				? Array.from({ length: 6 }, (_, index) =>
						previewMessages.map((message) => ({
							...message,
							id: `${message.id}-${index}`,
						})),
					).flat()
				: previewMessages;
		return {
			...initial,
			isReady: true,
			isLoading: visualState === "loading",
			error:
				visualState === "error" && !hasRecovered
					? new Error(
							"Unable to restore this conversation. Your draft is still available.",
						)
					: null,
			isLoadingModel: false,
			modelId: "",
			modelName: "Preview",
			turn: {
				...initial.turn,
				messages:
					isNewChat || visualState === "loading" ? [] : messages,
			},
		};
	}, [hasRecovered, isNewChat, session, visualState]);
	useEffect(() => {
		dispatch({ type: "session.create", sessionId });
		if (prompt) composer.seedPrompt(prompt);
	}, [composer, dispatch, prompt, sessionId]);
	const thread = state.threads.find(
		(candidate) => candidate.id === sessionId,
	);
	const context = selectThreadContext(state, sessionId);
	const workspace = state.workspaces[sessionId];
	if (!thread || !context || !workspace) return <P>Opening chat preview…</P>;
	return (
		<ToolWorkbenchProvider
			{...CHAT_WORKBENCH}
			defaultOpen={false}
			autoReveal={false}
			roomId=""
			insightId="fixture"
			tools={{}}
			pendingApprovals={[]}
			onApproveTool={async () => {
				throw new Error("Preview does not execute tools.");
			}}
			onRejectTool={async () => {
				throw new Error("Preview does not execute tools.");
			}}
		>
			<UnifiedThread
				isNewChat={isNewChat}
				thread={{
					...thread,
					subject:
						visualState === "long"
							? "Prepare for the Northwind renewal call and confirm architecture review ownership, pricing questions and next steps"
							: "Prepare for the renewal call",
				}}
				context={context}
				workspace={workspace}
				session={session}
				snapshot={snapshot}
				isSourceFreeSession
				userName={state.profile.name}
				header={null}
				inspector={null}
				attachments={[]}
			/>
		</ToolWorkbenchProvider>
	);
}
