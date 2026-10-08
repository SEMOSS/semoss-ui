import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import type {
	ComposerSubmission,
	RoomSettings,
} from "@/features/rooms/types/room";
import { roomPath } from "@/lib/workspace-paths";
import {
	getHistoryChatDraft,
	getNewChatDraftVersion,
	markNewChatDraftStarted,
	subscribeNewChatDrafts,
} from "./new-chat-drafts";

export interface NewChatController {
	draftId: string;
	session: RoomSession;
	snapshot: RoomSessionSnapshot;
	agentError: string;
	onInitialize: () => Promise<void>;
	onSend: (submission: ComposerSubmission) => Promise<void>;
	onSaveSettings: (settings: RoomSettings) => Promise<void>;
	onSelectAgent: (agentId: string) => Promise<void>;
}

/** Own the overview draft and its first-send transaction. */
export function useNewChatController(
	navigationState: unknown,
): NewChatController {
	const request =
		typeof navigationState === "object" && navigationState !== null
			? navigationState
			: {};
	const requestedId =
		"sessionId" in request && typeof request.sessionId === "string"
			? request.sessionId
			: "";
	const prompt =
		"prompt" in request && typeof request.prompt === "string"
			? request.prompt
			: "";
	const { insightId: scope } = useInsight();
	const location = useLocation();
	const navigate = useNavigate();
	// Allocation can finish after returning to this same history entry. Observe the
	// shared handoff instead of retaining a consumed draft in a route-local memo.
	useSyncExternalStore(
		subscribeNewChatDrafts,
		getNewChatDraftVersion,
		getNewChatDraftVersion,
	);
	const draft = getHistoryChatDraft(
		scope,
		location.key,
		true,
		requestedId,
		prompt,
		location.search,
	);
	const { session } = draft;
	const snapshot = useSyncExternalStore(
		session.subscribe,
		session.getSnapshot,
		session.getSnapshot,
	);
	// Each route entry has its own lifetime token, so late work cannot navigate a later entry.
	const entryToken = `${scope}:${draft.id}:${location.key}`;
	const active = useRef<string | null>(null);
	const [agentError, setAgentError] = useState("");
	const initialize = useCallback(async (): Promise<void> => {
		setAgentError("");
		try {
			await draft.initialize();
		} catch (cause) {
			if (active.current === entryToken)
				setAgentError(
					cause instanceof Error
						? cause.message
						: "Could not apply the requested chat settings.",
				);
		}
	}, [draft, entryToken]);
	useEffect(() => {
		active.current = entryToken;
		const release = session.retain();
		void initialize();
		return () => {
			active.current = null;
			release();
		};
	}, [entryToken, initialize, session]);
	const handleSend = (submission: ComposerSubmission): Promise<void> => {
		if (draft.pendingSubmission) return draft.pendingSubmission;
		const release = session.retain();
		const sending = (async () => {
			const roomId = await session.create("New chat");
			const submitted = session.send(submission);
			if (active.current === entryToken) void navigate(roomPath(roomId));
			markNewChatDraftStarted(scope, draft, roomId);
			await submitted;
		})().finally(() => {
			draft.pendingSubmission = null;
			release();
		});
		draft.pendingSubmission = sending;
		return sending;
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
			if (active.current === entryToken)
				setAgentError(
					cause instanceof Error
						? cause.message
						: "Could not select this agent.",
				);
		}
	};
	return {
		draftId: draft.id,
		session,
		snapshot,
		agentError,
		onInitialize: initialize,
		onSend: handleSend,
		onSaveSettings: handleSaveSettings,
		onSelectAgent: handleAgentChange,
	};
}
