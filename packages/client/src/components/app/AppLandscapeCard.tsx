import { useMemo } from 'react';
import dayjs from 'dayjs';
import {
    Button,
    Card,
    Chip,
    Typography,
    styled,
    IconButton,
    Link,
    Box,
    useNotification,
    Popover,
} from '@semoss/ui';
import { BookmarkBorderOutlined, MoreVert } from '@mui/icons-material';
import { AppMetadata } from './app.types';
import { Env } from '@/env';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useRootStore } from '@/hooks';

const StyledCard = styled(Card)({
    display: 'flex',
    padding: '16px 8px 16px 16px',
    width: '100%',
    // height: '176px',
    borderRadius: '12px',
    flexDirection: 'row',
    '&:hover': {
        cursor: 'pointer',
    },
});

const StyledCardMedia = styled(Card.Media)({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',

    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    height: '48px',
    width: '48px',
    borderRadius: '8px',
});

const StyledContentContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
});

const StyledImageContainer = styled('div')({
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexGrow: 1,
});

const StyledCardImage = styled('img')({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',

    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    height: '48px',
    width: '48px',
    borderRadius: '8px',
    aspectRatio: '1/1',
});

const StyledChipDiv = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    width: '80px',
    alignItems: 'center',
    gap: 2,
    flexGrow: 1,
});

const StyledChipBox = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexGrow: 1,
});

const StyledChipMore = styled(Typography)({
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: '12px',
    lineHeight: '19.92px',
    letter: '0.4px',
    paddingLeft: '4px',
});

const StyledPublishedDate = styled(Typography)({
    fontSize: '12px',
    color: 'rgba(0, 0, 0, 0.6)',
});

const StyledProjectName = styled(Typography)({
    fontSize: '12px',
    color: 'rgba(0, 0, 0, 0.87)',
    lineHeight: '24px',
    letter: '0.15px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
    overflow: 'hidden',
    maxWidth: '240px',
});

const StyledIconRow = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: '16px',
});

const StyledChip = styled(Chip)({
    color: 'rgba(0, 0, 0, 0.23)',
    maxWidth: '59px',
    textOverflow: 'ellipsis',
});

const StyledBookmark = styled(BookmarkBorderOutlined)({
    color: 'rgba(0, 0, 0, 0.54)',
    fontSize: '18px',
});

const StyledVert = styled(MoreVert)({
    color: 'rgba(0, 0, 0, 0.54)',
    fontSize: '18px',
});

const StyledPopoverItem = styled(Typography)({
    padding: '12px',
    '&:hover': {
        cursor: 'pointer',
    },
});

interface AppTileCardProps {
    /**
     * App
     */
    app: AppMetadata;

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

export const AppLandscapeCard = (props: AppTileCardProps) => {
    const { app, image, onAction = () => null, href } = props;
    const navigate = useNavigate();
    const notification = useNotification();
    const { monolithStore } = useRootStore();

    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
        null,
    );

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    // pretty format the data
    const createdDate = useMemo(() => {
        const d = dayjs(app.project_date_created);
        if (!d.isValid()) {
            return '';
        }

        return `Created on ${d.format('MMMM D, YYYY')}`;
    }, [app.project_date_created]);

    /**
     * Copy the content to the clipboard
     * @param content - content that will be copied
     */
    const copy = (content: string) => {
        navigator.clipboard
            .writeText(content)
            .then(() => {
                notification.add({
                    color: 'success',
                    message: 'Succesfully copied to clipboard',
                });
            })
            .catch((e) => {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            });
    };

    /**
     * @name favoriteDb
     * @param db
     */
    const favoriteProject = (project) => {
        monolithStore
            .setProjectFavorite(project.project_id, true)
            .then(() => {
                return;
            })
            .catch((err) => {
                // throw error if promise doesn't fulfill
                throw Error(err);
            });
    };

    return (
        <StyledCard>
            <StyledContentContainer>
                <StyledImageContainer>
                    {image ? (
                        <StyledCardMedia image={image} />
                    ) : (
                        <StyledCardImage
                            src={`${Env.MODULE}/api/project-${app.project_id}/projectImage/download`}
                        />
                    )}
                    <StyledProjectName variant="body1">
                        {formatName(app.project_name)}
                    </StyledProjectName>
                </StyledImageContainer>
                <StyledChipDiv>
                    {app.tag !== undefined &&
                        (typeof app.tag === 'object' ? (
                            <StyledChipBox>
                                {app.tag.slice(0, 2).map((t, i) => {
                                    return (
                                        <StyledChip
                                            size="small"
                                            key={app.project_id + i}
                                            variant={'outlined'}
                                            label={t}
                                        />
                                    );
                                })}
                                {app.tag.length > 2 && (
                                    <StyledChipMore variant="body2">
                                        {`+${app.tag.length - 2}`}
                                    </StyledChipMore>
                                )}
                            </StyledChipBox>
                        ) : (
                            <StyledChip
                                size="small"
                                key={app.project_id + app.tag}
                                variant={'outlined'}
                                label={app.tag}
                            />
                        ))}
                </StyledChipDiv>
                <Box>
                    <StyledPublishedDate variant={'body2'}>
                        {createdDate.replace('Created on ', '')}
                    </StyledPublishedDate>
                </Box>
                <StyledIconRow>
                    {/* <Button>Use as Template</Button> */}
                    <Box>
                        <Link
                            href={href}
                            rel="noopener noreferrer"
                            color="inherit"
                            underline="none"
                        >
                            <Button>Open</Button>
                        </Link>
                    </Box>
                    <IconButton onClick={() => favoriteProject(app)}>
                        <StyledBookmark />
                    </IconButton>
                    <Box>
                        <IconButton onClick={handleClick}>
                            <StyledVert />
                        </IconButton>
                        <Popover
                            id={id}
                            open={open}
                            anchorEl={anchorEl}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                        >
                            <Box onClick={() => copy(app.project_id)}>
                                <StyledPopoverItem variant="body2">
                                    Copy App ID
                                </StyledPopoverItem>
                            </Box>
                            <StyledPopoverItem variant="body2">
                                App Details
                            </StyledPopoverItem>
                            <StyledPopoverItem variant="body2">
                                Enter App Details
                            </StyledPopoverItem>
                            <StyledPopoverItem variant="body2">
                                Go to GitHub
                            </StyledPopoverItem>
                        </Popover>
                    </Box>
                </StyledIconRow>
            </StyledContentContainer>
        </StyledCard>
    );
};
