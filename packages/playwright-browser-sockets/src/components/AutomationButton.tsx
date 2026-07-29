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
	onToggle: () => void;
	onModelChange: (modelId: string) => void;
}

export const AutomationButton: React.FC<AutomationButtonProps> = ({
	insightId,
	isActive,
	modelId,
	onToggle,
	onModelChange,
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
						{isActive ? "Automation On" : "Automate"}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					{isActive
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
					<p className="mb-2 font-medium text-sm">Automation model</p>
					<p className="mb-3 text-ink-muted text-xs">
						The model used to fill text fields from conversation
						context.
					</p>
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
