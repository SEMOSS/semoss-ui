import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import { pixel } from "@/lib/pixel";
import { roomOptionsEnvelopeSchema } from "./room-schemas";

interface RoomWorkspaceIdResult {
	workspaceId: string;
	isLoading: boolean;
	error: Error | null;
	refresh: () => void;
}

/** Resolve a room's persisted workspace for room-first routes. */
export function useRoomWorkspaceId(
	roomId: string,
	enabled: boolean,
): RoomWorkspaceIdResult {
	const query = usePixel<unknown>(
		roomId && enabled ? pixel("GetRoomOptions", { roomId }) : "",
	);
	const parsed = useMemo(() => {
		if (!enabled || query.data == null) {
			return { workspaceId: "", validationError: null };
		}

		const result = roomOptionsEnvelopeSchema.safeParse(query.data);
		if (!result.success) {
			return {
				workspaceId: "",
				validationError: new Error(
					"SEMOSS returned invalid room options.",
				),
			};
		}

		return {
			workspaceId: result.data.OPTIONS.workspace?.workspace_id ?? "",
			validationError: null,
		};
	}, [enabled, query.data]);

	return {
		workspaceId: parsed.workspaceId,
		isLoading:
			enabled &&
			(query.status === "INITIAL" || query.status === "LOADING"),
		error: query.error ?? parsed.validationError,
		refresh: query.refresh,
	};
}
