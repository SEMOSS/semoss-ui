import { useState } from 'react';
import {
    styled,
    Card,
    Chip,
    Grid,
    IconButton,
    Stack,
    Typography,
} from '@semoss/ui';
import {
    Bookmark,
    BookmarkBorderOutlined,
    LocalOfferOutlined,
} from '@mui/icons-material';

const StyledCard = styled(Card)(() => ({
    height: '100%',
    cursor: 'pointer',
}));
const StyledChip = styled(Chip)(({ theme }) => ({
    textTransform: 'capitalize',
    paddingLeft: theme.spacing(1),
}));
const Spacer = styled('div')(() => ({
    flex: 1,
}));

export function PromptCard(props: {
    cardKey: string;
    title: string;
    tags: string[];
    context: string;
    openUIBuilderForTemplate: () => void;
}) {
    // todo: hook this up to a real bookmark system
    const [isBookmarked, setIsBookmarked] = useState(false);

    return (
        <StyledCard onClick={props.openUIBuilderForTemplate}>
            <Card.Header
                title={
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2">
                            {props.title}
                        </Typography>
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
            <Card.Content>{props.context}</Card.Content>
            <Spacer />
            <Card.Actions>
                <Grid container spacing={1}>
                    {Array.from(props.tags.sort(), (tag, i) => (
                        <Grid item key={`${props.cardKey}-tag-${i}`}>
                            <StyledChip
                                icon={<LocalOfferOutlined fontSize="small" />}
                                label={tag}
                                variant="outlined"
                            />
                        </Grid>
                    ))}
                </Grid>
            </Card.Actions>
        </StyledCard>
    );
}
