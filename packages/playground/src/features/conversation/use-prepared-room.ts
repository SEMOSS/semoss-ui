import { type RefObject, useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import type { RoomStore } from "@/stores/room/room.store";

interface PreparedRoom {
	room: RoomStore | null;
	isPreparing: boolean;
	hasError: boolean;
	prepare: () => Promise<RoomStore | null>;
}

/** Lazily prepares one file-capable room and disposes abandoned drafts. */
export function usePreparedRoom(
	draft: RoomStore,
	mode: "chat" | "agent",
	submitted: RefObject<boolean>,
): PreparedRoom {
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
