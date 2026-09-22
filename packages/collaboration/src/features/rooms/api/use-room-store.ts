import { useEffect, useRef, useState } from "react";
import { getRoomOptions, RoomStore } from "@semoss/sdk";
import { toError } from "@/lib/pixel";

/**
 * Build the `RoomStore` backing an existing room.
 *
 * `RoomStore`'s constructor takes the room's current options rather than
 * fetching them itself, so this loads them once per `roomId` and recreates the
 * store whenever the room changes.
 *
 * @param insightId - The active insight.
 * @param roomId - The room to load, or empty when none is selected yet.
 */
export function useRoomStore(insightId: string, roomId: string) {
	const [room, setRoom] = useState<RoomStore | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const roomRef = useRef(roomId);

	useEffect(() => {
		roomRef.current = roomId;
		if (!roomId) {
			setRoom(null);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setRoom(null);
		setIsLoading(true);
		setError(null);

		getRoomOptions(insightId, roomId)
			.then((options) => {
				if (cancelled || roomRef.current !== roomId) return;
				setRoom(new RoomStore(roomId, insightId, options));
			})
			.catch((cause: unknown) => {
				if (cancelled || roomRef.current !== roomId) return;
				setError(toError(cause));
			})
			.finally(() => {
				if (!cancelled && roomRef.current === roomId)
					setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [insightId, roomId]);

	return { room, isLoading, error };
}
