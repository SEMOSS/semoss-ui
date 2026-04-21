import {
	PROMPT_BUILDER_CONSTRAINTS_STEP,
	PROMPT_BUILDER_CONTEXT_STEP,
	PROMPT_BUILDER_INPUT_TYPES_STEP,
	PROMPT_BUILDER_INPUTS_STEP,
	PROMPT_BUILDER_PREVIEW_STEP,
} from "../../prompt.constants";
import type { Builder, ConstraintSettings, Token } from "../../prompt.types";
import { PromptBuilderConstraintsStep } from "./prompt-builder-constraints-step";
import { PromptBuilderContextStep } from "./prompt-builder-context-step";
import { PromptBuilderInputStep } from "./prompt-builder-input-step";
import { PromptBuilderInputTypeStep } from "./prompt-builder-input-type-step";
import { PromptBuilderPreviewStep } from "./prompt-builder-preview-step";

export const PromptBuilderStep = (props: {
	builder: Builder;
	currentBuilderStep: number;
	setBuilderValue: (
		builderStepKey: string,
		value: string | Token[] | ConstraintSettings | object,
	) => void;
}) => {
	switch (props.currentBuilderStep) {
		case PROMPT_BUILDER_CONTEXT_STEP:
			return <PromptBuilderContextStep {...props} />;
		case PROMPT_BUILDER_INPUTS_STEP:
			return <PromptBuilderInputStep {...props} />;
		case PROMPT_BUILDER_INPUT_TYPES_STEP:
			return <PromptBuilderInputTypeStep {...props} />;
		case PROMPT_BUILDER_CONSTRAINTS_STEP:
			return <PromptBuilderConstraintsStep {...props} />;
		case PROMPT_BUILDER_PREVIEW_STEP:
			return <PromptBuilderPreviewStep {...props} />;
		default:
			return <div className="m-1 bg-background p-8 shadow-sm" />;
	}
};
