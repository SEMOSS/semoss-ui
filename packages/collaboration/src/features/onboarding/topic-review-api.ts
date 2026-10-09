import { z } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { callPixel, pixel } from "@/lib/pixel";
import { type Job, mapJob } from "./onboarding-api";
import { topicClues, topicCluesSchema } from "./topic-clues";

export { topicClues } from "./topic-clues";

export const topicDraftSchema = z.object({
	key: z.string().min(1).max(100),
	id: z.string().nullable(),
	name: z.string().max(255, "Use a name of at most 255 characters"),
	description: z
		.string()
		.max(12000, "Use a description of at most 12,000 characters"),
	short: z.string().max(255, "Use a short label of at most 255 characters"),
	terms: topicCluesSchema,
	keep: z.boolean(),
	removedPeople: z.array(z.string()),
	addedPeople: z.array(z.string()),
});

export const topicReviewDraftSchema = z.object({
	topics: z.array(topicDraftSchema).max(100),
	guidance: z.string().max(6000),
	granularity: z.enum(["broad", "projects", "detailed"]),
});

export const topicReviewApplySchema = topicReviewDraftSchema.superRefine(
	(values, context) => {
		values.topics.forEach((topic, index) => {
			if (topic.keep && !topic.name.trim()) {
				context.addIssue({
					code: "custom",
					path: ["topics", index, "name"],
					message:
						"Name this topic or turn off Keep before continuing",
				});
			}
		});
	},
);

const reviewTopicSchema = topicDraftSchema.extend({
	terms: topicCluesSchema.default(""),
	addedPeople: z.array(z.string()).default([]),
	addedPeopleInfo: z
		.array(z.object({ id: z.string(), name: z.string() }))
		.default([]),
	suggestedTerms: z.array(z.string()).default([]),
	id: z
		.string()
		.nullish()
		.transform((value) => value ?? null),
	accepted: z.boolean().default(false),
	mergedIntoKey: z
		.string()
		.nullish()
		.transform((value) => value ?? null),
	mergeApplied: z.boolean().default(false),
	reason: z
		.string()
		.nullish()
		.transform((value) => value ?? ""),
	threadIds: z.array(z.string()).default([]),
	sampleSubjects: z.array(z.string()).default([]),
	people: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
	domains: z.array(z.string()).default([]),
	area: z
		.string()
		.nullish()
		.transform((value) => value ?? null),
	youWrote: z.number().default(0),
	vipThreads: z.number().default(0),
	// an area's first topic keeps its own name here while it stands for the whole area
	own: z
		.object({ name: z.string().nullish() })
		.nullish()
		.transform((value) => value ?? null),
});

/** A broad area of work: one topic, or several shown as one until the owner keeps them separate. */
const topicAreaSchema = z.object({
	key: z.string().min(1),
	name: z.string(),
	about: z.string().default(""),
	topicKeys: z.array(z.string()).min(1),
	suggested: z.boolean().default(false),
	split: z.boolean().default(false),
});

const receiptTopicSchema = z.object({
	key: z.string(),
	id: z.string(),
	name: z.string(),
	short: z.string(),
	description: z.string(),
	keywords: z.array(z.string()).optional(),
});

export const topicLinkSchema = z.object({
	topicId: z.string().min(1),
	source: z
		.string()
		.nullish()
		.transform((value) => value ?? "unknown"),
	confidence: z.number().int().min(0).max(100),
	primary: z.boolean(),
});

export const topicCorrectionSchema = z.object({
	threadId: z.string().min(1),
	topicKey: z.string().min(1),
	state: z.enum(["include", "exclude"]),
	primary: z.boolean(),
});

const correctionReceiptSchema = z.object({
	threadId: z.string().min(1),
	changes: z.array(topicCorrectionSchema),
	links: z.array(topicLinkSchema),
	rejectedTopicIds: z.array(z.string()),
});

const topicProfileConflictSchema = z.object({
	topicKey: z.string().min(1),
	profileVersion: z.string().regex(/^[a-f0-9]{64}$/),
	exists: z.boolean(),
	canReconcile: z.boolean(),
	reason: z.string(),
	savedProfile: z.object({
		name: z.string(),
		short: z.string(),
		description: z.string(),
		terms: z.string(),
		kind: z.string(),
		status: z.string(),
		people: z.array(
			z.object({ id: z.string(), name: z.string(), state: z.string() }),
		),
	}),
});
export type TopicProfileConflict = z.infer<typeof topicProfileConflictSchema>;

/** Validate background-job wire data before mapping it to the existing client contract. */
const filingJobSchema = z
	.object({
		id: z.string().min(1),
		status: z.enum(["running", "done", "failed"]),
		step: z.string().nullish(),
		progress: z.number().nullish(),
		params: z.record(z.string(), z.unknown()).default({}),
		counts: z.record(z.string(), z.unknown()).default({}),
		error: z.string().nullish(),
		finishedAt: z.string().nullish(),
	})
	.transform(mapJob);

