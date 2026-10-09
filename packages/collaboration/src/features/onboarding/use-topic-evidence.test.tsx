import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { makeEvidence, wire } from "./topic-evidence.test-fixtures";
import { deferred, makeReview } from "./topic-review.test-fixtures";
import { topicReviewSchema } from "./topic-review-api";
import { useTopicEvidence } from "./use-topic-evidence";

afterEach(cleanup);

describe("topic evidence scope", () => {
	it.each(["topic", "owner"] as const)(
		"discards a late preview from a previous %s",
		async (scope) => {
			const review = topicReviewSchema.parse(makeReview());
			const late = deferred<ReturnType<typeof wire>>();
			const old = {
				run: vi.fn(() => late.promise),
			} as unknown as InsightActions;
			const current = {
				run: vi.fn(async () =>
					wire(
						makeEvidence(
							review,
							scope === "topic" ? "topic-2" : "topic-1",
						),
					),
				),
			} as unknown as InsightActions;
			const view = renderHook(
				({ actions, topic }) =>
					useTopicEvidence(actions, review, topic, "", 0),
				{ initialProps: { actions: old, topic: "topic-1" } },
			);
			view.rerender({
				actions: current,
				topic: scope === "topic" ? "topic-2" : "topic-1",
			});
			await waitFor(() =>
				expect(view.result.current.isLoading).toBe(false),
			);
			await act(async () =>
				late.resolve(
					wire({
						...makeEvidence(review),
						items: [
							{
								...makeEvidence(review).items[0],
								subject: "Old owner's example",
							},
						],
					}),
				),
			);
			expect(view.result.current.page?.items[0].subject).toBe(
				"TLS certificate renewal",
			);
		},
	);

	it("retains the current page with disabled actions while its newer revision is loading", async () => {
		const review = topicReviewSchema.parse(makeReview());
		const later = deferred<ReturnType<typeof wire>>();
		const run = vi.fn(async () => wire(makeEvidence(review)));
		const actions = { run } as unknown as InsightActions;
		const view = renderHook(
			({ revision }) =>
				useTopicEvidence(actions, revision, "topic-1", "", 0),
			{ initialProps: { revision: review } },
		);
		await waitFor(() => expect(view.result.current.page).not.toBeNull());
		run.mockImplementationOnce(() => later.promise);
		const changed = { ...review, revision: 2 };
		view.rerender({ revision: changed });
		expect(view.result.current.isLoading).toBe(true);
		expect(view.result.current.page?.revision).toBe(1);
		await act(async () => later.resolve(wire(makeEvidence(changed))));
		expect(view.result.current.page?.revision).toBe(2);
		expect(view.result.current.isLoading).toBe(false);
	});
});
