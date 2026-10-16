import { useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	H2,
	P,
	Progress,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { BrainOverview } from "@/features/collaboration/components/brain-overview";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { CollaborationSurface } from "@/features/collaboration/components/collaboration-surface";
import { collaborationTabsStyles } from "@/features/collaboration/components/collaboration-tabs.styles";
import { BrainFilingCorrection } from "./brain-filing-correction";
import type { ReviewQuestion } from "./brain-review-api";
import { BrainReviewSection } from "./brain-review-section";
import { useBrainReview } from "./use-brain-review";

const sections: {
	title: string;
	description: string;
	kind: ReviewQuestion["kind"];
}[] = [
	{
		title: "Suggested topic matches",
		description:
			"Brain found possible topics for these threads. Accept a suggestion or dismiss it.",
		kind: "topic_choice",
	},
	{
		title: "Threads without a topic",
		description:
			"Choose a topic for each thread below. No topic has been confirmed yet.",
		kind: "unassigned",
	},
	{
		title: "Topic changes you requested",
		description:
			"You selected these threads to change their topic. Brain has not marked them as incorrect.",
		kind: "wrong_topic",
	},
	{
		title: "Suggested new topics",
		description:
			"Accept a suggestion to create a topic for the related threads.",
		kind: "new_topic",
	},
	{
		title: "Possible duplicate topics",
		description:
			"Check whether these topics describe the same work before merging them.",
		kind: "merge_topic",
	},
	{
		title: "Topics with no recent activity",
		description:
			"Choose whether to archive these quiet topics. Their history is kept.",
		kind: "quiet_topic",
	},
	{
		title: "Suggested topic members",
		description:
			"Confirm whether these people belong to the suggested topic.",
		kind: "add_person",
	},
	{
		title: "Frequent senders without a topic",
		description: "Choose a topic for people who regularly send you mail.",
		kind: "unknown_sender",
	},
	{
		title: "Memories to review",
		description:
			"Keep a suggested memory or confirm something learned in a chat.",
		kind: "memory",
	},
];
function optimizationError(error: string | null | undefined): string {
	if (/\b502\b|bad gateway/i.test(error ?? ""))
		return "The classifier service is unavailable (502 Bad Gateway). Your threads and topics have not been changed. You can still answer the questions below.";
	return "Brain could not finish checking your workspace. You can still answer existing questions and try Optimize Brain again later.";
}
/** Live Review shows real health, owner-started optimization, grouped questions and durable decisions. */
export function BrainReviewWorkspace() {
	const review = useBrainReview();
	const [tab, setTab] = useState("needs");
	const historyHeading = useRef<HTMLHeadingElement>(null);
	const health = review.overview?.health;
	const running = review.job?.status === "running";
	const busy = review.pendingId !== null;
	const counts = review.job?.counts ?? {};
	const found = [
		["filings", "filing suggestions"],
		["newTopics", "new topics"],
		["merges", "merges"],
		["people", "people suggestions"],
		["quietTopics", "quiet topics"],
	]
		.map(
			([key, label]) =>
				`${typeof counts[key] === "number" ? counts[key] : 0} ${label}`,
		)
		.join(", ");
	return (
		<CollaborationSurface
			aside={<BrainOverview />}
			asideTitle="Brain overview"
			header={
				<CollaborationPageHeader
					title="Review"
					description="Make Brain better, one answer at a time."
					actions={
						<Button
							onClick={() => void review.optimize()}
							disabled={running || busy || review.isLoading}
							className="min-h-11"
						>
							{review.pendingId === "optimize"
								? "Starting optimization…"
								: running
									? "Optimizing Brain…"
									: "Optimize Brain"}
						</Button>
					}
				>
					<P className="text-muted-foreground text-sm">
						Optimization proposes changes. Your answers decide what
						Brain keeps.
					</P>
					{health && (
						<section
							className="space-y-2"
							aria-label="Brain health"
						>
							<output className="block text-sm">
								Last {health.days} days:{" "}
								{health.automaticPercent === null
									? "No recent mail"
									: `${health.automaticPercent}% of mail conversations filed automatically`}{" "}
								· {health.unfiledThreads} with no topic ·{" "}
								{health.questionsWaiting} questions waiting
							</output>
							<P className="text-muted-foreground text-sm">
								{health.eligibleMailThreads === 0
									? "Import recent mail to measure filing coverage."
									: `${health.filedThreads} of ${health.eligibleMailThreads} mail conversations filed (${health.filedPercent}%). Your filing answers improve this coverage.`}
							</P>
							<output className="block text-sm">
								{health.decisionsAnswered} questions answered in
								the last {health.days} days
							</output>
							{health.filedPercent !== null && (
								<Progress
									value={health.filedPercent}
									aria-label="Mail filing coverage"
								/>
							)}
						</section>
					)}
					{running && (
						<div className="space-y-2">
							<output className="block text-sm">
								{review.job?.step || "Checking Brain"} ·{" "}
								{review.job?.progress ?? 0}%
							</output>
							<Progress
								value={review.job?.progress ?? 0}
								aria-label="Optimize Brain progress"
							/>
						</div>
					)}
					{review.job?.status === "done" && (
						<output className="block text-sm">
							Optimization found {found}. Review the suggestions
							below.
						</output>
					)}
					{(review.job?.status === "failed" || review.jobError) && (
						<Alert variant="destructive">
							<AlertDescription>
								<P>
									{optimizationError(
										review.jobError || review.job?.error,
									)}
								</P>
								<details className="mt-2">
									<summary className="flex min-h-11 cursor-pointer items-center text-sm">
										Technical details
									</summary>
									<pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs">
										{review.jobError ||
											review.job?.error ||
											"No further details available."}
									</pre>
								</details>
								<Button
									variant="outline"
									onClick={() => void review.refresh()}
									disabled={busy}
								>
									Check job status
								</Button>
							</AlertDescription>
						</Alert>
					)}
				</CollaborationPageHeader>
			}
		>
			{review.error && (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>
						{review.error}
						<Button
							variant="outline"
							onClick={() => void review.refresh()}
							disabled={busy}
						>
							Refresh Review
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{review.isLoading && (
				<output className="block p-4 text-muted-foreground text-sm">
					Loading Review…
				</output>
			)}
			<Tabs value={tab} onValueChange={setTab} className="gap-0">
				<div className="border-b p-4 md:px-6">
					<TabsList className={collaborationTabsStyles.list}>
						<TabsTrigger
							value="needs"
							className={collaborationTabsStyles.trigger}
						>
							Needs you ({review.overview?.pending.total ?? 0})
						</TabsTrigger>
						<TabsTrigger
							value="learned"
							className={collaborationTabsStyles.trigger}
						>
							Learned recently
						</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="needs" className="mt-0">
					{!review.isLoading &&
						!review.error &&
						review.overview?.pending.total === 0 && (
							<P className="p-4 text-muted-foreground text-sm">
								All caught up. Optimize Brain to look for
								improvements.
							</P>
						)}
					{review.overview && (
						<P className="border-b px-4 py-3 text-muted-foreground text-sm md:px-6">
							Showing {review.overview.pending.items.length} of{" "}
							{review.overview.pending.total} questions. Questions
							are grouped by the action needed.
						</P>
					)}
					{review.overview &&
						sections.map((section) => (
							<BrainReviewSection
								key={section.kind}
								title={section.title}
								description={section.description}
								questions={
									review.overview?.pending.items.filter(
										(question) =>
											section.kind === question.kind,
									) ?? []
								}
								total={
									review.overview?.pendingCounts
										? (review.overview.pendingCounts[
												section.kind
											] ?? 0)
										: undefined
								}
								topics={review.overview?.topics ?? []}
								isBusy={busy}
								onAnswer={review.answer}
							>
								{section.kind === "wrong_topic" && (
									<BrainFilingCorrection
										threads={
											review.overview?.filedThreads ?? []
										}
										isBusy={busy}
										onRequest={review.requestCorrection}
									/>
								)}
							</BrainReviewSection>
						))}
					{review.overview &&
						review.overview.pending.items.length <
							review.overview.pending.total && (
							<Button
								className="m-4 min-h-11"
								variant="outline"
								onClick={() => void review.moreQuestions()}
								disabled={busy}
							>
								Load more questions
							</Button>
						)}
				</TabsContent>
				<TabsContent value="learned" className="mt-0">
					<div className="space-y-1 px-4 py-4 md:px-6">
						<H2
							ref={historyHeading}
							tabIndex={-1}
							className="text-lg focus-visible:outline-2 focus-visible:outline-ring"
						>
							Your recent decisions
						</H2>
						<P className="text-muted-foreground text-sm">
							Your answers in the last 7 days. Undo reopens the
							question and reverses its change while it has not
							been superseded.
						</P>
					</div>
					{review.decisions.items.map((decision) => (
						<article
							key={decision.id}
							className="flex min-w-0 flex-wrap items-center gap-3 border-b px-4 py-3 md:px-6"
						>
							<div className="min-w-0 flex-1">
								<P className="break-words text-sm">
									{decision.summary}
								</P>
								<time
									dateTime={decision.at}
									className="text-muted-foreground text-xs"
								>
									{new Date(decision.at).toLocaleString()}
								</time>
							</div>
							<Button
								variant="outline"
								disabled={busy || !decision.canUndo}
								className="min-h-11"
								aria-label={`Undo: ${decision.summary}`}
								onClick={() =>
									void review
										.undo(decision.id)
										.then((saved) => {
											if (saved)
												historyHeading.current?.focus();
										})
								}
							>
								Undo
							</Button>
						</article>
					))}
					{!review.isLoading &&
						!review.error &&
						review.decisions.total === 0 && (
							<P className="p-4 text-muted-foreground text-sm">
								No recent decisions yet. Answers you give in
								Review appear here.
							</P>
						)}
					{review.decisions.items.length < review.decisions.total && (
						<Button
							className="m-4 min-h-11"
							variant="outline"
							disabled={busy}
							onClick={() => void review.moreDecisions()}
						>
							Load more decisions
						</Button>
					)}
				</TabsContent>
			</Tabs>
		</CollaborationSurface>
	);
}
