import {
	type ComponentProps,
	type RefObject,
	useEffect,
	useRef,
	useState,
} from "react";
import type { PopoverAnchor, PopoverContent } from "@semoss/ui/next";

interface MessageActionsPopover {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	anchorProps: ComponentProps<typeof PopoverAnchor>;
	contentProps: ComponentProps<typeof PopoverContent>;
	actionRef: RefObject<HTMLButtonElement | null>;
}

/** Opens response actions without a trigger button or moving focus on hover. */
export function useMessageActionsPopover(): MessageActionsPopover {
	const [isOpen, setIsOpen] = useState(false);
	const anchorRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const actionRef = useRef<HTMLButtonElement>(null);
	const closeTimer = useRef<number | undefined>(undefined);
	const isReturningFocus = useRef(false);
	const shouldFocusAction = useRef(false);

	useEffect(() => () => window.clearTimeout(closeTimer.current), []);

	function cancelClose(): void {
		window.clearTimeout(closeTimer.current);
	}

	function show(): void {
		cancelClose();
		setIsOpen(true);
	}

	function scheduleClose(): void {
		cancelClose();
		// Allow the pointer to cross the gap into the floating actions.
		closeTimer.current = window.setTimeout(() => {
			const active = document.activeElement;
			if (
				anchorRef.current?.contains(active) ||
				contentRef.current?.contains(active)
			)
				return;
			setIsOpen(false);
		}, 150);
	}

	function dismiss(): void {
		cancelClose();
		setIsOpen(false);
		if (contentRef.current?.contains(document.activeElement)) {
			isReturningFocus.current = true;
			anchorRef.current?.focus({ preventScroll: true });
			isReturningFocus.current = false;
		}
	}

	return {
		isOpen,
		setIsOpen,
		actionRef,
		anchorProps: {
			ref: anchorRef,
			tabIndex: 0,
			className:
				"rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
			onPointerEnter: (event) => {
				if (event.pointerType !== "touch") show();
			},
			onPointerLeave: scheduleClose,
			onFocus: (event) => {
				if (
					event.target === event.currentTarget &&
					!isReturningFocus.current
				)
					show();
			},
			onBlur: scheduleClose,
			onClick: (event) => {
				// Tapping prose reveals actions without intercepting links or tools.
				if (
					event.target instanceof Element &&
					!event.target.closest(
						"a, button, input, select, textarea, [role='button'], [contenteditable='true']",
					) &&
					!window.getSelection()?.toString()
				)
					show();
			},
			onKeyDown: (event) => {
				if (event.target !== event.currentTarget) return;
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					shouldFocusAction.current = !isOpen;
					show();
					actionRef.current?.focus();
				} else if (event.key === "Tab" && !event.shiftKey && isOpen) {
					event.preventDefault();
					actionRef.current?.focus();
				}
			},
		},
		contentProps: {
			ref: contentRef,
			onPointerEnter: cancelClose,
			onPointerLeave: scheduleClose,
			onFocus: cancelClose,
			onBlur: scheduleClose,
			onOpenAutoFocus: (event) => {
				if (!shouldFocusAction.current) event.preventDefault();
				shouldFocusAction.current = false;
			},
			onCloseAutoFocus: (event) => event.preventDefault(),
			onInteractOutside: (event) => {
				if (
					event.target instanceof Node &&
					anchorRef.current?.contains(event.target)
				)
					event.preventDefault();
			},
			onEscapeKeyDown: (event) => {
				event.preventDefault();
				dismiss();
			},
			onKeyDown: (event) => {
				if (event.key !== "Tab") return;
				// Return to the response; the next Tab continues in document order.
				event.preventDefault();
				dismiss();
			},
		},
	};
}
