import { ChevronDown, Flag } from "lucide-react";
import { useRef } from "react";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	toast,
} from "@semoss/ui/next";
import { useForYou } from "./for-you.context";
import { FOR_YOU_PRIORITIES, type ForYouItem } from "./for-you.model";

/** A keyboard and single-pointer alternative to moving priority columns. */
export function ForYouPriorityMenu({
	item,
}: {
	/** Pending review to organize. */ item: ForYouItem;
}) {
	const { setPriority } = useForYou();
	const moved = useRef(false);
	const priority = FOR_YOU_PRIORITIES.find(
		({ id }) => id === (item.priority ?? "P2"),
	);
	const triggerId = `for-you-priority-${item.id}`;
	return (
		<DropdownMenu
			onOpenChange={(open) => {
				if (open) moved.current = false;
			}}
		>
			<DropdownMenuTrigger asChild>
				<Button
					id={triggerId}
					variant="ghost"
					size="sm"
					aria-label={`Priority for ${item.title}: ${priority?.label}`}
					className={cn(
						"pointer-coarse:min-h-11 gap-1.5 px-2 font-normal text-muted-foreground",
						item.priority === "P0" && "text-destructive",
					)}
				>
					<Flag aria-hidden="true" className="size-3.5" />
					{priority?.label}
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
								"[data-for-you-topic]",
							) ??
							document.querySelector<HTMLElement>("main")
						)?.focus(),
					);
				}}
			>
				<DropdownMenuLabel>Priority</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={item.priority ?? "P2"}
					onValueChange={(value) => {
						const next = FOR_YOU_PRIORITIES.find(
							({ id }) => id === value,
						);
						if (!next || next.id === (item.priority ?? "P2"))
							return;
						moved.current = true;
						setPriority(item, next.id);
						toast(
							`Priority changed to ${next.label.toLowerCase()}`,
						);
					}}
				>
					{FOR_YOU_PRIORITIES.map(({ id, label }) => (
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
	);
}
