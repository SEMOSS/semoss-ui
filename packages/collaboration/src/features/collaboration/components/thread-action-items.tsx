import { useEffect, useId, useRef, useState } from "react";
import { Button, Checkbox, cn, P, Small } from "@semoss/ui/next";
import { useThreadInsights } from "@/features/work-thread/use-thread-insights";
import { dateLabel } from "../date-label";
import type { Thread, ThreadWorkspace } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { ActionItemEditor } from "./action-item-editor";
import { ActionItemEntry } from "./action-item-entry";
import { Section } from "./section";

/** Action items retain their existing completion and suggestion workflow. */
export function ThreadActionItems({
	thread,
	workspace,
}: {
	thread: Thread;
	workspace: ThreadWorkspace;
}) {
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const insights = useThreadInsights(thread);
	// the owner is "me" in sample data and the signed-in person's id in live data
	const isMe = (personId: string) =>
		personId === "me" ||
		personId === "live-me" ||
		personId === state.liveProfile?.id;
	const [showDone, setShowDone] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const buttons = useRef(new Map<string, HTMLButtonElement>());
	const restoreFocus = useRef<string | null>(null);
	useEffect(() => {
		if (!editingId && restoreFocus.current) {
			buttons.current.get(restoreFocus.current)?.focus();
			restoreFocus.current = null;
		}
	}, [editingId]);
	const steps = workspace.steps.filter(
		(step) => showDone || step.status !== "done",
	);
	return (
		<Section
			title="Action items"
			variant="widget"
			action={
				<Small className="text-muted-foreground text-xs">
					{
						workspace.steps.filter(
							(step) =>
								step.status !== "done" &&
								step.status !== "suggested" &&
								isMe(step.ownerId),
						).length
					}{" "}
					on you
				</Small>
			}
		>
			{steps.length === 0 && (
				<P className="text-muted-foreground">
					{workspace.steps.length
						? "All action items completed."
						: insights.isGenerating
							? "Looking for action items…"
							: thread.summaryAt || thread.summary
								? "No action items found."
								: "Summarize to find action items, or add your own."}
				</P>
			)}
			{steps.map((step) => (
				<div
					key={step.id}
					className={cn(
						"flex items-start gap-2",
						step.status === "suggested" &&
							"rounded-lg border border-dashed p-2",
					)}
				>
					<Checkbox
						className="mt-1 rounded-full"
						id={`${fieldId}-step-${step.id}`}
						aria-label={`Complete action item: ${step.text}`}
						checked={step.status === "done"}
						disabled={step.status === "suggested"}
						onCheckedChange={(checked) =>
							dispatch({
								type: "workspace.step",
								threadId: thread.id,
								operation: "save",
								step: {
									id: step.id,
									status:
										checked === true
											? "done"
											: isMe(step.ownerId)
												? "open"
												: "waiting",
								},
							})
						}
					/>
					<div className="min-w-0 flex-1">
						{editingId === step.id ? (
							<ActionItemEditor
								thread={thread}
								step={step}
								onClose={() => {
									restoreFocus.current = step.id;
									setEditingId(null);
								}}
							/>
						) : (
							<Button
								type="button"
								variant="ghost"
								className={cn(
									"h-auto min-h-9 w-full justify-start whitespace-normal px-0 text-start font-normal",
									step.status === "done" &&
										"text-muted-foreground line-through",
								)}
								ref={(node) => {
									if (node)
										buttons.current.set(step.id, node);
									else buttons.current.delete(step.id);
								}}
								aria-label={`Edit action item: ${step.text}`}
								onClick={() => setEditingId(step.id)}
							>
								{step.text}
							</Button>
						)}
						<Small className="text-muted-foreground text-xs leading-relaxed">
							{isMe(step.ownerId)
								? "On you"
								: `Waiting on ${state.people.find((person) => person.id === step.ownerId)?.name || "someone else"}`}
							{step.due
								? ` · ${step.due.length === 10 ? new Date(`${step.due}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : dateLabel(step.due)}`
								: ""}
							{step.status === "draft_ready"
								? " · draft ready"
								: ""}
						</Small>
						{step.status === "suggested" && (
							<div className="flex gap-1">
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										dispatch({
											type: "workspace.step",
											threadId: thread.id,
											operation: "save",
											step: {
												id: step.id,
												status: isMe(step.ownerId)
													? "open"
													: "waiting",
											},
										})
									}
								>
									Add suggestion
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										dispatch({
											type: "workspace.step",
											threadId: thread.id,
											operation: "remove",
											step: { id: step.id },
										})
									}
								>
									Dismiss
								</Button>
							</div>
						)}
					</div>
				</div>
			))}
			<ActionItemEntry threadId={thread.id} />
			{workspace.steps.some((step) => step.status === "done") && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowDone((value) => !value)}
				>
					{showDone ? "Hide completed" : "Show completed"}
				</Button>
			)}
		</Section>
	);
}
