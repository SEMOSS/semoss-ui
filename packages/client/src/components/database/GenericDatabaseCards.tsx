import {
    Avatar,
    ButtonGroup,
    Button,
    Card,
    Chip,
    Icon,
    IconButton,
    Typography,
    styled,
} from '@semoss/ui';

import {
    Person,
    Visibility,
    ShowChart,
    FolderOpen,
    Star,
    StarOutlineOutlined,
    ArrowDropDown,
    ArrowDropUp,
    LockOpenRounded,
    LockRounded,
} from '@mui/icons-material';

import defaultDBImage from '../../assets/img/placeholder.png';
import { formatName } from '@/utils';

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
    overflow: 'hidden',
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
    alignItems: 'flex-start',
    gap: '4px',
});

const StyledButtonGroup = styled(ButtonGroup)({
    // borderRadius: '8px',
    // border: '1px solid rgba(0, 0, 0, 0.23)'
});

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
    height: '118px',
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

const StyledCardCategory = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
});

const StyledCategoryIcon = styled(FolderOpen)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledCategoryLabel = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyledPublishedByContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
});

const StyledCardDescriptionContainer = styled('div')({
    height: '60px',
    width: '100%',
    overflow: 'hidden',
    // border: 'solid yellow',
});

const StyledCardDescription = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch',
    minHeight: '60px',
    maxHeight: '60px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    // width: '90%',
    // border: 'solid blue',
});

const StyledChipDiv = styled('div')({
    display: 'flex',
    gap: '4px',
    minHeight: '32px',
});

const StyledStatisticCaption = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.main,
}));

const UnstyledVoteCount = styled(ButtonGroup.Item)(({ theme }) => ({
    '&:hover': {
        backgroundColor: 'transparent',
    },
}));

interface DatabaseCardProps {
    /** Name of the Database */
    name: string;

    /** ID of Database */
    id: string;

    /** Owner of the Database */
    owner: string;

    /** Description of the Database */
    description: string;

    /** Image of the Database */
    image?: string;

