import { Check, ChevronDown, Plus } from "lucide-react";
import { useRef, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	P,
} from "@semoss/ui/next";
import type {
	Topic,
	TopicGoal,
} from "@/features/collaboration/state/collaboration.types";
import { TopicGoalEditor } from "./topic-goal-editor";

/** Lead with the first open goal without inventing a primary-goal setting. */
export function TopicGoals({ topic }: { topic: Topic }) {
	const [isEditing, setIsEditing] = useState(false);
	const [editingGoal, setEditingGoal] = useState<TopicGoal>();
	const returnFocusRef = useRef<HTMLButtonElement>(null);
	const first =
		topic.goals.find((goal) => goal.status === "open") ?? topic.goals[0];
	const rest = topic.goals.filter((goal) => goal.noteId !== first?.noteId);
	return (
		<div className="mb-6 rounded-md border border-primary/15 bg-primary/5 px-4 py-3">
			<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
				<P className="shrink-0 font-medium text-foreground text-sm">
					The goal
				</P>
				<P
					className={cn(
						"min-w-0 flex-1 break-words text-base",
						!first && "text-muted-foreground",
						first?.status === "done" &&
							"text-muted-foreground line-through",
					)}
				>
					{first?.text ??
						"Add a goal to give this topic a clear direction."}
					{first?.status === "done" && (
						<span className="sr-only"> — completed</span>
					)}
				</P>
				<Button
					variant="ghost"
					size="sm"
					className="pointer-coarse:min-h-11 shrink-0 text-foreground"
					onClick={(event) => {
						returnFocusRef.current = event.currentTarget;
						setEditingGoal(first);
						setIsEditing(true);
					}}
				>
					{first ? "Edit goal" : "Add goal"}
				</Button>
			</div>
			{first && (
				<Collapsible className="mt-2">
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="-ml-2 pointer-coarse:min-h-11 text-muted-foreground"
						>
							{rest.length
								? `${rest.length} more ${rest.length === 1 ? "goal" : "goals"}`
								: "Manage goals"}
							<ChevronDown aria-hidden="true" />
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-2 pt-2">
						{rest.map((goal) => (
							<div
								key={goal.noteId}
								className="flex flex-wrap items-center gap-2 border-border/50 border-t pt-2"
							>
								{goal.status === "done" && (
									<Check
										aria-hidden="true"
										className="size-4 text-success"
									/>
								)}
								<P
									className={cn(
										"min-w-0 flex-1 break-words text-base",
										goal.status === "done" &&
											"text-muted-foreground line-through",
									)}
								>
									{goal.text}
									{goal.status === "done" && (
										<span className="sr-only">
											{" "}
											— completed
										</span>
									)}
								</P>
								<Button
									variant="ghost"
									size="sm"
									aria-label={`Edit goal: ${goal.text}`}
									onClick={(event) => {
										returnFocusRef.current =
											event.currentTarget;
										setEditingGoal(goal);
										setIsEditing(true);
									}}
								>
									Edit
								</Button>
							</div>
						))}
						<Button
							variant="ghost"
							size="sm"
							className="-ml-2 pointer-coarse:min-h-11 text-foreground"
							onClick={(event) => {
								returnFocusRef.current = event.currentTarget;
								setEditingGoal(undefined);
								setIsEditing(true);
							}}
						>
							<Plus aria-hidden="true" />
							Add another goal
						</Button>
					</CollapsibleContent>
				</Collapsible>
			)}
			{isEditing && (
				<TopicGoalEditor
					topic={topic}
					goal={editingGoal}
					returnFocusRef={returnFocusRef}
					onClose={() => setIsEditing(false)}
				/>
			)}
		</div>
	);
}
