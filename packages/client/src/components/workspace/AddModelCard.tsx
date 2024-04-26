import { Add } from '@mui/icons-material';
import { styled, Card, IconButton, Typography } from '@semoss/ui';

const StyledCard = styled(Card)(({ theme }) => ({
    width: '362px',
    height: '116px',
    display: 'flex',
    justifyContent: 'center',
}));

const StyledContent = styled(Card.Content)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    ':last-child': {
        paddingBottom: 0,
    },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: theme.palette.primary.selected,
    '&:hover': {
        backgroundColor: theme.palette.primary.selected,
    },
}));

export const AddModelCard = () => {
    return (
        <StyledCard>
            <StyledContent>
                <StyledIconButton color="primary">
                    <Add color="inherit" />
                </StyledIconButton>
                <Typography variant="body2" color="primary">
                    Add Model
                </Typography>
            </StyledContent>
        </StyledCard>
    );
};
