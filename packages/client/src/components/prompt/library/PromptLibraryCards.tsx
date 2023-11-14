import { styled, Grid, Typography } from '@semoss/ui';
import { PromptCard } from './PromptCard';
import { Prompt } from './examples';
import { Token } from '../prompt.types';

const StyledTypography = styled(Typography)(() => ({
    textTransform: 'capitalize',
}));

export function PromptLibraryCards(props: {
    prompts: Prompt[];
    filter: string;
    openUIBuilderForTemplate: (
        title: string,
        context: string,
        inputs: Token[],
        inputTypes: object,
    ) => void;
}) {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <StyledTypography variant="h6">
                    {`${props.filter} (${props.prompts.length})`}
                </StyledTypography>
            </Grid>
            {Array.from(props.prompts, (prompt, i) => {
                return (
                    <Grid item xs={4} key={i}>
                        <PromptCard
                            cardKey={`${i}`}
                            title={prompt.title}
                            tags={prompt.tags}
                            context={prompt.context}
                            openUIBuilderForTemplate={() => {
                                props.openUIBuilderForTemplate(
                                    prompt.title,
                                    prompt.context,
                                    prompt.inputs,
                                    prompt.inputTypes,
                                );
                            }}
                        />
                    </Grid>
                );
            })}
        </Grid>
    );
}
