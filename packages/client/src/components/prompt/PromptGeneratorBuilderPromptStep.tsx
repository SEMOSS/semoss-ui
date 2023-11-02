import { Builder } from './prompt.types';
import { StyledStepPaper } from './prompt.styled';
import { styled, Box, TextField, Typography } from '@mui/material';

const StyledBox = styled(Box)(({ theme }) => ({
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
}));

export function PromptGeneratorBuilderPromptStep(props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: string) => void;
}) {
    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">Create Prompt</Typography>
                <Typography>
                    Construct your prompt by providing the context and inputs.
                    The context provides supplementary information so the model
                    can better understand the ask and generate a more tailored
                    response. For example, &#8220;Suppose you are a policy
                    expert with 30 years of experience.&#8221;
                </Typography>
            </Box>
            <StyledBox>
                <TextField
                    fullWidth
                    inputProps={{ sx: { height: '100%' } }}
                    placeholder="Context"
                    multiline
                    rows={10}
                    value={props.builder.context.value}
                    onChange={(e) =>
                        props.setBuilderValue('context', e.target.value)
                    }
                />
            </StyledBox>
        </StyledStepPaper>
    );
}
