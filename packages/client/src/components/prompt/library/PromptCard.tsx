import { useState } from 'react';
import {
    styled,
    Card,
    Chip,
    Grid,
    Stack,
    Typography,
    LinearProgress,
} from '@semoss/ui';
import { Prompt } from '../prompt.types';
import { LocalOfferOutlined } from '@mui/icons-material';

const StyledCard = styled(Card)(() => ({
    height: '100%',
    cursor: 'pointer',
}));

const StyledCardActions = styled(Card.Actions)(() => ({
    padding: 0,
    margin: 0,
}));

const StyledSpacer = styled('div')(({ theme }) => ({
    minHeight: theme.spacing(0.5),
    flex: 1,
}));

const StyledChip = styled(Chip)(({ theme }) => ({
    textTransform: 'capitalize',
    paddingLeft: theme.spacing(1),
}));

const Spacer = styled('div')(() => ({
    flex: 1,
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
    overflow: 'hidden',
    color: 'var(--Text-Secondary, #666)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '150%',
    letterSpacing: '0.15px',
}));

const StyledContext = styled(Typography)(({ theme }) => ({
    overflow: 'hidden',
    color: 'var(--Text-Secondary, #666)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'Inter',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '143%',
    letterSpacing: '0.17px',
}));

interface PromptCardProps {
    /**
     * Used to display values on card
     */
    prompt: Prompt;

    /**
     * Callback for actions done on card
     * @param p
     * @returns
     */
    onClick: (p: Prompt) => void;
}

export const PromptCard = (props: PromptCardProps) => {
    const { prompt, onClick } = props;

    return (
        <StyledCard onClick={() => onClick(prompt)}>
            <Card.Header
                title={
                    <Stack direction="row" justifyContent="space-between">
                        <StyledTitle variant="h6">{prompt.title}</StyledTitle>
                    </Stack>
                }
            />
            <Card.Content>
                <Grid container>
                    <Grid item xs={12}>
                        <StyledContext variant="body1" color="secondary">
                            {prompt.context}
                        </StyledContext>
                    </Grid>
                </Grid>
            </Card.Content>
            <Spacer />
            <StyledCardActions>
                <Stack width="100%">
                    <Grid container spacing={1}>
                        {Array.from(prompt.tags.sort(), (tag, i) => (
                            <Grid item key={`${prompt.id}-tag-${i}`}>
                                <StyledChip
                                    icon={
                                        <LocalOfferOutlined fontSize="small" />
                                    }
                                    label={tag}
                                />
                            </Grid>
                        ))}
                    </Grid>
                    <StyledSpacer />
                </Stack>
            </StyledCardActions>
        </StyledCard>
    );
};
