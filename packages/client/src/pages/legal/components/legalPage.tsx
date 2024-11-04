import { styled } from '@semoss/ui';

const StyledPage = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: `${theme.spacing(7)} ${theme.spacing(5)}`,
}));

const StyledBody = styled('div')(({ theme }) => ({
    width: '100%',
    maxWidth: '1800px',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(3),
}));

export const LegalPage = ({ children }) => {
    return (
        <StyledPage>
            <StyledBody>{children}</StyledBody>
        </StyledPage>
    );
};
