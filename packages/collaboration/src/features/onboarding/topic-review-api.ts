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
	addedPeople: z.array(z.string().min(1)).max(30).optional(),
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
	area: z.string().nullish(),
	own: z.record(z.string(), z.unknown()).optional(),
	suggestedTerms: z.array(z.string()).optional(),
	addedPeopleInfo: z
		.array(z.object({ id: z.string(), name: z.string() }))
		.optional(),
	terms: topicCluesSchema.default(""),
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
			areas: z
				.array(
					z.object({
						key: z.string(),
						name: z.string(),
						about: z.string(),
						topicKeys: z.array(z.string()),
						suggested: z.boolean(),
						split: z.boolean(),
						weight: z.number(),
						size: z.number(),
					}),
				)
				.optional(),
			topics: z.array(reviewTopicSchema),
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
export type TopicDraft = z.infer<typeof topicDraftSchema>;
export type TopicReview = z.infer<typeof topicReviewSchema>;
export type ReviewTopic = z.infer<typeof reviewTopicSchema>;

export type TopicReviewStart = TopicReview | { pending: true; job: Job };
const pendingReviews = new WeakMap<InsightActions, Promise<TopicReviewStart>>();
const startReviewResponseSchema = z.union([
	reviewResponseSchema.transform((result) => result.review),
	z
		.object({
			exists: z.literal(false),
			pending: z.literal(true),
			job: filingJobSchema,
		})
		.transform((result) => ({ pending: true as const, job: result.job })),
]);

/** Share only initialization in flight; the durable server draft owns later visits. */
export function startTopicReview(
	actions: InsightActions,
): Promise<TopicReviewStart> {
	const pending = pendingReviews.get(actions);
	if (pending) return pending;
	const request = callPixel(
		actions,
		pixel("BrainStartTopicReview"),
		startReviewResponseSchema,
	).finally(() => pendingReviews.delete(actions));
	pendingReviews.set(actions, request);
	return request;
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
	const expectedMerges = review.draft.topics.filter(
		(topic) =>
			topic.mergedIntoKey &&
			!topic.mergeApplied &&
			review.draft.topics.some(
				(target) => target.key === topic.mergedIntoKey && target.keep,
			),
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
	const corrections = (review.draft.corrections ?? []).filter((correction) =>
		expected.some((topic) => topic.key === correction.topicKey),
	);
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

/** Area structure belongs to the saved review, not a client-side merge approximation. */
export async function setTopicArea(
	actions: InsightActions,
	review: TopicReview,
	area: string,
	split: boolean,
): Promise<TopicReview> {
	const saved = (
		await callPixel(
			actions,
			pixel("BrainSetTopicArea", {
				reviewId: review.id,
				revision: review.revision,
				area,
				split,
			}),
			reviewResponseSchema,
		)
	).review;
	if (
		saved.id !== review.id ||
		saved.revision !==
			review.revision +
				(review.draft.areas?.find((row) => row.key === area)?.split ===
				split
					? 0
					: 1) ||
		saved.draft.areas?.find((row) => row.key === area)?.split !== split
	)
		throw new Error(
			"The area change could not be verified. Reload the saved review.",
		);
	return saved;
}

const reachSchema = z.object({
	threads: z.number().int().nonnegative(),
	together: z.number().int().nonnegative(),
	samples: z.array(z.string()).max(3),
});
export type TopicReach = z.infer<typeof reachSchema>;
const reachCache = new WeakMap<
	InsightActions,
	Map<string, Promise<TopicReach>>
>();
/** Only the visible editor asks for reach; identical selections share their read. */
export function previewTopicReach(
	actions: InsightActions,
	people: string[],
	refresh = false,
): Promise<TopicReach> {
	const ids = [...new Set(people)].sort();
	if (ids.length > 60)
		return Promise.reject(
			new Error(
				"Reach preview supports up to 60 people. Your selections are still saved.",
			),
		);
	if (!ids.length)
		return Promise.resolve({ threads: 0, together: 0, samples: [] });
	let cache = reachCache.get(actions);
	if (!cache) {
		cache = new Map();
		reachCache.set(actions, cache);
	}
	const key = JSON.stringify(ids);
	const previous = cache.get(key);
	if (previous && !refresh) return previous;
	const owner = cache;
	const request = callPixel(
		actions,
		pixel("BrainPreviewTopicReach", { reach: { people: ids } }),
		reachSchema,
	).catch((cause: unknown) => {
		if (owner.get(key) === request) owner.delete(key);
		throw cause;
	});
	if (cache.size >= 100) cache.delete(cache.keys().next().value ?? "");
	cache.set(key, request);
	return request;
}

const reviewPersonSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
});
const peoplePageSchema = z.object({
	items: z.array(
		reviewPersonSchema.extend({
			email: z.string().nullish(),
			relationship: z.string().nullish(),
			automated: z.boolean().optional(),
		}),
	),
	total: z.number().int().nonnegative(),
});
export type ReviewPeoplePage = z.infer<typeof peoplePageSchema>;
/** Search when the owner opens the picker; retain the server's page boundary and total. */
const peopleSearchCache = new WeakMap<
	InsightActions,
	Map<string, Promise<ReviewPeoplePage>>
