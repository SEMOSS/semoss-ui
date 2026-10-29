import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { type AgentRunRoom, parseAgentRunRooms } from "@/api/agent-runs";

export interface UseAgentRoomsResult {
	/** The page's rooms, most recently active first, as last read */
	rooms: AgentRunRoom[];
	/** How many rooms match, across every page */
	total: number;
	/** Whether the first page is being read, with nothing to show yet */
	isLoading: boolean;
	/** Whether the rooms are being read again while the last ones are shown */
	isRefreshing: boolean;
	/** Why the page could not be read, or null */
	error: string | null;
	/** Reads the page again */
	refresh: () => void;
}

/**
 * Reads one page of rooms with agent runs, using the SDK's cancellation and
 * backend-error handling. While a page is read again, the rooms last read stay
 * shown, so the list keeps its height and its scroll.
 *
 * @param pixel - The read of the page, such as from `buildAgentRunRoomsPixel`.
 * @returns The page's rooms and the total, and a way to read them again.
 */
export const useAgentRooms = (pixel: string): UseAgentRoomsResult => {
	const result = usePixel<unknown>(pixel, { data: null });
	// the SDK clears its data while it reads again
	const [lastRead, setLastRead] = useState<unknown>(null);
	if (result.status === "SUCCESS" && result.data !== lastRead) {
		setLastRead(result.data);
	}
	const shown = result.status === "SUCCESS" ? result.data : lastRead;
	const isReading =
		result.status === "INITIAL" || result.status === "LOADING";

	let rooms: AgentRunRoom[] = [];
	let total = 0;
	let error = result.error?.message ?? null;
	if (shown !== null) {
		try {
			({ rooms, total } = parseAgentRunRooms(shown));
		} catch (cause: unknown) {
			error =
				cause instanceof Error
					? cause.message
					: "Unable to read the agent runs.";
		}
	}
	return {
		rooms,
		total,
		isLoading: isReading && shown === null,
		isRefreshing: isReading && shown !== null,
		error,
		refresh: result.refresh,
	};
};
