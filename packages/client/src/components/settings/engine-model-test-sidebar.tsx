/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { AlertTriangle, HelpCircle, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Card,
	Input,
	Slider,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";

interface Model {
	model_id: string;
	model_name: string;
	tag?: string;
}

interface ModelInfo {
	database_name?: string;
	tag?: string;
	description?: string;
}

interface EngineModelTestSidebarProps {
	selectedModel: Model;
	setSelectedModel: (model: Model) => void;
	temperature: number;
	setTemperature: (temp: number) => void;
	maxTokens: number;
	setMaxTokens: (tokens: number) => void;
}

export const EngineModelTestSidebar = ({
	selectedModel,
	setSelectedModel,
	temperature,
	setTemperature,
	maxTokens,
	setMaxTokens,
}: EngineModelTestSidebarProps) => {
	const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
	const [showTempTooltip, setShowTempTooltip] = useState(false);

	const temperatureTooltipText = `
This changes the randomness of the LLM's output.
Higher temperature = more creative responses.
Range: 0.0 to 1.0
`;

	const maxTokensTooltipText = `
Controls the maximum number of tokens in the response.
Higher values allow longer outputs.
Default: 2000
`;

	useEffect(() => {
		if (!selectedModel.model_id) return;

		const fetchModelInfo = async () => {
			try {
				const pixel = `EngineInfo(engine="${selectedModel.model_id}")`;
				const response = await runPixel(pixel);
				const { output, operationType } = response.pixelReturn[0];

				if (operationType.indexOf("ERROR") === -1) {
					const modelInfo = output as ModelInfo;
					setModelInfo(modelInfo);

					if (modelInfo.database_name && !selectedModel.model_name) {
						setSelectedModel({
							...selectedModel,
							model_name: modelInfo.database_name,
							tag: modelInfo.tag || selectedModel.tag,
						});
					}

					if (
						modelInfo.tag &&
						!modelInfo.tag.includes("text-generation")
					) {
						console.warn(
							"Selected model may not support text generation:",
							modelInfo.tag,
						);
					}
				}
			} catch (error) {
				console.error("Failed to fetch model info:", error);
			}
		};

		fetchModelInfo();
	}, [
		selectedModel.model_id,
		selectedModel.model_name,
		selectedModel.tag,
		setSelectedModel,
	]);

	const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value, 10);
		if (!isNaN(value) && value > 0) {
			setMaxTokens(value);
		}
	};

	return (
		<Card className="flex w-[300px] flex-col gap-6 p-4">
			{/* Header */}
			<div className="rounded-md bg-muted px-4 py-2">
				<div className="ml-5 flex items-center gap-2 whitespace-nowrap">
					<Pencil className="h-4 w-4 shrink-0" />
					<span className="items-center justify-center font-medium text-sm">
						Adjust Configurations
					</span>
				</div>
			</div>

			{/* Model Info */}
			<div className="flex flex-col gap-2">
				<h3 className="font-semibold text-base">Model Information</h3>

				<p className="text-sm">
					<strong>Model ID:</strong> {selectedModel.model_id}
				</p>

				{selectedModel.model_name && (
					<p className="text-sm">
						<strong>Model Name:</strong> {selectedModel.model_name}
					</p>
				)}

				{modelInfo?.description && (
					<p className="text-sm">
						<strong>Description:</strong> {modelInfo.description}
					</p>
				)}
			</div>

			{/* Parameters */}
			<div className="flex flex-col gap-6">
				<h3 className="font-semibold text-base">Parameters</h3>

				{/* Temperature */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-1">
						<span className="font-medium text-sm">Temperature</span>
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

					<div
						className="relative"
						onMouseEnter={() => setShowTempTooltip(true)}
						onMouseLeave={() => setShowTempTooltip(false)}
						onPointerDown={() => setShowTempTooltip(true)}
						onPointerUp={() => setShowTempTooltip(false)}
					>
						<Slider
							value={[temperature]}
							className="cursor-pointer"
							min={0}
							max={1}
							step={0.1}
							onValueChange={(v) => setTemperature(v[0])}
						/>

						{showTempTooltip && (
							<div
								className="-top-7 pointer-events-none absolute rounded bg-accent px-2 py-0.5 text-xs shadow"
								style={{
									left: `calc(${temperature * 100}% - 12px)`,
								}}
							>
								{Number.isInteger(temperature)
									? temperature
									: temperature.toFixed(1)}
							</div>
						)}

						<div className="mt-3 flex justify-between text-muted-foreground text-xs">
							<span>0</span>
							<span>0.5</span>
							<span>1</span>
						</div>
					</div>

					<p className="text-muted-foreground text-xs">
						Current: {temperature}
					</p>
				</div>

				{/* Max Tokens */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-1">
						<span className="font-medium text-sm">
							Max Tokens (Output)
						</span>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<HelpCircle className="h-4 w-4 text-primary" />
								</TooltipTrigger>
								<TooltipContent className="max-w-xs text-xs">
									{maxTokensTooltipText}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<Input
						type="number"
						value={maxTokens}
						onChange={handleMaxTokensChange}
						min={1}
						max={8192}
						step={100}
					/>

					<p className="text-muted-foreground text-xs">
						Range: 1 – 8192 tokens
					</p>
				</div>
			</div>

			{/* Warning */}
			{modelInfo?.tag && !modelInfo.tag.includes("text-generation") && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						This model may not be optimized for text generation.
						Expected tag: "text-generation", found: "{modelInfo.tag}
						"
					</AlertDescription>
				</Alert>
			)}
		</Card>
	);
};
