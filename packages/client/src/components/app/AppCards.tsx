import {
    Avatar,
    Box,
    ButtonGroup,
    Button,
    Card,
    Chip,
    Icon,
    IconButton,
    Typography,
    styled,
} from '@/component-library';

import { AccessTimeFilled, MoreVert } from '@mui/icons-material';

import { Folder } from '@/assets/img/Folder';

const StyledTileCard = styled(Card)(({ theme }) => ({
    boxShadow:
        '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',
    '&:hover': {
        cursor: 'pointer',
    },
    overflow: 'hidden',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '0px, 16px, 0px, 16px',
}));

const StyledCardContent = styled(Card.Content)(() => ({
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '350px',
}));

const StyledCardActions = styled(Card.Actions)(() => ({}));

const StyledTileCardActionsLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

export const ProjectLandscapeCard = (props) => {
    return <div>Landscape</div>;
};

export const ProjectTileCard = (props) => {
    const { name, id, description, modifiedDate, onClick } = props;

    return (
        <StyledTileCard onClick={() => onClick(id)}>
            <Card.Header
                title={name}
                titleTypographyProps={{ variant: 'subtitle1' }}
                avatar={<Folder />}
            ></Card.Header>
            <StyledCardContent>
                <Typography variant="caption">
                    {description ? description : 'No description available'}
                </Typography>
            </StyledCardContent>
            {/* <StyledCardActions>
                <StyledTileCardActionsUserCount>
                    <Typography>20 Users · 2 Data Sources</Typography>
                </StyledTileCardActionsUserCount>
                <StyledTileCardActionsLeft>
                    <AccessTimeFilled />
                    <Typography variant="caption">
                        {modifiedDate ? modifiedDate : '7/19/2023 · 10:00AM'}
                    </Typography>
                </StyledTileCardActionsLeft>
                <IconButton>
                    <MoreVert />
                </IconButton>
            </StyledCardActions> */}
        </StyledTileCard>
    );
};
