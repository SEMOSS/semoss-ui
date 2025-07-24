import React from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
    AccessTime,
    MoreVert,
    Bookmark,
    BookmarkBorder,
    OpenInNewOutlined,
    DashboardRounded,
    CodeRounded,
    BarChartRounded,
    ContentCopy,
} from '@mui/icons-material';

import { Env } from '@semoss/sdk/react';
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
    CardProps,
    Skeleton,
    Tooltip,
} from '@semoss/ui';

import { AppMetadata } from './app.types';
import { APP_IMAGES } from './app.images';
import { removeUnderscores } from '@/utility';
import { AppDeleteModal } from '@/components/app';
import { AddAppCloneModal } from '@/components/app/save-app/AddAppCloneModal';
import ImageSkeleton from '@/assets/img/Image_Skeleton.svg';

const StyledName = styled(Typography)(() => ({
    fontWeight: 400,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#212121',
    fontFamily: 'Inter',
    fontsize: '14px',
    fontStyle: 'normal',
    lineHeight: '143%',
    letterSpacing: '0.17px',
}));

const StyledTileCard = styled(
    React.forwardRef<HTMLDivElement, CardProps & { disabled: boolean }>(
        ({ disabled, ...props }, ref) => (
            <div ref={ref}>
                <Card {...props} />
            </div>
        ),
    ),
)<{ disabled: boolean }>(({ disabled, theme }) => ({
    minHeight: '247px',
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
    height: '77px',
});

const StyledPublishedByContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
    color: theme.palette.text.secondary,
    height: '24px',
}));

const StyledPublishedByLabel = styled(Typography)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1 0 0',
    fontSize: '12px',
    color: '#9E9E9E',
    fontFamily: 'Roboto',
    fontStyle: 'normal',
    fontWeight: '400',
    letterSpacing: '0.4px',
}));

const StyledAccessTimeIcon = styled(AccessTime)(({ theme }) => ({
    '&.MuiSvgIcon-root': {
        color: '#9E9E9E',
        height: '16px',
        width: '16px',
    },
}));

const StyledCardDescription = styled(Typography)(({ theme }) => ({
    margin: 0,
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '19.92px',
    letterSpacing: '0.4px',
    fontFamily: 'Roboto',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordWrap: 'break-word',
    color: '#666',
    height: '40px',
}));

const StyledCardHeader = styled(Card.Header)(({ theme }) => ({
    '&.MuiCardHeader-root': {
        padding: '0px',
        margin: '0px',
    },
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
}));

const ButtonName = styled('p')(({ theme }) => ({
    fontSize: '14px',
    color: '#0471F0',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '22px',
    letterSpacing: '0.46px',
}));

const ViewDetailsButtonName = styled('p')(({ theme }) => ({
    fontSize: '13px',
    color: '#0471F0',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '22px',
    letterSpacing: '0.46px',
}));

const StyledCardContent = styled(Card.Content)(({ theme }) => ({
    '&.MuiCardContent-root': {
        padding: '0px',
        margin: '0px',
        gap: '0px',
    },
}));

const StyledTagChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'maxWidth',
})<{ maxWidth?: string }>(({ theme, maxWidth = '200px' }) => ({
    maxWidth: maxWidth,
    textOverflow: 'ellipsis',
    height: '24px',
}));

const StyledCardActions = styled(Card.Actions)({
    display: 'flex',
    padding: '0px 8px 0px 11px',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    '&.MuiCardActions-root': {
        padding: '0px',
        position: 'relative',
        bottom: '8px',
    },
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
    display: 'flex',
    '&.MuiIconButton-root': {
        padding: '0px',
    },
    '&:hover': {
        backgroundColor: 'transparent',
        $icon: {
            color: 'red',
        },
    },
}));

const StyledPlaceholder = styled('div')(({ theme }) => ({
    height: '20px',
}));

const StyledMainDiv = styled('div')(({ theme }) => ({
    width: '307px',
    minHeight: '307px',
}));

const StyledSkeletonImage = styled('div')(({ theme }) => ({
    borderRadius: '4px',
    backgroundColor: '#E9EAEC',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
}));

const StyledSkeletonContent = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '8px 16px',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-start',
}));

const StyledSkeletonChip = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
}));

const StyledSkeletonDate = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexDirection: 'row',
}));

const StyledSkeletonFooter = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '8px 16px',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-start',
}));

const StyledFooter = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
}));

const StyledFooterDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    height: '30px',
    width: '123px',
    gap: '8px',
    flex: '1 0 0',
    borderRadius: '12px',
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

    /**
     * Show bookmark
     */
    isDiscoverable?: boolean;

    /**
     * Action triggered when deleted
     */
    onDelete?: () => void;

    /**
     * Whether the card is loading (shows skeleton)
     */
    isLoading?: boolean;
    /**
     * Whether to show the skeleton loader
     */
    showSkeleton?: boolean;
}

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
        isDiscoverable = false,
        onDelete,
        isLoading,
        showSkeleton,
    } = props;

    const notification = useNotification();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isAppDeleteModalOpen, setIsAppDeleteModalOpen] = useState(false);
    const [base64Image, setBase64Image] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const cardRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    const open = Boolean(anchorEl);

    const navigateApp = (appId: string) => {
        if (!appId) {
            return;
        }

        navigate(`/app/${appId}/edit`);
    };
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

    // Function to generate the API URL
    const generateProjectImageURL = (appId: string): string => {
        return Env.MODULE + '/api/project-' + appId + '/projectImage/download';
    };

    useEffect(() => {
        if (isLoading) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, []);

    // Intersection Observer to detect if card is in viewport
    useEffect(() => {
        const observer = new window.IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // console.log(entry, 'entry');
                    if (entry.isIntersecting) {
                        // console.log('Card is in view');
                        setIsInView(true);
                    }
                });
            },
            {
                threshold: 0.1, // Adjust as needed
            },
        );
        if (cardRef.current) {
            observer.observe(cardRef.current);
        }
        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, []);

    // Fetch the image when the component mounts or when the app changes
    useEffect(() => {
        if (app && app.project_id && isInView && isLoading && !hasDownloaded) {
            const fetchImage = async () => {
                try {
                    const img = new Image();
                    img.src = generateProjectImageURL(app.project_id);
                    img.crossOrigin = 'Anonymous'; // Set crossOrigin to allow CORS
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const base64String = canvas.toDataURL('image/png');
                        setBase64Image(base64String); // Store the base64 string in state
                        setLoading(false);
                        setHasDownloaded(true); // Set hasDownloaded to true after loading
                    };
                    img.onerror = function () {
                        console.error('Error loading image');
                    };
                } catch (error) {
                    console.error('Error fetching image:', error);
                }
            };
            fetchImage();
        }
    }, [app, isInView, isLoading, hasDownloaded]);

    // pretty format the data
    const createdDate = useMemo(() => {
        const d = dayjs(app.project_date_created);
        if (!d.isValid()) {
            return null;
        }

        return `Published ${d.format('MMMM D, YYYY')}`;
    }, [app.project_date_created]);
    const lastEditedDate = useMemo(() => {
        const d = dayjs(app.project_date_last_edited);
        if (!d.isValid()) {
            return null;
        }

        return `Last Edited ${d.format('MMMM D, YYYY')}`;
    }, [app.project_date_last_edited]);

    /**
     * @name findAppImage
     * @params appType
     * @returns image
     */
    const findAppImage = (appType: string) => {
        let randomInt = Math.floor(Math.random() * 5);
        if (appType == 'BI' || appType == 'TERMINAL' || appType == '') {
            randomInt = 0;
        }

        const image = APP_IMAGES[appType];

        if (!image) {
            return APP_IMAGES['INSIGHTS'][0];
        }
        // eliminating random and making it static for now
        randomInt = 0;
        return image[randomInt];
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
        } else if (appType == 'INSIGHTS') {
            return (
                <StyledPublishedByContainer>
                    <BarChartRounded />
                    <StyledPublishedByLabel variant="body2">
                        Insight App
                    </StyledPublishedByLabel>
                </StyledPublishedByContainer>
            );
        } else {
            //if no app_type is defined default to Code App
            return (
                <StyledPublishedByContainer>
                    <CodeRounded />
                    <StyledPublishedByLabel variant="body2">
                        Code App
                    </StyledPublishedByLabel>
                </StyledPublishedByContainer>
            );
        }
    };

    const image = findAppImage(appType);
    const appDetails = findAppDetails(appType);
    if (loading && showSkeleton) {
        return (
            <StyledMainDiv ref={cardRef}>
                <StyledTileCard disabled>
                    {/* Skeleton for the favorite icon */}
                    <StyledContainer>
                        <StyledOverlayContent>
                            {/* <Skeleton variant="rectangular" width="28px" height="28px" sx={{ borderRadius: '8px', background:'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)' }}/> */}
                        </StyledOverlayContent>
                    </StyledContainer>

                    {/* Skeleton for the image */}
                    <StyledSkeletonImage>
                        <Skeleton
                            variant="rectangular"
                            width="100%"
                            height="77px"
                            sx={{
                                backgroundImage: `url(${ImageSkeleton})`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                backgroundSize: 'contain',
                                position: 'relative',
                                top: '5px',
                                '&.MuiSkeleton-root': {
                                    backgroundColor: '#E9EAEC',
                                },
                            }}
                        />
                        <Skeleton
                            variant="rectangular"
                            width="28px"
                            height="28px"
                            sx={{
                                borderRadius: '8px',
                                background:
                                    'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                                position: 'absolute',
                                top: '8px',
                                right: '16px',
                            }}
                        />
                    </StyledSkeletonImage>

                    <StyledSkeletonContent>
                        {/* Skeleton for the header name */}
                        <Skeleton
                            variant="rectangular"
                            width="60%"
                            height="20px"
                            sx={{
                                borderRadius: '17.5px',
                                background:
                                    'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                            }}
                        />

                        {/* Skeleton for the description */}
                        <Skeleton
                            variant="rectangular"
                            width="80%"
                            height="12px"
                            sx={{
                                borderRadius: '17.5px',
                                background:
                                    'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                            }}
                        />
                        <Skeleton
                            variant="rectangular"
                            width="40%"
                            height="12px"
                            sx={{
                                borderRadius: '17.5px',
                                background:
                                    'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                            }}
                        />

                        {/* Skeleton for the chips */}
                        <StyledSkeletonChip>
                            <Skeleton
                                variant="rectangular"
                                width="75px"
                                height="24px"
                                sx={{
                                    borderRadius: '17.5px',
                                    background:
                                        'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                                }}
                            />
                            <Skeleton
                                variant="rectangular"
                                width="75px"
                                height="24px"
                                sx={{
                                    borderRadius: '17.5px',
                                    background:
                                        'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                                }}
                            />
                            <Skeleton
                                variant="rectangular"
                                width="75px"
                                height="24px"
                                sx={{
                                    borderRadius: '17.5px',
                                    background:
                                        'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                                }}
                            />
                        </StyledSkeletonChip>

                        {/* Skeleton for the created date */}
                        <StyledSkeletonDate>
                            <Skeleton
                                variant="rectangular"
                                width="16px"
                                height="16px"
                                sx={{
                                    borderRadius: '17.5px',
                                    background:
                                        'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                                }}
                            />
                            <Skeleton
                                variant="rectangular"
                                width="120px"
                                height="16px"
                                sx={{
                                    borderRadius: '17.5px',
                                    background:
                                        'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                                }}
                            />
                        </StyledSkeletonDate>

                        {/* Skeleton for the actions */}
                        <StyledSkeletonFooter>
                            {/* Skeleton for the Open App button */}

                            <Skeleton
                                variant="rectangular"
                                width="123px"
                                height="30px"
                                sx={{
                                    borderRadius: '17.5px',
                                    background:
                                        'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                                }}
                            />
                            <Skeleton
                                variant="rectangular"
                                width="123px"
                                height="30px"
                                sx={{
                                    borderRadius: '17.5px',
                                    background:
                                        'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                                }}
                            />

                            {/* Skeleton for the MoreVert icon */}

                            <Skeleton
                                variant="rectangular"
                                width="28px"
                                height="28px"
                                sx={{
                                    borderRadius: '8px',
                                    background:
                                        'linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, #DBDBDB 50%)',
                                }}
                            />
                        </StyledSkeletonFooter>
                    </StyledSkeletonContent>
                </StyledTileCard>
            </StyledMainDiv>
        );
    }

    return (
        <StyledMainDiv ref={cardRef}>
            <StyledTileCard disabled={!href}>
                {!systemApp && !isDiscoverable && (
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
                                )}
                            </StyledIconButton>
                        </StyledOverlayContent>
                    </StyledContainer>
                )}
                <div
                    onMouseEnter={() => setHoveredCard(app.project_id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{ position: 'relative' }}
                >
                    <Link
                        href={href}
                        rel="noopener noreferrer"
                        color="inherit"
                        underline="none"
                    >
                        {isLoading ? (
                            <StyledTileCardMedia
                                src="img"
                                image={base64Image ? base64Image : ''}
                            />
                        ) : (
                            <StyledTileCardMedia
                                src="img"
                                image={image ? image : ''}
                            />
                        )}
                        <StyledContent>
                            <StyledCardHeader
                                title={
                                    <StyledName variant={'body2'}>
                                        {removeUnderscores(app.project_name)}
                                    </StyledName>
                                }
                            />
                            <StyledCardContent>
                                <StyledCardDescription variant={'caption'}>
                                    {app.description
                                        ? app.description
                                        : 'No description available'}
                                </StyledCardDescription>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                    height={'24px'}
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
                                                                    app.tag
                                                                        .length ===
                                                                    2
                                                                        ? '100px'
                                                                        : app
                                                                              .tag
                                                                              .length ===
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
                                {createdDate && (
                                    <StyledPublishedByContainer>
                                        <StyledAccessTimeIcon />
                                        <StyledPublishedByLabel
                                            variant={'body2'}
                                        >
                                            {createdDate}
                                        </StyledPublishedByLabel>
                                    </StyledPublishedByContainer>
                                )}
                                {lastEditedDate && (
                                    <StyledPublishedByContainer>
                                        <StyledAccessTimeIcon />
                                        <StyledPublishedByLabel
                                            variant={'body2'}
                                        >
                                            {lastEditedDate}
                                        </StyledPublishedByLabel>
                                    </StyledPublishedByContainer>
                                )}
                                {systemApp && !appDetails && (
                                    <StyledPlaceholder />
                                )}
                            </StyledCardContent>
                            <StyledCardActions>
                                {!href ? (
                                    <StyledFooter>
                                        <StyledOpenButton onClick={onAction}>
                                            <StyledFooterDiv>
                                                <ButtonName>
                                                    Learn More
                                                </ButtonName>
                                                <OpenInNewOutlined
                                                    fontSize="small"
                                                    style={{ color: '#fff' }}
                                                />
                                            </StyledFooterDiv>
                                        </StyledOpenButton>
                                    </StyledFooter>
                                ) : (
                                    <StyledFooter>
                                        <StyledOpenButton
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent <Link> navigation
                                                e.stopPropagation(); // Prevent bubbling to <Link>

                                                if (href) {
                                                    window.open(
                                                        href,
                                                        '_blank',
                                                        'noopener,noreferrer',
                                                    );
                                                }
                                            }}
                                        >
                                            <StyledFooterDiv>
                                                <ButtonName>
                                                    Learn More
                                                </ButtonName>
                                                <OpenInNewOutlined
                                                    fontSize="small"
                                                    style={{ color: '#fff' }}
                                                />
                                            </StyledFooterDiv>
                                        </StyledOpenButton>
                                    </StyledFooter>
                                )}
                                {hoveredCard === app.project_id &&
                                    app.project_created_by !== 'SYSTEM' && (
                                        <Tooltip title="Copy App ID" arrow>
                                            <IconButton
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    event.preventDefault(); // prevents <Link> navigation
                                                    copyProjectId(
                                                        app.project_id,
                                                    );
                                                }}
                                                sx={{
                                                    color: 'primary.main',
                                                }}
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                            </StyledCardActions>
                        </StyledContent>
                    </Link>
                </div>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => {
                        setAnchorEl(null);
                    }}
                    anchorOrigin={{
                        vertical: 'bottom', // Anchor to the bottom of the card
                        horizontal: 'right', // Anchor to the right of the card
                    }}
                    transformOrigin={{
                        vertical: 'top', // Transform from the top of the menu
                        horizontal: 'right', // Transform from the right of the menu
                    }}
                    sx={{
                        '.MuiPopover-paper': {
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                            background: '#FFF',
                            boxShadow: '0px 5px 24px 0px rgba(0, 0, 0, 0.32)',
                        },
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
                    {app?.user_permission && app.user_permission < 2 && (
                        <Menu.Item
                            value="clone"
                            onClick={() => {
                                setIsUploadOpen(true);
                            }}
                        >
                            Clone This App
                        </Menu.Item>
                    )}
                    {app?.user_permission && app.user_permission < 2 && (
                        <Menu.Item
                            value="delete"
                            onClick={() => {
                                setIsAppDeleteModalOpen(true);
                            }}
                        >
                            Delete App
                        </Menu.Item>
                    )}
                </Menu>
                <AppDeleteModal
                    isOpen={isAppDeleteModalOpen}
                    onClose={() => {
                        setIsAppDeleteModalOpen(false);
                        setAnchorEl(null);
                    }}
                    appId={app.project_id}
                    onDelete={() => {
                        onDelete();
                    }}
                />
                {isUploadOpen ? (
                    <AddAppCloneModal
                        open={isUploadOpen}
                        appId={app.project_id}
                        handleClose={(appId) => {
                            console.log('ok');
                            // if there is an appId navigate to it
                            if (appId) {
                                navigateApp(appId);
                            }

                            // close it
                            setIsUploadOpen(false);
                        }}
                    />
                ) : null}
            </StyledTileCard>
        </StyledMainDiv>
    );
};
