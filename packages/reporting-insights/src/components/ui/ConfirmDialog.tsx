/**
 * Reusable confirmation modal for consequential actions (deletes, publishes, etc.).
 * Adapter over the shared @semoss/ui Dialog (which handles Escape/backdrop/focus
 * trap), keeping this app's controlled `open` + onConfirm/onCancel API.
 */

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { Button } from "./Button";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	message: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	/** Red styling + warning icon for destructive/permanent actions. */
	danger?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	danger = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onCancel();
			}}
		>
			<DialogContent className="max-w-md" aria-label={title}>
				<DialogHeader>
					<div className="flex items-start gap-3">
						{danger && (
							<span className="mt-0.5 shrink-0 rounded-full bg-red-50 p-2">
								<AlertTriangle className="h-5 w-5 text-red-500" />
							</span>
						)}
						<div className="min-w-0">
							<DialogTitle>{title}</DialogTitle>
							<DialogDescription asChild>
								<div className="mt-1 text-muted-foreground text-sm leading-relaxed">
									{message}
								</div>
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>
				<DialogFooter>
					<Button variant="secondary" size="sm" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button
						variant={danger ? "danger" : "primary"}
						size="sm"
						onClick={onConfirm}
						autoFocus
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
