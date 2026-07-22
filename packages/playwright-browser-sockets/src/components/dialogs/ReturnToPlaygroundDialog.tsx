import AppsIcon from "@mui/icons-material/Apps";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
} from "@mui/material";

interface ReturnToPlaygroundDialogProps {
	open: boolean;
	disabled: boolean;
	onClose: () => void;
	onSaveToApp: () => void;
	onSaveToRoom: () => void;
}

export function ReturnToPlaygroundDialog({
	open,
	disabled,
	onClose,
	onSaveToApp,
	onSaveToRoom,
}: ReturnToPlaygroundDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={disabled ? undefined : onClose}
			fullWidth
			maxWidth="xs"
		>
			<DialogTitle>Where should this recording be saved?</DialogTitle>
			<DialogContent>
				<Stack spacing={1.5} sx={{ pt: 0.5 }}>
					<Button
						variant="outlined"
						startIcon={<AppsIcon />}
						onClick={onSaveToApp}
						disabled={disabled}
						fullWidth
					>
						Playwright app
					</Button>
					<Button
						variant="contained"
						startIcon={<MeetingRoomIcon />}
						onClick={onSaveToRoom}
						disabled={disabled}
						fullWidth
					>
						Playground room
					</Button>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={disabled}>
					Cancel
				</Button>
			</DialogActions>
		</Dialog>
	);
}
