import { useId, useMemo, useState } from "react";
import {
	Input,
	Label,
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
import { PromptBuilderContextTestDialogButton } from "./prompt-builder-context-test-dialog-button";

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

export const PromptBuilderContextStep = (props: {
	builder: Builder;
	setBuilderValue: (builderStepKey: string, value: string | string[]) => void;
}) => {
	const baseId = useId();
	const [cfgLibraryModels, setCfgLibraryModels] = useState(
		InitialCfgLibraryEngineState,
	);

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
		const modelDisplay = {};
		myModels.data.forEach((model) => {
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

	return (
		<StyledStepPaper>
			<div>
				<h2 className="font-semibold text-lg">Create Prompt</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Construct your prompt by providing the context and inputs.
					The context provides supplementary information so the model
					can better understand the ask and generate a more tailored
					response.
				</p>
			</div>
			<div className="mt-6 grid grid-cols-[1fr_2fr] gap-4">
				<p className="pt-1 font-medium text-sm">Prompt Details</p>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${baseId}-name`}>Name</Label>
						<Input
							id={`${baseId}-name`}
							value={props.builder.title.value ?? ""}
							onChange={(e) =>
								props.setBuilderValue("title", e.target.value)
							}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={`${baseId}-model`}>
							Large Language Model
						</Label>
						<Select
							value={(props.builder.model.value as string) ?? ""}
							onValueChange={(newModelId) =>
								props.setBuilderValue("model", newModelId)
							}
							disabled={cfgLibraryModels.loading}
						>
							<SelectTrigger
								id={`${baseId}-model`}
								className="w-full"
							>
								<SelectValue
									placeholder={
										cfgLibraryModels.loading
											? "Loading..."
											: "Select LLM"
									}
								>
									{(props.builder.model.value as string)
										? (cfgLibraryModels.display[
												props.builder.model
													.value as string
											] ?? props.builder.model.value)
										: undefined}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{cfgLibraryModels.ids.map((id) => (
									<SelectItem key={id} value={id}>
										<div className="flex flex-col gap-0.5">
											<span>
												{cfgLibraryModels.display[id]}
											</span>
											<span className="text-muted-foreground text-xs">
												<span className="font-medium">
													id:
												</span>{" "}
												{id}
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
			<div className="mt-4 flex flex-col gap-2">
				<div className="flex items-center justify-between pb-1">
					<p className="font-medium text-sm">Prompt Context</p>
					<PromptBuilderContextTestDialogButton
						disabled={isPromptContextTestDisabled}
						llm={props.builder.model.value as string}
						context={props.builder.context.value as string}
					/>
				</div>
				<Textarea
					className="min-h-[144px]"
					placeholder='Enter your prompt here. For example, "Suppose you are a policy expert with 30 years of experience."'
					value={(props.builder.context.value as string) ?? ""}
					onChange={(e) => {
						props.setBuilderValue("inputTypes", undefined);
						props.setBuilderValue("inputs", undefined);
						props.setBuilderValue("context", e.target.value);
					}}
				/>
			</div>
		</StyledStepPaper>
	);
};
