import { EditOutlined } from "@mui/icons-material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Alert,
	List,
	Paper,
	Slider,
	Stack,
	styled,
	TextField,
	Tooltip,
	Typography,
} from "@semoss/ui";

const StyledSidebar = styled(Paper)(({ theme }) => ({
	width: "300px",
	padding: theme.spacing(2),
	height: "fit-content",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(3),
}));

const StyledList = styled(List)(({ theme }) => ({
	width: "100%",
	padding: "8px 16px 8px 16px",
	borderRadius: theme.shape.borderRadius,
	background: "rgba(217, 217, 217, 0.3)",
}));

const StyledParameterSection = styled("div")(({ theme }) => ({
	gap: theme.spacing(2),
}));

const StyledParameterItem = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));

const StyledParameterHeader = styled("div")(() => ({
	display: "flex",
	alignItems: "center",
	gap: "4px",
}));

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

	const temperatureTooltipText = `
		This changes the randomness of the LLM's output. 
		The higher the temperature the more creative and imaginative your
		answer will be. Range: 0.0 to 1.0
	`;

	const maxTokensTooltipText = `
		This controls the maximum number of tokens in the response.
		Higher values allow for longer responses but may take more time.
		Default: 2000
	`;

	// Fetch model information and validate it's a text-generation model
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

	const handleTemperatureChange = (
		event: Event,
		newValue: number | number[],
	) => {
		setTemperature(Array.isArray(newValue) ? newValue[0] : newValue);
	};

	const handleMaxTokensChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const value = parseInt(event.target.value, 10);
		if (!isNaN(value) && value > 0) {
			setMaxTokens(value);
		}
	};

	return (
		<StyledSidebar variant="outlined">
			<StyledList disablePadding>
				<List.Item>
					<EditOutlined />
					<List.ItemText
						sx={{ marginLeft: "5px" }}
						primary={
							<Typography variant="subtitle2">
								Adjust Configurations
							</Typography>
						}
					/>
				</List.Item>
			</StyledList>

			<Stack spacing={2}>
				<Typography variant="h6">Model Information</Typography>
				<Typography variant="body2">
					<strong>Model ID:</strong> {selectedModel.model_id}
				</Typography>
				{selectedModel.model_name && (
					<Typography variant="body2">
						<strong>Model Name:</strong> {selectedModel.model_name}
					</Typography>
				)}
				{modelInfo?.description && (
					<Typography variant="body2">
						<strong>Description:</strong> {modelInfo.description}
					</Typography>
				)}
			</Stack>

			<StyledParameterSection>
				<Typography variant="h6">Parameters</Typography>

				<StyledParameterItem>
					<StyledParameterHeader>
						<Typography variant="body1">Temperature</Typography>
						<Tooltip title={temperatureTooltipText}>
							<HelpOutlineIcon
								color="primary"
								sx={{ fontSize: 15, marginLeft: "5px" }}
							/>
						</Tooltip>
					</StyledParameterHeader>
					<Slider
						value={temperature}
						onChange={handleTemperatureChange}
						min={0}
						max={1}
						step={0.1}
						marks={[
							{ value: 0, label: "0" },
							{ value: 0.5, label: "0.5" },
							{ value: 1, label: "1" },
						]}
						valueLabelDisplay="auto"
						sx={{ mt: 1 }}
					/>
					<Typography variant="caption" color="secondary">
						Current: {temperature}
					</Typography>
				</StyledParameterItem>

				<StyledParameterItem>
					<StyledParameterHeader>
						<Typography variant="body1">
							Max Tokens (Output)
						</Typography>
						<Tooltip title={maxTokensTooltipText}>
							<HelpOutlineIcon
								color="primary"
								sx={{ fontSize: 15, marginLeft: "5px" }}
							/>
						</Tooltip>
					</StyledParameterHeader>
					<TextField
						type="number"
						value={maxTokens}
						onChange={handleMaxTokensChange}
						inputProps={{
							min: 1,
							max: 8192,
							step: 100,
						}}
						size="small"
						fullWidth
					/>
					<Typography variant="caption" color="secondary">
						Range: 1 - 8192 tokens
					</Typography>
				</StyledParameterItem>
			</StyledParameterSection>

			{modelInfo?.tag && !modelInfo.tag.includes("text-generation") && (
				<Alert severity="warning" sx={{ mt: 2 }}>
					<Typography variant="body2">
						This model may not be optimized for text generation.
						Expected tag: "text-generation", found: "{modelInfo.tag}
						"
					</Typography>
				</Alert>
			)}
		</StyledSidebar>
	);
};
