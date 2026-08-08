import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge, Button, Muted, Small } from "@semoss/ui/next";
import type { RemoteBrowserRecordedStep } from "../../types/browserEvents";

function recordedStepType(step: RemoteBrowserRecordedStep): string {
	return step.type?.toUpperCase() === "WHEEL"
		? "SCROLL"
		: step.type?.toUpperCase() === "SELECTED-TEXT-CONTEXT"
			? "CONTEXT"
			: step.type?.toUpperCase() || "STEP";
}

function recordedStepValue(step: RemoteBrowserRecordedStep): string | null {
	const type = step.type?.toUpperCase();
	if (type === "TYPE" && step.text) return `“${step.text}”`;
	if (type === "NAVIGATE" && step.url) return step.url;
	if (type === "KEY" && step.key) return step.key;
	if (type === "SELECTED-TEXT-CONTEXT" || type === "CONTEXT") {
		return "Extract selected website text (optional)";
	}
	if (type === "WHEEL" || type === "SCROLL") {
		const delta = step.deltaY ?? 0;
		const height = step.viewport?.height ?? 0;
		const percentage = height
			? Math.max(1, Math.round((Math.abs(delta) / height) * 100))
			: 70;
		return `${delta < 0 ? "Up" : "Down"} ${percentage}% of screen`;
	}
	return null;
}

interface RecordedStepsPanelProps {
	open: boolean;
	isRecording: boolean;
	steps: RemoteBrowserRecordedStep[];
	onToggle: () => void;
	onSave: () => void;
}

export function RecordedStepsPanel({
	open,
	isRecording,
	steps,
	onToggle,
	onSave,
}: RecordedStepsPanelProps) {
	return (
		<section className="border-border border-b bg-muted">
			<div className="flex items-center gap-2 px-2 py-1.5">
				<Button
					size="icon-sm"
					variant="ghost"
					disabled={!isRecording && steps.length === 0}
					onClick={onToggle}
				>
					{open ? <ChevronDown /> : <ChevronRight />}
				</Button>
				<div className="min-w-0 flex-1">
					<Small>Recorded steps</Small>
					<Muted className="block text-xs">
						Current unsaved recording window
					</Muted>
				</div>
				<Badge variant="secondary">{steps.length}</Badge>
				<Button
					size="sm"
					variant="ghost"
					disabled={!isRecording}
					onClick={onSave}
				>
					Save
				</Button>
			</div>
			{open && (
				<div className="space-y-1.5 border-border border-t bg-background p-2">
					{steps.length === 0 ? (
						<Muted className="block p-4">
							{isRecording
								? "Interact with the browser to see recorded steps."
								: "Start recording to preview captured steps."}
						</Muted>
					) : (
						steps.map((step, index) => {
							const value = recordedStepValue(step);
							return (
								<div
									key={`${step.timestamp ?? index}-${index}`}
									className="flex items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2 shadow-sm"
								>
									<Badge
										variant="secondary"
										className="size-6 rounded-full p-0"
									>
										{index + 1}
									</Badge>
									<div className="min-w-0 flex-1">
										<Small>{recordedStepType(step)}</Small>
										{value && (
											<Muted className="mt-0.5 block break-words text-xs">
												{value}
											</Muted>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>
			)}
		</section>
	);
}
