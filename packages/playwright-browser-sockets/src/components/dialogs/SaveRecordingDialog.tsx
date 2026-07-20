import {
	Autocomplete,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
} from "@mui/material";
import type { RecordingProjectOption } from "../../types/browserEvents";

interface SaveRecordingDialogProps {
	open: boolean;
	projects: RecordingProjectOption[];
	project: RecordingProjectOption | null;
	title: string;
	fileName: string;
	description: string;
	intent: string;
	isLoadingProjects: boolean;
	isSaving: boolean;
	canSave: boolean;
	onClose: () => void;
	onProjectChange: (project: RecordingProjectOption | null) => void;
	onTitleChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onIntentChange: (value: string) => void;
	onSave: () => void;
}

export function SaveRecordingDialog({
	open,
	projects,
	project,
	title,
	fileName,
	description,
	intent,
	isLoadingProjects,
	isSaving,
	canSave,
	onClose,
	onProjectChange,
	onTitleChange,
	onDescriptionChange,
	onIntentChange,
	onSave,
}: SaveRecordingDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle>Save recording</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ pt: 1 }}>
					<Autocomplete
						options={projects}
						value={project}
						onChange={(_, value) => onProjectChange(value)}
						loading={isLoadingProjects}
						getOptionLabel={(option) => option.label}
						isOptionEqualToValue={(option, value) =>
							option.value === value.value
						}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Project"
								required
								autoFocus
								helperText="Only Playwright-tagged portal projects are shown."
							/>
						)}
					/>
					<TextField
						label="Title"
						value={title}
						onChange={(event) => onTitleChange(event.target.value)}
						placeholder="Github login"
					/>
					<TextField
						label="File name"
						value={fileName}
						disabled
						helperText="Generated from title and today's date."
					/>
					<TextField
						label="Description"
						value={description}
						onChange={(event) =>
							onDescriptionChange(event.target.value)
						}
						multiline
						minRows={2}
					/>
					<TextField
						label="Intent"
						value={intent}
						onChange={(event) => onIntentChange(event.target.value)}
						multiline
						minRows={2}
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					variant="contained"
					onClick={onSave}
					disabled={isSaving || !canSave || !project}
				>
					{isSaving ? "Saving…" : "Save"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
