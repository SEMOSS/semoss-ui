import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

interface StopRecordingDialogProps {
	open: boolean;
	onClose: () => void;
	onDiscard: () => void;
	onSave: () => void;
}

export function StopRecordingDialog({
	open,
	onClose,
	onDiscard,
	onSave,
}: StopRecordingDialogProps) {
	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Stop recording?</DialogTitle>
					<DialogDescription>
						Do you want to save the steps recorded in this recording
						window, or discard them?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="destructive" onClick={onDiscard}>
						Discard
					</Button>
					<Button onClick={onSave}>Save steps</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
