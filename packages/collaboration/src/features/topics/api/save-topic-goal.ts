import { z } from "@semoss/ui/next";
import type { TopicGoal } from "@/features/collaboration/state/collaboration.types";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const savedGoalSchema = z.object({
	noteId: z.string().min(1),
	text: z.string(),
	status: z.enum(["open", "done"]),
});

/** Save one goal and use its returned identity without a second, fallible read. */
export async function saveTopicGoal(
	actions: InsightActions,
	topicId: string,
	goal: { noteId?: string; text: string; status: TopicGoal["status"] },
): Promise<TopicGoal> {
	const saved = await callPixel(
		actions,
		pixel("BrainSaveTopicNote", {
			topicId,
			noteId: goal.noteId,
			kind: "goal",
			text: goal.text,
			state: goal.status,
		}),
		savedGoalSchema,
	);
	if (goal.noteId && saved.noteId !== goal.noteId) {
		throw new Error(
			"The saved goal did not match this goal. Refresh and try again.",
		);
	}
	return saved;
}
