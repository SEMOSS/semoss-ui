import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { makeEvidence, wire } from "./topic-evidence.test-fixtures";
import {
	changeTopicReview,
	getTopicConversationContext,
	getTopicEvidence,
	topicReviewChangeSchema,
} from "./topic-evidence-api";
import { applyReceipt, makeReview } from "./topic-review.test-fixtures";
import { applyTopicReview, topicReviewSchema } from "./topic-review-api";

function actionsFor(output: unknown) {
	const run = vi.fn(async (_statement: string) => wire(output));
	return { actions: { run } as unknown as InsightActions, run };
}

describe("onboarding evidence transport", () => {
	it("reads versioned metadata without retaining unrequested message bodies", async () => {
		const review = topicReviewSchema.parse(makeReview());
		const page = makeEvidence(review);
		const session = actionsFor({
			...page,
			items: [{ ...page.items[0], body: "source-only body" }],
		});
		const saved = await getTopicEvidence(
			session.actions,
			review,
			"topic-1",
		);
		expect(saved).toEqual(page);
		expect(session.run.mock.calls[0][0]).toContain("limit=[20]");
		expect(JSON.stringify(saved)).not.toContain("source-only body");
	});

	it.each([
		{ reviewId: "another-review" },
		{ revision: 2 },
		{ topicKey: "another-topic" },
		{ offset: 20 },
	])(
		"rejects evidence returned for a different preview (%j)",
		async (mismatch) => {
			const review = topicReviewSchema.parse(makeReview());
			await expect(
				getTopicEvidence(
					actionsFor({ ...makeEvidence(review), ...mismatch })
						.actions,
					review,
					"topic-1",
				),
			).rejects.toThrow("do not match this topic review");
		},
	);

	it("accepts a bounded empty page after a refreshed search shrinks the result", async () => {
		const review = topicReviewSchema.parse(makeReview());
		const page = {
			...makeEvidence(review),
			items: [],
			total: 0,
			offset: 0,
		};
		expect(
			(
				await getTopicEvidence(
					actionsFor(page).actions,
					review,
					"topic-1",
					"unmatched",
					20,
				)
			).items,
		).toEqual([]);
	});

	it.each([
		{ threadIds: ["thread-1", "thread-1"], versions: { "thread-1": "v" } },
		{ threadIds: ["thread-1"], versions: {} },
		{ threadIds: ["thread-1"], versions: { "thread-1": "v", extra: "v" } },
		{ type: "move", targetKey: "topic-1" },
	])("requires an exact and distinct preview selection (%j)", (invalid) => {
		expect(
			topicReviewChangeSchema.safeParse({
				type: "confirm",
				topicKey: "topic-1",
				threadIds: ["thread-1"],
				versions: { "thread-1": "v" },
				...invalid,
			}).success,
		).toBe(false);
	});

	it("requires the same operation ID in the saved acknowledgement", async () => {
		const review = topicReviewSchema.parse(makeReview());
		const change = {
			type: "confirm" as const,
			topicKey: "topic-1",
			threadIds: ["thread-1"],
			versions: { "thread-1": "v" },
		};
		const changed = structuredClone(review);
		changed.revision += 1;
		changed.draft.operationIds = ["different-operation"];
		const session = actionsFor({ exists: true, review: changed });
		await expect(
			changeTopicReview(session.actions, review, "op-1", change),
		).rejects.toThrow("could not be confirmed");
		changed.draft.operationIds = ["op-1"];
		expect(
			(await changeTopicReview(session.actions, review, "op-1", change))
				.revision,
		).toBe(2);
		expect(session.run.mock.calls[1][0]).toContain('operationId=["op-1"]');
	});

	it("reads only five clean-text messages for the selected conversation", async () => {
		const context = {
			threadId: "thread-1",
			source: "email",
			messages: [
				{
					id: "m-1",
					at: "2023-10-12T09:00:00Z",
					text: "Certificate renewal",
				},
			],
			hiddenCount: 1,
			unavailableCount: 0,
			hasMore: true,
		};
		const session = actionsFor(context);
		expect(
			(await getTopicConversationContext(session.actions, "thread-1"))
				.messages[0].text,
		).toBe("Certificate renewal");
		expect(session.run.mock.calls[0][0]).toBe(
			'BrainGetThreadMessages(threadId=["thread-1"], limit=[5]);',
		);
		await expect(
			getTopicConversationContext(session.actions, "another-thread"),
		).rejects.toThrow("different conversation");
	});

	it.each([
		"missing",
		"wrong-source",
		"still-rejected",
		"wrong-primary",
	] as const)(
		"blocks completion when the relationship receipt is %s",
		async (failure) => {
			const review = makeReview();
			review.draft.corrections = [
				{
					threadId: "thread-1",
					topicKey: "topic-1",
					state: "include",
					primary: true,
				},
			];
			const applied = applyReceipt(review);
			applied.draft.corrections = [];
			applied.result.corrections =
				failure === "missing"
					? []
					: [
							{
								threadId: "thread-1",
								changes: review.draft.corrections,
								links: [
									{
										topicId: "topic-1",
										source:
											failure === "wrong-source"
												? "seed"
												: "you",
										confidence: 100,
										primary: failure !== "wrong-primary",
									},
								],
								rejectedTopicIds:
									failure === "still-rejected"
										? ["topic-1"]
										: [],
							},
						];
			await expect(
				applyTopicReview(
					actionsFor({ exists: true, review: applied }).actions,
					topicReviewSchema.parse(review),
				),
			).rejects.toThrow(
				"reviewed conversation links could not be verified",
			);
		},
	);

	it("verifies a durable exclusion from the applied receipt", async () => {
		const review = makeReview();
		review.draft.corrections = [
			{
				threadId: "thread-1",
				topicKey: "topic-1",
				state: "exclude",
				primary: false,
			},
		];
		const applied = applyReceipt(review);
		applied.draft.corrections = [];
		applied.result.corrections = [
			{
				threadId: "thread-1",
				changes: review.draft.corrections,
				links: [],
				rejectedTopicIds: ["topic-1"],
			},
		];
		expect(
			(
				await applyTopicReview(
					actionsFor({ exists: true, review: applied }).actions,
					topicReviewSchema.parse(review),
				)
			).appliedRevision,
		).toBe(1);
		applied.result.corrections[0].rejectedTopicIds = [];
		await expect(
			applyTopicReview(
				actionsFor({ exists: true, review: applied }).actions,
				topicReviewSchema.parse(review),
			),
		).rejects.toThrow("could not be verified");
	});
});
