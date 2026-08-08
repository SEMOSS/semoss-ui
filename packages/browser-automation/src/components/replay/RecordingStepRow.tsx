import { Check, Pencil, RotateCcw } from "lucide-react";
import {
	Badge,
	Button,
	Input,
	Label,
	Muted,
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
	const isType =
		String(step.type || "").toUpperCase() === "TYPE" &&
		stepId !== undefined;
	const isPassword = step.isPassword === true;
	const displayValue =
		stepId !== undefined
			? (playback.editedTypeValues[stepId] ?? step.text ?? "")
			: (step.text ?? "");
	const isEditing = isType && playback.editingStepId === stepId;
	const needsValue = isType && playback.valueRequiredStepId === stepId;
	const typeDetail = isType
		? [
				typeof step.label === "string" ? step.label.trim() : "",
				isPassword
					? "Password value hidden"
					: typeof displayValue === "string" && displayValue
						? `"${displayValue}"`
						: "",
			]
				.filter(Boolean)
				.join(" · ")
		: "";
	return (
		<div
			className={`border-border border-b ${needsValue ? "bg-muted" : ""}`}
		>
			<div className="flex items-start gap-2 p-2">
				<Button
					type="button"
					variant={isRunning ? "secondary" : "ghost"}
					disabled={disabled}
					onClick={() => void playback.runStep(tabId, step)}
					className="h-auto min-w-0 flex-1 flex-col items-stretch whitespace-normal p-1 text-left"
				>
					<div className="flex flex-wrap items-center gap-2">
						<Muted className="text-foreground">
							#{stepId ?? index + 1} {step.type || "STEP"}
						</Muted>
						{isRunning && <Spinner />}
						{isDone && <Badge>done</Badge>}
						{step.shouldRun === false && (
							<Badge variant="secondary">skipped</Badge>
						)}
						{needsValue && (
							<Badge variant="destructive">value required</Badge>
						)}
					</div>
					<Muted className="mt-1 line-clamp-2 text-xs">
						{tabId}
						{typeDetail ? ` · ${typeDetail}` : ""}
					</Muted>
				</Button>
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
							type={isPassword ? "password" : "text"}
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
					<Muted
						className={
							needsValue ? "text-destructive text-xs" : "text-xs"
						}
					>
						{needsValue
							? "Enter a value, then click Run/Resume to continue."
							: typeof step.description === "string" &&
									step.description
								? step.description
								: "This value is used when replaying this TYPE step."}
					</Muted>
				</div>
			)}
		</div>
	);
}
