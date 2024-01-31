import { useMemo } from 'react';
import dayjs from 'dayjs';
import {
    Button,
    Card,
    Chip,
    Typography,
    styled,
    Stack,
    Avatar,
    IconButton,
    Link,
} from '@semoss/ui';
import {
    AccessTime,
    BookmarkBorderOutlined,
    MoreVert,
    OpenInNewOutlined,
    Person,
} from '@mui/icons-material';
import { AppMetadata } from './app.types';
import { Env } from '@/env';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(() => ({
    borderRadius: '12px',
}));

const StyledContent = styled(Card.Content)(({ theme }) => ({
    // ...theme.typography.body1,
    // color: theme.palette.text.primary,
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    paddingLeft: theme.spacing(1.5),
}));

const StyledActions = styled(Card.Actions)(({ theme }) => ({
    alignItems: 'end',
    paddingTop: theme.spacing(2),
    paddingRight: theme.spacing(1.5),
    paddingLeft: theme.spacing(1.5),
}));

const StyledBackdrop = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    borderRadius: '12px',
}));

const StyledChip = styled(Chip)(({ theme }) => ({
    background: theme.palette.background.paper,
}));

const StyledName = styled(Typography)(() => ({
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}));

const StyledDescription = styled(Typography)(() => ({
    height: '40px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
}));

const StyledActionButton = styled(IconButton)(({ theme }) => ({
    background: theme.palette.text.primary,
    color: theme.palette.primary.contrastText,
    '&:hover': {
        background: theme.palette.text.secondary,
    },
}));

// --- NEW STYLES ------------------------------
const StyledTileCard = styled(Card)({
    width: '280px',
    height: '412px',
    '&:hover': {
        cursor: 'pointer',
    },
});

const StyledContainer = styled('div')({
    position: 'relative',
});

const StyledOverlayContent = styled('div')(({ theme }) => ({
    width: '100%',
    height: '134px',
    position: 'absolute',
    top: '0',
    right: '0',
    display: 'flex',
    paddingTop: theme.spacing(1),
    paddingRight: theme.spacing(1),
    justifyContent: 'flex-end',
    //   alignItems: 'center',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    background: theme.palette.background.paper,
    height: '32px',
    width: '32px',
    color: theme.palette.text.secondary,
}));

const StyledTileCardMedia = styled(Card.Media)({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',

    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    width: '100%',
    height: '134px',
});

const StyledTileCardImage = styled('img')({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',

    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    width: '100%',
    height: '134px',
    // aspectRatio: '1/1'
});

const StyledPublishedByContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
});

const StyledPublishedByLabel = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyledPersonIcon = styled(Person)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledAccessTimeIcon = styled(AccessTime)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const StyledCardDescription = styled(Typography)({
    display: 'block',
    minHeight: '60px',
    maxHeight: '60px',
    maxWidth: '350px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

const StyledChipDiv = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    minHeight: '32px',
    width: '80px',
    alignItems: 'center',
    gap: 2,
});

const StyledCardActions = styled(Card.Actions)({
    display: 'flex',
    padding: '0px 8px 0px 8px',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4px',
    alignSelf: 'stretch',
});

interface AppTileCardProps {
    /**
     * App
     */
    app: AppMetadata;

    /**
     * Background
     */
    background?: string;

    /**
     *
     */
    image?: string;

    /**
     * Action that is triggered when clicked
     * aop - current selected app
     */
    onAction?: (app: AppMetadata) => void;

    /**
     * Link to navigate to
     */
    href: string;
}

/**
 * @name formatName
 * @param str
 * @returns format string
 */
const formatName = (str: string) => {
    let i;
    const frags = str.split('_');
    for (i = 0; i < frags.length; i++) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
};

export const AppTileCard = (props: AppTileCardProps) => {
    const {
        app,
        image,
        background = '#DAC9F5',
        onAction = () => null,
        href,
    } = props;

    // pretty format the data
    const createdDate = useMemo(() => {
        const d = dayjs(app.project_portal_published_date);
        console.log(app);
        if (!d.isValid()) {
            return `Published ${dayjs().format('MMMM D, YYYY')}`;
        }

        return `Published ${d.format('MMMM D, YYYY')}`;
    }, [app.project_date_created]);

    return (
        <StyledTileCard>
            <Link
                href={href}
                rel="noopener noreferrer"
                color="inherit"
                underline="none"
            >
                <StyledContainer>
                    {image ? (
                        <StyledTileCardMedia
                            image={image}
                            sx={{
                                height: '140px',
                            }}
                        />
                    ) : (
                        <StyledTileCardImage
                            src={`${Env.MODULE}/api/project-${app.project_id}/projectImage/download`}
                        />
                    )}
                    <StyledOverlayContent>
                        {/* <StyledAvatar variant={'circular'}>
                                <BookmarkBorderOutlined />
                            </StyledAvatar> */}
                    </StyledOverlayContent>
                </StyledContainer>
                <Card.Header
                    title={
                        <StyledName variant={'body1'}>
                            {formatName(app.project_name)}
                        </StyledName>
                    }
                    subheader={
                        <StyledPublishedByContainer>
                            <StyledPersonIcon />
                            <StyledPublishedByLabel variant={'body2'}>
                                Published by:{' '}
                                {app.project_created_by || <>N/A</>}
                            </StyledPublishedByLabel>
                        </StyledPublishedByContainer>
                    }
                />
                <Card.Content>
                    <StyledCardDescription variant={'body2'}>
                        {app.description
                            ? app.description
                            : 'No description available'}
                    </StyledCardDescription>
                    <StyledChipDiv>
                        {app.tag !== undefined &&
                            (typeof app.tag === 'object' ? (
                                app.tag.map((t, i) => {
                                    return (
                                        <Chip
                                            key={app.project_id + i}
                                            variant={'outlined'}
                                            label={t}
                                        />
                                    );
                                })
                            ) : (
                                <Chip
                                    key={app.project_id + app.tag}
                                    variant={'outlined'}
                                    label={app.tag}
                                />
                            ))}
                    </StyledChipDiv>
                    <StyledPublishedByContainer>
                        <StyledAccessTimeIcon />
                        <StyledPublishedByLabel variant={'body2'}>
                            {createdDate}
                        </StyledPublishedByLabel>
                    </StyledPublishedByContainer>
                </Card.Content>
                <StyledCardActions>
                    <Button>Open</Button>
                    <IconButton disabled={true}>
                        <MoreVert />
                    </IconButton>
                </StyledCardActions>
            </Link>
        </StyledTileCard>
    );
};
