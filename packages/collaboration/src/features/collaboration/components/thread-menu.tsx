import { Ellipsis } from "lucide-react";
import {
	type ReactElement,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
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
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const contentRef = useRef<HTMLDivElement>(null);
	const openedByHover = useRef(false);
	const cancelTimer = () => clearTimeout(timer.current);
	useEffect(() => () => clearTimeout(timer.current), []);
	const handlePointerLeave = () => {
		cancelTimer();
		timer.current = setTimeout(() => {
			if (
				openedByHover.current &&
				!contentRef.current?.contains(document.activeElement) &&
				document.activeElement !== triggerRef.current
			)
				setIsDropdownOpen(false);
		}, 200);
	};
	const groups = useThreadMenuActions({
		thread,
		item,
		triggerRef,
		onNavigate,
		sourceMessageId,
		isSourceIncluded,
	});
	const handleSelect = (action: ThreadMenuAction) => {
		cancelTimer();
		openedByHover.current = false;
		movesFocus.current = Boolean(action.movesFocus);
		setIsDropdownOpen(false);
		action.onSelect();
	};
	const handleCloseFocus = (event: Event) => {
		event.preventDefault();
		if (!movesFocus.current && !openedByHover.current)
			restoreThreadFocus(triggerRef.current);
	};
	const menu = (
		<Popover
			open={isDropdownOpen}
			onOpenChange={(open) => {
				cancelTimer();
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
					onPointerDown={() => {
						openedByHover.current = false;
					}}
					onKeyDown={() => {
						openedByHover.current = false;
					}}
				>
					<Ellipsis aria-hidden="true" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				ref={contentRef}
				align="end"
				className="max-h-[min(24rem,var(--radix-popover-content-available-height))] w-64 max-w-[calc(100vw-1rem)] overflow-y-auto p-2"
				aria-label={`${sourceMessageId ? "Email" : "Thread"} actions for ${thread.subject}`}
				onPointerEnter={cancelTimer}
				onPointerLeave={handlePointerLeave}
				onOpenAutoFocus={(event) => {
					if (openedByHover.current) event.preventDefault();
				}}
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
					openedByHover.current = false;
					movesFocus.current = false;
					setIsDropdownOpen(false);
				}
			}}
		>
			<ContextMenuTrigger
				asChild
				onPointerEnter={(event) => {
					if (event.pointerType !== "mouse") return;
					cancelTimer();
					if (isDropdownOpen) return;
					timer.current = setTimeout(() => {
						openedByHover.current = true;
						movesFocus.current = false;
						setIsDropdownOpen(true);
					}, 300);
				}}
				onPointerLeave={handlePointerLeave}
				onKeyDown={(event) => {
					if (
						event.key === "ContextMenu" ||
						(event.shiftKey && event.key === "F10")
					) {
						event.preventDefault();
						openedByHover.current = false;
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
