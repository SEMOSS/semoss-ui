import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge, Button } from "@semoss/ui/next";
import type { RemoteBrowserRecordedStep } from "../../types/browserEvents";

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
		<section className="border-line border-b">
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
					<div className="font-semibold text-sm">Recorded steps</div>
					<div className="text-muted-foreground text-xs">
						Current unsaved recording window
					</div>
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
				<div className="border-line border-t">
					{steps.length === 0 ? (
						<p className="p-4 text-muted-foreground text-sm">
							{isRecording
								? "Interact with the browser to see recorded steps."
								: "Start recording to preview captured steps."}
						</p>
					) : (
						steps.map((step, index) => (
							<div
								key={`${step.timestamp ?? index}-${index}`}
								className="border-line border-b px-3 py-2 last:border-b-0"
							>
								<div className="font-semibold text-sm">
									#{index + 1} {step.type || "STEP"}
								</div>
								<div className="break-words text-muted-foreground text-xs">
									{step.selector
										? `${step.role || "selector"}: ${step.selector}`
										: ""}
									{step.text ? ` · "${step.text}"` : ""}
									{step.coordinates
										? ` · (${Math.round(step.coordinates.x)}, ${Math.round(step.coordinates.y)})`
										: ""}
								</div>
							</div>
						))
					)}
				</div>
			)}
		</section>
	);
}
