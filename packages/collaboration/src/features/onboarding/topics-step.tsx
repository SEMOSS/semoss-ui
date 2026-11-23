import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, P, Progress } from "@semoss/ui/next";
import type { OnboardingStepProps } from "./onboarding-step-props";
import {
	Failure,
	LoadingCards,
	message,
	StepActions,
	StepHeader,
} from "./onboarding-ui";
import { TopicFlow } from "./topic-flow";
import { startTopicReview, type TopicReview } from "./topic-review-api";
import { useJob } from "./use-job";

// what the topic job is doing, in the owner's words
const MAP_STEPS: Record<string, string> = {
	queued: "Getting started",
	reading: "Reading your conversations",
	grouping: "Grouping related conversations",
	naming: "Naming each group",
	saving: "Naming each group",
	areas: "Finding your main areas of work",
};

interface ReviewLoad {
	actions: OnboardingStepProps["actions"];
	review: TopicReview | null;
	jobId: string;
	error: string | null;
}

/** Resume the saved draft, or wait for the background job that groups and names topics. */
export function TopicsStep(props: OnboardingStepProps) {
	const { actions, onBack, eyebrow } = props;
	const [load, setLoad] = useState<ReviewLoad>({
		actions,
		review: null,
		jobId: "",
		error: null,
	});
	const request = useRef(0);
	const handleLoad = useCallback((): void => {
		const ticket = ++request.current;
		setLoad({ actions, review: null, jobId: "", error: null });
		void startTopicReview(actions).then(
			(result) => {
				if (ticket === request.current)
					setLoad({
						actions,
						review: result.review,
						jobId: result.job?.id ?? "",
						error: null,
					});
			},
			(cause: unknown) => {
				if (ticket === request.current)
					setLoad({
						actions,
						review: null,
						jobId: "",
						error: message(cause),
					});
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
		load.actions === actions
			? load
			: { review: null, jobId: "", error: null };
	const { job } = useJob(actions, "topic_map", current.jobId);
	const isReady =
		!!current.jobId && job?.id === current.jobId && job.status === "done";
	// the draft is saved by the time its job is done
	useEffect(() => {
		if (isReady) handleLoad();
	}, [isReady, handleLoad]);

	if (current.review)
		return (
			<TopicFlow
				key={current.review.id}
				{...props}
				initialReview={current.review}
				onRestart={handleLoad}
			/>
		);
	const failed = job?.id === current.jobId && job.status === "failed";
	const found = Array.isArray(job?.counts.found)
		? (job.counts.found as unknown[]).filter(
				(name): name is string => typeof name === "string",
			)
		: [];
	const conversations = Number(job?.counts.conversations ?? 0);
	return (
		<>
			<StepHeader eyebrow={eyebrow} title="Finding your topics">
				Brain groups your recent conversations, names each group and
				then finds your main areas of work. This usually takes under a
				minute.
			</StepHeader>
			{current.error || failed ? (
				<Failure
					error={
						current.error ||
						job?.error ||
						"Topic suggestions stopped. Try again."
					}
					onRetry={handleLoad}
				/>
			) : current.jobId && job?.status === "running" ? (
				<div className="flex flex-col gap-4">
					<div className="space-y-2">
						<div className="flex items-baseline justify-between gap-2 text-sm">
							<P className="font-medium">
								{MAP_STEPS[job.step] ?? "Working"}
							</P>
							{conversations > 0 && (
								<P className="text-muted-foreground">
									{conversations} conversations
								</P>
							)}
						</div>
						<Progress value={job.progress} />
					</div>
					{found.length > 0 && (
						<div className="space-y-2">
							<P className="text-muted-foreground text-sm">
								Found so far
							</P>
							<ul className="flex flex-wrap gap-2">
								{found.map((name) => (
									<li key={name}>
										<Badge
											variant="secondary"
											className="fade-in-0 animate-in duration-300 motion-reduce:animate-none"
										>
											{name}
										</Badge>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			) : (
				<LoadingCards label="Loading your topics..." />
			)}
			<StepActions onBack={onBack}>
				<Button disabled>Next</Button>
			</StepActions>
		</>
	);
}
