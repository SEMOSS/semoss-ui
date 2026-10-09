import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { makeReview } from "./topic-review.test-fixtures";
import {
	applyTopicReview,
	askTopicReview,
	draftWithChatChange,
	getTopicReview,
	previewTopicReach,
	type ReviewChatChange,
	reviewDraft,
	searchReviewPeople,
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
		const saved = await startTopicReview(actionsFor(wire));
		if ("pending" in saved) throw new Error("Expected a saved review");
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
			if ("pending" in saved) throw new Error("Expected a saved review");
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

it("accepts a pending topic-map job without inventing a saved review", async () => {
	const actions = actionsFor({
		exists: false,
		pending: true,
		job: {
			id: "map-1",
			kind: "topic_map",
			status: "running",
			progress: 25,
		},
	});
	expect(await startTopicReview(actions)).toMatchObject({
		pending: true,
		job: { id: "map-1", status: "running", progress: 25 },
	});
});

it("preserves staged area metadata and added people through editable drafts", async () => {
	const review = makeReview();
	review.draft.areas = [
		{
			key: "area-one",
			name: "Delivery",
			about: "Launch work",
			topicKeys: ["topic-1"],
			suggested: true,
			split: false,
			weight: 2,
			size: 1,
		},
	];
	Object.assign(review.draft.topics[0], {
		area: "area-one",
		own: { name: "Original topic" },
		suggestedTerms: ["launch"],
		addedPeople: ["p-3"],
		addedPeopleInfo: [{ id: "p-3", name: "Cy" }],
	});
	const saved = await getTopicReview(actionsFor({ exists: true, review }));
	if (!saved) throw new Error("Expected a review");
	expect(saved.draft.areas).toEqual(review.draft.areas);
	expect(saved.draft.topics[0]).toMatchObject({
		area: "area-one",
		own: { name: "Original topic" },
		suggestedTerms: ["launch"],
		addedPeopleInfo: [{ id: "p-3", name: "Cy" }],
	});
	expect(reviewDraft(saved).topics[0].addedPeople).toEqual(["p-3"]);
});

it("accepts skipped area children without requiring merge receipts", async () => {
	const review = makeReview();
	review.draft.topics[0].keep = false;
	review.draft.topics.push({
		...review.draft.topics[0],
		key: "child",
		id: "child-id",
		mergedIntoKey: "topic-1",
	});
	const receipt = structuredClone(review);
	receipt.appliedRevision = receipt.revision;
	receipt.draft.topics[1].mergedIntoKey = null;
	receipt.result = { topics: [], skipped: ["topic-1", "child-id"] };
	const saved = await getTopicReview(actionsFor({ exists: true, review }));
	if (!saved) throw new Error("Expected a review");
	expect(
		(
			await applyTopicReview(
				actionsFor({ exists: true, review: receipt }),
				saved,
			)
		).result.skipped,
	).toEqual(["topic-1", "child-id"]);
});

describe("current onboarding reactors", () => {
	it("sets a saved area using its current revision and checks the readback", async () => {
		const review = topicReviewSchema.parse(makeReview());
		review.draft.areas = [
			{
				key: "area-1",
				name: "Delivery",
				about: "",
				topicKeys: ["topic-1", "topic-2"],
				suggested: true,
				split: false,
				weight: 1,
				size: 2,
			},
		];
		const saved = structuredClone(review);
		saved.revision++;
		if (!saved.draft.areas) throw new Error("Missing areas");
		saved.draft.areas[0].split = true;
		const actions = actionsFor({ exists: true, review: saved });
		expect(await setTopicArea(actions, review, "area-1", true)).toEqual(
			saved,
		);
		expect(actions.run).toHaveBeenCalledWith(
			'BrainSetTopicArea(reviewId=["review-1"], revision=[1], area=["area-1"], split=[true]);',
		);
		await expect(
			setTopicArea(
				actionsFor({ exists: true, review }),
				review,
				"area-1",
				true,
			),
		).rejects.toThrow("could not be verified");
	});
	it("shares reach reads by selected IDs and account, retries failures and enforces the server limit", async () => {
		const result = { threads: 12, together: 4, samples: ["Launch"] };
		const actions = actionsFor(result);
		await Promise.all([
			previewTopicReach(actions, ["b", "a", "a"]),
			previewTopicReach(actions, ["a", "b"]),
		]);
		expect(actions.run).toHaveBeenCalledOnce();
		await previewTopicReach(actions, ["a", "b"], true);
		expect(actions.run).toHaveBeenCalledTimes(2);
		const other = actionsFor(result);
		await previewTopicReach(other, ["a", "b"]);
		expect(other.run).toHaveBeenCalledOnce();
		await expect(
			previewTopicReach(
				actions,
				Array.from({ length: 61 }, (_, i) => String(i)),
			),
		).rejects.toThrow("60 people");
		expect(await previewTopicReach(actions, [])).toEqual({
			threads: 0,
			together: 0,
			samples: [],
		});
		const failed = actionsFor({});
		await expect(previewTopicReach(failed, ["a"])).rejects.toThrow();
		await expect(previewTopicReach(failed, ["a"])).rejects.toThrow();
		expect(failed.run).toHaveBeenCalledTimes(2);
	});
	it("preserves people page totals and offsets without loading every contact", async () => {
		const actions = actionsFor({
			items: [{ id: "p-3", name: "New person" }],
			total: 51,
		});
		expect(await searchReviewPeople(actions, "New", 25)).toMatchObject({
			total: 51,
		});
		expect(actions.run).toHaveBeenCalledWith(
			'BrainListPeople(query=["New"], limit=[25], offset=[25]);',
		);
		await searchReviewPeople(actions, "New", 25);
		expect(actions.run).toHaveBeenCalledOnce();
		await expect(
			searchReviewPeople(actionsFor({ items: [], total: 2 }), "", 0),
		).rejects.toThrow("Retry this search");
	});
	it("bounds chat history and rejects proposals for another revision or unknown topic", async () => {
		const review = topicReviewSchema.parse(makeReview());
		const output = {
			reviewId: review.id,
			revision: review.revision,
			reply: "Consider this scope.",
			changes: [],
		};
		const actions = actionsFor(output);
		await askTopicReview(
			actions,
			review,
			Array.from({ length: 24 }, () => ({
				role: "owner" as const,
				text: "x".repeat(5000),
			})),
		);
		const statement = vi.mocked(actions.run).mock.calls[0][0] as string;
		const match = statement.match(/chat=(\[[\s\S]*\])\);$/);
		if (!match) throw new Error("Missing chat payload");
		const payload = JSON.parse(match[1])[0];
		expect(payload.messages).toHaveLength(20);
		expect(payload.messages[0].text).toHaveLength(4000);
		await expect(
			askTopicReview(actionsFor({ ...output, revision: 99 }), review, [
				{ role: "owner", text: "Hello" },
			]),
		).rejects.toThrow("do not match");
		await expect(
			askTopicReview(
				actionsFor({
					...output,
					changes: [{ ...chatChange(), topicKey: "missing" }],
				}),
				review,
				[{ role: "owner", text: "Hello" }],
			),
		).rejects.toThrow("do not match");
	});
	it("applies accepted profile proposals without losing original people or staged evidence", () => {
		const review = topicReviewSchema.parse(makeReview());
		review.draft.topics[0].addedPeople = ["p-3"];
		review.draft.topics[0].removedPeople = ["p-1"];
		const changed = draftWithChatChange(
			review,
			{
				...chatChange(),
				name: "New scope",
				addTerms: ["Launch", "launch"],
				addPeople: [
					{ id: "p-1", name: "Ana" },
					{ id: "p-4", name: "Dee" },
				],
				removePeople: [
					{ id: "p-3", name: "Added" },
					{ id: "p-2", name: "Bo" },
				],
			},
			"added-fixed",
		);
		expect(changed.topics[0]).toMatchObject({
			name: "New scope",
			addedPeople: ["p-4"],
			removedPeople: ["p-2"],
			terms: "Launch",
		});
		expect(review.draft.topics[0].name).toBe("Northwind Migration");
		expect(review.draft.topics[0].people).toHaveLength(2);
	});
	it("rejects compound proposals whose extra changes cannot be applied by that action", async () => {
		const review = topicReviewSchema.parse(makeReview());
		review.draft.topics.push({ ...review.draft.topics[0], key: "topic-2" });
		for (const change of [
			{
				...chatChange(),
				type: "combine",
				topicKeys: ["topic-1", "topic-2"],
				addPeople: [{ id: "p-3", name: "Casey" }],
			},
			{ ...chatChange(), type: "skip", name: "Also rename this" },
		]) {
			await expect(
				askTopicReview(
					actionsFor({
						reviewId: review.id,
						revision: review.revision,
						reply: "Review these changes",
						changes: [change],
					}),
					review,
					[{ role: "owner", text: "Help organize" }],
				),
			).rejects.toThrow("incompatible changes");
		}
	});
	it("supports add, keep and skip while protecting accepted topics and combinations", () => {
		const review = topicReviewSchema.parse(makeReview());
		const added = draftWithChatChange(
			review,
			{
				...chatChange(),
				type: "add_topic",
				topicKey: "",
				name: "Hiring",
			},
			"added-fixed",
		);
		expect(added.topics[1]).toMatchObject({
			key: "added-fixed",
			id: null,
			name: "Hiring",
			keep: true,
		});
		expect(
			draftWithChatChange(review, { ...chatChange(), type: "skip" }, "")
				.topics[0].keep,
		).toBe(false);
		expect(
			draftWithChatChange(review, { ...chatChange(), type: "keep" }, "")
				.topics[0].keep,
		).toBe(true);
		review.draft.topics[0].accepted = true;
		expect(() =>
			draftWithChatChange(review, { ...chatChange(), type: "skip" }, ""),
		).toThrow("already saved");
		expect(() =>
			draftWithChatChange(
				review,
				{ ...chatChange(), type: "combine" },
				"",
			),
		).toThrow("Preview");
	});
});

function chatChange(): ReviewChatChange {
	return {
		type: "edit_topic",
		topicKey: "topic-1",
		topicKeys: [],
		name: "",
		description: "",
		addTerms: [],
		addPeople: [],
		removePeople: [],
		reason: "Clarify the scope",
	};
}
