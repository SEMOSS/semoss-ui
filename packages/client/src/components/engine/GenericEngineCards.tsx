import {
    Avatar,
    ButtonGroup,
    Card,
    Chip,
    IconButton,
    Stack,
    Typography,
    styled,
} from '@semoss/ui';

import {
    Person,
    Visibility,
    ShowChart,
    Star,
    StarOutlineOutlined,
    ArrowDropDown,
    ArrowDropUp,
    LockOpenRounded,
    LockRounded,
} from '@mui/icons-material';

import { Env } from '@/env';
import defaultDbImage from '../../assets/img/placeholder.png';
import { formatName } from '@/utils';
import GOOGLE from '@/assets/img/google.png';

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

const StyledLandscapeCard = styled(Card)({
    display: 'flex',
    paddingBottom: '8px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    boxShadow:
        '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',

    '&:hover': {
        cursor: 'pointer',
    },
});

const StyledLandscapeCardHeader = styled('div')({
    display: 'flex',
    padding: '16px',
    alignItems: 'center',
    gap: '10px',
    alignSelf: 'stretch',
});

const StyledLandscapeCardImg = styled('img')(({ theme }) => ({
    display: 'flex',
    width: '60px',
    height: '60px',
    borderRadius: theme.shape.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
}));

const StyledLandscapeCardHeaderDiv = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    flex: '1 0 0',
});

const StyledLandscapeCardTitleDiv = styled('div')({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '4px',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
});

const StyledLandscapeCardPublishedDiv = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
});

const StyledLandscapeCardDescriptionContainer = styled('div')({
    display: 'flex',
    padding: '0px 16px',
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

const StyledLandscapeCardDescription = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch',
    minHeight: '60px',
    maxHeight: '60px',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    textOverflow: 'ellipsis',
});

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

const StyledTileCardActions = styled(Card.Actions)({
    display: 'flex',
    padding: '0px 8px 0px 16px',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
});

const StyledLeftActions = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: '1 0 0',
});

const StyledViewsTrendingDiv = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
});

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({}));

const StyledButtonGroupItem = styled(ButtonGroup.Item)({});

const StyledEyeIcon = styled(Visibility)({
    display: 'flex',
    alignItems: 'flex-start',
    // Needs to reference theme grey
    color: 'rgba(0, 0, 0, 0.54)',
});

const StyledTrendingIcon = styled(ShowChart)({
    display: 'flex',
    alignItems: 'flex-start',
    // Needs to reference theme grey
    color: 'rgba(0, 0, 0, 0.54)',
});

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

const StyledCardRows = styled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
});

const StyledCardRowsDiv = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 0 0',
});

const StyledCardContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
    alignItems: 'flex-start',
    // border: 'solid red',
    gap: '8px',
    flex: '1 0 0',
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

const StyledCardHeader = styled('div')({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '4px',
    alignSelf: 'stretch',
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
})<{ maxWidth?: string }>(({ maxWidth = '200px' }) => ({
    maxWidth: maxWidth,
    textOverflow: 'ellipsis',
}));

const UnstyledVoteCount = styled(ButtonGroup.Item)(({ theme }) => ({
    '&:hover': {
        backgroundColor: 'transparent',
        borderColor: 'rgba(0, 0, 0, 0.54)',
    },
}));

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

    return (
        <StyledLandscapeCard onClick={() => onClick(id)}>
            <StyledLandscapeCardHeader>
                <StyledLandscapeCardImg
                    src={`${Env.MODULE}/api/e-${id}/image/download`}
                />
                <StyledLandscapeCardHeaderDiv>
                    <StyledLandscapeCardTitleDiv>
                        <Typography variant={'body1'}>
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
                                {sub_type === 'EMBEDDED' ? (
                                    <StyledCardImg src={GOOGLE}></StyledCardImg>
                                ) : null}
                            </div>
                        </Typography>
                        <IconButton
                            size={'small'}
                            title={
                                isFavorite
                                    ? `Unfavorite ${name ? name : id}`
                                    : `Favorite ${name ? name : id}`
                            }
                            onClick={(e) => {
                                e.stopPropagation();

                                favorite(isFavorite);
                            }}
                        >
                            {isFavorite ? <Star /> : <StarOutlineOutlined />}{' '}
                        </IconButton>
                    </StyledLandscapeCardTitleDiv>

                    <StyledLandscapeCardPublishedDiv>
                        <StyledAvatar>
                            <StyledPersonIcon />
                        </StyledAvatar>
                        <StyledPublishedByLabel
                            sx={{ color: 'rgba(0, 0, 0, 0.6)' }}
                            variant={'caption'}
                        >
                            Published by: {owner}
                        </StyledPublishedByLabel>
                    </StyledLandscapeCardPublishedDiv>
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
            <StyledTileCardActions>
                <StyledLeftActions>
                    <ButtonGroup size="small" color="secondary">
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
                    </ButtonGroup>
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
                    disabled={!global}
                    title={
                        isGlobal
                            ? `Make ${name ? name : id} private`
                            : `Make ${name ? name : id} public`
                    }
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
            </StyledTileCardActions>
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
                                ? `Unfavorite ${name ? name : id}`
                                : `Favorite ${name ? name : id}`
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
