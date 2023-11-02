import { TOKEN_TYPE_TEXT } from './prompt.constants';
import { Builder, Token } from './prompt.types';
import { StyledStepPaper, StyledTextPaper } from './prompt.styled';
import { Box, Typography } from '@mui/material';
import { PromptGeneratorHoverToken } from './PromptGeneratorToken';

export function PromptGeneratorBuilderPreviewStep(props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: Token[]) => void;
}) {
    const getTokenInputType = (token: Token) => {
        if (token.type === TOKEN_TYPE_TEXT || token.isHiddenPhraseInputToken) {
            return null;
        } else {
            return props.builder.inputTypes.value[token.index];
        }
    };
    const getBuilderTokens = (builder: Builder) => {
        return Array.isArray(builder.inputs.value) ? builder.inputs.value : [];
    };

    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">Preview Prompt</Typography>
                <Typography>
                    Preview your prompt before exporting to an app.
                </Typography>
            </Box>
            <StyledTextPaper elevation={0}>
                {Array.from(getBuilderTokens(props.builder), (token: Token) => (
                    <PromptGeneratorHoverToken
                        key={token.index}
                        token={token}
                        tokenInputType={getTokenInputType(token)}
                    />
                ))}
            </StyledTextPaper>
        </StyledStepPaper>
    );
}
