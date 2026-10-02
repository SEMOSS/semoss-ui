import type { ContextReturnPlan } from "../../domain/selected-text";
import type { PlaybackController } from "../../hooks/usePlaybackController";
import type {
	CapturedContext,
	RemoteBrowserContextLimits,
	RemoteBrowserRecordedStep,
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
	selectedTextContexts: CapturedContext[];
	contextLimits: RemoteBrowserContextLimits;
	contextReturnPlan: ContextReturnPlan;
	returnBudgetChars: number;
	includedContextIds: ReadonlySet<string>;
	onToggleSelectedTextContexts: () => void;
	onCopySelectedContext: (context: CapturedContext) => void;
	onDeleteSelectedContext: (contextId: string) => void;
	onSaveSelectedContext: (contextId: string, content: string) => void;
	onToggleContextIncluded: (contextId: string, include: boolean) => void;
	onReturnBudgetChange: (chars: number) => void;
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
				{props.selectedTextContexts.length > 0 && (
					<SelectedTextContextsPanel
						open={props.selectedTextContextsOpen}
						contexts={props.selectedTextContexts}
						limits={props.contextLimits}
						returnPlan={props.contextReturnPlan}
						returnBudgetChars={props.returnBudgetChars}
						includedContextIds={props.includedContextIds}
						onToggle={props.onToggleSelectedTextContexts}
						onCopy={props.onCopySelectedContext}
						onDelete={props.onDeleteSelectedContext}
						onSave={props.onSaveSelectedContext}
						onToggleIncluded={props.onToggleContextIncluded}
						onReturnBudgetChange={props.onReturnBudgetChange}
					/>
				)}
				<LoadedRecordingPanel playback={props.playback} />
				{props.recordedSteps.length > 0 && (
					<RecordedStepsPanel
						open={props.recordedStepsOpen}
						isRecording={props.isRecording}
						steps={props.recordedSteps}
						onToggle={props.onToggleRecordedSteps}
						onSave={props.onSaveRecording}
					/>
				)}
			</div>
		</aside>
	);
}
