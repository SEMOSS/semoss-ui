import { Builder, Token } from '../../prompt.types';
import { StyledStepPaper, StyledTextPaper } from '../../prompt.styled';
import { Box, Typography } from '@semoss/ui';
import { getBuilderJsonState } from '../../prompt.helpers';
import { BlocksRenderer } from '@/components/blocks-workspace';

export const PromptBuilderPreviewStep = (props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: Token[]) => void;
}) => {
    const builderJsonState = getBuilderJsonState(props.builder);

    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">Preview</Typography>
                <Typography variant="body1">
                    Preview your prompt app before exporting.
                </Typography>
            </Box>
            <StyledTextPaper>
                <BlocksRenderer state={builderJsonState} />
            </StyledTextPaper>
        </StyledStepPaper>
    );
};
