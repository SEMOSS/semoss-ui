import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge, Button } from "@semoss/ui/next";
import type { PlaybackController } from "../../hooks/usePlaybackController";
import { RecordingStepRow } from "./RecordingStepRow";

export function LoadedRecordingPanel({
	playback,
}: {
	playback: PlaybackController;
}) {
	return (
		<section className="border-line border-b">
			<div className="flex items-center gap-2 px-2 py-1.5">
				<Button
					size="icon-sm"
					variant="ghost"
					disabled={!playback.loadedRecording}
					onClick={() =>
						playback.setLoadedRecordingOpen(
							!playback.loadedRecordingOpen,
						)
					}
				>
					{playback.loadedRecordingOpen ? (
						<ChevronDown />
					) : (
						<ChevronRight />
					)}
				</Button>
				<div className="min-w-0 flex-1">
					<div className="font-semibold text-sm">
						Loaded recording
					</div>
					<div className="truncate text-muted-foreground text-xs">
						{playback.loadedRecording
							? playback.selectedRecording
							: "Load a recording to inspect and replay steps"}
					</div>
				</div>
				{playback.loadedRecording && (
					<Badge variant="secondary">
						{playback.loadedStepCount} steps
					</Badge>
				)}
				{playback.typeStepCount > 0 && (
					<Badge variant="outline">
						{playback.typeStepCount} inputs
					</Badge>
				)}
			</div>
			{playback.loadedRecordingOpen && (
				<div className="border-line border-t">
					{playback.flattenedSteps.length === 0 ? (
						<p className="p-4 text-muted-foreground text-sm">
							Load a recording to see its steps here.
						</p>
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
				</div>
			)}
		</section>
	);
}
