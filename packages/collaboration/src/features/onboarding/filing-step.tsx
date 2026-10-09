import { ArrowRight } from "lucide-react";
import { Badge, Button, Spinner } from "@semoss/ui/next";
import type { OnboardingStepProps } from "./onboarding-step-props";
import {
	Failure,
	formatCount,
	LoadingCards,
	ProgressRing,
	StepActions,
	StepHeader,
} from "./onboarding-ui";
import { useTopicFiling } from "./use-topic-filing";

/** Show the saved topic profiles and the confirmed filing result before opening Home. */
export function FilingStep({ actions, onBack, eyebrow }: OnboardingStepProps) {
	const {
		review,
		job,
		isLoading,
		isRetrying,
		ready,
		partial,
		error,
		canRetryFiling,
		retryFiling,
		refresh,
	} = useTopicFiling(actions);
	const running = job?.status === "running";
	const noTopics =
		review?.appliedRevision === review?.revision &&
		review?.result.topics.length === 0;
	const counts = job?.counts.topics;
	const topics =
		counts && typeof counts === "object"
			? (counts as Record<string, unknown>)
			: {};
	const title = ready
		? noTopics
			? "Setup saved without topics"
			: "Your tasks are ready"
		: partial
			? "Some threads still need filing"
			: running
				? "Filing your mail"
				: isLoading
					? "Checking your saved setup"
					: review?.appliedRevision === review?.revision && review
						? "Your topics are saved"
						: "Check your topic setup";
	const finish = (): void => {
		if (!ready) return;
		window.location.hash = "#/";
		window.location.reload();
	};
	return (
		<>
			<StepHeader eyebrow={eyebrow} title={title}>
				{ready && noTopics
					? "Your mail stays available in Brain. You can add topics later."
					: ready
						? "Your saved topics are ready, and the filing result is confirmed."
						: "We are checking the filing job for the topic review you saved."}
			</StepHeader>
			{isLoading && (
				<LoadingCards label="Checking the saved review and its filing job..." />
			)}
			{running && !isLoading && (
				<div
					className="flex flex-col items-center gap-3"
					aria-live="polite"
				>
					<ProgressRing value={job.progress}>
						<span className="text-muted-foreground text-xs tabular-nums">
							{formatCount(job.counts.done)} of{" "}
							{formatCount(job.counts.total)}
						</span>
					</ProgressRing>
					<p className="text-muted-foreground text-sm">
						Matching sorted threads to your topics...
					</p>
				</div>
			)}
			{review &&
				review.appliedRevision === review.revision &&
				review.result.topics.length > 0 && (
					<section aria-label="Saved topics" className="space-y-3">
						<p className="font-medium text-sm">Saved topics</p>
						<ul className="space-y-3">
							{review.result.topics.map((topic) => (
								<li
									key={topic.id}
									className="space-y-1 rounded-xl border p-4"
								>
									<p className="break-words font-medium">
										{topic.name}
									</p>
									{topic.description && (
										<p className="whitespace-pre-wrap break-words text-muted-foreground text-sm">
											{topic.description}
										</p>
									)}
									{topic.short !== topic.name && (
										<Badge
											variant="outline"
											className="whitespace-normal"
										>
											Navigation label: {topic.short}
										</Badge>
									)}
								</li>
							))}
						</ul>
					</section>
				)}
			{((ready && !noTopics) || partial) && (
				<output className="block text-muted-foreground text-sm">
					This filing pass placed {formatCount(topics.filed)} threads
					under your topics.
					{Number(topics.asked ?? 0) > 0
						? ` ${formatCount(topics.asked)} still need your confirmation.`
						: ""}
				</output>
			)}
			{error && (
				<Failure
					error={error}
					onRetry={canRetryFiling || isRetrying ? undefined : refresh}
				/>
			)}
			<StepActions onBack={running || isRetrying ? undefined : onBack}>
				{canRetryFiling && (
					<Button
						variant="outline"
						onClick={() => {
							void retryFiling();
						}}
						disabled={isRetrying}
					>
						{isRetrying && <Spinner />}Retry filing
					</Button>
				)}
				<Button onClick={finish} disabled={!ready}>
					Open Home
					<ArrowRight className="size-4" aria-hidden="true" />
				</Button>
			</StepActions>
		</>
	);
}
