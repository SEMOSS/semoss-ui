import { ChevronDown, Sparkles, Square, Wand2, Wrench } from "lucide-react";
import type React from "react";
import { useEffect, useId, useState } from "react";
import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
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
import type {
	AutomationHistoryEntry,
	AutomationRunStatus,
	WebMcpDiscovery,
} from "../types/automation.types";
import { WebMcpToolsPanel } from "./web-mcp-tools-panel";

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
	runStatus: AutomationRunStatus | null;
	webMcpDiscovery: WebMcpDiscovery;
	automationHistory: AutomationHistoryEntry[];
	onToggle: () => void;
	onModelChange: (modelId: string) => void;
	onSubModeChange: (mode: "click" | "fill-page" | "run-goal") => void;
	onGoalChange: (goal: string) => void;
	onGenerateGoal: () => void;
	onMaxIterationsChange: (maxIterations: number) => void;
	onRefreshWebMcpTools: () => void;
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
	runStatus,
	webMcpDiscovery,
	automationHistory,
	onToggle,
	onModelChange,
	onSubModeChange,
	onGoalChange,
	onGenerateGoal,
	onMaxIterationsChange,
	onRefreshWebMcpTools,
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
						className={
							isActive
								? "rounded-r-none bg-primary text-primary-foreground hover:bg-primary/90"
								: "rounded-r-none"
						}
						disabled={
							!isGoalRunning &&
							subMode === "run-goal" &&
							(isGoalGenerating || !goal.trim())
						}
						onClick={onToggle}
					>
						{isGoalRunning ? (
							runStatus ? (
								<Spinner className="h-3.5 w-3.5" />
							) : (
								<Square />
							)
						) : (
							<Wand2 />
						)}
						{isGoalRunning
							? runStatus
								? `${runStatus.phase === "planning" ? "Planning" : "Acting"} ${runStatus.iteration}/${runStatus.maxIterations}`
								: "Stop automation"
							: isActive
								? subMode === "fill-page"
									? "Filling…"
									: "Automation On"
								: "Automate"}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{isGoalRunning
						? runStatus
							? `${runStatus.detail} Click to stop after the current operation.`
							: "Stop goal automation after the current operation"
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
				<Tooltip>
					<TooltipTrigger asChild>
						<PopoverTrigger asChild>
							<Button
								size="sm"
								variant={isActive ? "default" : "outline"}
								className={
									isActive
										? "-ml-px rounded-l-none bg-primary hover:bg-primary/90"
										: "-ml-px rounded-l-none"
								}
								aria-label={`Configure automation; ${webMcpDiscovery.tools.length} WebMCP tools available`}
							>
								<Wrench aria-hidden />
								{webMcpDiscovery.tools.length}
								<ChevronDown aria-hidden />
							</Button>
						</PopoverTrigger>
					</TooltipTrigger>
					<TooltipContent>
						{webMcpDiscovery.tools.length} WebMCP tool
						{webMcpDiscovery.tools.length === 1 ? "" : "s"}{" "}
						available
					</TooltipContent>
				</Tooltip>
				<PopoverContent className="w-80 p-3" align="end">
					<Small className="mb-2 block font-medium">
						Automation mode
					</Small>
					<div className="mb-3 flex flex-col gap-1">
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
						].map(({ value, label, desc }) => (
							<button
								key={value}
								type="button"
								className={`flex items-start gap-2 rounded-md p-2 text-left transition-colors ${
									subMode === value
										? "bg-primary/10"
										: "hover:bg-muted"
								}`}
								onClick={() => onSubModeChange(value)}
							>
								<span
									className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
										subMode === value
											? "border-primary bg-primary"
											: "border-muted-foreground"
									}`}
									aria-hidden
								/>
								<div>
									<Small className="block font-medium">
										{label}
									</Small>
									<Small className="block text-muted-foreground">
										{desc}
									</Small>
								</div>
							</button>
						))}
					</div>
					{subMode === "run-goal" && (
						<div className="mb-3 flex flex-col gap-2">
							<label
								className="font-medium text-sm"
								htmlFor={goalInputId}
							>
								Goal
							</label>
							<Textarea
								id={goalInputId}
								value={goal}
								onChange={(event) =>
									onGoalChange(event.target.value)
								}
								placeholder={
									isGoalGenerating
										? "Summarizing recent Playground messages…"
										: "Describe the browser goal, or generate one from the chat"
								}
								disabled={isGoalRunning}
								rows={3}
								className="min-h-20 resize-y"
							/>
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="self-start"
								onClick={onGenerateGoal}
								disabled={isGoalGenerating || isGoalRunning}
							>
								{isGoalGenerating ? (
									<Spinner className="h-3.5 w-3.5" />
								) : (
									<Sparkles className="h-3.5 w-3.5" />
								)}
								{isGoalGenerating
									? "Generating…"
									: goal.trim()
										? "Regenerate from chat"
										: "Generate from chat"}
							</Button>
							<Small
								className={`text-xs ${
									goalGenerationError
										? "text-destructive"
										: "text-muted-foreground"
								}`}
							>
								{goalGenerationError ||
									"Generating summarizes up to 20 recent messages. Review or edit the goal before running."}
							</Small>
							<label
								className="font-medium text-sm"
								htmlFor={maxIterationsId}
							>
								Maximum iterations
							</label>
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
					<Small className="mb-2 block font-medium">Model</Small>
					{isLoadingModels ? (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Spinner className="h-4 w-4" />
							Loading models…
						</div>
					) : models.length === 0 ? (
						<Small className="text-muted-foreground">
							No text-generation models found.
						</Small>
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
					<WebMcpToolsPanel
						discovery={webMcpDiscovery}
						history={automationHistory}
						onRefresh={onRefreshWebMcpTools}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
};
