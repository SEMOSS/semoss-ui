import { useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
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
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { trashEmail } from "../api/microsoft";

/** Explicit confirmation targets one provider message and keeps failures recoverable. */
export function DeleteEmailDialog({
	sourceId,
	subject,
	onClose,
	onDeleted,
}: {
	sourceId: string;
	subject: string;
	onClose: () => void;
	onDeleted?: () => void;
}) {
	const { actions } = useInsight();
	const collaboration = useOptionalCollaborationSession();
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState("");
	const locked = useRef(false);
	const returnFocus = useRef<HTMLElement | null>(null);
	const handleDelete = async (): Promise<void> => {
		if (locked.current) return;
		locked.current = true;
		setIsPending(true);
		setError("");
		try {
			await trashEmail(actions, sourceId);
		} catch (cause) {
			setError(
				`${cause instanceof Error ? cause.message : "Could not move this email."} Check Outlook before trying again.`,
			);
			return;
		} finally {
			locked.current = false;
			setIsPending(false);
		}
		collaboration?.dispatch({ type: "source.deleted", sourceId });
		toast.success("Email moved to Outlook Trash");
		onDeleted?.();
		onClose();
	};
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !locked.current) onClose();
			}}
		>
			<DialogContent
				showCloseButton={!isPending}
				onOpenAutoFocus={() => {
					returnFocus.current =
						document.activeElement instanceof HTMLElement
							? document.activeElement
							: null;
				}}
				onCloseAutoFocus={(event) => {
					if (returnFocus.current?.isConnected) {
						event.preventDefault();
						returnFocus.current.focus();
					}
				}}
				onEscapeKeyDown={(event) => {
					if (locked.current) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (locked.current) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Move email to Trash?</DialogTitle>
					<DialogDescription>
						“{subject || "Untitled email"}” will move to Outlook’s
						Deleted Items folder.
					</DialogDescription>
				</DialogHeader>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isPending}
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={isPending}
						onClick={() => void handleDelete()}
					>
						{isPending && <Spinner />}
						{isPending ? "Moving…" : "Move to Trash"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
