import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import type { OnboardingStepProps } from "./onboarding-step-props";
import {
	Failure,
	LoadingCards,
	message,
	StepActions,
	StepHeader,
} from "./onboarding-ui";
import {
	getTopicReview,
	startTopicReview,
	type TopicReview,
} from "./topic-review-api";
import { TopicReviewForm } from "./topic-review-form";
import { useJob } from "./use-job";

interface ReviewLoad {
	actions: OnboardingStepProps["actions"];
	review: TopicReview | null;
	error: string | null;
}

/** Initialize or resume the server draft before mounting its form. */
export function TopicsStep(props: OnboardingStepProps) {
	const { actions, onBack, eyebrow } = props;
	const [load, setLoad] = useState<ReviewLoad>({
		actions,
		review: null,
		error: null,
	});
	const request = useRef(0);
	const {
		job,
		follow,
		error: jobError,
		refresh: refreshJob,
	} = useJob(actions, "topic_map", "");
	const handleLoad = useCallback((): void => {
		const ticket = ++request.current;
		setLoad({ actions, review: null, error: null });
		void startTopicReview(actions).then(
			(result) => {
				if (ticket !== request.current) return;
				if ("pending" in result) follow(result.job);
				else setLoad({ actions, review: result, error: null });
			},
			(cause: unknown) => {
				if (ticket === request.current)
					setLoad({ actions, review: null, error: message(cause) });
			},
		);
	}, [actions, follow]);
	useEffect(() => {
		handleLoad();
		return () => {
			request.current += 1;
		};
	}, [handleLoad]);
	useEffect(() => {
		if (job?.status !== "done") return;
		const ticket = ++request.current;
		void getTopicReview(actions)
			.then((review) => {
				if (!review)
					throw new Error(
						"The job finished without a saved review. Try loading it again.",
					);
				if (ticket === request.current)
					setLoad({ actions, review, error: null });
			})
			.catch((cause: unknown) => {
				if (ticket === request.current)
					setLoad({ actions, review: null, error: message(cause) });
			});
		return () => {
			request.current++;
		};
	}, [actions, job]);
	const current =
		load.actions === actions ? load : { review: null, error: null };
	if (current.review)
		return (
			<TopicReviewForm
				key={current.review.id}
				{...props}
				initialReview={current.review}
			/>
		);
	return (
		<>
			<StepHeader eyebrow={eyebrow} title="What your work is about">
				Load your saved review or find initial topic suggestions.
			</StepHeader>
			{current.error || jobError || job?.status === "failed" ? (
				<Failure
					error={
						current.error ||
						jobError ||
						job?.error ||
						"Topic review could not be prepared."
					}
					onRetry={jobError ? refreshJob : handleLoad}
				/>
			) : (
				<LoadingCards
					label={
						job?.status === "running"
							? `Preparing your topics… ${job.progress}%`
							: "Loading your topic review…"
					}
				/>
			)}
			<StepActions onBack={onBack}>
				<Button disabled>Keep 0 topics</Button>
			</StepActions>
		</>
	);
}
