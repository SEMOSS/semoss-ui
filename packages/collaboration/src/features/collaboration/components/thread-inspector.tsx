import { useId, useState } from "react";
import { Link } from "react-router";
import { Button, Checkbox, Label, P, Small } from "@semoss/ui/next";
import { dateLabel } from "../date-label";
import type {
	Thread,
	ThreadContext,
	ThreadWorkspace,
} from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { Section } from "./section";
import { TextEntryForm } from "./text-entry-form";
import { ThreadSettings } from "./thread-settings";

/** Thread-specific next steps, participants, and confirmed context. */
export function ThreadInspector({
	thread,
	workspace,
	context,
}: {
	thread: Thread;
	workspace: ThreadWorkspace;
	context: ThreadContext;
}) {
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const [showDone, setShowDone] = useState(false);
	const steps = workspace.steps.filter(
		(step) => showDone || step.status !== "done",
	);
	return (
		<>
			<Section title="Next steps">
				{steps.map((step) => (
					<div key={step.id} className="flex items-start gap-2">
						<Checkbox
							id={`${fieldId}-step-${step.id}`}
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
												: step.ownerId === "me" ||
														step.ownerId ===
															"live-me"
													? "open"
													: "waiting",
									},
								})
							}
						/>
						<div className="min-w-0 flex-1">
							<Label
								htmlFor={`${fieldId}-step-${step.id}`}
								className={
									step.status === "done"
										? "font-normal text-muted-foreground line-through"
										: "font-normal"
								}
							>
								{step.text}
							</Label>
							<Small className="mt-1 text-muted-foreground">
								{step.ownerId === "me" ||
								step.ownerId === "live-me"
									? "On you"
									: `Waiting on ${state.people.find((person) => person.id === step.ownerId)?.name || "someone else"}`}
								{step.due ? ` · ${dateLabel(step.due)}` : ""}
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
													status:
														step.ownerId === "me" ||
														step.ownerId ===
															"live-me"
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
				<TextEntryForm
					label="Add a step"
					onSave={(text) =>
						dispatch({
							type: "item.create",
							threadId: thread.id,
							text,
						})
					}
				/>
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
			<ThreadSettings thread={thread} />
			<Section title="Context">
				<Small className="text-muted-foreground">
					Only confirmed notes and included source messages enter
					future questions.
				</Small>
				{context.topics.map((topic) => (
					<div key={topic.id} className="space-y-2">
						<Link
							className="font-medium text-sm hover:underline"
							to={`/brain/topics/${encodeURIComponent(topic.id)}`}
						>
							{topic.name}
						</Link>
						{topic.goals.map((goal) => (
							<Small
								key={goal.noteId}
								className="text-muted-foreground"
							>
								{goal.text}
							</Small>
						))}
					</div>
				))}
				{workspace.facts.map((fact) => (
					<div key={fact.id} className="space-y-2 border-b pb-3">
						<P>{fact.text}</P>
						<Small className="text-muted-foreground">
							{fact.from} · {fact.status}
						</Small>
						{fact.status === "draft" && (
							<div className="flex gap-1">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										dispatch({
											type: "workspace.fact",
											threadId: thread.id,
											operation: "save",
											fact: {
												id: fact.id,
												status: "confirmed",
											},
										})
									}
								>
									Confirm
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										dispatch({
											type: "workspace.fact",
											threadId: thread.id,
											operation: "remove",
											fact: { id: fact.id },
										})
									}
								>
									Remove
								</Button>
							</div>
						)}
					</div>
				))}
			</Section>
			{workspace.assets.some((asset) => asset.isSample) && (
				<Section title="Sample files">
					{workspace.assets
						.filter((asset) => asset.isSample)
						.map((asset) => (
							<div key={asset.id}>
								<Small className="font-medium">
									{asset.name}
								</Small>
								<Small className="text-muted-foreground">
									Illustrative file · not uploaded
								</Small>
							</div>
						))}
				</Section>
			)}
		</>
	);
}
