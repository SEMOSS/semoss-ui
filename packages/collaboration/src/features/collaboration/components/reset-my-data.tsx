import { useState } from "react";
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
	DialogTrigger,
} from "@semoss/ui/next";
import { resetMyData } from "@/features/onboarding/onboarding-api";

/** Wipes the owner's Collaboration data after confirmation and starts onboarding again. */
export function ResetMyData() {
	const { actions } = useInsight();
	const [isOpen, setIsOpen] = useState(false);
	const [isBusy, setIsBusy] = useState(false);
	const [error, setError] = useState("");
	const handleReset = async (): Promise<void> => {
		setIsBusy(true);
		setError("");
		try {
			await resetMyData(actions);
		} catch (cause: unknown) {
			setIsBusy(false);
			setError(
				`Could not reset: ${cause instanceof Error ? cause.message : String(cause)}`,
			);
			return;
		}
		// Full reload so no loaded thread or edit survives in the page.
		window.location.hash = "#/onboarding";
		window.location.reload();
	};
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(next) => {
				if (!isBusy) {
					setIsOpen(next);
					if (next) setError("");
				}
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline">Reset my data</Button>
			</DialogTrigger>
			<DialogContent
				aria-busy={isBusy}
				showCloseButton={!isBusy}
				onEscapeKeyDown={(event) => {
					if (isBusy) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isBusy) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Reset all of your data?</DialogTitle>
					<DialogDescription>
						Your profile, people, topics, threads, rules, and work
						items are deleted, and onboarding starts again. Your
						Microsoft sign-in stays. This cannot be undone.
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
						disabled={isBusy}
						onClick={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={isBusy}
						onClick={handleReset}
					>
						{isBusy ? "Resetting..." : "Reset my data"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
