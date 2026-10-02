import { Ellipsis } from "lucide-react";
import { type ReactElement, type ReactNode, useRef, useState } from "react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
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
	sourceMessageId,
	isSourceIncluded,
}: {
	thread: Thread;
	item?: WorkItem;
	/** Render the row and place its overflow button beside the existing controls. */
	children?: (menu: ReactNode) => ReactElement;
	onNavigate?: () => void;
	/** Optional stable target for focus return from the Work dock. */
	triggerId?: string;
	/** Email-card actions target that message, never another source. */
	sourceMessageId?: string;
	isSourceIncluded?: boolean;
}) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const movesFocus = useRef(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const groups = useThreadMenuActions({
		thread,
		item,
		triggerRef,
		onNavigate,
		sourceMessageId,
		isSourceIncluded,
	});
	const handleSelect = (action: ThreadMenuAction) => {
		movesFocus.current = Boolean(action.movesFocus);
		setIsDropdownOpen(false);
		action.onSelect();
	};
	const handleCloseFocus = (event: Event) => {
		event.preventDefault();
		if (!movesFocus.current) restoreThreadFocus(triggerRef.current);
	};
	const menu = (
		<Popover
			open={isDropdownOpen}
			onOpenChange={(open) => {
				if (open) movesFocus.current = false;
				setIsDropdownOpen(open);
			}}
		>
			<PopoverTrigger asChild>
				<Button
					ref={triggerRef}
					id={triggerId}
					type="button"
					variant="ghost"
					size="icon-sm"
					className="pointer-coarse:size-11 shrink-0"
					aria-label={`${sourceMessageId ? "Email" : "Thread"} actions for ${thread.subject}`}
				>
					<Ellipsis aria-hidden="true" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="max-h-[min(24rem,var(--radix-popover-content-available-height))] w-64 max-w-[calc(100vw-1rem)] overflow-y-auto p-2"
				aria-label={`${sourceMessageId ? "Email" : "Thread"} actions for ${thread.subject}`}
				onCloseAutoFocus={handleCloseFocus}
			>
				<ThreadMenuItems
					groups={groups}
					presentation="popover"
					onSelect={handleSelect}
				/>
			</PopoverContent>
		</Popover>
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
			{/* the popover opens from its button, right-click, or the keyboard menu key; never on hover */}
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
