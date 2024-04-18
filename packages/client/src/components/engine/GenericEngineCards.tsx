import React, { useState } from 'react';
import {
    Avatar,
    ButtonGroup,
    Card,
    Chip,
    IconButton,
    Stack,
    Typography,
    styled,
    Menu,
    useNotification,
} from '@semoss/ui';
import {
    Person,
    Star,
    StarOutlineOutlined,
    ArrowDropDown,
    ArrowDropUp,
    LockOpenRounded,
    LockRounded,
    Bookmark,
    BookmarkBorder,
    MoreVert,
} from '@mui/icons-material';
import { Env } from '@/env';
import GOOGLE from '@/assets/img/google.png';
import { ENGINE_IMAGES } from '../../pages/import/import.constants';
import BRAIN from '@/assets/img/BRAIN.png';

const StyledCardImg = styled('img')({
    display: 'flex',
    height: '20px',
    width: '20px',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',
    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
});

const StyledLandscapeCard = styled(Card)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
    boxShadow:
        '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',
    '&:hover': {
        cursor: 'pointer',
    },
    borderRadius: theme.shape.borderRadius,
    padding: '16px',
    height: '144px',
}));

const StyledLandscapeCardHeader = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    alignSelf: 'stretch',
    height: '32px',
});

const StyledLandscapeCardImg = styled(Card.Media)(({ theme }) => ({
    width: '32px',
    height: '32px',
    borderRadius: theme.shape.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
}));

const StyledLandscapeCardHeaderDiv = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: '1 0 0',
});

const StyledLandscapeCardDescriptionContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
});

const StyledLandscapeCardRow = styled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
});

const StyledLandscapeCardRowContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 0 0',
});

const StyledLandscapeCardRowDiv = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    flex: '1 0 0',
});

const StyledLandscapeCardDescription = styled(Typography)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch',
    minHeight: '24px',
    maxHeight: '24px',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    textOverflow: 'ellipsis',
    color: theme.palette.text.secondary,
}));

const StyledAvatar = styled(Avatar)({
    display: 'flex',
    width: '20px',
    height: '20px',
    padding: '8px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledPersonIcon = styled(Person)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledPublishedByLabel = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyledLeftActions = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: '1 0 0',
});

const StyledButtonGroup = styled(ButtonGroup)(() => ({}));

const StyledLockButton = styled(IconButton)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
});

const StyledTileCard = styled(Card)({
    '&:hover': {
        cursor: 'pointer',
    },
});

const StyledPlainTileCard = styled(StyledTileCard)({
    height: '100%',
});

const StyledTileCardContent = styled(Card.Content)({
    display: 'flex',
    padding: '0px 16px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
});

const StyledCardImage = styled('img')({
    display: 'flex',
    height: '134px',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',

    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    width: '100%',
    // aspectRatio: '1/1'
});

const StyledDbName = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: '1 0 0',
    alignSelf: 'stretch',
});

const StyledPublishedByContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
});

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

const UnstyledVoteCount = styled(ButtonGroup.Item)(() => ({
    '&:hover': {
        backgroundColor: 'transparent',
        borderColor: 'rgba(0, 0, 0, 0.54)',
    },
}));

const StyledCardIconsDiv = styled('div')({
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
    flex: '1',
});

/**
 * @name formatDBName
 * @param str
 * @returns formatted db name
 */
const formatDBName = (str: string) => {
    let i;
    const frags = str.split('_');
    for (i = 0; i < frags.length; i++) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
};

/**
 * @name findDBImage
 * @params appType & appSubType
 * @returns image link for associated engine
 */
const findDBImage = (appType: string, appSubType: string) => {
    const obj = ENGINE_IMAGES[appType].find((ele) => ele.name == appSubType);

    if (!obj) {
        console.warn('No image found:', appType, appSubType);
        return BRAIN;
    }

    return obj.icon;
};

interface DatabaseCardProps {
    /** Name of the Database */
    name: string;

    /** ID of Database */
    id: string;

    /** Owner of the Database */
    owner: string;

    /** Description of the Database */
    description: string;

    /** Tag of the Database */
    tag?: string[] | string;

    /** Database type */
    type?: string;

    /** Subtype for Icon */
    sub_type?: string;

    /** Whether or not the database is viewable by everyone */
    isGlobal?: boolean;

    isFavorite?: boolean;

    isUpvoted?: boolean;

    votes?: string;

    views?: string;

    trending?: string;

    onClick?: (value: string) => void;

    favorite?: (value: boolean) => void;

    upvote?: (value: boolean) => void;

    global?: (value) => void;
}

