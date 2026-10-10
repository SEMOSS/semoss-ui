import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";
import { Alert, AlertDescription, toast } from "@semoss/ui/next";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import type { AgentTurnSnapshot } from "@/features/rooms/api/agent-turn-controller";
import { roomWorkbenchTriggerId } from "@/features/rooms/room-workbench-trigger-id";
import type { RoomSource } from "@/features/rooms/source-import/room-source";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { RoomEmailContext, type RoomEmailSession } from "./room-email.context";
import { ROOM_EMAIL_PANEL_TYPE } from "./room-email-panel";
import { ROOM_EMAIL_SOURCE_PANEL_TYPE } from "./room-email-source-panel";
import { getRoomEmailStore } from "./room-email-store";
import { ROOM_TEAMS_SOURCE_PANEL_TYPE } from "./room-teams-source-panel";
import { useEmailSendApprovals } from "./use-email-send-approvals";
import { useRoomEmailProposals } from "./use-room-email-proposals";
import { useRoomSourceEmails } from "./use-room-source-emails";

interface RoomEmailProviderProps {
	/** The one retained ordinary-room owner; this provider creates no chat transport. */
	session: RoomEmailSession;
	roomId: string;
	source: RoomSource | null;
	turn: AgentTurnSnapshot;
	isReady: boolean;
	children: ReactNode;
}

/** Read source email and retain draft tools under the ordinary room owner. */
export function RoomEmailProvider({
	session,
	roomId,
	source,
	turn,
	isReady,
	children,
}: RoomEmailProviderProps) {
	const store = getRoomEmailStore(session);
	// Refresh consumers when a completed tool adds a retained editor.
	useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
	const workbench = useToolWorkbench();
	const { openWorkbench } = workbench;
	const sourceEmails = useRoomSourceEmails(session, source, isReady);
	const hasSourceEmail = Boolean(
		source?.channel === "email" &&
			(source.kind === "brain" || source.kind === "outlook") &&
			source.messages.length,
	);
	const hasSourceChat = Boolean(
		source?.channel === "teams" &&
			(source.kind === "brain" || source.kind === "teams") &&
			source.messages.length,
	);
	const thread = useMemo(
		(): Pick<Thread, "id" | "subject" | "source"> => ({
			id: source?.threadId ?? roomId,
			subject: source?.title ?? "Email",
			...(source?.channel === "email" && source.kind !== "sample"
				? {
						source: {
							kind: "outlook" as const,
							nativeId: source.messages.some(
								(message) => message.id === source.nativeId,
							)
								? (source.nativeId ?? "")
								: (source.messages.at(-1)?.id ?? ""),
						},
					}
				: {}),
		}),
		[roomId, source],
	);
	const allowedSources = useMemo(
		() => new Set(source?.messages.map((message) => message.id) ?? []),
		[source],
	);
	const openDraftRef = useRef<((draftId: string) => void) | null>(null);
	const error = useRoomEmailProposals({
		thread,
		composer: store,
		snapshot: { turn },
		allowedSources,
		isReady,
		loadAttachment: session.readEmailAttachment,
		// openDraft is declared below; the ref reads it when a run finishes
		onOpen: (draftId) => openDraftRef.current?.(draftId),
	});
	useEmailSendApprovals(store, workbench);
	const openSource = useCallback(
		(returnFocusId?: string): void => {
			if (!hasSourceEmail && !hasSourceChat) return;
			workbench.store
				.getState()
				.layout.actions.selectPanel(
					hasSourceEmail
						? ROOM_EMAIL_SOURCE_PANEL_TYPE
						: ROOM_TEAMS_SOURCE_PANEL_TYPE,
					{},
					{ name: hasSourceEmail ? "Email" : "Teams chat" },
				);
			openWorkbench(undefined, returnFocusId);
		},
		[hasSourceChat, hasSourceEmail, openWorkbench, workbench.store],
	);
	const openedSourceOwner = useRef<RoomEmailSession | null>(null);
	useEffect(() => {
		if (
			!isReady ||
			(!hasSourceEmail && !hasSourceChat) ||
			openedSourceOwner.current === session
		)
			return;
		openedSourceOwner.current = session;
		openSource(roomWorkbenchTriggerId(roomId));
	}, [hasSourceChat, hasSourceEmail, isReady, openSource, roomId, session]);
	const openDraft = useCallback(
		(draftId: string): void => {
			const draft = store
				.getSnapshot()
				.emailDrafts.find((item) => item.seed.id === draftId);
			if (!draft) {
				toast.error("This email draft is not available yet.");
				return;
			}
			store.requestEmailDraft(draft.seed);
			workbench.store.getState().layout.actions.selectPanel(
				ROOM_EMAIL_PANEL_TYPE,
				{ draftId },
				{
					name:
						draft.seed.mode === "reply"
							? "Reply draft"
							: draft.seed.mode === "forward"
								? "Forward draft"
								: "Email draft",
				},
			);
			openWorkbench();
		},
		[openWorkbench, store, workbench.store],
	);
	openDraftRef.current = openDraft;
	const selectSourceMessage = useCallback(
		(messageId: string): void => {
			if (
				allowedSources.has(messageId) &&
				sourceEmails.sourceMessages.some(
					(message) => message.id === messageId && !message.excluded,
				)
			)
				store.selectSourceMessage(messageId);
		},
		[allowedSources, sourceEmails.sourceMessages, store],
	);
	useEffect(() => {
		const selected = store.getSelectedSourceMessage();
		if (
			selected &&
			(!allowedSources.has(selected) ||
				!sourceEmails.sourceMessages.some(
					(message) => message.id === selected && !message.excluded,
				))
		)
			store.selectSourceMessage(undefined);
	}, [allowedSources, sourceEmails.sourceMessages, store]);
	const replyToSource = useCallback(
		(messageId: string): void => {
			const message = sourceEmails.sourceMessages.find(
				(item) => item.id === messageId && !item.excluded,
			);
			if (
				!hasSourceEmail ||
				!allowedSources.has(messageId) ||
				!message ||
				sourceEmails.isSourceLoading ||
				sourceEmails.sourceError
			) {
				toast.error(
					"This email is not available to reply to. Reload the email and try again.",
				);
				return;
			}
			const draft = store.requestEmailDraft({
				id: JSON.stringify(["source-reply", roomId, messageId]),
				mode: "reply",
				sourceUid: messageId,
				subject: message.subject || source?.title || "",
				body: "",
			});
			store.selectSourceMessage(messageId);
			openDraft(draft.seed.id);
		},
		[
			allowedSources,
			hasSourceEmail,
			openDraft,
			roomId,
			source?.title,
			sourceEmails,
			store,
		],
	);
	return (
		<RoomEmailContext.Provider
			value={{
				store,
				session,
				source,
				...sourceEmails,
				hasSourceEmail,
				hasSourceChat,
				openSource,
				selectSourceMessage,
				replyToSource,
				openDraft,
				requestSend: (draft) => {
					openDraft(draft.seed.id);
					draft.requestSubmit();
				},
			}}
		>
			{error && (
				<Alert variant="destructive" className="m-3">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{children}
		</RoomEmailContext.Provider>
	);
}
