import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import type { TopicReview } from "./topic-review-api";

const draftSchema = z.object({
	line: z.number().int(),
	lineText: z.string(),
	name: z.string(),
	description: z.string(),
	clues: z.array(z.string()),
	people: z.array(
		z.object({ id: z.string(), name: z.string(), reason: z.string() }),
	),
	suggestions: z.array(z.object({ key: z.string(), name: z.string() })),
	question: z
		.object({
			text: z.string(),
			options: z.array(z.string()),
			descriptions: z.record(z.string(), z.string()).optional(),
		})
		.nullable(),
});
export type TopicBuildDraft = z.infer<typeof draftSchema>;

const startSchema = z.object({
	reviewId: z.string(),
	revision: z.number().int().positive(),
	topics: z.array(draftSchema),
	reply: z.string(),
});

const foundSchema = z.object({
	threads: z.array(
		z.object({
			threadId: z.string(),
			subject: z.string(),
			channel: z
				.string()
				.nullish()
				.transform((value) => value ?? null),
			lastAt: z
				.string()
				.nullish()
				.transform((value) => value ?? null),
			people: z.array(z.string()),
			participants: z
				.array(z.object({ id: z.string(), name: z.string() }))
				.optional(),
			subjectClues: z.array(z.string()).optional(),
			reason: z.string(),
			fits: z.enum(["yes", "maybe"]),
			preticked: z.boolean(),
		}),
	),
	matched: z.number().int().nonnegative(),
	checked: z.number().int().nonnegative(),
	unchecked: z.number().int().nonnegative(),
});
export type FoundThreads = z.infer<typeof foundSchema>;

/** The owner's words as drafts of the topics to set up, one per line. */
export async function startTopicBuild(
	actions: InsightActions,
	review: TopicReview,
	text: string,
) {
	return callPixel(
		actions,
		pixel("BrainStartTopicBuild", {
			reviewId: review.id,
			revision: review.revision,
			text,
		}),
		startSchema,
	);
}

export interface TopicProfile {
	name: string;
	description: string;
	clues: string[];
	people: string[];
	suggestionKeys: string[];
	otherTopics?: Pick<TopicBuildDraft, "name" | "description" | "clues">[];
	topicKey?: string;
}

/** The conversations that fit a topic being set up, best first. */
export async function findTopicThreads(
	actions: InsightActions,
	review: TopicReview,
	topic: TopicProfile,
) {
	return callPixel(
		actions,
		pixel("BrainFindTopicThreads", {
			reviewId: review.id,
			revision: review.revision,
			topic,
		}),
		foundSchema,
	);
}

/** How many conversations these people are on, with a few example subjects. */
export async function previewTopicReach(
	actions: InsightActions,
	people: string[],
) {
	return callPixel(
		actions,
		pixel("BrainPreviewTopicReach", { reach: { people } }),
		z.object({
			threads: z.number().int().nonnegative(),
			together: z.number().int().nonnegative(),
			samples: z.array(z.string()),
		}),
	);
}
