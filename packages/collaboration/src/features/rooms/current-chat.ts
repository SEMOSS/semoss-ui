import { useEffect, useRef, useSyncExternalStore } from "react";
import { useNavigate } from "react-router";
import { toast } from "@semoss/ui/next";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { roomPath } from "@/lib/workspace-paths";
import { uploadRoomFiles } from "./api/upload-room-files";
import {
	getRoomSession,
	NEW_CHAT_TITLE,
	type RoomSession,
} from "./room-session";
import { loadSourceThread } from "./source-import/load-source-thread";
import { sourceThreadFile } from "./source-import/source-thread-file";

/** The chat the owner last had open, and whether it is on screen now. */
interface CurrentChat {
	session: RoomSession;
	isShown: boolean;
}

let current: CurrentChat | null = null;
const listeners = new Set<() => void>();
const publish = (next: CurrentChat): void => {
	current = next;
	for (const listener of listeners) listener();
};
const subscribe = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};
const getCurrentChat = (): CurrentChat | null => current;

/**
 * Make a chat on screen the one Brain and Work pages add to. It stays the
 * current chat after the owner leaves it, until another chat is shown.
 *
 * @param session - The shown chat; none while it has no session.
 */
export function useShowCurrentChat(session: RoomSession | undefined): void {
	useEffect(() => {
		if (!session) return;
		publish({ session, isShown: true });
		return () => {
			if (current?.session === session)
				publish({ session, isShown: false });
		};
	}, [session]);
}

/**
 * Save a Brain thread, or one of its emails, as a Markdown file in the chat's
 * room and queue it for the chat's next message. It is read under the same
 * rules as opening the thread in a room, so excluded mail never goes.
 *
 * @param chat - The chat to add to; a draft gets its room first.
 * @param getState - The collaboration state the thread is read with.
 * @param threadId - The thread.
 * @param messageId - One email of it; the whole thread when absent.
 * @returns The chat's room id.
 * @throws Error when the thread or email cannot be read or saved.
 */
export async function addThreadToChat(
	chat: RoomSession,
	getState: () => CollaborationState,
	threadId: string,
	messageId?: string,
): Promise<string> {
	const savedRoomId = chat.getSnapshot().roomId;
	// an idle room may have been evicted since; the registry has its live session
	const session = savedRoomId
		? getRoomSession(chat.scope, savedRoomId)
		: chat;
	const release = session.retain();
	try {
		await session.initialize();
		// a draft's files only reach its room once the room exists
		const roomId = await session.create(session.getSnapshot().title);
		const document = await loadSourceThread(
			session.insight.actions,
			getState,
			threadId,
		);
		const email = document.messages.find(
			(message) => message.id === messageId,
		);
		if (messageId && !email)
			throw new Error("This email is not available to the assistant.");
		const [file] = await uploadRoomFiles(session.insight.insightId, [
			sourceThreadFile(
				email
					? {
							...document,
							thread: {
								...document.thread,
								subject:
									email.subject || document.thread.subject,
							},
							messages: [email],
						}
					: document,
			),
		]);
		session.addContextFile(file);
		return roomId;
	} finally {
		release();
	}
}

/** What {@link useAddToCurrentChat} returns while there is a current chat. */
export interface AddToCurrentChat {
	/** The action's label, naming the chat, such as `Add to “Q3 plan”`. */
	label: string;
	/** Add a thread, or one of its emails, and report how it went in a toast. */
	add: (threadId: string, messageId?: string) => void;
}

/**
 * Add Brain threads and emails to the current chat's next message.
 *
 * @returns The action, or null before the owner has opened any chat.
 */
export function useAddToCurrentChat(): AddToCurrentChat | null {
	const chat = useSyncExternalStore(
		subscribe,
		getCurrentChat,
		getCurrentChat,
	);
	const { state } = useCollaborationSession();
	const stateRef = useRef(state);
	stateRef.current = state;
	const navigate = useNavigate();
	if (!chat) return null;
	const title = chat.session.getSnapshot().title;
	const name = title === NEW_CHAT_TITLE ? "new chat" : `“${title}”`;
	return {
		label: `Add to ${name}`,
		add: (threadId, messageId) => {
			const id = toast.loading(`Adding to ${name}…`);
			addThreadToChat(
				chat.session,
				() => stateRef.current,
				threadId,
				messageId,
			).then(
				(roomId) =>
					toast.success(`Added to ${name}`, {
						id,
						description: "It goes with your next message.",
						// on screen, the chip in its composer already shows it
						action: chat.isShown
							? undefined
							: {
									label: "Open",
									onClick: () =>
										void navigate(roomPath(roomId)),
								},
					}),
				(cause: unknown) =>
					toast.error(
						cause instanceof Error
							? cause.message
							: "This could not be added to the chat.",
						{ id },
					),
			);
		},
	};
}
