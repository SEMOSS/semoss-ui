import { useMemo, useState } from "react";
import {
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import { usePixel } from "@/hooks";
import { StyledStepPaper } from "../../prompt.styled";
import type { Builder } from "../../prompt.types";
import { PromptBuilderContextTestDialogButton } from "./PromptBuilderContextTestDialogButton";

type CfgLibraryEngineState = {
	loading: boolean;
	ids: string[];
	display: Record<string, string>;
};
const InitialCfgLibraryEngineState: CfgLibraryEngineState = {
	loading: true,
	ids: [],
	display: {},
};

export const PromptBuilderContextStep = (props: {
	builder: Builder;
	setBuilderValue: (builderStepKey: string, value: string | string[]) => void;
}) => {
	const [cfgLibraryModels, setCfgLibraryModels] = useState(
		InitialCfgLibraryEngineState,
	);
	const [nameFocused, setNameFocused] = useState(false);
	const [modelOpen, setModelOpen] = useState(false);

	const nameHasValue = !!((props.builder.title.value as string) ?? "");
	const modelHasValue = !!((props.builder.model.value as string) ?? "");

	const isPromptContextTestDisabled =
		!props.builder.model.value || !props.builder.context.value;

	const myModels = usePixel<
		{ engine_id: string; engine_name: string; tag: string }[]
	>(`MyEngines(engineTypes=['MODEL']);`);
	useMemo(() => {
		if (myModels.status !== "SUCCESS") {
			return;
		}

		const modelIds: string[] = [];
		const modelDisplay: Record<string, string> = {};
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
	}, [myModels.status, myModels.data]);

	const floatingLabelBase: React.CSSProperties = {
		position: "absolute",
		left: "12px",
		pointerEvents: "none",
		transition: "all 0.2s ease",
		backgroundColor: "white",
		paddingInline: "4px",
		fontSize: "16px",
		color: "#6b7280",
	};

	const floatingLabelResting: React.CSSProperties = {
		...floatingLabelBase,
		top: "50%",
		transform: "translateY(-50%)",
	};

	const floatingLabelFloated: React.CSSProperties = {
		...floatingLabelBase,
		top: "0",
		transform: "translateY(-50%)",
		fontSize: "13px",
	};

	return (
		<StyledStepPaper>
			<style>
				{`
				[data-highlighted] {
					background-color: #dcfce7 !important;
					color: #166534 !important;
				}
				[data-state="checked"] {
					background-color: #f0fdf4 !important;
				}
				`}
			</style>
			<div>
				<h6 className="text-lg font-semibold">Create Prompt</h6>
				<p className="text-base">
					Construct your prompt by providing the context and inputs.
					The context provides supplementary information so the model
					can better understand the ask and generate a more tailored
					response.
				</p>
			</div>
			<div className="mt-3 flex flex-row">
				<div className="w-1/3">
					<p className="text-base">Prompt Details</p>
				</div>
				<div className="w-2/3">
					<div className="flex flex-col gap-4">
						<div style={{ position: "relative" }}>
							<label
								htmlFor="prompt-name"
								style={
									nameFocused || nameHasValue
										? {
												...floatingLabelFloated,
												color: nameFocused
													? "#16a34a"
													: "#6b7280",
											}
										: floatingLabelResting
								}
							>
								Name
							</label>
							<Input
								id="prompt-name"
								value={
									(props.builder.title.value as string) ?? ""
								}
								onFocus={() => setNameFocused(true)}
								onBlur={() => setNameFocused(false)}
								onChange={(e) =>
									props.setBuilderValue(
										"title",
										e.target.value,
									)
								}
								style={{										height: "54px",									borderColor: nameFocused
										? "#16a34a"
										: undefined,
									boxShadow: nameFocused
										? "0 0 0 1px #16a34a"
										: undefined,
								}}
							/>
						</div>
						<div style={{ position: "relative" }}>
							<label
								htmlFor="model-select"
								style={
									modelOpen || modelHasValue
										? {
												...floatingLabelFloated,
												color: modelOpen
													? "#16a34a"
													: "#6b7280",
											}
										: floatingLabelResting
								}
							>
								Large Language Model
							</label>
							<Select
								open={modelOpen}
								onOpenChange={setModelOpen}
								value={
									(props.builder.model.value as string) ?? ""
								}
								onValueChange={(newModelId) => {
									props.setBuilderValue("model", newModelId);
								}}
							>
								<SelectTrigger
									id="model-select"
									className="w-full"
									style={{
										height: "54px",
										borderColor: modelOpen
											? "#16a34a"
											: undefined,
										boxShadow: modelOpen
											? "0 0 0 1px #16a34a"
											: undefined,
									}}
								>
									<SelectValue placeholder="" />
								</SelectTrigger>
								<SelectContent>
									{cfgLibraryModels.loading ? (
										<div className="px-2 py-1.5 text-sm text-muted-foreground">
											Loading...
										</div>
									) : (
										cfgLibraryModels.ids.map((modelId) => (
											<SelectItem
												key={modelId}
												value={modelId}
											>
												{cfgLibraryModels.display[
													modelId
												] ?? ""}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</div>
			<div className="mt-4 flex flex-col gap-2">
				<div className="flex flex-row justify-between pb-2">
					<p className="text-base">Prompt Context</p>
				</div>
				<Textarea
					placeholder='Enter your prompt here. For example, "Suppose you are a policy expert with 30 years of experience."'
					rows={10}
					value={props.builder.context.value as string}
					onChange={(e) => {
						props.setBuilderValue("inputTypes", undefined);
						props.setBuilderValue("inputs", undefined);
						props.setBuilderValue("context", e.target.value);
					}}
				/>
				<div className="flex flex-row">
					<PromptBuilderContextTestDialogButton
						disabled={isPromptContextTestDisabled}
						llm={props.builder.model.value as string}
						context={props.builder.context.value as string}
					/>
				</div>
			</div>
		</StyledStepPaper>
	);
};
