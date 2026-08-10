import { Check, Pencil, RotateCcw } from "lucide-react";
import {
	Badge,
	Button,
	Input,
	Label,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { PlaybackController } from "../../hooks/usePlaybackController";
import type { LoadedRecordingStep } from "../../types/browserEvents";

interface RecordingStepRowProps {
	tabId: string;
	step: LoadedRecordingStep;
	index: number;
	playback: PlaybackController;
}

export function RecordingStepRow({
	tabId,
	step,
	index,
	playback,
}: RecordingStepRowProps) {
	const stepId = typeof step.id === "number" ? step.id : undefined;
	const isRunning = playback.runningStepId === stepId;
	const isDone = stepId !== undefined && playback.executedStepIds.has(stepId);
	const disabled =
		playback.isRunning || step.shouldRun === false || stepId === undefined;
	const isType = step.type === "TYPE" && stepId !== undefined;
	const displayValue =
		stepId !== undefined
			? (playback.editedTypeValues[stepId] ?? step.text ?? "")
			: (step.text ?? "");
	const isEditing = isType && playback.editingStepId === stepId;
	const needsValue = isType && playback.valueRequiredStepId === stepId;
	return (
		<div
			className={`border-line border-b ${needsValue ? "border-warning bg-warning/10" : ""}`}
		>
			<div className="flex items-start gap-2 p-2">
				<button
					type="button"
					disabled={disabled}
					onClick={() => void playback.runStep(tabId, step)}
					className={`min-w-0 flex-1 rounded p-1 text-left hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60 ${isRunning ? "bg-primary/10" : ""}`}
				>
					<div className="flex flex-wrap items-center gap-2 font-semibold text-sm">
						#{stepId ?? index + 1} {step.type || "STEP"}
						{isRunning && <Spinner />}
						{isDone && <Badge className="bg-success">done</Badge>}
						{step.shouldRun === false && (
							<Badge variant="secondary">skipped</Badge>
						)}
						{needsValue && (
							<Badge
								variant="outline"
								className="border-warning text-warning"
							>
								value required
							</Badge>
						)}
					</div>
					<div className="mt-1 break-words text-muted-foreground text-xs">
						{tabId}
						{typeof step.label === "string" && step.label
							? ` · ${step.label}`
							: ""}
						{typeof displayValue === "string" && displayValue
							? ` · "${displayValue}"`
							: ""}
					</div>
				</button>
				{isType && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon-sm"
								variant="ghost"
								disabled={playback.isRunning}
								onClick={() =>
									playback.setEditingStepId(
										playback.editingStepId === stepId
											? null
											: stepId,
									)
								}
							>
								<Pencil />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Edit typed value</TooltipContent>
					</Tooltip>
				)}
			</div>
			{isEditing && stepId !== undefined && (
				<div className="grid gap-2 px-3 pb-3">
					<Label htmlFor={`step-${stepId}`}>
						{typeof step.label === "string" && step.label
							? step.label
							: `Step ${stepId} value`}
					</Label>
					<div className="flex gap-1">
						<Input
							id={`step-${stepId}`}
							autoFocus={needsValue}
							type={
								step.isPassword === true ? "password" : "text"
							}
							value={playback.editedTypeValues[stepId] ?? ""}
							aria-invalid={needsValue}
							onChange={(event) =>
								playback.updateTypeValue(
									stepId,
									event.target.value,
								)
							}
						/>
						<Button
							size="icon"
							variant="outline"
							onClick={() => playback.setEditingStepId(null)}
							aria-label="Apply value"
						>
							<Check />
						</Button>
						<Button
							size="icon"
							variant="outline"
							onClick={() =>
								playback.resetTypeValue(
									stepId,
									typeof step.text === "string"
										? step.text
										: "",
								)
							}
							aria-label="Reset value"
						>
							<RotateCcw />
						</Button>
					</div>
					<p
						className={
							needsValue
								? "text-warning text-xs"
								: "text-muted-foreground text-xs"
						}
					>
						{needsValue
							? "Enter a value, then click Run/Resume to continue."
							: typeof step.description === "string" &&
									step.description
								? step.description
								: "This value is used when replaying this TYPE step."}
					</p>
				</div>
			)}
		</div>
	);
}
