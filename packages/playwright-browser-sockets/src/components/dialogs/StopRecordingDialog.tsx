import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
} from "@mui/material";

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
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>Stop recording?</DialogTitle>
			<DialogContent>
				Do you want to save the steps recorded in this recording window,
				or discard them?
			</DialogContent>
			<DialogActions>
				<Button color="error" onClick={onDiscard}>
					Discard
				</Button>
				<Button variant="contained" onClick={onSave}>
					Save steps
				</Button>
			</DialogActions>
		</Dialog>
	);
}
