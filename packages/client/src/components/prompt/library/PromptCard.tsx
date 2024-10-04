import { useState } from 'react';
import {
    styled,
    Card,
    Chip,
    Grid,
    IconButton,
    Stack,
    Typography,
    LinearProgress,
} from '@semoss/ui';
import {
    Bookmark,
    BookmarkBorderOutlined,
    LocalOfferOutlined,
} from '@mui/icons-material';
import { PromptPreview } from '../shared';
import { Token } from '../prompt.types';

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

export const PromptCard = (props: {
    cardKey: string;
    title: string;
    tags: string[];
    tokens: Token[];
    inputTypes: object;
    context: string;
    openUIBuilderForTemplate: () => void;
}) => {
    // todo: hook this up to a real bookmark system
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const chooseTemplate = () => {
        setIsLoading(true);
        props.openUIBuilderForTemplate();
    };

    return (
        <StyledCard onClick={isLoading ? null : chooseTemplate}>
            <Card.Header
                title={
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems={'center'}
                    >
                        {/* <Typography variant="subtitle2">
                            {props.title}
                        </Typography> */}
                        <StyledTitle variant="h6">{props.title}</StyledTitle>
                        <IconButton
                            onClick={(event) => {
                                event.stopPropagation();
                                setIsBookmarked(!isBookmarked);
                            }}
                        >
                            {isBookmarked ? (
                                <Bookmark />
                            ) : (
                                <BookmarkBorderOutlined />
                            )}
                        </IconButton>
                    </Stack>
                }
            />
            <Card.Content>
                <Grid container spacing={2}>
                    {/* <PromptPreview
                        tokens={props.tokens}
                        inputTypes={props.inputTypes}
                    /> */}
                    {/* <Grid item xs={12}>
                        <StyledTitle variant="h6">
                            {props.title}
                        </StyledTitle>
                    </Grid> */}
                    <Grid item xs={12}>
                        <StyledContext variant="body1" color="secondary">
                            {props.context}
                        </StyledContext>
                    </Grid>
                </Grid>
            </Card.Content>
            <Spacer />
            <StyledCardActions>
                <Stack width="100%">
                    <Grid container spacing={1}>
                        {Array.from(props.tags.sort(), (tag, i) => (
                            <Grid item key={`${props.cardKey}-tag-${i}`}>
                                <StyledChip
                                    icon={
                                        <LocalOfferOutlined fontSize="small" />
                                    }
                                    label={tag}
                                />
                            </Grid>
                        ))}
                    </Grid>
                    {isLoading ? (
                        <LinearProgress
                            color="primary"
                            variant="indeterminate"
                        />
                    ) : (
                        <StyledSpacer />
                    )}
                </Stack>
            </StyledCardActions>
        </StyledCard>
    );
};
