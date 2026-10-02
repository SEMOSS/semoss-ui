import { useId, useLayoutEffect, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	P,
	Spinner,
} from "@semoss/ui/next";
import { useThreadInsights } from "@/features/work-thread/use-thread-insights";
import type { Thread, ThreadWorkspace } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { Section } from "./section";
import { TextEntryForm } from "./text-entry-form";

/** Brain's summary, made in the background, and the user-owned goal share one compact section. */
export function ThreadSummary({
	thread,
	workspace,
}: {
	thread: Thread;
	workspace: ThreadWorkspace;
}) {
	const insights = useThreadInsights(thread);
	const { dispatch } = useCollaborationSession();
	const [isEditing, setIsEditing] = useState(false);
	const summary =
		thread.summary ||
		(insights.isGenerating
			? "Reading the thread…"
			: "No summary available yet.");
	const summaryId = useId();
	const summaryRef = useRef<HTMLParagraphElement>(null);
	// a new summary starts collapsed again
	const [expandedSummary, setExpandedSummary] = useState<string | null>(null);
	const isExpanded = expandedSummary === summary;
	// measured, not counted: the Context panel resizes, so the same text fits at one width and not another
	const [isOverflowing, setIsOverflowing] = useState(false);
	useLayoutEffect(() => {
		const element = summaryRef.current;
		if (!element || isExpanded || !summary) return;
		const measure = () =>
			setIsOverflowing(element.scrollHeight > element.clientHeight + 1);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [summary, isExpanded]);
	return (
		<Section
			title="Summary"
			variant="widget"
			action={
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={!insights.isAvailable || insights.isGenerating}
					onClick={insights.generate}
				>
					{insights.isGenerating && <Spinner aria-hidden="true" />}
					{insights.isGenerating
						? "Summarizing…"
						: thread.summaryAt
							? "Regenerate"
							: "Summarize"}
				</Button>
			}
		>
			{insights.isGenerating && (
				<output className="sr-only">
					Preparing summary and action items
				</output>
			)}
			{insights.error && (
				<Alert variant="destructive">
					<AlertDescription>{insights.error}</AlertDescription>
				</Alert>
			)}
			{thread.summaryAt &&
				!thread.summaryCurrent &&
				!insights.isGenerating && (
					<P className="text-muted-foreground text-sm">
						This summary is behind the thread. Regenerate to update
						it.
					</P>
				)}
			<div>
				<P
					ref={summaryRef}
					id={summaryId}
					className={cn("break-words", !isExpanded && "line-clamp-7")}
				>
					{summary}
				</P>
				{(isOverflowing || isExpanded) && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="-ml-2 text-primary"
						aria-expanded={isExpanded}
						aria-controls={summaryId}
						onClick={() =>
							setExpandedSummary(isExpanded ? null : summary)
						}
					>
						{isExpanded ? "Show less" : "Show more"}
					</Button>
				)}
			</div>
			{isEditing ? (
				<TextEntryForm
					label="Thread goal"
					initialValue={workspace.goal}
					submitLabel="Save goal"
					onSave={(goal) => {
						dispatch({
							type: "thread.goal",
							threadId: thread.id,
							goal,
						});
						setIsEditing(false);
					}}
				/>
			) : (
				<div className="flex flex-wrap items-start gap-2">
					{workspace.goal && (
						<P className="min-w-0 flex-1 break-words text-muted-foreground">
							<span className="font-medium">Goal: </span>
							{workspace.goal}
						</P>
					)}
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => setIsEditing(true)}
					>
						{workspace.goal ? "Edit goal" : "Add goal"}
					</Button>
				</div>
			)}
		</Section>
	);
}
