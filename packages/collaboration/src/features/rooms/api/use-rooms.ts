import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { toError } from "@/lib/pixel";
import type { Session } from "@/types/session";
import { sessionFromRoom } from "../utils/session-from-room";
import { listRooms } from "./list-rooms";

/**
 * Load rooms for every listed agent.
 *
 * TODO:: there is no cross-agent room reactor scoped to a workspace set, so this
 * fans out one GetWorkspaceRooms call per agent. Replace with a single reactor
 * if the agent list grows beyond a handful.
 *
 * @param agentIds - Agents whose rooms to load.
 * @returns `sessions` sorted newest first, `setSessions` for local edits such as
 * marking a room read, `isLoading`, `error` (set only when every agent failed),
 * `refresh`, and `addPendingRoom` for a room the server will not list yet.
 */
export function useRooms(
	agentIds: string[],
	versions: Record<string, number> = {},
) {
	const { actions } = useInsight();
	const [sessions, setSessions] = useState<Session[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	// Rooms created in this session that the server will not list until their
	// first run writes a message. Kept across refetches so they do not vanish.
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

		if (ids.length === 0) {
			setSessions([...pendingRooms.current.values()]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		// allSettled, not all: one agent the user cannot read would otherwise reject
		// the whole batch and blank every room in the app.
		Promise.allSettled(
			ids.map(async (agentId) => {
				const { rooms } = await listRooms(actions, agentId);
				return rooms.map((room) => sessionFromRoom(room, agentId));
			}),
		)
			.then((outcomes) => {
				if (cancelled) return;

				const fetched = outcomes
					.filter((outcome) => outcome.status === "fulfilled")
					.flatMap((outcome) => outcome.value);
				const failures = outcomes.filter(
					(outcome) => outcome.status === "rejected",
				);

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

				// Every agent failed - that is a real outage, not one unreadable agent.
				setError(
					failures.length === outcomes.length && outcomes.length > 0
						? toError(failures[0].reason)
						: null,
				);
			})
			.catch((cause: unknown) => {
				if (cancelled) return;
				setError(toError(cause));
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [actions, agentKey, reloadToken, versionKey]);

	const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

	/** Show a just-created room before the server will list it. */
	const addPendingRoom = useCallback((session: Session) => {
		pendingRooms.current.set(session.id, session);
		setSessions((current) => [session, ...current]);
	}, []);

	return { sessions, setSessions, isLoading, error, refresh, addPendingRoom };
}
