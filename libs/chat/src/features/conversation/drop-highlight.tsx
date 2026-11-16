import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";
import { useFileDrop } from "../composer/file-drop.context";

/** Props for {@link DropHighlight}. */
interface DropHighlightProps {
	/** Classes for the outlined box. */
	className?: string;
	/** What the outline surrounds. */
	children: ReactNode;
}

/**
 * Outline its children while a file is dragged over the page. Must render
 * inside a `FileDropProvider`, which reports the drag.
 */
export function DropHighlight({ className, children }: DropHighlightProps) {
	const { isDragging } = useFileDrop();
	return (
		<div
			className={cn(
				"relative border-2 border-transparent transition-colors motion-reduce:transition-none",
				className,
				isDragging && "border-primary bg-accent/30",
			)}
		>
			{children}
		</div>
	);
}
