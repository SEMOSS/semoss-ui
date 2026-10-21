import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import type { TopicReview } from "./topic-review-api";

const personRefSchema = z.object({ id: z.string(), name: z.string() });

export const setupChangeSchema = z.object({
	type: z.enum(["add_topic", "edit_topic", "keep", "skip", "combine"]),
	topicKey: z.string(),
	topicKeys: z.array(z.string()),
	name: z.string(),
	description: z.string(),
	addTerms: z.array(z.string()),
	addPeople: z.array(personRefSchema),
	removePeople: z.array(personRefSchema),
	reason: z.string(),
});
export type SetupChange = z.infer<typeof setupChangeSchema>;

const chatResultSchema = z.object({
	reviewId: z.string(),
	revision: z.number().int().positive(),
	reply: z.string(),
	changes: z.array(setupChangeSchema),
});

export interface SetupMessage {
	role: "owner" | "assistant";
	text: string;
	/** Proposed draft changes on an assistant turn, applied only by the owner. */
	changes?: SetupChange[];
	/** Indexes of changes the owner applied or dismissed. */
	handled?: number[];
}

/** One read-only chat turn over the saved draft revision. */
export async function chatTopicSetup(
	actions: InsightActions,
	review: TopicReview,
	messages: SetupMessage[],
) {
	return callPixel(
		actions,
		pixel("BrainTopicReviewChat", {
			reviewId: review.id,
			revision: review.revision,
			chat: {
				messages: messages.map(({ role, text }) => ({ role, text })),
			},
		}),
		chatResultSchema,
	);
}

const reachSchema = z.object({
	threads: z.number().int().nonnegative(),
	together: z.number().int().nonnegative(),
	samples: z.array(z.string()),
});
export type TopicReach = z.infer<typeof reachSchema>;

/** How many conversations involve these people. */
export async function previewTopicReach(
	actions: InsightActions,
	people: string[],
): Promise<TopicReach> {
	return callPixel(
		actions,
		pixel("BrainPreviewTopicReach", { reach: { people } }),
		reachSchema,
	);
}