export const EngineLandscapeCard = (props: DatabaseCardProps) => {
    const {
        name,
        id,
        description,
        tag,
        isGlobal,
        isFavorite,
        isUpvoted,
        type,
        sub_type,
        owner = 'N/A',
        votes = '0',
        // views = 'N/A',
        // trending = 'N/A',
        onClick,
        favorite,
        upvote,
        global,
    } = props;

    /** Menu toggle state */
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const notification = useNotification();

    const copyId = (id: string) => {
        try {
            navigator.clipboard.writeText(id);

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

    return (
        <StyledLandscapeCard onClick={() => onClick(id)}>
            <StyledLandscapeCardHeader>
                <StyledLandscapeCardImg
                    src="img"
                    image={findDBImage(type, sub_type)}
                />
                <StyledLandscapeCardHeaderDiv>
                    <Typography variant={'body1'}>
                        <Typography variant={'body1'}>
                            {formatDBName(name)}
                        </Typography>
                        {sub_type === 'EMBEDDED' ? (
                            <StyledCardImg src={GOOGLE}></StyledCardImg>
                        ) : null}
                    </Typography>
                    <StyledCardIconsDiv>
                        <IconButton
                            size={'small'}
                            title={
                                isFavorite
                                    ? `Unbookmark ${name ? name : id}`
                                    : `Bookmark ${name ? name : id}`
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
                        </IconButton>
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                setAnchorEl(e.currentTarget);
                            }}
                        >
                            <MoreVert />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={() => {
                                setAnchorEl(null);
                            }}
                        >
                            <Menu.Item
                                value="copy"
                                onClick={(event: React.MouseEvent) => {
                                    copyId(id);
                                    setAnchorEl(null);
                                    event.stopPropagation();
                                }}
                            >
                                Copy ID
                            </Menu.Item>
                        </Menu>
                    </StyledCardIconsDiv>
                </StyledLandscapeCardHeaderDiv>
            </StyledLandscapeCardHeader>
            <StyledLandscapeCardDescriptionContainer>
                <StyledLandscapeCardRow>
                    <StyledLandscapeCardRowContainer>
                        <StyledLandscapeCardRowDiv>
                            <StyledLandscapeCardDescription variant={'body2'}>
                                {description
                                    ? description
                                    : 'No description available'}
                            </StyledLandscapeCardDescription>
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                                minHeight="32px"
                            >
                                {tag !== undefined &&
                                    (Array.isArray(tag) ? (
                                        <>
                                            {tag.map((t, i) => {
                                                if (i <= 2) {
                                                    return (
                                                        <StyledTagChip
                                                            maxWidth={
                                                                tag.length === 2
                                                                    ? '100px'
                                                                    : tag.length ===
                                                                      1
                                                                    ? '200px'
                                                                    : '75px'
                                                            }
                                                            key={`${id}${i}`}
                                                            label={t}
                                                        />
                                                    );
                                                }
                                            })}
                                            {tag.length > 3 ? (
                                                <Typography variant="caption">
                                                    +{tag.length - 3}
                                                </Typography>
                                            ) : (
                                                <></>
                                            )}
                                        </>
                                    ) : (
                                        <StyledTagChip
                                            key={`${id}0`}
                                            label={tag}
                                        />
                                    ))}
                            </Stack>
                        </StyledLandscapeCardRowDiv>
                    </StyledLandscapeCardRowContainer>
                </StyledLandscapeCardRow>
            </StyledLandscapeCardDescriptionContainer>
        </StyledLandscapeCard>
    );
};

export const EngineTileCard = (props: DatabaseCardProps) => {
    const {
        name,
        id,
        description,
        tag,
        isGlobal,
        isFavorite,
        sub_type,
        isUpvoted,
        owner = 'N/A',
        votes = '0',
        // views = 'N/A',
        // trending = 'N/A',
        onClick,
        favorite,
        upvote,
        global,
    } = props;

    return (
        <StyledTileCard onClick={() => onClick(id)}>
            {/* Use Card.Media instead, uses img tag */}
            <Card.Media
                src="img"
                image={`${Env.MODULE}/api/e-${id}/image/download`}
            />
            <StyledCardImage
                src={`${Env.MODULE}/api/e-${id}/image/download`}
                sx={{ height: '134px' }}
            />
            <Card.Header
                title={
                    name ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '8px',
                            }}
                        >
                            <Typography variant={'body1'}>
                                {formatDBName(name)}
                            </Typography>
                            {sub_type === 'VERTEX' ? (
                                <StyledCardImg src={GOOGLE}></StyledCardImg>
                            ) : null}
                        </div>
                    ) : (
                        id
                    )
                }
                subheader={
                    <StyledPublishedByContainer>
                        <StyledAvatar>
                            <StyledPersonIcon />
                        </StyledAvatar>
                        <StyledPublishedByLabel variant={'caption'}>
                            Published by: {owner}
                        </StyledPublishedByLabel>
                    </StyledPublishedByContainer>
                }
                action={
                    <IconButton
                        title={
                            isFavorite
                                ? `Unbookmark ${name ? name : id}`
                                : `Bookmark ${name ? name : id}`
                        }
                        onClick={(e) => {
                            e.stopPropagation();
                            favorite(isFavorite);
                        }}
                        aria-label={
                            isFavorite
                                ? `Unfavorite ${name ? name : id}`
                                : `Favorite ${name ? name : id}`
                        }
                    >
                        {isFavorite ? <Star /> : <StarOutlineOutlined />}
                    </IconButton>
                }
            />
            <Card.Content>
                <StyledCardDescription variant={'body2'}>
                    {description ? description : 'No description available'}
                </StyledCardDescription>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    minHeight="32px"
                >
                    {tag !== undefined &&
                        (Array.isArray(tag) ? (
                            <>
                                {tag.map((t, i) => {
                                    if (i <= 2) {
                                        return (
                                            <StyledTagChip
                                                maxWidth={
                                                    tag.length === 2
                                                        ? '100px'
                                                        : tag.length === 1
                                                        ? '200px'
                                                        : '75px'
                                                }
                                                key={`${id}${i}`}
                                                label={t}
                                            />
                                        );
                                    }
                                })}
                                {tag.length > 3 ? (
                                    <Typography variant="caption">
                                        +{tag.length - 3}
                                    </Typography>
                                ) : (
                                    <></>
                                )}
                            </>
                        ) : (
                            <StyledTagChip key={`${id}0`} label={tag} />
                        ))}
                </Stack>
            </Card.Content>
            <Card.Actions>
                <StyledLeftActions>
                    <StyledButtonGroup
                        size="small"
                        variant={'outlined'}
                        color="secondary"
                    >
                        <ButtonGroup.Item
                            sx={{
                                borderColor: 'rgba(0, 0, 0, 0.54)',
                                color: 'rgba(0, 0, 0, 0.60)',
                            }}
                            title={
                                isUpvoted
                                    ? `Downvote ${name ? name : id}`
                                    : `Upvote ${name ? name : id}`
                            }
                            onClick={(e) => {
                                e.stopPropagation();
                                upvote(isUpvoted);
                            }}
                            aria-label={
                                isUpvoted
                                    ? `Downvote ${name ? name : id}`
                                    : `Upvote ${name ? name : id}`
                            }
                        >
                            {isUpvoted ? <ArrowDropDown /> : <ArrowDropUp />}
                        </ButtonGroup.Item>
                        <UnstyledVoteCount
                            sx={{
                                borderColor: 'rgba(0, 0, 0, 0.54)',
                                color: 'rgba(0, 0, 0, 0.60)',
                            }}
                        >
                            {votes}
                        </UnstyledVoteCount>
                    </StyledButtonGroup>
                    {/* <StyledViewsTrendingDiv>
                        <StyledEyeIcon />
                        <StyledStatisticCaption variant="caption">
                            {views}
                        </StyledStatisticCaption>
                    </StyledViewsTrendingDiv>
                    <StyledViewsTrendingDiv>
                        <StyledTrendingIcon />
                        <StyledStatisticCaption variant="caption">
                            {trending}
                        </StyledStatisticCaption>
                    </StyledViewsTrendingDiv> */}
                </StyledLeftActions>
                <StyledLockButton
                    title={
                        isGlobal
                            ? `Make ${name ? name : id} private`
                            : `Make ${name ? name : id} public`
                    }
                    disabled={!global}
                    onClick={(e) => {
                        e.stopPropagation();
                        global(isGlobal);
                    }}
                    aria-label={
                        isGlobal
                            ? `Make ${name ? name : id} private`
                            : `Make ${name ? name : id} public`
                    }
                >
                    {isGlobal ? <LockOpenRounded /> : <LockRounded />}
                </StyledLockButton>
            </Card.Actions>
        </StyledTileCard>
    );
};

export interface PlainEngineCardProps {
    /** Name of the Database */
    name: string;

    onClick: () => void;
}

export const PlainEngineCard = (props) => {
    const { id, name, onClick } = props;
    return (
        <StyledPlainTileCard onClick={onClick}>
            <Card.Media
                src="img"
                image={`${Env.MODULE}/api/e-${id}/image/download`}
            />
            <StyledCardImage
                src={`${Env.MODULE}/api/e-${id}/image/download`}
                sx={{ height: '134px' }}
            />
            <StyledTileCardContent sx={{ marginTop: '8px' }}>
                <StyledDbName variant={'body1'}>
                    {name ? formatDBName(name) : id}
                </StyledDbName>
            </StyledTileCardContent>
        </StyledPlainTileCard>
    );
};
