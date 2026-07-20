import { Box, Divider } from "@mui/material";
import type { PlaybackController } from "../../hooks/usePlaybackController";
import type {
	RemoteBrowserRecordedStep,
	SelectedTextContext,
} from "../../types/browserEvents";
import { SelectedTextContextsPanel } from "../SelectedTextContextsPanel";
import { LoadedRecordingPanel } from "./LoadedRecordingPanel";
import { RecordedStepsPanel } from "./RecordedStepsPanel";
import { ReplayControlsPanel } from "./ReplayControlsPanel";

interface ReplaySidebarProps {
	playback: PlaybackController;
	recordedStepsOpen: boolean;
	recordedSteps: RemoteBrowserRecordedStep[];
	isRecording: boolean;
	onToggleRecordedSteps: () => void;
	onSaveRecording: () => void;
	selectedTextContextsOpen: boolean;
	selectedTextContexts: SelectedTextContext[];
	onToggleSelectedTextContexts: () => void;
	onCopySelectedContext: (context: SelectedTextContext) => void;
	onDeleteSelectedContext: (contextId: string) => void;
	onSaveSelectedContext: (contextId: string, content: string) => void;
}

export function ReplaySidebar(props: ReplaySidebarProps) {
	const isOpen =
		props.playback.controlsOpen ||
		props.playback.loadedRecordingOpen ||
		props.recordedStepsOpen ||
		props.selectedTextContextsOpen;

	return (
		<Box
			sx={{
				width: isOpen ? 340 : 0,
				borderLeft: "1px solid",
				borderColor: "divider",
				bgcolor: "background.paper",
				display: "flex",
				flexDirection: "column",
				minHeight: 0,
				overflow: "hidden",
				transition: "width 160ms ease",
			}}
		>
			<Box sx={{ overflow: "auto", minHeight: 0 }}>
				<ReplayControlsPanel playback={props.playback} />
				<Divider />
				<SelectedTextContextsPanel
					open={props.selectedTextContextsOpen}
					contexts={props.selectedTextContexts}
					onToggle={props.onToggleSelectedTextContexts}
					onCopy={props.onCopySelectedContext}
					onDelete={props.onDeleteSelectedContext}
					onSave={props.onSaveSelectedContext}
				/>
				<Divider />
				<LoadedRecordingPanel playback={props.playback} />
				<Divider />
				<RecordedStepsPanel
					open={props.recordedStepsOpen}
					isRecording={props.isRecording}
					steps={props.recordedSteps}
					onToggle={props.onToggleRecordedSteps}
					onSave={props.onSaveRecording}
				/>
			</Box>
		</Box>
	);
}
