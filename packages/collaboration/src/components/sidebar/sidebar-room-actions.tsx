import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import {
	Button,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Session } from "@/types/session";

interface SidebarRoomActionsProps {
	room: Session;
	forceVisible?: boolean;
	className?: string;
	onRename: (room: Session, trigger: HTMLButtonElement | null) => void;
	onDelete: (room: Session, trigger: HTMLButtonElement | null) => void;
}

/** Compact room actions shared by agent-tree and recent-room rows. */
export function SidebarRoomActions({
	room,
	forceVisible = false,
	className,
	onRename,
	onDelete,
}: SidebarRoomActionsProps) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);

	function handleRename(): void {
		setOpen(false);
		onRename(room, triggerRef.current);
	}

	function handleDelete(): void {
		setOpen(false);
		onDelete(room, triggerRef.current);
	}

	return (
		<div
			className={cn(
				"hidden shrink-0 group-focus-within/room:block group-hover/room:block [@media(hover:none)]:block",
				(forceVisible || open) && "block",
				className,
			)}
		>
			<Popover open={open} onOpenChange={setOpen}>
				<Tooltip>
					<TooltipTrigger asChild>
						<PopoverTrigger asChild>
							<Button
								ref={triggerRef}
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={`Actions for ${room.title}`}
								onClick={(event) => event.stopPropagation()}
								onKeyDown={(event) => event.stopPropagation()}
							>
								<MoreHorizontal aria-hidden="true" />
							</Button>
						</PopoverTrigger>
					</TooltipTrigger>
					<TooltipContent side="right" sideOffset={4}>
						Room actions
					</TooltipContent>
				</Tooltip>
				<PopoverContent align="end" className="w-44 p-1">
					<Button
						type="button"
						variant="ghost"
						className="min-h-10 w-full justify-start"
						onClick={handleRename}
					>
						<Pencil aria-hidden="true" />
						Rename
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="min-h-10 w-full justify-start text-destructive hover:text-destructive"
						onClick={handleDelete}
					>
						<Trash2 aria-hidden="true" />
						Delete
					</Button>
				</PopoverContent>
			</Popover>
		</div>
	);
}
