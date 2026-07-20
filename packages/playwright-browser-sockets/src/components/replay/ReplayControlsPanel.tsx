import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
	Autocomplete,
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	IconButton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import type { PlaybackController } from "../../hooks/usePlaybackController";

export function ReplayControlsPanel({
	playback,
}: {
	playback: PlaybackController;
}) {
	return (
		<>
			<Box
				sx={{
					px: 0.75,
					py: 0.4,
					borderBottom: "1px solid",
					borderColor: "divider",
					display: "flex",
					alignItems: "center",
					gap: 0.5,
				}}
			>
				<IconButton
					size="small"
					onClick={() =>
						playback.setControlsOpen(!playback.controlsOpen)
					}
					sx={{ p: 0.25 }}
				>
					{playback.controlsOpen ? (
						<ExpandMoreIcon />
					) : (
						<ChevronRightIcon />
					)}
				</IconButton>
				<Typography variant="subtitle2" sx={{ flex: 1 }}>
					Replay controls
				</Typography>
				{playback.isPaused && (
					<Chip size="small" color="warning" label="Paused" />
				)}
				{playback.isRunning && (
					<Chip size="small" color="primary" label="Running" />
				)}
			</Box>
			<Collapse in={playback.controlsOpen}>
				<Stack spacing={0.75} sx={{ p: 0.75 }}>
					<Autocomplete
						size="small"
						options={playback.projects}
						value={playback.project}
						onChange={(_, value) => playback.selectProject(value)}
						loading={playback.isLoadingProjects}
						getOptionLabel={(option) => option.label}
						isOptionEqualToValue={(option, value) =>
							option.value === value.value
						}
						renderInput={(params) => (
							<TextField {...params} label="Project" />
						)}
						slotProps={{ paper: { sx: { fontSize: 13 } } }}
					/>
					<Autocomplete
						size="small"
						options={playback.files}
						value={playback.selectedRecording}
						onChange={(_, value) => playback.selectRecording(value)}
						loading={playback.isLoadingFiles}
						getOptionLabel={(option) => option}
						renderInput={(params) => (
							<TextField {...params} label="Recording file" />
						)}
						noOptionsText={
							playback.project
								? "No recordings found"
								: "Select a project first"
						}
					/>
					<Stack direction="row" spacing={0.75}>
						<Button
							size="small"
							variant="outlined"
							disabled={
								!playback.hasSession ||
								!playback.selectedRecording ||
								playback.isLoadingRecording ||
								playback.isRunning
							}
							onClick={playback.load}
							startIcon={
								playback.isLoadingRecording ? (
									<CircularProgress size={14} />
								) : (
									<FolderOpenIcon />
								)
							}
							fullWidth
						>
							Load
						</Button>
						<Button
							size="small"
							variant="contained"
							disabled={
								!playback.loadedRecording || playback.isRunning
							}
							onClick={playback.run}
							startIcon={
								playback.isRunning ? (
									<CircularProgress size={14} />
								) : (
									<PlayArrowIcon />
								)
							}
							fullWidth
						>
							{playback.isPaused
								? "Resume"
								: playback.loadedRecording
									? `Run ${playback.loadedStepCount}`
									: "Run"}
						</Button>
						<Button
							size="small"
							color="warning"
							variant="outlined"
							disabled={!playback.isRunning}
							onClick={() =>
								playback.requestPause(
									"Playback pause requested",
								)
							}
							startIcon={<PauseIcon />}
						>
							Pause
						</Button>
					</Stack>
				</Stack>
			</Collapse>
		</>
	);
}
