import { AutoAwesome } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
	type Block,
	type BlockDef,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
	Autocomplete,
	Button,
	Stack,
	TextField,
	useNotification,
} from "@semoss/ui";
import { useBlockSettings, useWorkspace } from "@/hooks";

interface VegaGenerationSettingsProps<D extends BlockDef = BlockDef> {
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

export const VegaGenerationSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		label = "AI",
		placeholder = null,
		path,
		valueAsObject = false,
		appendPrompt = "",
	}: VegaGenerationSettingsProps<D>) => {
		const { setData } = useBlockSettings<D>(id);
		const { state } = useBlocks();
		const { workspace } = useWorkspace();
		const selectedModel = workspace.agentModelEngine
			? workspace.agentModelEngine
			: null;
		const notification = useNotification();
		const [prompt, setPrompt] = useState("");
		const [responseLoading, setResponseLoading] = useState<boolean>(false);
		const [frames, setFrames] = useState<string[]>([]);
		const [selectedFrame, setSelectedFrame] = useState([]);

		async function handleFrame() {
			const getFrames = await state.runSideEffect("GetFrames();");
			const list = getFrames.pixelReturn[0].output as string[];
			if (list.length > 0) {
				setFrames((prev) => [...list]);
			}
		}

		const myDbs =
			usePixel<{ app_id: string; app_name: string }[]>(`GetFrames();`);

		useEffect(() => {
			if (myDbs.status !== "SUCCESS") {
				return;
			}
			handleFrame();
		}, [myDbs.status]);

		const frameDataQuery = async () => {
			try {
				const pixel = `META | Frame("${selectedFrame}") | QueryAll()| Limit(1000) | CollectAll()`;
				const result = await runPixel(pixel, workspace.insightId);
				const { output, operationType } = result.pixelReturn[0];

				if (operationType[0] !== "ERROR") {
					if (output) {
						const outputArray = (output as any).data.values.map(
							(value) => {
								const row: any = {};
								value.forEach((val, index) => {
									row[(output as any).data.headers[index]] =
										val;
								});
								return row;
							},
						);
						return outputArray;
					}
				} else {
					notification.add({
						color: "error",
						message: "Error fetching frame data.",
					});
				}
			} catch (e) {
				console.error(e);
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		};

		const generateAIResponse = async () => {
			try {
				const pixel = `FrameToGraph ( model = "${selectedModel}", userInput = "<encode>${prompt}</encode>", frame="${selectedFrame}", insightName="${workspace.insightId}")`;
				const result = await runPixel(pixel, workspace.insightId);
				const { output, operationType } = result.pixelReturn[0];

				if (operationType[0] !== "ERROR") {
					if (output) {
						let cleanedOutput = (output as string).replace(
							/["']?\$schema["']?\s*:\s*["'][^"']*["'],?\s*/g,
							"",
						);
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
							return JSON.parse(cleanedOutput);
						} catch {
							return cleanedOutput;
						}
					}
				} else {
					notification.add({
						color: "error",
						message: "Missing model or frame selection.",
					});
				}
			} catch (e) {
				console.error(e);
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		};

		const handleGenerate = async () => {
			setResponseLoading(true);
			try {
				const frameData = await frameDataQuery();
				const vegaResponse = await generateAIResponse();

				if (frameData && vegaResponse) {
					if (
						vegaResponse.data &&
						Array.isArray(vegaResponse.data) &&
						vegaResponse.data.length > 0
					) {
						vegaResponse.data[0].values = frameData || [];
					}
					setData(
						path,
						vegaResponse as PathValue<D["data"], typeof path>,
					);
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

		return (
			<Stack spacing={2} width="100%">
				<Autocomplete
					options={frames}
					size="small"
					label={"Select Frame"}
					onChange={(val, e) => {
						setSelectedFrame(e);
					}}
				/>
				<TextField
					disabled={responseLoading}
					fullWidth
					multiline
					rows={5}
					value={prompt}
					onChange={(e) => {
						setPrompt(e.target.value);
					}}
					size="small"
					variant="outlined"
					autoComplete="off"
					placeholder={placeholder}
					label="AI Generator"
				/>

				<Button
					disabled={responseLoading} // disabled if no selected frames
					loading={responseLoading}
					variant="outlined"
					endIcon={<AutoAwesome />}
					onClick={handleGenerate} // call QueryAll() at the same time. Store into a variable just to have. Then bind the data from this QueryAll into the values section of the vega template
				>
					Generate with AI
				</Button>
			</Stack>
		);
	},
);
