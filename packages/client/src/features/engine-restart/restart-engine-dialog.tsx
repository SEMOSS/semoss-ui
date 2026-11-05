import { useState } from "react";
import { restartEngine } from "@semoss/sdk";
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
import { useSession } from "@/hooks/use-session";

export interface RestartEngineDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The engine to restart */
	engineId: string;
	/** The engine's name */
	engineName: string;
	/** What the catalog calls this kind of engine, such as "Model" */
	engineLabel: string;
	/** Called when the dialog closes, with true after the engine was restarted */
	onClose: (restarted?: boolean) => void;
}

/**
 * Confirms and restarts an engine: closes it on every server, stopping the
 * python process it owns, so its next use opens it again from its current
 * files. Owners only.
 */
export const RestartEngineDialog = ({
	open,
	engineId,
	engineName,
	engineLabel,
	onClose,
}: RestartEngineDialogProps) => {
	const insightID = useSession((state) => state.insightID);
	const [isRestarting, setIsRestarting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const label = engineLabel.toLowerCase();

	const handleClose = (restarted?: boolean) => {
		setError(null);
		onClose(restarted);
	};

	const handleRestart = async () => {
		setIsRestarting(true);
		setError(null);
		let warnings: string[];
		try {
			({ warnings } = await restartEngine(engineId, insightID));
		} catch (e: unknown) {
			setError(getErrorMessage(e, `Could not restart the ${label}`));
			setIsRestarting(false);
			return;
		}
		setIsRestarting(false);
		toast.success(
			`Restarted ${engineName}. Its next use starts it with its current files.`,
		);
		for (const warning of warnings) {
			toast.warning(warning);
		}
		handleClose(true);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isRestarting) {
					handleClose();
				}
			}}
		>
			<DialogContent
				showCloseButton={!isRestarting}
				onEscapeKeyDown={(event) => {
					if (isRestarting) {
						event.preventDefault();
					}
				}}
				onInteractOutside={(event) => {
					if (isRestarting) {
						event.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Restart {engineLabel}
					</DialogTitle>
					<DialogDescription>
						Restarting closes{" "}
						<span className="font-medium text-foreground">
							{engineName}
						</span>{" "}
						on every server and stops its Python process, along with
						anything it is running for anyone right now. Its next
						use starts it again with its current files and settings,
						so changes to its files take effect.
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
						disabled={isRestarting}
						onClick={() => handleClose()}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={isRestarting}
						onClick={handleRestart}
						data-testid="restartEngineDialog-restart-btn"
					>
						{isRestarting ? <Spinner className="size-4" /> : null}
						{isRestarting
							? "Restarting..."
							: `Restart ${engineLabel}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
