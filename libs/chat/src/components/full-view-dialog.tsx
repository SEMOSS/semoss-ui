import type { ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

export interface FullViewDialogProps {
	title: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
}

/** Fullscreen viewer shared by code/Mermaid/HTML-preview blocks — ported from playground's own per-block "Full View" dialog (mermaid-block.tsx, html-preview-block.tsx, code-preview-block.tsx all repeat this same shell). */
export function FullViewDialog({
	title,
	open,
	onOpenChange,
	children,
}: FullViewDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 p-3 sm:w-[100dvw] sm:max-w-[100dvw]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="relative h-full min-h-0 overflow-auto">
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
}
