import type React from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** The menu's width in px; matches its `w-72`. */
const MENU_WIDTH = 288;

/** The menu's smallest distance from the window's edge, in px. */
const MENU_GUTTER = 8;

/**
 * The room the menu needs below the caret, in px (its `max-h-80` list plus
 * margin); with less, it opens above.
 */
const MENU_FLIP_HEIGHT = 340;

/** Props for {@link SlashCommandMenuPortal}. */
interface SlashCommandMenuPortalProps {
	/** The caret's rectangle when "/" was typed, in viewport px. */
	menuPosition: { top: number; bottom: number; left: number };
	/** Closes the menu after a pointer down outside it. */
	onClose: () => void;
	/** The menu. */
	children: React.ReactNode;
}

/**
 * Renders the slash command menu into a portal and closes it when the user
 * clicks outside — without blocking the click from reaching its target.
 */
export const SlashCommandMenuPortal: React.FC<SlashCommandMenuPortalProps> = ({
	menuPosition,
	onClose,
	children,
}) => {
	const ref = useRef<HTMLDivElement>(null);
	// Stable ref so the effect never needs to re-register
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		const handlePointerDown = (e: PointerEvent) => {
			if (!ref.current?.contains(e.target as Node)) {
				onCloseRef.current();
			}
		};
		// pointerdown fires before Radix's own pointerdown handler and before
		// the browser can suppress mousedown (which Radix does via preventDefault).
		// Capture phase ensures we run before any stopPropagation in the tree.
		document.addEventListener("pointerdown", handlePointerDown, true);
		return () =>
			document.removeEventListener(
				"pointerdown",
				handlePointerDown,
				true,
			);
	}, []);

	// keep the whole menu on screen when the caret is near the right edge
	const left = Math.max(
		MENU_GUTTER,
		Math.min(
			menuPosition.left,
			window.innerWidth - MENU_WIDTH - MENU_GUTTER,
		),
	);

	return createPortal(
		<div
			ref={ref}
			style={{
				position: "fixed",
				...(window.innerHeight - menuPosition.bottom < MENU_FLIP_HEIGHT
					? { bottom: window.innerHeight - menuPosition.top + 4 }
					: { top: menuPosition.bottom + 4 }),
				left,
				zIndex: 50,
			}}
			className="w-72 overflow-hidden rounded-md border border-border bg-popover shadow-md"
		>
			{children}
		</div>,
		document.body,
	);
};
