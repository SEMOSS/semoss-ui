import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge, Button, Muted, Small } from "@semoss/ui/next";
import { getRecordingDisplayName } from "../../domain/recording";
import type { PlaybackController } from "../../hooks/usePlaybackController";
import { RecordingStepRow } from "./RecordingStepRow";

export function LoadedRecordingPanel({
	playback,
}: {
	playback: PlaybackController;
}) {
	return (
		<section className="border-border border-b">
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
					<Small>Loaded recording</Small>
					<Muted className="block truncate text-xs">
						{playback.loadedRecording
							? getRecordingDisplayName(
									playback.selectedRecording ?? "",
								)
							: "Load a recording to inspect and replay steps"}
					</Muted>
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
				<div className="border-border border-t">
					{playback.flattenedSteps.length === 0 ? (
						<Muted className="block p-4">
							Load a recording to see its steps here.
						</Muted>
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
