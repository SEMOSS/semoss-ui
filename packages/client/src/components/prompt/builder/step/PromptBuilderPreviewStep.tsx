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
		<StyledStepPaper>
			<div>
				<h6 className="font-semibold text-lg">Preview Prompt</h6>
				<p className="text-base">
					Preview your prompt before exporting to an app.
				</p>
			</div>
			<StyledTextPaper>
				<PromptPreview
					tokens={getBuilderTokens(props.builder)}
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
