import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, P, Progress } from "@semoss/ui/next";
import type { OnboardingStepProps } from "./onboarding-step-props";
import {
	Failure,
	formatCount,
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
	waiting: "Waiting for your mail sync to finish",
	reading: "Reading your conversations",
	grouping: "Grouping related conversations",
	naming: "Naming each group",
	saving: "Almost done",
	areas: "Finding your main areas of work",
	drafting: "Drafting a topic for each line you wrote",
	finding: "Finding the conversations for each topic",
};

// the line under the bar: how far the current step has got
function stepDetail(step: string, counts: Record<string, unknown>): string {
	const read = Number(counts.read ?? 0);
	const toRead = Number(counts.toRead ?? 0);
	const checked = Number(counts.checked ?? 0);
	const checks = Number(counts.checks ?? 0);
	const conversations = Number(counts.conversations ?? 0);
	const topics = Number(counts.topics ?? 0);
	if (step === "finding" && topics > 0)
		return `Found conversations for ${Number(counts.topicsFound ?? 0)} of ${topics} topics`;
	if (step === "grouping" && toRead > 0)
		return read < toRead
			? `Read ${formatCount(read)} of ${formatCount(toRead)} conversations`
			: "Sorting them into groups";
	if (step === "naming" && checks > 0)
		return `Checked the groups ${checked} of ${checks} times`;
	return conversations > 0
		? `${formatCount(conversations)} conversations`
		: "";
}

// m:ss since the job started, ticking while it runs
function useElapsed(startedAt: string, running: boolean): string {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!running) return;
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [running]);
	const started = Date.parse(startedAt);
	if (!running || Number.isNaN(started)) return "";
	const seconds = Math.max(0, Math.floor((now - started) / 1000));
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

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
	const isRunning = !!current.jobId && job?.status === "running";
	const elapsed = useElapsed(job?.startedAt ?? "", isRunning);
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
	const detail = job ? stepDetail(job.step, job.counts) : "";
	return (
		<>
			<StepHeader eyebrow={eyebrow} title="Finding your topics">
				The assistant groups your recent conversations, names each group
				and then finds your main areas of work. The assistant thinks
				each step through, so this can take a few minutes.
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
			) : isRunning && job ? (
				<div className="flex flex-col gap-4">
					<div className="space-y-2">
						<div className="flex items-baseline justify-between gap-2 text-sm">
							<P className="font-medium">
								{MAP_STEPS[job.step] ?? "Working"}
							</P>
							<P className="flex items-center gap-1.5 text-muted-foreground tabular-nums">
								<LoaderCircle
									className="size-3.5 animate-spin motion-reduce:animate-none"
									aria-hidden="true"
								/>
								{elapsed
									? `Still working (${elapsed})`
									: "Still working"}
							</P>
						</div>
						<Progress value={job.progress} />
						{detail && (
							<P className="text-muted-foreground text-sm">
								{detail}
							</P>
						)}
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