    /** Tag of the Database */
    tag?: string[] | string;

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

export const DatabaseLandscapeCard = (props: DatabaseCardProps) => {
    const {
        name,
        id,
        description,
        image = defaultDBImage,
        tag,
        isGlobal,
        isFavorite,
        isUpvoted,
        owner = 'N/A',
        votes = '0',
        views = 'N/A',
        trending = 'N/A',
        onClick,
        favorite,
        upvote,
        global,
    } = props;

    return (
        <StyledLandscapeCard onClick={() => onClick(id)}>
            <StyledLandscapeCardHeader>
                <StyledLandscapeCardImg
                    src={`${process.env.MODULE}/api/app-${id}/appImage/download`}
                    // src={image}
                />
                <StyledLandscapeCardHeaderDiv>
                    <StyledLandscapeCardTitleDiv>
                        <Typography variant={'body1'}>
                            {formatName(name)}
                        </Typography>
                        <IconButton
                            size={'small'}
                            title={
                                isFavorite
                                    ? `Unfavorite ${name}`
                                    : `Favorite ${name}`
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
                            color={'secondary'}
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
                            <StyledChipDiv>
                                {tag !== undefined &&
                                    (typeof tag === 'object' ? (
                                        tag.map((t, i) => {
                                            return (
                                                <Chip
                                                    key={id + i}
                                                    variant={'outlined'}
                                                    label={t}
                                                />
                                            );
                                        })
                                    ) : (
                                        <Chip
                                            key={id + tag}
                                            variant={'outlined'}
                                            label={tag}
                                        />
                                    ))}
                            </StyledChipDiv>
                        </StyledLandscapeCardRowDiv>
                    </StyledLandscapeCardRowContainer>
                </StyledLandscapeCardRow>
            </StyledLandscapeCardDescriptionContainer>
            <StyledTileCardActions>
                <StyledLeftActions>
                    <ButtonGroup size="sm" color="secondary">
                        <ButtonGroup.Item
                            title={
                                isUpvoted
                                    ? `Downvote ${name}`
                                    : `Upvote ${name}`
                            }
                            onClick={(e) => {
                                e.stopPropagation();
                                upvote(isUpvoted);
                            }}
                        >
                            {isUpvoted ? <ArrowDropDown /> : <ArrowDropUp />}
                        </ButtonGroup.Item>
                        <UnstyledVoteCount>{votes}</UnstyledVoteCount>
                    </ButtonGroup>
                    <StyledViewsTrendingDiv>
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
                    </StyledViewsTrendingDiv>
                </StyledLeftActions>
                <StyledLockButton
                    title={
                        isGlobal
                            ? `Make ${name} private`
                            : `Make ${name} public`
                    }
                    onClick={(e) => {
                        e.stopPropagation();

                        global(isGlobal);
                    }}
                >
                    {isGlobal ? <LockOpenRounded /> : <LockRounded />}
                </StyledLockButton>
            </StyledTileCardActions>
        </StyledLandscapeCard>
    );
};

export const DatabaseTileCard = (props: DatabaseCardProps) => {
    const {
        name,
        id,
        description,
        image = defaultDBImage,
        tag,
        isGlobal,
        isFavorite,
        isUpvoted,
        owner = 'N/A',
        votes = '0',
        views = 'N/A',
        trending = 'N/A',
        onClick,
        favorite,
        upvote,
        global,
    } = props;

    return (
        <StyledTileCard onClick={() => onClick(id)}>
            {/* Use Card.Media instead, uses img tag */}
            <StyledCardImage
                src={`${process.env.MODULE}/api/app-${id}/appImage/download`}
                sx={{ height: '118px' }}
            />
            <Card.Header
                title={formatName(name)}
                subheader={
                    <StyledPublishedByContainer>
                        <StyledAvatar>
                            <StyledPersonIcon />
                        </StyledAvatar>
                        <StyledPublishedByLabel variant={'caption'}>
                            Publishes by: {owner}
                        </StyledPublishedByLabel>
                    </StyledPublishedByContainer>
                }
                action={
                    <IconButton
                        title={
                            isFavorite
                                ? `Unfavorite ${name}`
                                : `Favorite ${name}`
                        }
                        onClick={(e) => {
                            e.stopPropagation();
                            favorite(isFavorite);
                        }}
                    >
                        {isFavorite ? <Star /> : <StarOutlineOutlined />}
                    </IconButton>
                }
            />
            <Card.Content>
                <StyledCardDescription variant={'body2'}>
                    {description ? description : 'N description available'}
                </StyledCardDescription>
                <StyledChipDiv>
                    {tag !== undefined &&
                        (typeof tag === 'object' ? (
                            tag.map((t, i) => {
                                return (
                                    <Chip
                                        key={id + i}
                                        variant={'outlined'}
                                        label={t}
                                    />
                                );
                            })
                        ) : (
                            <Chip
                                key={id + tag}
                                variant={'outlined'}
                                label={tag}
                            />
                        ))}
                </StyledChipDiv>
            </Card.Content>
            <Card.Actions>
                <StyledLeftActions>
                    <StyledButtonGroup size="sm" color="secondary">
                        <ButtonGroup.Item
                            title={
                                isUpvoted
                                    ? `Downvote ${name}`
                                    : `Upvote ${name}`
                            }
                            onClick={(e) => {
                                e.stopPropagation();
                                upvote(isUpvoted);
                            }}
                        >
                            {isUpvoted ? <ArrowDropDown /> : <ArrowDropUp />}
                        </ButtonGroup.Item>
                        <UnstyledVoteCount>{votes}</UnstyledVoteCount>
                    </StyledButtonGroup>
                    <StyledViewsTrendingDiv>
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
                    </StyledViewsTrendingDiv>
                </StyledLeftActions>
                <StyledLockButton
                    title={
                        isGlobal
                            ? `Make ${name} private`
                            : `Make ${name} public`
                    }
                    onClick={(e) => {
                        e.stopPropagation();
                        global(isGlobal);
                    }}
                >
                    {isGlobal ? <LockOpenRounded /> : <LockRounded />}
                </StyledLockButton>
            </Card.Actions>
        </StyledTileCard>
    );
};

export interface PlainDatabaseCardProps {
    /** Name of the Database */
    name: string;
    /** Image of the Database */
    image?: string;

    onClick: () => void;
}

export const PlainDatabaseCard = (props) => {
    const { id, name, image = defaultDBImage, onClick } = props;
    return (
        <StyledPlainTileCard onClick={onClick}>
            <StyledCardImage
                // src={image}
                src={`${process.env.MODULE}/api/app-${id}/appImage/download`}
                sx={{ height: '118px' }}
            />
            <StyledTileCardContent>
                <StyledCardRows>
                    <StyledCardRowsDiv>
                        <StyledCardContainer>
                            <StyledCardHeader>
                                <StyledDbName variant={'body1'}>
                                    {formatName(name)}
                                </StyledDbName>
                            </StyledCardHeader>
                        </StyledCardContainer>
                    </StyledCardRowsDiv>
                </StyledCardRows>
            </StyledTileCardContent>
        </StyledPlainTileCard>
    );
};
