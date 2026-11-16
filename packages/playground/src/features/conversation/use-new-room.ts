import { type RefObject, useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import type { RoomStore } from "@/stores/room/room.store";

/** What {@link useNewRoom} returns. */
interface NewRoomPreparation {
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
 * @param submitted - Whether the first message was sent, so the room is kept.
 * @return The prepared room and how to prepare it.
 */
export function useNewRoom(
	draft: RoomStore,
	mode: "chat" | "agent",
	submitted: RefObject<boolean>,
): NewRoomPreparation {
	const { chat } = useChat();
	const [room, setRoom] = useState<RoomStore | null>(null);
	const [isPreparing, setIsPreparing] = useState(false);
	const [hasError, setHasError] = useState(false);
	const active = useRef(true);
	const prepared = useRef<RoomStore | null>(null);
	const pending = useRef<Promise<RoomStore | null> | null>(null);
	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
			if (prepared.current && !submitted.current) {
				void chat
					.closeRoom(prepared.current.roomId)
					.catch(console.error);
			}
		};
	}, [chat, submitted]);
	const prepare = (): Promise<RoomStore | null> => {
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
				if (!active.current) {
					await chat.closeRoom(next.roomId);
					return null;
				}
				next.restoreSidebarLayout(
					draft.workbench.getState().layout.actions.getSnapshot(),
				);
				prepared.current = next;
				setRoom(next);
				return next;
			} catch {
				if (active.current) setHasError(true);
				return null;
			} finally {
				pending.current = null;
				if (active.current) setIsPreparing(false);
			}
		})();
		return pending.current;
	};
	return { room, isPreparing, hasError, prepare };
}
