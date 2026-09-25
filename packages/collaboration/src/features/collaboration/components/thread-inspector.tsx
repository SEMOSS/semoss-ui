import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router";
import { Badge, Button, Checkbox, cn, Label, P, Small } from "@semoss/ui/next";
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
	const [showContext, setShowContext] = useState(false);
	const steps = workspace.steps.filter(
		(step) => showDone || step.status !== "done",
	);
	return (
		<div className="space-y-3">
			<Section
				title="Next steps"
				variant="widget"
				action={
					<Small className="text-muted-foreground text-xs">
						{
							workspace.steps.filter(
								(step) =>
									step.status !== "done" &&
									step.status !== "suggested" &&
									(step.ownerId === "me" ||
										step.ownerId === "live-me"),
							).length
						}{" "}
						on you
					</Small>
				}
			>
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
								className={cn(
									"cursor-pointer py-1 leading-relaxed",
									step.status === "done"
										? "font-normal text-muted-foreground line-through"
										: "font-normal",
								)}
							>
								{step.text}
							</Label>
							<Small className="text-muted-foreground text-xs leading-relaxed">
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
				<details>
					<summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 font-medium text-muted-foreground text-sm focus-visible:outline-2 focus-visible:outline-ring">
						<Plus aria-hidden="true" className="size-4" />
						Add a step
					</summary>
					<div className="border-t pt-3">
						<TextEntryForm
							label="Add a step"
							onSave={(text) => {
								dispatch({
									type: "item.create",
									threadId: thread.id,
									text,
								});
							}}
						/>
					</div>
				</details>
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
			<ThreadSettings
				thread={thread}
				presentation="widgets"
				sections={["people"]}
			/>
			<Section
				title="Context"
				variant="widget"
				action={
					<div className="flex items-center gap-1">
						{workspace.facts.some(
							(fact) => fact.status === "draft",
						) && (
							<Badge
								variant="secondary"
								className="rounded-full font-normal"
							>
								{
									workspace.facts.filter(
										(fact) => fact.status === "draft",
									).length
								}{" "}
								to confirm
							</Badge>
						)}
						<Button
							variant="ghost"
							size="sm"
							className="-mr-2 h-8 text-muted-foreground"
							aria-expanded={showContext}
							aria-controls={`${fieldId}-context`}
							onClick={() => setShowContext((value) => !value)}
						>
							{showContext ? "Hide" : "Show"}
						</Button>
					</div>
				}
			>
				<div
					id={`${fieldId}-context`}
					hidden={!showContext}
					className="space-y-3"
				>
					<Small className="text-muted-foreground">
						Only confirmed notes and included source messages enter
						future questions.
					</Small>
					{context.topics.map((topic) => (
						<div key={topic.id} className="space-y-1">
							<Link
								className="font-medium text-sm hover:text-primary hover:underline"
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
						<div
							key={fact.id}
							className="space-y-1 border-border/50 border-t pt-3"
						>
							<P>{fact.text}</P>
							<Small className="text-muted-foreground text-xs">
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
				</div>
			</Section>
			{workspace.assets.some((asset) => asset.isSample) && (
				<Section title="Files" variant="widget">
					{workspace.assets
						.filter((asset) => asset.isSample)
						.map((asset) => (
							<div
								key={asset.id}
								className="flex min-w-0 items-center gap-2"
							>
								<Badge
									variant="secondary"
									className="rounded-md font-mono font-normal uppercase"
								>
									{asset.name
										.split(".")
										.at(-1)
										?.slice(0, 5) || "file"}
								</Badge>
								<Small
									className="min-w-0 truncate"
									title={asset.name}
								>
									{asset.name}
								</Small>
							</div>
						))}
					<Small className="text-muted-foreground text-xs">
						These files are not available for download.
					</Small>
				</Section>
			)}
			<details className="rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/50">
				<summary className="min-h-6 cursor-pointer font-medium text-sm focus-visible:outline-2 focus-visible:outline-ring">
					Thread settings
				</summary>
				<div className="pt-4">
					<ThreadSettings
						thread={thread}
						sections={["topics", "visibility"]}
					/>
				</div>
			</details>
		</div>
	);
}
