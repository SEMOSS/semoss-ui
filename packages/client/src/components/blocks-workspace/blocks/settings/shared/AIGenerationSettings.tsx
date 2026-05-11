import { Sparkles } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	type Paths,
	type PathValue,
	useBlocks,
} from "@semoss/renderer";
import { runPixel, usePixel } from "@semoss/sdk/react";
import { Button, toast } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

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

export const AIGenerationSettings = observer(
	<D extends BlockDef = BlockDef>({
		id,
		placeholder = null,
		path,
		appendPrompt = "",
	}: AIGenerationSettingsProps<D>) => {
		const { setData } = useBlockSettings<D>(id);
		const { state } = useBlocks();
		const [prompt, setPrompt] = useState("");
		const [responseLoading, setResponseLoading] = useState<boolean>(false);

		const modelIdRef = useRef("");
		const [modelId, setModelId] = useState<string>("");

		const [_models, setModels] = useState<
			{ engine_id: string; engine_name: string }[]
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
		const [selectedModel, setSelectedModel] = useState<string>("");
		const myModels = usePixel<
			{ engine_id: string; engine_name: string; tag: string }[]
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
					modelIds.push(model.engine_id);
					modelDisplay[model.engine_id] = model.engine_name;
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
					engine_name: d.engine_name
						? d.engine_name.replace(/_/g, " ")
						: "",
					engine_id: d.engine_id,
				})),
			);
			if (myModels.data.length) {
				setModelId(myModels.data[0].engine_id);
			}
		}, [myModels.status, myModels.data]);

		useEffect(() => {
			if (myModels.status !== "SUCCESS") {
				return;
			}

			setModels(
				myModels.data.map((d) => ({
					engine_name: d.engine_name
						? d.engine_name.replace(/_/g, " ")
						: "",
					engine_id: d.engine_id,
				})),
			);
			if (myModels.data.length) {
				setModelId(myModels.data[0].engine_id);
			}
		}, [myModels.status, myModels.data]);

		const generateAIResponse = async () => {
			try {
				setResponseLoading(true);

				// re-wrote LLM prompting section previous approach was throwing error
				let flattenedPrompt = `${state.flattenVariable(
					prompt,
				)} ${appendPrompt}`;
				flattenedPrompt = flattenedPrompt.replace(/"/g, "'");
				const pixel = `LLM(engine = "${modelIdRef.current}", command = "${flattenedPrompt}", paramValues = [ {} ] );`;
				const res = await runPixel(pixel);
				const LLMResponse = (
					res.pixelReturn[0].output as { response: string }
				).response;

				let trimmedStarterCode = LLMResponse;
				trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ""); // trims off any triple quotes from backend

				trimmedStarterCode = trimmedStarterCode.substring(
					trimmedStarterCode.indexOf("\n") + 1,
				);

				setData(
					path,
					trimmedStarterCode as PathValue<D["data"], typeof path>,
				);
			} catch (e) {
				console.error(e);

				toast.error(e.message);
			} finally {
				setResponseLoading(false);
			}
		};

		return (
			<div className="flex w-full flex-col gap-1">
				<textarea
					disabled={!cfgLibraryModels.ids.length || responseLoading}
					rows={5}
					value={prompt}
					onChange={(e) => {
						// sync the data on change
						setPrompt(e.target.value);
					}}
					autoComplete="off"
					placeholder={placeholder}
					className="w-full resize-none rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
				/>
				<select
					disabled={!cfgLibraryModels.ids.length || responseLoading}
					value={selectedModel}
					onChange={(e) => setSelectedModel(e.target.value)}
					className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
				>
					{cfgLibraryModels.ids.map((id) => (
						<option key={id} value={id}>
							{(
								cfgLibraryModels.display as Record<
									string,
									string
								>
							)[id] ?? id}
						</option>
					))}
				</select>
				<Button
					disabled={
						!cfgLibraryModels.ids.length || cfgLibraryModels.loading
					}
					variant="outline"
					onClick={generateAIResponse}
					className="flex items-center gap-1"
				>
					{responseLoading ? "Generating..." : "Generate"}
					<Sparkles className="size-4" />
				</Button>
			</div>
		);
	},
);
