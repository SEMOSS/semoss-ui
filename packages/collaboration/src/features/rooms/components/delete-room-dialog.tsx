import { type RefObject, useEffect, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { toError } from "@semoss/utility";
import type { Session } from "@/types/session";

interface DeleteRoomDialogProps {
	open: boolean;
	room: Session | null;
	returnFocusRef: RefObject<HTMLButtonElement | null>;
	fallbackFocusRef: RefObject<HTMLButtonElement | null>;
	onOpenChange: (open: boolean) => void;
	onAfterClose: () => void;
	onDelete: (roomId: string) => Promise<void>;
}

/** Confirm and persist removal of one room from the user's room list. */
export function DeleteRoomDialog({
	open,
	room,
	returnFocusRef,
	fallbackFocusRef,
	onOpenChange,
	onAfterClose,
	onDelete,
}: DeleteRoomDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (open) setError(null);
	}, [open]);

	if (!room) return null;

	async function handleDelete(): Promise<void> {
		setIsDeleting(true);
		setError(null);
		try {
			await onDelete(room.id);
		} catch (cause: unknown) {
			setError(toError(cause));
			return;
		} finally {
			setIsDeleting(false);
		}
		toast.success("Room deleted.");
		onOpenChange(false);
	}

	function handleOpenChange(nextOpen: boolean): void {
		if (!nextOpen && isDeleting) return;
		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				showCloseButton={!isDeleting}
				aria-busy={isDeleting}
				onEscapeKeyDown={(event) => {
					if (isDeleting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isDeleting) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					const returnTarget = returnFocusRef.current;
					if (returnTarget?.isConnected) returnTarget.focus();
					else fallbackFocusRef.current?.focus();
					onAfterClose();
				}}
			>
				<DialogHeader>
					<DialogTitle>Delete room</DialogTitle>
					<DialogDescription>
						Delete “{room.title}”? This removes the room from your
						room list.
					</DialogDescription>
				</DialogHeader>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>
							The room could not be deleted. {error.message}
						</AlertDescription>
					</Alert>
				)}
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isDeleting}
						onClick={() => handleOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={isDeleting}
						onClick={() => void handleDelete()}
					>
						{isDeleting && <Spinner className="size-4" />}
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
