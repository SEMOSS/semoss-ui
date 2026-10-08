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
import { startTopicReview, type TopicReview } from "./topic-review-api";
import { TopicReviewForm } from "./topic-review-form";

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
	const handleLoad = useCallback((): void => {
		const ticket = ++request.current;
		setLoad({ actions, review: null, error: null });
		void startTopicReview(actions).then(
			(review) => {
				if (ticket === request.current)
					setLoad({ actions, review, error: null });
			},
			(cause: unknown) => {
				if (ticket === request.current)
					setLoad({ actions, review: null, error: message(cause) });
			},
		);
	}, [actions]);
	useEffect(() => {
		handleLoad();
		return () => {
			request.current += 1;
		};
	}, [handleLoad]);
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
			{current.error ? (
				<Failure error={current.error} onRetry={handleLoad} />
			) : (
				<LoadingCards label="Loading your topic review…" />
			)}
			<StepActions onBack={onBack}>
				<Button disabled>Keep 0 topics</Button>
			</StepActions>
		</>
	);
}
