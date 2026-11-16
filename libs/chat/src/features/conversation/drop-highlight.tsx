import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";
import { useFileDrop } from "../composer/file-drop.context";

/** File-drop feedback inside the conversation's FileDropProvider. */
export function DropHighlight({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
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
