import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { toError } from "@semoss/utility";
import { callPixel, pixel } from "@/lib/pixel";
import {
	type PlaygroundRoomOptions,
	roomOptionsEnvelopeSchema,
	roomWriteSchema,
} from "./room-schemas";

/** Collaboration-local room contract for playground transport. */
export interface PlaygroundRoom {
	roomId: string;
	insightId: string;
	name?: string;
	options: PlaygroundRoomOptions;
	updateOptions: (options: Partial<PlaygroundRoomOptions>) => Promise<void>;
}

/** Load the real `GetRoomOptions` envelope and bind the room to the insight. */
export function useRoomStore(insightId: string, roomId: string) {
	const { actions } = useInsight();
	const [room, setRoom] = useState<PlaygroundRoom | null>(null);
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

		(async () => {
			const envelope = await callPixel(
				actions,
				pixel("GetRoomOptions", { roomId }),
				roomOptionsEnvelopeSchema,
			);
			const bound = await callPixel(
				actions,
				pixel("SetRoomForInsight", { roomId }),
				roomWriteSchema,
			);
			if (!bound) {
				throw new Error(
					"SEMOSS did not bind the room to this insight.",
				);
			}
			if (cancelled || roomRef.current !== roomId) return;

			let currentOptions = envelope.OPTIONS;
			const loadedRoom: PlaygroundRoom = {
				roomId,
				insightId,
				name: envelope.ROOM_NAME ?? undefined,
				get options() {
					return currentOptions;
				},
				updateOptions: async (changes) => {
					const nextOptions = { ...currentOptions, ...changes };
					const updated = await callPixel(
						actions,
						pixel("UpdateRoomOptions", {
							roomId,
							roomOptions: [nextOptions],
						}),
						roomWriteSchema,
					);
					if (!updated) {
						throw new Error(
							"SEMOSS did not save the room options.",
						);
					}
					currentOptions = nextOptions;
				},
			};
			setRoom(loadedRoom);
		})()
			.catch((cause: unknown) => {
				if (!cancelled && roomRef.current === roomId) {
					setError(toError(cause));
				}
			})
			.finally(() => {
				if (!cancelled && roomRef.current === roomId) {
					setIsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [actions, insightId, roomId]);

	return { room, isLoading, error };
}
