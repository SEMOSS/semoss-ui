import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { FilingStep } from "./filing-step";
import {
	applyReceipt,
	deferred,
	filingJob,
	makeReview,
	type ReviewWire,
} from "./topic-review.test-fixtures";

const read = vi.hoisted(() => ({
	status: "SUCCESS",
	data: undefined as unknown,
	error: undefined as Error | undefined,
	refresh: vi.fn(),
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	usePixel: () => read,
}));

function session(review: ReviewWire) {
	read.data = { exists: true, review };
	const run = vi.fn(async (statement: string) => {
		let output: unknown;
		if (statement.startsWith("BrainGetJob(")) output = review.filingJob;
		else if (statement.startsWith("BrainApplyTopicReview(")) {
			review.filingJob = {
				...filingJob(review, "running"),
				id: "job-retry",
			};
			review.filingJobId = "job-retry";
			output = { exists: true, review };
		} else if (statement === "BrainFinishSetup();") output = {};
		else throw new Error(`Unexpected request: ${statement}`);
		return { pixelReturn: [{ output, operationType: ["MAP"] }] };
	});
	return { actions: { run } as unknown as InsightActions, run };
}
const view = (actions: InsightActions) => (
	<FilingStep
		actions={actions}
		onBack={vi.fn()}
		onNext={vi.fn()}
		eyebrow="Step 8 of 8"
	/>
);

beforeEach(() => {
	read.status = "SUCCESS";
	read.error = undefined;
	read.refresh.mockReset();
});
afterEach(() => {
	cleanup();
	window.location.hash = "";
});

