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
import { PersonAvatar } from "./person-avatar";

/** One step of a work item, as the task view shows it. */
export interface TaskStep {
	id: string;
	text: string;
	kind: string;
	status: string;
	assigneeId: string;
	assigneeName: string;
	/** Who finished it: "owner", or the message that said it was done. */
	closedBy: string;
	/** What that message said, and the conversation it was on; "" when the owner finished it. */
	closedText: string;
	closedSubject: string;
}

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

/** A step with the owner's controls: done or reopen, not mine, mine after all, edit, remove. */
export function TaskStepRow({
	step,
	state,
	selfId,
	onChange,
	isBusy,
}: TaskStepRowProps) {
	const [draft, setDraft] = useState<string | null>(null);
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
		const text = draft?.trim();
		if (text && text !== step.text) onChange?.(step.id, { text });
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
					<form className="flex gap-2" onSubmit={handleSave}>
						<Input
							autoFocus
							aria-label="Step"
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Escape") setDraft(null);
							}}
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
						<DropdownMenuItem onSelect={() => setDraft(step.text)}>
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
