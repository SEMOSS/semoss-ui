import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { topicOrganizationGroupsSchema } from "./topic-organization-schema";
import {
	type TopicReview,
	topicLinkSchema,
	topicReviewSchema,
} from "./topic-review-api";

export const topicEvidenceSchema = z.object({
	reviewId: z.string().min(1),
	revision: z.number().int().positive(),
	topicKey: z.string().min(1),
	items: z.array(
		z.object({
			id: z.string().min(1),
			source: z.enum(["email", "teams", "calendar"]),
			subject: z.string(),
			lastMessageAt: z
				.string()
				.nullish()
				.transform((value) => value ?? null),
			messageCount: z.number().int().nonnegative(),
			people: z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					email: z.string(),
				}),
			),
			links: z.array(topicLinkSchema.extend({ name: z.string() })),
			rejectedTopicIds: z.array(z.string()),
			canCorrect: z.boolean(),
			version: z.string().min(1),
		}),
	),
	total: z.number().int().nonnegative(),
	offset: z.number().int().nonnegative(),
	hasMore: z.boolean(),
	hiddenOrUnavailable: z.number().int().nonnegative(),
	limited: z.boolean(),
	scope: z.string(),
});

const correctionInputSchema = z
	.object({
		type: z.enum(["confirm", "reject", "move", "also_link"]),
		topicKey: z.string().min(1),
		threadIds: z.array(z.string().min(1).max(50)).min(1).max(50),
		versions: z.record(z.string(), z.string().min(1).max(50000)),
		targetKey: z.string().min(1).optional(),
	})
	.superRefine((change, context) => {
		if (
			new Set(change.threadIds).size !== change.threadIds.length ||
			Object.keys(change.versions).length !== change.threadIds.length ||
			change.threadIds.some((id) => !Object.hasOwn(change.versions, id))
		) {
			context.addIssue({
				code: "custom",
				path: ["threadIds"],
				message:
					"Choose distinct conversations with their current preview versions",
			});
		}
		if (
			(change.type === "move" || change.type === "also_link") &&
			(!change.targetKey || change.targetKey === change.topicKey)
		) {
			context.addIssue({
				code: "custom",
				path: ["targetKey"],
				message: "Choose a destination topic",
			});
		}
	});

export const topicReviewChangeSchema = z.union([
	correctionInputSchema,
	z.object({ type: z.literal("undo"), changeId: z.string().min(1) }),
	z.object({
		type: z.literal("organize"),
		groups: topicOrganizationGroupsSchema,
		scopeVersion: z.string().regex(/^[a-f0-9]{64}$/),
	}),
	z.object({
		type: z.literal("reconcile_profile"),
		topicKey: z.string().min(1),
		profileVersion: z.string().regex(/^[a-f0-9]{64}$/),
		choice: z.enum(["saved", "draft"]),
	}),
]);

export type TopicEvidence = z.infer<typeof topicEvidenceSchema>;
export type TopicEvidenceItem = TopicEvidence["items"][number];
export type TopicReviewChange = z.infer<typeof topicReviewChangeSchema>;

/** Metadata only; reading an example does not apply a suggestion or invoke an agent. */
export async function getTopicEvidence(
	actions: InsightActions,
	review: TopicReview,
	topicKey: string,
	query = "",
	offset = 0,
): Promise<TopicEvidence> {
	const page = await callPixel(
		actions,
		pixel("BrainGetTopicReviewEvidence", {
			reviewId: review.id,
			revision: review.revision,
			topicKey,
			query,
			offset,
			limit: 20,
		}),
		topicEvidenceSchema,
	);
	if (
		page.reviewId !== review.id ||
		page.revision !== review.revision ||
		page.topicKey !== topicKey ||
		page.offset !== Math.min(offset, page.total)
	) {
		throw new Error(
			"The examples do not match this topic review. Refresh the preview.",
		);
	}
	return page;
}

/** The retry key is reused after an uncertain response; only the server advances the shared draft. */
export async function changeTopicReview(
	actions: InsightActions,
	review: TopicReview,
	operationId: string,
	change: TopicReviewChange,
): Promise<TopicReview> {
	const saved = (
		await callPixel(
			actions,
			pixel("BrainChangeTopicReview", {
				reviewId: review.id,
				revision: review.revision,
				operationId,
				change: topicReviewChangeSchema.parse(change),
			}),
			z.object({ exists: z.literal(true), review: topicReviewSchema }),
		)
	).review;
	if (
		saved.id !== review.id ||
		saved.revision < review.revision ||
		!(saved.draft.operationIds ?? []).includes(operationId)
	) {
		throw new Error(
			"This draft correction could not be confirmed. Retry the same change or reload the saved review.",
		);
	}
	return saved;
}

const conversationContextSchema = z.object({
	threadId: z.string(),
	source: z.enum(["email", "teams", "calendar"]),
	messages: z.array(
		z.object({
			id: z.string(),
			fromName: z
				.string()
				.nullish()
				.transform((value) => value ?? ""),
			fromAddress: z
				.string()
				.nullish()
				.transform((value) => value ?? ""),
			at: z
				.string()
				.nullish()
				.transform((value) => value ?? ""),
			text: z
				.string()
				.nullish()
				.transform((value) => value ?? ""),
			excluded: z.boolean().optional(),
			webLink: z.string().url().optional(),
		}),
	),
	hiddenCount: z.number().int().nonnegative(),
	unavailableCount: z.number().int().nonnegative(),
	hasMore: z.boolean(),
});
export type TopicConversationContext = z.infer<
	typeof conversationContextSchema
>;

/** Fetch rule-gated clean text live; it remains transient and never enters the durable draft. */
export async function getTopicConversationContext(
	actions: InsightActions,
	threadId: string,
): Promise<TopicConversationContext> {
	const page = await callPixel(
		actions,
		pixel("BrainGetThreadMessages", { threadId, limit: 5 }),
		conversationContextSchema,
	);
	if (page.threadId !== threadId)
		throw new Error("Received context for a different conversation.");
	return page;
}
