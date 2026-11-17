import { type RefObject, useEffect, useRef, useState } from "react";
import type { ChatMode } from "../../types";
import { useChatSession } from "../chat/provider/use-chat-session";
import type { RoomStore } from "../room/store/room.store";

/** What {@link useNewRoom} returns. */
export interface NewRoomPreparation {
	/** The prepared room, once there is one. */
	room: RoomStore | null;
	/** Whether the room is being prepared. */
	isPreparing: boolean;
	/** Whether the last preparation failed. */
	hasError: boolean;
	/** Prepares the room, once; later calls get the same room. */
	prepare: () => Promise<RoomStore | null>;
}

/**
 * Lazily prepares one file-capable room for a new chat, and disposes it when
 * the new chat is abandoned before its first message.
 *
 * @param draft - The new room holding the chat's options.
 * @param mode - The mode the prepared room starts in.
 * @param hasSubmitted - Whether the first message was sent, so the room is kept.
 * @returns The prepared room and how to prepare it.
 */
export function useNewRoom(
	draft: RoomStore,
	mode: ChatMode,
	hasSubmitted: RefObject<boolean>,
): NewRoomPreparation {
	const { chat } = useChatSession();
	const [room, setRoom] = useState<RoomStore | null>(null);
	const [isPreparing, setIsPreparing] = useState(false);
	const [hasError, setHasError] = useState(false);
	// Refs, not state: the cleanup and the async preparation read them after
	// the render that started them.
	const isMounted = useRef(true);
	const prepared = useRef<RoomStore | null>(null);
	const pending = useRef<Promise<RoomStore | null> | null>(null);
	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
			if (prepared.current && !hasSubmitted.current) {
				// folders attached to the room it is dropping are detached,
				// so nothing is kept for a room that is gone
				const localFolders = prepared.current.localFolders;
				for (const folder of localFolders?.folders ?? []) {
					void localFolders?.detach(folder.id).catch(console.error);
				}
				void chat
					.closeRoom(prepared.current.roomId)
					.catch(console.error);
			}
		};
	}, [chat, hasSubmitted]);
	const prepare = (): Promise<RoomStore | null> => {
		// Join the preparation in flight rather than creating a second room.
		if (prepared.current) return Promise.resolve(prepared.current);
		if (pending.current) return pending.current;
		setIsPreparing(true);
		setHasError(false);
		pending.current = (async () => {
			try {
				const next = await chat.createEmptyRoom(
					mode,
					"",
					{
						...draft.options,
						harnessType: mode === "agent" ? "semoss" : undefined,
					},
					draft.options.workspace?.workspace_id,
				);
				// The new chat was left while the room was being created.
				if (!isMounted.current) {
					await chat.closeRoom(next.roomId);
					return null;
				}
				// Carry over the draft's Workspace arrangement before it first mounts.
				next.restoreWorkbenchLayout(
					draft.workbench.getState().layout.actions.getSnapshot(),
				);
				prepared.current = next;
				setRoom(next);
				return next;
			} catch {
				if (isMounted.current) setHasError(true);
				return null;
			} finally {
				pending.current = null;
				if (isMounted.current) setIsPreparing(false);
			}
		})();
		return pending.current;
	};
	return { room, isPreparing, hasError, prepare };
}
