import { AutoAwesome } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	type Block,
	type BlockDef,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
	AutocompleteTwo,
	Button,
	FileDropzone,
	Stack,
	styled,
	TextField,
	useNotification,
} from "@semoss/ui";
import { useBlockSettings, useRootStore } from "@/hooks";
import { BaseSettingSection } from "../BaseSettingSection";

type CfgLibraryEngineState = {
	loading: boolean;
	ids: string[];
	display: object;
};

interface AIGenerationSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Label to pass into the input
	 */
	label?: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;

	/**
	 * Placeholder text in prompt input
	 */
	placeholder?: string;

	/**
	 * Set path value as object instead of string
	 */
	valueAsObject?: boolean;

	/**
	 * Append additional context to the end of the prompt
	 */
	appendPrompt?: string;

	/**
	 * Control to show fileUpload for Vega Visualizations
	 */
	showFileUpload?: boolean;
}
const StyledUploadSection = styled(Stack)(({ theme }) => ({
	height: "250px",
}));
export const AIGenerationSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "AI Generation",
		placeholder = "Ex: Generate a bar graph.",
		path,
		appendPrompt = "",
		showFileUpload = false,
	}: AIGenerationSettingsProps<D>) => {
		const notification = useNotification();
		const { monolithStore, configStore } = useRootStore();
		const { setData } = useBlockSettings<D>(id);
		const { state } = useBlocks();
		const [responseLoading, setResponseLoading] = useState<boolean>(false);

		const [cfgLibraryModels, setCfgLibraryModels] =
			useState<CfgLibraryEngineState>({
				loading: true,
				ids: [],
				display: {},
			});
		const { control, handleSubmit, watch, setValue } = useForm({
			defaultValues: {
				inputFile: null,
				prompt: "",
				selectedModel: "",
			},
		});

		const inputFile = watch("inputFile");
		const prompt = watch("prompt");
		const selectedModel = watch("selectedModel");

		const _isGenerateButtonDisabled =
			!cfgLibraryModels.ids.length ||
			cfgLibraryModels.loading ||
			(showFileUpload && !inputFile) ||
			!selectedModel;

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
			if (modelIds.length) {
				setValue("selectedModel", modelIds[0]);
			}
		}, [myModels.status, myModels.data, setValue]);

		const stringifyOutput = (frameOutput: {
			headers?: string[];
			values?: (string | number | boolean)[][];
			data?: {
				headers?: string[];
				values?: (string | number | boolean)[][];
			};
		}) => {
			const headers =
				frameOutput.headers || frameOutput.data?.headers || [];
			const values = frameOutput.values || frameOutput.data?.values || [];

			// Map headers to values for each row
			const mappedData = values.map(
				(row: (string | number | boolean)[]) => {
					const rowObject: {
						[key: string]: string | number | boolean;
					} = {};
					headers.forEach((header: string, index: number) => {
						rowObject[header] = row[index];
					});
					return rowObject;
				},
			);

			return JSON.stringify(mappedData);
		};
		// original AI function
		const generateAIResponse = async () => {
			try {
				setResponseLoading(true);

				// re-wrote LLM prompting section previous approach was throwing error
				let flattenedPrompt = `${state.flattenVariable(
					prompt,
				)} ${appendPrompt}`;
				flattenedPrompt = flattenedPrompt.replace(/"/g, "'");
				const pixel = `LLM(engine = "${selectedModel}", command = "${flattenedPrompt}", paramValues = [ {} ] );`;
				const res = await runPixel(pixel);
				const LLMResponse = res.pixelReturn[0].output["response"];

				let trimmedStarterCode = LLMResponse;
				trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ""); // trims off any triple quotes from backend

				trimmedStarterCode = trimmedStarterCode.substring(
					trimmedStarterCode.indexOf("\n") + 1,
				);

				setData(
					path,
					trimmedStarterCode as PathValue<D["data"], typeof path>,
				);

				// below is the previos LLM prompting code - not sure if we want or need any of this
				// const flattenedPrompt = state.flattenVariable(prompt);
				// const pixel = `LLM(engine=["${selectedModel}"],command=["<encode>${flattenedPrompt} ${appendPrompt}</encode>"], paramValues=[${JSON.stringify(
				//     {
				//         max_new_tokens: 4000,
				//     },
				// )}]);`;
				// const { errors, pixelReturn } = await monolithStore.runQuery(
				//     pixel,
				// );
				// let valueToSet = pixelReturn[0]?.output?.response;
				// if (errors.length > 0 || typeof valueToSet !== 'string') {
				//     throw new Error(errors.join(''));
				// }
				// if (valueAsObject) {
				//     valueToSet = !!pixelReturn[0].output?.response
				//         ? JSON.parse(
				//               pixelReturn[0].output?.response
				//                   .replaceAll('\\"', '"')
				//                   .replaceAll('\\n', ''),
				//           )
				//         : undefined;
				//     if (valueToSet === undefined) {
				//         notification.add({
				//             color: 'error',
				//             message:
				//                 'There was an issue parsing the JSON in your response.',
				//         });
				//     }
				// }
				// setData(path, "valueToSet" as PathValue<D['data'], typeof path>);
			} catch (e) {
				console.error(e);

				notification.add({
					color: "error",
					message: e.message,
				});
			} finally {
				setResponseLoading(false);
			}
		};

		const generateAIVegaResponse = async () => {
			try {
				setResponseLoading(true);
				const upload = await monolithStore.uploadFile(
					inputFile,
					configStore.store.insightID,
					null,
					null,
				);
				const pixel = `FileRead ( filePath = ["${upload[0].fileLocation}"], delimiter=",") | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "AI_VEGA_FRAME" ] ) ] ) | QueryAll ( ) | CollectAll ( ) ;`;
				const response = await monolithStore.runQuery(pixel);
				const { output: frameOutput } = response.pixelReturn[0];

				const stringifiedOutput = stringifyOutput(frameOutput);
				const frameToGraphPixel = `FrameToGraph ( model = "${selectedModel}", userInput = "<encode>${prompt}</encode>", DATA_STRING = "<encode>${stringifiedOutput}</encode>", insightName="${configStore.store.insightID}")`;
				const frameToGraphPixelResponse =
					await monolithStore.runQuery(frameToGraphPixel);
				const { output: graphOutput } =
					frameToGraphPixelResponse.pixelReturn[0];

				if (graphOutput) {
					// Remove schema and extract content between first { and last }
					let cleanedOutput = graphOutput.replace(
						/["']?\$schema["']?\s*:\s*["'][^"']*["'],?\s*/g,
						"",
					);

					// Find first opening brace and last closing brace
					const firstBraceIndex = cleanedOutput.indexOf("{");
					const lastBraceIndex = cleanedOutput.lastIndexOf("}");

					if (
						firstBraceIndex !== -1 &&
						lastBraceIndex !== -1 &&
						firstBraceIndex < lastBraceIndex
					) {
						cleanedOutput = cleanedOutput.substring(
							firstBraceIndex,
							lastBraceIndex + 1,
						);
					}

					try {
						const specJson = JSON.parse(cleanedOutput);
						setData(
							path,
							specJson as PathValue<D["data"], typeof path>,
						);
					} catch {
						setData(
							path,
							cleanedOutput as PathValue<D["data"], typeof path>,
						);
					}
				}
			} catch (e) {
				console.error(e);
				notification.add({
					color: "error",
					message: e.message,
				});
			} finally {
				setResponseLoading(false);
			}
		};

		const generateResponse = showFileUpload
			? generateAIVegaResponse
			: generateAIResponse;

		return (
			<BaseSettingSection label={label}>
				<form
					onSubmit={handleSubmit(generateResponse)}
					style={{ width: "100%" }}
				>
					<Stack spacing={1}>
						{showFileUpload && (
							<StyledUploadSection spacing={2}>
								<Typography variant="body1">
									Upload CSV{" "}
									<Typography component="span" color="error">
										*
									</Typography>
								</Typography>
								<Controller
									name="inputFile"
									control={control}
									render={({ field }) => (
										<FileDropzone
											extensions={[".csv"]}
											onChange={(file: File) =>
												field.onChange([file])
											}
											disabled={responseLoading}
										/>
									)}
								/>
							</StyledUploadSection>
						)}
						<Controller
							name="prompt"
							control={control}
							render={({ field }) => (
								<TextField
									disabled={
										!cfgLibraryModels.ids.length ||
										responseLoading
									}
									fullWidth
									multiline
									rows={5}
									{...field}
									size="small"
									variant="outlined"
									autoComplete="off"
									placeholder={placeholder}
									label="AI Generator"
									InputLabelProps={{
										shrink: true,
									}}
									onChange={(e) =>
										setValue("prompt", e.target.value)
									}
								/>
							)}
						/>
						<Controller
							name="selectedModel"
							control={control}
							render={({ field }) => (
								<AutocompleteTwo
									disabled={
										!cfgLibraryModels.ids.length ||
										responseLoading
									}
									disableClearable
									fullWidth
									id="model-autocomplete"
									loading={cfgLibraryModels.loading}
									options={cfgLibraryModels.ids}
									value={field.value}
									size="small"
									getOptionLabel={(modelId: string) =>
										cfgLibraryModels.display[modelId] ?? ""
									}
									onChange={(_, newModelId) =>
										field.onChange(newModelId)
									}
									renderInput={(params) => (
										<TextField
											{...params}
											variant="outlined"
										/>
									)}
								/>
							)}
						/>
						<Button
							disabled={_isGenerateButtonDisabled}
							loading={responseLoading}
							variant="outlined"
							endIcon={<AutoAwesome />}
							type="submit"
						>
							Generate with AI
						</Button>
					</Stack>
				</form>
			</BaseSettingSection>
		);
	},
);
