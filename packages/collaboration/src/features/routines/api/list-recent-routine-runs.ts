import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** Sent on `window` after a routine is run, renamed or removed here, so the sidebar re-reads its recent runs. */
export const ROUTINE_RUNS_CHANGED = "collaboration:routine-runs-changed";

const recentRoutinesSchema = z.object({
	routines: z.array(
		z.object({
			routineId: z.string().min(1),
			// a custom routine's name; the client names the system routines
			name: z.string().nullish().default(null),
			runs: z
				.array(
					z.object({
						runId: z.string().min(1),
						status: z.enum([
							"running",
							"completed",
							"failed",
							"stopped",
						]),
						startedAt: z.iso.datetime(),
						finishedAt: z.iso.datetime().nullish().default(null),
						// where a running run of the owner's own routine can be watched
						roomId: z.string().min(1).nullish().default(null),
					}),
				)
				.min(1),
		}),
	),
});

type RecentRoutine = z.infer<typeof recentRoutinesSchema>["routines"][number];

/** The routines the owner ran last, newest first, each with its latest runs. */
export async function listRecentRoutineRuns(
	actions: InsightActions,
): Promise<RecentRoutine[]> {
	const { routines } = await callPixel(
		actions,
		pixel("WorkListRecentRoutineRuns"),
		recentRoutinesSchema,
	);
	return routines;
}
