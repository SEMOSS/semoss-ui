import { ChevronDown, Wand2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
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
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { runPixel } from "../semoss/pixel";

interface ModelOption {
	id: string;
	name: string;
}

interface AutomationButtonProps {
	insightId: string;
	isActive: boolean;
	modelId: string;
	subMode: "click" | "fill-form";
	onToggle: () => void;
	onModelChange: (modelId: string) => void;
	onSubModeChange: (mode: "click" | "fill-form") => void;
}

export const AutomationButton: React.FC<AutomationButtonProps> = ({
	insightId,
	isActive,
	modelId,
	subMode,
	onToggle,
	onModelChange,
	onSubModeChange,
}) => {
	const [models, setModels] = useState<ModelOption[]>([]);
	const [isLoadingModels, setIsLoadingModels] = useState(false);
	const [popoverOpen, setPopoverOpen] = useState(false);

	useEffect(() => {
		if (!popoverOpen) return;
		setIsLoadingModels(true);
		void runPixel<Array<Record<string, unknown>>>(
			`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
			insightId,
		)
			.then((response) => {
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
				if (opts.length > 0 && !modelId) {
					onModelChange(opts[0].id);
				}
			})
			.catch(() => setModels([]))
			.finally(() => setIsLoadingModels(false));
	}, [popoverOpen, insightId, modelId, onModelChange]);

	return (
		<div className="flex items-center">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						size="sm"
						variant={isActive ? "default" : "outline"}
						className={
							isActive
								? "rounded-r-none bg-accent text-canvas hover:bg-accent/90"
								: "rounded-r-none"
						}
						onClick={onToggle}
					>
						<Wand2 />
						{isActive
							? subMode === "fill-form"
								? "Filling…"
								: "Automation On"
							: "Automate"}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{subMode === "fill-form"
						? "Fill all visible form fields from context"
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
						className={
							isActive
								? "-ml-px rounded-l-none bg-accent hover:bg-accent/90"
								: "-ml-px rounded-l-none"
						}
						aria-label="Configure automation model"
					>
						<ChevronDown className="h-3 w-3" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-64 p-3" align="end">
					<p className="mb-2 font-medium text-sm">Automation mode</p>
					<div className="mb-3 flex flex-col gap-1">
						{[
							{
								value: "click" as const,
								label: "Click to fill",
								desc: "Click any input field to fill it from context",
							},
							{
								value: "fill-form" as const,
								label: "Fill form",
								desc: "Fill all visible fields at once",
							},
						].map(({ value, label, desc }) => (
							<button
								key={value}
								type="button"
								className={`flex items-start gap-2 rounded p-2 text-left transition-colors ${
									subMode === value
										? "bg-accent/10"
										: "hover:bg-surface-hover"
								}`}
								onClick={() => onSubModeChange(value)}
							>
								<span
									className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
										subMode === value
											? "border-accent bg-accent"
											: "border-ink-muted"
									}`}
								/>
								<span>
									<span className="block font-medium text-xs">
										{label}
									</span>
									<span className="block text-ink-muted text-xs">
										{desc}
									</span>
								</span>
							</button>
						))}
					</div>
					<p className="mb-2 font-medium text-sm">Model</p>
					{isLoadingModels ? (
						<div className="flex items-center gap-2 text-ink-muted text-sm">
							<Spinner className="h-4 w-4" />
							Loading models…
						</div>
					) : models.length === 0 ? (
						<p className="text-ink-muted text-xs">
							No text-generation models found.
						</p>
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
