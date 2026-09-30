import { useState } from "react";
import { Alert, AlertDescription, Button, P, Spinner } from "@semoss/ui/next";
import { useThreadInsights } from "@/features/work-thread/use-thread-insights";
import { useWorkThread } from "@/features/work-thread/work-thread-context";
import type { Thread, ThreadWorkspace } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { Section } from "./section";
import { TextEntryForm } from "./text-entry-form";

/** Summary and the user-owned goal share one compact section. */
export function ThreadSummary({
	thread,
	workspace,
}: {
	thread: Thread;
	workspace: ThreadWorkspace;
}) {
	const insights = useThreadInsights();
	const { contextPanel } = useWorkThread();
	const { dispatch } = useCollaborationSession();
	const [isEditing, setIsEditing] = useState(false);
	return (
		<Section
			title="Summary"
			variant="widget"
			action={
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={insights.isDisabled}
					onClick={() => void insights.generate()}
				>
					{insights.isGenerating && <Spinner aria-hidden="true" />}
					{insights.isGenerating
						? "Summarizing…"
						: thread.summaryGenerated ||
								(thread.summary &&
									!thread.id.startsWith("connected:"))
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
			{thread.summaryRevision &&
				thread.summaryRevision !==
					contextPanel.context.contextRevision && (
					<P className="text-muted-foreground text-sm">
						Source context changed. Regenerate to update these
						insights.
					</P>
				)}
			<P className="break-words">
				{thread.summary || "No summary available yet."}
			</P>
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
