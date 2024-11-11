import { TextEditorCodeGeneration } from '../../common';
import { Link } from 'react-router-dom';

import { Typography, Container, styled } from '@semoss/ui';

const StyledHeaderContainer = styled(Container)(({ theme }) => ({
    gap: theme.spacing(2),
    flexDirection: 'column',
    display: 'flex',
}));

const StyledEmptyFiles = styled('div')(({ theme }) => ({
    padding: theme.spacing(5),
    justifyContent: 'space-around',
    alignItems: 'normal',
    textAlign: 'left',
    flexDirection: 'column',
    display: 'flex',
    height: '100%',
    width: '100%',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    textAlign: 'left',
    display: 'block',
}));

const StyledContainer = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
}));

export const EmptyFilePanel = () => {
    return (
        <StyledContainer>
            <StyledEmptyFiles>
                <StyledHeaderContainer>
                    <div>
                        <StyledTypography variant="h5">
                            Welcome to the Code Editor
                        </StyledTypography>
                        <StyledTypography variant="body1">
                            Get started by selecting a file{' '}
                            {process.env.NODE_ENV == 'development' && 'or'}
                        </StyledTypography>
                    </div>
                    {process.env.NODE_ENV == 'development' && (
                        <div>
                            <TextEditorCodeGeneration />
                        </div>
                    )}
                </StyledHeaderContainer>
                <Container>
                    <Typography variant="h6">Github Documentation</Typography>
                    <ul>
                        <li>
                            <Link to={'#'}>Code Editor</Link>
                        </li>
                    </ul>
                </Container>
            </StyledEmptyFiles>
        </StyledContainer>
    );
};
