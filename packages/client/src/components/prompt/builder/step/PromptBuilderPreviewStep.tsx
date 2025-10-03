import { Box, Typography } from "@semoss/ui";
import { StyledStepPaper, StyledTextPaper } from "../../prompt.styled";
import type { Builder, Token } from "../../prompt.types";
import { PromptPreview } from "../../shared";

export const PromptBuilderPreviewStep = (props: {
	builder: Builder;
	setBuilderValue: (builderStepKey: string, value: Token[]) => void;
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
				{/* Show the actual prompt from builder.context.value */}
				<div style={{whiteSpace: 'pre-wrap', fontSize: '1.2rem', padding: '16px', background: '#fff', borderRadius: '16px', minHeight: '120px'}}>
					{typeof props.builder.context.value === 'string' ? props.builder.context.value : ''}
				</div>
			</StyledTextPaper>
		</StyledStepPaper>
	);
};
