import type { ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from "@semoss/ui/next";

interface TopicReviewDialogProps {
	title: string;
	description: string;
	isBusy: boolean;
	triggerId: string;
	onClose: () => void;
	children: ReactNode;
}

/** Shared review composition with explicit pending dismissal, focus return and reduced-motion overlays. */
export function TopicReviewDialog({
	title,
	description,
	isBusy,
	triggerId,
	onClose,
	children,
}: TopicReviewDialogProps) {
	return (
		<Dialog
			open
			onOpenChange={(isOpen) => {
				if (!isOpen && !isBusy) onClose();
			}}
		>
			<DialogPortal>
				<DialogOverlay className="bg-background/80 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none" />
			</DialogPortal>
			<DialogContent
				showOverlay={false}
				showCloseButton={!isBusy}
				className="min-w-0 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none sm:max-w-4xl"
				onEscapeKeyDown={(event) => {
					if (isBusy) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isBusy) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					document.getElementById(triggerId)?.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
}
