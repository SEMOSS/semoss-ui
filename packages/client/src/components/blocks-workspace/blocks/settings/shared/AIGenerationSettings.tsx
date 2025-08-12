import { AutoAwesome } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Block, BlockDef, Paths } from "@semoss/renderer";
import { usePixel } from "@semoss/sdk/react";
import {
	AutocompleteTwo,
	Button,
	FileDropzone,
	Stack,
	styled,
	TextField,
	useNotification,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";

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
	 * Set the AI output JSON
	 */
	setAIOutputJSON?: (output: string) => void;
}
const StyledUploadSection = styled(Stack)(({ theme }) => ({
	height: "250px",
}));
export const AIGenerationSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "AI",
		placeholder = null,
		path,
		valueAsObject = false,
		appendPrompt = "",
		setAIOutputJSON,
	}: AIGenerationSettingsProps<D>) => {
		const notification = useNotification();
		const { monolithStore, configStore } = useRootStore();
		const [prompt, setPrompt] = useState("");
		const [responseLoading, setResponseLoading] = useState<boolean>(false);

		const modelIdRef = useRef("");
		const [modelId, setModelId] = useState<string>("");

		const [inputFile, setInputFile] = useState<File[] | null>(null);

		const [selectedModel, setSelectedModel] = useState<string>("");
		const [_models, setModels] = useState<
			{ app_id: string; app_name: string }[]
		>([]);

		useEffect(() => {
			modelIdRef.current = modelId;
		}, [modelId]);

		const [cfgLibraryModels, setCfgLibraryModels] =
			useState<CfgLibraryEngineState>({
				loading: true,
				ids: [],
				display: {},
			});
		const _isGenerateButtonDisabled =
			!cfgLibraryModels.ids.length ||
			cfgLibraryModels.loading ||
			!inputFile ||
			!selectedModel;
			// || !prompt

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
				setSelectedModel(modelIds[0]);
			}
		}, [myModels.status, myModels.data]);

		useEffect(() => {
			if (myModels.status !== "SUCCESS") {
				return;
			}

			setModels(
				myModels.data.map((d) => ({
					app_name: d.app_name ? d.app_name.replace(/_/g, " ") : "",
					app_id: d.app_id,
				})),
			);
			if (myModels.data.length) {
				setModelId(myModels.data[0].app_id);
			}
		}, [myModels.status, myModels.data]);

		useEffect(() => {
			if (myModels.status !== "SUCCESS") {
				return;
			}

			setModels(
				myModels.data.map((d) => ({
					app_name: d.app_name ? d.app_name.replace(/_/g, " ") : "",
					app_id: d.app_id,
				})),
			);
			if (myModels.data.length) {
				setModelId(myModels.data[0].app_id);
			}
		}, [myModels.status, myModels.data]);

		const generateAIResponse = async () => {
			try {
				// For vega LLM prompting generation
				setResponseLoading(true);
				const upload = await monolithStore.uploadFile(
					inputFile,
					configStore.store.insightID,
					null,
					null,
				);
				const pixel = `FileRead ( filePath = ["${upload[0].fileLocation}"], delimiter=",") | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "NLP_FRAME" ] ) ] ) | FrameToGraph ( model = '${selectedModel}')`;
				// const pixel = `FileRead ( filePath = ["${upload[0].fileLocation}"], delimiter=",") `
				const response = await monolithStore.runQuery(pixel);
				console.log("Response from runQuery:", response);
				const { output } = response.pixelReturn[0];
				// if (typeof output === "string") {
				//     const stringedOutput =  output.replace(/["']?\$schema["']?\s*:\s*["'][^"']*["'],?\s*/g, "");
				//     console.log('stringedOutput:', stringedOutput);
				// }
				if (output && setAIOutputJSON) {
					const stringedOutput = output.replace(
						/["']?\$schema["']?\s*:\s*["'][^"']*["'],?\s*/g,
						"",
					);
					console.log("stringedOutput:", stringedOutput);
					console.log(
						"Setting AI output JSON from generationsettings:",
						output,
					);
					setAIOutputJSON(stringedOutput);
				}
				//Below is another previous LLM prompting code - did not work
				// setResponseLoading(true);

				// // re-wrote LLM prompting section previous approach was throwing error
				// let flattenedPrompt = `${state.flattenVariable(
				//     prompt,
				// )} ${appendPrompt}`;
				// flattenedPrompt = flattenedPrompt.replace(/"/g, "'");
				// const pixel = `LLM(engine = "${modelIdRef.current}", command = "${flattenedPrompt}", paramValues = [ {} ] );`;
				// const res = await runPixel(pixel);
				// const LLMResponse = res.pixelReturn[0].output['response'];

				// let trimmedStarterCode = LLMResponse;
				// trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ''); // trims off any triple quotes from backend

				// trimmedStarterCode = trimmedStarterCode.substring(
				//     trimmedStarterCode.indexOf('\n') + 1,
				// );

				// setData(
				//     path,
				//     trimmedStarterCode as PathValue<D['data'], typeof path>,
				// );

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
		return (
			<Stack spacing={1} width="100%">
				<StyledUploadSection spacing={2}>
					<Typography variant="body1">
						Upload CSV{" "}
						<Typography component="span" color="error">
							*
						</Typography>
					</Typography>
					<FileDropzone
						extensions={[".csv"]}
						onChange={(file: File) => {
							setInputFile([file]);
						}}
						disabled={responseLoading}
					/>
				</StyledUploadSection>
				<TextField
					disabled={!cfgLibraryModels.ids.length || responseLoading}
					fullWidth
					multiline
					rows={5}
					value={prompt}
					onChange={(e) => {
						// sync the data on change
						setPrompt(e.target.value);
					}}
					size="small"
					variant="outlined"
					autoComplete="off"
					placeholder={placeholder}
					label="AI Generator"
					InputLabelProps={{
						shrink: true,
					}}
					required
				/>
				<AutocompleteTwo
					disabled={!cfgLibraryModels.ids.length || responseLoading}
					disableClearable
					fullWidth
					id="model-autocomplete"
					loading={cfgLibraryModels.loading}
					options={cfgLibraryModels.ids}
					value={selectedModel}
					size="small"
					getOptionLabel={(modelId: string) =>
						cfgLibraryModels.display[modelId] ?? ""
					}
					onChange={(_, newModelId) => {
						setSelectedModel(newModelId);
					}}
					renderInput={(params) => (
						<TextField {...params} variant="outlined" />
					)}
				/>
				<Button
					disabled={_isGenerateButtonDisabled}
					loading={responseLoading}
					variant="outlined"
					endIcon={<AutoAwesome />}
					onClick={generateAIResponse}
				>
					Generate with AI
				</Button>
			</Stack>
		);
	},
);
