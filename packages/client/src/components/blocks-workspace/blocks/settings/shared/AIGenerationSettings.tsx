import { AutoAwesome, ExpandMore, HelpOutline } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { Block, BlockDef, Paths, PathValue, useBlocks } from "@semoss/renderer";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
	Accordion,
	AutocompleteTwo,
	Box,
	Button,
	Divider,
	MenuItem,
	Select,
	Slider,
	Stack,
	styled,
	TextField,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";

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
}

const StyledAccordionTrigger = styled(Accordion.Trigger)(() => ({
	"& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
		transform: "rotate(180deg)",
	},
}));
const StyledSpan = styled("span")(() => ({
	fontSize: "14px",
	fontStyle: "normal",
	lineHeight: "143%",
	letterSpacing: "0.17px",
	fontFamily: '"Inter", sans-serif',
	textTransform: "uppercase",
	fontWeight: "bold",
}));
const _StyledAccordionContentStack = styled(Stack)(() => ({
	maxHeight: "200px",
	overflowY: "auto",
	paddingTop: "6px",
}));
const _StyledSliderContainer = styled(Stack)(() => ({
	justifyContent: "space-between",
	alignItems: "center",
	alignContent: "center",
}));
const _ComplexityTooltipTitle =
	"Adjust the complexity of the AI response. Lower values will result in simple results and little deviation from the prompt and options. Higher values will result in more complex responses that may deviate from the prompt and options.";
const _PromptTooltipTitle =
	"Enter a prompt for the AI to generate a response. The AI will use this prompt to generate a response based on the options selected below. Include context for options not provided.";
const _SliderMarks = [
	{ value: 0, label: "Low" },
	{ value: 50, label: "Medium" },
	{ value: 100, label: "High" },
];
export const AIGenerationSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "AI",
		placeholder = null,
		path,
		valueAsObject = false,
		appendPrompt = "",
	}: AIGenerationSettingsProps<D>) => {
		const { setData } = useBlockSettings<D>(id);
		const { state } = useBlocks();
		const notification = useNotification();

		const [prompt, setPrompt] = useState("");
		const [responseLoading, setResponseLoading] = useState<boolean>(false);

		const modelIdRef = useRef("");
		const [modelId, setModelId] = useState<string>("");

		const [_models, setModels] = useState<
			{ app_id: string; app_name: string }[]
		>([]);
		const [_databases, _setDatabases] = useState<
			{ app_id: string; app_name: string; tag: string }[]
		>([]);
		const [expandAccordion, setExpandAccordion] = useState<boolean>(false);

		useEffect(() => {
			modelIdRef.current = modelId;
		}, [modelId]);

		const [cfgLibraryModels, setCfgLibraryModels] =
			useState<CfgLibraryEngineState>({
				loading: true,
				ids: [],
				display: {},
			});
		const [selectedModel, setSelectedModel] = useState<string>("");
		const myModels = usePixel<
			{ app_id: string; app_name: string; tag: string }[]
		>(`MyEngines(engineTypes=['MODEL']);`);
		//  const _getDatabases = usePixel("META | GetDatabaseList ( ) ;");
		const _getDatabases = () => {
			return usePixel("META | GetDatabaseList ( ) ;");
		};
		const _myDatabases =
			usePixel<{ app_id: string; app_name: string; tag: string }[]>(
				`GetDatabaseList( ) ;`,
			);
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
		useEffect(() => {
			if (_myDatabases.status !== "SUCCESS") {
				return;
			}
			console.log("_myDatabases.data", _myDatabases.data);
			_setDatabases(
				_myDatabases.data.map((d) => ({
					app_name: d.app_name ? d.app_name.replace(/_/g, " ") : "",
					app_id: d.app_id,
					tag: d.tag,
				})),
			);
		}, [_myDatabases.status, _myDatabases.data]);
		const generateAIResponse = async () => {
			try {
				setResponseLoading(true);
				console.log("modelIdRef.current", modelIdRef.current);
				console.log("prompt", prompt);
				console.log("appendPrompt", appendPrompt);
				// re-wrote LLM prompting section previous approach was throwing error
				let flattenedPrompt = `${state.flattenVariable(
					prompt,
				)} ${appendPrompt}`;
				flattenedPrompt = flattenedPrompt.replace(/"/g, "'");
				const pixel = `LLM(engine = "${modelIdRef.current}", command = "${flattenedPrompt}", paramValues = [ {} ] );`;
				const res = await runPixel(pixel);
				const LLMResponse = res.pixelReturn[0].output["response"];
				console.log("LLMResponse", res);
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

		return (
			<Stack spacing={1} width="100%">
				<Accordion
					expanded={expandAccordion}
					onChange={() =>
						setExpandAccordion(
							(expandAccordion) => !expandAccordion,
						)
					}
				>
					<StyledAccordionTrigger expandIcon={<ExpandMore />}>
						<StyledSpan>AI OPTIONS</StyledSpan>
					</StyledAccordionTrigger>
					<Accordion.Content>
						<_StyledAccordionContentStack>
							<Select
								label="Select Database"
								size="small"
								disabled={
									!cfgLibraryModels.ids.length ||
									responseLoading
								}
							>
								{_databases.map((db) => (
									<MenuItem key={db.app_id} value={db.app_id}>
										{db.app_name}
									</MenuItem>
								))}
							</Select>
							<Divider />
							<Select
								label="Select Chart Type"
								size="small"
								disabled={
									!cfgLibraryModels.ids.length ||
									responseLoading
								}
							>
								<MenuItem value="barChart">Bar Chart</MenuItem>
								<MenuItem value="lineChart">
									Line Chart
								</MenuItem>
								<MenuItem value="scatterPlot">
									Scatter Plot
								</MenuItem>
								<MenuItem value="pieChart">Pie Chart</MenuItem>
							</Select>
							<Divider />
							<Stack>
								<_StyledSliderContainer direction="row">
									<Typography variant="body2">
										Complexity
									</Typography>
									<Tooltip title={_ComplexityTooltipTitle}>
										<HelpOutline fontSize="small" />
									</Tooltip>
								</_StyledSliderContainer>
								<Box sx={{ paddingX: "24px" }}>
									<Slider
										disabled={
											!cfgLibraryModels.ids.length ||
											responseLoading
										}
										valueLabelDisplay="auto"
										marks={_SliderMarks}
										step={10}
										size="small"
									/>
								</Box>
							</Stack>
						</_StyledAccordionContentStack>
					</Accordion.Content>
				</Accordion>
				<Tooltip title={_PromptTooltipTitle}>
					<TextField
						disabled={
							!cfgLibraryModels.ids.length || responseLoading
						}
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
					/>
				</Tooltip>
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
					disabled={
						!cfgLibraryModels.ids.length || cfgLibraryModels.loading
					}
					loading={responseLoading}
					variant="outlined"
					endIcon={<AutoAwesome />}
					onClick={generateAIResponse}
				>
					Generate
				</Button>
			</Stack>
		);
	},
);
