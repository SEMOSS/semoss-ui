import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/**
 * One row from `GetAgentRunsForRoom`. Agent-run payloads are camelCase, unlike
 * the snake_case workspace payloads.
 */
const runRowSchema = z.object({
	runId: z.string(),
	roomId: z.string().nullish(),
	status: z.string().nullish(),
	finalText: z.string().nullish(),
	errorMessage: z.string().nullish(),
	dateCreated: z.string().nullish(),
});

/** `GetAgentRunsForRoom` answers with a bare vector of run maps. */
const roomRunsSchema = z.array(runRowSchema);

/** One durable agent run belonging to a room. */
export type RoomRun = z.infer<typeof runRowSchema>;

const TERMINAL = ["COMPLETED", "FAILED", "CANCELLED"];

/** True while a run is still doing work or waiting on a human decision. */
export function isLiveRun(run: RoomRun) {
	return !TERMINAL.includes((run.status ?? "").toUpperCase());
}

/**
 * List the top-level agent runs for a room, newest first.
 *
 * The reactor already filters out subagent runs and strips the owner's user id.
 *
 * @param actions - `actions` from `useInsight()`.
 * @param roomId - The room whose runs to list.
 */
export async function listRoomRuns(
	actions: InsightActions,
	roomId: string,
): Promise<RoomRun[]> {
	return callPixel(
		actions,
		pixel("GetAgentRunsForRoom", { roomId }),
		roomRunsSchema,
	);
}
