import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { topicClues, topicCluesSchema } from "./topic-clues";
import {
	organizationPreview,
	organizationProposal,
	organizationReview,
	packet,
} from "./topic-organization.test-fixtures";
import {
	previewTopicOrganization,
	suggestTopicOrganization,
} from "./topic-organization-api";
import { topicOrganizationGroupsSchema } from "./topic-organization-schema";
import { topicReviewSchema } from "./topic-review-api";

function transport(output: unknown): InsightActions {
	return {
		run: vi.fn(async () => packet(output)),
	} as unknown as InsightActions;
}

describe("topic organization contracts", () => {
	it.each([
		"owner",
		"revision",
		"missing",
		"invented",
		"duplicate",
		"count",
		"target",
	])(
		"rejects an assistant proposal with invalid %s data",
		async (problem) => {
			const review = organizationReview();
			const proposal = organizationProposal(review);
			if (problem === "owner") proposal.reviewId = "other-owner-review";
			if (problem === "revision") proposal.revision += 1;
			if (problem === "missing") proposal.groups.pop();
			if (problem === "invented")
				proposal.groups[0].topicKeys[1] = "unknown-topic";
			if (problem === "duplicate")
				proposal.groups[1].topicKeys = [
					proposal.groups[0].topicKeys[0],
				];
			if (problem === "count") proposal.proposedCount = 20;
			if (problem === "target")
				proposal.groups[0].targetKey = proposal.groups[1].targetKey;
			await expect(
				suggestTopicOrganization(
					transport(proposal),
					topicReviewSchema.parse(review),
				),
			).rejects.toThrow();
		},
	);

	it.each(["revision", "count", "profile", "contributor", "impact"])(
		"rejects a grouping preview with invalid %s data",
		async (problem) => {
			const review = organizationReview();
			const groups = topicOrganizationGroupsSchema.parse(
				organizationProposal(review).groups,
			);
			const preview = organizationPreview(review, groups);
			if (problem === "revision") preview.revision += 1;
			if (problem === "count") preview.afterCount += 1;
			if (problem === "profile")
				preview.groups[0].name = "Unexpected rename";
			if (problem === "contributor")
				preview.groups[0].contributing[0].name = "Outdated profile";
			if (problem === "impact") preview.groups[0].impact.workItems = -1;
			await expect(
				previewTopicOrganization(
					transport(preview),
					topicReviewSchema.parse(review),
					groups,
				),
			).rejects.toThrow();
		},
	);

	it("allows an exact read-only proposal and preview without issuing a draft change", async () => {
		const review = organizationReview();
		const proposal = organizationProposal(review);
		const actions = transport(proposal);
		expect(
			await suggestTopicOrganization(
				actions,
				topicReviewSchema.parse(review),
			),
		).toEqual(proposal);
		expect(actions.run).toHaveBeenCalledOnce();
		const groups = topicOrganizationGroupsSchema.parse(proposal.groups);
		const preview = organizationPreview(review, groups);
		expect(
			await previewTopicOrganization(
				transport(preview),
				topicReviewSchema.parse(review),
				groups,
			),
		).toEqual(preview);
	});

	it("rejects overlapping groups rather than accepting two destinations for the same topic", () => {
		const proposal = organizationProposal(organizationReview());
		proposal.groups[1].topicKeys.push(proposal.groups[0].topicKeys[0]);
		expect(
			topicOrganizationGroupsSchema.safeParse(proposal.groups).success,
		).toBe(false);
	});

	it("validates distinctive clue limits and deduplicates case variants across supported line separators", () => {
		expect(topicClues(" UNC \r\nunc\u2028VCU\n\n")).toEqual(["UNC", "VCU"]);
		expect(topicCluesSchema.safeParse("a".repeat(201)).success).toBe(false);
		expect(
			topicCluesSchema.safeParse(
				Array.from(
					{ length: 51 },
					(_, index) => `client ${index}`,
				).join("\n"),
			).success,
		).toBe(false);
		expect(
			topicCluesSchema.safeParse("UNC\nunc\n".repeat(30)).success,
		).toBe(true);
	});
});
