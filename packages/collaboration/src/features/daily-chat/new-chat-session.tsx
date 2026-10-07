import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import type {
	ComposerSubmission,
	RoomSettings,
} from "@/features/rooms/types/room";
import { roomPath } from "@/lib/workspace-paths";
import { getNewChatDraft } from "./new-chat-drafts";
import { NewChatWorkbenchProvider } from "./new-chat-workbench-provider";
import { NewChatWorkspace } from "./new-chat-workspace";

interface NewChatSessionProps {
	/** Optional local draft identity and editable prompt supplied by Brief. */
	navigationState: unknown;
}

/** Keep draft input local until the first send creates its ordinary room. */
export function NewChatSession({ navigationState }: NewChatSessionProps) {
	const request =
		typeof navigationState === "object" && navigationState !== null
			? navigationState
			: {};
	const requestedId =
		"sessionId" in request && typeof request.sessionId === "string"
			? request.sessionId
			: "";
	const [draftId] = useState(() =>
		/^[a-f0-9-]{36}$/.test(requestedId) ? requestedId : crypto.randomUUID(),
	);
	const prompt =
		"prompt" in request && typeof request.prompt === "string"
			? request.prompt
			: "";
	const requestedTopicId =
		"topicId" in request && typeof request.topicId === "string"
			? request.topicId
			: "";
	const { insightId: scope } = useInsight();
	const { state } = useCollaborationSession();
	const location = useLocation();
	const draft = useMemo(
		() => getNewChatDraft(scope, draftId, prompt, location.search),
		[scope, draftId, prompt, location.search],
	);
	const { session } = draft;
	const snapshot = useSyncExternalStore(
		session.subscribe,
		session.getSnapshot,
		session.getSnapshot,
	);
	const navigate = useNavigate();
	const active = useRef(true);
	const [agentError, setAgentError] = useState("");
	const topicId = state.topics.find(
		(topic) => topic.id === requestedTopicId && !topic.isSample,
	)?.id;
	const initialize = useCallback(async (): Promise<void> => {
		try {
			await draft.initialize();
		} catch (cause) {
			if (active.current)
				setAgentError(
					cause instanceof Error
						? cause.message
						: "Could not apply the requested chat settings.",
				);
		}
	}, [draft]);
	useEffect(() => {
		active.current = true;
		const release = session.retain();
		void initialize();
		return () => {
			active.current = false;
			release();
		};
	}, [initialize, session]);
	useEffect(() => {
		if (draft.startedRoomId)
			void navigate(
				{
					pathname: roomPath(draft.startedRoomId),
					search: location.search,
					hash: location.hash,
				},
				{ replace: true },
			);
	}, [draft, location.hash, location.search, navigate]);

	const handleSend = async (
		submission: ComposerSubmission,
	): Promise<void> => {
		const release = session.retain();
		try {
			const roomId = await session.create("New chat");
			const sending = session.send(submission);
			draft.startedRoomId = roomId;
			if (active.current) {
				void navigate(roomPath(roomId), { replace: true });
			}
			await sending;
		} finally {
			release();
		}
	};
	const handleSaveSettings = (values: RoomSettings): Promise<void> =>
		session.saveSettings("New chat", {
			...session.getSnapshot().settings,
			...values,
			modelId: values.modelId ?? session.getSnapshot().modelId,
			temperature: values.temperature ?? null,
		});
	const handleAgentChange = async (agentId: string): Promise<void> => {
		setAgentError("");
		try {
			await session.saveSettings("New chat", {
				...session.getSnapshot().settings,
				agentId,
			});
		} catch (cause) {
			if (active.current)
				setAgentError(
					cause instanceof Error
						? cause.message
						: "Could not select this agent.",
				);
		}
	};
	return (
		<NewChatWorkbenchProvider
			session={session}
			snapshot={snapshot}
			onSaveSettings={handleSaveSettings}
		>
			<NewChatWorkspace
				draftId={draftId}
				session={session}
				snapshot={snapshot}
				userName={(state.liveProfile ?? state.profile).name}
				topicId={topicId}
				agentError={agentError}
				onInitialize={initialize}
				onSend={handleSend}
				onSaveSettings={handleSaveSettings}
				onSelectAgent={handleAgentChange}
			/>
		</NewChatWorkbenchProvider>
	);
}
