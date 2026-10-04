import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { makeReview } from "./topic-review.test-fixtures";
import {
	getTopicReview,
	reviewDraft,
	startTopicReview,
} from "./topic-review-api";

function actionsFor(output: unknown): InsightActions {
	return {
		run: vi.fn(async () => ({
			pixelReturn: [{ output, operationType: ["MAP"] }],
		})),
	} as unknown as InsightActions;
}

describe("topic-review API serialization", () => {
	it("recognizes no saved review when the API omits its null field", async () => {
		expect(await getTopicReview(actionsFor({ exists: false }))).toBeNull();
	});

	it("normalizes omitted nullable draft and filing fields without weakening form validation", async () => {
		const review = makeReview();
		review.draft.topics[0].id = null;
		const wire = JSON.parse(
			JSON.stringify({ exists: true, review }, (_key, value) =>
				value === null ? undefined : value,
			),
		);
		const saved = await startTopicReview(actionsFor(wire));
		expect(saved.appliedRevision).toBeNull();
		expect(saved.filingJobId).toBeNull();
		expect(saved.filingJob).toBeNull();
		expect(saved.draft.topics[0].id).toBeNull();
		expect(reviewDraft(saved).topics[0].id).toBeNull();
	});

	it("rejects an empty or contradictory read instead of assuming an owner has no draft", async () => {
		await expect(getTopicReview(actionsFor({}))).rejects.toThrow(
			"unexpected shape",
		);
		await expect(
			getTopicReview(actionsFor({ exists: true })),
		).rejects.toThrow("unexpected shape");
	});

	it.each([null, undefined])(
		"loads the first draft before an apply result exists (%s)",
		async (result) => {
			const saved = await startTopicReview(
				actionsFor({
					exists: true,
					review: { ...makeReview(), result },
				}),
			);
			expect(saved.appliedRevision).toBeNull();
			expect(saved.result).toEqual({ topics: [], skipped: [] });
			expect(saved.draft.topics[0].name).toBe("Northwind Migration");
		},
	);

	it.each([null, undefined, {}])(
		"rejects an applied review with no confirmed receipt (%s)",
		async (result) => {
			await expect(
				getTopicReview(
					actionsFor({
						exists: true,
						review: { ...makeReview(), appliedRevision: 1, result },
					}),
				),
			).rejects.toThrow("unexpected shape");
		},
	);
});
