import { MoreHorizontal } from "lucide-react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import type { UpdateTopicTaskChanges } from "./api/update-topic-task";

const priorities = [
	{ value: "P0", label: "Urgent" },
	{ value: "P1", label: "High" },
	{ value: "P2", label: "Normal" },
	{ value: "P3", label: "Low" },
] as const;

interface TopicTaskMenuProps {
	/** Task whose persisted state the menu changes. */
	item: WorkItem;
	isPending: boolean;
	onUpdate: (changes: UpdateTopicTaskChanges) => Promise<boolean>;
}

/** The same task actions remain available with or without a source thread. */
export function TopicTaskMenu({
	item,
	isPending,
	onUpdate,
}: TopicTaskMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 shrink-0"
					disabled={isPending}
					aria-label={`Task actions for ${item.title}`}
				>
					<MoreHorizontal aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Priority</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={item.priority ?? ""}
					aria-label="Task priority"
					onValueChange={(value) => {
						const priority = priorities.find(
							(candidate) => candidate.value === value,
						)?.value;
						if (priority) void onUpdate({ priority });
					}}
				>
					{priorities.map((priority) => (
						<DropdownMenuRadioItem
							key={priority.value}
							value={priority.value}
						>
							{priority.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				<DropdownMenuSeparator />
				{item.suggested && (
					<DropdownMenuItem
						onSelect={() => {
							void onUpdate({ suggested: false });
						}}
					>
						Add to my tasks
					</DropdownMenuItem>
				)}
				{item.status === "done" ||
				item.status === "dismissed" ||
				item.status === "snoozed" ? (
					<DropdownMenuItem
						onSelect={() => {
							void onUpdate({
								status: item.snoozedFrom ?? "open",
							});
						}}
					>
						Reopen task
					</DropdownMenuItem>
				) : (
					<>
						<DropdownMenuItem
							onSelect={() => {
								void onUpdate({
									status: "done",
									suggested: false,
								});
							}}
						>
							Mark completed
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								void onUpdate({ status: "snoozed" });
							}}
						>
							Snooze until tomorrow
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								void onUpdate({
									status: "dismissed",
									closedReason: "no_response_needed",
								});
							}}
						>
							Dismiss task
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
