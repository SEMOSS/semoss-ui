import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { useRecordIds } from "@/features/collaboration/live/work-updates.context";
import {
	linkRoomTopic,
	listRoomTopics,
	type RoomTopic,
} from "./api/room-topics";

// Brain checks the chat a few seconds after each turn; read again while it catches up
const AFTER_TURN_READS_MS = [6000, 15000, 30000];

/** The chat's topics and the owner's change to them. */
export interface RoomTopicsState {
	/** Null until read, and for a chat that is not one of the owner's own. */
	topics: RoomTopic[] | null;
	/** Links a topic to the chat, or with remove, takes it off. */
	change: (topicId: string, remove: boolean) => Promise<void>;
}

/** Every topic the chat is linked to, in the server's order. */
export function linkedTopics(
	topics: RoomTopic[] | null | undefined,
): RoomTopic[] {
	return topics?.filter((topic) => topic.state === "linked") ?? [];
}

/** The chat's topics, read again after each turn so Brain's tags show up as the owner chats. */
export function useRoomTopics(
	roomId: string,
	isRunning: boolean,
): RoomTopicsState {
	const { actions } = useInsight();
	const { serverId } = useRecordIds();
	// kept by chat, so a slow answer for an earlier chat never shows in this one
	const [byRoom, setByRoom] = useState<Record<string, RoomTopic[] | null>>(
		{},
	);
	const wasRunning = useRef(isRunning);

	const refresh = useCallback(async () => {
		if (!actions || !roomId) return;
		try {
			const found = await listRoomTopics(actions, roomId);
			setByRoom((previous) => ({ ...previous, [roomId]: found }));
		} catch {
			// a failed re-read keeps what was known, so a network error does not take the topic away
			setByRoom((previous) =>
				previous[roomId] ? previous : { ...previous, [roomId]: null },
			);
		}
	}, [actions, roomId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	useEffect(() => {
		const finished = wasRunning.current && !isRunning;
		wasRunning.current = isRunning;
		if (!finished) return;
		const timers = AFTER_TURN_READS_MS.map((ms) =>
			setTimeout(() => void refresh(), ms),
		);
		return () => timers.forEach(clearTimeout);
	}, [isRunning, refresh]);

	const change = useCallback(
		async (topicId: string, remove: boolean) => {
			if (!actions) return;
			const linked = await linkRoomTopic(
				actions,
				roomId,
				await serverId(topicId),
				remove,
			);
			setByRoom((previous) => ({ ...previous, [roomId]: linked }));
		},
		[actions, roomId, serverId],
	);

	const topics = byRoom[roomId] ?? null;
	return useMemo(() => ({ topics, change }), [topics, change]);
}
