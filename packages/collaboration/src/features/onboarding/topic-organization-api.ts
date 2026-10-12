import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	type TopicOrganizationGroup,
	topicOrganizationGroupSchema,
	topicOrganizationGroupsSchema,
} from "./topic-organization-schema";
import type { TopicReview } from "./topic-review-api";

const proposalSchema = z.object({
	reviewId: z.string().min(1),
	revision: z.number().int().positive(),
	groups: z
		.array(
			topicOrganizationGroupSchema.and(
				z.object({ reason: z.string().min(1).max(2000) }),
			),
		)
		.min(1)
		.max(100),
	questions: z.array(z.string().min(1).max(500)).max(3),
	beforeCount: z.number().int().positive(),
	proposedCount: z.number().int().positive(),
});

const previewSchema = z.object({
	reviewId: z.string().min(1),
	revision: z.number().int().positive(),
	beforeCount: z.number().int().nonnegative(),
	afterCount: z.number().int().nonnegative(),
	scopeVersion: z.string().regex(/^[a-f0-9]{64}$/),
	groups: z
		.array(
			topicOrganizationGroupSchema.and(
				z.object({
					contributing: z.array(
						z.object({
							key: z.string(),
							name: z.string(),
							examples: z.number().int().nonnegative(),
							accepted: z.boolean(),
						}),
					),
					examples: z.number().int().nonnegative(),
					impact: z.object({
						linkedConversations: z.number().int().nonnegative(),
						workItems: z.number().int().nonnegative(),
						steps: z.number().int().nonnegative(),
						people: z.number().int().nonnegative(),
						notes: z.number().int().nonnegative(),
						rules: z.number().int().nonnegative(),
						pendingRelationships: z.number().int().nonnegative(),
						positiveOverExclusion: z.number().int().nonnegative(),
					}),
					canApply: z.boolean(),
					reason: z.string(),
				}),
			),
		)
		.min(1)
		.max(100),
});

export type TopicOrganizationProposal = z.infer<typeof proposalSchema>;
export type TopicOrganizationPreview = z.infer<typeof previewSchema>;

/** Owner-context suggestions are read-only and must cover every kept input topic exactly once. */
export async function suggestTopicOrganization(
	actions: InsightActions,
	review: TopicReview,
): Promise<TopicOrganizationProposal> {
	const proposal = await callPixel(
		actions,
		pixel("BrainSuggestTopicOrganization", {
			reviewId: review.id,
			revision: review.revision,
		}),
		proposalSchema,
	);
	const expected = review.draft.topics
		.filter((topic) => topic.keep && !topic.mergedIntoKey)
		.map((topic) => topic.key);
	const keys = topicOrganizationGroupsSchema
		.parse(proposal.groups)
		.flatMap((group) => group.topicKeys);
	if (
		proposal.reviewId !== review.id ||
		proposal.revision !== review.revision ||
		proposal.beforeCount !== expected.length ||
		proposal.proposedCount !== proposal.groups.length ||
		keys.length !== expected.length ||
		expected.some((key) => !keys.includes(key))
	) {
		throw new Error(
			"The suggestions do not match this topic review. Your draft is unchanged; try again.",
		);
	}
	return proposal;
}

/** Scope versions bind the acceptance to the exact proposed profiles and saved references shown here. */
export async function previewTopicOrganization(
	actions: InsightActions,
	review: TopicReview,
	groups: TopicOrganizationGroup[],
): Promise<TopicOrganizationPreview> {
	const input = topicOrganizationGroupsSchema.parse(groups);
	const page = await callPixel(
		actions,
		pixel("BrainPreviewTopicOrganization", {
			reviewId: review.id,
			revision: review.revision,
			proposal: { groups: input },
		}),
		previewSchema,
	);
	const kept = review.draft.topics.filter(
		(topic) => topic.keep && !topic.mergedIntoKey,
	);
	if (
		page.reviewId !== review.id ||
		page.revision !== review.revision ||
		page.beforeCount !== kept.length ||
		page.afterCount !==
			kept.length -
				input.reduce(
					(total, group) => total + group.topicKeys.length - 1,
					0,
				) ||
		JSON.stringify(topicOrganizationGroupsSchema.parse(page.groups)) !==
			JSON.stringify(input) ||
		page.groups.some(
			(group) =>
				group.contributing.length !== group.topicKeys.length ||
				new Set(group.contributing.map((topic) => topic.key)).size !==
					group.topicKeys.length ||
				group.contributing.some(
					(topic) =>
						!group.topicKeys.includes(topic.key) ||
						!kept.some(
							(current) =>
								current.key === topic.key &&
								current.name === topic.name,
						),
				),
		)
	) {
		throw new Error(
			"The grouping preview does not match your proposal. Refresh it before accepting changes.",
		);
	}
	return page;
}
