import { type ReactElement, useState } from "react";
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
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	joinNames,
	type ServedModelConfirmation,
} from "./use-served-model-actions";

export interface ServedModelChangeDialogProps {
	/** The change to confirm; it stays while the dialog closes */
	confirmation: ServedModelConfirmation | null;
	open: boolean;
	/** Makes the change, rejecting with the reason when it fails */
	onConfirm: () => Promise<void>;
	onDismiss: () => void;
}

/** What each change says before it is made */
function describeChange({ change, model, blocking }: ServedModelConfirmation): {
	title: string;
	description: string;
	confirmLabel: string;
	busyLabel: string;
	isDestructive: boolean;
} {
	const name = model.servedModel;
	if (change === "stop") {
		return {
			title: `Stop ${name}?`,
			description: `This frees the GPU and memory it holds. Apps that use it are told it is stopped until an admin starts it again, which takes a few minutes.`,
			confirmLabel: "Stop Model",
			busyLabel: "Stopping...",
			isDestructive: false,
		};
	}
	if (change === "remove") {
		return {
			title: `Remove ${name}?`,
			description: `This deletes its InferenceService and Service from the cluster. Its SEMOSS engines stay, but cannot answer until a model of this name is defined again from the catalog.`,
			confirmLabel: "Remove Model",
			busyLabel: "Removing...",
			isDestructive: true,
		};
	}
	const others = joinNames(blocking);
	const isOne = blocking.length === 1;
	return {
		title: `Start ${name} in place of ${others}?`,
		description: `${name} does not fit while ${others} ${isOne ? "runs" : "run"}. Starting it stops ${isOne ? "it" : "them"} first, and apps that use ${isOne ? "it" : "them"} are told ${isOne ? "it is" : "they are"} stopped.`,
		confirmLabel: `Stop ${isOne ? "It" : "Them"} and Start`,
		busyLabel: "Starting...",
		isDestructive: false,
	};
}

/**
 * Confirms a change that interrupts someone: stopping a model, removing it, or
 * starting one in place of others. A refused change shows its reason here and
 * leaves the dialog open.
 */
export function ServedModelChangeDialog({
	confirmation,
	open,
	onConfirm,
	onDismiss,
}: ServedModelChangeDialogProps): ReactElement {
	const [isConfirming, setIsConfirming] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const text = confirmation ? describeChange(confirmation) : null;

	const handleOpenChange = (isOpen: boolean): void => {
		if (!isOpen && !isConfirming) {
			setError(null);
			onDismiss();
		}
	};

	const handleConfirm = async (): Promise<void> => {
		setIsConfirming(true);
		setError(null);
		try {
			await onConfirm();
		} catch (cause: unknown) {
			setError(getErrorMessage(cause, "The change was not made."));
		} finally {
			setIsConfirming(false);
		}
	};

	return (
		<Dialog
			open={open && confirmation !== null}
			onOpenChange={handleOpenChange}
		>
			<DialogContent
				showCloseButton={!isConfirming}
				onEscapeKeyDown={(event) => {
					if (isConfirming) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isConfirming) event.preventDefault();
				}}
			>
				{text ? (
					<>
						<DialogHeader>
							<DialogTitle className="break-words">
								{text.title}
							</DialogTitle>
							<DialogDescription>
								{text.description}
							</DialogDescription>
						</DialogHeader>
						{error ? (
							<Alert variant="destructive">
								<AlertDescription className="break-words">
									{error}
								</AlertDescription>
							</Alert>
						) : null}
						<DialogFooter className="flex-col sm:flex-row">
							<Button
								type="button"
								variant="outline"
								disabled={isConfirming}
								onClick={() => handleOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant={
									text.isDestructive
										? "destructive"
										: "default"
								}
								disabled={isConfirming}
								onClick={() => void handleConfirm()}
							>
								{isConfirming ? (
									<Spinner className="size-4" />
								) : null}
								{isConfirming
									? text.busyLabel
									: text.confirmLabel}
							</Button>
						</DialogFooter>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
