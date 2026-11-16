import { type FormEvent, useState } from "react";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { WorkItemChange, WorkItemPriority } from "../api/work-items";
import { dueDay } from "../live/live-state";

/** What the controls show of a work item. */
export interface TaskItemFields {
	title: string;
	/** `active`, `waiting`, `blocked`, `done` or `dropped`. */
	status: string;
	/** As the server sent it; "" when there is none. */
	due: string;
	priority: string;
	/** Ongoing work stays open when its last step is finished. */
	ongoing?: boolean;
}

interface TaskItemControlsProps {
	item: TaskItemFields;
	/** Saves a change to the work item. */
	onChange: (change: WorkItemChange) => void;
	/** A change is being saved, so the controls wait. */
	isBusy?: boolean;
}

const PRIORITIES: { value: WorkItemPriority; label: string }[] = [
	{ value: "high", label: "High" },
	{ value: "medium", label: "Medium" },
	{ value: "low", label: "Low" },
];

/** A due as the `YYYY-MM-DD` a date field takes; "" when there is none. */
function dayOf(due: string): string {
	const day = dueDay(due) ?? "";
	return /^\d{4}-\d{2}-\d{2}/.test(day) ? day.slice(0, 10) : "";
}

/** The owner's controls for a whole work item: rename, due date, priority, ongoing, and done, dropped or reopened. */
export function TaskItemControls({
	item,
	onChange,
	isBusy,
}: TaskItemControlsProps) {
	const [draft, setDraft] = useState<string | null>(null);
	const isClosed = item.status === "done" || item.status === "dropped";
	const handleRename = (event: FormEvent) => {
		event.preventDefault();
		const title = draft?.trim();
		if (title && title !== item.title) onChange({ title });
		setDraft(null);
	};
	if (draft !== null)
		return (
			<form className="flex gap-2" onSubmit={handleRename}>
				<Input
					autoFocus
					aria-label="Work item name"
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
		);
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button
				type="button"
				size="sm"
				variant="outline"
				disabled={isBusy}
				onClick={() => setDraft(item.title)}
			>
				Rename
			</Button>
			<Input
				type="date"
				aria-label="Work item due"
				className="w-auto"
				disabled={isBusy}
				value={dayOf(item.due)}
				onChange={(event) => onChange({ due: event.target.value })}
			/>
			<Select
				value={item.priority || undefined}
				disabled={isBusy}
				onValueChange={(priority) =>
					onChange({ priority: priority as WorkItemPriority })
				}
			>
				<SelectTrigger size="sm" aria-label="Priority">
					<SelectValue placeholder="Priority" />
				</SelectTrigger>
				<SelectContent>
					{PRIORITIES.map((p) => (
						<SelectItem key={p.value} value={p.value}>
							{p.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{isClosed ? null : (
				<Button
					type="button"
					size="sm"
					variant={item.ongoing ? "secondary" : "outline"}
					aria-pressed={Boolean(item.ongoing)}
					title="Ongoing work stays open when its last step is finished"
					disabled={isBusy}
					onClick={() => onChange({ ongoing: !item.ongoing })}
				>
					Ongoing
				</Button>
			)}
			<Button
				type="button"
				size="sm"
				variant={isClosed ? "outline" : "default"}
				disabled={isBusy}
				onClick={() =>
					onChange({ status: isClosed ? "active" : "done" })
				}
			>
				{isClosed ? "Reopen work item" : "Mark work item done"}
			</Button>
			{isClosed ? null : (
				<Button
					type="button"
					size="sm"
					variant="ghost"
					className="text-muted-foreground"
					disabled={isBusy}
					onClick={() => onChange({ status: "dropped" })}
				>
					Drop
				</Button>
			)}
		</div>
	);
}