describe("onboarding completion", () => {
	it("keeps Open Work disabled while the saved review is loading", () => {
		const source = session(applyReceipt(makeReview()));
		read.status = "LOADING";
		render(view(source.actions));
		expect(
			screen.getByRole("button", { name: "Open Work" }),
		).toBeDisabled();
		expect(
			screen.queryByRole("heading", { name: "Your Work is ready" }),
		).not.toBeInTheDocument();
		expect(source.run).not.toHaveBeenCalled();
	});

	it("checks the exact filing job and shows the saved canonical name and description", async () => {
		const review = applyReceipt(makeReview("Recruiting UNC and VCU"));
		const source = session(review);
		render(view(source.actions));
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Open Work" }),
			).toBeEnabled(),
		);
		expect(source.run).toHaveBeenCalledExactlyOnceWith(
			'BrainGetJob(kind=["classify"], jobId=["job-1"], mode=["topics"]);',
		);
		expect(screen.getByText("Recruiting UNC and VCU")).toBeVisible();
		expect(
			screen.getByText("Moving Northwind to the new platform."),
		).toBeVisible();
	});

	it("records that setup is done when the owner opens Work", async () => {
		const source = session(applyReceipt(makeReview()));
		const user = userEvent.setup();
		render(view(source.actions));
		const open = screen.getByRole("button", { name: "Open Work" });
		await waitFor(() => expect(open).toBeEnabled());
		await user.click(open);
		await waitFor(() => expect(window.location.hash).toBe("#/work"));
		expect(source.run).toHaveBeenCalledWith("BrainFinishSetup();");
	});

	it.each(["failed", "wrong-review", "wrong-mode", "missing-summary"])(
		"does not show readiness for a %s filing result",
		async (problem) => {
			const review = applyReceipt(makeReview());
			const job = filingJob(
				review,
				problem === "failed" ? "failed" : "done",
			);
			if (problem === "wrong-review")
				job.params.reviewId = "unrelated-review";
			if (problem === "wrong-mode") job.params.mode = "sort";
			if (problem === "missing-summary") job.counts = {};
			review.filingJob = job;
			const source = session(review);
			render(view(source.actions));
			expect(await screen.findByRole("alert")).toBeVisible();
			expect(
				screen.getByRole("button", { name: "Open Work" }),
			).toBeDisabled();
			expect(
				screen.queryByRole("heading", { name: "Your Work is ready" }),
			).not.toBeInTheDocument();
		},
	);

	it("lets a partial filing result open Work while its failures stay retryable", async () => {
		const review = applyReceipt(makeReview());
		review.filingJob = filingJob(review, "done", 1);
		render(view(session(review).actions));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"1 thread could not be filed. You can open Work now, or retry it.",
		);
		expect(
			screen.getByRole("heading", { name: "Your Work is ready" }),
		).toBeVisible();
		expect(screen.getByRole("button", { name: "Open Work" })).toBeEnabled();
		expect(
			screen.getByRole("button", { name: "Retry filing" }),
		).toBeEnabled();
	});

	it("completes a saved zero-topic review without adopting an unrelated job", async () => {
		const review = makeReview();
		review.draft.topics = [];
		const source = session(applyReceipt(review));
		render(view(source.actions));
		expect(
			await screen.findByRole("heading", {
				name: "Setup saved without topics",
			}),
		).toBeVisible();
		expect(screen.getByRole("button", { name: "Open Work" })).toBeEnabled();
		expect(source.run).not.toHaveBeenCalled();
	});

	it("retries filing for the same applied review without writing topic profiles again", async () => {
		const review = applyReceipt(makeReview());
		review.filingJob = filingJob(review, "done", 1);
		const source = session(review);
		const user = userEvent.setup();
		render(view(source.actions));
		await user.click(
			await screen.findByRole("button", { name: "Retry filing" }),
		);
		await waitFor(() =>
			expect(source.run).toHaveBeenCalledWith(
				'BrainApplyTopicReview(reviewId=["review-1"], revision=[1], retryFiling=[true]);',
			),
		);
		await waitFor(() =>
			expect(source.run).toHaveBeenCalledWith(
				'BrainGetJob(kind=["classify"], jobId=["job-retry"], mode=["topics"]);',
			),
		);
		expect(
			screen.getByRole("button", { name: "Open Work" }),
		).toBeDisabled();
		expect(
			source.run.mock.calls.some(([statement]) =>
				statement.startsWith("BrainSaveTopic"),
			),
		).toBe(false);
	});

	it.each(["missing", "unapplied"])(
		"does not claim topics are saved for a %s review",
		async (problem) => {
			const source = session(makeReview());
			if (problem === "missing") read.data = { exists: false };
			render(view(source.actions));
			expect(await screen.findByRole("alert")).toBeVisible();
			expect(
				screen.getByRole("heading", { name: "Check your topic setup" }),
			).toBeVisible();
			expect(
				screen.getByRole("button", { name: "Open Work" }),
			).toBeDisabled();
			expect(source.run).not.toHaveBeenCalled();
		},
	);

	it.each(["success", "failure"])(
		"ignores a late retry %s when another insight has become active",
		async (outcome) => {
			const review = applyReceipt(makeReview());
			review.filingJob = filingJob(review, "done", 1);
			const source = session(review);
			const user = userEvent.setup();
			const { rerender } = render(view(source.actions));
			const retryButton = await screen.findByRole("button", {
				name: "Retry filing",
			});
			const pending = deferred<Awaited<ReturnType<typeof source.run>>>();
			source.run.mockImplementationOnce(() => pending.promise);
			await user.click(retryButton);
			expect(retryButton).toBeDisabled();

			const nextReview = makeReview("Current owner's topics");
			nextReview.id = "review-current";
			const next = session(applyReceipt(nextReview));
			rerender(view(next.actions));
			await waitFor(() =>
				expect(
					screen.getByRole("button", { name: "Open Work" }),
				).toBeEnabled(),
			);
			await act(async () => {
				if (outcome === "failure")
					pending.reject(new Error("Old retry failed"));
				else {
					review.filingJob = {
						...filingJob(review, "running"),
						id: "old-retry",
					};
					review.filingJobId = "old-retry";
					pending.resolve({
						pixelReturn: [
							{
								output: { exists: true, review },
								operationType: ["MAP"],
							},
						],
					});
				}
			});
			expect(
				screen.getByRole("button", { name: "Open Work" }),
			).toBeEnabled();
			expect(screen.getByText("Current owner's topics")).toBeVisible();
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			expect(read.refresh).not.toHaveBeenCalled();
			expect(next.run).toHaveBeenCalledTimes(1);
		},
	);
});
