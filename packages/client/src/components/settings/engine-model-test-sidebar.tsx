import { AlertTriangle, HelpCircle, Pencil } from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
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
	engine_display_name?: string;
	database_name?: string;
	tag?: string;
	description?: string;
}

interface EngineModelTestSidebarProps {
	selectedModel: Model;
	setSelectedModel: Dispatch<SetStateAction<Model>>;
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

					const resolvedModelName =
						modelInfo.engine_display_name ||
						modelInfo.database_name ||
						"";

					if (
						resolvedModelName &&
						resolvedModelName !== selectedModel.model_name
					) {
						setSelectedModel((prev) => ({
							...prev,
							model_name: resolvedModelName,
							tag: modelInfo.tag || prev.tag,
						}));
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
	}, [selectedModel.model_id, selectedModel.model_name, setSelectedModel]);

	const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value, 10);
		if (!Number.isNaN(value) && value > 0) {
			setMaxTokens(value);
		}
	};

	return (
		<Card className="flex w-full flex-col gap-6 p-4 md:w-[300px]">
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

					<Slider
						value={[temperature]}
						className="cursor-pointer"
						min={0}
						max={1}
						step={0.1}
						onValueChange={(v) => setTemperature(v[0])}
					/>
					<div className="mt-1 flex justify-between text-muted-foreground text-xs">
						<span>0</span>
						<span>0.5</span>
						<span>1</span>
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
