import { ChevronDown, Flag } from "lucide-react";
import { useRef } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { useTopicTaskAction } from "@/features/topics/use-topic-task-action";
import { useAttention } from "./attention.context";
import { ATTENTION_PRIORITIES, type AttentionItem } from "./attention.model";

/** Change task priority without implying a manual ordering capability. */
export function AttentionPriorityMenu({
	item,
}: {
	/** Pending review to organize. */ item: AttentionItem;
}) {
	const { setPriority } = useAttention();
	const action = useTopicTaskAction(item.kind === "work" ? item.item : null);
	const moved = useRef(false);
	const priority = ATTENTION_PRIORITIES.find(
		({ id }) => id === item.priority,
	);
	const triggerId = `attention-priority-${item.id}`;
	return (
		<>
			<DropdownMenu
				onOpenChange={(open) => {
					if (open) moved.current = false;
				}}
			>
				<DropdownMenuTrigger asChild>
					<Button
						id={triggerId}
						disabled={action.isPending}
						variant="ghost"
						size="sm"
						aria-label={`Priority for ${item.title}: ${priority?.label ?? "Unprioritized"}`}
						className={cn(
							"pointer-coarse:min-h-11 gap-1.5 px-2 font-normal text-muted-foreground",
							item.priority === "P0" && "text-destructive",
						)}
					>
						<Flag aria-hidden="true" className="size-3.5" />
						{priority?.label ?? "Unprioritized"}
						<ChevronDown aria-hidden="true" className="size-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					onCloseAutoFocus={(event) => {
						if (!moved.current) return;
						event.preventDefault();
						requestAnimationFrame(() =>
							(
								document.getElementById(triggerId) ??
								document.querySelector<HTMLElement>(
									"[data-attention-topic]",
								) ??
								document.querySelector<HTMLElement>("main")
							)?.focus(),
						);
					}}
				>
					<DropdownMenuLabel>Priority</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={item.priority ?? ""}
						onValueChange={async (value) => {
							const next = ATTENTION_PRIORITIES.find(
								({ id }) => id === value,
							);
							if (!next || next.id === item.priority) return;
							moved.current = true;
							if (item.kind === "work")
								await action.update({ priority: next.id });
							else setPriority(item, next.id);
						}}
					>
						{ATTENTION_PRIORITIES.map(({ id, label }) => (
							<DropdownMenuRadioItem
								key={id}
								value={id}
								className="pointer-coarse:min-h-11"
							>
								{label}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			{action.error && (
				<Alert variant="destructive">
					<AlertDescription>{action.error}</AlertDescription>
				</Alert>
			)}
		</>
	);
}
