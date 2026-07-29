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
		<aside
			className={`absolute inset-y-0 right-0 z-20 flex max-w-full flex-col overflow-hidden border-line border-l bg-surface shadow-xl transition-[width] duration-150 ${isOpen ? "w-[340px]" : "w-0 border-l-0"}`}
		>
			<div className="min-h-0 overflow-auto">
				<ReplayControlsPanel playback={props.playback} />
				<SelectedTextContextsPanel
					open={props.selectedTextContextsOpen}
					contexts={props.selectedTextContexts}
					onToggle={props.onToggleSelectedTextContexts}
					onCopy={props.onCopySelectedContext}
					onDelete={props.onDeleteSelectedContext}
					onSave={props.onSaveSelectedContext}
				/>
				<LoadedRecordingPanel playback={props.playback} />
				<RecordedStepsPanel
					open={props.recordedStepsOpen}
					isRecording={props.isRecording}
					steps={props.recordedSteps}
					onToggle={props.onToggleRecordedSteps}
					onSave={props.onSaveRecording}
				/>
			</div>
		</aside>
	);
}
