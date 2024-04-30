import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
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
import {
    AccessTime,
    MoreVert,
    Bookmark,
    BookmarkBorder,
    OpenInNewOutlined,
    DashboardRounded,
    CodeRounded,
    BarChartRounded,
} from '@mui/icons-material';
import { AppMetadata } from './app.types';
import { APP_IMAGES } from './app.images';

const StyledName = styled(Typography)(() => ({
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}));

const StyledTileCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled: boolean }>(({ disabled, theme }) => ({
    width: '280px',
    height: '412px',
    '&:hover': {
        cursor: disabled ? 'default' : 'pointer',
    },
    borderRadius: theme.shape.borderRadius,
}));

const StyledContainer = styled('div')({
    position: 'relative',
});

const StyledOverlayContent = styled('div')(() => ({
    // width: '100%',
    // height: '134px',
    position: 'absolute',
    top: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '16px',
    paddingRight: '16px',
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

const StyledPublishedByContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
    color: theme.palette.text.secondary,
}));

const StyledPublishedByLabel = styled(Typography)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1 0 0',
    fontSize: '12px',
    color: theme.palette.text.secondary,
}));

const StyledAccessTimeIcon = styled(AccessTime)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const StyledCardDescription = styled(Typography)(({ theme }) => ({
    display: 'block',
    minHeight: '40px',
    maxHeight: '40px',
    maxWidth: '350px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: theme.palette.text.secondary,
}));

const StyledCardHeader = styled(Card.Header)(({ theme }) => ({
    '.MuiCardHeader-content': {
        gap: theme.spacing(2),
    },
}));

const StyledTagChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'maxWidth',
})<{ maxWidth?: string }>(({ theme, maxWidth = '200px' }) => ({
    maxWidth: maxWidth,
    textOverflow: 'ellipsis',
}));

const StyledCardActions = styled(Card.Actions)({
    display: 'flex',
    padding: '0px 8px 0px 11px',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
});

const StyledIconButton = styled(IconButton)({
    backgroundColor: '#FFFFFF',
    height: '28px',
    width: '28px',
    radius: '24px',
    '&:hover': {
        backgroundColor: '#FFFFFF',
        $icon: {
            color: 'red',
        },
    },
});

const StyledOpenButton = styled(IconButton)(({ theme }) => ({
    fontSize: '15px',
    color: theme.palette.primary.main,
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontWeight: '600',
    '&:hover': {
        backgroundColor: '#FFFFFF',
    },
}));

const StyledPlaceholder = styled('div')(({ theme }) => ({
    height: '20px',
}));

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
     * Action that is triggered when clicked
     * aop - current selected app
     */
    onAction?: () => void;

    /**
     * Link to navigate to
     */
    href?: string;

    /**
     * is app favorited
     */
    isFavorite?: boolean;

    /**
     * toggle favorite bookmark
     */
    favorite?: (value: boolean) => void;

    /**
     * type of app to match image
     */
    appType?: string;

    /**
     * is the app a default system app
     */
    systemApp?: boolean;
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
        background = '#DAC9F5',
        onAction = () => null,
        href = null,
        isFavorite,
        favorite,
        appType,
        systemApp,
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
        const d = dayjs(app.project_date_created);
        if (!d.isValid()) {
            return `Published ${dayjs().format('MMMM D, YYYY')}`;
        }

        return `Published ${d.format('MMMM D, YYYY')}`;
    }, [app.project_date_created]);

    /**
     * @name findAppImage
     * @params appType
     * @returns image
     */
    const findAppImage = (appType: string) => {
        const image = APP_IMAGES[appType];
        return image?.image;
    };

    /**
     * @name findAppDetails
     * @params appType
     * @returns set app type description
     */
    const findAppDetails = (appType: string) => {
        if (appType == 'BLOCKS') {
            return (
                <StyledPublishedByContainer>
                    <DashboardRounded />
                    <StyledPublishedByLabel variant="body2">
                        Drag & Drop App
                    </StyledPublishedByLabel>
                </StyledPublishedByContainer>
            );
        } else if (appType == 'CODE') {
            return (
                <StyledPublishedByContainer>
                    <CodeRounded />
                    <StyledPublishedByLabel variant="body2">
                        Code App
                    </StyledPublishedByLabel>
                </StyledPublishedByContainer>
            );
        } else if (appType == 'INSIGHT') {
            return (
                <StyledPublishedByContainer>
                    <BarChartRounded />
                    <StyledPublishedByLabel variant="body2">
                        Insight App
                    </StyledPublishedByLabel>
                </StyledPublishedByContainer>
            );
        } else {
            return;
        }
    };

    const image = findAppImage(appType);
    const appDetails = findAppDetails(appType);

    return (
        <StyledTileCard disabled={!href}>
            {!systemApp && (
                <StyledContainer>
                    <StyledOverlayContent>
                        <StyledIconButton
                            size={'small'}
                            title={
                                isFavorite
                                    ? `Unbookmark ${
                                          app.project_name
                                              ? app.project_name
                                              : ''
                                      }`
                                    : `Bookmark ${
                                          app.project_name
                                              ? app.project_name
                                              : ''
                                      }`
                            }
                            onClick={(e) => {
                                e.stopPropagation();

                                favorite(isFavorite);
                            }}
                        >
                            {isFavorite ? (
                                <Bookmark color="primary" />
                            ) : (
                                <BookmarkBorder />
                            )}{' '}
                        </StyledIconButton>
                    </StyledOverlayContent>
                </StyledContainer>
            )}
            <Link
                href={href}
                rel="noopener noreferrer"
                color="inherit"
                underline="none"
            >
                <StyledTileCardMedia src="img" image={image ? image : ''} />
                <StyledCardHeader
                    title={
                        <StyledName variant={'body1'}>
                            {formatName(app.project_name)}
                        </StyledName>
                    }
                    subheader={appDetails && appDetails}
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
                    {systemApp && !appDetails && <StyledPlaceholder />}
                </Card.Content>
                <StyledCardActions>
                    {!href ? (
                        <StyledOpenButton onClick={onAction}>
                            <p>Open</p>
                            <OpenInNewOutlined fontSize="small" />
                        </StyledOpenButton>
                    ) : (
                        <Link
                            href={href}
                            rel="noopener noreferrer"
                            color="inherit"
                            underline="none"
                            target="_blank"
                        >
                            <StyledOpenButton>
                                <p>Open</p>
                                <OpenInNewOutlined fontSize="small" />
                            </StyledOpenButton>
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
                {app?.user_permission && app.user_permission <= 2 && (
                    <Link
                        href={`${href}/detail`}
                        rel="noopener noreferrer"
                        color="inherit"
                        underline="none"
                        target="_blank"
                    >
                        <Menu.Item value="copy" onClick={() => {}}>
                            Edit App Details
                        </Menu.Item>
                    </Link>
                )}
            </Menu>
        </StyledTileCard>
    );
};
