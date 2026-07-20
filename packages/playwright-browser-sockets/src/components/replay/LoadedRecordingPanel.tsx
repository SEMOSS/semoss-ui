import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	Box,
	Chip,
	Collapse,
	IconButton,
	List,
	Typography,
} from "@mui/material";
import type { PlaybackController } from "../../hooks/usePlaybackController";
import { RecordingStepRow } from "./RecordingStepRow";

export function LoadedRecordingPanel({
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
					display: "flex",
					alignItems: "center",
					gap: 0.5,
					borderBottom: playback.loadedRecordingOpen
						? "1px solid"
						: 0,
					borderColor: "divider",
				}}
			>
				<IconButton
					size="small"
					disabled={!playback.loadedRecording}
					onClick={() =>
						playback.setLoadedRecordingOpen(
							!playback.loadedRecordingOpen,
						)
					}
					sx={{ p: 0.25 }}
				>
					{playback.loadedRecordingOpen ? (
						<ExpandMoreIcon />
					) : (
						<ChevronRightIcon />
					)}
				</IconButton>
				<Box sx={{ flex: 1 }}>
					<Typography variant="subtitle2">
						Loaded recording
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{playback.loadedRecording
							? playback.selectedRecording
							: "Load a recording to inspect and replay steps"}
					</Typography>
				</Box>
				{playback.loadedRecording && (
					<Chip
						size="small"
						label={`${playback.loadedStepCount} steps`}
					/>
				)}
				{playback.typeStepCount > 0 && (
					<Chip
						size="small"
						label={`${playback.typeStepCount} inputs`}
					/>
				)}
			</Box>
			<Collapse in={playback.loadedRecordingOpen}>
				<List dense disablePadding>
					{playback.flattenedSteps.length === 0 ? (
						<Box sx={{ p: 2 }}>
							<Typography variant="body2" color="text.secondary">
								Load a recording to see its steps here.
							</Typography>
						</Box>
					) : (
						playback.flattenedSteps.map(
							({ tabId, step, index }) => (
								<RecordingStepRow
									key={`${tabId}-${step.id ?? index}`}
									tabId={tabId}
									step={step}
									index={index}
									playback={playback}
								/>
							),
						)
					)}
				</List>
			</Collapse>
		</>
	);
}
