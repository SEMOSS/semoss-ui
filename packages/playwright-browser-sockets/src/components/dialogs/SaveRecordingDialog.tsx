import {
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	LinearProgress,
	Stack,
	TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type {
	RecordingMetadataModelOption,
	RecordingProjectOption,
} from "../../types/browserEvents";

interface SaveRecordingDialogProps {
	open: boolean;
	projects: RecordingProjectOption[];
	project: RecordingProjectOption | null;
	models: RecordingMetadataModelOption[];
	model: RecordingMetadataModelOption | null;
	title: string;
	fileName: string;
	description: string;
	intent: string;
	isLoadingProjects: boolean;
	isLoadingModels: boolean;
	isGeneratingMetadata: boolean;
	isSaving: boolean;
	canSave: boolean;
	onClose: () => void;
	onProjectChange: (project: RecordingProjectOption | null) => void;
	onModelChange: (model: RecordingMetadataModelOption | null) => void;
	onTitleChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onIntentChange: (value: string) => void;
	onGenerateMetadata: () => void;
	onSave: () => void;
}

export function SaveRecordingDialog({
	open,
	projects,
	project,
	models,
	model,
	title,
	fileName,
	description,
	intent,
	isLoadingProjects,
	isLoadingModels,
	isGeneratingMetadata,
	isSaving,
	canSave,
	onClose,
	onProjectChange,
	onModelChange,
	onTitleChange,
	onDescriptionChange,
	onIntentChange,
	onGenerateMetadata,
	onSave,
}: SaveRecordingDialogProps) {
	const hasRequiredMetadata =
		title.trim().length > 0 &&
		description.trim().length > 0 &&
		intent.trim().length > 0;

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
					<Autocomplete
						options={models}
						value={model}
						onChange={(_, value) => onModelChange(value)}
						loading={isLoadingModels}
						disabled={isGeneratingMetadata}
						getOptionLabel={(option) => option.label}
						isOptionEqualToValue={(option, value) =>
							option.value === value.value
						}
						renderInput={(params) => (
							<TextField
								{...params}
								label="AI model"
								helperText="Used only when generating recording metadata."
							/>
						)}
					/>
					<Box
						sx={{
							display: "flex",
							justifyContent: "flex-end",
							mt: -1,
						}}
					>
						<Button
							variant="text"
							size="small"
							onClick={onGenerateMetadata}
							disabled={!model || isGeneratingMetadata}
							sx={{
								minWidth: 0,
								px: 0.5,
								fontSize: "0.76rem",
								textDecoration: "underline",
							}}
						>
							{isGeneratingMetadata
								? "Generating recording details…"
								: "Generate recording details with AI"}
						</Button>
					</Box>
					<Box sx={{ position: "relative" }}>
						<Stack spacing={2}>
							<TextField
								label="Title"
								value={title}
								onChange={(event) =>
									onTitleChange(event.target.value)
								}
								placeholder="e.g., Submit a customer support request"
								disabled={isGeneratingMetadata}
								required
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
								placeholder="Describe the business workflow performed by this recording."
								disabled={isGeneratingMetadata}
								required
								multiline
								minRows={2}
							/>
							<TextField
								label="Intent"
								value={intent}
								onChange={(event) =>
									onIntentChange(event.target.value)
								}
								placeholder="Explain the business goal this recording achieves."
								disabled={isGeneratingMetadata}
								required
								multiline
								minRows={2}
							/>
						</Stack>
						{isGeneratingMetadata && (
							<Box
								sx={{
									position: "absolute",
									inset: 0,
									zIndex: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: (theme) =>
										alpha(
											theme.palette.background.paper,
											0.72,
										),
								}}
							>
								<LinearProgress
									sx={{
										position: "absolute",
										top: 0,
										left: 0,
										right: 0,
									}}
								/>
								<CircularProgress size={28} />
							</Box>
						)}
					</Box>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					variant="contained"
					onClick={onSave}
					disabled={
						isSaving ||
						isGeneratingMetadata ||
						!canSave ||
						!project ||
						!hasRequiredMetadata
					}
				>
					{isSaving ? "Saving…" : "Save"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
