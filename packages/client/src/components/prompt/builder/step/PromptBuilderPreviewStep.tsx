import { Box, Typography } from "@semoss/ui";
import { StyledStepPaper, StyledTextPaper } from "../../prompt.styled";
import type { Builder, Token } from "../../prompt.types";
import { PromptPreview } from "../../shared";

export const PromptBuilderPreviewStep = (props: {
	builder: Builder;
	setBuilderValue: (builderStepKey: string, value: Token[]) => void;
    isLLMVersionSelected: boolean;
    LLMTokens: Token[];
}) => {
	const getBuilderTokens = (builder: Builder) => {
		return Array.isArray(builder.inputs.value) ? builder.inputs.value : [];
	};

	return (
		<StyledStepPaper elevation={2} square>
			<Box>
				<Typography variant="h6">Preview Prompt</Typography>
				<Typography variant="body1">
					Preview your prompt before exporting to an app.
				</Typography>
			</Box>
			<StyledTextPaper>
				<PromptPreview
					tokens={
                        props.isLLMVersionSelected
                            ? props.LLMTokens
                            : getBuilderTokens(props.builder)
                    }
					inputTypes={
						props.builder.inputTypes.value
							? (props.builder.inputTypes.value as object)
							: {}
					}
				/>
			</StyledTextPaper>
		</StyledStepPaper>
	);
};
