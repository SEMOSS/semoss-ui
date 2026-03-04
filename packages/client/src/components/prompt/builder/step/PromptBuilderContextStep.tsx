import { useMemo, useState } from "react";
import {
	Autocomplete,
	Box,
	createFilterOptions,
	FormControl,
	FormControlLabel,
	FormLabel,
	Grid,
	Radio,
	RadioGroup,
	Stack,
	TextField,
	Typography,
} from "@semoss/ui";
import { usePixel } from "@/hooks";
import { StyledStepPaper } from "../../prompt.styled";
import { type Builder, LLMSelectionType } from "../../prompt.types";
import { PromptBuilderContextTestDialogButton } from "./PromptBuilderContextTestDialogButton";

type CfgLibraryEngineState = {
	loading: boolean;
	ids: string[];
	display: object;
};
const InitialCfgLibraryEngineState: CfgLibraryEngineState = {
	loading: true,
	ids: [],
	display: {},
};

const StyledContainerGrid = styled(Grid)(({ theme }) => ({
	marginTop: theme.spacing(3),
}));

export const PromptBuilderContextStep = (props: {
	builder: Builder;
	setBuilderValue: (
		builderStepKey: string,
		value: string | string[] | boolean | LLMSelectionType,
	) => void;
}) => {
	const [cfgLibraryModels, setCfgLibraryModels] = useState(
		InitialCfgLibraryEngineState,
	);
	const filter = createFilterOptions<string>();
	const llmSelection = props.builder.llmSelection.value as LLMSelectionType;
	const showLLMSettings = llmSelection === LLMSelectionType.DEFAULT;
    

	// Update test prompt disable logic
	const isPromptContextTestDisabled = () => {
		const llmSelection = props.builder.llmSelection
			.value as LLMSelectionType | null;
		const context = props.builder.context.value;

		// If no context, disable test
		if (!context) {
			return true;
		}

		// If DEFAULT LLM selected, require model to be selected
		if (llmSelection === LLMSelectionType.DEFAULT) {
			return !props.builder.model.value;
		}

		// If USER_INPUT selected or no LLM selection (null), enable test
		// as model will be selected later or not needed
		return false;
	};

	const myModels = usePixel<
		{ app_id: string; app_name: string; tag: string }[]
	>(`MyEngines(engineTypes=['MODEL']);`);
	useMemo(() => {
		if (myModels.status !== "SUCCESS") {
			return;
		}

		const modelIds: string[] = [];
		const modelDisplay = {};
		myModels.data.forEach((model) => {
			// embeddings models are not set up for response generation
			if (model.tag !== "embeddings") {
				modelIds.push(model.app_id);
				modelDisplay[model.app_id] = model.app_name;
			}
		});
		setCfgLibraryModels({
			loading: false,
			ids: modelIds,
			display: modelDisplay,
		});
	}, [myModels.status, myModels.data]);

	const handleTemperatureChange = (value: string) => {
		const numValue = parseFloat(value);
		if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
			props.setBuilderValue("temperature", value);
		}
	};

	const handleLLMSelectionChange = (value: LLMSelectionType) => {
		props.setBuilderValue("llmSelection", value);
		// Reset model and temperature when changing selection
		if (value !== LLMSelectionType.DEFAULT) {
			props.setBuilderValue("model", undefined);
			props.setBuilderValue("temperature", "0.7");
		}
	};

	return (
		<StyledStepPaper elevation={2} square>
			<Box>
				<Typography variant="h6">Create Prompt</Typography>
				<Typography variant="body1">
					Construct your prompt by providing the context and inputs.
					The context provides supplementary information so the model
					can better understand the ask and generate a more tailored
					response.
				</Typography>
			</Box>
			<StyledContainerGrid container direction="row">
				<Grid item xs={4}>
					<Typography variant="body1">Prompt Details</Typography>
				</Grid>
				<Grid item xs={8}>
					<Stack direction="column" spacing={2}>
						<TextField
							label="Name"
							variant="outlined"
							value={props.builder.title.value ?? ""}
							onChange={(e) =>
								props.setBuilderValue("title", e.target.value)
							}
						/>
						<Autocomplete
							value={(props.builder.tags.value as string[]) ?? []}
							fullWidth
							multiple
							onChange={(_, newValue) => {
								props.setBuilderValue("tags", newValue);
							}}
							filterOptions={(options, params) => {
								const filtered = filter(options, params);

								const { inputValue } = params;
								const isExisting = options.some(
									(option) => inputValue === option,
								);
								if (inputValue !== "" && !isExisting) {
									filtered.push(inputValue);
								}

								return filtered;
							}}
							options={[]}
							renderOption={(props, option) => (
								<li {...props}>{option}</li>
							)}
							freeSolo
							renderInput={(params) => (
								<TextField {...params} label="Tags" />
							)}
						/>
						<FormControl component="fieldset">
							<FormLabel component="legend">
								LLM Configuration
							</FormLabel>
							<RadioGroup
								value={llmSelection ?? ""}
								onChange={(e) =>
									handleLLMSelectionChange(
										(e.target.value as LLMSelectionType) ||
											null,
									)
								}
							>
								<FormControlLabel
									value={LLMSelectionType.DEFAULT}
									control={<Radio />}
									label="Choose Default LLM"
								/>
								<FormControlLabel
									value={LLMSelectionType.USER_INPUT}
									control={<Radio />}
									label="Choose User Input LLM"
								/>
							</RadioGroup>
						</FormControl>
						{showLLMSettings && (
							<>
								<Autocomplete
									disableClearable
									fullWidth
									id="model-autocomplete"
									loading={cfgLibraryModels.loading}
									options={cfgLibraryModels.ids}
									value={props.builder.model.value ?? null}
									getOptionLabel={(modelId: string) =>
										cfgLibraryModels.display[modelId] ?? ""
									}
									onChange={(_, newModelId) => {
										props.setBuilderValue(
											"model",
											newModelId as string,
										);
									}}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Large Language Model"
											variant="outlined"
										/>
									)}
								/>
								<TextField
									label="Temperature"
									variant="outlined"
									type="number"
									inputProps={{
										step: 0.1,
										min: 0,
										max: 1,
									}}
									value={
										props.builder.temperature?.value ??
										"0.7"
									}
									onChange={(e) =>
										handleTemperatureChange(e.target.value)
									}
								/>
							</>
						)}
					</Stack>
				</Grid>
			</StyledContainerGrid>
			<Stack spacing={1} mt={2}>
				<Stack
					direction="row"
					justifyContent="space-between"
					paddingBottom={1}
				>
					<Typography variant="body1">Prompt Context</Typography>
				</Stack>
				<TextField
					fullWidth
					inputProps={{ sx: { height: "100%" } }}
					placeholder="Enter your prompt here. For example, &#8220;Suppose you are a policy expert with 30 years of experience.&#8221;"
					multiline
					rows={6}
					value={props.builder.context.value}
					onChange={(e) => {
						// Reset Values that are dependent on Context
						props.setBuilderValue("inputTypes", undefined);
						props.setBuilderValue("inputs", undefined);

						props.setBuilderValue("context", e.target.value);
					}}
				/>
				<Stack direction="row">
					<PromptBuilderContextTestDialogButton
						disabled={isPromptContextTestDisabled()}
						llm={props.builder.model.value as string}
						context={props.builder.context.value as string}
					/>
				</Stack>
			</Stack>
		</StyledStepPaper>
	);
};
