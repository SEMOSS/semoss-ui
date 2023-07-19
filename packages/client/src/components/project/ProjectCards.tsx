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

const StyledTileCard = styled(Card)({
    display: 'flex',
    padding: '16px 0px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    flex: '1 0 0',

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

export const ProjectLandscapeCard = (props) => {
    return <div>Landscape</div>;
};

export const ProjectTileCard = (props) => {
    const { name, id, description, onClick } = props;

    return (
        <StyledTileCard onClick={() => onClick(id)}>
            <StyledTileCardHeader>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="36"
                    viewBox="0 0 40 36"
                    fill="none"
                >
                    <path
                        d="M0 6.4C0 4.15979 0 3.03968 0.440378 2.18404C0.827745 1.43139 1.44585 0.819467 2.2061 0.435974C3.07039 0 4.20181 0 6.46465 0H14.1864C15.6368 0 16.3619 0 17.0022 0.218619C17.5683 0.411948 18.084 0.727461 18.5119 1.14233C18.9957 1.61146 19.32 2.25359 19.9686 3.53783L22.2222 8H0V6.4Z"
                        fill="#8340DE"
                    />
                    <path
                        opacity="0.3"
                        d="M0 8H30.4C33.7603 8 35.4405 8 36.7239 8.65396C37.8529 9.2292 38.7708 10.1471 39.346 11.2761C40 12.5595 40 14.2397 40 17.6V26.4C40 29.7603 40 31.4405 39.346 32.7239C38.7708 33.8529 37.8529 34.7708 36.7239 35.346C35.4405 36 33.7603 36 30.4 36H9.6C6.23969 36 4.55953 36 3.27606 35.346C2.14708 34.7708 1.2292 33.8529 0.653961 32.7239C0 31.4405 0 29.7603 0 26.4V8Z"
                        fill="#8340DE"
                    />
                </svg>
                <StyledTileTitleContainer>
                    <Typography variant="body1">{name}</Typography>
                </StyledTileTitleContainer>
            </StyledTileCardHeader>
            {/* <StyledTileCardContent>
                <StyledTileCardRowsContainer>
                    <StyledTileCardRowsDiv>
                        <StyledTileCardRows>
                            <Typography variant="body2">
                                {description}
                            </Typography>
                        </StyledTileCardRows>
                    </StyledTileCardRowsDiv>
                </StyledTileCardRowsContainer>
                <Box>
                    <Box>
                        <Typography variant="body2">
                            {' '}
                            20 Users · 10 Insights
                        </Typography>
                    </Box>
                </Box>
            </StyledTileCardContent>
            <StyledTileCardActionsContainer>
                <StyledTileCardActionsLeft>
                    <AccessTimeFilled color={'secondary'} />
                    <Typography variant="caption">date</Typography>
                </StyledTileCardActionsLeft>
                <IconButton>
                    <MoreVert />
                </IconButton>
            </StyledTileCardActionsContainer> */}
        </StyledTileCard>
    );
};
