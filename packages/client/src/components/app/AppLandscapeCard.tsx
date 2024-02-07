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
} from '@/component-library';
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

const StyledCard = styled(Card)({
    width: '100%',
    height: '176px',
    display: 'flex',
    flexDirection: 'row',
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

const StyledCardMedia = styled(Card.Media)({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',

    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    height: '176px',
    width: '272.388px',
});

const StyledCardImage = styled('img')({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',

    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    height: '100%',
    width: '272.388px',
    // aspectRatio: '1/1'
});

const StyledCardContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(4),
}));

const StyledCardContentLeft = styled('div')(({ theme }) => ({
    width: '584px',
    display: 'flex',
    flexDirection: 'column',
}));

const StyledCardContentRight = styled('div')(({ theme }) => ({
    width: '134px',
    display: 'flex',
    flexDirection: 'column',
}));

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

    // pretty format the data
    const createdDate = useMemo(() => {
        const d = dayjs(app.project_date_created);
        if (!d.isValid()) {
            return 'N/A';
        }

        return `Created on ${d.format('MMMM D, YYYY')}`;
    }, [app.project_date_created]);

    return (
        <StyledCard>
            <Link
                href={href}
                rel="noopener noreferrer"
                color="inherit"
                underline="none"
            >
                {image ? (
                    <StyledCardMedia image={image} />
                ) : (
                    <StyledCardImage
                        src={`${Env.MODULE}/api/project-${app.project_id}/projectImage/download`}
                    />
                )}
                <StyledCardContent>
                    <StyledCardContentLeft>Left</StyledCardContentLeft>
                    <StyledCardContentRight>Right</StyledCardContentRight>
                </StyledCardContent>
            </Link>
        </StyledCard>
    );
};
