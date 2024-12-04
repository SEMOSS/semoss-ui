import { styled, Grid, Typography } from '@semoss/ui';
import { PromptCard } from './PromptCard';
import { Token, Prompt } from '../prompt.types';

const StyledTypography = styled(Typography)(() => ({
    textTransform: 'capitalize',
}));

interface PromptLibraryCardsProps {
    /**
     * List of prompts to display
     */
    prompts: Prompt[];

    /**
     *
     */
    filter: string;

    /**
     * TODO: Get rid of this and use onClick
     */
    openUIBuilderForTemplate?: (
        title: string,
        tags: string[],
        inputs: Token[],
        inputTypes: object,
    ) => void;

    /**
     * TODO: Get rid of above and have onClick replace the functionality we had in Agent Builder
     *
     * TODO: The issue is the way this component is set up we specify Input Types.
     * And the reason for that is because we wanted to construct the app for them just off this click
     * MODIFICATIONS: When they click prompt we take them to step 2, to identify additional holes in the prompt, or simply stick with what we have
     */
    onClick: (prompt: Prompt) => void;
}

export const PromptLibraryCards = (props: PromptLibraryCardsProps) => {
    const { prompts, filter, onClick } = props;

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <StyledTypography variant="h6">
                    {`${filter} (${prompts.length})`}
                </StyledTypography>
            </Grid>
            {Array.from(prompts, (prompt, i) => {
                return (
                    <Grid item xs={4} key={i}>
                        <PromptCard
                            prompt={prompt}
                            onClick={(p) => {
                                onClick(p);
                            }}
                        />
                        {/* <PromptCardOld
                            cardKey={`${i}`}
                            title={prompt.title}
                            tags={prompt.tags}
                            tokens={prompt.inputs}
                            inputTypes={prompt.inputTypes}
                            openUIBuilderForTemplate={() => {
                                props.openUIBuilderForTemplate(
                                    prompt.title,
                                    prompt.tags,
                                    prompt.inputs,
                                    prompt.inputTypes,
                                );
                            }}
                        /> */}
                    </Grid>
                );
            })}
        </Grid>
    );
};
