import CloseIcon from "@mui/icons-material/Close";
import {
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Radio,
	RadioGroup,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { RecordingProjectOption } from "../../types/browserEvents";

type RecordingDestination = "playground" | "playground-and-app";

interface ReturnToPlaygroundDialogProps {
	open: boolean;
	disabled: boolean;
	projects: RecordingProjectOption[];
	project: RecordingProjectOption | null;
	isLoadingProjects: boolean;
	onClose: () => void;
	onProjectChange: (project: RecordingProjectOption | null) => void;
	onSubmit: (project: RecordingProjectOption | null) => void;
}

const destinationOptions: Array<{
	value: RecordingDestination;
	title: string;
	description: string;
}> = [
	{
		value: "playground",
		title: "Playground only",
		description:
			"Save the recording, selected website contexts, and MCP configuration in Playground.",
	},
	{
		value: "playground-and-app",
		title: "Playground and Playwright app",
		description:
			"Save everything in Playground and also save the recording in the current Playwright app.",
	},
];

export function ReturnToPlaygroundDialog({
	open,
	disabled,
	projects,
	project,
	isLoadingProjects,
	onClose,
	onProjectChange,
	onSubmit,
}: ReturnToPlaygroundDialogProps) {
	const [destination, setDestination] =
		useState<RecordingDestination>("playground");

	useEffect(() => {
		if (open) setDestination("playground");
	}, [open]);

	const savingToApp = destination === "playground-and-app";

	return (
		<Dialog
			open={open}
			onClose={disabled ? undefined : onClose}
			fullWidth
			maxWidth="sm"
		>
			<DialogTitle sx={{ pr: 6 }}>
				Send to Playground
				<IconButton
					aria-label="Close"
					onClick={onClose}
					disabled={disabled}
					size="small"
					sx={{ position: "absolute", right: 16, top: 16 }}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<Typography sx={{ mb: 2 }}>
					Where should this recording be saved?
				</Typography>
				<RadioGroup
					value={destination}
					onChange={(event) =>
						setDestination(
							event.target.value as RecordingDestination,
						)
					}
					sx={{ gap: 1.5 }}
				>
					{destinationOptions.map((option) => {
						const selected = destination === option.value;
						return (
							<Box
								component="label"
								key={option.value}
								sx={{
									display: "flex",
									alignItems: "flex-start",
									gap: 1,
									p: 2,
									border: 1,
									borderColor: selected
										? "primary.main"
										: "divider",
									borderRadius: 1,
									cursor: disabled ? "default" : "pointer",
									bgcolor: selected
										? "action.selected"
										: "background.paper",
									transition: (theme) =>
										theme.transitions.create([
											"border-color",
											"background-color",
										]),
									"&:hover": disabled
										? undefined
										: { bgcolor: "action.hover" },
								}}
							>
								<Radio
									value={option.value}
									disabled={disabled}
									sx={{ p: 0.25 }}
								/>
								<Box sx={{ minWidth: 0 }}>
									<Typography fontWeight={600}>
										{option.title}
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ mt: 0.5 }}
									>
										{option.description}
									</Typography>
									{option.value === "playground-and-app" && (
										<Autocomplete
											options={projects}
											value={project}
											onChange={(_, value) =>
												onProjectChange(value)
											}
											onOpen={() =>
												setDestination(
													"playground-and-app",
												)
											}
											loading={isLoadingProjects}
											disabled={disabled}
											getOptionLabel={(item) =>
												item.label
											}
											isOptionEqualToValue={(
												item,
												value,
											) => item.value === value.value}
											renderInput={(params) => (
												<TextField
													{...params}
													label="Project"
													placeholder="Select a project"
													required={savingToApp}
													size="small"
													sx={{ mt: 1.5 }}
												/>
											)}
										/>
									)}
								</Box>
							</Box>
						);
					})}
				</RadioGroup>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5 }}>
				<Button onClick={onClose} disabled={disabled}>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={() => onSubmit(savingToApp ? project : null)}
					disabled={
						disabled ||
						(savingToApp && (isLoadingProjects || !project))
					}
					startIcon={
						disabled ? (
							<CircularProgress size={16} color="inherit" />
						) : undefined
					}
				>
					{disabled ? "Sending..." : "Send to Playground"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
