import { useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	toast,
} from "@semoss/ui/next";
import { resetMyData } from "@/features/onboarding/onboarding-api";

/** Wipes the owner's Collaboration data and starts onboarding again. */
export function ResetMyData() {
	const { actions } = useInsight();
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const reset = async () => {
		setBusy(true);
		try {
			await resetMyData(actions);
			// full reload so no loaded thread or edit survives in the page
			window.location.hash = "#/onboarding";
			window.location.reload();
		} catch (cause) {
			setBusy(false);
			toast.error(
				`Could not reset: ${cause instanceof Error ? cause.message : String(cause)}`,
			);
		}
	};
	return (
		<>
			<Button variant="outline" onClick={() => setOpen(true)}>
				Reset my data
			</Button>
			<Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reset all of your data?</DialogTitle>
						<DialogDescription>
							Your profile, people, topics, threads, rules, and
							work items are deleted, and onboarding starts again.
							Your Microsoft sign-in stays. This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={busy}
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={busy}
							onClick={reset}
						>
							{busy ? "Resetting..." : "Reset my data"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
