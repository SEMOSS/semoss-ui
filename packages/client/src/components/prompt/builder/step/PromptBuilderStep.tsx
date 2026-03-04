import { Paper, styled } from "@semoss/ui";
import {
	PROMPT_BUILDER_CONSTRAINTS_STEP,
	PROMPT_BUILDER_CONTEXT_STEP,
	PROMPT_BUILDER_INPUT_TYPES_STEP,
	PROMPT_BUILDER_INPUTS_STEP,
	PROMPT_BUILDER_PREVIEW_STEP,
} from "../../prompt.constants";
import type { Builder, ConstraintSettings, Token } from "../../prompt.types";
import { PromptBuilderConstraintsStep } from "./PromptBuilderConstraintsStep";
import { PromptBuilderContextStep } from "./PromptBuilderContextStep";
import { PromptBuilderInputStep } from "./PromptBuilderInputStep";
import { PromptBuilderInputTypeStep } from "./PromptBuilderInputTypeStep";
import { PromptBuilderPreviewStep } from "./PromptBuilderPreviewStep";

const StyledPaper = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(4),
	margin: theme.spacing(1),
}));

export const PromptBuilderStep = (props: {
	builder: Builder;
	currentBuilderStep: number;
	setBuilderValue: (
		builderStepKey: string,
		value:
            | string
            | Token[]
            | ConstraintSettings
            | object
            | boolean
            | undefined,
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
			return <StyledPaper elevation={2} square />;
	}
};
