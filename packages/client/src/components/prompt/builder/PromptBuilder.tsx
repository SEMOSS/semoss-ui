import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, toast } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import {
	INPUT_TYPE_DATABASE,
	INPUT_TYPE_VECTOR,
	PROMPT_BUILDER_CONSTRAINTS_STEP,
	PROMPT_BUILDER_CONTEXT_STEP,
	PROMPT_BUILDER_INPUT_TYPES_STEP,
	PROMPT_BUILDER_INPUTS_STEP,
	PROMPT_BUILDER_PREVIEW_STEP,
	TOKEN_TYPE_INPUT,
} from "../prompt.constants";
import { setBlocksAndOpenUIBuilder } from "../prompt.helpers";
import type {
	Builder,
	BuilderStepItem,
	ConstraintSettings,
	Token,
} from "../prompt.types";
import { PromptBuilderStep } from "./step";
import { PromptBuilderSummary } from "./summary";

const initialBuilder: Builder = {
	title: {
		step: PROMPT_BUILDER_CONTEXT_STEP,
		value: undefined,
		required: true,
		display: "Name",
	},
	model: {
		step: PROMPT_BUILDER_CONTEXT_STEP,
		value: undefined,
		required: true,
		display: "LLM",
	},
	context: {
		step: PROMPT_BUILDER_CONTEXT_STEP,
		value: undefined,
		required: true,
		display: "Context",
	},
	inputs: {
		step: PROMPT_BUILDER_INPUTS_STEP,
		value: undefined,
		required: false,
		display: "Input",
	},
	inputTypes: {
		step: PROMPT_BUILDER_INPUT_TYPES_STEP,
		value: undefined,
		required: true,
		display: "Input Types",
	},
	constraints: {
		step: PROMPT_BUILDER_CONSTRAINTS_STEP,
		value: undefined,
		required: true,
		display: "Constraints",
	},
};

export const PromptBuilder = () => {
	const { monolithStore } = useRootStore();
	const [builder, setBuilder] = useState<Builder>(initialBuilder);
	const [currentBuilderStep, changeBuilderStep] = useState<number>(1);
	const [createAppLoading, setCreateAppLoading] = useState<boolean>(false);
	const navigate = useNavigate();

	const setBuilderValue = (
		builderStepKey: string,
		value: string | Token[] | ConstraintSettings | object,
	) => {
		setBuilder((state) => ({
			...state,
			[builderStepKey]: { ...state[builderStepKey], value: value },
		}));
	};

	const nextButtonText =
		currentBuilderStep < PROMPT_BUILDER_CONSTRAINTS_STEP
			? "Next"
			: currentBuilderStep === PROMPT_BUILDER_CONSTRAINTS_STEP
				? "Preview"
				: "Create App";

	// adds explanation to error message if input types are not set properly
	const checkForInputTypesSkipped = (errorMessage) => {
		if (
			errorMessage ===
			"Cannot read properties of undefined (reading 'type')"
		) {
			return `${errorMessage}. Please define input types.`;
		} else {
			return errorMessage;
		}
	};

	const nextButtonAction = async () => {
		if (currentBuilderStep === PROMPT_BUILDER_PREVIEW_STEP) {
			setCreateAppLoading(true);
			// prompt flow finished, move on
			try {
				await setBlocksAndOpenUIBuilder(
					builder,
					monolithStore,
					navigate,
				);
			} catch (e) {
				toast.error(checkForInputTypesSkipped(e.message));
				setCreateAppLoading(false);
			}
		} else if (currentBuilderStep === PROMPT_BUILDER_INPUTS_STEP) {
			// skip input types step if no inputs configured
			const hasInputs = (builder.inputs.value as Token[]).some(
				(token: Token) => {
					return token.type === TOKEN_TYPE_INPUT;
				},
			);

			if (!hasInputs) {
				setBuilderValue("inputTypes", {});
			}
			changeBuilderStep(currentBuilderStep + (hasInputs ? 1 : 2));
		} else {
			changeBuilderStep(currentBuilderStep + 1);
		}
	};

	const backButtonAction = () => {
		if (currentBuilderStep === PROMPT_BUILDER_INPUT_TYPES_STEP + 1) {
			// moving back from step after input types step - if no input types, skip that step moving backwards
			const hasInputs = (builder.inputs.value as Token[]).some(
				(token: Token) => {
					return token.type === TOKEN_TYPE_INPUT;
				},
			);
			changeBuilderStep(currentBuilderStep - (hasInputs ? 1 : 2));
		} else {
			changeBuilderStep(currentBuilderStep - 1);
		}
	};

	const isBuilderStepComplete = (step: number) => {
		const stepItems = Object.values(builder).filter(
			(builderStepItem: BuilderStepItem) => {
				return (
					builderStepItem.step === step &&
					(builderStepItem.required || !builderStepItem.value)
				);
			},
		);
		switch (step) {
			case PROMPT_BUILDER_INPUT_TYPES_STEP:
				// input type step - required only if there are inputs
				if (stepItems[0].value === undefined) {
					return false;
				}
				// if there are inputs, make sure we have types for all
				// and types that require extra info have the extra info
				return (
					Object.values(stepItems[0].value).length &&
					Object.values(stepItems[0].value).every(
						(inputType: { type: string; meta: string }) => {
							if (
								inputType?.type === INPUT_TYPE_VECTOR ||
								inputType?.type === INPUT_TYPE_DATABASE
							) {
								return !!inputType.meta;
							} else {
								return !!inputType.type;
							}
						},
					)
				);
			default:
				return stepItems.every((builderStepItem: BuilderStepItem) => {
					return !builderStepItem.value
						? !!builderStepItem.value
						: true;
				});
		}
	};

	const isBuildStepsComplete = () => {
		let completed = true;
		Object.values(builder).forEach((obj) => {
			if (!obj.value) {
				completed = false;
			}
		});
		return completed;
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-12">
				<div className="col-span-3">
					<div className="my-2 h-full rounded-md border bg-card p-4 shadow-sm">
						<PromptBuilderSummary
							builder={builder}
							currentBuilderStep={currentBuilderStep}
							isBuilderStepComplete={isBuilderStepComplete}
							isBuildStepsComplete={isBuildStepsComplete}
							changeBuilderStep={changeBuilderStep}
						/>
					</div>
				</div>
				<div className="col-span-9">
					<PromptBuilderStep
						builder={builder}
						currentBuilderStep={currentBuilderStep}
						setBuilderValue={setBuilderValue}
					/>
				</div>
			</div>
			<div className="mr-2 mt-8 flex justify-end gap-2">
				{currentBuilderStep !== PROMPT_BUILDER_CONTEXT_STEP && (
					<Button
						variant="ghost"
						onClick={backButtonAction}
						style={{ color: "#16a34a" }}
					>
						Back
					</Button>
				)}
				<Button
					disabled={!isBuilderStepComplete(currentBuilderStep)}
					variant="default"
					onClick={nextButtonAction}
					style={{ backgroundColor: "#16a34a" }}
				>
					{nextButtonText}
				</Button>
			</div>
		</div>
	);
};
