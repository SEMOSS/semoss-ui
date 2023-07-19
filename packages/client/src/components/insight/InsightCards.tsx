import React from 'react';
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
} from '@semoss/ui';
import { AccessTimeFilled, MoreVert } from '@mui/icons-material';
import { SEMOSS } from '@/assets/img/SEMOSS';

const StyledTileCard = styled(Card)({
    display: 'flex',
    padding: '16px 0px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    flex: '1 0 0',
    boxShadow:
        '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',
    '&:hover': {
        cursor: 'pointer',
    },
});

const StyledTileCardHeader = styled('div')({
    gap: '10px',
    display: 'flex',
    height: '62px',
    padding: '16px',
    alignItems: 'center',
    alignSelf: 'stretch',
});

const StyledTileTitleContainer = styled('div')({
    gap: '4px',
    width: '106px',
    display: 'flex',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
});

const StyledCardDescription = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch',
    width: '100%',
    minHeight: '60px',
    maxHeight: '60px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

const StyledTileCardContent = styled(Card.Content)({
    display: 'flex',
    gap: '4px',
    padding: '0px 16px',
    flexDirection: 'column',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
});

const StyledTileCardRowsContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
});

const StyledTileCardRowsDiv = styled('div')({
    gap: '8px',
    flex: '1 0 0',
    display: 'flex',
    alignItems: 'center',
});

const StyledTileCardRows = styled('div')({
    gap: '8px',
    flex: '1 0 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledTileCardActionsContainer = styled(Card.Actions)({
    gap: '4px',
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: '0px 8px 0px 16px',
});

const StyledTileCardActionsLeft = styled('div')({
    gap: '4px',
    flex: '1 0 0',
    display: 'flex',
    alignItems: 'center',
});

export const InsightTileCard = (props) => {
    const { name, description, modifiedDate, onClick } = props;

    return (
        <StyledTileCard
            onClick={() => {
                onClick();
            }}
        >
            <StyledTileCardHeader>
                <SEMOSS />
                <StyledTileTitleContainer>
                    <Typography variant="body1">{name}</Typography>
                </StyledTileTitleContainer>
            </StyledTileCardHeader>
            <StyledCardDescription variant={'body2'}>
                {description ? description : 'No description available'}
            </StyledCardDescription>
            <StyledTileCardActionsContainer>
                <StyledTileCardActionsLeft>
                    <AccessTimeFilled />
                    <Typography variant="caption">{modifiedDate}</Typography>
                </StyledTileCardActionsLeft>
                {/* <IconButton>
                    <MoreVert />
                </IconButton> */}
            </StyledTileCardActionsContainer>
        </StyledTileCard>
    );
};

export const InsightLandscapeCard = (props) => {
    return <div>Landscape</div>;
};
