import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "@semoss/ui/next";

/** How far one arrow key press moves the line, in px. */
const KEYBOARD_STEP = 24;

/** Props for {@link FileExplorerSectionResizer}. */
export interface FileExplorerSectionResizerProps {
	/** What the line resizes, for its accessible name. */
	label: string;
	/** The upper section's share of the two, from 0 to 100. */
	value: number;
	/** A resize starts. */
	onResizeStart: () => void;
	/**
	 * The line moved.
	 *
	 * @param delta - How far from where it started, in px; down is positive.
	 */
	onResize: (delta: number) => void;
	/** The resize ended; keep it. */
	onResizeEnd: () => void;
}

/**
 * The line between two sections of the Files panel: drag it, or focus it and
 * press the up and down arrows, to give one more room and the other less.
 *
 * @param props - Its name and what a resize reports to.
 * @returns The line.
 */
export const FileExplorerSectionResizer = ({
	label,
	value,
	onResizeStart,
	onResize,
	onResizeEnd,
}: FileExplorerSectionResizerProps) => {
	const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) {
			return;
		}

		e.preventDefault();
		const handle = e.currentTarget;
		const startY = e.clientY;
		handle.setPointerCapture(e.pointerId);
		onResizeStart();

		const handleMove = (event: globalThis.PointerEvent) =>
			onResize(event.clientY - startY);
		const handleUp = () => {
			handle.removeEventListener("pointermove", handleMove);
			handle.removeEventListener("pointerup", handleUp);
			handle.removeEventListener("pointercancel", handleUp);
			onResizeEnd();
		};
		handle.addEventListener("pointermove", handleMove);
		handle.addEventListener("pointerup", handleUp);
		handle.addEventListener("pointercancel", handleUp);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		const step =
			e.key === "ArrowUp"
				? -KEYBOARD_STEP
				: e.key === "ArrowDown"
					? KEYBOARD_STEP
					: 0;
		if (step === 0) {
			return;
		}

		e.preventDefault();
		onResizeStart();
		onResize(step);
		onResizeEnd();
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: a focusable splitter is a separator role on a div; <hr> cannot take focus or keys
		<div
			role="separator"
			aria-orientation="horizontal"
			aria-label={label}
			aria-valuenow={Math.round(value)}
			aria-valuemin={0}
			aria-valuemax={100}
			tabIndex={0}
			onPointerDown={handlePointerDown}
			onKeyDown={handleKeyDown}
			className={cn(
				"-my-0.5 relative z-10 h-1 shrink-0 cursor-row-resize touch-none",
				"after:-translate-y-1/2 after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-transparent after:transition-colors motion-reduce:after:transition-none",
				"hover:after:h-0.5 hover:after:bg-primary focus-visible:outline-none focus-visible:after:h-0.5 focus-visible:after:bg-ring",
			)}
		/>
	);
};
