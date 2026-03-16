import { HelpCircle, Pencil } from "lucide-react";
import {
	Card,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Slider,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";

export interface Model {
	database_name?: string;
	database_id?: string;
}

interface EngineQASidebarProps {
	modelOptions: Model[];
	selectedModel: Model;
	setSelectedModel: (model: Model) => void;
	limit: number;
	setLimit: (limit: number) => void;
	temperature: number;
	setTemperature: (temperature: number) => void;
}

export const EngineQASidebar = ({
	modelOptions,
	selectedModel,
	setSelectedModel,
	limit,
	setLimit,
	temperature,
	setTemperature,
}: EngineQASidebarProps) => {
	const getModelValue = (model: Model) =>
		model.database_id ?? model.database_name ?? "";
	const selectedModelValue = getModelValue(selectedModel);

	const onModelChange = (value: string) => {
		const nextModel = modelOptions.find(
			(option) => getModelValue(option) === value,
		);
		if (nextModel) {
			setSelectedModel(nextModel);
		}
	};

	const limitTooltipText = `
	This will change the amount of chunks pulled from 
	a vector database. Pulling too many chunks can potentially cause your engine's
	token limit to be exceeded!
	`;

	const temperatureTooltipText = `
	This changes the randomness of the LLM's output. 
	The higher the temperature the more creative and imaginative your
	answer will be.
	`;

	return (
		<Card className="mb-2 flex h-full w-[280px] flex-col gap-4 rounded-none p-4 max-md:absolute max-md:z-50 max-md:max-w-[280px]">
			{/* Header */}
			<div className="w-full rounded-md bg-muted px-4 py-2">
				<div className="flex items-center gap-2 whitespace-nowrap">
					<Pencil className="h-4 w-4 shrink-0" />
					<span className="font-medium text-sm">
						Adjust Configurations
					</span>
				</div>
			</div>

			{/* Model Select */}
			<p className="font-medium text-sm">Select Model:</p>

			<Select value={selectedModelValue} onValueChange={onModelChange}>
				<SelectTrigger className="w-full min-w-0">
					<SelectValue
						placeholder="Select a model"
						className="block max-w-full truncate"
					/>
				</SelectTrigger>
				<SelectContent className="max-w-[240px]">
					{modelOptions.map((option) => {
						const value = getModelValue(option);
						if (!value) {
							return null;
						}

						return (
							<SelectItem key={value} value={value}>
								<span
									className="block max-w-full truncate"
									title={option.database_name}
								>
									{option.database_name}
								</span>
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>

			{/* Limit */}
			<div className="mt-4 flex items-center gap-2">
				<p className="font-medium text-sm">
					Limit the queried results:
				</p>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger>
							<HelpCircle className="h-4 w-4 text-primary" />
						</TooltipTrigger>
						<TooltipContent className="max-w-xs text-xs">
							{limitTooltipText}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<div className="relative w-full">
				<Slider
					value={[limit]}
					min={1}
					max={10}
					step={1}
					onValueChange={(value) => setLimit(value[0])}
					className="cursor-pointer"
				/>

				<div
					className="pointer-events-none absolute top-full mt-2 rounded bg-accent px-2 py-0.5 text-xs shadow"
					style={{
						left: `calc(${((limit - 1) / 9) * 100}% - 10px)`,
					}}
				>
					{limit}
				</div>
			</div>

			{/* Temperature */}
			<div className="mt-4 flex items-center gap-2">
				<p className="font-medium text-sm">Set Temperature:</p>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger>
							<HelpCircle className="h-4 w-4 text-primary" />
						</TooltipTrigger>
						<TooltipContent className="max-w-xs text-xs">
							{temperatureTooltipText}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<div className="relative w-full">
				<Slider
					value={[temperature]}
					min={0.1}
					max={1}
					step={0.1}
					onValueChange={(value) => setTemperature(value[0])}
					className="cursor-pointer"
				/>

				<div
					className="pointer-events-none absolute top-full mt-2 rounded bg-accent px-2 py-0.5 text-xs shadow"
					style={{
						left: `calc(${((temperature - 0.1) / 0.9) * 100}% - 10px)`,
					}}
				>
					{temperature}
				</div>
			</div>
		</Card>
	);
};
