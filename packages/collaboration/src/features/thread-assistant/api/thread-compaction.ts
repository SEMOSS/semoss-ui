import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
export type ThreadCompactionStrategy = "AUTO" | "SUMMARY" | "TOOL_PRUNE";
const resultsSchema = z.array(
	z.object({
		success: z.boolean(),
		type: z.string().optional(),
		error: z.string().optional(),
	}),
);
/** Run the existing compaction reactor against the settled assistant leaf. */
export async function compactThreadMessages(
	actions: InsightActions,
	roomId: string,
	parentMessageId: string,
	strategy: ThreadCompactionStrategy,
): Promise<"compacted" | "skipped"> {
	const results = await callPixel(
		actions,
		pixel("CompactRoomMessages", {
			roomId,
			parentMessageId,
			...(strategy !== "AUTO" ? { compactionTypes: [strategy] } : {}),
		}),
		resultsSchema,
	);
	if (results.length === 0) return "skipped";
	const failures = results.filter((result) => !result.success);
	if (failures.length)
		throw new Error(
			failures
				.map(
					(result) =>
						result.error || "Conversation compaction failed.",
				)
				.join(" "),
		);
	return "compacted";
}
