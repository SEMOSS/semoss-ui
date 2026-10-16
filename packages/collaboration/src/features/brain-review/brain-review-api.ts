import { z } from "@semoss/ui/next";
import { type Job, mapJob } from "@/features/onboarding/onboarding-api";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

export const reviewKindSchema = z.enum([
	"wrong_topic",
	"topic_choice",
	"unassigned",
	"new_topic",
	"merge_topic",
	"quiet_topic",
	"add_person",
	"unknown_sender",
	"memory",
]);
const questionSchema = z.object({
	id: z.string().min(1),
	kind: reviewKindSchema,
	text: z.string(),
	detail: z.string().nullish().default(""),
	refId: z.string(),
	removedTopicIds: z.array(z.string()).default([]),
	status: z.enum(["open", "accepted", "dismissed"]),
	data: z
		.object({
			candidates: z.array(z.string()).default([]),
			subject: z.string().optional(),
			currentTopics: z
				.array(z.object({ id: z.string(), name: z.string() }))
				.optional(),
			suggestedTopic: z.string().optional(),
			targetTopicId: z.string().optional(),
			memoryAction: z.string().optional(),
		})
		.passthrough()
		.default({ candidates: [] }),
});
const healthSchema = z.object({
	days: z.number().int().positive(),
	eligibleMailThreads: z.number().int().nonnegative(),
	filedThreads: z.number().int().nonnegative(),
	automaticallyFiledThreads: z.number().int().nonnegative(),
	unfiledThreads: z.number().int().nonnegative(),
	filedPercent: z.number().min(0).max(100).nullable(),
	automaticPercent: z.number().min(0).max(100).nullable(),
	decisionsAnswered: z.number().int().nonnegative(),
	questionsWaiting: z.number().int().nonnegative(),
	questionsByKind: z.record(z.string(), z.number().int().nonnegative()),
});
const jobSchema = z.object({
	id: z.string().min(1),
	status: z.enum(["running", "done", "failed"]),
	step: z.string().nullish(),
	progress: z.number().nullish(),
	counts: z.record(z.string(), z.unknown()).nullish(),
	error: z.string().nullish(),
	finishedAt: z.string().nullish(),
	params: z.record(z.string(), z.unknown()).nullish(),
});
const overviewSchema = z.object({
	health: healthSchema,
	pendingCounts: z
		.record(z.string(), z.number().int().nonnegative())
		.optional(),
	filedThreads: z.array(z.object({ id: z.string(), name: z.string() })),
	pending: z.object({
		items: z.array(questionSchema),
		total: z.number().int().nonnegative(),
	}),
	topics: z.array(z.object({ id: z.string().min(1), name: z.string() })),
	job: jobSchema.nullable(),
});
const decisionsSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1),
			kind: z.string(),
			summary: z.string(),
			at: z.string(),
			canUndo: z.boolean(),
		}),
	),
	total: z.number().int().nonnegative(),
});
export type ReviewQuestion = z.infer<typeof questionSchema>;
export type ReviewHealth = z.infer<typeof healthSchema>;
export type ReviewOverview = Omit<z.infer<typeof overviewSchema>, "job"> & {
	job: Job | null;
};
export type ReviewDecisionPage = z.infer<typeof decisionsSchema>;
export type ReviewAnswer = "accept" | "dismiss" | "both";
export type ReviewTopic = ReviewOverview["topics"][number];

/** Reads real stored health and a page of questions, including older unanswered questions. */
export async function readReviewOverview(
	actions: InsightActions,
	offset = 0,
): Promise<ReviewOverview> {
	const result = await callPixel(
		actions,
		pixel("BrainGetReviewOverview", { limit: 50, offset }),
		overviewSchema,
	);
	return { ...result, job: result.job ? mapJob(result.job) : null };
}
/** Reads owner answers only; automatic thread/topic links are not decisions. */
export function readReviewDecisions(
	actions: InsightActions,
	offset = 0,
): Promise<ReviewDecisionPage> {
	return callPixel(
		actions,
		pixel("BrainListReviewDecisions", { days: 7, limit: 20, offset }),
		decisionsSchema,
	);
}
/** Starts or rejoins the owner's existing Optimize job, without applying any proposals. */
export async function startBrainOptimization(
	actions: InsightActions,
): Promise<Job> {
	return mapJob(await callPixel(actions, pixel("BrainOptimize"), jobSchema));
}
/** The server applies the answer and records its reversible effect in one transaction. */
export function answerReview(
	actions: InsightActions,
	reviewId: string,
	action: ReviewAnswer,
	topicId?: string,
): Promise<ReviewQuestion> {
	return callPixel(
		actions,
		pixel("BrainAnswerReview", { reviewId, action, topicId }),
		questionSchema,
	);
}
/** Undo restores the recorded effect only while it has not been superseded. */
export function undoReviewDecision(
	actions: InsightActions,
	reviewId: string,
): Promise<ReviewQuestion> {
	return callPixel(
		actions,
		pixel("BrainUndoReviewDecision", { reviewId }),
		questionSchema,
	);
}

/** Opens an explicit filing correction; this request does not alter the current topic link. */
export function requestFilingCorrection(
	actions: InsightActions,
	threadId: string,
): Promise<ReviewQuestion> {
	return callPixel(
		actions,
		pixel("BrainRequestFilingReview", { threadId }),
		questionSchema,
	);
}
