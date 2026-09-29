import { Ellipsis } from "lucide-react";
import { type ReactElement, type ReactNode, useRef, useState } from "react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Thread, WorkItem } from "../state/collaboration.types";
import { restoreThreadFocus } from "./thread-menu.utils";
import { ThreadMenuItems } from "./thread-menu-items";
import {
	type ThreadMenuAction,
	useThreadMenuActions,
} from "./use-thread-menu-actions";

/** Row-level context actions with an equivalent visible keyboard/touch entry point. */
export function ThreadMenu({
	thread,
	item,
	children,
	onNavigate,
	triggerId,
}: {
	thread: Thread;
	item?: WorkItem;
	/** Render the row and place its overflow button beside the existing controls. */
	children?: (menu: ReactNode) => ReactElement;
	onNavigate?: () => void;
	/** Optional stable target for focus return from the Work dock. */
	triggerId?: string;
}) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const movesFocus = useRef(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const groups = useThreadMenuActions({
		thread,
		item,
		triggerRef,
		onNavigate,
	});
	const handleSelect = (action: ThreadMenuAction) => {
		movesFocus.current = Boolean(action.movesFocus);
		action.onSelect();
	};
	const handleCloseFocus = (event: Event) => {
		event.preventDefault();
		if (!movesFocus.current) restoreThreadFocus(triggerRef.current);
	};
	const menu = (
		<DropdownMenu
			open={isDropdownOpen}
			onOpenChange={(open) => {
				if (open) movesFocus.current = false;
				setIsDropdownOpen(open);
			}}
		>
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button
							ref={triggerRef}
							id={triggerId}
							type="button"
							variant="ghost"
							size="icon-sm"
							className="pointer-coarse:size-11 shrink-0"
							aria-label={`Thread actions for ${thread.subject}`}
						>
							<Ellipsis aria-hidden="true" />
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>Thread actions</TooltipContent>
			</Tooltip>
			<DropdownMenuContent
				align="end"
				onCloseAutoFocus={handleCloseFocus}
			>
				<ThreadMenuItems
					groups={groups}
					presentation="dropdown"
					onSelect={handleSelect}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
	return (
		<ContextMenu
			onOpenChange={(open) => {
				if (open) {
					movesFocus.current = false;
					setIsDropdownOpen(false);
				}
			}}
		>
			<ContextMenuTrigger
				asChild
				onKeyDown={(event) => {
					if (
						event.key === "ContextMenu" ||
						(event.shiftKey && event.key === "F10")
					) {
						event.preventDefault();
						movesFocus.current = false;
						setIsDropdownOpen(true);
					}
				}}
			>
				{children ? children(menu) : <div>{menu}</div>}
			</ContextMenuTrigger>
			<ContextMenuContent onCloseAutoFocus={handleCloseFocus}>
				<ThreadMenuItems
					groups={groups}
					presentation="context"
					onSelect={handleSelect}
				/>
			</ContextMenuContent>
		</ContextMenu>
	);
}
