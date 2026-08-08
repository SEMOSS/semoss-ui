import { ChevronDown, RefreshCw, Square, Wand2 } from "lucide-react";
import type React from "react";
import { useEffect, useId, useState } from "react";
import {
	Button,
	Label,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	Spinner,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { runPixel } from "../semoss/pixel";

interface ModelOption {
	id: string;
	name: string;
}

interface AutomationControlsProps {
	insightId: string;
	isActive: boolean;
	isGoalRunning: boolean;
	modelId: string;
	subMode: "click" | "fill-page" | "run-goal";
	goal: string;
	maxIterations: number;
	isGoalGenerating: boolean;
	goalGenerationError?: string;
	progressLabel?: string;
	onToggle: () => void;
	onModelChange: (modelId: string) => void;
	onSubModeChange: (mode: "click" | "fill-page" | "run-goal") => void;
	onGoalChange: (goal: string) => void;
	onRegenerateGoal: () => void;
	onMaxIterationsChange: (maxIterations: number) => void;
}

export const AutomationControls: React.FC<AutomationControlsProps> = ({
	insightId,
	isActive,
	isGoalRunning,
	modelId,
	subMode,
	goal,
	maxIterations,
	isGoalGenerating,
	goalGenerationError,
	progressLabel,
	onToggle,
	onModelChange,
	onSubModeChange,
	onGoalChange,
	onRegenerateGoal,
	onMaxIterationsChange,
}) => {
	const [models, setModels] = useState<ModelOption[]>([]);
	const [isLoadingModels, setIsLoadingModels] = useState(false);
	const [popoverOpen, setPopoverOpen] = useState(false);
	const goalInputId = useId();
	const maxIterationsId = useId();

	useEffect(() => {
		setIsLoadingModels(true);
		void Promise.all([
			runPixel<Array<Record<string, unknown>>>(
				`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
				insightId,
			),
			runPixel<string>("GetInsightActiveRoomModel();", insightId).catch(
				() => undefined,
			),
		])
			.then(([response, roomModelResponse]) => {
				const output = response.pixelReturn?.[0]?.output;
				const engines = Array.isArray(output)
					? (output as Array<Record<string, unknown>>)
					: [];
				const opts: ModelOption[] = engines.flatMap((e) => {
					const id =
						typeof e.engine_id === "string" ? e.engine_id : "";
					const name =
						typeof e.engine_name === "string" ? e.engine_name : id;
					return id ? [{ id, name }] : [];
				});
				setModels(opts);
				const roomModelOutput =
					roomModelResponse?.pixelReturn?.[0]?.output;
				const roomModelId =
					typeof roomModelOutput === "string" ? roomModelOutput : "";
				if (!modelId && opts.length > 0) {
					onModelChange(
						opts.some((option) => option.id === roomModelId)
							? roomModelId
							: opts[0].id,
					);
				}
			})
			.catch(() => setModels([]))
			.finally(() => setIsLoadingModels(false));
	}, [insightId, modelId, onModelChange]);

	return (
		<div className="flex items-center">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						size="sm"
						variant={isActive ? "default" : "outline"}
						className="rounded-r-none"
						disabled={
							!isGoalRunning &&
							subMode === "run-goal" &&
							(isGoalGenerating || !goal.trim())
						}
						onClick={onToggle}
					>
						{isGoalRunning ? <Square /> : <Wand2 />}
						{isGoalRunning
							? progressLabel || "Stop automation"
							: isActive
								? subMode === "fill-page"
									? "Filling…"
									: "Automation On"
								: "Automate"}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{isGoalRunning
						? "Stop goal automation after the current operation"
						: subMode === "run-goal"
							? "Iterate through browser actions until the goal is reached"
							: subMode === "fill-page"
								? "Fill visible editable fields from context"
								: isActive
									? "Click to disable automation mode"
									: "Enable automation mode — click any text field to auto-fill from context"}
				</TooltipContent>
			</Tooltip>

			<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
				<PopoverTrigger asChild>
					<Button
						size="icon-sm"
						variant={isActive ? "default" : "outline"}
						className="-ml-px rounded-l-none"
						aria-label="Configure automation model"
					>
						<ChevronDown className="h-3 w-3" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-64 p-3" align="end">
					<Small className="mb-2">Automation mode</Small>
					<RadioGroup
						value={subMode}
						onValueChange={(value) =>
							onSubModeChange(
								value as "click" | "fill-page" | "run-goal",
							)
						}
						className="mb-3 gap-1"
					>
						{[
							{
								value: "click" as const,
								label: "Click to fill",
								desc: "Click any input field to fill it from context",
							},
							{
								value: "fill-page" as const,
								label: "Fill page",
								desc: "Fill visible editable fields at once",
							},
							{
								value: "run-goal" as const,
								label: "Run goal",
								desc: "Click and fill iteratively until the goal is reached",
							},
						].map(({ value, label, desc }) => {
							const modeId = `automation-mode-${value}`;
							return (
								<Label
									key={value}
									htmlFor={modeId}
									className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-accent"
								>
									<RadioGroupItem
										id={modeId}
										value={value}
										className="mt-0.5"
									/>
									<div>
										<Muted className="block text-foreground">
											{label}
										</Muted>
										<Muted className="block text-xs">
											{desc}
										</Muted>
									</div>
								</Label>
							);
						})}
					</RadioGroup>
					{subMode === "run-goal" && (
						<div className="mb-3 flex flex-col gap-2">
							<Label htmlFor={goalInputId}>Goal</Label>
							<Textarea
								id={goalInputId}
								value={goal}
								onChange={(event) =>
									onGoalChange(event.target.value)
								}
								placeholder={
									isGoalGenerating
										? "Summarizing recent Playground messages…"
										: "Describe the browser goal"
								}
								disabled={isGoalRunning}
								rows={3}
								className="min-h-20 resize-y"
							/>
							<div className="flex items-start justify-between gap-2">
								<Muted
									className={`text-xs ${
										goalGenerationError
											? "text-destructive"
											: ""
									}`}
								>
									{goalGenerationError ||
										"Generated from up to 20 recent messages. Review or edit it before running."}
								</Muted>
								<Button
									type="button"
									size="icon-sm"
									variant="ghost"
									onClick={onRegenerateGoal}
									disabled={isGoalGenerating || isGoalRunning}
									aria-label="Regenerate goal from recent messages"
								>
									{isGoalGenerating ? (
										<Spinner className="h-3.5 w-3.5" />
									) : (
										<RefreshCw className="h-3.5 w-3.5" />
									)}
								</Button>
							</div>
							<Label htmlFor={maxIterationsId}>
								Maximum iterations
							</Label>
							<Select
								value={String(maxIterations)}
								onValueChange={(value) =>
									onMaxIterationsChange(Number(value))
								}
								disabled={isGoalRunning}
							>
								<SelectTrigger
									id={maxIterationsId}
									className="w-full"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[5, 10, 15, 20, 25].map((value) => (
										<SelectItem
											key={value}
											value={String(value)}
										>
											{value}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					<Small className="mb-2">Model</Small>
					{isLoadingModels ? (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Spinner className="h-4 w-4" />
							<Muted>Loading models…</Muted>
						</div>
					) : models.length === 0 ? (
						<Muted className="text-xs">
							No text-generation models found.
						</Muted>
					) : (
						<Select value={modelId} onValueChange={onModelChange}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select model" />
							</SelectTrigger>
							<SelectContent>
								{models.map((m) => (
									<SelectItem key={m.id} value={m.id}>
										{m.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</PopoverContent>
			</Popover>
		</div>
	);
};
