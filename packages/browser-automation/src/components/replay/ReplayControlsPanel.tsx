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
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Spinner,
} from "@semoss/ui/next";
import { getRecordingDisplayName } from "../../domain/recording";
import type { PlaybackController } from "../../hooks/usePlaybackController";

export function ReplayControlsPanel({
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
					onClick={() =>
						playback.setControlsOpen(!playback.controlsOpen)
					}
					aria-label="Toggle replay controls"
				>
					{playback.controlsOpen ? <ChevronDown /> : <ChevronRight />}
				</Button>
				<Small className="flex-1">Replay controls</Small>
				{playback.isPaused && (
					<Badge variant="destructive">Paused</Badge>
				)}
				{playback.isRunning && <Badge>Running</Badge>}
			</div>
			{playback.controlsOpen && (
				<div className="flex flex-col gap-2 border-border border-t p-2">
					<Select
						value={playback.project?.value ?? ""}
						onValueChange={(value) =>
							playback.selectProject(
								playback.projects.find(
									(item) => item.value === value,
								) ?? null,
							)
						}
						disabled={playback.isLoadingProjects}
					>
						<SelectTrigger className="w-full">
							<SelectValue
								placeholder={
									playback.isLoadingProjects
										? "Loading projects..."
										: "Select project"
								}
							/>
						</SelectTrigger>
						<SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1rem)]">
							{playback.projects.map((item) => (
								<SelectItem
									key={item.value}
									value={item.value}
									textValue={item.label}
									className="min-w-0"
								>
									<Muted
										className="block truncate text-foreground"
										title={item.label}
									>
										{item.label}
									</Muted>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={playback.selectedRecording ?? ""}
						onValueChange={playback.selectRecording}
						disabled={!playback.project || playback.isLoadingFiles}
					>
						<SelectTrigger className="w-full">
							<SelectValue
								placeholder={
									playback.isLoadingFiles
										? "Loading recordings..."
										: playback.project
											? "Select recording"
											: "Select a project first"
								}
							/>
						</SelectTrigger>
						<SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1rem)]">
							{playback.files.map((file) => {
								const displayName =
									getRecordingDisplayName(file);
								return (
									<SelectItem
										key={file}
										value={file}
										textValue={displayName}
										className="min-w-0"
									>
										<Muted
											className="block truncate text-foreground"
											title={displayName}
										>
											{displayName}
										</Muted>
									</SelectItem>
								);
							})}
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
