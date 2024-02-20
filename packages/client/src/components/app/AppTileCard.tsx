import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
    Button,
    Card,
    Chip,
    Typography,
    styled,
    IconButton,
    Link,
    Stack,
    Menu,
    useNotification,
} from '@semoss/ui';
import { AccessTime, MoreVert, Person } from '@mui/icons-material';
import { AppMetadata } from './app.types';
import { Env } from '@/env';

const StyledName = styled(Typography)(() => ({
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}));

const StyledTileCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled: boolean }>(({ disabled }) => ({
    width: '280px',
    height: '412px',
    '&:hover': {
        cursor: disabled ? 'default' : 'pointer',
    },
}));

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

const StyledTagChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'maxWidth',
})<{ maxWidth?: string }>(({ theme, maxWidth = '200px' }) => ({
    maxWidth: maxWidth,
    textOverflow: 'ellipsis',
    backgroundColor: theme.palette.grey[200],
}));

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
    onAction?: () => void;

    /**
     * Link to navigate to
     */
    href?: string;
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
        href = null,
    } = props;

    const notification = useNotification();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const copyProjectId = (projectId: string) => {
        try {
            navigator.clipboard.writeText(projectId);

            notification.add({
                color: 'success',
                message: 'Succesfully copied to clipboard',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    };

    // pretty format the data
    const createdDate = useMemo(() => {
        const d = dayjs(app.project_portal_published_date);
        if (!d.isValid()) {
            return `Published ${dayjs().format('MMMM D, YYYY')}`;
        }

        return `Published ${d.format('MMMM D, YYYY')}`;
    }, [app.project_date_created]);

    return (
        <StyledTileCard disabled={!href}>
            <Link
                href={href}
                rel="noopener noreferrer"
                color="inherit"
                underline="none"
            >
                <StyledContainer>
                    {image ? (
                        <StyledTileCardMedia image={image} />
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
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        minHeight="32px"
                    >
                        {app.tag !== undefined &&
                            (Array.isArray(app.tag) ? (
                                <>
                                    {app.tag.map((tag, i) => {
                                        if (i <= 2) {
                                            return (
                                                <StyledTagChip
                                                    key={`${app.project_id}${i}`}
                                                    maxWidth={
                                                        app.tag.length === 2
                                                            ? '100px'
                                                            : app.tag.length ===
                                                              1
                                                            ? '200px'
                                                            : '75px'
                                                    }
                                                    label={tag}
                                                />
                                            );
                                        }
                                    })}
                                    {app.tag.length > 3 ? (
                                        <Typography variant="caption">
                                            +{app.tag.length - 3}
                                        </Typography>
                                    ) : (
                                        <></>
                                    )}
                                </>
                            ) : (
                                <StyledTagChip
                                    key={`${app.project_id}0`}
                                    variant="outlined"
                                    label={app.tag}
                                />
                            ))}
                    </Stack>
                    <StyledPublishedByContainer>
                        <StyledAccessTimeIcon />
                        <StyledPublishedByLabel variant={'body2'}>
                            {createdDate}
                        </StyledPublishedByLabel>
                    </StyledPublishedByContainer>
                </Card.Content>
                <StyledCardActions>
                    {!href ? (
                        <Button onClick={onAction}>Open</Button>
                    ) : (
                        <Link
                            href={href}
                            rel="noopener noreferrer"
                            color="inherit"
                            underline="none"
                        >
                            <Button>Open</Button>
                        </Link>
                    )}
                    {app.project_created_by !== 'SYSTEM' ? (
                        <IconButton
                            onClick={(e) => {
                                e.preventDefault();
                                setAnchorEl(e.currentTarget);
                            }}
                        >
                            <MoreVert />
                        </IconButton>
                    ) : (
                        <></>
                    )}
                </StyledCardActions>
            </Link>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => {
                    setAnchorEl(null);
                }}
            >
                <Menu.Item
                    value="copy"
                    onClick={() => {
                        copyProjectId(app.project_id);
                        setAnchorEl(null);
                    }}
                >
                    Copy App ID
                </Menu.Item>
                {/* {
                    app?.user_permission && app.user_permission <= 2 ?
                    (
                        <Menu.Item value="copy" onClick={() => {}}>
                            Edit App Details
                        </Menu.Item>
                    ) :
                    <></>
                } */}
            </Menu>
        </StyledTileCard>
    );
};