export const topicReviewSchema = z
	.object({
		id: z.string().min(1),
		revision: z.number().int().positive(),
		profileConflicts: z.array(topicProfileConflictSchema).default([]),
		draft: z.object({
			topics: z.array(reviewTopicSchema),
			areas: z.array(topicAreaSchema).default([]),
			guidance: z.string().default(""),
			granularity: z
				.enum(["broad", "projects", "detailed"])
				.default("broad"),
			modelError: z.string().default(""),
			corrections: z.array(topicCorrectionSchema).optional(),
			history: z
				.array(
					z.object({
						id: z.string(),
						type: z.string(),
						summary: z.string(),
					}),
				)
				.optional(),
			operationIds: z.array(z.string()).optional(),
			lastChange: z.string().nullish(),
		}),
		appliedRevision: z
			.number()
			.int()
			.positive()
			.nullish()
			.transform((value) => value ?? null),
		result: z
			.object({
				topics: z.array(receiptTopicSchema),
				skipped: z.array(z.string()),
				corrections: z.array(correctionReceiptSchema).optional(),
				merges: z
					.array(
						z.object({
							sourceKey: z.string(),
							targetKey: z.string(),
							sourceId: z
								.string()
								.nullish()
								.transform((value) => value ?? null),
							targetId: z.string(),
							mergedInto: z.string().optional(),
						}),
					)
					.optional(),
			})
			.nullish(),
		filingJobId: z
			.string()
			.nullish()
			.transform((value) => value ?? null),
		filingJob: filingJobSchema
			.nullish()
			.transform((value) => value ?? null),
		updatedAt: z
			.string()
			.nullish()
			.transform((value) => value ?? null),
	})
	.superRefine((review, context) => {
		if (review.appliedRevision !== null && !review.result) {
			context.addIssue({
				code: "custom",
				path: ["result"],
				message: "An applied topic review needs its saved result",
			});
		}
		if (
			review.appliedRevision !== null &&
			review.appliedRevision > review.revision
		) {
			context.addIssue({
				code: "custom",
				path: ["appliedRevision"],
				message: "The applied revision cannot be newer than the review",
			});
		}
	})
	.transform((review) => ({
		...review,
		// No apply receipt exists until the owner applies the first saved draft.
		result: review.result ?? { topics: [], skipped: [] },
	}));

const reviewResponseSchema = z.object({
	exists: z.literal(true),
	review: topicReviewSchema,
});
export const optionalReviewResponseSchema = z
	.object({
		exists: z.boolean(),
		review: topicReviewSchema.nullish().transform((value) => value ?? null),
	})
	.refine(
		(result) => result.exists === (result.review !== null),
		"The saved-review existence flag does not match its result",
	);

export type TopicReviewDraft = z.infer<typeof topicReviewDraftSchema>;
export type TopicArea = z.infer<typeof topicAreaSchema>;
export type TopicDraft = z.infer<typeof topicDraftSchema>;
export type TopicReview = z.infer<typeof topicReviewSchema>;
export type ReviewTopic = z.infer<typeof reviewTopicSchema>;

/** The saved draft, or the background job still grouping and naming topics. */
export type TopicReviewStart =
	| { review: TopicReview; job: null }
	| { review: null; job: Job };

const startResponseSchema = z
	.object({
		exists: z.boolean(),
		review: topicReviewSchema.nullish(),
		job: filingJobSchema.nullish(),
	})
	.transform((result, context): TopicReviewStart => {
		if (result.exists && result.review)
			return { review: result.review, job: null };
		if (!result.exists && result.job)
			return { review: null, job: result.job };
		context.addIssue({
			code: "custom",
			message:
				"The topic review start returned neither a draft nor a job",
		});
		return z.NEVER;
	});

const pendingReviews = new WeakMap<InsightActions, Promise<TopicReviewStart>>();

/** Share only initialization in flight; the durable server draft owns later visits. */
export function startTopicReview(
	actions: InsightActions,
): Promise<TopicReviewStart> {
	const pending = pendingReviews.get(actions);
	if (pending) return pending;
	const request = callPixel(
		actions,
		pixel("BrainStartTopicReview"),
		startResponseSchema,
	).finally(() => pendingReviews.delete(actions));
	pendingReviews.set(actions, request);
	return request;
}

/** Keep an area's topics separate, or as one topic again; the server returns the new draft. */
export async function setTopicArea(
	actions: InsightActions,
	review: TopicReview,
	areaKey: string,
	split: boolean,
): Promise<TopicReview> {
	return (
		await callPixel(
			actions,
			pixel("BrainSetTopicArea", {
				reviewId: review.id,
				revision: review.revision,
				area: areaKey,
				split,
			}),
			reviewResponseSchema,
		)
	).review;
}

/** Read the saved review, for recovery after a response is lost. */
export async function getTopicReview(
	actions: InsightActions,
): Promise<TopicReview | null> {
	return (
		await callPixel(
			actions,
			pixel("BrainGetTopicReview"),
			optionalReviewResponseSchema,
		)
	).review;
}

/** Only editable fields cross the write boundary; evidence and saved IDs are verified by the server. */
export async function saveTopicReview(
	actions: InsightActions,
	review: TopicReview,
	draft: TopicReviewDraft,
): Promise<TopicReview> {
	return (
		await callPixel(
			actions,
			pixel("BrainSaveTopicReview", {
				reviewId: review.id,
				revision: review.revision,
				draft: topicReviewDraftSchema.parse(draft),
			}),
			reviewResponseSchema,
		)
	).review;
}

