import React from 'react';
import {
    Avatar,
    Box,
    ButtonGroup,
    Button,
    Card,
    Icon,
    IconButton,
    Typography,
    styled,
} from '@semoss/ui';
import { AccessTimeFilled, MoreVert } from '@mui/icons-material';
import { SEMOSS } from '@/assets/img/SEMOSS';

const StyledTileCard = styled(Card)(({ theme }) => ({
    boxShadow:
        '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',
    '&:hover': {
        cursor: 'pointer',
    },
    overflow: 'hidden',
    height: theme.spacing(25),
    display: 'flex',
    flexDirection: 'column',
}));

const StyledCardContent = styled(Card.Content)(() => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}));

const StyledCardActions = styled(Card.Actions)(() => ({
    marginTop: 'auto',
}));

const StyledTileCardActionsLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

const StyledTileCardActionsUserCount = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

export const InsightTileCard = (props) => {
    const { name, description, modifiedDate, onClick } = props;

    return (
        <StyledTileCard
            onClick={() => {
                onClick();
            }}
        >
            <Card.Header
                title={name}
                titleTypographyProps={{ variant: 'subtitle1' }}
                avatar={<SEMOSS />}
            ></Card.Header>
            <StyledCardContent sx={{ marginTop: -2 }}>
                <Typography variant="caption">
                    {description ? description : 'No description available'}
                </Typography>
            </StyledCardContent>

            <StyledCardActions>
                {/* <StyledTileCardActionsUserCount>
                    <Typography>20 Users - 2 Data Sources</Typography>
                </StyledTileCardActionsUserCount> */}
                <StyledTileCardActionsLeft>
                    <AccessTimeFilled />
                    <Typography variant="caption">
                        {modifiedDate ? modifiedDate : '7/19/2023 · 10:00AM'}
                    </Typography>
                </StyledTileCardActionsLeft>
                {/* <IconButton>
                    <MoreVert />
                </IconButton> */}
            </StyledCardActions>
        </StyledTileCard>
    );
};

export const InsightLandscapeCard = (props) => {
    return <div>Landscape</div>;
};
