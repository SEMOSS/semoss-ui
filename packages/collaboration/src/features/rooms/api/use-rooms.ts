import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { toError } from "@semoss/utility";
import type { Session } from "@/types/session";
import { sessionFromRoom } from "../utils/session-from-room";
import { listRooms } from "./list-rooms";

/** Load playground rooms, retaining listed-agent rooms and unassigned rooms. */
export function useRooms(
	agentIds: string[],
	versions: Record<string, number> = {},
) {
	const { actions } = useInsight();
	const [sessions, setSessions] = useState<Session[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [reloadToken, setReloadToken] = useState(0);
	const pendingRooms = useRef<Map<string, Session>>(new Map());

	const agentKey = agentIds.join(",");
	const versionKey = agentIds
		.map((agentId) => `${agentId}:${versions[agentId] ?? 0}`)
		.join(",");

	useEffect(() => {
		void reloadToken;
		void versionKey;
		const ids = agentKey ? agentKey.split(",") : [];
		let cancelled = false;

		setIsLoading(true);
		const workspaceIds = new Set(ids);
		listRooms(actions)
			.then((rooms) => {
				if (cancelled) return;
				const fetched = rooms
					.filter(
						(room) =>
							room.workspaceId === undefined ||
							workspaceIds.has(room.workspaceId),
					)
					.map(sessionFromRoom);
				const fetchedIds = new Set(
					fetched.map((session) => session.id),
				);
				for (const id of fetchedIds) pendingRooms.current.delete(id);

				setSessions(
					[...fetched, ...pendingRooms.current.values()].sort(
						(left, right) =>
							right.updatedAt.localeCompare(left.updatedAt),
					),
				);
				setError(null);
			})
			.catch((cause: unknown) => {
				if (!cancelled) setError(toError(cause));
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [actions, agentKey, reloadToken, versionKey]);

	const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

	/** Keep a new room visible until its first durable message is listed. */
	const addPendingRoom = useCallback((session: Session) => {
		pendingRooms.current.set(session.id, session);
		setSessions((current) => [
			session,
			...current.filter((item) => item.id !== session.id),
		]);
	}, []);

	/** Update both the visible list and any locally retained pending room. */
	const updateRoom = useCallback(
		(id: string, changes: Partial<Session>): void => {
			const pendingRoom = pendingRooms.current.get(id);
			if (pendingRoom) {
				pendingRooms.current.set(id, { ...pendingRoom, ...changes });
			}
			setSessions((current) =>
				current.map((session) =>
					session.id === id ? { ...session, ...changes } : session,
				),
			);
		},
		[],
	);

	/** Remove a room from both the visible list and the pending-room cache. */
	const removeRoom = useCallback((id: string): void => {
		pendingRooms.current.delete(id);
		setSessions((current) =>
			current.filter((session) => session.id !== id),
		);
	}, []);

	return {
		sessions,
		setSessions,
		isLoading,
		error,
		refresh,
		addPendingRoom,
		updateRoom,
		removeRoom,
	};
}
