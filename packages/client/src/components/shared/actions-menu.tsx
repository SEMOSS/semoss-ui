import { ChevronDown, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Spinner,
} from "@semoss/ui/next";

/** How long the menu stays open after the pointer leaves it */
const HOVER_CLOSE_DELAY_MS = 150;

/** One action in an {@link ActionsMenu}. */
export interface ActionsMenuItem {
	/** Identifies the action, and names its data-testid */
	id: string;
	/** The action's name */
	label: string;
	/** Shown before the name */
	icon: LucideIcon;
	/** Whether the action is running, which disables it */
	isBusy?: boolean;
	/** Shown in place of the name while the action runs, such as "Exporting..." */
	busyLabel?: string;
	/** Runs the action */
	onSelect: () => void;
}

export interface ActionsMenuProps {
	/** The actions the viewer has, in order. With none, the menu is not shown. */
	items: ActionsMenuItem[];
	/** Prefix for the data-testid of the trigger and each item */
	testIdPrefix: string;
}

/**
 * A header's Actions menu: a button that opens a list of the actions the
 * viewer has. It opens when the mouse hovers over it, as well as on a click or
 * from the keyboard, and is not shown when the viewer has no actions.
 */
export const ActionsMenu = ({ items, testIdPrefix }: ActionsMenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	// a menu the hover opened leaves focus where it is, both when it opens and
	// when it closes, so moving the mouse across the header never moves focus
	const isOpenedByHover = useRef(false);

	useEffect(
		() => () => {
			if (closeTimer.current) {
				clearTimeout(closeTimer.current);
			}
		},
		[],
	);

	if (items.length === 0) {
		return null;
	}

	const isBusy = items.some((item) => item.isBusy);

	const cancelClose = () => {
		if (closeTimer.current) {
			clearTimeout(closeTimer.current);
			closeTimer.current = null;
		}
	};

	// a click or a key opens the menu with focus in it
	const handleOpenChange = (open: boolean) => {
		if (open) {
			isOpenedByHover.current = false;
		}
		setIsOpen(open);
	};

	const handlePointerEnter = (event: React.PointerEvent) => {
		if (event.pointerType !== "mouse") {
			return;
		}
		cancelClose();
		if (!isOpen) {
			isOpenedByHover.current = true;
			setIsOpen(true);
		}
	};

	// leaving the trigger for the menu, or the menu for the trigger, keeps it open
	const handlePointerLeave = (event: React.PointerEvent) => {
		if (event.pointerType !== "mouse") {
			return;
		}
		cancelClose();
		closeTimer.current = setTimeout(
			() => setIsOpen(false),
			HOVER_CLOSE_DELAY_MS,
		);
	};

	const handleAutoFocus = (event: Event) => {
		if (isOpenedByHover.current) {
			event.preventDefault();
		}
	};

	return (
		<DropdownMenu
			open={isOpen}
			onOpenChange={handleOpenChange}
			modal={false}
		>
			<DropdownMenuTrigger asChild ref={triggerRef}>
				<Button
					type="button"
					variant="outline"
					onPointerEnter={handlePointerEnter}
					onPointerLeave={handlePointerLeave}
					onPointerDown={(event) => {
						// a click on a menu the hover opened keeps it open
						if (event.pointerType === "mouse" && isOpen) {
							event.preventDefault();
						}
					}}
					data-testid={`${testIdPrefix}-btn`}
				>
					{isBusy ? <Spinner className="size-4" /> : null}
					Actions
					<ChevronDown aria-hidden />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				onPointerEnter={handlePointerEnter}
				onPointerLeave={handlePointerLeave}
				onOpenAutoFocus={handleAutoFocus}
				onCloseAutoFocus={(event) => {
					handleAutoFocus(event);
					isOpenedByHover.current = false;
				}}
				onPointerDownOutside={(event) => {
					// the trigger's own pointer down decides whether the menu stays open
					if (
						event.target instanceof Node &&
						triggerRef.current?.contains(event.target)
					) {
						event.preventDefault();
					}
				}}
			>
				{items.map((item) => (
					<DropdownMenuItem
						key={item.id}
						disabled={item.isBusy}
						onSelect={item.onSelect}
						data-testid={`${testIdPrefix}-${item.id}-item`}
					>
						<item.icon aria-hidden />
						{item.isBusy && item.busyLabel
							? item.busyLabel
							: item.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
