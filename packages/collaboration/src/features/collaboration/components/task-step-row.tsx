import { CheckCircle2, Circle, Clock, MoreHorizontal } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
} from "@semoss/ui/next";
import type { WorkStepChange } from "../api/work-steps";
import { dueDay } from "../live/live-state";
import { PersonAvatar } from "./person-avatar";
import { dueLabel } from "./work-items-list";

/** What the inbox decided about the conversation a step came from. */
export type StepInbox = "needs_me" | "waiting" | "fyi";

/** One step of a work item, as the task view shows it. */
export interface TaskStep {
	id: string;
	text: string;
	kind: string;
	status: string;
	assigneeId: string;
	assigneeName: string;
	/** When it is due, as the server sent it; "" when it has no due date. */
	due: string;
	/** Who finished it: "owner", or the message that said it was done. */
	closedBy: string;
	/** What that message said, and the conversation it was on; "" when the owner finished it. */
	closedText: string;
	closedSubject: string;
	/** What the inbox decided about the conversation the step came from; absent for a step made by hand or an older server. */
	inbox?: StepInbox;
}

const INBOX_NOTE: Partial<Record<StepInbox, string>> = {
	fyi: "From a conversation filed as for your information",
	waiting: "From a conversation where you are waiting on someone else",
};

interface TaskStepRowProps {
	step: TaskStep;
	/** Where the step sits: the owner's to do, someone else's, or finished. */
	state: "mine" | "waiting" | "done";
	/** The owner's person id, for taking a step over. */
	selfId: string;
	/** Saves a change; without it the row is read-only. */
	onChange?: (stepId: string, change: WorkStepChange) => void;
	/** A change is being saved, so the controls wait. */
	isBusy?: boolean;
}

/** A due as the `YYYY-MM-DD` a date field takes; "" when there is none. */
function dayOf(due: string): string {
	const day = dueDay(due) ?? "";
	return /^\d{4}-\d{2}-\d{2}/.test(day) ? day.slice(0, 10) : "";
}

/** A step with the owner's controls: done or reopen, not mine, mine after all, edit, remove. */
export function TaskStepRow({
	step,
	state,
	selfId,
	onChange,
	isBusy,
}: TaskStepRowProps) {
	const [draft, setDraft] = useState<{ text: string; due: string } | null>(
		null,
	);
	const due = dueLabel(step.due);
	const Icon =
		state === "done" ? CheckCircle2 : state === "waiting" ? Clock : Circle;
	const icon = (
		<Icon
			aria-hidden="true"
			className={cn(
				"size-4 shrink-0",
				state === "done" && "text-success",
				state === "mine" && "text-primary",
				state === "waiting" && "text-muted-foreground",
			)}
		/>
	);
	const handleSave = (event: FormEvent) => {
		event.preventDefault();
		const text = draft?.text.trim();
		const change: WorkStepChange = {};
		if (text && text !== step.text) change.text = text;
		if (draft && draft.due !== dayOf(step.due)) change.due = draft.due;
		if (change.text !== undefined || change.due !== undefined)
			onChange?.(step.id, change);
		setDraft(null);
	};
	return (
		<li className="flex items-start gap-2.5 px-3 py-2">
			{onChange && state !== "waiting" ? (
				<button
					type="button"
					disabled={isBusy}
					aria-label={
						state === "done"
							? `Reopen: ${step.text}`
							: `Mark done: ${step.text}`
					}
					className="mt-0.5 rounded-full focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
					onClick={() =>
						onChange(step.id, {
							status: state === "done" ? "open" : "done",
						})
					}
				>
					{icon}
				</button>
			) : (
				<span className="mt-0.5">{icon}</span>
			)}
			<div className="min-w-0 flex-1 text-sm">
				{draft === null ? (
					<span
						className={cn(
							"break-words",
							state === "done" &&
								"text-muted-foreground line-through decoration-muted-foreground/40",
						)}
					>
						{step.text}
					</span>
				) : (
					<form
						className="flex flex-wrap gap-2"
						onSubmit={handleSave}
					>
						<Input
							autoFocus
							aria-label="Step"
							className="min-w-40 flex-1"
							value={draft.text}
							onChange={(event) =>
								setDraft({ ...draft, text: event.target.value })
							}
							onKeyDown={(event) => {
								if (event.key === "Escape") setDraft(null);
							}}
						/>
						<Input
							type="date"
							aria-label="Due"
							className="w-auto"
							value={draft.due}
							onChange={(event) =>
								setDraft({ ...draft, due: event.target.value })
							}
						/>
						<Button type="submit" size="sm">
							Save
						</Button>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={() => setDraft(null)}
						>
							Cancel
						</Button>
					</form>
				)}
				{due && draft === null && state !== "done" ? (
					<span
						className={cn(
							"mt-1 block text-muted-foreground text-xs",
							due.soon && "text-destructive",
						)}
					>
						Due {due.text}
					</span>
				) : null}
				{state === "waiting" ? (
					<span className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
						{step.assigneeName ? (
							<PersonAvatar
								name={step.assigneeName}
								className="size-4 text-[0.5rem]"
							/>
						) : null}
						Waiting on {step.assigneeName || "someone"}
					</span>
				) : null}
				{step.inbox && INBOX_NOTE[step.inbox] ? (
					<span className="mt-1 block text-muted-foreground text-xs">
						{INBOX_NOTE[step.inbox]}
					</span>
				) : null}
				{state === "done" &&
				step.closedBy &&
				step.closedBy !== "owner" ? (
					<span className="mt-1 block break-words text-muted-foreground text-xs">
						{`Marked done from ${step.closedSubject ? `"${step.closedSubject}"` : "a message"}${step.closedText ? `: ${step.closedText}` : ""}. Reopen it if that is wrong.`}
					</span>
				) : null}
			</div>
			{onChange && draft === null ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							disabled={isBusy}
							aria-label={`More for: ${step.text}`}
						>
							<MoreHorizontal aria-hidden="true" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{state === "mine" ? (
							<DropdownMenuItem
								onSelect={() =>
									onChange(step.id, {
										status: "dropped",
										note: "not mine",
									})
								}
							>
								Not mine
							</DropdownMenuItem>
						) : null}
						{state === "waiting" ? (
							<>
								<DropdownMenuItem
									disabled={!selfId}
									onSelect={() =>
										onChange(step.id, {
											status: "open",
											assigneeId: selfId,
										})
									}
								>
									This is mine
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={() =>
										onChange(step.id, { status: "done" })
									}
								>
									Mark done
								</DropdownMenuItem>
							</>
						) : null}
						<DropdownMenuItem
							onSelect={() =>
								setDraft({
									text: step.text,
									due: dayOf(step.due),
								})
							}
						>
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() =>
								onChange(step.id, { status: "dropped" })
							}
						>
							Remove
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			) : null}
		</li>
	);
}
