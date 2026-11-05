import { useState } from "react";
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
import { getErrorMessage } from "@semoss/utility/error";
import type { AgentRunRoomClosure } from "@/api/agent-runs";

export interface CloseAgentRoomDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The room to close */
	roomId: string;
	/** The room's name, or its id when it has none */
	roomLabel: string;
	/**
	 * Who the room belongs to when it is someone else's, such as an admin
	 * closing a user's room; null when it is the signed in user's own
	 */
	ownerLabel: string | null;
	/** Closes the room, returning what it closed and stopped */
	onConfirm: () => Promise<AgentRunRoomClosure>;
	/** Called when the dialog closes, with what closing did once it ran */
	onClose: (closure?: AgentRunRoomClosure) => void;
}

/**
 * Confirms and closes a room with an agent: stops every run still going in it
 * and its subagents' rooms, even while they run, and closes the rooms, so they
 * leave their user's conversations and no agent runs in them again.
 */
export const CloseAgentRoomDialog = ({
	open,
	roomId,
	roomLabel,
	ownerLabel,
	onConfirm,
	onClose,
}: CloseAgentRoomDialogProps) => {
	const [isClosing, setIsClosing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleClose = (closure?: AgentRunRoomClosure) => {
		setError(null);
		onClose(closure);
	};

	const handleConfirm = async () => {
		setIsClosing(true);
		setError(null);
		let closure: AgentRunRoomClosure;
		try {
			closure = await onConfirm();
		} catch (e: unknown) {
			setError(getErrorMessage(e, "Could not close the room"));
			setIsClosing(false);
			return;
		}
		setIsClosing(false);
		const stopped = closure.cancelledRunIds.length;
		const runs = `${stopped} ${stopped === 1 ? "run" : "runs"}`;
		if (!closure.closedRoomIds.includes(roomId)) {
			toast.warning(
				stopped > 0
					? `Stopped ${runs}, but the room could not be closed. Try again.`
					: "The room could not be closed. Try again.",
			);
		} else {
			toast.success(
				stopped > 0
					? `Closed the room and stopped ${runs}.`
					: "Closed the room. No runs were still going.",
			);
		}
		handleClose(closure);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isClosing) {
					handleClose();
				}
			}}
		>
			<DialogContent
				showCloseButton={!isClosing}
				onEscapeKeyDown={(event) => {
					if (isClosing) {
						event.preventDefault();
					}
				}}
				onInteractOutside={(event) => {
					if (isClosing) {
						event.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Close Room
					</DialogTitle>
					<DialogDescription>
						Closing stops every run still going in{" "}
						<span className="break-words font-medium text-foreground">
							{roomLabel}
						</span>{" "}
						and in its subagents' rooms, even while they run.{" "}
						{ownerLabel ? (
							<>
								The rooms close for{" "}
								<span className="font-medium text-foreground">
									{ownerLabel}
								</span>
								: they no longer see them in their
								conversations, and no agent runs in them again.
							</>
						) : (
							"The rooms close: you no longer see them in your conversations, and no agent runs in them again."
						)}{" "}
						This can't be undone.
					</DialogDescription>
				</DialogHeader>
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isClosing}
						onClick={() => handleClose()}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={isClosing}
						onClick={handleConfirm}
						data-testid="closeAgentRoomDialog-close-btn"
					>
						{isClosing ? <Spinner className="size-4" /> : null}
						{isClosing ? "Closing..." : "Close Room"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
