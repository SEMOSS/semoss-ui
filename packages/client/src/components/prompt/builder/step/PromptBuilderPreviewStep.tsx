import { Builder, Token } from '../../prompt.types';
import { StyledStepPaper, StyledTextPaper } from '../../prompt.styled';
import { Box, Typography } from '@semoss/ui';
import { PromptPreview } from '../../shared';

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
                <Typography variant="h5">Preview Prompt</Typography>
                <Typography variant="body1">
                    Preview your prompt before exporting to an app.
                </Typography>
            </Box>
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