/** Apply one saved revision and verify its receipt before continuing. */
export async function applyTopicReview(
	actions: InsightActions,
	review: TopicReview,
	retryFiling = false,
): Promise<TopicReview> {
	const saved = (
		await callPixel(
			actions,
			pixel("BrainApplyTopicReview", {
				reviewId: review.id,
				revision: review.revision,
				retryFiling: retryFiling || undefined,
			}),
			reviewResponseSchema,
		)
	).review;
	if (
		saved.id !== review.id ||
		saved.revision !== review.revision ||
		saved.appliedRevision !== review.revision
	) {
		throw new Error(
			"The saved review does not match this revision. Reload the saved review before continuing.",
		);
	}
	const expected = review.draft.topics.filter((topic) => topic.keep);
	if (
		saved.result.topics.length !== expected.length ||
		new Set(saved.result.topics.map((topic) => topic.key)).size !==
			expected.length ||
		expected.some((topic) => {
			const receipt = saved.result.topics.find(
				(item) => item.key === topic.key,
			);
			return (
				!receipt ||
				receipt.name !== topic.name.trim() ||
				receipt.short !== (topic.short.trim() || topic.name.trim()) ||
				receipt.description !== topic.description.trim() ||
				(receipt.keywords !== undefined
					? JSON.stringify(receipt.keywords) !==
						JSON.stringify(topicClues(topic.terms))
					: topicClues(topic.terms).length > 0)
			);
		})
	) {
		throw new Error(
			"The saved topic names or descriptions do not match your review. Reload the saved review before continuing.",
		);
	}
	// parts of a skipped area are skipped with it, not merged
	const keptKeys = new Set(expected.map((topic) => topic.key));
	const expectedMerges = review.draft.topics.filter(
		(topic) =>
			topic.mergedIntoKey &&
			!topic.mergeApplied &&
			keptKeys.has(topic.mergedIntoKey),
	);
	const merges = saved.result.merges ?? [];
	if (
		expectedMerges.length > 0 &&
		(merges.length !== expectedMerges.length ||
			new Set(merges.map((merge) => merge.sourceKey)).size !==
				expectedMerges.length ||
			expectedMerges.some((source) => {
				const merge = merges.find(
					(item) => item.sourceKey === source.key,
				);
				const target = saved.result.topics.find(
					(item) => item.key === source.mergedIntoKey,
				);
				const applied = saved.draft.topics.find(
					(item) => item.key === source.key,
				);
				return (
					!merge ||
					!target ||
					merge.targetKey !== source.mergedIntoKey ||
					merge.targetId !== target.id ||
					merge.sourceId !== source.id ||
					(source.id !== null && merge.mergedInto !== target.id) ||
					!applied?.mergeApplied ||
					applied.id !== null
				);
			}))
	) {
		throw new Error(
			"The saved topic combinations could not be verified. Reload the saved review before continuing.",
		);
	}
	if (
		saved.result.topics.length > 0 &&
		(!saved.filingJob ||
			saved.filingJob.id !== saved.filingJobId ||
			saved.filingJob.mode !== "topics" ||
			saved.filingJob.reviewId !== saved.id ||
			saved.filingJob.reviewRevision !== saved.appliedRevision)
	) {
		throw new Error(
			"Your topics are saved, but their filing job is not confirmed. Retry to recover it.",
		);
	}
	const corrections = review.draft.corrections ?? [];
	const correctedThreads = [
		...new Set(corrections.map((item) => item.threadId)),
	];
	const receipts = saved.result.corrections ?? [];
	if (
		correctedThreads.length > 0 &&
		(receipts.length !== correctedThreads.length ||
			new Set(receipts.map((item) => item.threadId)).size !==
				correctedThreads.length ||
			corrections.some((correction) => {
				const receipt = receipts.find(
					(item) => item.threadId === correction.threadId,
				);
				const topic = saved.result.topics.find(
					(item) => item.key === correction.topicKey,
				);
				const link = receipt?.links.find(
					(item) => item.topicId === topic?.id,
				);
				return (
					!receipt ||
					!topic ||
					!receipt.changes.some(
						(item) =>
							item.threadId === correction.threadId &&
							item.topicKey === correction.topicKey &&
							item.state === correction.state &&
							item.primary === correction.primary,
					) ||
					(correction.state === "include"
						? !link ||
							link.source !== "you" ||
							(correction.primary && !link.primary) ||
							receipt.rejectedTopicIds.includes(topic.id)
						: !!link ||
							!receipt.rejectedTopicIds.includes(topic.id))
				);
			}))
	) {
		throw new Error(
			"Your topic profiles are saved, but the reviewed conversation links could not be verified. Reload the saved review before continuing.",
		);
	}
	return saved;
}

/** Strip server-owned evidence before saving a draft. */
export function reviewDraft(review: TopicReview): TopicReviewDraft {
	return topicReviewDraftSchema.parse(review.draft);
}