>();
export function searchReviewPeople(
	actions: InsightActions,
	query: string,
	offset = 0,
	refresh = false,
): Promise<ReviewPeoplePage> {
	let cache = peopleSearchCache.get(actions);
	if (!cache) {
		cache = new Map();
		peopleSearchCache.set(actions, cache);
	}
	const key = JSON.stringify([query, offset]);
	const cached = cache.get(key);
	if (cached && !refresh) return cached;
	const owner = cache;
	const request = callPixel(
		actions,
		pixel("BrainListPeople", { query, limit: 25, offset }),
		peoplePageSchema,
	)
		.then((page) => {
			if (
				offset + page.items.length > page.total ||
				(!page.items.length && offset < page.total)
			)
				throw new Error(
					"People changed while loading. Retry this search.",
				);
			return page;
		})
		.catch((cause: unknown) => {
			if (owner.get(key) === request) owner.delete(key);
			throw cause;
		});
	if (cache.size >= 100) cache.delete(cache.keys().next().value ?? "");
	cache.set(key, request);
	return request;
}

export const reviewChatChangeSchema = z.object({
	type: z.enum(["add_topic", "edit_topic", "keep", "skip", "combine"]),
	topicKey: z.string(),
	topicKeys: z.array(z.string()),
	name: z.string().max(255),
	description: z.string().max(2000),
	addTerms: z.array(z.string().max(200)).max(20),
	addPeople: z.array(reviewPersonSchema).max(30),
	removePeople: z.array(reviewPersonSchema),
	reason: z.string().max(1000),
});
const reviewChatSchema = z.object({
	reviewId: z.string().min(1),
	revision: z.number().int().positive(),
	reply: z.string().min(1).max(6000),
	changes: z.array(reviewChatChangeSchema).max(40),
});
export type ReviewChatChange = z.infer<typeof reviewChatChangeSchema>;
export type ReviewChatReply = z.infer<typeof reviewChatSchema>;
export interface ReviewChatMessage {
	role: "owner" | "assistant";
	text: string;
}

/** This reactor proposes only. Draft writes remain explicit, revision-checked owner actions. */
export async function askTopicReview(
	actions: InsightActions,
	review: TopicReview,
	messages: ReviewChatMessage[],
): Promise<ReviewChatReply> {
	const recent = messages
		.slice(-20)
		.map((message) => ({ ...message, text: message.text.slice(0, 4000) }));
	if (
		!recent.length ||
		recent.at(-1)?.role !== "owner" ||
		!recent.at(-1)?.text.trim()
	)
		throw new Error("Write a message for the assistant.");
	const reply = await callPixel(
		actions,
		pixel("BrainTopicReviewChat", {
			reviewId: review.id,
			revision: review.revision,
			chat: { messages: recent },
		}),
		reviewChatSchema,
	);
	const keys = new Set(
		review.draft.topics
			.filter((topic) => !topic.mergedIntoKey)
			.map((topic) => topic.key),
	);
	if (
		reply.reviewId !== review.id ||
		reply.revision !== review.revision ||
		reply.changes.some((change) =>
			change.type === "combine"
				? change.topicKeys.length < 2 ||
					new Set(change.topicKeys).size !==
						change.topicKeys.length ||
					change.topicKeys.some((key) => !keys.has(key))
				: change.type !== "add_topic" && !keys.has(change.topicKey),
		)
	)
		throw new Error(
			"The assistant's proposals do not match this review. Ask again with your saved topics.",
		);
	if (
		reply.changes.some(
			(change) =>
				((change.type === "keep" || change.type === "skip") &&
					(change.name.trim() ||
						change.description.trim() ||
						change.addTerms.length ||
						change.addPeople.length ||
						change.removePeople.length)) ||
				(change.type === "combine" &&
					(change.addPeople.length || change.removePeople.length)) ||
				(change.type === "add_topic" &&
					(!change.name.trim() || change.removePeople.length)),
		)
	)
		throw new Error(
			"The assistant mixed incompatible changes in a proposal. Ask for topic edits and grouping changes separately.",
		);
	return reply;
}

/** Translate an accepted profile proposal into the same editable draft as direct input. */
export function draftWithChatChange(
	review: TopicReview,
	change: ReviewChatChange,
	addedKey: string,
): TopicReviewDraft {
	const draft = reviewDraft(review);
	if (change.type === "combine")
		throw new Error("Preview the combination before applying it.");
	let topic = draft.topics.find((row) => row.key === change.topicKey);
	const evidence = review.draft.topics.find(
		(row) => row.key === change.topicKey,
	);
	if (change.type === "add_topic") {
		topic = {
			key: addedKey,
			id: null,
			name: change.name,
			description: change.description,
			short: "",
			terms: "",
			keep: true,
			removedPeople: [],
			addedPeople: [],
		};
		if (draft.topics.some((row) => row.key === addedKey))
			throw new Error("This proposal is already in your draft.");
		draft.topics.push(topic);
	}
	if (!topic || evidence?.mergedIntoKey)
		throw new Error("This topic changed. Ask for an updated proposal.");
	if (change.type === "skip" && evidence?.accepted)
		throw new Error(
			"This topic is already saved. Manage its removal from My topics.",
		);
	if (change.type === "keep" || change.type === "skip")
		topic.keep = change.type === "keep";
	else {
		if (change.name.trim()) topic.name = change.name;
		if (change.description.trim()) topic.description = change.description;
		topic.terms = topicClues(
			[topic.terms, ...change.addTerms].join("\n"),
		).join("\n");
		const original = new Set(
			evidence?.people.map((person) => person.id) ?? [],
		);
		const additions = new Set(topic.addedPeople ?? []);
		const removed = new Set(topic.removedPeople);
		for (const person of change.removePeople) {
			if (original.has(person.id)) removed.add(person.id);
			else additions.delete(person.id);
		}
		for (const person of change.addPeople) {
			if (original.has(person.id)) removed.delete(person.id);
			else additions.add(person.id);
		}
		topic.addedPeople = [...additions];
		topic.removedPeople = [...removed];
	}
	return topicReviewDraftSchema.parse(draft);
}
