import { AutoAwesome } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Block, BlockDef, Paths, useBlocksPixel } from "@semoss/renderer";
import { usePixel } from "@semoss/sdk/react";
import {
	Accordion,
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
const StyledUploadSection = styled(Stack)(() => ({
	height: "250px",
}));
const StyledAccordionTrigger = styled(Accordion.Trigger)(() => ({
	"& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
		transform: "rotate(180deg)",
	},
}));
const StyledFileDropzone = styled(FileDropzone)(() => ({
	padding: "0 10px 0 10px",
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
		// const [prompt, setPrompt] = useState("");
		const [responseLoading, setResponseLoading] = useState<boolean>(false);
		const [frameAccordionExpanded, setFrameAccordionExpanded] =
			useState(false);
		const modelIdRef = useRef("");
		const [modelId, setModelId] = useState<string>("");

		const [_fileForFrameData, _setFileForFrameData] = useState<
			File[] | null
		>(null);

		// const [selectedModel, setSelectedModel] = useState<string>("");
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
			!inputFile ||
			!selectedModel;
		// const getFrames = usePixel<{ frameList: string[] }>(`GetFrames();`);
		// useMemo(() => {
		// 	if (getFrames.status !== "SUCCESS") {
		// 		return;
		// 	}
		// 	const frames = getFrames.data[0]?.frameList ?? [];
		// 	_setFrames(frames);
		// 	console.log("Available frames: ", frames);
		// }, [getFrames.status, getFrames.data, configStore]);
		const getFrames = useBlocksPixel<string[]>("GetFrames();", {
			data: [],
		});
		const frames = getFrames.status === "SUCCESS" ? getFrames.data : [];
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
		// TODO: const generateFrames but dont use monolithstore

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
				const pixel = `FileRead ( filePath = ["${upload[0].fileLocation}"], delimiter=",") | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "NLP_FRAME" ] ) ] ) | FrameToGraph ( model = "${selectedModel}", userInput = "${prompt}", insightName="${configStore.store.insightID}")`;
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
			<form onSubmit={handleSubmit(generateAIResponse)}>
				<Stack spacing={1} width="100%">
					<Accordion
						expanded={frameAccordionExpanded}
						onChange={() =>
							setFrameAccordionExpanded(!frameAccordionExpanded)
						}
					>
						<StyledAccordionTrigger expandIcon={<ExpandMoreIcon />}>
							Upload Frame with CSV
						</StyledAccordionTrigger>
						<StyledUploadSection spacing={2}>
							{/* <Typography variant="body1">
								Upload CSV to Create Frame{" "}
								<Typography component="span" color="error">
									*
								</Typography>
							</Typography> */}
							<Controller
								name="inputFile"
								control={control}
								render={({ field }) => (
									<StyledFileDropzone
										extensions={[".csv"]}
										onChange={(file: File) =>
											field.onChange([file])
										}
										disabled={responseLoading}
									/>
								)}
							/>
						</StyledUploadSection>
						<Stack
							direction="row"
							justifyContent="flex-end"
							sx={{ p: 2 }}
						>
							<Button
								disabled={_isGenerateButtonDisabled}
								loading={responseLoading}
								variant="outlined"
								type="submit"
							>
								Create Frame
							</Button>
						</Stack>
					</Accordion>
					<AutocompleteTwo
						multiple={false}
						disabled={getFrames.status !== "SUCCESS"}
						options={frames}
						disablePortal
						id="frame-select"
						renderInput={(params) => (
							<TextField
								{...params}
								label="Select Frame"
								size="small"
							/>
						)}
					/>
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
								} // required
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
									<TextField {...params} variant="outlined" />
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
		);
	},
);
