import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import {
	applyReceipt,
	makeAreaReview,
	makeReview,
	topicMapJob,
} from "./topic-review.test-fixtures";
import {
	applyTopicReview,
	getTopicReview,
	reviewDraft,
	setTopicArea,
	startTopicReview,
	topicReviewSchema,
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
		const started = await startTopicReview(actionsFor(wire));
		const saved = started.review;
		if (!saved) throw new Error("Expected a saved draft");
		expect(started.job).toBeNull();
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
			const saved = (
				await startTopicReview(
					actionsFor({
						exists: true,
						review: { ...makeReview(), result },
					}),
				)
			).review;
			if (!saved) throw new Error("Expected a saved draft");
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
	it("fills in the area fields an older draft leaves out", async () => {
		const review = makeReview();
		const [topic] = review.draft.topics;
		const wire = {
			exists: true,
			review: {
				...review,
				draft: {
					...review.draft,
					areas: [
						{ key: "area-1", name: "Work", topicKeys: ["topic-1"] },
					],
					topics: [
						{
							...topic,
							area: undefined,
							own: undefined,
							youWrote: undefined,
							vipThreads: undefined,
						},
					],
				},
			},
		};
		const saved = (await startTopicReview(actionsFor(wire))).review;
		if (!saved) throw new Error("Expected a saved draft");
		expect(saved.draft.areas).toEqual([
			{
				key: "area-1",
				name: "Work",
				about: "",
				topicKeys: ["topic-1"],
				suggested: false,
				split: false,
			},
		]);
		expect(saved.draft.topics[0]).toMatchObject({
			youWrote: 0,
			vipThreads: 0,
		});
		expect(saved.draft.topics[0].area ?? null).toBeNull();
		expect(saved.draft.topics[0].own ?? null).toBeNull();
	});

	it("keeps an area's counts and its first topic's own name", async () => {
		const review = makeAreaReview();
		review.draft.topics[0].youWrote = 4;
		review.draft.topics[0].vipThreads = 2;
		const saved = (
			await startTopicReview(actionsFor({ exists: true, review }))
		).review;
		expect(saved?.draft.topics[0]).toMatchObject({
			name: "Recruiting",
			own: { name: "UNC Recruiting" },
			area: "area-1",
			youWrote: 4,
			vipThreads: 2,
		});
		expect(saved?.draft.areas).toHaveLength(7);
		expect(saved?.draft.areas[0].topicKeys).toEqual(["topic-1", "topic-2"]);
	});

	it("returns the background job while the draft is still being built", async () => {
		const job = {
			...topicMapJob("running", "naming", ["Hiring"]),
			error: undefined,
		};
		const started = await startTopicReview(
			actionsFor({ exists: false, pending: true, job }),
		);
		expect(started.review).toBeNull();
		expect(started.job).toMatchObject({
			id: "map-1",
			status: "running",
			step: "naming",
			progress: 40,
			counts: { found: ["Hiring"], conversations: 120 },
		});
	});

	it.each([
		["no draft and no job", { exists: false }],
		["a draft flag without a draft", { exists: true }],
		["a pending flag without a job", { exists: false, pending: true }],
		[
			"a job with an unknown status",
			{ exists: false, job: { id: "map-1", status: "paused" } },
		],
	])("rejects a start that has %s", async (_name, output) => {
		await expect(startTopicReview(actionsFor(output))).rejects.toThrow(
			"unexpected shape",
		);
	});

	it("shares one start request in flight, and asks again afterwards", async () => {
		const actions = actionsFor({ exists: true, review: makeReview() });
		const [first, second] = await Promise.all([
			startTopicReview(actions),
			startTopicReview(actions),
		]);
		expect(first).toBe(second);
		expect(actions.run).toHaveBeenCalledOnce();
		await startTopicReview(actions);
		expect(actions.run).toHaveBeenCalledTimes(2);
	});

	it("asks the server to keep an area's topics separate and returns the new draft", async () => {
		const review = topicReviewSchema.parse(makeAreaReview());
		const regrouped = makeAreaReview();
		regrouped.revision = 2;
		regrouped.draft.areas[0].split = true;
		const actions = actionsFor({ exists: true, review: regrouped });
		const next = await setTopicArea(actions, review, "area-1", true);
		expect(actions.run).toHaveBeenCalledExactlyOnceWith(
			'BrainSetTopicArea(reviewId=["review-1"], revision=[1], area=["area-1"], split=[true]);',
		);
		expect(next.revision).toBe(2);
		expect(next.draft.areas[0].split).toBe(true);
		await setTopicArea(actions, review, "area-1", false);
		expect(vi.mocked(actions.run).mock.calls[1][0]).toContain(
			"split=[false]",
		);
	});

	it("does not accept a regroup answer without a draft", async () => {
		const review = topicReviewSchema.parse(makeAreaReview());
		await expect(
			setTopicArea(actionsFor({ exists: false }), review, "area-1", true),
		).rejects.toThrow("unexpected shape");
	});
});

describe("topic-review apply verification with areas", () => {
	function appliedWith(
		mutate: (review: ReturnType<typeof makeAreaReview>) => void,
	) {
		const review = makeAreaReview();
		mutate(review);
		return { review, applied: applyReceipt(review) };
	}

	it("expects a merge receipt for a part whose area is kept", async () => {
		const { review, applied } = appliedWith(() => undefined);
		expect(applied.result.merges).toHaveLength(1);
		const saved = await applyTopicReview(
			actionsFor({ exists: true, review: applied }),
			topicReviewSchema.parse(review),
		);
		expect(saved.appliedRevision).toBe(1);
		delete applied.result.merges;
		await expect(
			applyTopicReview(
				actionsFor({ exists: true, review: applied }),
				topicReviewSchema.parse(review),
			),
		).rejects.toThrow("combinations could not be verified");
	});

	it("does not expect a merge for a part whose area target is skipped", async () => {
		const { review, applied } = appliedWith((draft) => {
			const [first] = draft.draft.topics;
			first.keep = false;
		});
		// the part is skipped with its area, so there is nothing to merge
		expect(applied.result.merges).toBeUndefined();
		expect(applied.result.topics.map((topic) => topic.key)).toEqual([
			"topic-3",
			"topic-4",
			"topic-5",
			"topic-6",
		]);
		const saved = await applyTopicReview(
			actionsFor({ exists: true, review: applied }),
			topicReviewSchema.parse(review),
		);
		expect(saved.result.merges).toBeUndefined();
		expect(saved.result.topics).toHaveLength(4);
	});

	it("still checks each kept topic's saved name against the review", async () => {
		const { review, applied } = appliedWith(() => undefined);
		applied.result.topics[1].name = "Something else";
		await expect(
			applyTopicReview(
				actionsFor({ exists: true, review: applied }),
				topicReviewSchema.parse(review),
			),
		).rejects.toThrow("do not match your review");
	});
});
