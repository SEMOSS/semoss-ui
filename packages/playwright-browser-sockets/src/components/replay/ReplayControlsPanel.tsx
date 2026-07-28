import {
	ChevronDown,
	ChevronRight,
	FolderOpen,
	Pause,
	Play,
} from "lucide-react";
import {
	Badge,
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
} from "@semoss/ui/next";
import type { PlaybackController } from "../../hooks/usePlaybackController";

export function ReplayControlsPanel({
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
					onClick={() =>
						playback.setControlsOpen(!playback.controlsOpen)
					}
					aria-label="Toggle replay controls"
				>
					{playback.controlsOpen ? <ChevronDown /> : <ChevronRight />}
				</Button>
				<span className="flex-1 font-semibold text-sm">
					Replay controls
				</span>
				{playback.isPaused && (
					<Badge
						variant="outline"
						className="border-warning text-warning"
					>
						Paused
					</Badge>
				)}
				{playback.isRunning && <Badge>Running</Badge>}
			</div>
			{playback.controlsOpen && (
				<div className="flex flex-col gap-2 border-line border-t p-2">
					<Select
						value={playback.selectedCatalogKey}
						onValueChange={playback.selectRecording}
						disabled={
							playback.isLoadingProjects ||
							playback.isLoadingFiles
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue
								placeholder={
									playback.isLoadingProjects ||
									playback.isLoadingFiles
										? "Loading recordings..."
										: "Select recording"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{playback.recordingCatalog.map((item) => (
								<SelectItem key={item.key} value={item.key}>
									<span className="flex min-w-0 items-center gap-2">
										<span className="truncate">
											{item.fileName}
										</span>
										<span className="text-muted-foreground text-xs">
											{item.source === "room"
												? "Playground"
												: item.project.label}
										</span>
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="grid grid-cols-[1fr_1fr_auto] gap-2">
						<Button
							size="sm"
							variant="outline"
							disabled={
								!playback.hasSession ||
								!playback.selectedRecording ||
								playback.isLoadingRecording ||
								playback.isRunning
							}
							onClick={() => void playback.load()}
						>
							{playback.isLoadingRecording ? (
								<Spinner />
							) : (
								<FolderOpen />
							)}
							Load
						</Button>
						<Button
							size="sm"
							disabled={
								!playback.loadedRecording || playback.isRunning
							}
							onClick={() => void playback.run()}
						>
							{playback.isRunning ? <Spinner /> : <Play />}
							{playback.isPaused
								? "Resume"
								: playback.loadedRecording
									? `Run ${playback.loadedStepCount}`
									: "Run"}
						</Button>
						<Button
							size="icon-sm"
							variant="outline"
							disabled={!playback.isRunning}
							onClick={() =>
								playback.requestPause(
									"Playback pause requested",
								)
							}
							aria-label="Pause replay"
						>
							<Pause />
						</Button>
					</div>
				</div>
			)}
		</section>
	);
}
