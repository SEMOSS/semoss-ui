import { useEffect, useRef, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { InsightActions } from "@/lib/pixel";
import { pixel } from "@/lib/pixel";
import type { Job } from "./onboarding-api";
import { message } from "./onboarding-ui";
import {
	applyTopicReview,
	optionalReviewResponseSchema,
	type TopicReview,
} from "./topic-review-api";
import { useJob } from "./use-job";

interface TopicFilingController {
	review: TopicReview | null;
	job: Job | null;
	isLoading: boolean;
	isRetrying: boolean;
	ready: boolean;
	partial: boolean;
	error: string | null;
	canRetryFiling: boolean;
	retryFiling: () => Promise<void>;
	refresh: () => void;
}

interface RetryState {
	actions: InsightActions;
	reviewId: string | null;
	revision: number | null;
	pending: boolean;
	error: string | null;
}

/** Completion belongs to an applied review and its exact job, never the latest classify job. */
export function useTopicFiling(actions: InsightActions): TopicFilingController {
	const read = usePixel<unknown>(pixel("BrainGetTopicReview"));
	const parsed =
		read.status === "SUCCESS"
			? optionalReviewResponseSchema.safeParse(read.data)
			: null;
	const review = parsed?.success ? parsed.data.review : null;
	const applied = !!review && review.appliedRevision === review.revision;
	const {
		job,
		error: jobError,
		isLoading: jobLoading,
		follow,
		refresh: refreshJob,
	} = useJob(
		actions,
		"classify",
		applied ? (review.filingJobId ?? "") : "",
		"topics",
	);
	const retryScope = {
		actions,
		reviewId: review?.id ?? null,
		revision: review?.revision ?? null,
	};
	const scope = useRef(retryScope);
	scope.current = retryScope;
	const request = useRef(0);
	useEffect(
		() => () => {
			request.current += 1;
		},
		[],
	);
	const [retry, setRetry] = useState<RetryState>({
		...retryScope,
		pending: false,
		error: null,
	});
	const currentRetry =
		retry.actions === actions &&
		retry.reviewId === retryScope.reviewId &&
		retry.revision === retryScope.revision;
	const isRetrying = currentRetry && retry.pending;
	const retryError = currentRetry ? retry.error : null;
	const noTopics = applied && review.result.topics.length === 0;
	const matches =
		!!review &&
		!!job &&
		job.id === review.filingJobId &&
		job.mode === "topics" &&
		job.reviewId === review.id &&
		job.reviewRevision === review.appliedRevision;
	const failures =
		typeof job?.counts.errors === "number" &&
		Number.isInteger(job.counts.errors) &&
		job.counts.errors >= 0
			? job.counts.errors
			: null;
	const partial =
		matches && job.status === "done" && failures !== null && failures > 0;
	const isLoading =
		read.status === "INITIAL" || read.status === "LOADING" || jobLoading;
	let error: string | null = null;
	if (read.status === "ERROR")
		error =
			read.error?.message || "Your saved topic review could not be read.";
	else if (parsed && !parsed.success)
		error =
			"Your saved topic review could not be read. Retry to check it again.";
	else if (read.status === "SUCCESS" && !review)
		error =
			"No saved topic review was found. Go back to choose your topics.";
	else if (review && !applied)
		error =
			"Your topic review has unapplied changes. Go back to review and save them.";
	else if (applied && !noTopics && !review.filingJobId)
		error =
			"Your topics are saved, but filing has not started. Retry filing to continue.";
	else if (jobError) error = jobError;
	else if (job && !matches)
		error =
			"This filing job does not belong to your saved topic review. Retry to check the saved result.";
	else if (job?.status === "failed")
		error = job.error || "Your topics are saved, but filing stopped.";
	else if (partial)
		error = `${failures} ${failures === 1 ? "thread could" : "threads could"} not be filed. Your saved topics and completed results are available; retry the remaining threads.`;
	else if (matches && job.status === "done" && failures === null)
		error =
			"Filing finished, but its result could not be confirmed. Retry filing to check the remaining threads.";
	const ready =
		!isLoading &&
		!error &&
		!retryError &&
		!isRetrying &&
		(noTopics || (matches && job.status === "done" && failures === 0));
	const canRetryFiling =
		applied &&
		!noTopics &&
		!isLoading &&
		job?.status !== "running" &&
		(!review.filingJobId ||
			(matches &&
				(job.status === "failed" ||
					partial ||
					(job.status === "done" && failures === null))));

	const retryFiling = async (): Promise<void> => {
		if (!review || isRetrying) return;
		const ticket = ++request.current;
		const current = (): boolean =>
			ticket === request.current &&
			scope.current.actions === actions &&
			scope.current.reviewId === review.id &&
			scope.current.revision === review.revision;
		setRetry({ ...retryScope, pending: true, error: null });
		try {
			const saved = await applyTopicReview(actions, review, true);
			if (!current()) return;
			if (saved.filingJob) follow(saved.filingJob);
			read.refresh();
		} catch (cause: unknown) {
			if (current())
				setRetry({
					...retryScope,
					pending: false,
					error: message(cause),
				});
		} finally {
			if (ticket === request.current)
				setRetry((previous) => ({ ...previous, pending: false }));
		}
	};
	const refresh = (): void => {
		request.current += 1;
		setRetry({ ...retryScope, pending: false, error: null });
		read.refresh();
		refreshJob();
	};
	return {
		review,
		job,
		isLoading,
		isRetrying,
		ready,
		partial,
		error: retryError || error,
		canRetryFiling,
		retryFiling,
		refresh,
	};
}
